import { useState } from "react";
import PropTypes from "prop-types";
import { useAuth } from "../context/AuthContext";
import { createProject } from "../appwrite/database";
import toast from "react-hot-toast";

const ProjectCreateForm = ({ onCreated }) => {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active",
    startDate: "",
    endDate: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      description: formData.description || undefined,
      status: formData.status,
      startDate: formData.startDate
        ? new Date(formData.startDate).toISOString()
        : new Date().toISOString(),
      endDate: formData.endDate
        ? new Date(formData.endDate).toISOString()
        : undefined,
      managerId: user?.$id,
    };
    try {
      await createProject(payload);
      toast.success(`Проєкт "${payload.name}" успішно створено`);
      if (typeof onCreated === "function") onCreated();
      setFormData({
        name: "",
        description: "",
        status: "active",
        startDate: "",
        endDate: "",
      });
    } catch (e) {
      alert("Не вдалося створити проєкт: " + (e?.message || e));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        name="name"
        placeholder="Назва"
        value={formData.name}
        onChange={handleChange}
        required
        className="w-full p-2 border border-gray-300 rounded bg-white"
      />

      <input
        type="text"
        name="description"
        placeholder="Опис (необов'язково)"
        value={formData.description}
        onChange={handleChange}
        className="w-full p-2 border border-gray-300 rounded bg-white"
      />

      <div className="flex flex-col md:flex-row gap-4">
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full md:w-1/3 p-2 border border-gray-300 rounded bg-white cursor-pointer"
        >
          <option value="active">active</option>
          <option value="on_hold">on_hold</option>
          <option value="completed">completed</option>
        </select>

        <input
          type="date"
          name="startDate"
          value={formData.startDate}
          onChange={handleChange}
          className="w-full md:w-1/3 p-2 border border-gray-300 rounded bg-white "
        />

        <input
          type="date"
          name="endDate"
          value={formData.endDate}
          onChange={handleChange}
          className="w-full md:w-1/3 p-2 border border-gray-300 rounded bg-white "
        />
      </div>

      <button
        type="submit"
        className="w-full bg-orange-400 hover:bg-orange-500 text-white font-semibold py-2 px-4 rounded cursor-pointer transition"
      >
        Створити проєкт
      </button>
    </form>
  );
};

ProjectCreateForm.propTypes = {
  onCreated: PropTypes.func,
};

export default ProjectCreateForm;
