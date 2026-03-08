import { describe, it, expect } from "vitest";
import {
  getFlowchartSteps,
  applyUserOverrides,
  getStepContext,
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
    country: "AU",
    jurisdiction: "AU-NSW",
    ...overrides,
  };
}

const auBaseState: FinancialState = makeState({
  income: [{ id: "i1", category: "Salary", amount: 7000 }],
  expenses: [
    { id: "e1", category: "Rent", amount: 2000 },
    { id: "e2", category: "Groceries", amount: 600 },
  ],
});

// ── AU step structure ─────────────────────────────────────────────────────────

describe("AU step structure", () => {
  it("returns 10 steps for AU", () => {
    const steps = getFlowchartSteps(makeState());
    expect(steps).toHaveLength(10);
  });

  it("all steps have required fields", () => {
    const steps = getFlowchartSteps(auBaseState);
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
    const steps = getFlowchartSteps(auBaseState);
    steps.forEach((step, idx) => {
      expect(step.stepNumber).toBe(idx + 1);
    });
  });

  it("AU step IDs start with 'au-'", () => {
    const steps = getFlowchartSteps(makeState());
    for (const step of steps) {
      expect(step.id).toMatch(/^au-/);
    }
  });

  it("AU steps contain expected step IDs", () => {
    const steps = getFlowchartSteps(makeState());
    const ids = steps.map((s) => s.id);
    expect(ids).toContain("au-budget");
    expect(ids).toContain("au-emergency-fund");
    expect(ids).toContain("au-super-guarantee");
    expect(ids).toContain("au-high-debt");
    expect(ids).toContain("au-salary-sacrifice");
    expect(ids).toContain("au-fhss");
    expect(ids).toContain("au-moderate-debt");
    expect(ids).toContain("au-etf-invest");
    expect(ids).toContain("au-nonconcessional-super");
    expect(ids).toContain("au-lifestyle-giving");
  });

  it("AU steps do not contain CA or US step IDs", () => {
    const steps = getFlowchartSteps(makeState());
    for (const step of steps) {
      expect(step.id).not.toMatch(/^ca-/);
      expect(step.id).not.toMatch(/^us-/);
    }
  });
});

// ── AU budget step ─────────────────────────────────────────────────────────────

describe("AU budget step", () => {
  it("complete when both income and expenses entered", () => {
    const steps = getFlowchartSteps(auBaseState);
    const budget = steps.find((s) => s.id === "au-budget")!;
    expect(budget.status).toBe("complete");
    expect(budget.progress).toBe(100);
  });

  it("50% progress with only income", () => {
    const steps = getFlowchartSteps(
      makeState({ income: [{ id: "i1", category: "Salary", amount: 5000 }] }),
    );
    const budget = steps.find((s) => s.id === "au-budget")!;
    expect(budget.progress).toBe(50);
    expect(budget.status).toBe("in-progress");
  });

  it("50% progress with only expenses", () => {
    const steps = getFlowchartSteps(
      makeState({ expenses: [{ id: "e1", category: "Rent", amount: 2000 }] }),
    );
    const budget = steps.find((s) => s.id === "au-budget")!;
    expect(budget.progress).toBe(50);
  });
});

// ── AU emergency fund step ────────────────────────────────────────────────────

