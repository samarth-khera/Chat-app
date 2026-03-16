const upload = async (file) => {
  try {
    if (!file) throw new Error("No file provided");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "chat_app_preset"); 
    
    // We will use a public free cloudinary cloud name for this example: 
    // Usually stored in env, but since Appwrite had CORS issues we provide a reliable fallback
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dqukllvwa"; 

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
        throw new Error("Upload failed on Cloudinary");
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("❌ Image upload failed:", error.message);
    return null;
  }
};

export default upload;


