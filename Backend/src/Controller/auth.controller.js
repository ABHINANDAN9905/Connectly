import crypto from "crypto";

import { upsertStreamUser } from "../lib/stream.js";
import {
  setAuthCookies,
  clearAuthCookies,
} from "../lib/tokens.js";

import User from "../models/User.js";
import { sendVerificationEmail } from "../lib/email.js";


// ==========================================
// SAFE USER SELECT
// ==========================================

const publicUserSelect =
  "-password -refreshToken -emailVerificationToken -passwordResetToken";


// ==========================================
// TOKEN
// ==========================================

const createToken = () => {
  return crypto.randomBytes(32).toString("hex");
};


// ==========================================
// USERNAME
// ==========================================

const normalizeUsername = (username = "") => {
  return username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
};


const generateUsername = async (nameOrEmail = "pinwell") => {
  const base =
    normalizeUsername(nameOrEmail.split("@")[0]).slice(0, 18) ||
    "pinwell";

  let username = base;
  let suffix = 1;

  while (await User.exists({ username })) {
    username = `${base}${suffix}`;
    suffix += 1;
  }

  return username;
};


// ==========================================
// STREAM USER SYNC
// ==========================================

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


// ==========================================
// GET SAFE USER
// ==========================================

const getSafeUser = async (userId) => {
  return User.findById(userId).select(publicUserSelect);
};


// ==========================================
// REGISTER
// ==========================================

