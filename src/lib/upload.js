import { Client, Storage, ID, Permission, Role } from "appwrite";

const client = new Client();
client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT);

const storage = new Storage(client);

const upload = async (file) => {
  try {
    if (!file) throw new Error("No file provided");

    const bucketId = import.meta.env.VITE_APPWRITE_BUCKET;
    const projectId = import.meta.env.VITE_APPWRITE_PROJECT;

    // Upload file with public read permission
    const uploaded = await storage.createFile(bucketId, ID.unique(), file, [
      Permission.read(Role.any()), // makes it public
    ]);

    // Build public file URL
    return `${client.config.endpoint}/storage/buckets/${bucketId}/files/${uploaded.$id}/view?project=${projectId}`;
  } catch (error) {
    console.error("❌ Image upload failed:", error.message);
    return null;
  }
};

export default upload;


