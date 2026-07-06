import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import InsightsPanel, { MOCK_FINANCIAL_DATA } from "@/components/InsightsPanel";
import { generateInsights } from "@/lib/insights";

describe("InsightsPanel", () => {
  it("renders the insights panel container", () => {
    render(<InsightsPanel />);
    expect(screen.getByTestId("insights-panel")).toBeInTheDocument();
  });

  it("renders generated insight cards with mock data", () => {
    render(<InsightsPanel />);
    const insights = generateInsights(MOCK_FINANCIAL_DATA);
    for (const insight of insights.slice(0, 8)) {
      expect(screen.getByText(insight.message)).toBeInTheDocument();
    }
    expect(screen.queryByTestId("insights-toggle")).not.toBeInTheDocument();
  });

  it("styles insights as cards in a responsive grid", () => {
    render(<InsightsPanel />);
    const panel = screen.getByTestId("insights-panel");
    const list = panel.querySelector("ul");
    const cards = screen.getAllByRole("article");

    expect(list?.className).toContain("sm:grid-cols-2");
    expect(cards[0].className).toContain("bg-white/[0.03]");
    expect(cards[0].className).toContain("border-l-2");
    expect(cards[0].querySelector("span")?.className).toContain("h-8 w-8");
  });

  it("lets long insights span the full grid width", () => {
    render(<InsightsPanel data={{
      totalAssets: 0,
      totalDebts: 10000,
      monthlyIncome: 0,
      monthlyExpenses: 0,
      monthlyDebtPayments: 5000,
      monthlyGrossIncome: 10000,
    }} />);

    expect(screen.getByTestId("insight-card-debt-to-income").className).toContain("sm:col-span-2");
  });

  it("renders the insights label with a count badge", () => {
    render(<InsightsPanel />);
    const insights = generateInsights(MOCK_FINANCIAL_DATA);

    expect(screen.getByText("Insights")).toBeInTheDocument();
    expect(screen.getByText(String(Math.min(insights.length, 8))).className).toContain("bg-cyan-400/10");
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
    // Surplus = $6,000/mo should appear in insights
    expect(screen.getByText(/\$6,000/)).toBeInTheDocument();
  });
});
