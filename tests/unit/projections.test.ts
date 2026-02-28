import { describe, it, expect } from "vitest";
import { projectFinances, projectAssets, downsamplePoints } from "@/lib/projections";
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
      assets: [{ id: "a1", category: "Savings", amount: 50000, roi: 0 }],
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
      assets: [{ id: "a1", category: "Savings", amount: 0, roi: 0, monthlyContribution: 1000 }],
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

describe("surplus target affects projections", () => {
  // Two accounts: TFSA (5% default ROI) and Brokerage (7% default ROI)
  // Income $5000, Expenses $2000 → Surplus = $3000/mo
  // Switching surplus target between accounts should change net worth projections
  // because surplus compounds at different rates.
  const baseAssets = [
    { id: "a1", category: "TFSA", amount: 10000 },      // 5% default ROI
    { id: "a2", category: "Brokerage", amount: 10000 },  // 7% default ROI
  ];
  const income = [{ id: "i1", category: "Salary", amount: 5000 }];
  const expenses = [{ id: "e1", category: "Rent", amount: 2000 }];

  it("projectFinances: surplus to higher-ROI account yields higher net worth", () => {
    const stateToTFSA = makeState({
      assets: [
        { ...baseAssets[0], surplusTarget: true },
        { ...baseAssets[1] },
      ],
      income,
      expenses,
    });
    const stateToBrokerage = makeState({
      assets: [
        { ...baseAssets[0] },
        { ...baseAssets[1], surplusTarget: true },
      ],
      income,
      expenses,
    });

    const resultTFSA = projectFinances(stateToTFSA, 10);
    const resultBrokerage = projectFinances(stateToBrokerage, 10);

    // After 10 years, surplus compounding at 7% (Brokerage) should beat 5% (TFSA)
    const nwTFSA = resultTFSA.points[120].netWorth;
    const nwBrokerage = resultBrokerage.points[120].netWorth;

    // Math: $3000/mo for 120 months at different rates creates meaningful difference
    // TFSA (5%): monthly rate = 0.4167%. Brokerage (7%): monthly rate = 0.5833%.
    // The difference should be thousands of dollars over 10 years.
    expect(nwBrokerage).toBeGreaterThan(nwTFSA);
    expect(nwBrokerage - nwTFSA).toBeGreaterThan(5000); // meaningful difference
  });

  it("projectAssets: surplus target changes per-asset milestone values", () => {
    const surplusToA = projectAssets(
      [
        { ...baseAssets[0], surplusTarget: true },
        { ...baseAssets[1] },
      ],
      "moderate",
      [10],
      3000 // $3000/mo surplus
    );
    const surplusToB = projectAssets(
      [
        { ...baseAssets[0] },
        { ...baseAssets[1], surplusTarget: true },
      ],
      "moderate",
      [10],
      3000
    );

    // When surplus goes to A, A's 10yr value should be much higher than when it doesn't
    const aWithSurplus = surplusToA[0].milestoneValues[0];
    const aWithoutSurplus = surplusToB[0].milestoneValues[0];
    expect(aWithSurplus).toBeGreaterThan(aWithoutSurplus);
    expect(aWithSurplus - aWithoutSurplus).toBeGreaterThan(300000); // ~$3k/mo * 120mo

    // And vice versa for B
    const bWithSurplus = surplusToB[1].milestoneValues[0];
    const bWithoutSurplus = surplusToA[1].milestoneValues[0];
    expect(bWithSurplus).toBeGreaterThan(bWithoutSurplus);
  });

  it("uses default ROI when roi is undefined", () => {
    // TFSA has default ROI of 5%. With no explicit roi, projections should use 5%.
    const state = makeState({
      assets: [{ id: "a1", category: "TFSA", amount: 10000 }], // no roi set
      income: [{ id: "i1", category: "Salary", amount: 1000 }],
      expenses: [{ id: "e1", category: "Rent", amount: 1000 }],
    });
    const result = projectFinances(state, 1);
    // 5% annual = ~0.4167%/mo. After 12 months: 10000 * (1.004167)^12 ≈ 10,512
    const finalAssets = result.points[12].totalAssets;
    expect(finalAssets).toBeGreaterThan(10400);
    expect(finalAssets).toBeLessThan(10600);
  });

  it("explicit roi: 0 overrides default ROI", () => {
    const state = makeState({
      assets: [{ id: "a1", category: "TFSA", amount: 10000, roi: 0 }],
      income: [{ id: "i1", category: "Salary", amount: 1000 }],
      expenses: [{ id: "e1", category: "Rent", amount: 1000 }],
    });
    const result = projectFinances(state, 1);
    // roi explicitly 0 → no growth
    expect(result.points[12].totalAssets).toBe(10000);
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
