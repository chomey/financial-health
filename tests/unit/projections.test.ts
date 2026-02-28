import { describe, it, expect } from "vitest";
import { projectFinances, downsamplePoints } from "@/lib/projections";
import type { FinancialState } from "@/lib/financial-state";

function makeState(overrides: Partial<FinancialState> = {}): FinancialState {
  return {
    assets: [],
    debts: [],
    income: [],
    expenses: [],
    properties: [],
    ...overrides,
  };
}

describe("projectFinances", () => {
  it("returns correct number of monthly points", () => {
    const result = projectFinances(makeState(), 5);
    // 5 years = 60 months + month 0 = 61 points
    expect(result.points).toHaveLength(61);
    expect(result.points[0].month).toBe(0);
    expect(result.points[60].month).toBe(60);
  });

  it("projects static net worth when no growth/payments", () => {
    const state = makeState({
      assets: [{ id: "a1", category: "Savings", amount: 50000 }],
      debts: [],
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
      expenses: [{ id: "e1", category: "Rent", amount: 5000 }],
    });
    const result = projectFinances(state, 1);
    // With zero surplus, no ROI, net worth stays at 50000
    expect(result.points[0].netWorth).toBe(50000);
    expect(result.points[12].netWorth).toBe(50000);
  });

  it("grows assets with ROI", () => {
    const state = makeState({
      assets: [{ id: "a1", category: "Savings", amount: 10000, roi: 12 }],
      income: [{ id: "i1", category: "Salary", amount: 1000 }],
      expenses: [{ id: "e1", category: "Rent", amount: 1000 }],
    });
    const result = projectFinances(state, 1);
    // 12% annual = 1% monthly. After 12 months compounding: 10000 * (1.01)^12 ≈ 11268
    const finalAssets = result.points[12].totalAssets;
    expect(finalAssets).toBeGreaterThan(11200);
    expect(finalAssets).toBeLessThan(11300);
  });

  it("grows assets with monthly contributions", () => {
    const state = makeState({
      assets: [{ id: "a1", category: "Savings", amount: 0, monthlyContribution: 1000 }],
      income: [{ id: "i1", category: "Salary", amount: 1000 }],
      expenses: [{ id: "e1", category: "Rent", amount: 1000 }],
    });
    const result = projectFinances(state, 1);
    // 12 months of $1000 contributions = $12000
    expect(result.points[12].totalAssets).toBe(12000);
  });

  it("reduces debts with payments", () => {
    const state = makeState({
      debts: [{ id: "d1", category: "Car Loan", amount: 12000, monthlyPayment: 1000, interestRate: 0 }],
      income: [{ id: "i1", category: "Salary", amount: 1000 }],
      expenses: [{ id: "e1", category: "Rent", amount: 1000 }],
    });
    const result = projectFinances(state, 1);
    // After 12 months of $1000 payments on $12000: should be $0
    expect(result.points[12].totalDebts).toBe(0);
  });

  it("detects debt-free month", () => {
    const state = makeState({
      debts: [{ id: "d1", category: "Loan", amount: 6000, monthlyPayment: 1000, interestRate: 0 }],
      income: [{ id: "i1", category: "Salary", amount: 1000 }],
      expenses: [{ id: "e1", category: "Rent", amount: 1000 }],
    });
    const result = projectFinances(state, 1);
    expect(result.debtFreeMonth).toBe(6);
  });

  it("detects net worth milestones", () => {
    const state = makeState({
      assets: [{ id: "a1", category: "Savings", amount: 90000 }],
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
      expenses: [{ id: "e1", category: "Rent", amount: 3000 }],
    });
    const result = projectFinances(state, 5);
    const milestone100k = result.milestones.find((m) => m.label === "$100k");
    expect(milestone100k).toBeDefined();
    expect(milestone100k!.month).toBeGreaterThan(0);
    expect(milestone100k!.month).toBeLessThan(10); // $2k surplus/month → ~5 months
  });

  it("applies scenario multiplier to conservative", () => {
    const state = makeState({
      assets: [{ id: "a1", category: "Savings", amount: 10000, roi: 10 }],
      income: [{ id: "i1", category: "Salary", amount: 1000 }],
      expenses: [{ id: "e1", category: "Rent", amount: 1000 }],
    });
    const moderate = projectFinances(state, 5, "moderate");
    const conservative = projectFinances(state, 5, "conservative");
    // Conservative should grow less
    const moderateEnd = moderate.points[60].netWorth;
    const conservativeEnd = conservative.points[60].netWorth;
    expect(conservativeEnd).toBeLessThan(moderateEnd);
  });

  it("applies scenario multiplier to optimistic", () => {
    const state = makeState({
      assets: [{ id: "a1", category: "Savings", amount: 10000, roi: 10 }],
      income: [{ id: "i1", category: "Salary", amount: 1000 }],
      expenses: [{ id: "e1", category: "Rent", amount: 1000 }],
    });
    const moderate = projectFinances(state, 5, "moderate");
    const optimistic = projectFinances(state, 5, "optimistic");
    const moderateEnd = moderate.points[60].netWorth;
    const optimisticEnd = optimistic.points[60].netWorth;
    expect(optimisticEnd).toBeGreaterThan(moderateEnd);
  });

  it("handles property mortgage payments", () => {
    const state = makeState({
      properties: [{ id: "p1", name: "Home", value: 300000, mortgage: 200000, monthlyPayment: 2000, interestRate: 0 }],
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
      expenses: [{ id: "e1", category: "Rent", amount: 5000 }],
    });
    const result = projectFinances(state, 10);
    // After 120 months of $2000 payments on $200k: 200000 - (2000*120) = -40000 → capped at 0
    const finalMortgage = result.points[120].totalDebts;
    expect(finalMortgage).toBe(0);
  });

  it("returns null for debt-free when debts persist", () => {
    const state = makeState({
      debts: [{ id: "d1", category: "Loan", amount: 100000, monthlyPayment: 100, interestRate: 12 }],
    });
    const result = projectFinances(state, 5);
    // Interest >> payment, debt grows
    expect(result.debtFreeMonth).toBeNull();
  });

  it("handles empty state gracefully", () => {
    const result = projectFinances(makeState(), 1);
    expect(result.points).toHaveLength(13);
    expect(result.points[0].netWorth).toBe(0);
    expect(result.debtFreeMonth).toBe(0); // no debts = debt free from start
    expect(result.milestones).toHaveLength(0);
  });
});

describe("downsamplePoints", () => {
  it("returns original array if under maxPoints", () => {
    const points = Array.from({ length: 50 }, (_, i) => ({
      month: i,
      year: i / 12,
      netWorth: i * 100,
      totalAssets: i * 100,
      totalDebts: 0,
      totalPropertyEquity: 0,
    }));
    const result = downsamplePoints(points, 120);
    expect(result).toEqual(points);
  });

  it("downsamples to maxPoints", () => {
    const points = Array.from({ length: 361 }, (_, i) => ({
      month: i,
      year: i / 12,
      netWorth: i * 100,
      totalAssets: i * 100,
      totalDebts: 0,
      totalPropertyEquity: 0,
    }));
    const result = downsamplePoints(points, 120);
    expect(result).toHaveLength(120);
    expect(result[0].month).toBe(0);
    expect(result[119].month).toBe(360);
  });
});
