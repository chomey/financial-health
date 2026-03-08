import { describe, it, expect } from "vitest";
import {
  getFlowchartSteps,
  detectRetirementHeuristic,
} from "@/lib/flowchart-steps";
import type { FinancialState } from "@/lib/financial-types";

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

// ── detectRetirementHeuristic ─────────────────────────────────────────────────

describe("detectRetirementHeuristic", () => {
  it("returns false when no income entered", () => {
    const state = makeState({
      expenses: [{ id: "e1", category: "Rent", amount: 2000 }],
    });
    expect(detectRetirementHeuristic(state)).toBe(false);
  });

  it("returns false when employment income present", () => {
    const state = makeState({
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
      expenses: [{ id: "e1", category: "Rent", amount: 2000 }],
      assets: [{ id: "a1", category: "Savings", amount: 1_000_000 }],
    });
    expect(detectRetirementHeuristic(state)).toBe(false);
  });

  it("returns false for non-employment income with no runway/returns", () => {
    const state = makeState({
      income: [{ id: "i1", category: "Pension", amount: 1000, incomeType: "other" }],
      expenses: [{ id: "e1", category: "Rent", amount: 2000 }],
      assets: [{ id: "a1", category: "Savings", amount: 5000 }],
    });
    expect(detectRetirementHeuristic(state)).toBe(false);
  });

  it("returns true for non-employment income + 20+ year runway", () => {
    const state = makeState({
      income: [{ id: "i1", category: "Pension", amount: 1000, incomeType: "other" }],
      expenses: [{ id: "e1", category: "Rent", amount: 2000 }],
      // $600k / $2000/mo = 300 months = 25 years
      assets: [{ id: "a1", category: "Savings", amount: 600_000 }],
    });
    expect(detectRetirementHeuristic(state)).toBe(true);
  });

  it("returns true for non-employment income + investment returns > expenses", () => {
    const state = makeState({
      income: [{ id: "i1", category: "Dividends", amount: 500, incomeType: "capital-gains" }],
      expenses: [{ id: "e1", category: "Rent", amount: 1000 }],
      // $200k at 8% = $16k/year = $1,333/mo > $1,000/mo
      assets: [{ id: "a1", category: "Brokerage", amount: 200_000, roi: 8 }],
    });
    expect(detectRetirementHeuristic(state)).toBe(true);
  });

  it("returns false when expenses are zero (ambiguous)", () => {
    const state = makeState({
      income: [{ id: "i1", category: "Pension", amount: 1000, incomeType: "other" }],
      assets: [{ id: "a1", category: "Savings", amount: 600_000 }],
    });
    expect(detectRetirementHeuristic(state)).toBe(false);
  });
});

// ── CA steps: retirement mode ─────────────────────────────────────────────────

