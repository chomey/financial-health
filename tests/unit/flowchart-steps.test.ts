import { describe, it, expect } from "vitest";
import {
  getFlowchartSteps,
  getCurrentStepIndex,
  applyUserOverrides,
} from "@/lib/flowchart-steps";
import type { FinancialState } from "@/lib/financial-types";

// ── Fixtures ──────────────────────────────────────────────────────────────────

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

const caBaseState: FinancialState = makeState({
  country: "CA",
  income: [{ id: "i1", category: "Salary", amount: 5000 }],
  expenses: [
    { id: "e1", category: "Rent", amount: 1500 },
    { id: "e2", category: "Groceries", amount: 500 },
  ],
});

const usBaseState: FinancialState = makeState({
  country: "US",
  income: [{ id: "i1", category: "Salary", amount: 5000 }],
  expenses: [
    { id: "e1", category: "Rent", amount: 1500 },
    { id: "e2", category: "Groceries", amount: 500 },
  ],
});

// ── CA step structure ─────────────────────────────────────────────────────────

describe("CA step structure", () => {
  it("returns 10 steps for CA", () => {
    const steps = getFlowchartSteps(makeState({ country: "CA" }));
    expect(steps).toHaveLength(10);
  });

  it("all steps have required fields", () => {
    const steps = getFlowchartSteps(caBaseState);
    for (const step of steps) {
      expect(step.id).toBeTruthy();
      expect(step.stepNumber).toBeGreaterThan(0);
      expect(step.title).toBeTruthy();
      expect(step.description).toBeTruthy();
      expect(step.completionHint).toBeTruthy();
      expect(step.detailText).toBeTruthy();
      expect(["complete", "in-progress", "upcoming"]).toContain(step.status);
      expect(step.progress).toBeGreaterThanOrEqual(0);
      expect(step.progress).toBeLessThanOrEqual(100);
    }
  });

  it("step numbers are sequential 1–10", () => {
    const steps = getFlowchartSteps(caBaseState);
    steps.forEach((step, idx) => {
      expect(step.stepNumber).toBe(idx + 1);
    });
  });

  it("CA step IDs start with 'ca-'", () => {
    const steps = getFlowchartSteps(makeState({ country: "CA" }));
    for (const step of steps) {
      expect(step.id).toMatch(/^ca-/);
    }
  });
});

// ── US step structure ─────────────────────────────────────────────────────────

describe("US step structure", () => {
  it("returns 10 steps for US", () => {
    const steps = getFlowchartSteps(makeState({ country: "US" }));
    expect(steps).toHaveLength(10);
  });

  it("US step IDs start with 'us-'", () => {
    const steps = getFlowchartSteps(makeState({ country: "US" }));
    for (const step of steps) {
      expect(step.id).toMatch(/^us-/);
    }
  });

  it("US steps include HSA, IRA, 401k — not TFSA, RRSP", () => {
    const steps = getFlowchartSteps(makeState({ country: "US" }));
    const ids = steps.map((s) => s.id);
    expect(ids).toContain("us-hsa");
    expect(ids).toContain("us-ira");
    expect(ids).toContain("us-401k");
    expect(ids).not.toContain("ca-tfsa");
    expect(ids).not.toContain("ca-rrsp");
  });

  it("CA steps include TFSA, RRSP — not HSA, 401k", () => {
    const steps = getFlowchartSteps(makeState({ country: "CA" }));
    const ids = steps.map((s) => s.id);
    expect(ids).toContain("ca-tfsa");
    expect(ids).toContain("ca-rrsp");
    expect(ids).not.toContain("us-hsa");
    expect(ids).not.toContain("us-401k");
  });
});

// ── No data state ─────────────────────────────────────────────────────────────

