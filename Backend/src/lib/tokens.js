import jwt from "jsonwebtoken";

const isDeployed = process.env.NODE_ENV === "production" || process.env.RENDER === "true";
const isSecureCookie = process.env.COOKIE_SECURE
  ? process.env.COOKIE_SECURE === "true"
  : isDeployed;

export const accessCookieOptions = {
  httpOnly: true,
  sameSite: isSecureCookie ? "none" : "lax",
  secure: isSecureCookie,
  maxAge: 15 * 60 * 1000,
};

const clearCookieOptions = {
  httpOnly: accessCookieOptions.httpOnly,
  sameSite: accessCookieOptions.sameSite,
  secure: accessCookieOptions.secure,
};

export const signAccessToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET_KEY, { expiresIn: "15m" });

export const setAuthCookies = async (res, user) => {
  const accessToken = signAccessToken(user._id);
  res.cookie("jwt", accessToken, accessCookieOptions);
};

export const clearAuthCookies = (res) => {
  res.clearCookie("jwt", clearCookieOptions);
};
