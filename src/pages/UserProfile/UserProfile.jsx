import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, setDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Appcontext } from '../../context/Appcontext';
import { toast } from 'react-toastify';
import './UserProfile.css';

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userData, chatData, setMessagesId, setChatUser } = useContext(Appcontext);
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userRef = doc(db, 'users', id);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setProfileUser(userSnap.data());
        } else {
          toast.error("User not found!");
          navigate('/chat');
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        toast.error("Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id, navigate]);

  const handleMessageClick = async () => {
    // Check if chat already exists
    const existingChat = chatData?.find(chat => chat.rId === id);

    if (existingChat) {
      setMessagesId(existingChat.messageId);
      setChatUser(existingChat);
      navigate('/chat');
      return;
    }

    // Otherwise create a new chat
    try {
      if (!userData || !profileUser) return;
      
      const newMessageRef = doc(collection(db, "messages"));
      await setDoc(newMessageRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });

      const now = Date.now();

      const newChat = {
        messageId: newMessageRef.id,
        lastMessage: "",
        rId: profileUser.id,
        updatedAt: now,
        messageSeen: true,
      };

      const newChatOther = {
        messageId: newMessageRef.id,
        lastMessage: "",
        rId: userData.id,
        updatedAt: now,
        messageSeen: false,
      };

      await Promise.all([
        setDoc(doc(db, "chats", userData.id), { chatsData: arrayUnion(newChat) }, { merge: true }),
        setDoc(doc(db, "chats", profileUser.id), { chatsData: arrayUnion(newChatOther) }, { merge: true }),
      ]);

      setMessagesId(newMessageRef.id);
      setChatUser({
        messageId: newMessageRef.id,
        lastMessage: "",
        rId: profileUser.id,
        updatedAt: now,
        messageSeen: true,
        userData: profileUser
      });

      navigate('/chat');
      toast.success("Chat created!");
    } catch (error) {
      console.error("Failed to create chat:", error);
      toast.error("Failed to start chat");
    }
  };

  if (loading) {
    return <div className="profile-container"><p>Loading profile...</p></div>;
  }

  if (!profileUser) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="user-profile">
      <div className="profile-card">
        <button className="back-btn" onClick={() => navigate('/chat')}>&larr; Back to Chat</button>
        
        <img 
          src={profileUser.avatar || "/default-avatar.png"} 
          alt={`${profileUser.name}'s avatar`} 
          className="profile-avatar"
        />
        
        <h2 className="profile-name">{profileUser.name}</h2>
        <p className="profile-username">@{profileUser.username}</p>
        
        <div className={`status-badge ${profileUser.status === 'online' ? 'online' : 'offline'}`}>
          {profileUser.status}
        </div>

        <div className="profile-details">
          {profileUser.bio && (
            <div className="detail-item">
              <strong>Bio:</strong>
              <p>{profileUser.bio}</p>
            </div>
          )}
          
          <div className="detail-item">
            <strong>Last Seen:</strong>
            <p>
              {profileUser.lastSeen 
                ? new Date(profileUser.lastSeen).toLocaleString() 
                : "Unknown"}
            </p>
          </div>
        </div>

        <button className="message-btn" onClick={handleMessageClick}>
          Message
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
