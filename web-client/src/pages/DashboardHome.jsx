import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createProject, getProjects, getProjectsByTeam } from "../appwrite/database";
import toast from "react-hot-toast";
import { listTeams } from "../appwrite/teams";

export default function DashboardHome() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    status: "active",
    startDate: "",
    endDate: "",
  });

  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("created");

  useEffect(() => {
    (async () => {
      try {
        // власні проєкти
        const own = await getProjects(user.$id).catch(() => ({ documents: [] }));
        // проєкти команд, де я учасник
        const tRes = await listTeams().catch(() => ({ teams: [] }));
        const teams = tRes.teams || tRes.documents || [];
        const teamProjectsSets = await Promise.all(
          teams.map((t) => getProjectsByTeam(t.$id).catch(() => ({ documents: [] })))
        );
        const teamProjects = [];
        teamProjectsSets.forEach((r) => teamProjects.push(...(r.documents || [])));
        // унікалізація
        const byId = new Map();
        [...(own.documents || []), ...teamProjects].forEach((p) => byId.set(p.$id, p));
        setProjects([...byId.values()]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user.$id]);

  async function handleCreate(e) {
    e.preventDefault();
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

    const res = await getProjects(user.$id);
    setProjects(res.documents);
  }

  const visible = useMemo(() => {
    const filtered = projects.filter((p) =>
      filterStatus === "all" ? true : p.status === filterStatus
    );
    return filtered.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "start")
        return new Date(a.startDate) - new Date(b.startDate);
      return new Date(b.$createdAt) - new Date(a.$createdAt); // created desc
    });
  }, [projects, filterStatus, sortBy]);

  return (
    <div className="w-full">
      {/* Create project (centered) */}
      <div className="mx-auto max-w-3xl">
        <form
          onSubmit={handleCreate}
          className="bg-white p-4 rounded-lg shadow mb-6"
        >
          <h2 className="text-lg font-semibold mb-3 text-center">
            Створити новий проєкт
          </h2>
          <input
            type="text"
            placeholder="Назва"
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
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
          <div className="flex justify-center">
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Додати проєкт
            </button>
          </div>
        </form>

        {/* Filters/sorting */}
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Фільтр:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border p-2 rounded"
              >
                <option value="all">всі</option>
                <option value="active">active</option>
                <option value="on_hold">on_hold</option>
                <option value="completed">completed</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Сортувати:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border p-2 rounded"
              >
                <option value="created">новіші</option>
                <option value="start">за початком</option>
                <option value="name">за назвою</option>
              </select>
            </div>
          </div>
        </div>

        {/* Projects list */}
        <div className="grid gap-4">
          {loading ? (
            <p className="text-gray-500 text-center">Завантаження...</p>
          ) : visible.length > 0 ? (
            visible.map((p) => (
              <div
                key={p.$id}
                className="bg-white p-4 rounded-lg shadow flex justify-between items-center"
              >
                <div>
                  <h3 className="font-semibold text-lg">{p.name}</h3>
                  <p className="text-gray-600 line-clamp-2">{p.description}</p>
                  <p className="text-sm text-gray-400">
                    Статус: {p.status} | Початок: {new Date(p.startDate).toLocaleDateString()} | Кінець: {p.endDate ? new Date(p.endDate).toLocaleDateString() : "—"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/dashboard/projects/${p.$id}`}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    Відкрити
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center">Немає створених проєктів</p>
          )}
        </div>
      </div>
    </div>
  );
}
