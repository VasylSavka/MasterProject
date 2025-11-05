import { getUserById } from "../../appwrite/teams";
import { PRIORITY_ORDER } from "./taskConstants";

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString();
}

export async function enrichTask(task) {
  const createdUser = task.createdBy ? await getUserById(task.createdBy) : null;
  const updatedUser = task.updatedBy ? await getUserById(task.updatedBy) : null;
  return {
    ...task,
    _createdName: createdUser?.name || createdUser?.email || "Невідомо",
    _updatedName: updatedUser?.name || updatedUser?.email || null,
  };
}

export async function enrichTasks(tasks) {
  return Promise.all(tasks.map((t) => enrichTask(t)));
}

export function computeFilteredSortedTasks(tasks, { status = "all", priority = "all", sortBy = "created" }) {
  const filtered = (tasks || [])
    .filter((t) => (status === "all" ? true : t.status === status))
    .filter((t) => (priority === "all" ? true : t.priority === priority));

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "priority") {
      return (PRIORITY_ORDER[a.priority] ?? 0) - (PRIORITY_ORDER[b.priority] ?? 0);
    }
    if (sortBy === "deadline") {
      return new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
    }
    return new Date(b.$createdAt) - new Date(a.$createdAt);
  });

  return sorted;
}

