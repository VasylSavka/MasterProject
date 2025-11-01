import { Databases, ID } from "appwrite";
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

export async function getProjects() {
  if (!ensureIds()) return { documents: [] };
  return await databases.listDocuments(databaseId, projectsCollectionId);
}

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
  return await databases.createDocument(
    databaseId,
    projectsCollectionId,
    ID.unique(),
    data
  );
}

export async function deleteProject(id) {
  if (!ensureIds()) return;
  return await databases.deleteDocument(databaseId, projectsCollectionId, id);
}
