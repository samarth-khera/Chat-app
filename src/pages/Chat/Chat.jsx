import React, { useContext } from "react";
import "./Chat.css";
import LeftSidebar from "../../components/LeftSidebar/LeftSidebar";
import ChatBox from "../../components/ChatBox/ChatBox";
import RightSidebar from "../../components/RIghtSidebar/RightSidebar";
import { Appcontext } from "../../context/Appcontext";

const Chat = () => {
  const { userData } = useContext(Appcontext);

  if (!userData) {
    return <p className="loading">Loading...</p>;
  }

  return (
    <div className="chat">
      <div className="chat-container">
        <LeftSidebar />
        <ChatBox />
        <RightSidebar />
      </div>
    </div>
  );
};

export default Chat;

