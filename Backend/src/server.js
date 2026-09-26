import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import fs from "fs";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";
import groupRoutes from "./routes/group.route.js";

import { connectDB } from "./lib/db.js";

import dns from "dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();
const PORT = process.env.PORT || 5005;
const __dirname = path.resolve();


// ===============================
// CORS CONFIGURATION
// ===============================

const allowedOrigins = [
  "http://localhost:5173",
  "https://connectly-frontend-be24.onrender.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without an origin
      // (Postman, server-to-server requests, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);


// ===============================
// MIDDLEWARE
// ===============================

app.use(express.json());
app.use(cookieParser());


// ===============================
// STATIC UPLOADS
// ===============================

// Serve uploaded profile pictures and cover images
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);


// ===============================
// API ROUTES
// ===============================

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/groups", groupRoutes);


// ===============================
// PRODUCTION FRONTEND
// ===============================

if (process.env.NODE_ENV === "production") {
  const frontendDist = path.join(__dirname, "../frontend/dist");

  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));

    app.get("*", (req, res) => {
      res.sendFile(path.join(frontendDist, "index.html"));
    });
  } else {
    app.get("*", (req, res) => {
      res.status(404).json({
        message: "API route not found",
      });
    });
  }
}


// ===============================
// START SERVER
// ===============================

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});