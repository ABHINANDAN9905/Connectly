import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { clearAuthCookies, setAuthCookies } from "../lib/tokens.js";

const safeUserSelect = "-password -refreshToken -emailVerificationToken -passwordResetToken";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    const user = await User.findById(decoded.userId).select(safeUserSelect);

    if (!user) {
      return res.status(401).json({ message: "Unauthorized - User not found" });
    }

    if (!user.isActive) {
      clearAuthCookies(res);
      return res.status(403).json({ message: "Account is deactivated" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log("Error in protectRoute middleware", error);
    clearAuthCookies(res);
    res.status(401).json({ message: "Unauthorized" });
  }
};

