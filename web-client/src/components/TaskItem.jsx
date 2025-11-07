import PropTypes from "prop-types";
import { formatDate } from "./utils/taskHelpers";

export default function TaskItem({ task, onEdit, onDelete }) {
  return (
    <div className="bg-white p-3 rounded-lg shadow flex justify-between items-start">
      <div>
        <h4 className="font-semibold">{task.title}</h4>
        <p className="text-sm text-gray-600">{task.description}</p>
        <p className="text-xs text-gray-400">
          Статус: {task.status} | Пріоритет: {task.priority} | Deadline:{" "}
          {formatDate(task.dueDate)}
        </p>
        <div className="mt-1 text-xs text-gray-500 space-y-0.5">
          <p>
            <span className="font-medium">Створив:</span> {task._createdName} •{" "}
            {formatDate(task.$createdAt)}
          </p>
          <p>
            <span className="font-medium">Останнє оновлення:</span>{" "}
            {task.updatedBy
              ? `${task._updatedName} • ${formatDate(task.$updatedAt)}`
              : "—"}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(task)}
          className="bg-yellow-400 text-white px-2 py-1 rounded hover:bg-yellow-500 cursor-pointer"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(task.$id)}
          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 cursor-pointer"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

TaskItem.propTypes = {
  task: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
