import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getProjectById,
  getProjects,
  updateProject,
} from "../appwrite/database";
import TasksPanel from "../components/TasksPanel";
import TeamPanel from "../components/TeamPanel";
import ProjectDeleteButton from "../components/ProjectDeleteButton";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function ProjectDetail() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingStatus, setEditingStatus] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        try {
          const doc = await getProjectById(projectId);
          setProject(doc);
        } catch {
          const res = await getProjects(user.$id);
          const found = res.documents.find((d) => d.$id === projectId) || null;
          setProject(found);
        }
      } catch (e) {
        setError(e?.message || "Сталася помилка під час завантаження");
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId, user.$id]);

  if (loading) return <p className="text-gray-500">Завантаження…</p>;
  if (error || !project)
    return (
      <div className="space-y-3">
        <Link
          to="/dashboard"
          className="text-orange-500 hover:underline font-bold"
        >
          Повернутися до панелі
        </Link>
        <p className="text-red-600">{error || "Проєкт не знайдено"}</p>
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard"
          className="text-orange-500 font-bold hover:underline"
        >
          Повернутися до панелі
        </Link>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{project.name}</h2>
            {project.description && (
              <p className="text-gray-700 mt-1">{project.description}</p>
            )}

            <p className="text-sm text-gray-400 mt-2 flex items-center flex-wrap gap-x-2">
              <span className="mr-1">Статус:</span>
              {!editingStatus ? (
                <button
                  type="button"
                  className="underline decoration-dotted text-gray-600 hover:text-gray-800 cursor-pointer"
                  onClick={() => setEditingStatus(true)}
                >
                  {project.status}
                </button>
              ) : (
                <select
                  value={project.status}
                  onChange={async (e) => {
                    const next = e.target.value;
                    setProject((prev) => ({ ...prev, status: next }));
                    const promise = updateProject(project.$id, {
                      status: next,
                    });
                    toast.promise(promise, {
                      loading: "Оновлюємо статус…",
                      success: `Статус проєкту "${project.name}" змінено на ${next}`,
                      error: "Не вдалося змінити статус",
                    });
                    try {
                      await promise;
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setEditingStatus(false);
                    }
                  }}
                  className="border p-1 rounded text-gray-700 bg-white"
                >
                  <option value="active">active</option>
                  <option value="on_hold">on_hold</option>
                  <option value="completed">completed</option>
                </select>
              )}
              <span className="mx-2">|</span>
              <span className="mr-1">Початок:</span>{" "}
              {new Date(project.startDate).toLocaleDateString()}
              <span className="mx-2">|</span>
              <span className="mr-1">Завершення:</span>
              {project.endDate
                ? new Date(project.endDate).toLocaleDateString()
                : "—"}
            </p>
          </div>
          <div className="self-end">
            <ProjectDeleteButton projectId={project.$id} />
          </div>
        </div>
      </div>

      <TasksPanel projectId={project.$id} />

      <TeamPanel project={project} />
    </div>
  );
}