describe("no data state", () => {
  it("budget step is in-progress with 0 progress when no income/expenses", () => {
    const steps = getFlowchartSteps(makeState({ country: "CA" }));
    const budget = steps.find((s) => s.id === "ca-budget")!;
    expect(budget.status).toBe("in-progress");
    expect(budget.progress).toBe(0);
    expect(budget.isComplete).toBeUndefined(); // isComplete is internal
  });

  it("no other step is in-progress when budget is incomplete", () => {
    const steps = getFlowchartSteps(makeState({ country: "CA" }));
    expect(steps[0].status).toBe("in-progress");
    const otherInProgress = steps.slice(1).filter((s) => s.status === "in-progress");
    expect(otherInProgress).toHaveLength(0);
  });
});

// ── Budget step ───────────────────────────────────────────────────────────────

describe("budget step inference", () => {
  it("complete when both income and expenses are entered", () => {
    const steps = getFlowchartSteps(caBaseState);
    const budget = steps.find((s) => s.id === "ca-budget")!;
    expect(budget.status).toBe("complete");
    expect(budget.progress).toBe(100);
  });

  it("50% progress with only income", () => {
    const steps = getFlowchartSteps(
      makeState({ country: "CA", income: [{ id: "i1", category: "Salary", amount: 5000 }] }),
    );
    const budget = steps.find((s) => s.id === "ca-budget")!;
    expect(budget.progress).toBe(50);
    expect(budget.status).toBe("in-progress");
  });

  it("50% progress with only expenses", () => {
    const steps = getFlowchartSteps(
      makeState({ country: "CA", expenses: [{ id: "e1", category: "Rent", amount: 1500 }] }),
    );
    const budget = steps.find((s) => s.id === "ca-budget")!;
    expect(budget.progress).toBe(50);
  });
});

// ── Starter emergency fund ────────────────────────────────────────────────────

describe("starter emergency fund step", () => {
  it("complete when liquid assets >= $1000", () => {
    const state: FinancialState = {
      ...caBaseState,
      assets: [{ id: "a1", category: "Savings Account", amount: 1500 }],
    };
    const steps = getFlowchartSteps(state);
    const ef = steps.find((s) => s.id === "ca-starter-ef")!;
    expect(ef.status).toBe("complete");
    expect(ef.progress).toBe(100);
  });

  it("partial progress when savings < $1000", () => {
    const state: FinancialState = {
      ...caBaseState,
      assets: [{ id: "a1", category: "Savings Account", amount: 500 }],
    };
    const steps = getFlowchartSteps(state);
    const ef = steps.find((s) => s.id === "ca-starter-ef")!;
    expect(ef.progress).toBe(50);
    expect(ef.status).not.toBe("complete");
  });

  it("0 progress when no assets", () => {
    const state: FinancialState = { ...caBaseState, assets: [] };
    const steps = getFlowchartSteps(state);
    const ef = steps.find((s) => s.id === "ca-starter-ef")!;
    expect(ef.progress).toBe(0);
  });

  it("stocks do not count toward cash-like emergency fund", () => {
    const state: FinancialState = {
      ...caBaseState,
      stocks: [{ id: "s1", ticker: "XEQ", shares: 10, costBasis: 120, lastFetchedPrice: 120 }],
    };
    const steps = getFlowchartSteps(state);
    const ef = steps.find((s) => s.id === "ca-starter-ef")!;
    // Stocks are not cash-like, so EF remains incomplete
    expect(ef.status).not.toBe("complete");
  });
});

// ── Full emergency fund ───────────────────────────────────────────────────────

describe("full emergency fund step", () => {
  it("complete when liquid assets >= 3x monthly obligations", () => {
    // monthly expenses: 1500+500 = 2000; target = 6000
    const state: FinancialState = {
      ...caBaseState,
      assets: [{ id: "a1", category: "HISA", amount: 6500 }],
    };
    const steps = getFlowchartSteps(state);
    const ef = steps.find((s) => s.id === "ca-full-ef")!;
    expect(ef.status).toBe("complete");
  });

  it("partial progress when savings partially funded", () => {
    const state: FinancialState = {
      ...caBaseState,
      assets: [{ id: "a1", category: "HISA", amount: 3000 }],
    };
    const steps = getFlowchartSteps(state);
    const ef = steps.find((s) => s.id === "ca-full-ef")!;
    // 3000 / 6000 = 50%
    expect(ef.progress).toBe(50);
  });

  it("includes mortgage in obligations", () => {
    const state: FinancialState = {
      ...caBaseState,
      properties: [
        {
          id: "p1",
          name: "Home",
          value: 500000,
          mortgage: 300000,
          monthlyPayment: 2000,
        },
      ],
      assets: [{ id: "a1", category: "HISA", amount: 18000 }],
    };
    const steps = getFlowchartSteps(state);
    const ef = steps.find((s) => s.id === "ca-full-ef")!;
    // monthly obligations: 2000(expenses) + 2000(mortgage) = 4000; target 12000
    // 18000 >= 12000 → complete
    expect(ef.status).toBe("complete");
  });
});

