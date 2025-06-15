import React, { useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";


const ChatMessage = ({ message }) => {
  const handleCopyFull = () => {
    navigator.clipboard.writeText(message.text);
    alert("✅ Full message copied!");
  };

  const MarkdownRenderers = {
    code({ inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      const codeContent = String(children).trim();

      const copyCode = () => {
        navigator.clipboard.writeText(codeContent);
        alert("✅ Code block copied!");
      };

      return !inline ? (
        <div style={{ position: "relative", marginTop: "1rem", marginBottom: "1rem" }}>
          <button
            onClick={copyCode}
            className="copy-btn"
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              padding: "4px 8px",
              fontSize: "12px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              zIndex: 1
            }}
          >
            📋 Copy Code
          </button>
          <SyntaxHighlighter language={match?.[1] || "javascript"} style={oneDark} PreTag="div" {...props}>
            {codeContent}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
  };

  return (
    <div className={`message ${message.sender}`}>
      <strong>{message.sender === "bot" ? "Bot:" : "You:"}</strong>
      <ReactMarkdown components={MarkdownRenderers}>{message.text}</ReactMarkdown>
      {message.sender === "bot" && (
        <button onClick={handleCopyFull} className="copy-btn">
          📋 Copy Full
        </button>
      )}
    </div>
  );
};

function ChatPage() {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState([]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setChat((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const res = await axios.post("http://localhost:5000/chat", { message: input }, { withCredentials: true });
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

export default ChatPage;