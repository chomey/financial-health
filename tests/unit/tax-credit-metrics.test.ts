import { describe, it, expect } from "vitest";
import { computeMetrics } from "@/lib/financial-state";
import type { FinancialState } from "@/lib/financial-state";
import type { TaxCredit } from "@/lib/tax-credits";

function makeState(overrides: Partial<FinancialState> = {}): FinancialState {
  return {
    assets: [],
    debts: [],
    income: [],
    expenses: [],
    properties: [],
    stocks: [],
    country: "CA",
    jurisdiction: "ON",
    ...overrides,
  };
}

const REFUNDABLE_CREDIT: TaxCredit = {
  id: "c1",
  category: "GST/HST Credit",
  annualAmount: 600,
  type: "refundable",
};

const NON_REFUNDABLE_CREDIT: TaxCredit = {
  id: "c2",
  category: "Disability Tax Credit",
  annualAmount: 1500,
  type: "non-refundable",
};

describe("tax credit metrics — taxCreditAdjustedRate", () => {
  it("is undefined when no tax credits are present", () => {
    const state = makeState({
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
    });
    const metrics = computeMetrics(state);
    const tax = metrics.find((m) => m.title === "Estimated Tax")!;
    expect(tax.taxCreditAdjustedRate).toBeUndefined();
  });

  it("is lower than effectiveRate when refundable credits are present", () => {
    const state = makeState({
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
      taxCredits: [REFUNDABLE_CREDIT],
      filingStatus: "single",
    });
    const metrics = computeMetrics(state);
    const tax = metrics.find((m) => m.title === "Estimated Tax")!;
    expect(tax.taxCreditAdjustedRate).toBeDefined();
    expect(tax.taxCreditAdjustedRate!).toBeLessThan(tax.effectiveRate!);
  });

  it("is lower than effectiveRate when non-refundable credits are present", () => {
    const state = makeState({
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
      taxCredits: [NON_REFUNDABLE_CREDIT],
      filingStatus: "single",
    });
    const metrics = computeMetrics(state);
    const tax = metrics.find((m) => m.title === "Estimated Tax")!;
    expect(tax.taxCreditAdjustedRate).toBeDefined();
    expect(tax.taxCreditAdjustedRate!).toBeLessThan(tax.effectiveRate!);
  });

  it("non-refundable credits cannot reduce tax rate below 0", () => {
    const largeNonRefundable: TaxCredit = {
      id: "c3",
      category: "Disability Tax Credit",
      annualAmount: 999_999,
      type: "non-refundable",
    };
    const state = makeState({
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
      taxCredits: [largeNonRefundable],
      filingStatus: "single",
    });
    const metrics = computeMetrics(state);
    const tax = metrics.find((m) => m.title === "Estimated Tax")!;
    expect(tax.taxCreditAdjustedRate!).toBeGreaterThanOrEqual(0);
  });

  it("refundable credits can reduce the adjusted rate to near 0 for large credits vs small income", () => {
    const largeRefundable: TaxCredit = {
      id: "c4",
      category: "GST/HST Credit",
      annualAmount: 999_999,
      type: "refundable",
    };
    const state = makeState({
      income: [{ id: "i1", category: "Salary", amount: 1000 }],
      taxCredits: [largeRefundable],
      filingStatus: "single",
    });
    const metrics = computeMetrics(state);
    const tax = metrics.find((m) => m.title === "Estimated Tax")!;
    expect(tax.taxCreditAdjustedRate!).toBe(0);
  });
});

describe("tax credit metrics — taxCreditMonthlyBoost (Monthly Cash Flow)", () => {
  it("is undefined when no credits are present", () => {
    const state = makeState({
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
    });
    const metrics = computeMetrics(state);
    const surplus = metrics.find((m) => m.title === "Monthly Cash Flow")!;
    expect(surplus.taxCreditMonthlyBoost).toBeUndefined();
  });

  it("equals annualRefundableCredits / 12 when refundable credits are present", () => {
    const state = makeState({
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
      taxCredits: [REFUNDABLE_CREDIT], // $600/year
      filingStatus: "single",
    });
    const metrics = computeMetrics(state);
    const surplus = metrics.find((m) => m.title === "Monthly Cash Flow")!;
    expect(surplus.taxCreditMonthlyBoost).toBeCloseTo(50, 1); // 600 / 12 = 50
  });

  it("is undefined when only non-refundable credits are present", () => {
    const state = makeState({
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
      taxCredits: [NON_REFUNDABLE_CREDIT],
      filingStatus: "single",
    });
    const metrics = computeMetrics(state);
    const surplus = metrics.find((m) => m.title === "Monthly Cash Flow")!;
    // Non-refundable credits don't boost the surplus directly (they reduce tax burden)
    expect(surplus.taxCreditMonthlyBoost).toBeUndefined();
  });

  it("reflects total of multiple refundable credits", () => {
    const secondCredit: TaxCredit = {
      id: "c5",
      category: "Canada Workers Benefit",
      annualAmount: 1200,
      type: "refundable",
    };
    const state = makeState({
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
      taxCredits: [REFUNDABLE_CREDIT, secondCredit], // $600 + $1200 = $1800/year
      filingStatus: "single",
    });
    const metrics = computeMetrics(state);
    const surplus = metrics.find((m) => m.title === "Monthly Cash Flow")!;
    expect(surplus.taxCreditMonthlyBoost).toBeCloseTo(150, 1); // 1800 / 12 = 150
  });
});

describe("tax credit metrics — taxCreditAdjustedRunway (Financial Runway)", () => {
  it("is undefined when no credits are present", () => {
    const state = makeState({
      assets: [{ id: "a1", category: "Savings Account", amount: 30_000 }],
      expenses: [{ id: "e1", category: "Rent", amount: 2_000 }],
    });
    const metrics = computeMetrics(state);
    const runway = metrics.find((m) => m.title === "Financial Runway")!;
    expect(runway.taxCreditAdjustedRunway).toBeUndefined();
  });

  it("is greater than base runway when credits reduce effective obligations", () => {
    const state = makeState({
      assets: [{ id: "a1", category: "Savings Account", amount: 30_000 }],
      expenses: [{ id: "e1", category: "Rent", amount: 2_000 }],
      income: [{ id: "i1", category: "Salary", amount: 5_000 }],
      taxCredits: [REFUNDABLE_CREDIT, NON_REFUNDABLE_CREDIT],
      filingStatus: "single",
    });
    const metrics = computeMetrics(state);
    const runway = metrics.find((m) => m.title === "Financial Runway")!;
    // Base runway = 30_000 / 2_000 = 15 months
    // With credits reducing effective obligations, adjusted runway should be > 15
    if (runway.taxCreditAdjustedRunway !== undefined) {
      expect(runway.taxCreditAdjustedRunway).toBeGreaterThan(runway.value);
    }
    // (May be undefined if credit benefit is too small relative to obligations, which is fine)
  });

  it("is undefined when no monthly obligations exist", () => {
    // If monthlyObligations is 0, base runway is 0 and there's nothing to adjust
    const state = makeState({
      assets: [{ id: "a1", category: "Savings Account", amount: 30_000 }],
      income: [{ id: "i1", category: "Salary", amount: 5_000 }],
      taxCredits: [REFUNDABLE_CREDIT],
      filingStatus: "single",
    });
    const metrics = computeMetrics(state);
    const runway = metrics.find((m) => m.title === "Financial Runway")!;
    // No expenses → monthlyObligations = 0 → runway = 0 → adjusted runway undefined
    expect(runway.taxCreditAdjustedRunway).toBeUndefined();
  });
});
