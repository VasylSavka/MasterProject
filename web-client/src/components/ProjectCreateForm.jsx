import PropTypes from "prop-types";
import { useState } from "react";
import { createProject } from "../appwrite/database";
import toast from "react-hot-toast";

export default function ProjectCreateForm({ managerId, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "active",
    startDate: "",
    endDate: "",
  });

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      name: form.name,
      description: form.description || undefined,
      status: form.status,
      startDate: form.startDate
        ? new Date(form.startDate).toISOString()
        : new Date().toISOString(),
      endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
      managerId,
    };

    const promise = createProject(payload);
    toast.promise(promise, {
      loading: "⏳ Створення проєкту...",
      success: `✅ Проєкт "${payload.name}" створено`,
      error: "❌ Не вдалося створити проєкт",
    });

    try {
      await promise;
      setForm({ name: "", description: "", status: "active", startDate: "", endDate: "" });
      if (onCreated) onCreated();
    } catch (e) {
      console.warn("Create project failed:", e?.message || e);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-6">
      <h2 className="text-lg font-semibold mb-3">Створити новий проєкт</h2>
      <input
        type="text"
        placeholder="Назва"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="border p-2 w-full mb-3 rounded"
        required
      />
      <textarea
        placeholder="Опис (необов’язково)"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="border p-2 w-full mb-3 rounded"
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <div>
          <label className="block mb-1 text-sm">Статус</label>
          <select
            className="border p-2 w-full rounded"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            required
          >
            <option value="active">active</option>
            <option value="on_hold">on_hold</option>
            <option value="completed">completed</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 text-sm">Початок</label>
          <input
            type="datetime-local"
            className="border p-2 w-full rounded"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
        </div>
        <div>
          <label className="block mb-1 text-sm">Кінець (необов’язково)</label>
          <input
            type="datetime-local"
            className="border p-2 w-full rounded"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />
        </div>
      </div>
      <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
        Додати проєкт
      </button>
    </form>
  );
}

ProjectCreateForm.propTypes = {
  managerId: PropTypes.string,
  onCreated: PropTypes.func,
};
