import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProjectById, getProjects } from "../appwrite/database";
import TasksPanel from "../components/TasksPanel";
import TeamPanel from "../components/TeamPanel";
import { useAuth } from "../context/AuthContext";

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
        <Link to="/dashboard" className="text-blue-600 hover:underline">← До проєктів</Link>
        <p className="text-red-600">{error || "Проєкт не знайдено"}</p>
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link to="/dashboard" className="text-blue-600 hover:underline">← До проєктів</Link>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold">{project.name}</h2>
        {project.description && (
          <p className="text-gray-700 mt-1">{project.description}</p>
        )}
        <p className="text-sm text-gray-400 mt-2">
          Статус: {project.status} | Початок: {new Date(project.startDate).toLocaleDateString()} | Кінець: {project.endDate ? new Date(project.endDate).toLocaleDateString() : "—"}
        </p>
      </div>

      {/* Tasks list + creation */}
      <TasksPanel projectId={project.$id} />

      {/* Team management */}
      <TeamPanel project={project} />
    </div>
  );
}

