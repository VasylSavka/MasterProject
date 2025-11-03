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
