import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  getProjects,
  createProject,
  deleteProject,
  updateProject,
  getProjectById,
  deleteProjectAndTasks,
} from "../appwrite/database";
import { deleteTeam } from "../appwrite/teams";
import { useAuth } from "../context/AuthContext";
import TasksPanel from "../components/TasksPanel";
import TeamPanel from "../components/TeamPanel";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    status: "active",
    startDate: "",
    endDate: "",
  });
  const [editingProject, setEditingProject] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const res = await getProjects(user.$id);
      setProjects(res.documents);
    } catch (err) {
      console.error("Помилка завантаження проєктів:", err);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      const payload = {
        name: newProject.name,
        description: newProject.description || undefined,
        status: newProject.status,
        startDate: newProject.startDate
          ? new Date(newProject.startDate).toISOString()
          : new Date().toISOString(),
        endDate: newProject.endDate
          ? new Date(newProject.endDate).toISOString()
          : undefined,
        managerId: user?.$id,
      };
      const createPromise = createProject(payload);
      toast.promise(createPromise, {
        loading: "⏳ Створення проєкту...",
        success: `✅ Проєкт "${payload.name}" створено`,
        error: "❌ Не вдалося створити проєкт",
      });
      await createPromise;
      setNewProject({
        name: "",
        description: "",
        status: "active",
        startDate: "",
        endDate: "",
      });
      fetchProjects();
    } catch (err) {
      // помилку вже показано в toast.promise; додаткових alert не потрібно
    }
  }

  async function handleDelete(id) {
    if (!confirm("Видалити проєкт?")) return;
    let teamId = null;
    try {
      const proj = await getProjectById(id);
      teamId = proj?.teamId || null;
    } catch {}
    try {
      if (teamId) {
        try { await deleteTeam(teamId); } catch {}
      }
      await deleteProjectAndTasks(id);
    } finally {
      fetchProjects();
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    const prev = projects.find((p) => p.$id === editingProject.$id);
    const statusChanged = prev && prev.status !== editingProject.status;
    const payload = {
      name: editingProject.name,
      description: editingProject.description,
      status: editingProject.status,
      endDate: editingProject.endDate
        ? new Date(editingProject.endDate).toISOString()
        : null,
    };
    const updatePromise = updateProject(editingProject.$id, payload);
    toast.promise(updatePromise, {
      loading: "⏳ Оновлення проєкту...",
      success: statusChanged
        ? `✅ Статус проєкту "${editingProject.name}" змінено на ${editingProject.status}`
        : `✅ Проєкт "${editingProject.name}" оновлено`,
      error: "❌ Не вдалося оновити проєкт",
    });
    try {
      await updatePromise;
      setEditingProject(null);
      fetchProjects();
    } catch {
      // toast already handled error
    }
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Вітаємо, {user?.name}!</h1>
        <button
          onClick={logout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Вийти
        </button>
      </div>

      {/* Форма створення нового проєкту */}
      <form
        onSubmit={handleCreate}
        className="bg-white p-4 rounded-lg shadow mb-6"
      >
        <h2 className="text-lg font-semibold mb-3">Створити новий проєкт</h2>
        <input
          type="text"
          placeholder="Назва"
          value={newProject.name}
          onChange={(e) =>
            setNewProject({ ...newProject, name: e.target.value })
          }
          className="border p-2 w-full mb-3 rounded"
          required
        />
        <textarea
          placeholder="Опис (необов’язково)"
          value={newProject.description}
          onChange={(e) =>
            setNewProject({ ...newProject, description: e.target.value })
          }
          className="border p-2 w-full mb-3 rounded"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="block mb-1 text-sm">Статус</label>
            <select
              className="border p-2 w-full rounded"
              value={newProject.status}
              onChange={(e) =>
                setNewProject({ ...newProject, status: e.target.value })
              }
              required
            >
              <option value="active">active</option>
              <option value="on_hold">on_hold</option>
              <option value="completed">completed</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm">Початок</label>
            <input
              type="datetime-local"
              className="border p-2 w-full rounded"
              value={newProject.startDate}
              onChange={(e) =>
                setNewProject({ ...newProject, startDate: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-sm">Кінець (необов’язково)</label>
            <input
              type="datetime-local"
              className="border p-2 w-full rounded"
              value={newProject.endDate}
              onChange={(e) =>
                setNewProject({ ...newProject, endDate: e.target.value })
              }
            />
          </div>
        </div>
        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Додати проєкт
        </button>
      </form>

      {/* Список проєктів */}
      <div className="grid gap-4">
        {projects.length > 0 ? (
          projects.map((p) =>
            editingProject?.$id === p.$id ? (
              <form
                key={p.$id}
                onSubmit={handleUpdate}
                className="bg-yellow-50 p-4 rounded-lg shadow"
              >
                <input
                  value={editingProject.name}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      name: e.target.value,
                    })
                  }
                  className="border p-2 w-full mb-2 rounded"
                />
                <textarea
                  value={editingProject.description}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      description: e.target.value,
                    })
                  }
                  className="border p-2 w-full mb-2 rounded"
                />
                <select
                  value={editingProject.status}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      status: e.target.value,
                    })
                  }
                  className="border p-2 w-full mb-2 rounded"
                >
                  <option value="active">active</option>
                  <option value="on_hold">on_hold</option>
                  <option value="completed">completed</option>
                </select>
                <input
                  type="datetime-local"
                  value={
                    editingProject.endDate
                      ? editingProject.endDate.slice(0, 16)
                      : ""
                  }
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      endDate: e.target.value,
                    })
                  }
                  className="border p-2 w-full mb-3 rounded"
                />
                <button className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 mr-2">
                  Зберегти
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
                >
                  Скасувати
                </button>
              </form>
            ) : (
              <div key={p.$id}>
                <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg">{p.name}</h3>
                    <p className="text-gray-600">{p.description}</p>
                    <p className="text-sm text-gray-400">
                      Статус: {p.status} | Початок:{" "}
                      {new Date(p.startDate).toLocaleDateString()} | Кінець:{" "}
                      {p.endDate
                        ? new Date(p.endDate).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingProject(p)}
                      className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(p.$id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <TasksPanel projectId={p.$id} />
                <TeamPanel project={p} />
              </div>
            )
          )
        ) : (
          <p className="text-gray-500 text-center">Немає створених проєктів</p>
        )}
      </div>
    </div>
  );
}
