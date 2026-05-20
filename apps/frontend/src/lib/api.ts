/**
 * API Service
 *
 * Cliente HTTP para comunicar con el backend.
 * Usa axios con configuración base y manejo de tokens JWT.
 *
 * @module api
 */

"use client";

import axios, { AxiosError } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor: agregar token JWT a cada request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor: manejar errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

// ==================== Types ====================

export type Product = {
  id: string;
  name: string;
  sku?: string;
  price: number;
  stockQuantity?: number;
  category_id?: string;
  stock?: number;
  stock_total?: number;
  min_quantity?: number;
  category?: Category;
  stocks?: Stock[];
  created_at?: string;
  updated_at?: string;
};

export type Category = {
  id: string;
  name: string;
  slug?: string;
  description?: string;
};

export type Stock = {
  id: string;
  product_id: string;
  quantity: number;
  min_quantity: number;
  location: string;
  created_at: string;
  updated_at: string;
};

export type Sale = {
  id: string;
  created_at: string;
  updated_at?: string;
  total: number;
  status: string;
  tenant_id: string;
  items: SaleItem[];
};

export type SaleItem = {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
  product?: Product;
};

// Backend-sent shape (snake_case)
type DashboardMetricsFromBackend = {
  total_products: number;
  total_categories: number;
  total_stock: number;
  low_stock_count: number;
  out_of_stock_count: number;
  low_stock_alerts: any[];
  recent_products: Product[];
  stock_by_category: any[];
};

// CamelCase frontend shape
export type DashboardMetrics = {
  totalProducts: number;
  totalCategories: number;
  totalStock: number;
  lowStockCount: number;
  outOfStockCount: number;
  lowStockAlerts: StockAlertCamel[];
  recentProducts: Product[];
  stockByCategory: any[];
};

export type StockAlertCamel = {
  productId: string;
  productName?: string;
  quantity: number;
  minQuantity: number;
  location?: string;
};

// ==================== Settings API Types ====================

export type Profile = {
  name?: string;
  email?: string;
  username?: string;
  avatar_url?: string;
  avatarUrl?: string;
  [key: string]: any;
};

export type Preferences = {
  language?: string;
  theme?: "light" | "dark" | "system";
  [key: string]: any;
};

export type UpdateProfileData = Partial<{
  name: string;
  email: string;
  username: string;
  avatar_url: string;
  avatarUrl: string;
}>;

export type UpdatePreferencesData = Partial<Preferences>;

export type ChangePasswordData = {
  oldPassword: string;
  newPassword: string;
};

export type ChangePasswordResponse = {
  message?: string;
  [key: string]: any;
};

export type ExportDataResponse = {
  url?: string;
  status?: string;
  [key: string]: any;
};

export type DeleteAccountResponse = {
  deleted: boolean;
  [key: string]: any;
};

// ==================== Alerts API Types ====================
// Pagination helper used by multiple endpoints
export type PaginationResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};
// New alert-related types: AlertStats for simple counts
export type AlertStats = {
  total: number;
  unread: number;
  read: number;
  byType?: Record<string, number>;
  [key: string]: any;
};

// Helper: extract a user-friendly error message from AxiosError
function extractErrorMessage(error: AxiosError, fallback: string): string {
  const data = error.response?.data as any;
  const message = data?.message ?? error.message;
  return message ? String(message) : fallback;
}

// ==================== Settings API FUNCTIONS ====================

export async function getProfile(): Promise<Profile> {
  try {
    const { data } = await api.get<Profile>("/settings/profile");
    return data;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error as AxiosError, "Failed to load profile."),
    );
  }
}

export async function updateProfile(data: UpdateProfileData): Promise<Profile> {
  try {
    const { data: updated } = await api.patch<Profile>(
      "/settings/profile",
      data,
    );
    return updated;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error as AxiosError, "Failed to update profile."),
    );
  }
}

export async function changePassword(
  oldPassword: string,
  newPassword: string,
): Promise<ChangePasswordResponse> {
  try {
    const payload = { old_password: oldPassword, new_password: newPassword };
    const { data } = await api.post<ChangePasswordResponse>(
      "/settings/password",
      payload,
    );
    return data;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error as AxiosError, "Failed to change password."),
    );
  }
}

export async function getPreferences(): Promise<Preferences> {
  try {
    const { data } = await api.get<Preferences>("/settings/preferences");
    return data;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error as AxiosError, "Failed to load preferences."),
    );
  }
}

export async function updatePreferences(
  data: UpdatePreferencesData,
): Promise<Preferences> {
  try {
    const { data: updated } = await api.patch<Preferences>(
      "/settings/preferences",
      data,
    );
    return updated;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error as AxiosError, "Failed to update preferences."),
    );
  }
}

