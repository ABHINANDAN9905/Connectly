import express from "express";
import rateLimit from "express-rate-limit";
import { login, logout, onboard, register, uploadProfilePicture } from "../Controller/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { uploadProfilePic } from "../middleware/upload.middleware.js";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again later." },
});

router.post("/register", loginLimiter, register);
router.post("/signup", loginLimiter, register);
router.post("/login", loginLimiter, login);
router.post("/logout", logout);


router.post(
  "/upload-profile-picture",
  protectRoute,
  uploadProfilePic.single("profilePic"),
  uploadProfilePicture
);

router.post("/onboarding", protectRoute, onboard);

// check if user is logged in
router.get("/me", protectRoute, (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});


export default router;

