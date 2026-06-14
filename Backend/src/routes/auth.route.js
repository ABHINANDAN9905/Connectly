import express from "express";
import rateLimit from "express-rate-limit";
import passport from "../lib/passport.js";
import {
  login,
  logout,
  onboard,
  register,
  verifyEmail,
  uploadProfilePicture,
} from "../Controller/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { uploadProfilePic } from "../middleware/upload.middleware.js";
import { setAuthCookies } from "../lib/tokens.js";

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
router.get("/verify-email/:token", verifyEmail);

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login`,
  }),
  async (req, res) => {
    try {
      await setAuthCookies(res, req.user);
      res.redirect(`${process.env.CLIENT_URL}/`);
    } catch (error) {
      res.redirect(`${process.env.CLIENT_URL}/login`);
    }
  }
);

router.post(
  "/upload-profile-picture",
  protectRoute,
  uploadProfilePic.single("profilePic"),
  uploadProfilePicture
);

router.post("/onboarding", protectRoute, onboard);

router.get("/me", protectRoute, (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

export default router;