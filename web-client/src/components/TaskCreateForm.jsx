import PropTypes from "prop-types";
import { STATUS_OPTIONS, PRIORITY_OPTIONS } from "./utils/taskConstants";

export default function TaskCreateForm({ newTask, setNewTask, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="bg-white p-3 rounded-lg shadow mb-4">
      <input
        type="text"
        placeholder="Назва завдання"
        value={newTask.title}
        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
        className="border p-2 w-full mb-2 rounded bg-white"
        required
      />
      <textarea
        placeholder="Опис"
        value={newTask.description}
        onChange={(e) =>
          setNewTask({ ...newTask, description: e.target.value })
        }
        className="border p-2 w-full mb-2 rounded bg-white"
      />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
        <div>
          <label className="block text-sm mb-1">Статус</label>
          <select
            className="border p-2 w-full rounded bg-white cursor-pointer"
            value={newTask.status}
            onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Пріоритет</label>
          <select
            className="border p-2 w-full rounded bg-white cursor-pointer"
            value={newTask.priority}
            onChange={(e) =>
              setNewTask({ ...newTask, priority: e.target.value })
            }
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Deadline</label>
          <input
            type="datetime-local"
            className="border p-2 w-full rounded bg-white"
            value={newTask.dueDate}
            onChange={(e) =>
              setNewTask({ ...newTask, dueDate: e.target.value })
            }
          />
        </div>
      </div>

      <button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded transition-colors duration-200 cursor-pointer shadow-sm">
        Додати завдання
      </button>
    </form>
  );
}

TaskCreateForm.propTypes = {
  newTask: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    status: PropTypes.string,
    priority: PropTypes.string,
    dueDate: PropTypes.string,
  }).isRequired,
  setNewTask: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
