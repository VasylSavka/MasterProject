// src/components/TasksPanel.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import PropTypes from "prop-types";
import useTasks from "./hooks/useTasks";
import useTaskFilters from "./hooks/useTaskFilters";
import TaskCreateForm from "./TaskCreateForm";
import TaskEditForm from "./TaskEditForm";
import TaskFilters from "./TaskFilters";
import TaskItem from "./TaskItem";
import ProjectDeleteButton from "./ProjectDeleteButton";

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
    filteredTasks,
  } = useTaskFilters(tasks);

  /* =====================================================
      CREATE
  ====================================================== */
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

  /* =====================================================
      UPDATE
  ====================================================== */
  async function handleUpdate(e) {
    e.preventDefault();
    try {
      await updateTaskById(editingTask.$id, editingTask);
      setEditingTask(null);
    } catch {}
  }

  /* =====================================================
      DELETE
  ====================================================== */
  async function handleDelete(id) {
    if (!confirm("Видалити завдання?")) return;
    try {
      await deleteTaskById(id);
    } catch {}
  }

  /* =====================================================
      RENDER
  ====================================================== */
  return (
    <div className="bg-gray-100 p-4 rounded-lg mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Завдання</h3>
        <ProjectDeleteButton projectId={projectId} />
      </div>

      {/* Фільтри */}
      <TaskFilters
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterPriority={filterPriority}
        setFilterPriority={setFilterPriority}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      {/* Створення */}
      <TaskCreateForm
        newTask={newTask}
        setNewTask={setNewTask}
        onSubmit={handleCreate}
      />

      {/* Відображення */}
      {editingTask ? (
        /* Редагування */
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
          Немає завдань за вибраними параметрами
        </p>
      )}
    </div>
  );
}

TasksPanel.propTypes = {
  projectId: PropTypes.string,
};