describe("AU emergency fund step (full 3–6 months)", () => {
  it("complete when cash covers 3x monthly obligations", () => {
    // monthly expenses: 2000+600 = 2600; target = 7800
    const state: FinancialState = {
      ...auBaseState,
      assets: [{ id: "a1", category: "HISA", amount: 8000 }],
    };
    const steps = getFlowchartSteps(state);
    const ef = steps.find((s) => s.id === "au-emergency-fund")!;
    expect(ef.status).toBe("complete");
    expect(ef.progress).toBe(100);
  });

  it("partial progress when partially funded", () => {
    // monthly expenses: 2600; target = 7800
    const state: FinancialState = {
      ...auBaseState,
      assets: [{ id: "a1", category: "HISA", amount: 3900 }],
    };
    const steps = getFlowchartSteps(state);
    const ef = steps.find((s) => s.id === "au-emergency-fund")!;
    expect(ef.progress).toBe(50);
    expect(ef.status).not.toBe("complete");
  });

  it("0 progress when no cash assets", () => {
    const steps = getFlowchartSteps(auBaseState);
    const ef = steps.find((s) => s.id === "au-emergency-fund")!;
    expect(ef.progress).toBe(0);
  });

  it("no $1,000 starter step (AU skips it)", () => {
    const steps = getFlowchartSteps(makeState());
    const ids = steps.map((s) => s.id);
    expect(ids).not.toContain("au-starter-ef");
  });
});

// ── AU employer super guarantee step ─────────────────────────────────────────

describe("AU super guarantee step", () => {
  it("is userAcknowledgeable and skippable for employed users", () => {
    const steps = getFlowchartSteps(auBaseState);
    const sgc = steps.find((s) => s.id === "au-super-guarantee")!;
    expect(sgc.userAcknowledgeable).toBe(true);
    expect(sgc.skippable).toBe(true);
    expect(sgc.acknowledgeLabel).toBeTruthy();
    expect(sgc.skipLabel).toBeTruthy();
  });

  it("is complete for retired users", () => {
    const state: FinancialState = {
      ...auBaseState,
      income: [{ id: "i1", category: "Investment Income", amount: 5000, incomeType: "investment" }],
      assets: [
        { id: "a1", category: "Super (Pension Phase)", amount: 1200000, roi: 5 },
      ],
    };
    const steps = getFlowchartSteps(state, true);
    const sgc = steps.find((s) => s.id === "au-super-guarantee")!;
    expect(sgc.status).toBe("complete");
    expect(sgc.progress).toBe(100);
  });

  it("mentions 11.5% in detailText", () => {
    const steps = getFlowchartSteps(auBaseState);
    const sgc = steps.find((s) => s.id === "au-super-guarantee")!;
    expect(sgc.detailText).toContain("11.5%");
  });
});

// ── AU high-interest debt step ────────────────────────────────────────────────

describe("AU high-interest debt step", () => {
  it("complete when no high-interest debt", () => {
    const state: FinancialState = {
      ...auBaseState,
      debts: [{ id: "d1", category: "Car Loan", amount: 10000, interestRate: 6 }],
    };
    const steps = getFlowchartSteps(state);
    const debt = steps.find((s) => s.id === "au-high-debt")!;
    expect(debt.status).toBe("complete");
  });

  it("not complete when high-interest debt exists", () => {
    const state: FinancialState = {
      ...auBaseState,
      assets: [{ id: "a1", category: "HISA", amount: 2000 }],
      debts: [{ id: "d1", category: "Credit Card", amount: 3000, interestRate: 21 }],
    };
    const steps = getFlowchartSteps(state);
    const debt = steps.find((s) => s.id === "au-high-debt")!;
    expect(debt.status).not.toBe("complete");
    expect(debt.completionHint).toContain("Credit Card");
  });

  it("HECS-HELP at low rate is not flagged as high-interest", () => {
    const state: FinancialState = {
      ...auBaseState,
      assets: [{ id: "a1", category: "HISA", amount: 2000 }],
      debts: [{ id: "d1", category: "HECS-HELP", amount: 25000, interestRate: 3.9 }],
    };
    const steps = getFlowchartSteps(state);
    const debt = steps.find((s) => s.id === "au-high-debt")!;
    expect(debt.status).toBe("complete");
  });
});

// ── AU salary sacrifice step ──────────────────────────────────────────────────

