import React, { useContext, useEffect, useState } from "react";
import "./ChatBox.css";
import assets from "../../assets/assets";
import { Appcontext } from "../../context/Appcontext";
import { db } from "../../config/firebase";
import { updateDoc, arrayUnion, doc, onSnapshot, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import  upload  from "../../lib/upload";




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

    return () => unSub(); // cleanup when switching chat
  }, [messageId, setMessages]);

  // ✅ Helper: update lastMessage for receiver
  const updateLastMessageForReceiver = async (lastText) => {
    const receiverId = chatUser.rId;
    const userChatsRef = doc(db, "chats", receiverId);
    const userChatsSnap = await getDoc(userChatsRef);

    if (!userChatsSnap.exists()) return;
    const userChatData = userChatsSnap.data();

    const chatIndex = userChatData.chatsData.findIndex(
      (c) => c.messageId === messageId
    );

    if (chatIndex !== -1) {
      userChatData.chatsData[chatIndex].lastMessage = lastText;
      userChatData.chatsData[chatIndex].updatedAt = Date.now();
      userChatData.chatsData[chatIndex].messageSeen = false;

      await updateDoc(userChatsRef, {
        chatsData: userChatData.chatsData,
      });
    }
  };

  // ✅ Send text message
  const sendMessage = async () => {
    if (!input.trim() || !messageId) return;

    const newMsg = {
      senderId: userData.id,
      text: input.trim(),
      image: null, // no image for text messages
      createdAt: Date.now(),
    };

    try {
      await updateDoc(doc(db, "messages", messageId), {
        messages: arrayUnion(newMsg),
      });

      await updateLastMessageForReceiver(input.slice(0, 30));
      setInput(""); // clear input
    } catch (error) {
      console.error("Message send error:", error);
      toast.error(error.message);
    }
  };

  // ✅ Send image message
  const sendImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !messageId) return;

    setSending(true);
    try {
      const fileUrl = await upload(file); // ✅ Upload to Appwrite or Firebase Storage

      if (!fileUrl) throw new Error("Image upload failed");

      const newMsg = {
        senderId: userData.id,
        text: "", // no text for image-only message
        image: fileUrl, // ✅ store image URL
        createdAt: Date.now(),
      };

      await updateDoc(doc(db, "messages", messageId), {
        messages: arrayUnion(newMsg),
      });

      await updateLastMessageForReceiver("📷 Image");
      toast.success("Image sent!");
    } catch (error) {
      console.error("Image send error:", error);
      toast.error("Failed to send image");
    } finally {
      setSending(false);
    }
  };

  // ✅ Show placeholder if no chat is selected
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
        <img src={chatUser.userData?.avatar || assets.profile_img} alt="" />
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
                {/* ✅ Text message */}
                {msg.text && <p className="msg">{msg.text}</p>}

                {/* ✅ Image message */}
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
                    src={isSender ? userData.avatar || assets.profile_img : chatUser.userData?.avatar || assets.profile_img}
                    alt=""
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







