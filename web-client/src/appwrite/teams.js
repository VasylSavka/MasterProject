// src/appwrite/teams.js
import { Teams, ID } from "appwrite";
import client from "./client";

// Centralized admin config (for REST calls)
const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const apiKey = import.meta.env.VITE_APPWRITE_API_KEY;

const adminHeaders =
  apiKey && projectId
    ? {
        "Content-Type": "application/json",
        "X-Appwrite-Project": projectId,
        "X-Appwrite-Key": apiKey,
      }
    : null;

const teams = new Teams(client);

/* =====================================================
   CREATE TEAM
===================================================== */
export async function createTeam(name) {
  try {
    return await teams.create(ID.unique(), name);
  } catch (err) {
    console.error("Помилка створення команди:", err);
    throw err;
  }
}

/* =====================================================
   LIST TEAMS
===================================================== */
export async function listTeams() {
  try {
    return await teams.list();
  } catch (err) {
    console.error("Помилка отримання команд:", err);
    throw err;
  }
}

/* =====================================================
   LIST MEMBERS
===================================================== */
export async function getTeamMembers(teamId) {
  try {
    return await teams.listMemberships(teamId);
  } catch (err) {
    console.error("Помилка отримання учасників:", err);
    throw err;
  }
}

/* =====================================================
   INVITE MEMBER (REST variant)
===================================================== */
export async function inviteMember(teamId, email, roles = ["member"]) {
  try {
    const cleanEmail = email.trim();

    if (!endpoint || !adminHeaders) {
      throw new Error("Admin endpoint or headers missing");
    }

    // Get all users
    const usersRes = await fetch(`${endpoint}/users`, {
      headers: adminHeaders,
    });
    const usersList = await usersRes.json();
    const user = usersList.users?.find((u) => u.email === cleanEmail);

    if (!user) throw new Error(`Користувача ${cleanEmail} не знайдено`);

    const userId = user.$id || user.id;

    // Create membership
    const res = await fetch(`${endpoint}/teams/${teamId}/memberships`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({ userId, roles }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      // Some Appwrite setups may return 500 even though membership is created.
      // Verify by listing memberships and checking presence.
      try {
        const verify = await getTeamMembers(teamId);
        const exists = (verify.memberships || []).find((m) => m.userId === userId);
        if (exists) return exists; // treat as success
      } catch {}
      throw new Error(data.message || `Помилка створення membership (HTTP ${res.status})`);
    }

    return data;
  } catch (err) {
    console.error("Помилка запрошення:", err);
    throw err;
  }
}

/* =====================================================
   REMOVE MEMBER
===================================================== */
export async function removeMember(teamId, membershipId) {
  try {
    return await teams.deleteMembership(teamId, membershipId);
  } catch (err) {
    console.error("Помилка видалення:", err);
    throw err;
  }
}

/* =====================================================
   DELETE TEAM (admin)
===================================================== */
export async function deleteTeam(teamId) {
  // Use admin REST to ensure deletion even without user session permissions
  if (!endpoint || !adminHeaders) {
    throw new Error("Admin endpoint/headers are not configured");
  }
  try {
    const res = await fetch(`${endpoint}/teams/${teamId}`, {
      method: "DELETE",
      headers: adminHeaders,
    });
    if (res.ok) return true;
    // Tolerate 404 (already deleted)
    if (res.status === 404) return true;
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Не вдалося видалити команду (HTTP ${res.status})`);
  } catch (err) {
    console.error("Помилка видалення команди:", err);
    throw err;
  }
}

/* =====================================================
   CONFIRM MEMBERSHIP
===================================================== */
export async function confirmMembership(teamId, membershipId, userId, secret) {
  try {
    return await client.call(
      "patch",
      `/teams/${teamId}/memberships/${membershipId}/status`,
      { "content-type": "application/json" },
      { userId, secret }
    );
  } catch (err) {
    console.error("Помилка підтвердження участі:", err);
    throw err;
  }
}

/* =====================================================
   GET USER BY ID (REST, requires apiKey)
===================================================== */
export async function getUserById(userId) {
  if (!endpoint || !adminHeaders) return null;

  try {
    const res = await fetch(`${endpoint}/users/${userId}`, {
      headers: adminHeaders,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/* =====================================================
 ✅ NEW: UPDATE MEMBER ROLE (owner <-> member)
===================================================== */
export async function updateMemberRole(teamId, membershipId, newRole) {
  if (!endpoint || !adminHeaders) {
    throw new Error("Admin headers not configured");
  }

  const roles = [newRole]; // Appwrite expects array

  const res = await fetch(
    `${endpoint}/teams/${teamId}/memberships/${membershipId}`,
    {
      method: "PATCH",
      headers: adminHeaders,
      body: JSON.stringify({ roles }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    console.error("Помилка зміни ролі:", data);
    throw new Error(data.message || "Не вдалося змінити роль");
  }

  return data;
}

export default teams;
