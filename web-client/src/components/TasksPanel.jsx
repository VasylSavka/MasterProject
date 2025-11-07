import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import PropTypes from "prop-types";
import useTasks from "./hooks/useTasks";
import useTaskFilters from "./hooks/useTaskFilters";
import TaskCreateForm from "./TaskCreateForm";
import TaskEditForm from "./TaskEditForm";
import TaskFilters from "./TaskFilters";
import TaskItem from "./TaskItem";

export default function TasksPanel({ projectId }) {
  const { user } = useAuth();
  const { tasks, createTaskForProject, updateTaskById, deleteTaskById } =
    useTasks(projectId, user);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: "",
  });

  const [editingTask, setEditingTask] = useState(null);
  const {
    filterStatus,
    setFilterStatus,
    filterPriority,
    setFilterPriority,
    sortBy,
    setSortBy,
    searchText,
    setSearchText,
    filteredTasks,
  } = useTaskFilters(tasks);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await createTaskForProject(newTask);
      setNewTask({
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        dueDate: "",
      });
    } catch {}
  }

  async function handleUpdate(e) {
    e.preventDefault();
    try {
      await updateTaskById(editingTask.$id, editingTask);
      setEditingTask(null);
    } catch {}
  }

  async function handleDelete(id) {
    if (!confirm("Видалити завдання?")) return;
    try {
      await deleteTaskById(id);
    } catch {}
  }

  return (
    <div className="bg-gray-100 p-4 rounded-lg mt-4">
      <TaskCreateForm
        newTask={newTask}
        setNewTask={setNewTask}
        onSubmit={handleCreate}
      />

      <TaskFilters
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterPriority={filterPriority}
        setFilterPriority={setFilterPriority}
        sortBy={sortBy}
        setSortBy={setSortBy}
        searchText={searchText}
        setSearchText={setSearchText}
      />

      {editingTask ? (
        <TaskEditForm
          editingTask={editingTask}
          setEditingTask={setEditingTask}
          onSubmit={handleUpdate}
          onCancel={() => setEditingTask(null)}
        />
      ) : filteredTasks.length > 0 ? (
        <div className="space-y-3">
          {filteredTasks.map((t) => (
            <TaskItem
              key={t.$id}
              task={t}
              onEdit={setEditingTask}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center">
          Немає завдань для відображення
        </p>
      )}
    </div>
  );
}

TasksPanel.propTypes = {
  projectId: PropTypes.string,
};