// ── High-interest debt step ───────────────────────────────────────────────────

describe("high-interest debt step", () => {
  it("complete when no high-interest debt", () => {
    const state: FinancialState = {
      ...caBaseState,
      debts: [{ id: "d1", category: "Car Loan", amount: 5000, interestRate: 5 }],
    };
    const steps = getFlowchartSteps(state);
    const debt = steps.find((s) => s.id === "ca-high-debt")!;
    expect(debt.status).toBe("complete");
  });

  it("not complete when high-interest debt exists", () => {
    const state: FinancialState = {
      ...caBaseState,
      assets: [{ id: "a1", category: "Savings Account", amount: 2000 }],
      debts: [{ id: "d1", category: "Credit Card", amount: 3000, interestRate: 22 }],
    };
    const steps = getFlowchartSteps(state);
    const debt = steps.find((s) => s.id === "ca-high-debt")!;
    expect(debt.status).not.toBe("complete");
    expect(debt.progress).toBe(0);
  });

  it("completionHint includes debt category name", () => {
    const state: FinancialState = {
      ...caBaseState,
      debts: [{ id: "d1", category: "Credit Card", amount: 3000, interestRate: 22 }],
    };
    const steps = getFlowchartSteps(state);
    const debt = steps.find((s) => s.id === "ca-high-debt")!;
    expect(debt.completionHint).toContain("Credit Card");
  });

  it("8% is NOT high-interest (boundary)", () => {
    const state: FinancialState = {
      ...caBaseState,
      assets: [{ id: "a1", category: "Savings", amount: 2000 }],
      debts: [{ id: "d1", category: "Personal Loan", amount: 1000, interestRate: 8 }],
    };
    const steps = getFlowchartSteps(state);
    const debt = steps.find((s) => s.id === "ca-high-debt")!;
    // 8% is at the boundary — moderate, not high
    expect(debt.status).toBe("complete");
  });
});

// ── Moderate-interest debt step ───────────────────────────────────────────────

describe("moderate-interest debt step", () => {
  it("complete when no 4–8% debt", () => {
    const state: FinancialState = {
      ...caBaseState,
      debts: [{ id: "d1", category: "Credit Card", amount: 3000, interestRate: 22 }],
    };
    const steps = getFlowchartSteps(state);
    // CA moderate debt is step 8
    const debt = steps.find((s) => s.id === "ca-moderate-debt")!;
    expect(debt.status).toBe("complete");
  });

  it("not complete when moderate debt exists", () => {
    const state: FinancialState = {
      ...caBaseState,
      assets: [{ id: "a1", category: "Savings", amount: 2000 }],
      debts: [{ id: "d1", category: "Car Loan", amount: 5000, interestRate: 6.5 }],
    };
    const steps = getFlowchartSteps(state);
    const debt = steps.find((s) => s.id === "ca-moderate-debt")!;
    expect(debt.status).not.toBe("complete");
  });
});

// ── Tax-advantaged account steps ──────────────────────────────────────────────

