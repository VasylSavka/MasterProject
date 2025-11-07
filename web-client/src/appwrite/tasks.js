import { ID, Permission, Role, Query } from "appwrite";
import { databases as db } from "./client";
import { databaseId, tasksCollectionId } from "./database";

function ensure() {
  if (!databaseId || !tasksCollectionId) {
    console.warn("Missing DB or Tasks Collection ID");
    return false;
  }
  return true;
}

export async function getTasks(projectId) {
  if (!ensure() || !projectId) return { documents: [] };
  return await db.listDocuments(databaseId, tasksCollectionId, [
    Query.equal("projectId", projectId),
    Query.orderDesc("$createdAt"),
  ]);
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
}) {
  if (!ensure()) return;

  const data = {
    title,
    description,
    status,
    priority,
    dueDate: dueDate || null,
    projectId,
    assigneeId,
    createdBy,
  };

  const permissions = [
    Permission.read(Role.user(assigneeId)),
    Permission.read(Role.user(createdBy)),
    Permission.update(Role.user(createdBy)),
    Permission.delete(Role.user(createdBy)),
  ];

  return await db.createDocument(
    databaseId,
    tasksCollectionId,
    ID.unique(),
    data,
    permissions
  );
}

export async function updateTask(id, updates, updatedBy = null) {
  if (!ensure()) return;

  const allowed = [
    "title",
    "description",
    "status",
    "priority",
    "dueDate",
    "assigneeId",
  ];

  const patch = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      patch[key] = key === "dueDate" && !updates[key] ? null : updates[key];
    }
  }
  if (updatedBy) patch.updatedBy = updatedBy;

  return await db.updateDocument(databaseId, tasksCollectionId, id, patch);
}

export async function deleteTask(id) {
  if (!ensure()) return;
  return await db.deleteDocument(databaseId, tasksCollectionId, id);
}
