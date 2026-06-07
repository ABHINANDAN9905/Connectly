import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.MODE === "development" ? "http://localhost:5005/api" : "/api");

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send cookies with the request
});

// Response interceptor to handle errors silently for auth checks
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't log 401 errors from auth/me endpoint - they're expected for unauthenticated users
    if (error.response?.status === 401 && error.config?.url?.includes("/auth/me")) {
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);