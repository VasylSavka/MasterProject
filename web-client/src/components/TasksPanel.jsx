import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import PropTypes from "prop-types";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../appwrite/tasks";
import client from "../appwrite/client"; // ✅ імпорт для Realtime

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

      // ✅ Підписка на Realtime-оновлення документів
      const subscription = client.subscribe(
        `databases.${import.meta.env.VITE_APPWRITE_DB_ID}.collections.${import.meta.env.VITE_APPWRITE_TASKS_COLLECTION_ID}.documents`,
        (response) => {
          const event = response.events[0];
          const doc = response.payload;

          // 🧭 Оновлення лише для завдань поточного проекту
          if (doc.projectId !== projectId) return;

          if (event.includes("create")) {
            setTasks((prev) => [doc, ...prev]);
          } else if (event.includes("update")) {
            setTasks((prev) => prev.map((t) => (t.$id === doc.$id ? doc : t)));
          } else if (event.includes("delete")) {
            setTasks((prev) => prev.filter((t) => t.$id !== doc.$id));
          }
        }
      );

      return () => {
        subscription(); // 🧹 скасування підписки при демонтажі
      };
    }
  }, [projectId]);

  async function fetchTasks() {
    try {
      const res = await getTasks(projectId);
      setTasks(res.documents);
    } catch (err) {
      console.error("Помилка отримання завдань:", err);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await createTask({
        ...newTask,
        projectId,
        assigneeId: user.$id,
      });
      setNewTask({
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        dueDate: "",
      });
    } catch (err) {
      alert("❌ Не вдалося створити завдання: " + err.message);
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    try {
      await updateTask(editingTask.$id, {
        title: editingTask.title,
        description: editingTask.description,
        status: editingTask.status,
        priority: editingTask.priority,
        dueDate: editingTask.dueDate,
      });
      setEditingTask(null);
    } catch (err) {
      alert("❌ Не вдалося оновити завдання: " + err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Видалити завдання?")) return;
    await deleteTask(id);
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
