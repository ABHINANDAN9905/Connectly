import jwt from "jsonwebtoken";

const isProduction = process.env.NODE_ENV === "production";

export const accessCookieOptions = {
  httpOnly: true,
  sameSite: isProduction ? "none" : "lax",
  secure: isProduction,
  maxAge: 15 * 60 * 1000,
};

export const signAccessToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET_KEY, { expiresIn: "15m" });

export const setAuthCookies = async (res, user) => {
  const accessToken = signAccessToken(user._id);
  res.cookie("jwt", accessToken, accessCookieOptions);
};

export const clearAuthCookies = (res) => {
  res.clearCookie("jwt");
};

