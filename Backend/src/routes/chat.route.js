import express from "express";

import { getStreamToken, upsertUser } from "../Controller/chat.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";


const router = express.Router();

router.get("/token", protectRoute, getStreamToken);

router.post("/upsert/:userId", protectRoute, upsertUser);

export default router;