export async function exportData(): Promise<ExportDataResponse> {
  try {
    const { data } = await api.post<ExportDataResponse>("/settings/export");
    return data;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error as AxiosError, "Failed to export data."),
    );
  }
}

export async function deleteAccount(): Promise<DeleteAccountResponse> {
  try {
    const { data } =
      await api.delete<DeleteAccountResponse>("/settings/account");
    return data;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error as AxiosError, "Failed to delete account."),
    );
  }
}

// ==================== Products API ====================

export async function getProducts(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<Product[]> {
  const { data } = await api.get<{
    items: Product[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }>("/products", { params });
  return data.items;
}

export async function getProduct(id: string): Promise<Product> {
  const { data } = await api.get<Product>(`/products/${id}`);
  return data;
}

export type CreateProductData = {
  name: string;
  sku?: string;
  category_id: string;
  price: number;
  min_quantity?: number;
  initialStock?: number;
  image_url?: string;
};

// Uploads: image/file upload helper
export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("image", file);
  const { data } = await api.post<{ path: string }>("/uploads", form);
  return data.path ?? "";
}

export type UpdateProductData = Partial<CreateProductData>;

export async function createProduct(
  product: CreateProductData,
): Promise<Product> {
  const { data } = await api.post<Product>("/products", product);
  return data;
}

export async function updateProduct(
  id: string,
  product: UpdateProductData,
): Promise<Product> {
  const { data } = await api.patch<Product>(`/products/${id}`, product);
  return data;
}

export async function deleteProduct(
  id: string,
): Promise<{ deleted: boolean; id: string }> {
  const { data } = await api.delete<{ deleted: boolean; id: string }>(
    `/products/${id}`,
  );
  return data;
}

// ==================== Categories API ====================

export async function getCategories(): Promise<Category[]> {
  const { data } = await api.get<Category[]>("/categories");
  return data;
}

export async function getCategory(id: string): Promise<Category> {
  const { data } = await api.get<Category>(`/categories/${id}`);
  return data;
}

export async function createCategory(category: {
  name: string;
  description?: string;
  slug?: string;
}): Promise<Category> {
  const { data } = await api.post<Category>("/categories", category);
  return data;
}

export async function updateCategory(
  id: string,
  category: { name?: string; description?: string; slug?: string },
): Promise<Category> {
  const { data } = await api.patch<Category>(`/categories/${id}`, category);
  return data;
}

export async function deleteCategory(
  id: string,
): Promise<{ deleted: boolean; id: string }> {
  const { data } = await api.delete<{ deleted: boolean; id: string }>(
    `/categories/${id}`,
  );
  return data;
}

export async function seedCategories(): Promise<{
  message: string;
  categories: Category[];
}> {
  const { data } = await api.post<{ message: string; categories: Category[] }>(
    "/categories/seed",
  );
  return data;
}

// ==================== Stock API ====================

export type CreateStockData = {
  product_id: string;
  quantity: number;
  min_quantity?: number;
  location: string;
};

export type UpdateStockData = Partial<CreateStockData>;

export async function getStocks(params?: {
  product_id?: string;
  location?: string;
}): Promise<any[]> {
  const { data } = await api.get<any[]>("/stocks", { params });
  return data;
}

export async function getStock(id: string): Promise<any> {
  const { data } = await api.get<any>(`/stocks/${id}`);
  return data;
}

export async function createStock(stock: CreateStockData): Promise<any> {
  const { data } = await api.post<any>("/stocks", stock);
  return data;
}

export async function updateStock(
  id: string,
  stock: UpdateStockData,
): Promise<any> {
  const { data } = await api.patch<any>(`/stocks/${id}`, stock);
  return data;
}

export async function deleteStock(id: string): Promise<{ deleted: boolean }> {
  const { data } = await api.delete<{ deleted: boolean }>(`/stocks/${id}`);
  return data;
}

export async function getStocksByProduct(productId: string): Promise<any[]> {
  const { data } = await api.get<any[]>(`/stocks/product/${productId}`);
  return data;
}

// Helper functions
export function getTotalStock(product: Product | undefined): number {
  if (!product) return 0;
  // First: sum real stock entries from the stocks array (authoritative source)
  if (product.stocks && product.stocks.length > 0) {
    return product.stocks.reduce((sum, s) => sum + s.quantity, 0);
  }
  // Fallback: use stockQuantity (new simplified model)
  if (product.stockQuantity !== undefined && product.stockQuantity !== null) {
    return product.stockQuantity;
  }
  return product.stock_total || product.stock || 0;
}

export function getMinStock(product: Product): number {
  return product.min_quantity || 0;
}

// ==================== Onboarding API ====================

export type OnboardingStatus = {
  onboarding_completed: boolean;
  onboarding_step: number;
};

export async function getOnboardingStatus(
  userId: string,
): Promise<OnboardingStatus> {
  const { data } = await api.get<OnboardingStatus>(
    `/users/${userId}/onboarding`,
  );
  return data;
}

export async function updateOnboardingStep(
  userId: string,
  step: number,
): Promise<OnboardingStatus> {
  const { data } = await api.patch<OnboardingStatus>(
    `/users/${userId}/onboarding/step`,
    { step },
  );
  return data;
}

export async function completeOnboarding(
  userId: string,
): Promise<OnboardingStatus> {
  const { data } = await api.post<OnboardingStatus>(
    `/users/${userId}/onboarding/complete`,
    { completed: true },
  );
  return data;
}

// ==================== Alerts API ====================

export type AlertType = "LOW_STOCK" | "OUT_OF_STOCK";

export type Alert = {
  id: string;
  product_id: string;
  type: AlertType;
  message?: string;
  is_read: boolean;
  created_at: string;
  tenant_id?: string;
  product?: Product;
};

export async function getAlerts(params?: {
  page?: number;
  limit?: number;
  type?: AlertType;
  unread?: boolean;
}): Promise<PaginationResponse<Alert>> {
  try {
    const { data } = await api.get<any>("/alerts", { params });
    let items: Alert[] = [];
    let total = 0;
    let page = 1;
    let limit = 0;
    let pages = 0;

    if (Array.isArray(data)) {
      items = data as Alert[];
    } else if (data?.alerts) {
      items = data.alerts as Alert[];
      total = data.total ?? 0;
      page = data.page ?? 1;
      limit = data.limit ?? 0;
      pages = data.pages ?? 0;
    } else if (data?.items) {
      items = data.items as Alert[];
      total = data.total ?? 0;
      page = data.page ?? 1;
      limit = data.limit ?? 0;
      pages = data.pages ?? 0;
    } else {
      items = [];
      total = data?.total ?? 0;
      page = data?.page ?? 1;
      limit = data?.limit ?? 0;
      pages = data?.pages ?? 0;
    }

    if (!total && items.length > 0) total = items.length;

    return { items, total, page, limit, pages } as PaginationResponse<Alert>;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error as AxiosError, "Failed to load alerts."),
    );
  }
}

