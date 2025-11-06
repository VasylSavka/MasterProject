import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { deleteProjectAndTasks, getProjectById } from "../appwrite/database";
import { deleteTeam } from "../appwrite/teams";
import toast from "react-hot-toast";

export default function ProjectDeleteButton({ projectId, afterDelete }) {
  const navigate = useNavigate();

  async function onDelete() {
    if (!projectId) return;
    if (!confirm("Видалити проєкт та всі його завдання?")) return;

    // try to fetch project to see if it has a team
    let teamId = null;
    try {
      const proj = await getProjectById(projectId);
      teamId = proj?.teamId || null;
    } catch {}

    // Compose deletion: delete tasks+project, and also delete team (best effort)
    const doDelete = (async () => {
      // If team exists, attempt to delete it first to avoid orphan teams
      if (teamId) {
        try {
          await deleteTeam(teamId);
        } catch {
          // best effort — continue even if team deletion fails
        }
      }
      await deleteProjectAndTasks(projectId);
    })();

    toast.promise(doDelete, {
      loading: "🗑️ Видаляємо проєкт...",
      success: "✅ Проєкт видалено",
      error: "❌ Помилка видалення проєкту",
    });

    try {
      await doDelete;
      if (afterDelete) afterDelete();
      else navigate(-1);
    } catch {
      // no-op, toast handles error
    }
  }

  return (
    <button
      onClick={onDelete}
      className="bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700"
    >
      Видалити проєкт
    </button>
  );
}

ProjectDeleteButton.propTypes = {
  projectId: PropTypes.string,
  afterDelete: PropTypes.func,
};
