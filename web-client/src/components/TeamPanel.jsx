import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { toast } from "react-hot-toast";
import {
  getTeamMembers,
  removeMember,
  createTeam,
  inviteMember,
  getUserById,
} from "../appwrite/teams";
import {
  updateProject,
  ensureProjectsTeamIdAttribute,
  addTeamReadPermission,
} from "../appwrite/database";
import { useAuth } from "../context/AuthContext";
export default function TeamPanel({ project }) {
  const { user } = useAuth();
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
      const base = res.memberships || [];
      // Збагачуємо ім’я користувача, якщо воно порожнє
      const enriched = await Promise.all(
        base.map(async (m) => {
          if (!m.userName && m.userId) {
            const u = await getUserById(m.userId);
            if (u && u.name) {
              return {
                ...m,
                userName: u.name,
                userEmail: u.email || m.userEmail,
              };
            }
          }
          return m;
        })
      );
      setMembers(enriched);
      return enriched;
    } catch (err) {
      console.warn("Помилка отримання учасників:", err?.message || err);
      // уникаємо дублювання тостів; тихо провалюємось і показуємо порожній список
      return [];
    }
  }

  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  async function fetchMembersWithRetry(expectedMin = null, attempts = 5, waitMs = 600) {
    for (let i = 0; i < attempts; i++) {
      const list = await fetchMembers();
      if (expectedMin == null || list.length >= expectedMin) return list;
      await delay(waitMs);
    }
    return members;
  }

  // 🧱 Створити команду для проєкту (якщо ще не існує)
  async function handleCreateTeam() {
    try {
      const newTeam = await createTeam(project.name);
      setTeamId(newTeam.$id);
      try {
        await updateProject(project.$id, { teamId: newTeam.$id });
      } catch (err) {
        // If schema is missing teamId, attempt to create attribute and retry once
        const msg = err?.message || "";
        if (
          /Unknown attribute:\s*"teamId"/i.test(msg) ||
          /document_invalid_structure/i.test(msg)
        ) {
          const ok = await ensureProjectsTeamIdAttribute();
          if (ok) {
            // small delay to let attribute become available
            await new Promise((r) => setTimeout(r, 800));
            await updateProject(project.$id, { teamId: newTeam.$id });
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }
      // додати право читання для всієї команди до документа проекту
      try {
        await addTeamReadPermission(project, newTeam.$id);
      } catch (e) {
        console.warn(
          "Не вдалося додати права читання для команди:",
          e?.message || e
        );
      }
      // Після створення одразу підтягнемо учасників (щоб показати owner з ім'ям)
      // Після створення одразу підтягнемо учасників з ретраями (очікуємо власника)
      await fetchMembersWithRetry(1);
      toast.success("✅ Команду створено та прив'язано до проєкту");
    } catch (err) {
      console.error("Create team error:", err);
      toast.error("❌ Помилка створення команди або збереження teamId");
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
    try {
      await doInvite();
      setEmail("");
      // Після створення membership дочекаємось появи нового учасника
      await fetchMembersWithRetry((members?.length || 0) + 1);
    } catch {
      // no-op — тости вже показані
    }
  }

  // ❌ Видалити користувача
  async function handleRemove(memberId) {
    const member = (members || []).find((m) => m.$id === memberId);
    const isOwner = (member?.roles || []).includes("owner");
    if (isOwner) {
      toast.error("Неможливо видалити власника команди");
      return;
    }
    if (!confirm("Видалити учасника з команди?")) return;
    toast.promise(removeMember(teamId, memberId), {
      loading: "🗑️ Видаляємо...",
      success: "✅ Учасника видалено",
      error: "❌ Помилка видалення учасника",
    });
    await fetchMembers();
  }

  const orderedMembers = useMemo(() => {
    const withDisplay = (m) => {
      const isCurrent = m.userId && user && m.userId === user.$id;
      const baseName = isCurrent
        ? user.name
        : m.userName ||
          m.userEmail ||
          `Користувач ${m.userId?.slice(-6) || "?"}`;
      const isOwner = (m.roles || []).includes("owner");
      const roleLabel = isOwner ? "owner" : "member";
      return {
        ...m,
        _displayName: `${baseName} (${roleLabel})`,
        _isOwner: isOwner,
        _roleLabel: roleLabel,
      };
    };
    const mapped = (members || []).map(withDisplay);
    // owner першим
    return mapped.sort((a, b) =>
      a._isOwner === b._isOwner ? 0 : a._isOwner ? -1 : 1
    );
  }, [members, user]);

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
          {orderedMembers.length > 0 ? (
            <ol className="space-y-2 list-decimal ml-5">
              {orderedMembers.map((m) => (
                <li
                  key={m.$id}
                  className="bg-white p-3 rounded-lg shadow flex items-center"
                >
                  <span className="font-medium">{m._displayName}</span>
                  {!(m.roles || []).includes("owner") && (
                    <button
                      onClick={() => handleRemove(m.$id)}
                      className="ml-auto bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Видалити
                    </button>
                  )}
                </li>
              ))}
            </ol>
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
    $id: PropTypes.string.isRequired,
    teamId: PropTypes.string,
  }).isRequired,
};
