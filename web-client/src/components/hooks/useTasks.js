import { useEffect, useState } from "react";
import client from "../../appwrite/client";
import { getTasks as apiGetTasks, createTask as apiCreateTask, updateTask as apiUpdateTask, deleteTask as apiDeleteTask } from "../../appwrite/tasks";
import { enrichTask, enrichTasks } from "../utils/taskHelpers";
import toast from "react-hot-toast";

export default function useTasks(projectId, user) {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (!projectId) return;

    (async () => {
      try {
        const res = await apiGetTasks(projectId);
        setTasks(await enrichTasks(res.documents || []));
      } catch (err) {
        console.error(err);
        toast.error("Помилка отримання завдань");
      }
    })();

    const subscription = client.subscribe(
      `databases.${import.meta.env.VITE_APPWRITE_DB_ID}.collections.${import.meta.env.VITE_APPWRITE_TASKS_COLLECTION_ID}.documents`,
      async (response) => {
        const event = response.events?.[0] || "";
        const doc = response.payload;
        if (!doc || doc.projectId !== projectId) return;

        if (event.includes("create")) {
          const enriched = await enrichTask(doc);
          setTasks((prev) => [enriched, ...prev]);
          toast.success(`🆕 Завдання "${doc.title}" створено`);
        } else if (event.includes("update")) {
          const enriched = await enrichTask(doc);
          setTasks((prev) => prev.map((t) => (t.$id === doc.$id ? enriched : t)));
        } else if (event.includes("delete")) {
          // Оновлюємо список без додаткових тостів, щоб уникати дублювання
          setTasks((prev) => prev.filter((t) => t.$id !== doc.$id));
        }
      }
    );

    return () => subscription();
  }, [projectId]);

  async function createTaskForProject(data) {
    const payload = {
      ...data,
      projectId,
      assigneeId: user?.$id,
      createdBy: user?.$id,
    };
    try {
      // Не показуємо успішний тост тут, щоб уникнути дублювання з realtime
      return await apiCreateTask(payload);
    } catch (err) {
      toast.error("❌ Помилка створення завдання");
      throw err;
    }
  }

  async function updateTaskById(id, updates) {
    try {
      await apiUpdateTask(id, updates, user?.$id);
      toast.success("✅ Зміни збережено");
    } catch {
      toast.error("❌ Помилка оновлення завдання");
      throw new Error("update_failed");
    }
  }

  async function deleteTaskById(id) {
    try {
      await apiDeleteTask(id);
      toast.success("🗑️ Завдання видалено");
    } catch {
      toast.error("❌ Помилка видалення завдання");
      throw new Error("delete_failed");
    }
  }

  return {
    tasks,
    setTasks,
    createTaskForProject,
    updateTaskById,
    deleteTaskById,
  };
}
