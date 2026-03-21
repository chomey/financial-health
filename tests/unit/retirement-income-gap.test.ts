import { describe, it, expect } from "vitest";
import { generateInsights } from "@/lib/insights/generate";
import type { FinancialData } from "@/lib/insights/types";

function makeData(overrides: Partial<FinancialData> = {}): FinancialData {
  return {
    totalAssets: 200_000,
    totalDebts: 10_000,
    liquidAssets: 200_000,
    monthlyIncome: 5000,
    monthlyExpenses: 4000,
    rawMonthlyExpenses: 3000,
    ...overrides,
  };
}

describe("Retirement income gap analysis", () => {
  it("generates gap insight when portfolio + government covers expenses", () => {
    const data = makeData({
      liquidAssets: 1_500_000, // 1.5M × 4% / 12 = $5000/mo
      rawMonthlyExpenses: 4000,
      monthlyGovernmentRetirementIncome: 1500,
    });
    const insights = generateInsights(data);
    const gap = insights.find(i => i.type === "retirement-income-gap");
    expect(gap).toBeDefined();
    expect(gap!.id).toBe("retirement-income-gap-covered");
    expect(gap!.message).toContain("fully covers");
  });

  it("generates close gap insight at 75-99% coverage", () => {
    const data = makeData({
      liquidAssets: 600_000, // $2000/mo via 4% rule
      rawMonthlyExpenses: 3000,
      monthlyGovernmentRetirementIncome: 500, // total $2500 vs $3000 = 83%
    });
    const insights = generateInsights(data);
    const gap = insights.find(i => i.type === "retirement-income-gap");
    expect(gap).toBeDefined();
    expect(gap!.id).toBe("retirement-income-gap-close");
    expect(gap!.message).toContain("83%");
  });

  it("generates moderate gap insight at 50-74% coverage", () => {
    const data = makeData({
      liquidAssets: 300_000, // $1000/mo
      rawMonthlyExpenses: 3000,
      monthlyGovernmentRetirementIncome: 500, // total $1500 vs $3000 = 50%
    });
    const insights = generateInsights(data);
    const gap = insights.find(i => i.type === "retirement-income-gap");
    expect(gap).toBeDefined();
    expect(gap!.id).toBe("retirement-income-gap-moderate");
    expect(gap!.message).toContain("50%");
  });

  it("generates large gap insight below 50% coverage", () => {
    const data = makeData({
      liquidAssets: 100_000, // $333/mo
      rawMonthlyExpenses: 3000,
      monthlyGovernmentRetirementIncome: 0, // total $333 vs $3000 = 11%
    });
    const insights = generateInsights(data);
    const gap = insights.find(i => i.type === "retirement-income-gap");
    expect(gap).toBeDefined();
    expect(gap!.id).toBe("retirement-income-gap-large");
    expect(gap!.message).toContain("11%");
  });

  it("suggests adding government benefits when none configured", () => {
    const data = makeData({
      liquidAssets: 300_000,
      rawMonthlyExpenses: 3000,
      monthlyGovernmentRetirementIncome: undefined,
    });
    const insights = generateInsights(data);
    const gap = insights.find(i => i.type === "retirement-income-gap");
    expect(gap).toBeDefined();
    expect(gap!.message).toContain("government benefits");
  });

  it("no gap insight when no expenses", () => {
    const data = makeData({ rawMonthlyExpenses: 0 });
    const insights = generateInsights(data);
    const gap = insights.find(i => i.type === "retirement-income-gap");
    expect(gap).toBeUndefined();
  });

  it("no gap insight when no assets", () => {
    const data = makeData({ liquidAssets: 0, rawMonthlyExpenses: 3000 });
    const insights = generateInsights(data);
    const gap = insights.find(i => i.type === "retirement-income-gap");
    expect(gap).toBeUndefined();
  });
});
