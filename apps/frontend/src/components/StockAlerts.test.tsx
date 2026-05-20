import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StockAlerts from "./StockAlerts";
import type { StockAlert } from "./StockAlerts";

function makeAlert(overrides: Partial<StockAlert> = {}): StockAlert {
  return {
    productId: "prod-1",
    productName: "Arduino Uno",
    quantity: 3,
    minQuantity: 10,
    location: "Warehouse A",
    ...overrides,
  };
}

describe("StockAlerts", () => {
  it("shows empty state when alerts is null", () => {
    render(<StockAlerts alerts={null as any} />);
    expect(
      screen.getByText(/Todo en orden/i),
    ).toBeDefined();
  });

  it("shows empty state when alerts is empty array", () => {
    render(<StockAlerts alerts={[]} />);
    expect(
      screen.getByText(/Todo en orden/i),
    ).toBeDefined();
  });

  it("renders section title with alerts", () => {
    render(<StockAlerts alerts={[makeAlert()]} />);
    expect(screen.getByText("Alertas de Stock Bajo")).toBeDefined();
  });

  it("renders product name for each alert", () => {
    render(<StockAlerts alerts={[makeAlert({ productName: "Sensor DHT22" })]} />);
    expect(screen.getByText("Sensor DHT22")).toBeDefined();
  });

  it("renders product id fallback when name is missing", () => {
    render(
      <StockAlerts
        alerts={[makeAlert({ productName: undefined, productId: "prod-xyz" })]}
      />,
    );
    expect(screen.getByText("prod-xyz")).toBeDefined();
  });

  it("renders quantity with rose color class", () => {
    render(<StockAlerts alerts={[makeAlert({ quantity: 2 })]} />);
    const qtyEl = screen.getByText("2");
    expect(qtyEl.className).toContain("rose");
  });

  it("renders multiple alerts", () => {
    const alerts = [
      makeAlert({ productId: "p1", productName: "Item A" }),
      makeAlert({ productId: "p2", productName: "Item B" }),
    ];
    render(<StockAlerts alerts={alerts} />);
    expect(screen.getByText("Item A")).toBeDefined();
    expect(screen.getByText("Item B")).toBeDefined();
  });
});
