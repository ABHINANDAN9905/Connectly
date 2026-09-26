import fs from "fs";
import path from "path";
import multer from "multer";

// ==========================================
// PROFILE PICTURE DIRECTORY
// ==========================================

const profilePicDir = path.join(
  process.cwd(),
  "uploads",
  "profile-pics"
);

fs.mkdirSync(profilePicDir, {
  recursive: true,
});

// ==========================================
// COVER IMAGE DIRECTORY
// ==========================================

const coverImageDir = path.join(
  process.cwd(),
  "uploads",
  "cover-images"
);

fs.mkdirSync(coverImageDir, {
  recursive: true,
});

// ==========================================
// COMMON IMAGE FILTER
// ==========================================

const imageFilter = (_req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(
      new Error("Only image uploads are allowed")
    );
  }

  cb(null, true);
};

// ==========================================
// PROFILE PICTURE STORAGE
// ==========================================

const profilePicStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, profilePicDir);
  },

  filename: (req, file, cb) => {
    const ext =
      path.extname(file.originalname) || ".jpg";

    cb(
      null,
      `${req.user?._id || "guest"}-${Date.now()}${ext}`
    );
  },
});

// ==========================================
// COVER IMAGE STORAGE
// ==========================================

const coverImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, coverImageDir);
  },

  filename: (req, file, cb) => {
    const ext =
      path.extname(file.originalname) || ".jpg";

    cb(
      null,
      `${req.user?._id || "guest"}-${Date.now()}${ext}`
    );
  },
});

// ==========================================
// PROFILE PICTURE UPLOAD
// ==========================================

export const uploadProfilePic = multer({
  storage: profilePicStorage,

  limits: {
    fileSize: 2 * 1024 * 1024,
  },

  fileFilter: imageFilter,
});

// ==========================================
// COVER IMAGE UPLOAD
// ==========================================

export const uploadCoverPic = multer({
  storage: coverImageStorage,

  limits: {
    // Cover images can be slightly larger
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: imageFilter,
});