const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mysql = require("mysql2/promise");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// MySQL connection
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Gemini setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Chat endpoint
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  try {
    // ✅ Fix: Await the nested response
    const result = await model.generateContent(message);
    const response = await result.response;
    const botResponse = response.text();

    // Save to DB
    await db.query(
      "INSERT INTO messages (user_message, bot_response) VALUES (?, ?)",
      [message, botResponse]
    );

    res.json({ reply: botResponse });
  } catch (err) {
    console.error("❌ Chat error:", err.message || err);
    res.status(500).json({ error: "Something went wrong!" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