describe("CA steps: retirement mode", () => {
  const expensesOnly = makeState({
    country: "CA",
    income: [],
    expenses: [{ id: "e1", category: "Rent", amount: 2000 }],
  });

  it("budget step is complete when retired + expenses, no income required", () => {
    const steps = getFlowchartSteps(expensesOnly, true);
    const budget = steps.find((s) => s.id === "ca-budget")!;
    expect(budget.status).toBe("complete");
    expect(budget.progress).toBe(100);
  });

  it("budget step completionHint says 'living on savings/investments' when retired + no income", () => {
    const steps = getFlowchartSteps(expensesOnly, true);
    const budget = steps.find((s) => s.id === "ca-budget")!;
    expect(budget.completionHint).toContain("savings/investments");
  });

  it("budget step is NOT complete without retirement mode when only expenses entered", () => {
    const steps = getFlowchartSteps(expensesOnly, false);
    const budget = steps.find((s) => s.id === "ca-budget")!;
    expect(budget.status).not.toBe("complete");
  });

  it("employer match step auto-completes when retired", () => {
    const steps = getFlowchartSteps(expensesOnly, true);
    const match = steps.find((s) => s.id === "ca-employer-match")!;
    expect(match.status).toBe("complete");
    expect(match.completionHint).toContain("Retired");
  });

  it("employer match step is not auto-complete without retirement mode", () => {
    const state = makeState({
      country: "CA",
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
      expenses: [{ id: "e1", category: "Rent", amount: 2000 }],
    });
    const steps = getFlowchartSteps(state, false);
    const match = steps.find((s) => s.id === "ca-employer-match")!;
    expect(match.status).not.toBe("complete");
    expect(match.userAcknowledgeable).toBe(true);
    expect(match.skippable).toBe(true);
  });

  it("employer match step has no user controls when retired", () => {
    const steps = getFlowchartSteps(expensesOnly, true);
    const match = steps.find((s) => s.id === "ca-employer-match")!;
    expect(match.userAcknowledgeable).toBeFalsy();
    expect(match.skippable).toBeFalsy();
  });

  it("TFSA step becomes skippable when retired", () => {
    const steps = getFlowchartSteps(expensesOnly, true);
    const tfsa = steps.find((s) => s.id === "ca-tfsa")!;
    expect(tfsa.skippable).toBe(true);
    expect(tfsa.skipLabel).toContain("Retired");
  });

  it("TFSA step not skippable without retirement mode", () => {
    const state = makeState({ country: "CA" });
    const steps = getFlowchartSteps(state, false);
    const tfsa = steps.find((s) => s.id === "ca-tfsa")!;
    expect(tfsa.skippable).toBeFalsy();
  });

  it("RRSP step becomes skippable when retired", () => {
    const steps = getFlowchartSteps(expensesOnly, true);
    const rrsp = steps.find((s) => s.id === "ca-rrsp")!;
    expect(rrsp.skippable).toBe(true);
    expect(rrsp.skipLabel).toContain("Retired");
  });

  it("emergency fund and debt steps remain relevant (unaffected by retirement)", () => {
    const stateWithDebt = makeState({
      country: "CA",
      expenses: [{ id: "e1", category: "Rent", amount: 2000 }],
      debts: [{ id: "d1", category: "Credit Card", amount: 5000, interestRate: 20 }],
    });
    const steps = getFlowchartSteps(stateWithDebt, true);
    const highDebt = steps.find((s) => s.id === "ca-high-debt")!;
    // High-interest debt is present, so step is not complete
    expect(highDebt.status).not.toBe("complete");
  });
});

// ── US steps: retirement mode ─────────────────────────────────────────────────

describe("US steps: retirement mode", () => {
  const usExpensesOnly = makeState({
    country: "US",
    income: [],
    expenses: [{ id: "e1", category: "Rent", amount: 2000 }],
  });

  it("budget step is complete when retired + expenses (US)", () => {
    const steps = getFlowchartSteps(usExpensesOnly, true);
    const budget = steps.find((s) => s.id === "us-budget")!;
    expect(budget.status).toBe("complete");
    expect(budget.completionHint).toContain("savings/investments");
  });

  it("employer match step auto-completes when retired (US)", () => {
    const steps = getFlowchartSteps(usExpensesOnly, true);
    const match = steps.find((s) => s.id === "us-employer-match")!;
    expect(match.status).toBe("complete");
    expect(match.completionHint).toContain("Retired");
  });

  it("HSA step becomes skippable when retired (US)", () => {
    const steps = getFlowchartSteps(usExpensesOnly, true);
    const hsa = steps.find((s) => s.id === "us-hsa")!;
    expect(hsa.skippable).toBe(true);
    expect(hsa.skipLabel).toContain("Retired");
    // userAcknowledgeable should be false when retired
    expect(hsa.userAcknowledgeable).toBeFalsy();
  });

  it("IRA step becomes skippable when retired (US)", () => {
    const steps = getFlowchartSteps(usExpensesOnly, true);
    const ira = steps.find((s) => s.id === "us-ira")!;
    expect(ira.skippable).toBe(true);
    expect(ira.skipLabel).toContain("Retired");
  });

  it("401k step becomes skippable when retired (US)", () => {
    const steps = getFlowchartSteps(usExpensesOnly, true);
    const k401 = steps.find((s) => s.id === "us-401k")!;
    expect(k401.skippable).toBe(true);
    expect(k401.skipLabel).toContain("Retired");
  });
});
