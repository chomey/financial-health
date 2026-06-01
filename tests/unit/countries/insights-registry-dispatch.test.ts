import { describe, expect, it } from "vitest";
import { generateInsights } from "@/lib/insights";
import type { FinancialData } from "@/lib/insights";
import type { FinancialState } from "@/lib/financial-types";

const base: FinancialData = {
  totalAssets: 5_000,
  totalDebts: 0,
  monthlyIncome: 4_000,
  monthlyExpenses: 2_000,
};

describe("generateInsights registry dispatch", () => {
  it("adds candidates from the selected country provider", () => {
    const state = (country: "CA" | "US"): FinancialState => ({
      assets: [],
      debts: [],
      income: [{ id: "income", category: "Salary", amount: 4_000 }],
      expenses: [],
      properties: [],
      stocks: [],
      country,
    });
    const caInsights = generateInsights({
      ...base,
      country: "CA",
      insightState: state("CA"),
    });
    const usInsights = generateInsights({
      ...base,
      country: "US",
      insightState: state("US"),
    });

    expect(caInsights.some((insight) => insight.id === "ca-no-tfsa")).toBe(true);
    expect(caInsights.some((insight) => insight.id === "us-no-roth-ira")).toBe(false);
    expect(usInsights.some((insight) => insight.id === "us-no-roth-ira")).toBe(true);
    expect(usInsights.some((insight) => insight.id === "ca-no-tfsa")).toBe(false);
  });
});
