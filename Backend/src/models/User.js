import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    // ==========================================
    // BASIC ACCOUNT INFORMATION
    // ==========================================

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phoneNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    password: {
      type: String,
      minlength: 6,
    },

    // ==========================================
    // PROFILE
    // ==========================================

    profilePic: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    location: {
      type: String,
      default: "",
      trim: true,
    },

    // ==========================================
    // LPU STUDENT INFORMATION
    // ==========================================

    registrationId: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
    },

    course: {
      type: String,
      trim: true,
      default: "",
    },

    branch: {
      type: String,
      trim: true,
      default: "",
    },

    year: {
      type: String,
      trim: true,
      default: "",
    },

    semester: {
      type: String,
      trim: true,
      default: "",
    },

    // ==========================================
    // SKILLS
    // ==========================================

    skills: {
      type: [String],
      default: [],
    },

    // ==========================================
    // LOOKING FOR
    // ==========================================

    lookingFor: {
      type: [String],
      default: [],
    },

    // ==========================================
    // ACCOUNT STATUS
    // ==========================================

    isOnboarded: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    deactivatedAt: {
      type: Date,
      default: null,
    },

    // ==========================================
    // EMAIL VERIFICATION
    // ==========================================

    isVerified: {
      type: Boolean,
      default: false,
    },

    verificationToken: {
      type: String,
      default: null,
    },

    verificationTokenExpiry: {
      type: Date,
      default: null,
    },

    // ==========================================
    // PASSWORD RESET
    // ==========================================

    resetPasswordToken: {
      type: String,
      default: null,
    },

    resetPasswordTokenExpiry: {
      type: Date,
      default: null,
    },

    // ==========================================
    // FRIENDS
    // ==========================================

    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ==========================================
// PASSWORD HASHING
// ==========================================

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);

    this.password = await bcrypt.hash(this.password, salt);

    next();
  } catch (error) {
    next(error);
  }
});

// ==========================================
// PASSWORD MATCHING
// ==========================================

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;