export async function register(req, res) {
  try {
    const {
      fullName,
      username,
      email,
      password,
      phoneNumber,
      profilePic,
    } = req.body;

    if (!fullName || !username || !password || !email) {
      return res.status(400).json({
        message:
          "Full name, username, email, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address",
      });
    }

    const cleanUsername = normalizeUsername(username);

    if (cleanUsername.length < 3) {
      return res.status(400).json({
        message: "Username must be at least 3 characters",
      });
    }

    // Check existing user
    const existingUser = await User.findOne({
      $or: [
        { username: cleanUsername },
        { email: email.toLowerCase() },
        ...(phoneNumber ? [{ phoneNumber }] : []),
      ],
    });

    if (existingUser) {
      return res.status(409).json({
        message:
          "Username, email, or phone number already exists",
      });
    }

    // Verification token
    const verificationToken = createToken();

    const verificationTokenExpiry = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    // Create user
    const user = await User.create({
      fullName,
      username: cleanUsername,
      email: email.toLowerCase(),
      password,
      phoneNumber: phoneNumber || undefined,
      profilePic: profilePic || "",

      // LPU profile will be completed later
      isVerified: false,
      isOnboarded: false,

      verificationToken,
      verificationTokenExpiry,
    });

    // Sync with Stream
    await syncStreamUser(user);

    // Send verification email
    await sendVerificationEmail(
      user.email,
      verificationToken
    );

    return res.status(201).json({
      success: true,
      message:
        "Registration successful. Please check your email and verify your account.",
    });
  } catch (error) {
    console.log("Error in register controller:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}


export const signup = register;


// ==========================================
// LOGIN
// ==========================================

export async function login(req, res) {
  try {
    const {
      email,
      username,
      phoneNumber,
      password,
    } = req.body;

    const identifier = email || username || phoneNumber;

    if (!identifier || !password) {
      return res.status(400).json({
        message: "Identifier and password are required",
      });
    }

    const user = await User.findOne({
      $or: [
        {
          email:
            typeof identifier === "string"
              ? identifier.toLowerCase()
              : identifier,
        },
        {
          username: normalizeUsername(identifier),
        },
        {
          phoneNumber: identifier,
        },
      ],
    });

    if (!user || !user.password) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const isPasswordCorrect =
      await user.matchPassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        message: "Please verify your email first",
      });
    }

    if (!user.isActive) {
      user.isActive = true;
      user.deactivatedAt = null;

      await user.save();
    }

    await setAuthCookies(res, user);

    const safeUser = await getSafeUser(user._id);

    return res.status(200).json({
      success: true,
      user: safeUser,
    });
  } catch (error) {
    console.log(
      "Error in login controller:",
      error.message
    );

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}


// ==========================================
// LOGOUT
// ==========================================

export async function logout(req, res) {
  try {
    clearAuthCookies(res);

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    clearAuthCookies(res);

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  }
}


// ==========================================
// UPLOAD PROFILE PICTURE
// ==========================================

export async function uploadProfilePicture(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Profile picture is required",
      });
    }

    const profilePic = `${req.protocol}://${req.get(
      "host"
    )}/uploads/profile-pics/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        profilePic,
      },
      {
        new: true,
      }
    ).select(publicUserSelect);

    return res.status(200).json({
      success: true,
      profilePic,
      user,
    });
  } catch (error) {
    console.error(
      "Profile picture upload error:",
      error
    );

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}


// ==========================================
// LPU STUDENT ONBOARDING
// ==========================================

export async function onboard(req, res) {
  try {
    const userId = req.user._id;

    const {
      fullName,
      registrationId,
      course,
      branch,
      year,
      semester,
      skills,
      lookingFor,
      bio,
      location,
      profilePic,
    } = req.body;


    // ======================================
    // VALIDATION
    // ======================================

    const missingFields = [];

    if (!fullName?.trim()) {
      missingFields.push("fullName");
    }

    if (!registrationId?.trim()) {
      missingFields.push("registrationId");
    }

    if (!course?.trim()) {
      missingFields.push("course");
    }

    if (!branch?.trim()) {
      missingFields.push("branch");
    }

    if (!year?.trim()) {
      missingFields.push("year");
    }

    if (!semester?.trim()) {
      missingFields.push("semester");
    }

    if (!Array.isArray(skills) || skills.length === 0) {
      missingFields.push("skills");
    }

    if (
      !Array.isArray(lookingFor) ||
      lookingFor.length === 0
    ) {
      missingFields.push("lookingFor");
    }


    if (missingFields.length > 0) {
      return res.status(400).json({
        message:
          "Please complete all required student profile fields",
        missingFields,
      });
    }


    // ======================================
    // REGISTRATION ID CHECK
    // ======================================

    const existingStudent = await User.findOne({
      registrationId: registrationId.trim().toUpperCase(),
      _id: { $ne: userId },
    });

    if (existingStudent) {
      return res.status(409).json({
        message:
          "This Registration ID is already registered",
      });
    }


    // ======================================
    // UPDATE USER
    // ======================================

    const updatedUser =
      await User.findByIdAndUpdate(
        userId,
        {
          fullName: fullName.trim(),

          registrationId:
            registrationId.trim().toUpperCase(),

          course: course.trim(),

          branch: branch.trim(),

          year: year.trim(),

          semester: semester.trim(),

          skills: skills
            .map((skill) => skill.trim())
            .filter(Boolean),

          lookingFor: lookingFor
            .map((item) => item.trim())
            .filter(Boolean),

          bio: bio?.trim() || "",

          location: location?.trim() || "",

          ...(profilePic !== undefined
            ? { profilePic }
            : {}),

          isOnboarded: true,
        },
        {
          new: true,
          runValidators: true,
        }
      ).select(publicUserSelect);


    // ======================================
    // USER NOT FOUND
    // ======================================

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }


    // ======================================
    // UPDATE STREAM USER
    // ======================================

    await syncStreamUser(updatedUser);


    // ======================================
    // RESPONSE
    // ======================================

    return res.status(200).json({
      success: true,
      message: "LPU student profile completed successfully",
      user: updatedUser,
    });

  } catch (error) {
    console.error(
      "LPU onboarding error:",
      error
    );

    // Duplicate registration ID
    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "Registration ID already exists",
      });
    }

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}


// ==========================================
// VERIFY EMAIL
// ==========================================

export async function verifyEmail(req, res) {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: {
        $gt: new Date(),
      },
    });

    if (!user) {
      return res.status(400).json({
        message:
          "Invalid or expired verification link",
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
    console.log(
      "Verify Email Error:",
      error
    );

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}