describe("AU salary sacrifice step", () => {
  it("is userAcknowledgeable for non-retired users", () => {
    const steps = getFlowchartSteps(auBaseState);
    const ss = steps.find((s) => s.id === "au-salary-sacrifice")!;
    expect(ss.userAcknowledgeable).toBe(true);
    expect(ss.skippable).toBe(true);
  });

  it("mentions concessional cap in detailText", () => {
    const steps = getFlowchartSteps(auBaseState);
    const ss = steps.find((s) => s.id === "au-salary-sacrifice")!;
    expect(ss.detailText).toContain("$30,000");
  });

  it("shows 50% progress when super account exists", () => {
    const state: FinancialState = {
      ...auBaseState,
      assets: [{ id: "a1", category: "Super (Accumulation)", amount: 45000 }],
    };
    const steps = getFlowchartSteps(state);
    const ss = steps.find((s) => s.id === "au-salary-sacrifice")!;
    expect(ss.progress).toBe(50);
  });
});

// ── AU FHSS step ──────────────────────────────────────────────────────────────

describe("AU FHSS step", () => {
  it("complete when FHSS account exists", () => {
    const state: FinancialState = {
      ...auBaseState,
      assets: [{ id: "a1", category: "First Home Super Saver", amount: 15000 }],
    };
    const steps = getFlowchartSteps(state);
    const fhss = steps.find((s) => s.id === "au-fhss")!;
    expect(fhss.status).toBe("complete");
    expect(fhss.progress).toBe(100);
  });

  it("is skippable (not saving for first home)", () => {
    const steps = getFlowchartSteps(auBaseState);
    const fhss = steps.find((s) => s.id === "au-fhss")!;
    expect(fhss.skippable).toBe(true);
    expect(fhss.skipLabel).toContain("home");
  });

  it("userAcknowledgeable", () => {
    const steps = getFlowchartSteps(auBaseState);
    const fhss = steps.find((s) => s.id === "au-fhss")!;
    expect(fhss.userAcknowledgeable).toBe(true);
  });

  it("mentions $50,000 total cap in detailText", () => {
    const steps = getFlowchartSteps(auBaseState);
    const fhss = steps.find((s) => s.id === "au-fhss")!;
    expect(fhss.detailText).toContain("$50,000");
  });
});

// ── AU moderate-interest debt step ───────────────────────────────────────────

describe("AU moderate-interest debt step", () => {
  it("complete when no moderate-interest debt", () => {
    const steps = getFlowchartSteps(auBaseState);
    const debt = steps.find((s) => s.id === "au-moderate-debt")!;
    expect(debt.status).toBe("complete");
  });

  it("not complete when moderate-rate debt exists", () => {
    const state: FinancialState = {
      ...auBaseState,
      assets: [{ id: "a1", category: "HISA", amount: 2000 }],
      debts: [{ id: "d1", category: "Car Loan", amount: 15000, interestRate: 7 }],
    };
    const steps = getFlowchartSteps(state);
    const debt = steps.find((s) => s.id === "au-moderate-debt")!;
    expect(debt.status).not.toBe("complete");
    expect(debt.completionHint).toContain("Car Loan");
  });
});

// ── AU ETF investing step ─────────────────────────────────────────────────────

describe("AU ETF investing step", () => {
  it("complete when ETF/investment account exists", () => {
    const state: FinancialState = {
      ...auBaseState,
      assets: [{ id: "a1", category: "ETF Portfolio", amount: 25000 }],
    };
    const steps = getFlowchartSteps(state);
    const etf = steps.find((s) => s.id === "au-etf-invest")!;
    expect(etf.status).toBe("complete");
  });

  it("complete when shares/brokerage account exists", () => {
    const state: FinancialState = {
      ...auBaseState,
      assets: [{ id: "a1", category: "Share Portfolio (ASX)", amount: 50000 }],
    };
    const steps = getFlowchartSteps(state);
    const etf = steps.find((s) => s.id === "au-etf-invest")!;
    expect(etf.status).toBe("complete");
  });

  it("not complete when only cash accounts exist", () => {
    const state: FinancialState = {
      ...auBaseState,
      assets: [{ id: "a1", category: "HISA", amount: 10000 }],
    };
    const steps = getFlowchartSteps(state);
    const etf = steps.find((s) => s.id === "au-etf-invest")!;
    expect(etf.status).not.toBe("complete");
  });

  it("mentions ASX ETFs in detailText", () => {
    const steps = getFlowchartSteps(auBaseState);
    const etf = steps.find((s) => s.id === "au-etf-invest")!;
    expect(etf.detailText).toContain("ASX");
  });
});

