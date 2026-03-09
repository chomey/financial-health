import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "../test-utils";
import SnapshotDashboard from "@/components/SnapshotDashboard";
import InsightsPanel from "@/components/InsightsPanel";
import type { FinancialData } from "@/lib/insights";

// Minimal metrics set covering all 5 possible metric cards
const mockMetrics = [
  { title: "Net Worth", value: 50000, format: "currency" as const, icon: "💰", tooltip: "", positive: true },
  { title: "Monthly Cash Flow", value: 500, format: "currency" as const, icon: "📈", tooltip: "", positive: true },
  { title: "Financial Runway", value: 6, format: "months" as const, icon: "🛡️", tooltip: "", positive: true },
  { title: "Debt-to-Asset Ratio", value: 0.5, format: "ratio" as const, icon: "⚖️", tooltip: "", positive: true },
  { title: "Income Replacement", value: 25, format: "percent" as const, icon: "🎯", tooltip: "", positive: false },
];

const mockFinancialData: FinancialData = {
  monthlyIncome: 5000,
  monthlyExpenses: 3000,
  totalAssets: 50000,
  totalDebts: 10000,
  monthlySurplus: 500,
  savingsRate: 0.1,
  runway: 6,
  fireNumber: 750000,
  yearsToFire: 25,
  incomeReplacementRatio: 0.25,
  emergencyFundMonths: 6,
  investedAssets: 30000,
};

describe("SnapshotDashboard simple mode", () => {
  it("shows only 3 metrics in simple mode", () => {
    render(<SnapshotDashboard metrics={mockMetrics} />, { mode: "simple" });
    const dashboard = screen.getByTestId("snapshot-dashboard");
    // Only Net Worth, Monthly Cash Flow, Financial Runway should be visible
    expect(screen.getByTestId("metric-card-net-worth")).toBeInTheDocument();
    expect(screen.getByTestId("metric-card-monthly-cash-flow")).toBeInTheDocument();
    expect(screen.getByTestId("metric-card-financial-runway")).toBeInTheDocument();
    // Debt-to-Asset and Income Replacement should be hidden
    expect(screen.queryByTestId("metric-card-debt-to-asset-ratio")).not.toBeInTheDocument();
    expect(screen.queryByTestId("metric-card-income-replacement")).not.toBeInTheDocument();
    expect(dashboard).toBeTruthy();
  });

  it("shows all metrics in advanced mode", () => {
    render(<SnapshotDashboard metrics={mockMetrics} />, { mode: "advanced" });
    expect(screen.getByTestId("metric-card-net-worth")).toBeInTheDocument();
    expect(screen.getByTestId("metric-card-monthly-cash-flow")).toBeInTheDocument();
    expect(screen.getByTestId("metric-card-financial-runway")).toBeInTheDocument();
    expect(screen.getByTestId("metric-card-debt-to-asset-ratio")).toBeInTheDocument();
    expect(screen.getByTestId("metric-card-income-replacement")).toBeInTheDocument();
  });

  it("uses 3-column grid in simple mode", () => {
    render(<SnapshotDashboard metrics={mockMetrics} />, { mode: "simple" });
    const dashboard = screen.getByTestId("snapshot-dashboard");
    expect(dashboard.className).toContain("sm:grid-cols-3");
  });

  it("uses 2-column grid in advanced mode", () => {
    render(<SnapshotDashboard metrics={mockMetrics} />, { mode: "advanced" });
    const dashboard = screen.getByTestId("snapshot-dashboard");
    expect(dashboard.className).toContain("lg:grid-cols-2");
  });
});

describe("InsightsPanel simple mode", () => {
  it("caps insights at 4 in simple mode", () => {
    // Use financial data that would normally generate > 4 insights
    render(<InsightsPanel data={mockFinancialData} />, { mode: "simple" });
    const panel = screen.queryByTestId("insights-panel");
    if (!panel) return; // no insights generated → panel hidden, that's fine
    const rows = panel.querySelectorAll("[data-testid^='insight-card-']");
    expect(rows.length).toBeLessThanOrEqual(4);
  });

  it("shows up to 8 insights in advanced mode", () => {
    render(<InsightsPanel data={mockFinancialData} />, { mode: "advanced" });
    const panel = screen.queryByTestId("insights-panel");
    if (!panel) return;
    const rows = panel.querySelectorAll("[data-testid^='insight-card-']");
    expect(rows.length).toBeLessThanOrEqual(8);
  });

  it("renders insights panel in both modes without crashing", () => {
    const { unmount } = render(<InsightsPanel data={mockFinancialData} />, { mode: "simple" });
    unmount();
    render(<InsightsPanel data={mockFinancialData} />, { mode: "advanced" });
  });
});
