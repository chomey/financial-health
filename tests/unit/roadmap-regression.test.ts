/**
 * Unit tests for roadmap regression scenarios (Task 151).
 * Validates the step inference logic for key E2E scenarios.
 */

import { describe, test, expect } from "vitest";
import { getFlowchartSteps, applyUserOverrides } from "@/lib/flowchart-steps";
import { INITIAL_STATE } from "@/lib/financial-state";
import type { FinancialState } from "@/lib/financial-types";

// ── Helpers ────────────────────────────────────────────────────────────────────

function completeCount(state: FinancialState, acks: string[] = [], skips: string[] = []): number {
  const base = getFlowchartSteps(state);
  const steps = applyUserOverrides(base, acks, skips);
  return steps.filter((s) => s.status === "complete").length;
}

const FRESH_GRAD_STATE: FinancialState = {
  country: "CA",
  jurisdiction: "ON",
  age: 25,
  income: [{ id: "i1", category: "Salary", amount: 3333 }],
  expenses: [
    { id: "e1", category: "Rent/Mortgage Payment", amount: 1200 },
    { id: "e2", category: "Groceries", amount: 400 },
    { id: "e3", category: "Subscriptions", amount: 80 },
    { id: "e4", category: "Dining Out", amount: 200 },
    { id: "e5", category: "Transportation", amount: 150 },
  ],
  assets: [
    { id: "a1", category: "TFSA", amount: 2000, roi: 5 },
    { id: "a2", category: "Savings Account", amount: 1500, surplusTarget: true },
  ],
  debts: [
    { id: "d1", category: "Student Loan", amount: 18000, interestRate: 6, monthlyPayment: 350 },
  ],
  properties: [],
  stocks: [],
};

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("Roadmap regression unit tests (Task 151)", () => {
  // ── Scenario 1: CA default state ─────────────────────────────────────────────

  test("default CA state: 10 steps rendered", () => {
    const steps = getFlowchartSteps(INITIAL_STATE);
    expect(steps).toHaveLength(10);
    expect(steps.every((s) => s.id.startsWith("ca-"))).toBe(true);
  });

  test("default CA state: 7 of 10 steps complete", () => {
    expect(completeCount(INITIAL_STATE)).toBe(7);
  });

  test("default CA state: budget step is complete (has income and expenses)", () => {
    const steps = getFlowchartSteps(INITIAL_STATE);
    const budget = steps.find((s) => s.id === "ca-budget")!;
    expect(budget.status).toBe("complete");
    expect(budget.completionHint).toMatch(/income and expenses/i);
  });

  test("default CA state: TFSA step is complete", () => {
    const steps = getFlowchartSteps(INITIAL_STATE);
    const tfsa = steps.find((s) => s.id === "ca-tfsa")!;
    expect(tfsa.status).toBe("complete");
    expect(tfsa.completionHint).toMatch(/TFSA/);
  });

  test("default CA state: RRSP step is complete", () => {
    const steps = getFlowchartSteps(INITIAL_STATE);
    const rrsp = steps.find((s) => s.id === "ca-rrsp")!;
    expect(rrsp.status).toBe("complete");
    expect(rrsp.completionHint).toMatch(/RRSP/);
  });

  test("default CA state: full EF step shows months covered in hint", () => {
    const steps = getFlowchartSteps(INITIAL_STATE);
    const ef = steps.find((s) => s.id === "ca-full-ef")!;
    // Default state has 55k in assets vs ~7k target → complete
    expect(ef.status).toBe("complete");
    expect(ef.completionHint).toMatch(/months/i);
  });

  // ── Scenario 2: Switch to US ──────────────────────────────────────────────────

  test("US mode: 10 US steps rendered, no CA steps", () => {
    const state: FinancialState = { ...INITIAL_STATE, country: "US" };
    const steps = getFlowchartSteps(state);
    expect(steps).toHaveLength(10);
    expect(steps.every((s) => s.id.startsWith("us-"))).toBe(true);
  });

  test("US mode: has 401k, HSA, and IRA steps", () => {
    const state: FinancialState = { ...INITIAL_STATE, country: "US" };
    const steps = getFlowchartSteps(state);
    const ids = steps.map((s) => s.id);
    expect(ids).toContain("us-401k");
    expect(ids).toContain("us-hsa");
    expect(ids).toContain("us-ira");
  });

  test("US mode: no TFSA, RRSP, or RESP steps", () => {
    const state: FinancialState = { ...INITIAL_STATE, country: "US" };
    const steps = getFlowchartSteps(state);
    const ids = steps.map((s) => s.id);
    expect(ids).not.toContain("ca-tfsa");
    expect(ids).not.toContain("ca-rrsp");
    expect(ids).not.toContain("ca-resp-fhsa");
  });

  // ── Scenario 3: Acknowledge employer match ────────────────────────────────────

  test("acknowledging CA employer match increases complete count from 7 to 8", () => {
    expect(completeCount(INITIAL_STATE)).toBe(7);
    expect(completeCount(INITIAL_STATE, ["ca-employer-match"])).toBe(8);
  });

  test("acknowledging US employer match increases complete count", () => {
    const usState: FinancialState = { ...INITIAL_STATE, country: "US" };
    const before = completeCount(usState);
    const after = completeCount(usState, ["us-employer-match"]);
    expect(after).toBe(before + 1);
  });

  // ── Scenario 4: Skip HSA ──────────────────────────────────────────────────────

  test("skipping us-hsa marks it as complete", () => {
    const usState: FinancialState = { ...INITIAL_STATE, country: "US" };
    const base = getFlowchartSteps(usState);
    const withSkip = applyUserOverrides(base, [], ["us-hsa"]);
    const hsa = withSkip.find((s) => s.id === "us-hsa")!;
    expect(hsa.status).toBe("complete");
    expect(hsa.progress).toBe(100);
  });

  // ── Scenario 5: Undo acknowledgement ─────────────────────────────────────────

  test("undoing ca-employer-match acknowledgement reverts to 7 complete", () => {
    // With ack: 8 complete
    expect(completeCount(INITIAL_STATE, ["ca-employer-match"])).toBe(8);
    // After undo (acks=[]):
    expect(completeCount(INITIAL_STATE, [])).toBe(7);
  });

  test("undone employer match step is in-progress (first non-complete)", () => {
    const steps = applyUserOverrides(getFlowchartSteps(INITIAL_STATE), [], []);
    const emp = steps.find((s) => s.id === "ca-employer-match")!;
    expect(emp.status).toBe("in-progress");
  });

  // ── Scenario 6: High-interest debt ───────────────────────────────────────────

  test("adding high-interest debt makes ca-high-debt not complete", () => {
    const stateWithDebt: FinancialState = {
      ...INITIAL_STATE,
      debts: [
        ...INITIAL_STATE.debts,
        { id: "d2", category: "Credit Card", amount: 3000, interestRate: 20 },
      ],
    };
    const steps = getFlowchartSteps(stateWithDebt);
    const highDebt = steps.find((s) => s.id === "ca-high-debt")!;
    expect(highDebt.status).not.toBe("complete");
    expect(highDebt.completionHint).toContain("Credit Card");
  });

  test("high-interest debt reduces complete count by 1", () => {
    const stateWithDebt: FinancialState = {
      ...INITIAL_STATE,
      debts: [
        ...INITIAL_STATE.debts,
        { id: "d2", category: "Credit Card", amount: 3000, interestRate: 20 },
      ],
    };
    expect(completeCount(INITIAL_STATE)).toBe(7);
    expect(completeCount(stateWithDebt)).toBe(6);
  });

  test("high-interest debt step becomes in-progress when employer match is acked", () => {
    const stateWithDebt: FinancialState = {
      ...INITIAL_STATE,
      debts: [
        ...INITIAL_STATE.debts,
        { id: "d2", category: "Credit Card", amount: 3000, interestRate: 20 },
      ],
    };
    const base = getFlowchartSteps(stateWithDebt);
    const steps = applyUserOverrides(base, ["ca-employer-match"], []);
    const highDebt = steps.find((s) => s.id === "ca-high-debt")!;
    expect(highDebt.status).toBe("in-progress");
  });

  // ── Scenario 7: Add savings to complete EF ───────────────────────────────────

  test("fresh-grad state: full EF step is not complete (insufficient savings)", () => {
    const base = getFlowchartSteps(FRESH_GRAD_STATE);
    const steps = applyUserOverrides(base, ["ca-employer-match"], []);
    const ef = steps.find((s) => s.id === "ca-full-ef")!;
    // $3500 liquid / $7140 3-month target → not complete
    expect(ef.status).not.toBe("complete");
    expect(ef.progress).toBeGreaterThan(0);
    expect(ef.progress).toBeLessThan(100);
  });

  test("adding enough savings to fresh-grad state completes full EF step", () => {
    const enrichedState: FinancialState = {
      ...FRESH_GRAD_STATE,
      assets: [
        ...FRESH_GRAD_STATE.assets,
        { id: "a-extra", category: "Savings Account", amount: 6000 },
      ],
    };
    // $3500 + $6000 = $9500 > $7140
    const base = getFlowchartSteps(enrichedState);
    const steps = applyUserOverrides(base, ["ca-employer-match"], []);
    const ef = steps.find((s) => s.id === "ca-full-ef")!;
    expect(ef.status).toBe("complete");
  });

  // ── Scenario 8: Progress bar updates ─────────────────────────────────────────

  test("progress bar percentage: 7/10 = 70% for default CA state", () => {
    const steps = getFlowchartSteps(INITIAL_STATE);
    const completed = steps.filter((s) => s.status === "complete").length;
    const total = steps.length;
    const percentage = Math.round((completed / total) * 100);
    expect(percentage).toBe(70);
  });

  test("progress bar percentage: 80% after acknowledging employer match", () => {
    const base = getFlowchartSteps(INITIAL_STATE);
    const steps = applyUserOverrides(base, ["ca-employer-match"], []);
    const completed = steps.filter((s) => s.status === "complete").length;
    const total = steps.length;
    const percentage = Math.round((completed / total) * 100);
    expect(percentage).toBe(80);
  });
});
