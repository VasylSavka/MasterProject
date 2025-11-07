import PropTypes from "prop-types";
import { STATUS_OPTIONS, PRIORITY_OPTIONS } from "./utils/taskConstants";

export default function TaskFilters({
  filterStatus,
  setFilterStatus,
  filterPriority,
  setFilterPriority,
  sortBy,
  setSortBy,
  searchText,
  setSearchText,
}) {
  return (
    <div className="flex flex-wrap gap-3 mb-4 items-center">
      <input
        type="text"
        placeholder="Пошук завдання"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        className="border p-2 rounded bg-white flex-1 min-w-[180px]"
      />

      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="border p-2 rounded bg-white cursor-pointer"
      >
        <option value="all">Всі статуси</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        value={filterPriority}
        onChange={(e) => setFilterPriority(e.target.value)}
        className="border p-2 rounded bg-white cursor-pointer"
      >
        <option value="all">Всі пріоритети</option>
        {PRIORITY_OPTIONS.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        className="border p-2 rounded bg-white cursor-pointer"
      >
        <option value="created">За створенням</option>
        <option value="deadline">За дедлайном</option>
        <option value="priority">За пріоритетом</option>
      </select>
    </div>
  );
}

TaskFilters.propTypes = {
  filterStatus: PropTypes.string.isRequired,
  setFilterStatus: PropTypes.func.isRequired,
  filterPriority: PropTypes.string.isRequired,
  setFilterPriority: PropTypes.func.isRequired,
  sortBy: PropTypes.string.isRequired,
  setSortBy: PropTypes.func.isRequired,
  searchText: PropTypes.string.isRequired,
  setSearchText: PropTypes.func.isRequired,
};
