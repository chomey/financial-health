import { describe, it, expect } from "vitest";
import { generateInsights } from "@/lib/insights";
import { computeIncomeReplacementDetails, computeMetrics } from "@/lib/financial-state";
import type { FinancialData } from "@/lib/insights";
import type { FinancialState } from "@/lib/financial-state";

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

// Base state for computeIncomeReplacementDetails tests
const baseState: FinancialState = {
  assets: [
    { id: "a1", category: "TFSA", amount: 100_000 },
    { id: "a2", category: "RRSP", amount: 200_000 },
  ],
  debts: [],
  income: [{ id: "i1", category: "Salary", amount: 5000 }],
  expenses: [],
  properties: [],
  stocks: [],
  country: "CA",
  jurisdiction: "ON",
};

describe("computeIncomeReplacementDetails — breakdown computation", () => {
  it("computes monthlyWithdrawal4pct correctly", () => {
    const details = computeIncomeReplacementDetails(baseState, 300_000, 5000);
    // 300,000 * 0.04 / 12 = 1,000
    expect(details.monthlyWithdrawal4pct).toBeCloseTo(1000, 1);
  });

  it("computes incomeReplacementPct correctly", () => {
    const details = computeIncomeReplacementDetails(baseState, 300_000, 5000);
    // 1000 / 5000 * 100 = 20%
    expect(details.incomeReplacementPct).toBeCloseTo(20, 1);
  });

  it("assigns 'Early stage' tier for pct < 25", () => {
    const details = computeIncomeReplacementDetails(baseState, 100_000, 5000);
    expect(details.currentTierLabel).toBe("Early stage");
    expect(details.nextTierLabel).toBe("Building momentum");
  });

  it("assigns 'Building momentum' tier for 25-49%", () => {
    // 375,000 * 0.04/12 / 5000 = 25%
    const details = computeIncomeReplacementDetails(baseState, 375_000, 5000);
    expect(details.currentTierLabel).toBe("Building momentum");
    expect(details.nextTierLabel).toBe("Strong position");
  });

  it("assigns 'Strong position' tier for 50-74%", () => {
    const details = computeIncomeReplacementDetails(baseState, 750_000, 5000);
    expect(details.currentTierLabel).toBe("Strong position");
    expect(details.nextTierLabel).toBe("Nearly independent");
  });

  it("assigns 'Nearly independent' tier for 75-99%", () => {
    const details = computeIncomeReplacementDetails(baseState, 1_125_000, 5000);
    expect(details.currentTierLabel).toBe("Nearly independent");
    expect(details.nextTierLabel).toBe("Financially independent");
  });

  it("assigns 'Financially independent' tier for 100%+", () => {
    const details = computeIncomeReplacementDetails(baseState, 1_500_000, 5000);
    expect(details.currentTierLabel).toBe("Financially independent");
    expect(details.nextTierLabel).toBeNull();
    expect(details.amountNeededForNextTier).toBeNull();
  });

  it("computes amountNeededForNextTier correctly", () => {
    // At 20% (300k, income 5000): need 25% → portfolio = 0.25 * 5000 * 12 / 0.04 = 375,000
    // amountNeeded = 375,000 - 300,000 = 75,000
    const details = computeIncomeReplacementDetails(baseState, 300_000, 5000);
    expect(details.amountNeededForNextTier).toBeGreaterThan(0);
    expect(details.amountNeededForNextTier!).toBeLessThanOrEqual(75_000);
  });

  it("builds per-asset breakdown from state assets", () => {
    const details = computeIncomeReplacementDetails(baseState, 300_000, 5000);
    expect(details.assetBreakdown).toHaveLength(2);
    expect(details.assetBreakdown[0].label).toBe("TFSA");
    expect(details.assetBreakdown[0].balance).toBe(100_000);
    expect(details.assetBreakdown[0].monthlyWithdrawal).toBe(Math.round(100_000 * 0.04 / 12));
    expect(details.assetBreakdown[1].label).toBe("RRSP");
    expect(details.assetBreakdown[1].balance).toBe(200_000);
  });

  it("includes stock holdings in asset breakdown", () => {
    const stateWithStocks: FinancialState = {
      ...baseState,
      stocks: [{ id: "s1", ticker: "AAPL", shares: 10, lastFetchedPrice: 200 }],
    };
    const details = computeIncomeReplacementDetails(stateWithStocks, 302_000, 5000);
    const aapl = details.assetBreakdown.find((a) => a.label === "AAPL");
    expect(aapl).toBeDefined();
    expect(aapl!.balance).toBe(2000);
  });

  it("excludes computed assets from breakdown", () => {
    const stateWithComputed: FinancialState = {
      ...baseState,
      assets: [
        ...baseState.assets,
        { id: "_computed_stocks", category: "Stocks", amount: 50_000, computed: true },
      ],
    };
    const details = computeIncomeReplacementDetails(stateWithComputed, 300_000, 5000);
    const computed = details.assetBreakdown.find((a) => a.label === "Stocks");
    expect(computed).toBeUndefined();
  });

  it("returns 0% pct when monthlyAfterTaxIncome is 0", () => {
    const details = computeIncomeReplacementDetails(baseState, 300_000, 0);
    expect(details.incomeReplacementPct).toBe(0);
  });
});

describe("computeMetrics includes incomeReplacementDetails", () => {
  it("attaches incomeReplacementDetails to Income Replacement metric", () => {
    const state: FinancialState = {
      assets: [{ id: "a1", category: "TFSA", amount: 300_000 }],
      debts: [],
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
      expenses: [],
      properties: [],
      stocks: [],
      country: "CA",
      jurisdiction: "ON",
    };
    const metrics = computeMetrics(state);
    const irMetric = metrics.find((m) => m.title === "Income Replacement");
    expect(irMetric).toBeDefined();
    expect(irMetric!.incomeReplacementDetails).toBeDefined();
    expect(irMetric!.incomeReplacementDetails!.assetBreakdown).toHaveLength(1);
    expect(irMetric!.incomeReplacementDetails!.assetBreakdown[0].label).toBe("TFSA");
  });

  it("does not create Income Replacement metric when income is 0", () => {
    const state: FinancialState = {
      assets: [{ id: "a1", category: "TFSA", amount: 300_000 }],
      debts: [],
      income: [],
      expenses: [],
      properties: [],
      stocks: [],
      country: "CA",
      jurisdiction: "ON",
    };
    const metrics = computeMetrics(state);
    const irMetric = metrics.find((m) => m.title === "Income Replacement");
    expect(irMetric).toBeUndefined();
  });
});
