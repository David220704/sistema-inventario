import axios from "axios";

// Axios instance configured for the frontend API
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "/",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  try {
    // Token storage strategy may vary; fallback to localStorage
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token && config.headers) {
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // Silently ignore token retrieval errors
  }
  return config;
});

// Global response handling: redirect to login on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      // Redirect to login page
      if (typeof window !== "undefined") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  },
);

export default api;
