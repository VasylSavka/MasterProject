import { ID, Permission, Query, Role } from "appwrite";
import { databases } from "./client";

const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DB_ID!;
const projectsCollectionId = process.env.EXPO_PUBLIC_APPWRITE_PROJECTS_COLLECTION_ID!;
const tasksCollectionId = process.env.EXPO_PUBLIC_APPWRITE_TASKS_COLLECTION_ID!;

function ensureIds() {
  if (!databaseId || !projectsCollectionId || !tasksCollectionId) {
    console.warn("Database IDs missing");
    return false;
  }
  return true;
}

export async function getProjects(userId: string) {
  if (!ensureIds()) return { documents: [] } as any;
  return await databases.listDocuments(databaseId, projectsCollectionId, [
    Query.equal("managerId", userId),
  ]);
}

export async function getProjectsByTeam(teamId: string) {
  return await databases.listDocuments(databaseId, projectsCollectionId, [
    Query.equal("teamId", teamId),
  ]);
}

export async function getProjectById(id: string) {
  return await databases.getDocument(databaseId, projectsCollectionId, id);
}

export async function createProject(data: Record<string, any>) {
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

export async function updateProject(id: string, updates: Record<string, any>) {
  return await databases.updateDocument(
    databaseId,
    projectsCollectionId,
    id,
    updates
  );
}

export async function deleteProject(id: string) {
  return await databases.deleteDocument(databaseId, projectsCollectionId, id);
}

export async function syncUserToDatabase(user: any) {
  if (!ensureIds()) return;
  try {
    await databases.updateDocument(databaseId, projectsCollectionId, user.$id, {
      name: user.name,
      email: user.email,
    });
  } catch {}
}

