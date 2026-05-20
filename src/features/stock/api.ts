// Stock module API client for frontend
// Provides typed wrappers around backend /stocks endpoints with snake_case payloads
// and camelCase frontend-friendly models.

// Lightweight local API client to avoid cross-package dependency issues in this task.
// It mirrors the necessary subset of the shared API client (baseURL, JSON, and JWT header handling).
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

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
      // Silently ignore any issues accessing localStorage
    }
    return config;
  });

  return instance;
})();

// Backend response shape (snake_case)
type StockBackend = {
  id: string;
  product_id: string;
  quantity: number;
  min_quantity: number;
  created_at?: string;
  updated_at?: string;
};

// Frontend (camelCase) shape
export type Stock = {
  id: string;
  productId: string;
  quantity: number;
  minQuantity: number;
  createdAt?: string;
  updatedAt?: string;
};

// Create payload (camelCase on frontend, converted to snake_case for backend)
export type CreateStockPayload = {
  productId: string;
  quantity: number;
  minQuantity?: number;
};

// Update payload (only fields that can be updated). CamelCase here; will map to snake_case.
export type UpdateStockPayload = Partial<CreateStockPayload>;

// Helpers: map between backend snake_case and frontend camelCase models
const toFrontend = (s: StockBackend): Stock => {
  return {
    id: s.id,
    productId: s.product_id,
    quantity: s.quantity,
    minQuantity: s.min_quantity,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  };
};

const toBackendPayload = (payload: CreateStockPayload) => {
  const body: any = {
    product_id: payload.productId,
    quantity: payload.quantity,
  };
  if (payload.minQuantity !== undefined) {
    body.min_quantity = payload.minQuantity;
  }
  return body;
};

const toBackendUpdatePayload = (payload: UpdateStockPayload) => {
  const body: any = {};
  if (payload.productId !== undefined) body.product_id = payload.productId;
  if (payload.quantity !== undefined) body.quantity = payload.quantity;
  if (payload.minQuantity !== undefined)
    body.min_quantity = payload.minQuantity;
  return body;
};

// API wrappers
export async function getStocks(): Promise<Stock[]> {
  const res = await api.get<StockBackend[]>("/stocks");
  return res.data.map(toFrontend);
}

export async function getStock(id: string): Promise<Stock> {
  const res = await api.get<StockBackend>(`/stocks/${id}`);
  return toFrontend(res.data);
}

export async function createStock(payload: CreateStockPayload): Promise<Stock> {
  const body = toBackendPayload(payload);
  const res = await api.post<StockBackend>("/stocks", body);
  return toFrontend(res.data);
}

export async function updateStock(
  id: string,
  payload: UpdateStockPayload,
): Promise<Stock> {
  const body = toBackendUpdatePayload(payload);
  const res = await api.patch<StockBackend>(`/stocks/${id}`, body);
  return toFrontend(res.data);
}

export async function deleteStock(id: string): Promise<void> {
  await api.delete(`/stocks/${id}`);
}

export async function getStocksByProduct(productId: string): Promise<Stock[]> {
  const res = await api.get<StockBackend[]>(`/stocks/product/${productId}`);
  return res.data.map(toFrontend);
}

// --- Helper utilities ---
// Compute total stock for a product from a list of Stock records
export function calcTotalStockForProduct(
  productId: string,
  stocks: Stock[],
): number {
  return stocks
    .filter((s) => s.productId === productId)
    .reduce((acc, s) => acc + s.quantity, 0);
}

// Determine stock status for a product based on total quantity and thresholds
// Strategy:
// - ok  => total > max(minQuantity across relevant stocks)
// - low => 0 < total <= max(minQuantity across relevant stocks)
// - out => total <= 0
export function stockStatus(
  productId: string,
  stocks: Stock[],
): "ok" | "low" | "out" {
  const relevant = stocks.filter((s) => s.productId === productId);
  const total = calcTotalStockForProduct(productId, stocks);
  if (total <= 0) return "out";
  const maxMinQ =
    relevant.length > 0 ? Math.max(...relevant.map((s) => s.minQuantity)) : 0;
  return total > maxMinQ ? "ok" : "low";
}

export default {
  getStocks,
  getStock,
  createStock,
  updateStock,
  deleteStock,
  getStocksByProduct,
  calcTotalStockForProduct,
  stockStatus,
};