describe("CA TFSA step", () => {
  it("complete when user has TFSA", () => {
    const state: FinancialState = {
      ...caBaseState,
      assets: [{ id: "a1", category: "TFSA", amount: 22000 }],
    };
    const steps = getFlowchartSteps(state);
    const tfsa = steps.find((s) => s.id === "ca-tfsa")!;
    expect(tfsa.status).toBe("complete");
  });

  it("not complete when no TFSA", () => {
    const state: FinancialState = {
      ...caBaseState,
      assets: [{ id: "a1", category: "Savings Account", amount: 5000 }],
    };
    const steps = getFlowchartSteps(state);
    const tfsa = steps.find((s) => s.id === "ca-tfsa")!;
    expect(tfsa.status).not.toBe("complete");
    expect(tfsa.progress).toBe(0);
  });

  it("complete when user has FHSA (treated as tax-free)", () => {
    const state: FinancialState = {
      ...caBaseState,
      assets: [{ id: "a1", category: "FHSA", amount: 8000 }],
    };
    const steps = getFlowchartSteps(state);
    const tfsa = steps.find((s) => s.id === "ca-tfsa")!;
    expect(tfsa.status).toBe("complete");
  });
});

describe("CA RRSP step", () => {
  it("complete when user has RRSP", () => {
    const state: FinancialState = {
      ...caBaseState,
      assets: [{ id: "a1", category: "RRSP", amount: 30000 }],
    };
    const steps = getFlowchartSteps(state);
    const rrsp = steps.find((s) => s.id === "ca-rrsp")!;
    expect(rrsp.status).toBe("complete");
  });

  it("complete when user has LIRA", () => {
    const state: FinancialState = {
      ...caBaseState,
      assets: [{ id: "a1", category: "LIRA", amount: 15000 }],
    };
    const steps = getFlowchartSteps(state);
    const rrsp = steps.find((s) => s.id === "ca-rrsp")!;
    expect(rrsp.status).toBe("complete");
  });
});

describe("US HSA step", () => {
  it("complete when user has HSA", () => {
    const state: FinancialState = {
      ...usBaseState,
      assets: [{ id: "a1", category: "HSA", amount: 5000 }],
    };
    const steps = getFlowchartSteps(state);
    const hsa = steps.find((s) => s.id === "us-hsa")!;
    expect(hsa.status).toBe("complete");
    expect(hsa.progress).toBe(100);
  });

  it("HSA step is userAcknowledgeable and skippable", () => {
    const steps = getFlowchartSteps(usBaseState);
    const hsa = steps.find((s) => s.id === "us-hsa")!;
    expect(hsa.userAcknowledgeable).toBe(true);
    expect(hsa.skippable).toBe(true);
    expect(hsa.skipLabel).toBeTruthy();
  });
});

describe("US IRA/Roth IRA step", () => {
  it("complete when user has Roth IRA", () => {
    const state: FinancialState = {
      ...usBaseState,
      assets: [{ id: "a1", category: "Roth IRA", amount: 7000 }],
    };
    const steps = getFlowchartSteps(state);
    const ira = steps.find((s) => s.id === "us-ira")!;
    expect(ira.status).toBe("complete");
  });

  it("complete when user has traditional IRA", () => {
    const state: FinancialState = {
      ...usBaseState,
      assets: [{ id: "a1", category: "IRA", amount: 7000 }],
    };
    const steps = getFlowchartSteps(state);
    const ira = steps.find((s) => s.id === "us-ira")!;
    expect(ira.status).toBe("complete");
  });
});

describe("US 401k step", () => {
  it("complete when user has 401k", () => {
    const state: FinancialState = {
      ...usBaseState,
      assets: [{ id: "a1", category: "401k", amount: 50000 }],
    };
    const steps = getFlowchartSteps(state);
    const k401 = steps.find((s) => s.id === "us-401k")!;
    expect(k401.status).toBe("complete");
  });

  it("complete when user has 403b", () => {
    const state: FinancialState = {
      ...usBaseState,
      assets: [{ id: "a1", category: "403b", amount: 20000 }],
    };
    const steps = getFlowchartSteps(state);
    const k401 = steps.find((s) => s.id === "us-401k")!;
    expect(k401.status).toBe("complete");
  });
});

// ── Employer match step ───────────────────────────────────────────────────────

