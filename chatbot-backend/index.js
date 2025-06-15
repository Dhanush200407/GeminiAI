const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mysql = require("mysql2/promise");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const session = require("express-session");
const bcrypt = require("bcrypt");

dotenv.config();
const app = express();

// CORS setup: allow credentials and your frontend origin
app.use(cors({
  origin: "http://localhost:3000", // Change if your frontend runs elsewhere
  credentials: true
}));

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

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET || "your_secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
    httpOnly: true,
    sameSite: "lax"
  }
}));

// Signup endpoint
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    await db.query("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashed]);
    res.json({ message: "Signup successful" });
  } catch (err) {
    res.status(400).json({ error: "Signup failed. Username may already exist." });
  }
});

// Login endpoint
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
    const user = rows[0];
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.userId = user.id;
      res.json({ message: "Login successful" });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (err) {
    res.status(500).json({ error: "Login error" });
  }
});

// Logout endpoint
app.post("/logout", (req, res) => {
  req.session.destroy();
  res.json({ message: "Logged out" });
});

// Chat endpoint
app.post("/chat", async (req, res) => {
  const { message } = req.body;
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ error: "Not authenticated" });

  try {
    const result = await model.generateContent(message);
    const response = await result.response;
    const botResponse = response.text();

    await db.query(
      "INSERT INTO messages (user_message, bot_response, user_id) VALUES (?, ?, ?)",
      [message, botResponse, userId]
    );

    res.json({ reply: botResponse });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong!" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});