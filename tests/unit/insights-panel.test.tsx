import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import InsightsPanel, { MOCK_FINANCIAL_DATA } from "@/components/InsightsPanel";
import { generateInsights } from "@/lib/insights";

describe("InsightsPanel", () => {
  it("renders the Insights heading", () => {
    render(<InsightsPanel />);
    expect(screen.getByText("Insights")).toBeInTheDocument();
  });

  it("renders insight cards with mock data", () => {
    render(<InsightsPanel />);
    const insights = generateInsights(MOCK_FINANCIAL_DATA);
    for (const insight of insights) {
      expect(screen.getByText(insight.message)).toBeInTheDocument();
    }
  });

  it("renders icons for each insight", () => {
    render(<InsightsPanel />);
    // Check that shield, chart, star, target, and money icons appear
    expect(screen.getByText("🛡️")).toBeInTheDocument();
    expect(screen.getByText("📈")).toBeInTheDocument();
    expect(screen.getByText("🎯")).toBeInTheDocument();
    expect(screen.getByText("💰")).toBeInTheDocument();
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

  it("returns null when no insights are generated", () => {
    const emptyData = {
      totalAssets: 0,
      totalDebts: 0,
      monthlyIncome: 0,
      monthlyExpenses: 0,
      goals: [],
    };
    const { container } = render(<InsightsPanel data={emptyData} />);
    expect(container.firstChild).toBeNull();
  });

  it("accepts custom financial data", () => {
    const customData = {
      totalAssets: 500000,
      totalDebts: 100000,
      monthlyIncome: 10000,
      monthlyExpenses: 4000,
      goals: [{ name: "Dream Home", target: 200000, current: 150000 }],
    };
    render(<InsightsPanel data={customData} />);
    expect(screen.getByText(/Dream Home/)).toBeInTheDocument();
    expect(screen.getByText(/\$400,000/)).toBeInTheDocument();
  });
});
