import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getProjects,
  getProjectsByTeam,
  updateProject,
} from "../appwrite/database";
import {
  createTeam,
  getTeamMembers,
  listTeams,
  getUserById,
  inviteMember,
  removeMember,
} from "../appwrite/teams";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

export default function Teams() {
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [membersByTeam, setMembersByTeam] = useState({});
  const [loading, setLoading] = useState(true);

  const [creatingFor, setCreatingFor] = useState("");
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");

  async function enrichMemberships(memberships) {
    const base = memberships || [];
    const rich = await Promise.all(
      base.map(async (m) => {
        if (!m.userName && m.userId) {
          const u = await getUserById(m.userId);
          if (u && (u.name || u.email)) {
            return {
              ...m,
              userName: u.name || m.userName,
              userEmail: u.email || m.userEmail,
            };
          }
        }
        return m;
      })
    );
    return rich;
  }
  useEffect(() => {
    (async () => {
      try {
        const teamRes = await listTeams();
        const allTeams = teamRes.teams || teamRes.documents || [];
        setTeams(allTeams);

        const own = await getProjects(user.$id).catch(() => ({
          documents: [],
        }));
        const projectSets = await Promise.all(
          allTeams.map((t) =>
            getProjectsByTeam(t.$id).catch(() => ({ documents: [] }))
          )
        );

        const combined = [...(own.documents || [])];
        projectSets.forEach((r) => combined.push(...(r.documents || [])));

        const map = new Map();
        combined.forEach((p) => map.set(p.$id, p));

        setProjects([...map.values()]);

        const entries = await Promise.all(
          allTeams.map(async (t) => {
            try {
              const mRes = await getTeamMembers(t.$id);
              return [t.$id, await enrichMemberships(mRes.memberships || [])];
            } catch {
              return [t.$id, []];
            }
          })
        );

        setMembersByTeam(Object.fromEntries(entries));
      } finally {
        setLoading(false);
      }
    })();
  }, [user.$id]);

  async function handleCreateTeamForProject(e) {
    e.preventDefault();
    if (!creatingFor) return;

    const project = projects.find((p) => p.$id === creatingFor);
    if (!project) return;

    const team = await createTeam(project.name);
    await updateProject(project.$id, { teamId: team.$id });

    toast.success("✅ Команду створено!");

    const [projRes, teamRes, membersRes] = await Promise.all([
      getProjects(user.$id).catch(() => ({ documents: [] })),
      listTeams().catch(() => ({ teams: [] })),
      getTeamMembers(team.$id).catch(() => ({ memberships: [] })),
    ]);

    setProjects(projRes.documents || []);
    const newTeams = teamRes.teams || teamRes.documents || [];
    setTeams(newTeams);

    const rich = await enrichMemberships(membersRes.memberships || []);
    setMembersByTeam((prev) => ({ ...prev, [team.$id]: rich }));
    setCreatingFor("");
    setExpandedTeam(team.$id);
  }

  async function handleInvite(teamId) {
    if (!inviteEmail.trim()) return;

    const promise = inviteMember(teamId, inviteEmail.trim(), ["member"]);

    toast.promise(promise, {
      loading: "⏳ Надсилаємо...",
      success: `📨 Запрошення надіслано`,
      error: "❌ Помилка надсилання запрошення",
    });

    try {
      await promise;
      setInviteEmail("");

      const [mRes, projRes, teamRes] = await Promise.all([
        getTeamMembers(teamId).catch(() => ({ memberships: [] })),
        getProjects(user.$id).catch(() => ({ documents: [] })),
        listTeams().catch(() => ({ teams: [] })),
      ]);
      const rich = await enrichMemberships(mRes.memberships || []);
      setMembersByTeam((prev) => ({ ...prev, [teamId]: rich }));
      setProjects(projRes.documents || []);
      setTeams(teamRes.teams || teamRes.documents || []);
    } catch (e) {
      console.warn("Invite refresh failed:", e?.message || e);
    }
  }

  async function handleRemove(teamId, memberId) {
    const member = (membersByTeam[teamId] || []).find(
      (m) => m.$id === memberId
    );
    if ((member?.roles || []).includes("owner")) {
      toast.error("Неможливо видалити власника команди");
      return;
    }
    if (!confirm("Видалити учасника?")) return;

    const promise = removeMember(teamId, memberId);

    toast.promise(promise, {
      loading: "🗑️ Видаляємо...",
      success: "✅ Видалено",
      error: "❌ Не вдалося видалити",
    });

    try {
      await promise;
      const [mRes, projRes] = await Promise.all([
        getTeamMembers(teamId).catch(() => ({ memberships: [] })),
        getProjects(user.$id).catch(() => ({ documents: [] })),
      ]);
      const rich = await enrichMemberships(mRes.memberships || []);
      setMembersByTeam((prev) => ({ ...prev, [teamId]: rich }));
      setProjects(projRes.documents || []);
    } catch (e) {
      console.warn("Remove refresh failed:", e?.message || e);
    }
  }

  const projectByTeam = useMemo(() => {
    const map = new Map();
    projects.forEach((p) => {
      if (p.teamId) map.set(p.teamId, p);
    });
    return map;
  }, [projects]);

  const projectsWithoutTeam = useMemo(() => {
    const teamIds = new Set(teams.map((t) => t.$id));
    return projects.filter((p) => !p.teamId || !teamIds.has(p.teamId));
  }, [projects, teams]);

  if (loading) return <p className="text-gray-500">Завантаження...</p>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-3">
          Створити команду для проєкту
        </h3>

        {projectsWithoutTeam.length === 0 ? (
          <p className="text-gray-500">Немає проєктів без команди</p>
        ) : (
          <form
            onSubmit={handleCreateTeamForProject}
            className="flex gap-2 items-center"
          >
            <select
              value={creatingFor}
              onChange={(e) => setCreatingFor(e.target.value)}
              className="border p-2 rounded flex-1 bg- cursor-pointer"
            >
              <option value="">Оберіть проєкт</option>
              {projectsWithoutTeam.map((p) => (
                <option key={p.$id} value={p.$id}>
                  {p.name}
                </option>
              ))}
            </select>

            <button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded transition-colors duration-200 cursor-pointer shadow-sm">
              Створити
            </button>
          </form>
        )}
      </div>

      <div className="space-y-4">
        {teams.length === 0 ? (
          <p className="text-gray-500 text-center">Команд ще немає</p>
        ) : (
          teams
            .filter((t) => projectByTeam.has(t.$id))
            .map((t) => {
              const project = projectByTeam.get(t.$id);
              const members = membersByTeam[t.$id] || [];

              const sortedMembers = [...members].sort((a, b) => {
                const ao = (a.roles || []).includes("owner");
                const bo = (b.roles || []).includes("owner");
                return ao === bo ? 0 : ao ? -1 : 1;
              });

              const owner = sortedMembers.find((m) =>
                (m.roles || []).includes("owner")
              );
              const ownerName =
                owner?.userName ||
                owner?.userEmail ||
                (owner?.userId ? `Користувач ${owner.userId.slice(-6)}` : "—");

              const isOpen = expandedTeam === t.$id;

              return (
                <div key={t.$id} className="bg-white p-4 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold">{t.name}</h4>

                      <p className="text-sm text-gray-500">
                        Власник: {owner ? `${ownerName} (owner)` : "—"}
                      </p>

                      {project ? (
                        <p className="text-sm text-gray-500">
                          Проєкт:{" "}
                          <Link
                            to={`/dashboard/projects/${project.$id}`}
                            className="text-orange-500 hover:underline"
                          >
                            {project.name}
                          </Link>
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500">
                          Не прив’язано до проєкту
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => setExpandedTeam(isOpen ? null : t.$id)}
                      className="bg-gray-800 text-white px-3 py-1.5 rounded hover:bg-black cursor-pointer"
                    >
                      {isOpen ? "Закрити" : "Керувати"}
                    </button>
                  </div>

                  {isOpen && (
                    <div className="mt-4 p-4 bg-gray-50 border rounded-lg">
                      <div className="flex gap-2 mb-4">
                        <input
                          type="email"
                          placeholder="Email користувача"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="border p-2 rounded flex-1"
                        />
                        <button
                          onClick={() => handleInvite(t.$id)}
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 cursor-pointer"
                        >
                          Запросити
                        </button>
                      </div>

                      <h4 className="font-semibold mb-2">Учасники:</h4>

                      {sortedMembers.length === 0 ? (
                        <p className="text-gray-500">Немає учасників</p>
                      ) : (
                        <ul className="space-y-2">
                          {sortedMembers.map((m) => {
                            const mName =
                              m.userName ||
                              m.userEmail ||
                              (m.userId
                                ? `Користувач ${m.userId.slice(-6)}`
                                : "—");
                            const role = (m.roles || []).includes("owner")
                              ? "owner"
                              : "member";

                            return (
                              <li
                                key={m.$id}
                                className="flex items-center bg-white p-2 rounded shadow"
                              >
                                <span>
                                  {mName} ({role})
                                </span>

                                {role !== "owner" && (
                                  <button
                                    onClick={() => handleRemove(t.$id, m.$id)}
                                    className="ml-auto bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 cursor-pointer"
                                  >
                                    Видалити
                                  </button>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}
