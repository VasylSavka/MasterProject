import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import PropTypes from "prop-types";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../appwrite/tasks";
import client from "../appwrite/client";
import toast from "react-hot-toast"; // ✅ новий імпорт

export default function TasksPanel({ projectId }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: "",
  });
  const [editingTask, setEditingTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [sortBy, setSortBy] = useState("created");

  useEffect(() => {
    if (projectId) {
      fetchTasks();

      const subscription = client.subscribe(
        `databases.${import.meta.env.VITE_APPWRITE_DB_ID}.collections.${import.meta.env.VITE_APPWRITE_TASKS_COLLECTION_ID}.documents`,
        (response) => {
          const event = response.events[0];
          const doc = response.payload;
          if (doc.projectId !== projectId) return;

          if (event.includes("create")) {
            setTasks((prev) => [doc, ...prev]);
            toast.success(`🆕 Завдання "${doc.title}" створено`);
          } else if (event.includes("update")) {
            setTasks((prev) => prev.map((t) => (t.$id === doc.$id ? doc : t)));
            toast.success(`✏️ Оновлено завдання "${doc.title}"`);
          } else if (event.includes("delete")) {
            setTasks((prev) => prev.filter((t) => t.$id !== doc.$id));
            toast.error(`🗑️ Завдання видалено`);
          }
        }
      );

      return () => subscription();
    }
  }, [projectId]);

  async function fetchTasks() {
    try {
      const res = await getTasks(projectId);
      setTasks(res.documents);
    } catch {
      toast.error("Помилка отримання завдань");
      console.error("Помилка отримання завдань");
    }
  }

  async function handleCreate(e) {
    e.preventDefault();

    const taskPromise = createTask({
      ...newTask,
      projectId,
      assigneeId: user.$id,
    });

    toast.promise(taskPromise, {
      loading: "⏳ Створення завдання...",
      success: "✅ Завдання створено!",
      error: "❌ Помилка створення завдання",
    });

    try {
      await taskPromise;
      setNewTask({
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        dueDate: "",
      });
    } catch {
      toast.error("❌ Не вдалося створити завдання");
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    try {
      await updateTask(editingTask.$id, editingTask);
      setEditingTask(null);
      toast.success("✅ Зміни збережено");
    } catch {
      toast.error("❌ Помилка оновлення завдання");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Видалити завдання?")) return;
    try {
      await deleteTask(id);
      toast.loading("🗑️ Видалення...");
    } catch {
      toast.error("❌ Помилка видалення завдання");
    }
  }

  const filteredTasks = tasks
    .filter((t) => (filterStatus === "all" ? true : t.status === filterStatus))
    .filter((t) =>
      filterPriority === "all" ? true : t.priority === filterPriority
    )
    .sort((a, b) => {
      if (sortBy === "priority") {
        const order = ["low", "medium", "high", "critical"];
        return order.indexOf(a.priority) - order.indexOf(b.priority);
      }
      if (sortBy === "deadline") {
        return new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
      }
      return new Date(b.$createdAt) - new Date(a.$createdAt);
    });

  return (
    <div className="bg-gray-100 p-4 rounded-lg mt-4">
      <h3 className="text-lg font-semibold mb-3">Завдання</h3>

      {/* 🎛️ Панель фільтрів */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="all">Всі статуси</option>
          <option value="todo">todo</option>
          <option value="in_progress">in_progress</option>
          <option value="review">review</option>
          <option value="done">done</option>
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="all">Всі пріоритети</option>
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
          <option value="critical">critical</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="created">Сортувати: новіші</option>
          <option value="deadline">За дедлайном</option>
          <option value="priority">За пріоритетом</option>
        </select>
      </div>

      {/* 📝 Створення завдання */}
      <form
        onSubmit={handleCreate}
        className="bg-white p-3 rounded-lg shadow mb-4"
      >
        <input
          type="text"
          placeholder="Назва завдання"
          value={newTask.title}
          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          className="border p-2 w-full mb-2 rounded"
          required
        />
        <textarea
          placeholder="Опис (необов’язково)"
          value={newTask.description}
          onChange={(e) =>
            setNewTask({ ...newTask, description: e.target.value })
          }
          className="border p-2 w-full mb-2 rounded"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="block text-sm mb-1">Статус</label>
            <select
              className="border p-2 w-full rounded"
              value={newTask.status}
              onChange={(e) =>
                setNewTask({ ...newTask, status: e.target.value })
              }
            >
              <option value="todo">todo</option>
              <option value="in_progress">in_progress</option>
              <option value="review">review</option>
              <option value="done">done</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Пріоритет</label>
            <select
              className="border p-2 w-full rounded"
              value={newTask.priority}
              onChange={(e) =>
                setNewTask({ ...newTask, priority: e.target.value })
              }
            >
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
              <option value="critical">critical</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Deadline</label>
            <input
              type="datetime-local"
              className="border p-2 w-full rounded"
              value={newTask.dueDate}
              onChange={(e) =>
                setNewTask({ ...newTask, dueDate: e.target.value })
              }
            />
          </div>
        </div>
        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Додати завдання
        </button>
      </form>

      {/* 📋 Відображення відфільтрованих завдань */}
      {editingTask ? (
        <form
          onSubmit={handleUpdate}
          className="bg-yellow-50 p-3 rounded-lg shadow mb-4"
        >
          <input
            value={editingTask.title}
            onChange={(e) =>
              setEditingTask({ ...editingTask, title: e.target.value })
            }
            className="border p-2 w-full mb-2 rounded"
          />
          <textarea
            value={editingTask.description}
            onChange={(e) =>
              setEditingTask({ ...editingTask, description: e.target.value })
            }
            className="border p-2 w-full mb-2 rounded"
          />
          <div className="grid grid-cols-2 gap-3 mb-2">
            <select
              value={editingTask.status}
              onChange={(e) =>
                setEditingTask({ ...editingTask, status: e.target.value })
              }
              className="border p-2 rounded"
            >
              <option value="todo">todo</option>
              <option value="in_progress">in_progress</option>
              <option value="review">review</option>
              <option value="done">done</option>
            </select>
            <select
              value={editingTask.priority}
              onChange={(e) =>
                setEditingTask({ ...editingTask, priority: e.target.value })
              }
              className="border p-2 rounded"
            >
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
              <option value="critical">critical</option>
            </select>
          </div>
          <input
            type="datetime-local"
            value={editingTask.dueDate ? editingTask.dueDate.slice(0, 16) : ""}
            onChange={(e) =>
              setEditingTask({ ...editingTask, dueDate: e.target.value })
            }
            className="border p-2 w-full mb-3 rounded"
          />
          <button className="bg-green-500 text-white px-3 py-1 rounded mr-2">
            Зберегти
          </button>
          <button
            type="button"
            onClick={() => setEditingTask(null)}
            className="bg-gray-400 text-white px-3 py-1 rounded"
          >
            Скасувати
          </button>
        </form>
      ) : filteredTasks.length > 0 ? (
        <div className="space-y-3">
          {filteredTasks.map((t) => (
            <div
              key={t.$id}
              className="bg-white p-3 rounded-lg shadow flex justify-between items-start"
            >
              <div>
                <h4 className="font-semibold">{t.title}</h4>
                <p className="text-sm text-gray-600">{t.description}</p>
                <p className="text-xs text-gray-400">
                  Статус: {t.status} | Пріоритет: {t.priority} | Deadline:{" "}
                  {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "—"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingTask(t)}
                  className="bg-yellow-400 text-white px-2 py-1 rounded hover:bg-yellow-500"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(t.$id)}
                  className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center">
          Немає завдань за вибраними параметрами
        </p>
      )}
    </div>
  );
}

TasksPanel.propTypes = {
  projectId: PropTypes.string,
};
