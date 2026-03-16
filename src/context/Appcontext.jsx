import { doc, getDoc, updateDoc, onSnapshot, collection } from "firebase/firestore";
import { createContext, useState, useEffect, useRef } from "react";
import { db } from "../config/firebase";
import { useNavigate, useLocation } from "react-router-dom";

export const Appcontext = createContext();

const AppcontextProvider = (props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const unsubRef = useRef(null);
  const userCache = {}; 

  const [userData, setUserData] = useState(null);
  const [chatData, setchatData] = useState(null);
  const [messageId, setMessagesId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatUser, setChatUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const usersUnsubRef = useRef(null);

  
  const updateLastSeenOnExit = (uid) => {
    let timeout;
    window.addEventListener("beforeunload", () => {
      if (!uid) return;
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        try {
          await updateDoc(doc(db, "users", uid), {
            lastSeen: Date.now(),
            status: "offline",
          });
        } catch (err) {
          console.log("Skip lastSeen update:", err.message);
        }
      }, 500);
    });
  };

  
  const loadUserData = async (uid, currentPath) => {
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) return;

      const fetchedUser = userSnap.data();
      setUserData(fetchedUser);

      
      if (fetchedUser.status !== "online") {
        await updateDoc(userRef, { status: "online" });
      }

      updateLastSeenOnExit(uid);

      
      const profileComplete = fetchedUser.avatar && fetchedUser.name;
      if (!profileComplete && currentPath !== "/profile") {
        navigate("/profile");
      } else if (profileComplete && currentPath !== "/chat") {
        navigate("/chat");
      }

      listenToChats(uid);
      listenToAllUsers(uid);
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const listenToAllUsers = (uid) => {
    if (usersUnsubRef.current) usersUnsubRef.current();

    const usersRef = collection(db, "users");
    usersUnsubRef.current = onSnapshot(usersRef, (res) => {
      const usersList = [];
      res.forEach((doc) => {
        const data = doc.data();
        if (data.id && data.id !== uid) {
          usersList.push(data);
        }
      });
      setAllUsers(usersList);
    });
  };

  const listenToChats = (uid) => {
    if (unsubRef.current) unsubRef.current();

    const chatRef = doc(db, "chats", uid);
    unsubRef.current = onSnapshot(chatRef, async (res) => {
      const data = res.data();
      const chatItems = Array.isArray(data?.chatsData) ? data.chatsData : [];

      if (chatItems.length === 0) {
        setchatData([]);
        return;
      }

      const tempData = await Promise.all(
        chatItems.map(async (item) => {
          if (!userCache[item.rId]) {
            const userSnap = await getDoc(doc(db, "users", item.rId));
            userCache[item.rId] = userSnap.exists() ? userSnap.data() : null;
          }
          return { ...item, userData: userCache[item.rId] };
        })
      );

      setchatData(tempData.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)));
    });
  };

  
  useEffect(() => {
    return () => {
      if (unsubRef.current) unsubRef.current();
      if (usersUnsubRef.current) usersUnsubRef.current();
    };
  }, []);

  const value = {
    userData,
    setUserData,
    chatData,
    setchatData,
    loadUserData,
    messages,
    setMessages,
    messageId,
    setMessagesId,
    chatUser,
    setChatUser,
    allUsers,
  };

  return <Appcontext.Provider value={value}>{props.children}</Appcontext.Provider>;
};

export default AppcontextProvider;













