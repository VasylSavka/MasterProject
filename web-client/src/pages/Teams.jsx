import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getProjects, getProjectsByTeam, updateProject } from "../appwrite/database";
import { createTeam, getTeamMembers, listTeams, getUserById } from "../appwrite/teams";
import { Link } from "react-router-dom";

export default function Teams() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [membersByTeam, setMembersByTeam] = useState({});
  const [loading, setLoading] = useState(true);
  const [creatingFor, setCreatingFor] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const teamRes = await listTeams();
        const allTeams = teamRes.teams || teamRes.documents || [];
        setTeams(allTeams);

        // for each team, fetch projects bound to it (works for members due to team read permission)
        const projectSets = await Promise.all(
          allTeams.map((t) => getProjectsByTeam(t.$id).catch(() => ({ documents: [] })))
        );
        const merged = [];
        projectSets.forEach((res) => merged.push(...(res.documents || [])));
        // also include own projects where ти менеджер (щоб не втратити їх)
        const own = await getProjects(user.$id).catch(() => ({ documents: [] }));
        const byId = new Map();
        [...merged, ...(own.documents || [])].forEach((p) => byId.set(p.$id, p));
        setProjects([...byId.values()]);

        // fetch members for each team, збагачення імен
        const entries = await Promise.all(
          allTeams.map(async (t) => {
            try {
              const mRes = await getTeamMembers(t.$id);
              const base = mRes.memberships || [];
              const rich = await Promise.all(
                base.map(async (m) => {
                  if (!m.userName && m.userId) {
                    const u = await getUserById(m.userId);
                    if (u && u.name) return { ...m, userName: u.name, userEmail: u.email || m.userEmail };
                  }
                  return m;
                })
              );
              return [t.$id, rich];
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

    // refresh lists
    const [projRes, teamRes] = await Promise.all([
      getProjects(user.$id),
      listTeams(),
    ]);
    setProjects(projRes.documents);
    setTeams(teamRes.teams || teamRes.documents || []);

    // fetch members for the new team
    const mRes = await getTeamMembers(team.$id).catch(() => ({ memberships: [] }));
    setMembersByTeam((prev) => ({ ...prev, [team.$id]: mRes.memberships || [] }));
    setCreatingFor("");
  }

  const projectsWithoutTeam = useMemo(
    () => projects.filter((p) => !p.teamId),
    [projects]
  );

  const projectByTeam = useMemo(() => {
    const map = new Map();
    projects.forEach((p) => {
      if (p.teamId) map.set(p.teamId, p);
    });
    return map;
  }, [projects]);

  if (loading) return <p className="text-gray-500">Завантаження...</p>;

  return (
    <div className="space-y-6">
      {/* Створити команду для проєкту без команди */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-3">Створити команду для проєкту</h3>
        {projectsWithoutTeam.length === 0 ? (
          <p className="text-gray-500">Немає проєктів без команди</p>
        ) : (
          <form onSubmit={handleCreateTeamForProject} className="flex gap-2">
            <select
              value={creatingFor}
              onChange={(e) => setCreatingFor(e.target.value)}
              className="border p-2 rounded flex-1"
            >
              <option value="">Оберіть проєкт</option>
              {projectsWithoutTeam.map((p) => (
                <option key={p.$id} value={p.$id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Створити команду
            </button>
          </form>
        )}
      </div>

      {/* Список команд */}
      <div className="space-y-4">
        {teams.length === 0 ? (
          <p className="text-gray-500 text-center">Команд ще немає</p>
        ) : (
          teams.map((t) => {
            const project = projectByTeam.get(t.$id);
            const mem = (membersByTeam[t.$id] || []).slice().sort((a, b) => {
              const ao = (a.roles || []).includes("owner");
              const bo = (b.roles || []).includes("owner");
              return ao === bo ? 0 : ao ? -1 : 1;
            });
            const owner = mem.find((m) => (m.roles || []).includes("owner"));
            const ownerBase = owner?.userName || owner?.userEmail || (owner?.userId ? `Користувач ${owner.userId.slice(-6)}` : "—");
            return (
              <div key={t.$id} className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold">{t.name}</h4>
                    <p className="text-sm text-gray-500">
                      Власник: {owner ? `${ownerBase} (owner)` : "—"}
                    </p>
                    {project ? (
                      <p className="text-sm text-gray-500">
                        Проєкт: <Link to={`/dashboard/projects/${project.$id}`} className="text-blue-600 hover:underline">{project.name}</Link>
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">Не прив’язано до проєкту</p>
                    )}
                  </div>
                  {project && (
                    <Link
                      to={`/dashboard/projects/${project.$id}`}
                      className="bg-gray-800 text-white px-3 py-1.5 rounded hover:bg-black"
                    >
                      Керувати
                    </Link>
                  )}
                </div>

                {/* Учасники: нумерований список ім'я (роль) */}
                <div className="mt-3">
                  {mem.length === 0 ? (
                    <p className="text-gray-500">Учасників поки немає</p>
                  ) : (
                    <ol className="list-decimal ml-5 space-y-1">
                      {mem.map((m) => {
                        const base = m.userName || m.userEmail || (m.userId ? `Користувач ${m.userId.slice(-6)}` : "—");
                        const role = (m.roles || []).includes("owner") ? "owner" : "member";
                        return <li key={m.$id}>{base} ({role})</li>;
                      })}
                    </ol>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
