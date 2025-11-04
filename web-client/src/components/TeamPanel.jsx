import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { toast } from "react-hot-toast";
import { getTeamMembers, removeMember, createTeam, inviteMember } from "../appwrite/teams";
import { Teams } from "appwrite";
import client from "../appwrite/client";
export default function TeamPanel({ project }) {
  const [members, setMembers] = useState([]);
  const [email, setEmail] = useState("");
  const [teamId, setTeamId] = useState(project.teamId || null);

  // 🧭 Завантаження учасників команди
  useEffect(() => {
    if (teamId) fetchMembers();
  }, [teamId]);

  async function fetchMembers() {
    try {
      const res = await getTeamMembers(teamId);
      setMembers(res.memberships || []);
    } catch (err) {
      console.error("Помилка отримання учасників:", err);
      toast.error("Не вдалося завантажити учасників");
    }
  }

  // 🧱 Створити команду для проєкту (якщо ще не існує)
  async function handleCreateTeam() {
    try {
      const newTeam = await createTeam(project.name);
      setTeamId(newTeam.$id);
      toast.success("✅ Команду створено");
    } catch (err) {
      toast.error("❌ Помилка створення команди");
    }
  }

  // ✉️ Запросити користувача
  async function handleInvite(e) {
    e.preventDefault();
    if (!teamId) {
      toast.error("Спочатку створіть команду");
      return;
    }
    const doInvite = () => inviteMember(teamId, email.trim(), ["member"]);

    toast.promise(doInvite(), {
      loading: "⏳ Надсилаємо запрошення...",
      success: `📨 Запрошення надіслано: ${email}`,
      error: "❌ Не вдалося запросити користувача",
    });
    setEmail("");
    fetchMembers();
  }

  // ❌ Видалити користувача
  async function handleRemove(memberId) {
    if (!confirm("Видалити учасника з команди?")) return;
    toast.promise(removeMember(teamId, memberId), {
      loading: "🗑️ Видаляємо...",
      success: "✅ Учасника видалено",
      error: "❌ Помилка видалення учасника",
    });
    fetchMembers();
  }

  return (
    <div className="bg-gray-100 p-4 rounded-lg mt-4">
      <h3 className="text-lg font-semibold mb-3">👥 Команда проєкту</h3>

      {!teamId ? (
        <button
          onClick={handleCreateTeam}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Створити команду
        </button>
      ) : (
        <>
          {/* 📧 Форма запрошення */}
          <form onSubmit={handleInvite} className="flex gap-2 mb-4">
            <input
              type="email"
              placeholder="Email користувача"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border p-2 rounded flex-1"
              required
            />
            <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              Запросити
            </button>
          </form>

          {/* 📋 Список учасників */}
          {members.length > 0 ? (
            <ul className="space-y-2">
              {members.map((m) => (
                <li
                  key={m.$id}
                  className="bg-white p-3 rounded-lg shadow flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{m.userName || m.userEmail}</p>
                    <p className="text-sm text-gray-500">
                      {m.roles.join(", ")}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(m.$id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Видалити
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center">Команда поки що порожня</p>
          )}
        </>
      )}
    </div>
  );
}

TeamPanel.propTypes = {
  project: PropTypes.shape({
    name: PropTypes.string.isRequired,
    teamId: PropTypes.string,
  }).isRequired,
};
