import { Teams, ID } from "appwrite";
import client from "./client";

const teams = new Teams(client);

/** 🧱 Створення нової команди */
export async function createTeam(name) {
  try {
    return await teams.create(ID.unique(), name);
  } catch (err) {
    console.error("Помилка створення команди:", err);
    throw err;
  }
}

/** 👥 Отримати список учасників команди */
export async function getTeamMembers(teamId) {
  try {
    return await teams.listMemberships(teamId);
  } catch (err) {
    console.error("Помилка отримання учасників:", err);
    throw err;
  }
}

/** ✉️ Запросити користувача (локальний варіант без SMTP) */
export async function inviteMember(teamId, email, roles = ["member"]) {
  try {
    const cleanEmail = email.trim();
    const apiKey = import.meta.env.VITE_APPWRITE_API_KEY;
    const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;

    // 1️⃣ Отримуємо список користувачів (REST API)
    const usersRes = await fetch("http://localhost/v1/users", {
      headers: {
        "X-Appwrite-Project": projectId,
        "X-Appwrite-Key": apiKey,
      },
    });

    if (!usersRes.ok)
      throw new Error("Не вдалося отримати список користувачів");
    const usersList = await usersRes.json();

    // 2️⃣ Знаходимо користувача за email
    const user = usersList.users?.find((u) => u.email === cleanEmail);
    if (!user) throw new Error(`Користувача з email ${cleanEmail} не знайдено`);

    // 3️⃣ Отримуємо його id (новий формат Appwrite 1.8.0)
    const userId = user.$id || user.id;
    if (!userId || typeof userId !== "string")
      throw new Error("Некоректний userId");

    // 4️⃣ Створюємо membership
    const body = JSON.stringify({
      userId: userId,
      roles: roles,
    });

    const res = await fetch(`http://localhost/v1/teams/${teamId}/memberships`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Appwrite-Project": projectId,
        "X-Appwrite-Key": apiKey,
      },
      body: body,
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("❌ Membership creation failed:", data);
      throw new Error(data.message || "Не вдалося запросити користувача");
    }

    console.log("✅ Успішно створено membership:", data);
    return data;
  } catch (err) {
    console.error("Помилка запрошення користувача:", err);
    throw err;
  }
}

/** ❌ Видалити учасника */
export async function removeMember(teamId, membershipId) {
  try {
    return await teams.deleteMembership(teamId, membershipId);
  } catch (err) {
    console.error("Помилка видалення користувача:", err);
    throw err;
  }
}

export default teams;
