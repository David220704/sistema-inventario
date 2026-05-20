import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockGetProducts = vi.fn();
const mockGetSales = vi.fn();
const mockCreateSale = vi.fn();

vi.mock("@/lib/api", () => ({
  getProducts: (...args: any[]) => mockGetProducts(...args),
  getSales: (...args: any[]) => mockGetSales(...args),
  createSale: (...args: any[]) => mockCreateSale(...args),
  getTotalStock: (p: any) => p?.stocks?.reduce((s: number, st: any) => s + st.quantity, 0) ?? p?.stockQuantity ?? 0,
}));

vi.mock("@/components/Toast", () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

import SalesPage from "./page";

const mockProducts = [
  { id: "p1", name: "Laptop", price: 999.99, stockQuantity: 10, stocks: [], min_quantity: 2 },
  { id: "p2", name: "Mouse", price: 25.0, stockQuantity: 50, stocks: [], min_quantity: 10 },
];

describe("SalesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProducts.mockResolvedValue(mockProducts);
    mockGetSales.mockResolvedValue({ sales: [], total: 0, page: 1, limit: 5, pages: 0 });
    mockCreateSale.mockResolvedValue({ id: "sale-1", total: 1024.99, items: [] });
  });

  it("renders page title", async () => {
    render(<SalesPage />);
    expect(await screen.findByText("Ventas")).toBeDefined();
  });

  it("shows the registrar venta heading", async () => {
    render(<SalesPage />);
    expect(await screen.findByRole("heading", { name: "Registrar venta" })).toBeDefined();
  });

  it("shows Ventas recientes section", async () => {
    render(<SalesPage />);
    expect(await screen.findByText("Ventas recientes")).toBeDefined();
  });

  it("shows empty state for recent sales when no data", async () => {
    render(<SalesPage />);
    expect(
      await screen.findByText("No hay ventas en este período."),
    ).toBeDefined();
  });

  it("shows empty state for current items", async () => {
    render(<SalesPage />);
    expect(
      await screen.findByText("No se han agregado productos."),
    ).toBeDefined();
  });

  it("adds product to sale items and shows total", async () => {
    render(<SalesPage />);
    expect(await screen.findByText("Ventas")).toBeDefined();

    const user = userEvent.setup();
    const addBtn = screen.getByText("Agregar producto");
    await user.click(addBtn);

    // Item should appear in the items table
    // The toast may show an error because no product is selected
    // Let's select a product first
    const select = screen.getAllByRole("combobox")[0];
    await user.selectOptions(select, "p1");
    await user.click(addBtn);

    // Should show the product in items
    expect(screen.getByText("Laptop")).toBeDefined();
    // Total should be 999.99 (may appear multiple times: unit price, subtotal, total)
    expect(screen.getAllByText("999.99").length).toBeGreaterThanOrEqual(1);
  });

  it("has the confirm sale button", async () => {
    render(<SalesPage />);
    expect(await screen.findByRole("button", { name: "Registrar venta" })).toBeDefined();
  });
});
