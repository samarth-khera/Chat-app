import React, { useContext, useEffect, useState } from "react";
import "./RightSidebar.css";
import { logout } from "../../config/firebase";
import { Appcontext } from "../../context/Appcontext";
import { db } from "../../config/firebase";
import { doc, getDoc } from "firebase/firestore";

const RightSidebar = () => {
  const { chatUser, userData, messageId } = useContext(Appcontext);
  const [sharedImages, setSharedImages] = useState([]);

  useEffect(() => {
    
    const fetchSharedMedia = async () => {
      if (!messageId) {
        setSharedImages([]);
        return;
      }

      try {
        const msgDocRef = doc(db, "messages", messageId);
        const snap = await getDoc(msgDocRef);

        if (snap.exists()) {
          const allMessages = snap.data()?.messages || [];
          
          const images = allMessages.filter((msg) => msg.image).map((msg) => msg.image);
          setSharedImages(images.reverse()); 
        } else {
          setSharedImages([]);
        }
      } catch (err) {
        console.error("Failed to fetch shared media:", err);
        setSharedImages([]);
      }
    };

    fetchSharedMedia();
  }, [messageId]);

  
  if (!chatUser) {
    return (
      <div className="rs hidden-on-tablet">
        <div className="rs-placeholder">
          <p>Select a chat to view details</p>
        </div>
      </div>
    );
  }

  const targetUser = chatUser.userData;

  return (
    <div className="rs hidden-on-tablet">
      
      <div className="rs-profile">
        <img src={targetUser?.avatar || "/default-avatar.png"} alt="avatar" />
        <h3>{targetUser?.name || "Unknown User"}</h3>
        <p>{targetUser?.bio || "Hey, I'm using chat app"}</p>
      </div>

      <hr />

     
      <div className="rs-media">
        <p>Shared Media</p>

        {sharedImages.length > 0 ? (
          <div className="media-grid">
            {sharedImages.map((imgUrl, idx) => (
              <img key={idx} src={imgUrl} alt={`media-${idx}`} />
            ))}
          </div>
        ) : (
          <p className="no-media">No media shared yet</p>
        )}
      </div>

      <hr />

      
      <button className="logout-btn" onClick={() => logout()}>
        Logout ({userData?.name || "You"})
      </button>
    </div>
  );
};

export default RightSidebar;