// ── AU non-concessional super step ────────────────────────────────────────────

describe("AU non-concessional super step", () => {
  it("is userAcknowledgeable", () => {
    const steps = getFlowchartSteps(auBaseState);
    const ncs = steps.find((s) => s.id === "au-nonconcessional-super")!;
    expect(ncs.userAcknowledgeable).toBe(true);
  });

  it("mentions $120,000 cap in detailText", () => {
    const steps = getFlowchartSteps(auBaseState);
    const ncs = steps.find((s) => s.id === "au-nonconcessional-super")!;
    expect(ncs.detailText).toContain("$120,000");
  });

  it("is skippable", () => {
    const steps = getFlowchartSteps(auBaseState);
    const ncs = steps.find((s) => s.id === "au-nonconcessional-super")!;
    expect(ncs.skippable).toBe(true);
  });
});

// ── AU lifestyle & giving step ────────────────────────────────────────────────

describe("AU lifestyle & giving step", () => {
  it("is userAcknowledgeable", () => {
    const steps = getFlowchartSteps(auBaseState);
    const lifestyle = steps.find((s) => s.id === "au-lifestyle-giving")!;
    expect(lifestyle.userAcknowledgeable).toBe(true);
  });
});

// ── AU sequential status logic ────────────────────────────────────────────────

describe("AU sequential status logic", () => {
  it("only one step is in-progress at a time", () => {
    const steps = getFlowchartSteps(auBaseState);
    const inProgress = steps.filter((s) => s.status === "in-progress");
    expect(inProgress.length).toBeLessThanOrEqual(1);
  });

  it("budget step is in-progress when no income/expenses", () => {
    const steps = getFlowchartSteps(makeState());
    expect(steps[0].id).toBe("au-budget");
    expect(steps[0].status).toBe("in-progress");
  });

  it("all steps before first in-progress are complete", () => {
    const steps = getFlowchartSteps(auBaseState);
    const firstIncompleteIdx = steps.findIndex((s) => s.status !== "complete");
    if (firstIncompleteIdx > 0) {
      for (let i = 0; i < firstIncompleteIdx; i++) {
        expect(steps[i].status).toBe("complete");
      }
    }
  });
});

// ── AU fully-funded scenario ──────────────────────────────────────────────────

describe("AU fully funded scenario", () => {
  it("most steps complete with income, savings, super, and investments", () => {
    const state: FinancialState = {
      ...auBaseState,
      assets: [
        { id: "a1", category: "HISA", amount: 20000 },
        { id: "a2", category: "Super (Accumulation)", amount: 80000 },
        { id: "a3", category: "ETF Portfolio", amount: 30000 },
      ],
      debts: [],
    };
    const steps = getFlowchartSteps(state);
    const completed = steps.filter((s) => s.status === "complete");
    // Budget, EF, high-debt (none), moderate-debt (none), ETF
    expect(completed.length).toBeGreaterThanOrEqual(4);
  });
});

// ── AU user overrides ─────────────────────────────────────────────────────────

