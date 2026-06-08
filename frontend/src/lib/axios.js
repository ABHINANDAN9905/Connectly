import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://connectly-backend-kw1s.onrender.com";

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Response interceptor to handle errors silently for auth checks
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't log 401 errors from auth/me endpoint
    if (
      error.response?.status === 401 &&
      error.config?.url?.includes("/auth/me")
    ) {
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);