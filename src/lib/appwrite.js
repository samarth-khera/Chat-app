import { Client, Account, Storage, ID } from 'appwrite';

const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT) // ✅ correct
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT);  // ✅ correct

const account = new Account(client);
const storage = new Storage(client);

export { client, account, storage, ID };

