import PropTypes from "prop-types";
import { STATUS_OPTIONS, PRIORITY_OPTIONS } from "./utils/taskConstants";

export default function TaskEditForm({
  editingTask,
  setEditingTask,
  onSubmit,
  onCancel,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="bg-yellow-50 p-3 rounded-lg shadow mb-4"
    >
      <input
        value={editingTask.title}
        onChange={(e) =>
          setEditingTask({ ...editingTask, title: e.target.value })
        }
        className="border p-2 w-full mb-2 rounded bg-white"
      />

      <textarea
        value={editingTask.description}
        onChange={(e) =>
          setEditingTask({ ...editingTask, description: e.target.value })
        }
        className="border p-2 w-full mb-2 rounded bg-white"
      />

      <div className="grid grid-cols-2 gap-3 mb-2">
        <select
          value={editingTask.status}
          onChange={(e) =>
            setEditingTask({ ...editingTask, status: e.target.value })
          }
          className="border p-2 rounded bg-white cursor-pointer"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={editingTask.priority}
          onChange={(e) =>
            setEditingTask({ ...editingTask, priority: e.target.value })
          }
          className="border p-2 rounded bg-white cursor-pointer"
        >
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <input
        type="datetime-local"
        value={editingTask.dueDate ? editingTask.dueDate.slice(0, 16) : ""}
        onChange={(e) =>
          setEditingTask({ ...editingTask, dueDate: e.target.value })
        }
        className="border p-2 w-full mb-3 rounded bg-white"
      />

      <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded mr-2 cursor-pointer">
        Зберегти
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded cursor-pointer"
      >
        Скасувати
      </button>
    </form>
  );
}

TaskEditForm.propTypes = {
  editingTask: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    status: PropTypes.string,
    priority: PropTypes.string,
    dueDate: PropTypes.string,
  }),
  setEditingTask: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