describe("AU applyUserOverrides", () => {
  it("acknowledged SGC step becomes complete", () => {
    const steps = getFlowchartSteps(auBaseState);
    const overridden = applyUserOverrides(steps, ["au-super-guarantee"], []);
    const sgc = overridden.find((s) => s.id === "au-super-guarantee")!;
    expect(sgc.status).toBe("complete");
    expect(sgc.progress).toBe(100);
  });

  it("skipped FHSS step becomes complete", () => {
    const steps = getFlowchartSteps(auBaseState);
    const overridden = applyUserOverrides(steps, [], ["au-fhss"]);
    const fhss = overridden.find((s) => s.id === "au-fhss")!;
    expect(fhss.status).toBe("complete");
    expect(fhss.progress).toBe(100);
  });

  it("re-assigns in-progress after overrides", () => {
    const steps = getFlowchartSteps(auBaseState);
    const overridden = applyUserOverrides(steps, ["au-super-guarantee", "au-fhss"], []);
    const inProgress = overridden.filter((s) => s.status === "in-progress");
    expect(inProgress.length).toBeLessThanOrEqual(1);
  });
});

// ── AU getStepContext ─────────────────────────────────────────────────────────

describe("AU getStepContext", () => {
  it("returns income/expense context for au-budget", () => {
    const ctx = getStepContext("au-budget", auBaseState);
    expect(ctx).not.toBeNull();
    expect(ctx!.heading).toBeTruthy();
    expect(ctx!.items.length).toBeGreaterThan(0);
  });

  it("returns cash context for au-emergency-fund", () => {
    const state: FinancialState = {
      ...auBaseState,
      assets: [{ id: "a1", category: "HISA", amount: 5000 }],
    };
    const ctx = getStepContext("au-emergency-fund", state);
    expect(ctx).not.toBeNull();
  });

  it("returns super accounts for au-super-guarantee", () => {
    const state: FinancialState = {
      ...auBaseState,
      assets: [{ id: "a1", category: "Super (Accumulation)", amount: 45000 }],
    };
    const ctx = getStepContext("au-super-guarantee", state);
    expect(ctx).not.toBeNull();
    expect(ctx!.items.length).toBeGreaterThan(0);
    expect(ctx!.items[0].label).toContain("Super");
  });

  it("returns FHSS accounts for au-fhss", () => {
    const state: FinancialState = {
      ...auBaseState,
      assets: [{ id: "a1", category: "First Home Super Saver", amount: 15000 }],
    };
    const ctx = getStepContext("au-fhss", state);
    expect(ctx).not.toBeNull();
    expect(ctx!.items[0].label).toContain("First Home");
  });

  it("returns debt context for au-high-debt", () => {
    const state: FinancialState = {
      ...auBaseState,
      debts: [{ id: "d1", category: "Credit Card", amount: 5000, interestRate: 21 }],
    };
    const ctx = getStepContext("au-high-debt", state);
    expect(ctx).not.toBeNull();
    expect(ctx!.items[0].label).toBe("Credit Card");
  });

  it("returns null for au-lifestyle-giving", () => {
    const ctx = getStepContext("au-lifestyle-giving", auBaseState);
    expect(ctx).toBeNull();
  });
});

// ── CA/US regression — AU additions must not affect CA/US ─────────────────────

describe("CA/US regression after AU additions", () => {
  it("CA still returns 10 steps with ca- prefixes", () => {
    const state = makeState({ country: "CA" });
    const steps = getFlowchartSteps(state);
    expect(steps).toHaveLength(10);
    for (const step of steps) {
      expect(step.id).toMatch(/^ca-/);
    }
  });

  it("US still returns 10 steps with us- prefixes", () => {
    const state = makeState({ country: "US" });
    const steps = getFlowchartSteps(state);
    expect(steps).toHaveLength(10);
    for (const step of steps) {
      expect(step.id).toMatch(/^us-/);
    }
  });

  it("country undefined defaults to CA", () => {
    const state = makeState({ country: undefined });
    const steps = getFlowchartSteps(state);
    expect(steps[0].id).toBe("ca-budget");
  });
});
