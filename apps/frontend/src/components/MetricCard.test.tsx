import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MetricCard from "./MetricCard";
import React from "react";

describe("MetricCard", () => {
  it("renders title and value", () => {
    render(<MetricCard title="Total Products" value={42} />);
    expect(screen.getByText("Total Products")).toBeDefined();
    expect(screen.getByText("42")).toBeDefined();
  });

  it("shows dash when value is undefined", () => {
    render(<MetricCard title="Empty Metric" />);
    expect(screen.getByText("-")).toBeDefined();
  });

  it("shows dash when value is null", () => {
    render(<MetricCard title="Null Metric" value={null as any} />);
    expect(screen.getByText("-")).toBeDefined();
  });

  it("renders zero value correctly", () => {
    render(<MetricCard title="Zero" value={0} />);
    expect(screen.getByText("0")).toBeDefined();
  });

  it("renders string values", () => {
    render(<MetricCard title="Label" value="1,234" />);
    expect(screen.getByText("1,234")).toBeDefined();
  });

  it("renders icon when provided", () => {
    const Icon = () => React.createElement("svg", { "data-testid": "test-icon" });
    const { container } = render(
      <MetricCard title="With Icon" value={10} Icon={Icon} />,
    );
    expect(container.querySelector('[data-testid="test-icon"]')).toBeDefined();
  });

  it("does not render icon container when icon is not provided", () => {
    const { container } = render(<MetricCard title="No Icon" value={10} />);
    // The icon container has bg-[#eef2ff] class
    const iconContainers = container.querySelectorAll(".bg-\\[\\#eef2ff\\]");
    expect(iconContainers.length).toBe(0);
  });
});
