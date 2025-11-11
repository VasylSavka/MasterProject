import client, { teams as teamsSDK } from "./client";
import { ID } from "appwrite";

const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!;
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!;
const apiKey = process.env.EXPO_PUBLIC_APPWRITE_API_KEY!;

const adminHeaders =
  apiKey && projectId
    ? {
        "Content-Type": "application/json",
        "X-Appwrite-Project": projectId,
        "X-Appwrite-Key": apiKey,
      }
    : null;

const adminFetch = async (url: string, init: RequestInit = {}) => {
  if (!endpoint || !adminHeaders) {
    throw new Error("Admin endpoint or headers missing");
  }
  return await fetch(url, {
    ...init,
    headers: {
      ...adminHeaders,
      ...(init.headers || {}),
    },
    credentials: "omit",
  });
};

async function requestUsers(query: string) {
  if (!endpoint) throw new Error("Admin endpoint or headers missing");
  const url = `${endpoint}/users${query}`;
  const res = await adminFetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as any).message || "Не вдалося отримати список користувачів"
    );
  }
  return (data as any).users || (data as any).documents || [];
}

async function findUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  const eqQuery = encodeURIComponent(`equal("email","${normalized}")`);
  try {
    const [exact] = await requestUsers(`?queries[]=${eqQuery}&limit=1`);
    if (exact) return exact;
  } catch (error: any) {
    console.warn(
      "Запит користувача за email (equal) не вдався:",
      error?.message || error
    );
  }
  try {
    const candidates = (await requestUsers(
      `?search=${encodeURIComponent(normalized)}&limit=100`
    )) as any[];
    return (
      candidates.find(
        (u: any) => (u.email || "").toLowerCase() === normalized
      ) || null
    );
  } catch (error: any) {
    console.warn(
      "Запит користувача за email (search) не вдався:",
      error?.message || error
    );
    throw error;
  }
}

export async function createTeam(name: string) {
  return await teamsSDK.create(ID.unique(), name);
}

export async function listTeams() {
  return await teamsSDK.list();
}

export async function getTeamMembers(teamId: string) {
  return await teamsSDK.listMemberships(teamId);
}

export async function inviteMember(
  teamId: string,
  email: string,
  roles: string[] = ["member"]
) {
  const cleanEmail = email.trim();
  if (!endpoint || !adminHeaders)
    throw new Error("Admin endpoint or headers missing");
  const user = await findUserByEmail(cleanEmail);
  if (!user) throw new Error(`Користувача ${cleanEmail} не знайдено`);
  const userId = user.$id || user.id;

  const res = await adminFetch(`${endpoint}/teams/${teamId}/memberships`, {
    method: "POST",
    body: JSON.stringify({ userId, roles }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    try {
      const verify = await getTeamMembers(teamId);
      const exists = (verify.memberships || []).find(
        (m: any) => m.userId === userId
      );
      if (exists) return exists;
    } catch {}
    throw new Error(
      (data as any).message ||
        `Помилка створення membership (HTTP ${res.status})`
    );
  }
  return data;
}

export async function removeMember(teamId: string, membershipId: string) {
  return await teamsSDK.deleteMembership(teamId, membershipId);
}

export async function deleteTeam(teamId: string) {
  if (!endpoint || !adminHeaders)
    throw new Error("Admin endpoint/headers are not configured");
  const res = await adminFetch(`${endpoint}/teams/${teamId}`, {
    method: "DELETE",
  });
  if (res.ok || res.status === 404) return true;
  const data = await res.json().catch(() => ({}));
  throw new Error(
    (data as any).message || `Не вдалося видалити команду (HTTP ${res.status})`
  );
}

export async function confirmMembership(
  teamId: string,
  membershipId: string,
  userId: string,
  secret: string
) {
  return await client.call(
    "patch",
    `/teams/${teamId}/memberships/${membershipId}/status`,
    { "content-type": "application/json" },
    { userId, secret }
  );
}

export async function getUserById(userId: string) {
  if (!endpoint || !adminHeaders) return null;
  try {
    const res = await adminFetch(`${endpoint}/users/${userId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function enrichMemberships(
  memberships: any[],
  currentUser?: { $id: string; name?: string; email?: string },
  usersIndex?: Record<string, { name?: string; email?: string }>
) {
  const list = Array.isArray(memberships) ? memberships : [];
  const cache = new Map<string, any>();

  const getCachedUser = async (id: string) => {
    if (currentUser && id === currentUser.$id) return currentUser;
    if (usersIndex && usersIndex[id]) return usersIndex[id];
    if (cache.has(id)) return cache.get(id);
    const u = await getUserById(id).catch(() => null);
    if (u) cache.set(id, u);
    return u;
  };

  const enriched = await Promise.all(
    list.map(async (m) => {
      const u = await getCachedUser(m.userId);
      return {
        ...m,
        userName: u?.name || m.userName || null,
        userEmail: u?.email || m.userEmail || null,
      };
    })
  );
  return enriched;
}

export async function listUsersMap(): Promise<
  Record<string, { name?: string; email?: string }>
> {
  if (!endpoint || !adminHeaders) return {};
  const map: Record<string, { name?: string; email?: string }> = {};
  const limit = 100;
  let offset = 0;
  try {
    for (let i = 0; i < 10; i++) {
      const res = await adminFetch(
        `${endpoint}/users?limit=${limit}&offset=${offset}`
      );
      if (!res.ok) break;
      const data = await res.json().catch(() => ({}));
      const users = (data as any).users || (data as any).documents || [];
      users.forEach((u: any) => {
        const id = u.$id || u.id;
        if (id) map[id] = { name: u.name, email: u.email };
      });
      if (users.length < limit) break;
      offset += limit;
    }
  } catch (error: any) {
    console.warn(
      "Не вдалося побудувати індекс користувачів:",
      error?.message || error
    );
  }
  return map;
}

export async function updateMemberRole(
  teamId: string,
  membershipId: string,
  newRole: string
) {
  if (!endpoint || !adminHeaders)
    throw new Error("Admin headers not configured");
  const roles = [newRole];
  const res = await adminFetch(
    `${endpoint}/teams/${teamId}/memberships/${membershipId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ roles }),
    }
  );
  const data = await res.json();
  if (!res.ok)
    throw new Error((data as any).message || "Не вдалося оновити роль");
  return data;
}
