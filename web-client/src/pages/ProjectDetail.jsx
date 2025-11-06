import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProjectById, getProjects, updateProject } from "../appwrite/database";
import TasksPanel from "../components/TasksPanel";
import TeamPanel from "../components/TeamPanel";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function ProjectDetail() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        // Prefer direct fetch; fallback to listing user's projects and find
        try {
          const doc = await getProjectById(projectId);
          setProject(doc);
        } catch {
          const res = await getProjects(user.$id);
          const found = res.documents.find((d) => d.$id === projectId) || null;
          setProject(found);
        }
      } catch (e) {
        setError(e?.message || "Помилка завантаження проєкту");
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId, user.$id]);

  if (loading) return <p className="text-gray-500">Завантаження...</p>;
  if (error || !project)
    return (
      <div className="space-y-3">
        <Link to="/dashboard" className="text-blue-600 hover:underline">
          ← До проєктів
        </Link>
        <p className="text-red-600">{error || "Проєкт не знайдено"}</p>
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link to="/dashboard" className="text-blue-600 hover:underline">
          ← До проєктів
        </Link>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold">{project.name}</h2>
        {/* ✅ Форма зміни статусу проєкту */}
        <div className="bg-white p-4 rounded-lg shadow mt-4">
          <h3 className="text-lg font-semibold mb-3">Змінити статус проєкту</h3>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const promise = updateProject(project.$id, { status: project.status });
              toast.promise(promise, {
                loading: "⏳ Оновлення проєкту...",
                success: `✅ Статус проєкту "${project.name}" змінено на ${project.status}`,
                error: "❌ Не вдалося змінити статус проєкту",
              });
              try {
                await promise;
              } catch (err) {
                console.error(err);
              }
            }}
            className="flex items-center gap-3"
          >
            <select
              value={project.status}
              onChange={(e) =>
                setProject((prev) => ({ ...prev, status: e.target.value }))
              }
              className="border p-2 rounded"
            >
              <option value="active">active</option>
              <option value="on_hold">on_hold</option>
              <option value="completed">completed</option>
            </select>

            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Зберегти
            </button>
          </form>
        </div>

        {project.description && (
          <p className="text-gray-700 mt-1">{project.description}</p>
        )}
        <p className="text-sm text-gray-400 mt-2">
          Статус: {project.status} | Початок:{" "}
          {new Date(project.startDate).toLocaleDateString()} | Кінець:{" "}
          {project.endDate
            ? new Date(project.endDate).toLocaleDateString()
            : "—"}
        </p>
      </div>

      {/* Tasks list + creation */}
      <TasksPanel projectId={project.$id} />

      {/* Team management */}
      <TeamPanel project={project} />
    </div>
  );
}
