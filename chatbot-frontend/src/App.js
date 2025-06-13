import React, { useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import './App.css'; // Import your CSS file

const ChatMessage = ({ message }) => {
  return (
    <div className={`message ${message.sender}`}>
      <strong>{message.sender === "bot" ? "Bot:" : "You:"}</strong>
      <ReactMarkdown>{message.text}</ReactMarkdown>
    </div>
  );
};

function App() {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState([]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setChat((prev) => [...prev, userMessage]);
    setInput(""); // ✅ Clear input immediately

    try {
      const res = await axios.post("http://localhost:5000/chat", { message: input });
      const botMessage = { sender: "bot", text: res.data.reply };
      setChat((prev) => [...prev, botMessage]);
    } catch (err) {
      setChat((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "❌ Error: " + (err.response?.data?.error || "Something went wrong."),
        },
      ]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      <h2 className="chat-header">🤖 Gemini Chatbot</h2>

      <div className="chat-box">
        {chat.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}
      </div>

      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message"
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default App;
