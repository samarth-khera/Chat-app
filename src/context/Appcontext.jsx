import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { createContext, useState, useEffect, useRef } from "react";
import { db } from "../config/firebase";
import { useNavigate, useLocation } from "react-router-dom";

export const Appcontext = createContext();

const AppcontextProvider = (props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const unsubRef = useRef(null);
  const userCache = {}; // ✅ Cache user info

  const [userData, setUserData] = useState(null);
  const [chatData, setchatData] = useState(null);
  const [messageId, setMessagesId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatUser, setChatUser] = useState(null);

  // ✅ Update lastSeen only when user leaves
  const updateLastSeenOnExit = (uid) => {
    window.addEventListener("beforeunload", async () => {
      if (uid) {
        try {
          await updateDoc(doc(db, "users", uid), {
            lastSeen: Date.now(),
            status: "offline",
          });
        } catch (err) {
          console.log("Skipping lastSeen update:", err.message);
        }
      }
    });
  };

  // ✅ Load user data only once on login
  const loadUserData = async (uid, currentPath) => {
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) return;

      const fetchedUser = userSnap.data();
      setUserData(fetchedUser);

      // ✅ Mark online only ONCE after login
      await updateDoc(userRef, { status: "online" });

      // ✅ Only update lastSeen when leaving
      updateLastSeenOnExit(uid);

      // ✅ Redirect if incomplete profile
      const profileComplete = fetchedUser.avatar && fetchedUser.name;
      if (!profileComplete && currentPath !== "/profile") {
        navigate("/profile");
      } else if (profileComplete && currentPath !== "/chat") {
        navigate("/chat");
      }

      // ✅ Start listening to chats
      listenToChats(uid);
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  // ✅ Real-time listener for chat updates with caching
  const listenToChats = (uid) => {
    if (unsubRef.current) unsubRef.current(); // clear previous listener

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

  // ✅ Stop listener on unmount
  useEffect(() => {
    return () => {
      if (unsubRef.current) unsubRef.current(); // stop listener when unmount
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
  };

  return <Appcontext.Provider value={value}>{props.children}</Appcontext.Provider>;
};

export default AppcontextProvider;













