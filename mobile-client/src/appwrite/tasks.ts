import { ID, Permission, Query, Role } from "appwrite";
import { databases } from "./client";

const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DB_ID!;
const tasksCollectionId = process.env.EXPO_PUBLIC_APPWRITE_TASKS_COLLECTION_ID!;

function ensureTasks() {
  if (!databaseId || !tasksCollectionId) {
    console.warn("Tasks collection IDs are missing");
    return false;
  }
  return true;
}

export async function getTasks(projectId: string) {
  if (!ensureTasks() || !projectId) return { documents: [] } as any;
  return await databases.listDocuments(databaseId, tasksCollectionId, [
    Query.equal("projectId", projectId),
    Query.orderDesc("$createdAt"),
  ]);
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string | null;
  projectId: string;
  assigneeId?: string | null;
  createdBy?: string | null;
}

export async function createTask({
  title,
  description,
  status,
  priority,
  dueDate,
  projectId,
  assigneeId,
  createdBy,
}: CreateTaskInput) {
  if (!ensureTasks()) return;

  const payload: Record<string, any> = {
    title,
    description: description || "",
    status,
    priority,
    dueDate: dueDate || null,
    projectId,
    assigneeId: assigneeId || null,
    createdBy: createdBy || null,
  };

  const permissions = [];
  if (assigneeId) {
    permissions.push(Permission.read(Role.user(assigneeId)));
  }
  if (createdBy) {
    permissions.push(
      Permission.read(Role.user(createdBy)),
      Permission.update(Role.user(createdBy)),
      Permission.delete(Role.user(createdBy))
    );
  }

  return await databases.createDocument(
    databaseId,
    tasksCollectionId,
    ID.unique(),
    payload,
    permissions
  );
}

export async function updateTask(
  taskId: string,
  updates: Record<string, any>,
  updatedBy?: string | null
) {
  if (!ensureTasks()) return;
  const allowedFields = [
    "title",
    "description",
    "status",
    "priority",
    "dueDate",
    "assigneeId",
  ];
  const patch: Record<string, any> = {};
  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      const value = updates[field];
      patch[field] = field === "dueDate" && !value ? null : value;
    }
  });
  if (updatedBy) patch.updatedBy = updatedBy;
  return await databases.updateDocument(
    databaseId,
    tasksCollectionId,
    taskId,
    patch
  );
}

export async function deleteTask(taskId: string) {
  if (!ensureTasks()) return;
  return await databases.deleteDocument(databaseId, tasksCollectionId, taskId);
}
