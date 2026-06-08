import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import userRoutes from "./routes/user.route.js";
import authRoutes from "./routes/auth.route.js";
import chatRoutes from "./routes/chat.route.js";

import { connectDB } from "./lib/db.js";
import dns from "dns";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();
const PORT = process.env.PORT || 5005;

const __dirname = path.resolve();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "https://connectly-git-main-abhinandan-kumars-projects-5bec251a.vercel.app",
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  ...(process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
].filter(Boolean);

const allowedOriginPatterns = [
  /^https:\/\/connectly(?:-[a-z0-9-]+)?\.vercel\.app$/,
  /^https:\/\/connectly-[a-z0-9-]+-abhinandan-kumars-projects-[a-z0-9]+\.vercel\.app$/,
];

const corsOptions = {
  origin(origin, callback) {
    const isAllowedPattern = allowedOriginPatterns.some((pattern) => pattern.test(origin || ""));

    if (!origin || allowedOrigins.includes(origin) || isAllowedPattern) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// CORS
app.options("*", cors(corsOptions));
app.use(
  cors(corsOptions)
);

app.use(express.json());
app.use(cookieParser());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

// Health Check Route
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});
