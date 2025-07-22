import React, { useContext, useEffect, useState } from "react";
import "./ChatBox.css";
import assets from "../../assets/assets";
import { Appcontext } from "../../context/Appcontext";
import { db } from "../../config/firebase";
import { updateDoc, arrayUnion, doc, onSnapshot, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import upload from "../../lib/upload";

const ChatBox = () => {
  const { userData, chatUser, messages, setMessages, messageId } = useContext(Appcontext);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  // ✅ Real-time listener for messages
  useEffect(() => {
    if (!messageId) return;
    const msgDocRef = doc(db, "messages", messageId);
    const unSub = onSnapshot(msgDocRef, (res) => {
      const msgList = res.data()?.messages || [];
      setMessages([...msgList].reverse());
    });
    return () => unSub();
  }, [messageId, setMessages]);

  // ✅ Helper: Update receiver chat in ONE write
  const updateReceiverChat = async (lastText) => {
    const receiverId = chatUser?.rId;
    if (!receiverId || !messageId) return;

    const userChatsRef = doc(db, "chats", receiverId);
    const userChatsSnap = await getDoc(userChatsRef);
    if (!userChatsSnap.exists()) return;

    const userChatData = userChatsSnap.data()?.chatsData || [];
    const chatIndex = userChatData.findIndex(c => c.messageId === messageId);

    if (chatIndex !== -1) {
      userChatData[chatIndex] = {
        ...userChatData[chatIndex],
        lastMessage: lastText,
        updatedAt: Date.now(),
        messageSeen: false
      };

      await updateDoc(userChatsRef, { chatsData: userChatData });
    }
  };

  // ✅ Send text message (Combined write)
  const sendMessage = async () => {
    if (!input.trim() || !messageId) return;

    const messageText = input.trim();
    setInput(""); // clear UI fast

    const newMsg = {
      senderId: userData.id,
      text: messageText,
      image: null,
      createdAt: Date.now(),
    };

    try {
      await Promise.all([
        updateDoc(doc(db, "messages", messageId), {
          messages: arrayUnion(newMsg)
        }),
        updateReceiverChat(messageText.slice(0, 30))
      ]);
    } catch (error) {
      console.error("Message send error:", error);
      toast.error(error.message);
      setInput(messageText); // restore on failure
    }
  };

  // ✅ Send image message (Combined write)
  const sendImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !messageId) return;

    setSending(true);
    try {
      const fileUrl = await upload(file);
      if (!fileUrl) throw new Error("Image upload failed");

      const newMsg = {
        senderId: userData.id,
        text: "",
        image: fileUrl,
        createdAt: Date.now(),
      };

      await Promise.all([
        updateDoc(doc(db, "messages", messageId), {
          messages: arrayUnion(newMsg)
        }),
        updateReceiverChat("📷 Image")
      ]);

      toast.success("Image sent!");
    } catch (error) {
      console.error("Image send error:", error);
      toast.error("Failed to send image");
    } finally {
      setSending(false);
    }
  };

  // ✅ Show placeholder if no chat selected
  if (!chatUser) {
    return (
      <div className="chat-welcome">
        <img src={assets.logo_icon} alt="welcome" />
        <p>Chat anytime, anywhere</p>
      </div>
    );
  }

  return (
    <div className="chat-box">
      {/* ✅ CHAT HEADER */}
      <div className="chat-user">
        <img src={chatUser.userData?.avatar || assets.profile_img} alt="avatar" />
        <p>
          {chatUser.userData?.name}{" "}
          <img className="dot" src={assets.green_dot} alt="online" />
        </p>
        <img src={assets.help_icon} alt="help" />
      </div>

      {/* ✅ MESSAGE LIST */}
      <div className="chat-msg">
        {messages?.length > 0 ? (
          messages.map((msg, idx) => {
            const isSender = msg.senderId === userData.id;
            return (
              <div key={idx} className={isSender ? "s-msg" : "r-msg"}>
                {msg.text && <p className="msg">{msg.text}</p>}
                {msg.image && (
                  <img
                    src={msg.image}
                    alt="sent"
                    className="msg-image"
                    style={{ maxWidth: "200px", borderRadius: "8px", margin: "5px 0" }}
                  />
                )}
                <div>
                  <img
                    src={
                      isSender
                        ? userData.avatar || assets.profile_img
                        : chatUser.userData?.avatar || assets.profile_img
                    }
                    alt="avatar"
                  />
                  <p>{new Date(msg.createdAt).toLocaleTimeString()}</p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="no-msg">No messages yet. Say Hi 👋</p>
        )}
      </div>

      {/* ✅ INPUT BOX */}
      <div className="chat-input">
        <input
          type="text"
          placeholder="Send a message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        {/* Image Upload */}
        <input
          onChange={sendImage}
          type="file"
          id="image"
          accept="image/png, image/jpeg"
          hidden
        />
        <label htmlFor="image">
          <img
            src={sending ? assets.loader_icon : assets.gallery_icon}
            alt="upload"
            style={{ opacity: sending ? 0.5 : 1 }}
          />
        </label>
        {/* Send Button */}
        <img
          onClick={sendMessage}
          src={assets.send_button}
          alt="send"
          style={{ opacity: !input.trim() ? 0.5 : 1 }}
        />
      </div>
    </div>
  );
};

export default ChatBox;







