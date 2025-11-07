import { ID, Query, Permission, Role } from "appwrite";
import { databases } from "./client";

export const databaseId = import.meta.env.VITE_APPWRITE_DB_ID;
export const projectsCollectionId = import.meta.env
  .VITE_APPWRITE_PROJECTS_COLLECTION_ID;
export const tasksCollectionId = import.meta.env
  .VITE_APPWRITE_TASKS_COLLECTION_ID;

function ensureIds() {
  if (!databaseId || !projectsCollectionId || !tasksCollectionId) {
    console.warn("Database IDs missing");
    return false;
  }
  return true;
}

export async function getProjects(userId) {
  if (!ensureIds()) return { documents: [] };
  return await databases.listDocuments(databaseId, projectsCollectionId, [
    Query.equal("managerId", userId),
  ]);
}

export async function getProjectsByTeam(teamId) {
  return await databases.listDocuments(databaseId, projectsCollectionId, [
    Query.equal("teamId", teamId),
  ]);
}

export async function getProjectById(id) {
  return await databases.getDocument(databaseId, projectsCollectionId, id);
}

export async function createProject(data) {
  return await databases.createDocument(
    databaseId,
    projectsCollectionId,
    ID.unique(),
    data,
    [
      Permission.read(Role.any()),
      Permission.update(Role.user(data.managerId)),
      Permission.delete(Role.user(data.managerId)),
    ]
  );
}

export async function updateProject(id, updates) {
  return await databases.updateDocument(
    databaseId,
    projectsCollectionId,
    id,
    updates
  );
}

export async function deleteProject(id) {
  return await databases.deleteDocument(databaseId, projectsCollectionId, id);
}

export async function deleteProjectAndTasks(projectId, { batch = 100 } = {}) {
  try {
    const tasks = await databases.listDocuments(databaseId, tasksCollectionId, [
      Query.equal("projectId", projectId),
      Query.limit(batch),
    ]);
    const docs = tasks.documents || [];
    for (const t of docs) {
      try {
        await databases.deleteDocument(databaseId, tasksCollectionId, t.$id);
      } catch (e) {
        console.warn("Task delete failed", t.$id, e?.message || e);
      }
    }
  } catch (e) {
    console.warn("List tasks failed", e?.message || e);
  }
  return await deleteProject(projectId);
}

export async function addTeamReadPermission(project, teamId) {
  const perms = project.$permissions || [];
  const readPerm = `read("team:${teamId}")`;

  if (!perms.includes(readPerm)) {
    return await databases.updateDocument(
      databaseId,
      projectsCollectionId,
      project.$id,
      {},
      [...perms, Permission.read(Role.team(teamId))]
    );
  }
  return project;
}

export async function ensureProjectsTeamIdAttribute() {
  try {
    await databases.createStringAttribute(
      databaseId,
      projectsCollectionId,
      "teamId",
      64,
      false
    );
    return true;
  } catch (e) {
    console.warn("teamId attribute check:", e.message);
    return false;
  }
}

export async function syncUserToDatabase(user) {
  if (!ensureIds()) return;
  try {
    await databases.updateDocument(databaseId, projectsCollectionId, user.$id, {
      name: user.name,
      email: user.email,
    });
  } catch {}
}
