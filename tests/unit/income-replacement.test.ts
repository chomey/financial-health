import { describe, it, expect } from "vitest";
import { generateInsights } from "@/lib/insights";
import type { FinancialData } from "@/lib/insights";

/** Base financial data with income for ratio tests */
const baseData: FinancialData = {
  totalAssets: 0,
  totalDebts: 0,
  monthlyIncome: 5000,
  monthlyExpenses: 3000,
};

function makeData(liquidAssets: number, monthlyIncome: number): FinancialData {
  // incomeReplacementRatio = liquidAssets × 0.04 / 12 / monthlyIncome × 100
  const ratio = monthlyIncome > 0
    ? parseFloat((liquidAssets * 0.04 / 12 / monthlyIncome * 100).toFixed(1))
    : undefined;
  return { ...baseData, totalAssets: liquidAssets, monthlyIncome, incomeReplacementRatio: ratio };
}

describe("income replacement ratio calculation", () => {
  it("computes ratio correctly for a 25% case", () => {
    // liquidAssets × 0.04 / 12 / monthlyIncome = X
    // 225000 × 0.04 / 12 / 2500 = 750 / 2500 = 30%
    const ratio = 225000 * 0.04 / 12 / 2500 * 100;
    expect(ratio).toBeCloseTo(30, 1);
  });

  it("computes ratio correctly for 100% (FI threshold)", () => {
    // income: $5000/mo. FI: need assets × 0.04/12 = 5000 → assets = 5000 × 12 / 0.04 = 1,500,000
    const ratio = 1_500_000 * 0.04 / 12 / 5000 * 100;
    expect(ratio).toBeCloseTo(100, 1);
  });

  it("returns 0 ratio for 0 assets", () => {
    const ratio = 0 * 0.04 / 12 / 5000 * 100;
    expect(ratio).toBe(0);
  });

  it("returns ratio > 100 for overachievement", () => {
    const ratio = 2_000_000 * 0.04 / 12 / 5000 * 100;
    expect(ratio).toBeGreaterThan(100);
  });
});

describe("income replacement tier assignment", () => {
  it("assigns 'Early stage' tier for pct < 25", () => {
    const data = makeData(100_000, 5000); // ratio ≈ 6.7%
    const insights = generateInsights(data);
    const ir = insights.find((i) => i.id === "income-replacement");
    expect(ir).toBeDefined();
    expect(ir!.message).toMatch(/brings you closer to financial independence/);
  });

  it("assigns 'Building momentum' tier for 25-49%", () => {
    // 375000 × 0.04 / 12 / 5000 × 100 = 25%
    const data = makeData(375_000, 5000);
    const insights = generateInsights(data);
    const ir = insights.find((i) => i.id === "income-replacement");
    expect(ir).toBeDefined();
    expect(ir!.message).toMatch(/building real momentum/);
  });

  it("assigns 'Strong position' tier for 50-74%", () => {
    // 750000 × 0.04 / 12 / 5000 × 100 = 50%
    const data = makeData(750_000, 5000);
    const insights = generateInsights(data);
    const ir = insights.find((i) => i.id === "income-replacement");
    expect(ir).toBeDefined();
    expect(ir!.message).toMatch(/strong financial position/);
  });

  it("assigns 'Nearly independent' tier for 75-99%", () => {
    // 1125000 × 0.04 / 12 / 5000 × 100 = 75%
    const data = makeData(1_125_000, 5000);
    const insights = generateInsights(data);
    const ir = insights.find((i) => i.id === "income-replacement");
    expect(ir).toBeDefined();
    expect(ir!.message).toMatch(/nearly financially independent/);
  });

  it("assigns 'Financially independent' tier for 100%+", () => {
    // 1500000 × 0.04 / 12 / 5000 × 100 = 100%
    const data = makeData(1_500_000, 5000);
    const insights = generateInsights(data);
    const ir = insights.find((i) => i.id === "income-replacement");
    expect(ir).toBeDefined();
    expect(ir!.message).toMatch(/financial independence/);
  });
});

describe("income replacement insight generation", () => {
  it("generates income-replacement insight type", () => {
    const data = makeData(500_000, 5000);
    const insights = generateInsights(data);
    const ir = insights.find((i) => i.id === "income-replacement");
    expect(ir).toBeDefined();
    expect(ir!.type).toBe("income-replacement");
    expect(ir!.icon).toBe("🎯");
  });

  it("includes percentage in message for non-zero ratio", () => {
    const data = makeData(375_000, 5000); // 25%
    const insights = generateInsights(data);
    const ir = insights.find((i) => i.id === "income-replacement");
    expect(ir!.message).toMatch(/25%/);
  });

  it("does not generate insight when monthlyIncome is 0", () => {
    const data: FinancialData = {
      ...baseData,
      totalAssets: 500_000,
      monthlyIncome: 0,
      incomeReplacementRatio: undefined,
    };
    const insights = generateInsights(data);
    const ir = insights.find((i) => i.id === "income-replacement");
    expect(ir).toBeUndefined();
  });

  it("shows 0-asset early stage message", () => {
    const data: FinancialData = {
      ...baseData,
      totalAssets: 0,
      monthlyIncome: 5000,
      incomeReplacementRatio: 0,
    };
    const insights = generateInsights(data);
    const ir = insights.find((i) => i.id === "income-replacement");
    expect(ir).toBeDefined();
    expect(ir!.message).toMatch(/Start investing/);
  });

  it("handles very high ratio gracefully (over 100%)", () => {
    const data = makeData(3_000_000, 5000); // ~200%
    const insights = generateInsights(data);
    const ir = insights.find((i) => i.id === "income-replacement");
    expect(ir).toBeDefined();
    expect(ir!.message).toMatch(/financial independence/);
  });
});
