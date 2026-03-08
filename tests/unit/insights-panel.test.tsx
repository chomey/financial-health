import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import InsightsPanel, { MOCK_FINANCIAL_DATA } from "@/components/InsightsPanel";
import { generateInsights } from "@/lib/insights";

describe("InsightsPanel", () => {
  it("renders the insights panel container", () => {
    render(<InsightsPanel />);
    expect(screen.getByTestId("insights-panel")).toBeInTheDocument();
  });

  it("renders first 5 insight cards with mock data (collapsed)", () => {
    render(<InsightsPanel />);
    const insights = generateInsights(MOCK_FINANCIAL_DATA);
    // First 5 should be visible in collapsed state
    for (const insight of insights.slice(0, 5)) {
      expect(screen.getByText(insight.message)).toBeInTheDocument();
    }
    // If more than 5, the rest should be hidden
    if (insights.length > 5) {
      expect(screen.getByTestId("insights-toggle")).toBeInTheDocument();
    }
  });

  it("renders icons for each insight", () => {
    render(<InsightsPanel />);
    // Check that shield, chart, and money icons appear (some may appear multiple times)
    expect(screen.getAllByText("🛡️").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("📈").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("💰").length).toBeGreaterThanOrEqual(1);
  });

  it("has the insights-panel test id", () => {
    render(<InsightsPanel />);
    expect(screen.getByTestId("insights-panel")).toBeInTheDocument();
  });

  it("renders insight cards with article role", () => {
    render(<InsightsPanel />);
    const articles = screen.getAllByRole("article");
    expect(articles.length).toBeGreaterThanOrEqual(3);
  });

  it("renders debt-free insight when all values are zero", () => {
    const emptyData = {
      totalAssets: 0,
      totalDebts: 0,
      monthlyIncome: 0,
      monthlyExpenses: 0,
    };
    render(<InsightsPanel data={emptyData} />);
    expect(screen.getByText(/debt-free/i)).toBeInTheDocument();
  });

  it("accepts custom financial data", () => {
    const customData = {
      totalAssets: 500000,
      totalDebts: 100000,
      monthlyIncome: 10000,
      monthlyExpenses: 4000,
    };
    render(<InsightsPanel data={customData} />);
    expect(screen.getByText(/\$400,000/)).toBeInTheDocument();
  });
});
