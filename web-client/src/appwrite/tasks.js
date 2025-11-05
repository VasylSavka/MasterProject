// src/appwrite/tasks.js
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

/* =====================================================
   GET TASKS FOR PROJECT
===================================================== */
export async function getTasks(projectId) {
  if (!ensure() || !projectId) return { documents: [] };
  return await db.listDocuments(databaseId, tasksCollectionId, [
    Query.equal("projectId", projectId),
    Query.orderDesc("$createdAt"),
  ]);
}

/* =====================================================
   CREATE TASK (with createdBy and permissions)
===================================================== */
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
    // Normalize empty string to null to avoid invalid datetime values
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

/* =====================================================
   UPDATE TASK (with updatedBy)
===================================================== */
export async function updateTask(id, updates, updatedBy = null) {
  if (!ensure()) return;

  // Whitelist fields to avoid sending system/computed props like $id, $createdAt, _createdName
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
      // Normalize empty dueDate to null
      patch[key] = key === "dueDate" && !updates[key] ? null : updates[key];
    }
  }
  if (updatedBy) patch.updatedBy = updatedBy;

  return await db.updateDocument(databaseId, tasksCollectionId, id, patch);
}

/* =====================================================
   DELETE TASK
===================================================== */
export async function deleteTask(id) {
  if (!ensure()) return;
  return await db.deleteDocument(databaseId, tasksCollectionId, id);
}
