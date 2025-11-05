import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { deleteProjectAndTasks } from "../appwrite/database";
import toast from "react-hot-toast";

export default function ProjectDeleteButton({ projectId, afterDelete }) {
  const navigate = useNavigate();

  async function onDelete() {
    if (!projectId) return;
    if (!confirm("Видалити проєкт та всі його завдання?")) return;

    const doDelete = deleteProjectAndTasks(projectId);
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