describe("employer match step", () => {
  it("CA employer match is userAcknowledgeable and skippable", () => {
    const steps = getFlowchartSteps(caBaseState);
    const match = steps.find((s) => s.id === "ca-employer-match")!;
    expect(match.userAcknowledgeable).toBe(true);
    expect(match.skippable).toBe(true);
    expect(match.acknowledgeLabel).toBeTruthy();
    expect(match.skipLabel).toBeTruthy();
  });

  it("US employer match is userAcknowledgeable and skippable", () => {
    const steps = getFlowchartSteps(usBaseState);
    const match = steps.find((s) => s.id === "us-employer-match")!;
    expect(match.userAcknowledgeable).toBe(true);
    expect(match.skippable).toBe(true);
  });
});

// ── Sequential status logic ───────────────────────────────────────────────────

describe("sequential status logic", () => {
  it("only one step is in-progress at a time", () => {
    const steps = getFlowchartSteps(caBaseState);
    const inProgress = steps.filter((s) => s.status === "in-progress");
    expect(inProgress.length).toBeLessThanOrEqual(1);
  });

  it("all steps before first in-progress are complete", () => {
    const state: FinancialState = {
      ...caBaseState,
      assets: [{ id: "a1", category: "TFSA", amount: 2000 }],
    };
    const steps = getFlowchartSteps(state);
    const firstIncompleteIdx = steps.findIndex((s) => s.status !== "complete");
    if (firstIncompleteIdx > 0) {
      for (let i = 0; i < firstIncompleteIdx; i++) {
        expect(steps[i].status).toBe("complete");
      }
    }
  });

  it("no step after first in-progress is also in-progress", () => {
    const steps = getFlowchartSteps(caBaseState);
    const firstInProgressIdx = steps.findIndex((s) => s.status === "in-progress");
    if (firstInProgressIdx >= 0) {
      const subsequentInProgress = steps.slice(firstInProgressIdx + 1).filter((s) => s.status === "in-progress");
      expect(subsequentInProgress).toHaveLength(0);
    }
  });
});

// ── Fully funded CA scenario ──────────────────────────────────────────────────

describe("fully funded CA scenario", () => {
  it("most steps are complete with income, savings, and accounts", () => {
    const state: FinancialState = {
      ...caBaseState,
      assets: [
        { id: "a1", category: "HISA", amount: 15000 }, // covers starter EF + full EF
        { id: "a2", category: "TFSA", amount: 50000 },
        { id: "a3", category: "RRSP", amount: 80000 },
        { id: "a4", category: "RESP", amount: 20000 },
      ],
      debts: [], // no debt
    };
    const steps = getFlowchartSteps(state);
    const completed = steps.filter((s) => s.status === "complete");
    // Budget, starter EF, high debt (none), full EF, TFSA, RRSP, moderate debt (none), RESP/FHSA
    expect(completed.length).toBeGreaterThanOrEqual(6);
  });
});

// ── Fully funded US scenario ──────────────────────────────────────────────────

describe("fully funded US scenario", () => {
  it("most steps are complete with income, savings, and accounts", () => {
    const state: FinancialState = {
      ...usBaseState,
      assets: [
        { id: "a1", category: "HYSA", amount: 15000 },
        { id: "a2", category: "HSA", amount: 5000 },
        { id: "a3", category: "Roth IRA", amount: 7000 },
        { id: "a4", category: "401k", amount: 80000 },
      ],
      debts: [],
    };
    const steps = getFlowchartSteps(state);
    const completed = steps.filter((s) => s.status === "complete");
    expect(completed.length).toBeGreaterThanOrEqual(6);
  });
});

// ── High debt, no EF scenario ─────────────────────────────────────────────────

describe("high debt scenario", () => {
  it("high-interest debt step not complete when credit card debt exists", () => {
    const state: FinancialState = {
      ...caBaseState,
      assets: [{ id: "a1", category: "Savings", amount: 500 }],
      debts: [{ id: "d1", category: "Credit Card", amount: 8000, interestRate: 24 }],
    };
    const steps = getFlowchartSteps(state);
    const debt = steps.find((s) => s.id === "ca-high-debt")!;
    expect(debt.status).not.toBe("complete");
  });
});

