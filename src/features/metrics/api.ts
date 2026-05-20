// Metrics module API client for frontend
// - Calls backend /metrics/dashboard endpoint
// - Handles JWT header attachment and 401 redirects
// - Maps snake_case backend payloads to camelCase frontend models

import axios, { AxiosInstance } from "axios";

// Local, lightweight API client mirroring the shared API client shape.
const api: AxiosInstance = (() => {
  const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL ?? "",
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Attach Authorization header if a token exists in localStorage
  instance.interceptors.request.use((config: any) => {
    try {
      if (typeof window !== "undefined") {
        const token =
          localStorage.getItem("token") ?? localStorage.getItem("accessToken");
        if (token) {
          const headers = (config.headers ?? {}) as any;
          headers["Authorization"] = `Bearer ${token}`;
          config.headers = headers;
        }
      }
    } catch {
      // Ignore storage access issues
    }
    return config;
  });

  // Redirect to login on 401 and purge stored tokens
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error?.response?.status;
      if (status === 401) {
        try {
          localStorage.removeItem("token");
          localStorage.removeItem("accessToken");
        } catch {}
        if (typeof window !== "undefined") {
          // Adjust if your app uses a different login route
          window.location.href = "/login";
        }
      }
      return Promise.reject(error);
    },
  );

  return instance;
})();

// Backend response shape (snake_case) - allow flexible keys
type DashboardMetricsBackend = {
  [key: string]: any;
};

// Frontend shape (camelCase) - dynamic mapping, so we keep it loose
export type DashboardMetrics = {
  [key: string]: any;
};

// Recursive snake_case -> camelCase converter
function toCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  if (obj !== null && typeof obj === "object") {
    const out: any = {};
    Object.entries(obj).forEach(([k, v]) => {
      const camel = k.replace(/_([a-z])/g, (m, p1) => p1.toUpperCase());
      out[camel] = toCamelCase(v);
    });
    return out;
  }
  return obj;
}

// Public API
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const res = await api.get<DashboardMetricsBackend>("/metrics/dashboard");
  return toCamelCase(res.data);
}

export default {
  getDashboardMetrics,
};
