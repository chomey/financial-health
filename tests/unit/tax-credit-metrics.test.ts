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

describe("tax credits reduce displayed tax", () => {
  it("no credits: taxCreditsApplied is falsy", () => {
    const state = makeState({
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
    });
    const metrics = computeMetrics(state);
    const tax = metrics.find((m) => m.title === "Estimated Tax")!;
    expect(tax.taxCreditsApplied).toBeFalsy();
  });

  it("refundable credits reduce displayed tax value", () => {
    const stateNoCredits = makeState({
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
    });
    const stateWithCredits = makeState({
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
      taxCredits: [REFUNDABLE_CREDIT],
      filingStatus: "single",
    });
    const taxWithout = computeMetrics(stateNoCredits).find((m) => m.title === "Estimated Tax")!;
    const taxWith = computeMetrics(stateWithCredits).find((m) => m.title === "Estimated Tax")!;
    expect(taxWith.value).toBeLessThan(taxWithout.value);
    expect(taxWith.taxCreditsApplied).toBe(true);
  });

  it("non-refundable credits reduce displayed tax value", () => {
    const stateNoCredits = makeState({
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
    });
    const stateWithCredits = makeState({
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
      taxCredits: [NON_REFUNDABLE_CREDIT],
      filingStatus: "single",
    });
    const taxWithout = computeMetrics(stateNoCredits).find((m) => m.title === "Estimated Tax")!;
    const taxWith = computeMetrics(stateWithCredits).find((m) => m.title === "Estimated Tax")!;
    expect(taxWith.value).toBeLessThan(taxWithout.value);
    expect(taxWith.taxCreditsApplied).toBe(true);
  });

  it("non-refundable credits cannot reduce tax below 0", () => {
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
    expect(tax.value).toBe(0);
  });

  it("refundable credits can reduce tax to 0", () => {
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
    expect(tax.value).toBe(0);
  });
});

describe("tax credits improve surplus (Monthly Cash Flow)", () => {
  it("refundable credits increase surplus", () => {
    const stateNoCredits = makeState({
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
      expenses: [{ id: "e1", category: "Rent", amount: 2000 }],
    });
    const stateWithCredits = makeState({
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
      expenses: [{ id: "e1", category: "Rent", amount: 2000 }],
      taxCredits: [REFUNDABLE_CREDIT],
      filingStatus: "single",
    });
    const surplusWithout = computeMetrics(stateNoCredits).find((m) => m.title === "Monthly Cash Flow")!;
    const surplusWith = computeMetrics(stateWithCredits).find((m) => m.title === "Monthly Cash Flow")!;
    expect(surplusWith.value).toBeGreaterThan(surplusWithout.value);
  });

  it("non-refundable credits increase surplus by reducing tax", () => {
    const stateNoCredits = makeState({
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
      expenses: [{ id: "e1", category: "Rent", amount: 2000 }],
    });
    const stateWithCredits = makeState({
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
      expenses: [{ id: "e1", category: "Rent", amount: 2000 }],
      taxCredits: [NON_REFUNDABLE_CREDIT],
      filingStatus: "single",
    });
    const surplusWithout = computeMetrics(stateNoCredits).find((m) => m.title === "Monthly Cash Flow")!;
    const surplusWith = computeMetrics(stateWithCredits).find((m) => m.title === "Monthly Cash Flow")!;
    expect(surplusWith.value).toBeGreaterThan(surplusWithout.value);
  });
});

describe("deductions reduce taxable income", () => {
  it("deduction reduces tax by lowering taxable income before brackets", () => {
    const stateNoDeduction = makeState({
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
    });
    const stateWithDeduction = makeState({
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
      taxCredits: [{ id: "d1", category: "Moving Expenses", annualAmount: 5000, type: "deduction" }],
    });
    const taxWithout = computeMetrics(stateNoDeduction).find((m) => m.title === "Estimated Tax")!;
    const taxWith = computeMetrics(stateWithDeduction).find((m) => m.title === "Estimated Tax")!;
    expect(taxWith.value).toBeLessThan(taxWithout.value);
  });

  it("deduction + non-refundable credit both reduce tax", () => {
    const stateBase = makeState({
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
    });
    const stateWithBoth = makeState({
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
      taxCredits: [
        { id: "d1", category: "Moving Expenses", annualAmount: 3000, type: "deduction" },
        NON_REFUNDABLE_CREDIT,
      ],
    });
    const taxBase = computeMetrics(stateBase).find((m) => m.title === "Estimated Tax")!;
    const taxBoth = computeMetrics(stateWithBoth).find((m) => m.title === "Estimated Tax")!;
    expect(taxBoth.value).toBeLessThan(taxBase.value);
  });
});