// ── getCurrentStepIndex ───────────────────────────────────────────────────────

describe("getCurrentStepIndex", () => {
  it("returns 0 when no steps are complete", () => {
    const steps = getFlowchartSteps(makeState({ country: "CA" }));
    expect(getCurrentStepIndex(steps)).toBe(0);
  });

  it("returns index of first non-complete step", () => {
    const state: FinancialState = {
      ...caBaseState,
      assets: [{ id: "a1", category: "Savings Account", amount: 5000 }],
    };
    const steps = getFlowchartSteps(state);
    const idx = getCurrentStepIndex(steps);
    expect(steps[idx].status).toBe("in-progress");
  });

  it("returns last step index when all steps are complete", () => {
    const steps = getFlowchartSteps(caBaseState).map((s) => ({
      ...s,
      status: "complete" as const,
    }));
    expect(getCurrentStepIndex(steps)).toBe(steps.length - 1);
  });
});

// ── applyUserOverrides ────────────────────────────────────────────────────────

describe("applyUserOverrides", () => {
  it("acknowledged step becomes complete", () => {
    const steps = getFlowchartSteps(caBaseState);
    const budget = steps.find((s) => s.id === "ca-budget")!;
    expect(budget.status).toBe("complete"); // already complete from data

    // Acknowledge employer match (normally userAcknowledgeable)
    const overridden = applyUserOverrides(steps, ["ca-employer-match"], []);
    const match = overridden.find((s) => s.id === "ca-employer-match")!;
    expect(match.status).toBe("complete");
    expect(match.progress).toBe(100);
  });

  it("skipped step becomes complete", () => {
    const steps = getFlowchartSteps(caBaseState);
    const overridden = applyUserOverrides(steps, [], ["ca-employer-match"]);
    const match = overridden.find((s) => s.id === "ca-employer-match")!;
    expect(match.status).toBe("complete");
    expect(match.progress).toBe(100);
  });

  it("re-assigns in-progress after overrides", () => {
    const steps = getFlowchartSteps(caBaseState);
    // Override employer match (step 3) as skipped
    const overridden = applyUserOverrides(steps, [], ["ca-employer-match"]);
    const inProgress = overridden.filter((s) => s.status === "in-progress");
    expect(inProgress.length).toBeLessThanOrEqual(1);
  });

  it("non-overridden steps retain their status", () => {
    const steps = getFlowchartSteps(caBaseState);
    const overridden = applyUserOverrides(steps, ["ca-employer-match"], []);
    const tfsa = overridden.find((s) => s.id === "ca-tfsa")!;
    // TFSA is still not complete (no TFSA asset in caBaseState)
    expect(tfsa.status).not.toBe("complete");
  });

  it("empty overrides return same logical status", () => {
    const steps = getFlowchartSteps(caBaseState);
    const overridden = applyUserOverrides(steps, [], []);
    // Statuses should be the same
    steps.forEach((step, idx) => {
      expect(overridden[idx].status).toBe(step.status);
    });
  });

  it("multiple steps can be acknowledged/skipped", () => {
    const steps = getFlowchartSteps(caBaseState);
    const overridden = applyUserOverrides(
      steps,
      ["ca-employer-match", "ca-taxable"],
      ["ca-resp-fhsa"],
    );
    expect(overridden.find((s) => s.id === "ca-employer-match")!.status).toBe("complete");
    expect(overridden.find((s) => s.id === "ca-taxable")!.status).toBe("complete");
    expect(overridden.find((s) => s.id === "ca-resp-fhsa")!.status).toBe("complete");
  });
});

// ── Country defaults ──────────────────────────────────────────────────────────

describe("country defaults", () => {
  it("defaults to CA when country is undefined", () => {
    const state = makeState({ country: undefined });
    const steps = getFlowchartSteps(state);
    expect(steps[0].id).toBe("ca-budget");
  });
});
