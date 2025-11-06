import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProjects, getProjectsByTeam } from "../appwrite/database";
import { listTeams } from "../appwrite/teams";
import ProjectCreateForm from "../components/ProjectCreateForm";

export default function DashboardHome() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Створення форми винесено у ProjectCreateForm

  // ✅ Нові фільтри
  const [searchTerm, setSearchTerm] = useState("");

  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("created");

  async function loadAll() {
    // Власні проєкти
    const own = await getProjects(user.$id).catch(() => ({ documents: [] }));

    // Команди
    const tRes = await listTeams().catch(() => ({ teams: [] }));
    const userTeams = tRes.teams || tRes.documents || [];

    // Проєкти команд
    const teamProjectsSets = await Promise.all(
      userTeams.map((t) => getProjectsByTeam(t.$id).catch(() => ({ documents: [] })))
    );
    const teamProjects = [];
    teamProjectsSets.forEach((r) => teamProjects.push(...(r.documents || [])));

    // Унікалізація (Map по id)
    const byId = new Map();
    [...(own.documents || []), ...teamProjects].forEach((p) => byId.set(p.$id, p));
    setProjects([...byId.values()]);
  }

  useEffect(() => {
    (async () => {
      try {
        await loadAll();
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.$id]);

  // Створення проєкту обробляє ProjectCreateForm; після успіху викликаємо loadAll

  // ✅ Комбінована фільтрація
  const visible = useMemo(() => {
    let list = [...projects];

    // ✅ Фільтр по статусу
    if (filterStatus !== "all") {
      list = list.filter((p) => p.status === filterStatus);
    }

    // ✅ Пошук по назві
    if (searchTerm.trim().length > 0) {
      list = list.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // ✅ Сортування
    return list.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "start")
        return new Date(a.startDate) - new Date(b.startDate);
      return new Date(b.$createdAt) - new Date(a.$createdAt); // created desc
    });
  }, [projects, filterStatus, sortBy, searchTerm]);

  if (loading)
    return <p className="text-gray-500 text-center">Завантаження...</p>;

  return (
    <div className="w-full">
      {/* Create project */}
      <div className="mx-auto max-w-3xl">
        <ProjectCreateForm managerId={user?.$id} onCreated={loadAll} />
        {/* ✅ Фільтри */}
        <div className="bg-white p-4 rounded-lg shadow mb-4 space-y-3">
          {/* 🔍 Пошук */}
          <div>
            <input
              type="text"
              placeholder="Пошук проєкту..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>

          {/* ✅ Існуючі фільтри та сортування */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Статус:</span>
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

        {/* ✅ Список проєктів */}
        <div className="grid gap-4">
          {visible.length > 0 ? (
            visible.map((p) => (
              <div
                key={p.$id}
                className="bg-white p-4 rounded-lg shadow flex justify-between items-center"
              >
                <div>
                  <h3 className="font-semibold text-lg">{p.name}</h3>
                  <p className="text-gray-600 line-clamp-2">{p.description}</p>
                  <p className="text-sm text-gray-400">
                    Статус: {p.status} | Початок:{" "}
                    {new Date(p.startDate).toLocaleDateString()} | Кінець:{" "}
                    {p.endDate ? new Date(p.endDate).toLocaleDateString() : "—"}
                  </p>
                </div>
                <Link
                  to={`/dashboard/projects/${p.$id}`}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  Відкрити
                </Link>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center">Немає проєктів</p>
          )}
        </div>
      </div>
    </div>
  );
}
