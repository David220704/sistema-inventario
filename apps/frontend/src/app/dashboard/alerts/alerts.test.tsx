import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const mockGetAlerts = vi.fn();
const mockGetProduct = vi.fn();
const mockMarkAlertRead = vi.fn();
const mockGenerateAlerts = vi.fn();

vi.mock("../../../lib/api", () => ({
  getAlerts: (...args: any[]) => mockGetAlerts(...args),
  getProduct: (...args: any[]) => mockGetProduct(...args),
  markAlertRead: (...args: any[]) => mockMarkAlertRead(...args),
  generateAlerts: (...args: any[]) => mockGenerateAlerts(...args),
  getTotalStock: (p: any) => p?.stocks?.reduce((s: number, st: any) => s + st.quantity, 0) ?? p?.stockQuantity ?? 0,
}));

vi.mock("../../../components/ThemeProvider", () => ({
  useTheme: () => ({ darkMode: false }),
}));

vi.mock("../../../components/Toast", () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

import AlertsPage from "./page";

const mockAlert = {
  id: "alert-1",
  product_id: "p1",
  type: "LOW_STOCK",
  message: "Stock bajo para Producto X",
  is_read: false,
  created_at: "2026-05-19T10:00:00Z",
  product: { id: "p1", name: "Producto X", price: 100, sku: "SKU001", stocks: [], stockQuantity: 2, min_quantity: 10, category: { name: "Cat1" } },
};

describe("AlertsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAlerts.mockResolvedValue({ items: [mockAlert], total: 1, page: 1, limit: 20, pages: 1 });
    mockGenerateAlerts.mockResolvedValue({ created: 1 });
  });

  it("shows loading state initially", () => {
    mockGetAlerts.mockImplementationOnce(() => new Promise(() => {}));
    render(<AlertsPage />);
    expect(screen.getByText("Cargando alertas...")).toBeDefined();
  });

  it("shows error state when API fails", async () => {
    mockGetAlerts.mockRejectedValue(new Error("Fail"));
    render(<AlertsPage />);
    expect(await screen.findByText("Fail")).toBeDefined();
    expect(screen.getByText("Reintentar")).toBeDefined();
  });

  it("renders alert title and filter", async () => {
    render(<AlertsPage />);
    expect(await screen.findByText("Alerts")).toBeDefined();
    expect(screen.getByLabelText("Filtrar por tipo de alerta")).toBeDefined();
  });

  it("shows alert details when data loaded", async () => {
    render(<AlertsPage />);
    expect(await screen.findByText(/Stock bajo/i)).toBeDefined();
    expect(screen.getByText("Nuevo")).toBeDefined(); // is_read = false
  });

  it("shows empty state when no alerts", async () => {
    mockGetAlerts.mockResolvedValue({ items: [], total: 0, page: 1, limit: 20, pages: 0 });
    render(<AlertsPage />);
    expect(await screen.findByText("Sin alertas")).toBeDefined();
  });

  it("shows Ver detalles expand button", async () => {
    render(<AlertsPage />);
    expect(await screen.findByText("Ver detalles")).toBeDefined();
  });
});
