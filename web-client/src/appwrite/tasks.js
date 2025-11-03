import { Databases, ID, Permission, Role, Query } from "appwrite";
import client from "./client";

const databases = new Databases(client);

// Ідентифікатори з .env
export const databaseId = import.meta.env.VITE_APPWRITE_DB_ID;
export const tasksCollectionId = import.meta.env
  .VITE_APPWRITE_TASKS_COLLECTION_ID;

function ensureIds() {
  if (!databaseId || !tasksCollectionId) {
    console.warn("Tasks: DB or Collection ID missing");
    return false;
  }
  return true;
}

// 🟩 Отримати завдання для конкретного проєкту
export async function getTasks(projectId) {
  if (!ensureIds()) return { documents: [] };
  return await databases.listDocuments(databaseId, tasksCollectionId, [
    Query.equal("projectId", projectId),
  ]);
}

// 🟩 Створити нове завдання
export async function createTask({
  title,
  description,
  status,
  priority,
  dueDate,
  projectId,
  assigneeId,
}) {
  if (!ensureIds()) return;

  const data = {
    title,
    description,
    status,
    priority,
    dueDate,
    projectId,
    assigneeId,
  };

  const permissions = [
    Permission.read(Role.user(assigneeId)),
    Permission.update(Role.user(assigneeId)),
    Permission.delete(Role.user(assigneeId)),
  ];

  return await databases.createDocument(
    databaseId,
    tasksCollectionId,
    ID.unique(),
    data,
    permissions
  );
}

// 🟩 Оновити завдання
export async function updateTask(id, updates) {
  if (!ensureIds()) return;
  return await databases.updateDocument(
    databaseId,
    tasksCollectionId,
    id,
    updates
  );
}

// 🟩 Видалити завдання
export async function deleteTask(id) {
  if (!ensureIds()) return;
  return await databases.deleteDocument(databaseId, tasksCollectionId, id);
}
