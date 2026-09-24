import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://connectly-backend-kw1s.onrender.com";

export const axiosInstance = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true,
});

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't log/handle 401 errors from auth/me
    // because 401 simply means user is not logged in.
    if (
      error.response?.status === 401 &&
      error.config?.url?.includes("/auth/me")
    ) {
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);