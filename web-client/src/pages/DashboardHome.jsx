import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProjectCreateForm from "../components/ProjectCreateForm";
import { useAuth } from "../context/AuthContext";
import { getProjects } from "../appwrite/database";

const DashboardHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!user?.$id) return;
      try {
        const res = await getProjects(user.$id);
        if (mounted) setProjects(res.documents || []);
      } catch (e) {
        console.warn("Failed to load projects", e?.message || e);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [user?.$id]);

  const getCreatedTime = (p) => {
    const d = p.createdAt || p.$createdAt || p.startDate;
    return d ? new Date(d).getTime() : 0;
  };

  const sorters = {
    newest: (a, b) => getCreatedTime(b) - getCreatedTime(a),
    oldest: (a, b) => getCreatedTime(a) - getCreatedTime(b),
    name: (a, b) => (a.name || "").localeCompare(b.name || ""),
  };

  const filteredProjects = projects
    .filter((p) => (statusFilter ? p.status === statusFilter : true))
    .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort(sorters[sortOption] || sorters.newest);

  return (
    <div className="space-y-8">
      <div className="bg-[#fff3dc] p-6 rounded-lg shadow-md w-full max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">
          Створити новий проєкт
        </h2>
        <ProjectCreateForm
          onCreated={() => {
            if (!user?.$id) return;
            getProjects(user.$id)
              .then((res) => setProjects(res.documents || []))
              .catch(() => {});
          }}
        />
      </div>

      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-sm p-4 md:p-5 rounded-lg shadow-md border border-black/5">
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
          <input
            type="text"
            placeholder="Пошук проєктів..."
            className="w-full p-2 border border-gray-300 rounded bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="flex justify-center">
            <img
              src="assets/taskflow_icon.svg"
              alt="TaskFlow"
              className="h-10 w-10 object-contain"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto justify-end">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 border border-gray-300 rounded bg-white cursor-pointer"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Сompleted</option>
            </select>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="p-2 border border-gray-300 rounded bg-white cursor-pointer"
            >
              <option value="newest">Найновіші</option>
              <option value="oldest">Найстаріші</option>
              <option value="name">За назвою (А→Я)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {filteredProjects.map((project) => (
          <div
            key={project.$id}
            onClick={() => navigate(`/dashboard/projects/${project.$id}`)}
            className="cursor-pointer bg-white hover:shadow-lg transition p-4 rounded-lg shadow flex flex-col"
          >
            <h3 className="text-lg font-bold text-gray-900">{project.name}</h3>
            <p className="text-sm text-gray-600">{project.description}</p>
            <div className="mt-2 text-sm text-gray-700 flex flex-wrap gap-2 items-center">
              <span
                className={`text-white text-xs font-semibold px-2 py-1 rounded ${
                  project.status === "active"
                    ? "bg-green-600"
                    : project.status === "on_hold"
                      ? "bg-yellow-600"
                      : project.status === "archived"
                        ? "bg-gray-600"
                        : "bg-gray-400"
                }`}
              >
                {project.status.toUpperCase()}
              </span>
              <span>
                Початок:{" "}
                {project.startDate
                  ? new Date(project.startDate).toLocaleDateString()
                  : "—"}
              </span>
              <span>
                Кінець:{" "}
                {project.endDate
                  ? new Date(project.endDate).toLocaleDateString()
                  : "—"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardHome;
