import axios from "axios";

const RAW_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://connectly-backend-kw1s.onrender.com";

// Agar env me /api laga hua ho to remove kar do
const BASE_URL = RAW_BASE_URL
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");

export const API_BASE_URL = BASE_URL;

export const axiosInstance = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true,
});

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 from /auth/me simply means user is not logged in
    if (
      error.response?.status === 401 &&
      error.config?.url?.includes("/auth/me")
    ) {
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);