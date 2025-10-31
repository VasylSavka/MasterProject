import { useEffect, useState } from "react";
import {
  getProjects,
  createProject,
  deleteProject,
} from "../appwrite/database";
import { useAuth } from "../context/AuthContext";

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

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const res = await getProjects();
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
      await createProject(payload);
      setNewProject({ name: "", description: "", status: "active", startDate: "", endDate: "" });
      fetchProjects();
    } catch (err) {
      alert("❌ Не вдалося створити проєкт: " + err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Видалити проєкт?")) return;
    await deleteProject(id);
    fetchProjects();
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
              onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
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
              onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-sm">Кінець (необов’язково)</label>
            <input
              type="datetime-local"
              className="border p-2 w-full rounded"
              value={newProject.endDate}
              onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
            />
          </div>
        </div>
        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Додати проєкт
        </button>
      </form>

      <div className="grid gap-4">
        {projects.length > 0 ? (
          projects.map((p) => (
            <div
              key={p.$id}
              className="bg-white p-4 rounded-lg shadow flex justify-between items-center"
            >
              <div>
                <h3 className="font-semibold text-lg">{p.name}</h3>
                <p className="text-gray-600">{p.description}</p>
              </div>
              <button
                onClick={() => handleDelete(p.$id)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Видалити
              </button>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center">Немає створених проєктів</p>
        )}
      </div>
    </div>
  );
}
