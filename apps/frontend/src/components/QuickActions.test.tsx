import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import QuickActions from "./QuickActions";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe("QuickActions", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("renders all four action buttons", () => {
    render(<QuickActions />);
    expect(screen.getByText("Nuevo Producto")).toBeDefined();
    expect(screen.getByText("Agregar Stock")).toBeDefined();
    expect(screen.getByText("Ver Productos")).toBeDefined();
    expect(screen.getByText("Ver Stock")).toBeDefined();
  });

  it("navigates to /dashboard/products on Nuevo Producto click", () => {
    render(<QuickActions />);
    screen.getByText("Nuevo Producto").click();
    expect(mockPush).toHaveBeenCalledWith("/dashboard/products");
  });

  it("navigates to /dashboard/stock on Agregar Stock click", () => {
    render(<QuickActions />);
    screen.getByText("Agregar Stock").click();
    expect(mockPush).toHaveBeenCalledWith("/dashboard/stock");
  });

  it("navigates to /dashboard/products on Ver Productos click", () => {
    render(<QuickActions />);
    screen.getByText("Ver Productos").click();
    expect(mockPush).toHaveBeenCalledWith("/dashboard/products");
  });

  it("navigates to /dashboard/stock on Ver Stock click", () => {
    render(<QuickActions />);
    screen.getByText("Ver Stock").click();
    expect(mockPush).toHaveBeenCalledWith("/dashboard/stock");
  });
});