export async function markAlertRead(id: string): Promise<Alert> {
  const { data } = await api.patch<Alert>(`/alerts/${id}/read`);
  return data;
}

export async function generateAlerts(): Promise<{ created: number }> {
  const { data } = await api.post<{ created: number }>("/alerts/generate");
  return data;
}

// ==================== Sales API ====================

export type CreateSaleItemData = {
  product_id: string;
  quantity: number;
  unit_price: number;
  location?: string;
};

export type CreateSaleData = {
  items: CreateSaleItemData[];
};

export async function createSale(data: CreateSaleData): Promise<Sale> {
  const { data: sale } = await api.post<Sale>("/sales", data);
  return sale;
}

export async function getSales(params?: {
  page?: number;
  limit?: number;
}): Promise<{ sales: Sale[]; total: number; page: number; limit: number; pages: number }> {
  const { data } = await api.get<any>("/sales", { params });
  // Normalize: backend returns { items, total, page, limit, pages }
  return {
    sales: data.items ?? data.sales ?? [],
    total: data.total ?? 0,
    page: data.page ?? 1,
    limit: data.limit ?? 0,
    pages: data.pages ?? 0,
  };
}

export async function getSale(id: string): Promise<Sale> {
  const { data } = await api.get<Sale>(`/sales/${id}`);
  return data;
}

// ==================== Metrics API ====================

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  // Fetch the raw (snake_case) backend payload
  const { data } =
    await api.get<DashboardMetricsFromBackend>("/metrics/dashboard");

  // Map snake_case payload to camelCase frontend model
  const mapped: DashboardMetrics = {
    totalProducts: data.total_products,
    totalCategories: data.total_categories,
    totalStock: data.total_stock,
    lowStockCount: data.low_stock_count,
    outOfStockCount: data.out_of_stock_count,
    lowStockAlerts: (data.low_stock_alerts ?? []).map((a) => {
      const snake = a as any;
      return {
        productId: snake.product_id ?? "",
        productName: snake.product_name ?? undefined,
        quantity: snake.quantity,
        minQuantity: snake.min_quantity ?? 0,
        location: snake.location ?? undefined,
      } as StockAlertCamel;
    }),
    recentProducts: data.recent_products ?? [],
    stockByCategory: data.stock_by_category ?? [],
  };
  return mapped;
}

// Export api instance for custom requests
export default api;
