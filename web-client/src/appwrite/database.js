import { Databases, ID, Query, Permission, Role } from "appwrite";
import client from "./client";

const databases = new Databases(client);

export const databaseId = import.meta.env.VITE_APPWRITE_DB_ID || "";
export const projectsCollectionId =
  import.meta.env.VITE_APPWRITE_PROJECTS_COLLECTION_ID || "";

console.debug("DB", databaseId, "COLL", projectsCollectionId);

function ensureIds() {
  if (!databaseId || !projectsCollectionId) {
    console.warn(
      "Appwrite database/collection IDs are not set. Skipping DB operations."
    );
    return false;
  }
  return true;
}

// 🟩 Отримати лише проєкти поточного користувача
export async function getProjects(managerId) {
  if (!ensureIds()) return { documents: [] };
  return await databases.listDocuments(databaseId, projectsCollectionId, [
    Query.equal("managerId", managerId),
  ]);
}

// 🟩 Створити новий проєкт з дозволами (доступ лише власнику)
export async function createProject({
  name,
  description,
  status,
  startDate,
  endDate,
  managerId,
}) {
  if (!ensureIds()) return;

  const data = {
    name,
    description,
    status,
    startDate,
    managerId,
  };
  if (endDate) data.endDate = endDate;

  // 🔐 Права доступу — лише власник (автор) може читати, змінювати, видаляти
  const permissions = [
    Permission.read(Role.user(managerId)),
    Permission.update(Role.user(managerId)),
    Permission.delete(Role.user(managerId)),
  ];

  return await databases.createDocument(
    databaseId,
    projectsCollectionId,
    ID.unique(),
    data,
    permissions
  );
}

// 🟩 Видалення проєкту (лише якщо користувач має права)
export async function deleteProject(id) {
  if (!ensureIds()) return;
  return await databases.deleteDocument(databaseId, projectsCollectionId, id);
}

export async function updateProject(id, data) {
  if (!ensureIds()) return;
  return await databases.updateDocument(
    databaseId,
    projectsCollectionId,
    id,
    data
  );
}

export async function getProjectById(id) {
  if (!ensureIds()) return;
  return await databases.getDocument(databaseId, projectsCollectionId, id);
}

// 🟩 Отримати проєкти за teamId (для членів команди)
export async function getProjectsByTeam(teamId) {
  if (!ensureIds()) return { documents: [] };
  return await databases.listDocuments(databaseId, projectsCollectionId, [
    Query.equal("teamId", teamId),
  ]);
}

// Ensure optional attribute `teamId` exists on Projects collection (admin)
export async function ensureProjectsTeamIdAttribute() {
  if (!ensureIds()) return;
  const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
  const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;
  const apiKey = import.meta.env.VITE_APPWRITE_API_KEY;

  if (!endpoint || !projectId || !apiKey) return;

  try {
    const res = await fetch(
      `${endpoint}/databases/${databaseId}/collections/${projectsCollectionId}/attributes/string`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Appwrite-Project": projectId,
          "X-Appwrite-Key": apiKey,
        },
        body: JSON.stringify({
          key: "teamId",
          size: 64,
          required: false,
          default: null,
          array: false,
        }),
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      // If attribute already exists, treat as success
      if (data?.code === 409 || /already exists/i.test(data?.message || "")) {
        return true;
      }
      throw new Error(data?.message || "Failed to create attribute teamId");
    }
    return true;
  } catch (e) {
    console.warn("ensureProjectsTeamIdAttribute failed:", e?.message || e);
    return false;
  }
}

// 🔐 Додати правo читання для команди до документа проєкту
export async function addTeamReadPermission(projectDoc, teamId) {
  if (!ensureIds() || !projectDoc || !teamId) return;
  const managerId = projectDoc.managerId;
  const permissions = [
    Permission.read(Role.user(managerId)),
    Permission.update(Role.user(managerId)),
    Permission.delete(Role.user(managerId)),
    Permission.read(Role.team(teamId)), // дозволити читання всім членам команди
  ];
  // пусті дані, щоб оновити лише permissions
  return await databases.updateDocument(
    databaseId,
    projectsCollectionId,
    projectDoc.$id,
    {},
    permissions
  );
}

export async function syncUserToDatabase(user) {
  if (!user || !user.$id) return;

  const usersCollectionId = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;

  try {
    const res = await databases.listDocuments(databaseId, usersCollectionId, [
      Query.equal("email", [user.email]),
    ]);

    if (res.documents.length === 0) {
      await databases.createDocument(
        databaseId,
        usersCollectionId,
        ID.unique(),
        {
          name: user.name,
          email: user.email,
          role: "member",
          userId: user.$id,
        }
      );
      console.log("✅ User synced to Users collection:", user.email);
    } else {
      console.log("ℹ️ User already exists in Users collection");
    }
  } catch (err) {
    console.error("❌ Sync user failed:", err);
  }
}
