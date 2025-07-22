import React, { useContext, useState, useRef } from "react";
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
  const { userData, chatData, setChatUser, setMessagesId } = useContext(Appcontext);

  const [showMenu, setShowMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchedUser, setSearchedUser] = useState(null);
  const [showSearch, setShowSearch] = useState(false);

  const debounceRef = useRef(null);

  // ✅ Check if chat already exists
  const doesChatExist = (targetId) => {
    return chatData?.some((chat) => chat.rId === targetId);
  };

  // 🔍 SEARCH USER (debounced)
  const searchUser = async (term) => {
    if (!term) {
      setShowSearch(false);
      setSearchedUser(null);
      return;
    }

    try {
      const q = query(collection(db, "users"), where("username", "==", term));
      const querySnap = await getDocs(q);

      if (!querySnap.empty) {
        const foundUser = querySnap.docs[0].data();

        if (foundUser.id !== userData?.id && !doesChatExist(foundUser.id)) {
          setSearchedUser(foundUser);
          setShowSearch(true);
        } else {
          setSearchedUser(null);
          setShowSearch(false);
        }
      } else {
        setSearchedUser(null);
        setShowSearch(true);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Search failed!");
    }
  };

  const inputHandler = (e) => {
    const value = e.target.value.trim().toLowerCase();
    setSearchTerm(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchUser(value);
    }, 400);
  };

  // 🚪 LOGOUT
  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully!");
      navigate("/");
    } catch (err) {
      toast.error("Failed to logout.");
    }
  };

  const addChat = async () => {
    if (!searchedUser || !userData) return;

    try {
      // 1️⃣ Create empty message document
      const newMessageRef = doc(collection(db, "messages"));
      await setDoc(newMessageRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });

      const now = Date.now();

      // 2️⃣ Prepare chat objects
      const newChat = {
        messageId: newMessageRef.id,
        lastMessage: "",
        rId: searchedUser.id,
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

      // 3️⃣ Save to both users' chat docs
      await Promise.all([
        setDoc(doc(db, "chats", userData.id), { chatsData: arrayUnion(newChat) }, { merge: true }),
        setDoc(doc(db, "chats", searchedUser.id), { chatsData: arrayUnion(newChatOther) }, { merge: true }),
      ]);

      toast.success("Chat created!");
      setShowSearch(false);
      setSearchedUser(null);
      setSearchTerm("");
    } catch (error) {
      console.error("Failed to create chat:", error);
      toast.error("Failed to create chat");
    }
  };

  const setChat = (item) => {
    setMessagesId(item.messageId);
    setChatUser(item);
  };

  return (
    <div className="ls">
      {/* 🔝 TOP BAR */}
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

      {/* 📝 CHAT LIST */}
      <div className="ls-list">
        {showSearch ? (
          searchedUser ? (
            <div onClick={addChat} className="friends add-user">
              <img src={searchedUser.avatar || assets.profile_img} alt="searched user" />
              <div>
                <p>{searchedUser.name}</p>
                <span>@{searchedUser.username}</span>
              </div>
            </div>
          ) : (
            <p className="no-user">No user found</p>
          )
        ) : chatData?.length > 0 ? (
          chatData.map((item, index) => (
            <div onClick={() => setChat(item)} key={index} className="friends">
              <img src={item.userData?.avatar || assets.profile_img} alt={`Friend ${index + 1}`} />
              <div>
                <p>{item.userData?.name || "Unknown User"}</p>
                <span>{item.lastMessage || "No messages yet"}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="no-chat">No chats yet</p>
        )}
      </div>
    </div>
  );
};

export default LeftSidebar;





















