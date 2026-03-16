import React, { useContext, useState, useRef, useMemo } from "react";
import "./LeftSidebar.css";
import assets from "../../assets/assets";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../../config/firebase";
import { toast } from "react-toastify";
import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { Appcontext } from "../../context/Appcontext";

const LeftSidebar = () => {
  const navigate = useNavigate();
  const { userData, chatData, allUsers, chatUser, setChatUser, setMessagesId } = useContext(Appcontext);

  const [showMenu, setShowMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const displayList = useMemo(() => {
    const list = [];
    const chatUserIds = new Set();

    if (chatData) {
      chatData.forEach(chat => {
        if (chat.userData) {
          list.push({ type: "chat", item: chat, user: chat.userData });
          chatUserIds.add(chat.rId);
        }
      });
    }

    if (allUsers) {
      allUsers.forEach(u => {
        if (!chatUserIds.has(u.id)) {
          list.push({ type: "user", item: null, user: u });
        }
      });
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return list.filter(entry => 
        entry.user.name?.toLowerCase().includes(term) || 
        entry.user.username?.toLowerCase().includes(term)
      );
    }

    return list;
  }, [chatData, allUsers, searchTerm]);

  const inputHandler = (e) => {
    setSearchTerm(e.target.value.trim().toLowerCase());
  };

 
  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully!");
      navigate("/");
    } catch (err) {
      toast.error("Failed to logout.");
    }
  };

  const handleUserClick = async (entry) => {
    if (entry.type === "chat") {
      setMessagesId(entry.item.messageId);
      setChatUser(entry.item);
    } else {
      await createNewChat(entry.user);
    }
  };

  const createNewChat = async (targetUser) => {
    if (!targetUser || !userData) return;

    try {
      const newMessageRef = doc(collection(db, "messages"));
      await setDoc(newMessageRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });

      const now = Date.now();

      const newChat = {
        messageId: newMessageRef.id,
        lastMessage: "",
        rId: targetUser.id,
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
        setDoc(doc(db, "chats", targetUser.id), { chatsData: arrayUnion(newChatOther) }, { merge: true }),
      ]);

      setMessagesId(newMessageRef.id);
      setChatUser({
        messageId: newMessageRef.id,
        lastMessage: "",
        rId: targetUser.id,
        updatedAt: now,
        messageSeen: true,
        userData: targetUser
      });

      toast.success("Chat created!");
      setSearchTerm("");
    } catch (error) {
      console.error("Failed to create chat:", error);
      toast.error("Failed to create chat");
    }
  };

  const handleProfileClick = (e, userId) => {
    e.stopPropagation();
    navigate(`/user/${userId}`);
  };

  return (
    <div className={`ls ${chatUser ? 'hidden-on-mobile' : ''}`}>
     
      <div className="ls-top">
        <div className="ls-nav">
          <img src={assets.logo} className="logo" alt="Logo" />
          <div className="menu">
            <img
              src={assets.menu_icon}
              alt="Menu Icon"
              className="menu-icon"
              onClick={() => setShowMenu(!showMenu)}
            />
            {showMenu && (
              <div className="sub-menu">
                <p onClick={() => navigate("/profile")}>Edit Profile</p>
                <hr />
                <p onClick={handleLogout}>Logout</p>
              </div>
            )}
          </div>
        </div>

        {/* 🔍 SEARCH */}
        <div className="ls-search">
          <img src={assets.search_icon} alt="Search" />
          <input
            onChange={inputHandler}
            type="text"
            placeholder="Search here..."
            value={searchTerm}
          />
        </div>
      </div>


      <div className="ls-list">
        {displayList.length > 0 ? (
          displayList.map((entry, index) => (
            <div onClick={() => handleUserClick(entry)} key={index} className="friends">
              <img 
                src={entry.user?.avatar || assets.profile_img} 
                alt="user avatar" 
                onClick={(e) => handleProfileClick(e, entry.user.id)}
                className="profile-clickable"
              />
              <div className="friends-info">
                <p>{entry.user?.name || "Unknown User"}</p>
                <span>{entry.type === "chat" ? (entry.item.lastMessage || "Start a conversation") : "Tap to start chat"}</span>
              </div>
              {entry.user?.status === "online" && <div className="online-indicator"></div>}
            </div>
          ))
        ) : (
          <p className="no-chat">No users found</p>
        )}
      </div>
    </div>
  );
};

export default LeftSidebar;





















