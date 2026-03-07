import { describe, it, expect } from "vitest";
import { computeCoastFireAge } from "@/lib/financial-state";
import { generateInsights, type FinancialData } from "@/lib/insights";

describe("computeCoastFireAge", () => {
  it("returns null when currentAge >= targetAge", () => {
    expect(computeCoastFireAge(65, 500000, 40000)).toBeNull();
    expect(computeCoastFireAge(70, 500000, 40000)).toBeNull();
  });

  it("returns null when annualExpenses <= 0", () => {
    expect(computeCoastFireAge(30, 500000, 0)).toBeNull();
    expect(computeCoastFireAge(30, 500000, -1000)).toBeNull();
  });

  it("returns null when currentInvested <= 0", () => {
    expect(computeCoastFireAge(30, 0, 40000)).toBeNull();
    expect(computeCoastFireAge(30, -5000, 40000)).toBeNull();
  });

  it("returns currentAge when already coasting", () => {
    // FIRE number = 40000 / 0.04 = 1,000,000
    // At age 30, 35 years to 65, need: 1M / (1.05)^35 ≈ 181,290
    // With 200,000 invested, future value = 200000 × 1.05^35 ≈ 1,103,568 > 1M
    expect(computeCoastFireAge(30, 200000, 40000)).toBe(30);
  });

  it("returns future coast age when not yet coasting but saving monthly", () => {
    // FIRE number = 40000 / 0.04 = 1,000,000
    // At age 25, with 50,000 invested, saving $2000/mo
    // Without contributions: 50000 × 1.05^40 = 352,000 < 1M — can't coast
    // But with $2000/mo contributions, portfolio grows to coastable level
    const coastAge = computeCoastFireAge(25, 50000, 40000, 65, 0.05, 2000);
    expect(coastAge).not.toBeNull();
    expect(coastAge).toBeGreaterThan(25);
    expect(coastAge).toBeLessThan(65);
  });

  it("returns null when no contributions and can't coast", () => {
    // FIRE number = 40000 / 0.04 = 1,000,000
    // 50000 × 1.05^40 = 352,000 < 1M — can never coast without contributions
    const coastAge = computeCoastFireAge(25, 50000, 40000, 65, 0.05, 0);
    expect(coastAge).toBeNull();
  });

  it("returns null when investments are too small to ever coast", () => {
    // FIRE number = 100000 / 0.04 = 2,500,000
    // At age 60, only 5 years, even with $500/mo contributions can't reach 2.5M
    expect(computeCoastFireAge(60, 1000, 100000, 65, 0.05, 500)).toBeNull();
  });

  it("uses custom targetAge", () => {
    // FIRE number = 40000 / 0.04 = 1,000,000
    // With $2000/mo savings, compare target 65 vs 60
    const coastAge65 = computeCoastFireAge(30, 100000, 40000, 65, 0.05, 2000);
    const coastAge60 = computeCoastFireAge(30, 100000, 40000, 60, 0.05, 2000);
    // Shorter target = later coast age (harder) or null
    expect(coastAge65).not.toBeNull();
    if (coastAge60 !== null) {
      expect(coastAge60).toBeGreaterThanOrEqual(coastAge65!);
    }
  });

  it("uses custom realReturn rate", () => {
    // Higher return = easier to coast (earlier coast age)
    // With 200k invested, 40k expenses, FIRE number = 1M
    const coastHigh = computeCoastFireAge(30, 200000, 40000, 65, 0.07);
    const coastLow = computeCoastFireAge(30, 200000, 40000, 65, 0.03);
    expect(coastHigh).not.toBeNull();
    // At 7% return, 200k is already coasting at age 30 (200k × 1.07^35 ≈ 2.1M > 1M)
    expect(coastHigh).toBe(30);
    // At 3% return, need more time
    if (coastLow !== null) {
      expect(coastLow).toBeGreaterThan(30);
    }
  });

  it("handles edge case: age just under target", () => {
    // Age 64, target 65 — only 1 year of growth
    // FIRE number = 30000 / 0.04 = 750,000
    // Need 750000 / 1.05 ≈ 714,286 at age 64
    expect(computeCoastFireAge(64, 720000, 30000)).toBe(64);
    expect(computeCoastFireAge(64, 500000, 30000)).toBeNull();
  });
});

describe("coast-fire insight generation", () => {
  const baseData: FinancialData = {
    totalAssets: 300000,
    totalDebts: 50000,
    monthlyIncome: 6000,
    monthlyExpenses: 3000,
    liquidAssets: 250000,
    rawMonthlyExpenses: 3000,
  };

  it("does not generate coast-fire insight without currentAge", () => {
    const insights = generateInsights({ ...baseData, currentAge: undefined });
    expect(insights.find((i) => i.type === "coast-fire")).toBeUndefined();
  });

  it("does not generate coast-fire insight without liquidAssets", () => {
    const insights = generateInsights({ ...baseData, currentAge: 30, liquidAssets: undefined });
    expect(insights.find((i) => i.type === "coast-fire")).toBeUndefined();
  });

  it("does not generate coast-fire insight without rawMonthlyExpenses", () => {
    const insights = generateInsights({ ...baseData, currentAge: 30, rawMonthlyExpenses: undefined });
    expect(insights.find((i) => i.type === "coast-fire")).toBeUndefined();
  });

  it("generates achieved insight when already coasting", () => {
    // 250000 invested, 3000/mo expenses = 36000/yr, FIRE number = 900000
    // At age 30, 35 years: 250000 × 1.05^35 ≈ 1,379,412 > 900,000
    const data: FinancialData = { ...baseData, currentAge: 30 };
    const insights = generateInsights(data);
    const insight = insights.find((i) => i.type === "coast-fire");
    expect(insight).toBeDefined();
    expect(insight!.id).toBe("coast-fire-achieved");
    expect(insight!.message).toContain("hit Coast FIRE");
    expect(insight!.message).toContain("stopped saving today");
    expect(insight!.icon).toBe("🏖️");
  });

  it("generates progress insight when coast age is in the future", () => {
    // 30000 invested, 4000/mo expenses = 48000/yr, FIRE number = 1,200,000
    // 30000 × 1.05^40 = ~211k < 1.2M, so not coasting at 25
    // But with $2000/mo savings, will reach coast FIRE at some future age
    const data: FinancialData = {
      ...baseData,
      liquidAssets: 30000,
      rawMonthlyExpenses: 4000,
      monthlySavings: 2000,
      currentAge: 25,
    };
    const insights = generateInsights(data);
    const insight = insights.find((i) => i.type === "coast-fire");
    expect(insight).toBeDefined();
    expect(insight!.id).toBe("coast-fire-progress");
    expect(insight!.message).toContain("keep saving until age");
    expect(insight!.message).toContain("year");
    expect(insight!.message).toContain("Coast FIRE");
    expect(insight!.icon).toBe("🏖️");
  });

  it("does not generate insight when coast fire is unreachable", () => {
    // Very little invested, high expenses, old age
    const data: FinancialData = {
      ...baseData,
      liquidAssets: 1000,
      rawMonthlyExpenses: 10000,
      currentAge: 60,
    };
    const insights = generateInsights(data);
    expect(insights.find((i) => i.type === "coast-fire")).toBeUndefined();
  });
});
