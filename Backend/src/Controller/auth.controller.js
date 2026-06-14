import crypto from "crypto";
import { upsertStreamUser } from "../lib/stream.js";
import { setAuthCookies, clearAuthCookies } from "../lib/tokens.js";
import User from "../models/User.js";
import { sendVerificationEmail } from "../lib/email.js";

const publicUserSelect = "-password -refreshToken -emailVerificationToken -passwordResetToken";

const createToken = () => crypto.randomBytes(32).toString("hex");

const normalizeUsername = (username = "") =>
  username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");

const generateUsername = async (nameOrEmail = "pinwell") => {
  const base = normalizeUsername(nameOrEmail.split("@")[0]).slice(0, 18) || "pinwell";
  let username = base;
  let suffix = 1;

  while (await User.exists({ username })) {
    username = `${base}${suffix}`;
    suffix += 1;
  }

  return username;
};

const syncStreamUser = async (user) => {
  try {
    await upsertStreamUser({
      id: user._id.toString(),
      name: user.fullName,
      image: user.profilePic || "",
    });
  } catch (error) {
    console.log("Error syncing Stream user:", error.message);
  }
};

const getSafeUser = async (userId) => User.findById(userId).select(publicUserSelect);

export async function register(req, res) {
  try {
    const { fullName, username, email, password, phoneNumber, profilePic } = req.body;

    if (!fullName || !username || !password || !email) {
      return res.status(400).json({
        message: "Full name, username, email, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const cleanUsername = normalizeUsername(username);
    if (cleanUsername.length < 3) {
      return res.status(400).json({ message: "Username must be at least 3 characters" });
    }

    const existingUser = await User.findOne({
      $or: [
        { username: cleanUsername },
        ...(email ? [{ email: email.toLowerCase() }] : []),
        ...(phoneNumber ? [{ phoneNumber }] : []),
      ],
    });

    if (existingUser) {
      return res.status(409).json({ message: "Username, email, or phone number already exists" });
    }

    const verificationToken = createToken();
    const verificationTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const user = await User.create({
      fullName,
      username: cleanUsername,
      email: email?.toLowerCase(),
      password,
      phoneNumber: phoneNumber || undefined,
      profilePic: profilePic || "",
      isVerified: false,
      verificationToken,
      verificationTokenExpiry,
      isOnboarded: false,
    });

    await syncStreamUser(user);
    await sendVerificationEmail(user.email, verificationToken);

    res.status(201).json({
      success: true,
      message: "Registration successful. Please check your email and verify your account.",
    });

  } catch (error) {
    console.log("Error in register controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export const signup = register;

export async function login(req, res) {
  try {
    const { email, username, phoneNumber, password } = req.body;
    const identifier = email || username || phoneNumber;

    if (!identifier || !password) {
      return res.status(400).json({ message: "Identifier and password are required" });
    }

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase?.() },
        { username: normalizeUsername(identifier) },
        { phoneNumber: identifier },
      ],
    });

    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await user.matchPassword(password);
    if (!isPasswordCorrect) return res.status(401).json({ message: "Invalid credentials" });

    if (!user.isVerified) {
      return res.status(401).json({ message: "Please verify your email first" });
    }

    if (!user.isActive) {
      user.isActive = true;
      user.deactivatedAt = null;
    }

    await setAuthCookies(res, user);
    const safeUser = await getSafeUser(user._id);
    res.status(200).json({ success: true, user: safeUser });

  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function logout(req, res) {
  try {
    clearAuthCookies(res);
    res.status(200).json({ success: true, message: "Logout successful" });
  } catch (error) {
    clearAuthCookies(res);
    res.status(200).json({ success: true, message: "Logout successful" });
  }
}

export async function uploadProfilePicture(req, res) {
  if (!req.file) return res.status(400).json({ message: "Profile picture is required" });

  const profilePic = `${req.protocol}://${req.get("host")}/uploads/profile-pics/${req.file.filename}`;
  const user = await User.findByIdAndUpdate(req.user._id, { profilePic }, { new: true }).select(publicUserSelect);

  res.status(200).json({ success: true, profilePic, user });
}

export async function onboard(req, res) {
  try {
    const userId = req.user._id;
    const { fullName, bio, nativeLanguage, learningLanguage, location, profilePic } = req.body;

    if (!fullName || !bio || !nativeLanguage || !learningLanguage || !location) {
      return res.status(400).json({
        message: "All fields are required",
        missingFields: [
          !fullName && "fullName",
          !bio && "bio",
          !nativeLanguage && "nativeLanguage",
          !learningLanguage && "learningLanguage",
          !location && "location",
        ].filter(Boolean),
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        fullName,
        bio,
        nativeLanguage,
        learningLanguage,
        location,
        ...(profilePic !== undefined ? { profilePic } : {}),
        isOnboarded: true,
      },
      { new: true }
    ).select(publicUserSelect);

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    await syncStreamUser(updatedUser);
    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Onboarding error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function verifyEmail(req, res) {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired verification link",
      });
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });

  } catch (error) {
    console.log("Verify Email Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}