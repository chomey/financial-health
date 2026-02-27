import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SnapshotDashboard from "@/components/SnapshotDashboard";
import { formatMetricValue, MOCK_METRICS } from "@/components/SnapshotDashboard";

describe("SnapshotDashboard", () => {
  it("renders all four metric cards", () => {
    render(<SnapshotDashboard />);
    expect(screen.getByText("Net Worth")).toBeInTheDocument();
    expect(screen.getByText("Monthly Surplus")).toBeInTheDocument();
    expect(screen.getByText("Financial Runway")).toBeInTheDocument();
    expect(screen.getByText("Debt-to-Asset Ratio")).toBeInTheDocument();
  });

  it("renders icons for each metric", () => {
    render(<SnapshotDashboard />);
    expect(screen.getByText("💰")).toBeInTheDocument();
    expect(screen.getByText("📈")).toBeInTheDocument();
    expect(screen.getByText("🛡️")).toBeInTheDocument();
    expect(screen.getByText("⚖️")).toBeInTheDocument();
  });

  it("renders metric values with accessible labels", () => {
    render(<SnapshotDashboard />);
    // aria-labels contain the final formatted values regardless of animation state
    expect(
      screen.getByLabelText("Net Worth: -$229,500")
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Monthly Surplus: $3,350")
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Financial Runway: 22.2 mo")
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Debt-to-Asset Ratio: 4.50")
    ).toBeInTheDocument();
  });

  it("shows tooltip on hover for Net Worth", () => {
    render(<SnapshotDashboard />);
    const netWorthCard = screen.getByRole("group", { name: "Net Worth" });
    fireEvent.mouseEnter(netWorthCard);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    expect(
      screen.getByText(/Your total assets minus total debts/)
    ).toBeInTheDocument();
  });

  it("shows tooltip on hover for Monthly Surplus", () => {
    render(<SnapshotDashboard />);
    const card = screen.getByRole("group", { name: "Monthly Surplus" });
    fireEvent.mouseEnter(card);
    expect(
      screen.getByText(/How much more you earn than you spend/)
    ).toBeInTheDocument();
  });

  it("hides tooltip on mouse leave", () => {
    render(<SnapshotDashboard />);
    const card = screen.getByRole("group", { name: "Net Worth" });
    fireEvent.mouseEnter(card);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    fireEvent.mouseLeave(card);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("uses green color class for positive metrics", () => {
    render(<SnapshotDashboard />);
    const surplusValue = screen.getByLabelText("Monthly Surplus: $3,350");
    expect(surplusValue.className).toContain("text-green-600");
  });

  it("uses rose color class for negative currency values", () => {
    render(<SnapshotDashboard />);
    const netWorthValue = screen.getByLabelText("Net Worth: -$229,500");
    expect(netWorthValue.className).toContain("text-rose-600");
  });

  it("renders the dashboard container with test id", () => {
    render(<SnapshotDashboard />);
    expect(screen.getByTestId("snapshot-dashboard")).toBeInTheDocument();
  });

  it("has four metric card groups", () => {
    render(<SnapshotDashboard />);
    const groups = screen.getAllByRole("group");
    expect(groups.length).toBe(4);
  });
});

describe("formatMetricValue", () => {
  it("formats positive currency values", () => {
    expect(formatMetricValue(3350, "currency")).toBe("$3,350");
  });

  it("formats negative currency values with minus sign", () => {
    const result = formatMetricValue(-229500, "currency");
    expect(result).toBe("-$229,500");
  });

  it("formats zero currency", () => {
    expect(formatMetricValue(0, "currency")).toBe("$0");
  });

  it("formats months with one decimal", () => {
    expect(formatMetricValue(22.2, "months")).toBe("22.2 mo");
  });

  it("formats ratio with two decimals", () => {
    expect(formatMetricValue(4.5, "ratio")).toBe("4.50");
  });
});

describe("MOCK_METRICS", () => {
  it("has four metrics", () => {
    expect(MOCK_METRICS.length).toBe(4);
  });

  it("contains correct metric titles", () => {
    const titles = MOCK_METRICS.map((m) => m.title);
    expect(titles).toEqual([
      "Net Worth",
      "Monthly Surplus",
      "Financial Runway",
      "Debt-to-Asset Ratio",
    ]);
  });
});
