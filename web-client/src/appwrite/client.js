import { Client, Account, Databases, ID, Permission, Role } from "appwrite";

const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

if (import.meta.env.VITE_APPWRITE_SELF_SIGNED === "true") {
  client.setSelfSigned(true);
}

export const account = new Account(client);
export const databases = new Databases(client);
export { ID, Permission, Role };

export default client;
