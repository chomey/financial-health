import { describe, it, expect } from "vitest";
import {
  computeTotals,
  computeMetrics,
  toFinancialData,
} from "@/lib/financial-state";
import type { FinancialState } from "@/lib/financial-state";
import { projectFinances } from "@/lib/projections";

function makeState(overrides: Partial<FinancialState> = {}): FinancialState {
  return {
    assets: [],
    debts: [],
    income: [],
    expenses: [],
    goals: [],
    properties: [],
    stocks: [],
    ...overrides,
  };
}

describe("investment contributions in surplus", () => {
  describe("computeTotals", () => {
    it("returns totalMonthlyContributions summing asset contributions", () => {
      const state = makeState({
        assets: [
          { id: "a1", category: "TFSA", amount: 10000, monthlyContribution: 500 },
          { id: "a2", category: "RRSP", amount: 20000, monthlyContribution: 300 },
          { id: "a3", category: "Savings", amount: 5000 },
        ],
      });
      const { totalMonthlyContributions } = computeTotals(state);
      expect(totalMonthlyContributions).toBe(800);
    });

    it("returns 0 contributions when no assets have contributions", () => {
      const state = makeState({
        assets: [{ id: "a1", category: "Savings", amount: 10000 }],
      });
      const { totalMonthlyContributions } = computeTotals(state);
      expect(totalMonthlyContributions).toBe(0);
    });

    it("does not include contributions in monthlyExpenses", () => {
      const state = makeState({
        assets: [{ id: "a1", category: "TFSA", amount: 10000, monthlyContribution: 500 }],
        expenses: [{ id: "e1", category: "Rent", amount: 2000 }],
      });
      const { monthlyExpenses } = computeTotals(state);
      expect(monthlyExpenses).toBe(2000);
    });
  });

  describe("computeMetrics", () => {
    it("subtracts contributions from surplus", () => {
      const state = makeState({
        assets: [{ id: "a1", category: "TFSA", amount: 10000, monthlyContribution: 500 }],
        income: [{ id: "i1", category: "Salary", amount: 5000 }],
        expenses: [{ id: "e1", category: "Rent", amount: 2000 }],
      });
      const metrics = computeMetrics(state);
      const surplus = metrics.find((m) => m.title === "Monthly Surplus");
      // surplus = 5000 - 2000 - 500 = 2500
      expect(surplus!.value).toBe(2500);
    });

    it("shows negative surplus when contributions exceed remaining income", () => {
      const state = makeState({
        assets: [{ id: "a1", category: "TFSA", amount: 10000, monthlyContribution: 2000 }],
        income: [{ id: "i1", category: "Salary", amount: 3000 }],
        expenses: [{ id: "e1", category: "Rent", amount: 2000 }],
      });
      const metrics = computeMetrics(state);
      const surplus = metrics.find((m) => m.title === "Monthly Surplus");
      // surplus = 3000 - 2000 - 2000 = -1000
      expect(surplus!.value).toBe(-1000);
      expect(surplus!.positive).toBe(false);
    });
  });

  describe("toFinancialData", () => {
    it("includes contributions in monthlyExpenses for insights", () => {
      const state = makeState({
        assets: [{ id: "a1", category: "TFSA", amount: 10000, monthlyContribution: 500 }],
        expenses: [{ id: "e1", category: "Rent", amount: 2000 }],
      });
      const data = toFinancialData(state);
      expect(data.monthlyExpenses).toBe(2500);
    });
  });

  describe("projection engine", () => {
    it("does not double-count contributions in surplus", () => {
      // Asset has $1000/mo contribution. Income=$5000, expenses=$2000.
      // Surplus should be 5000-2000-1000 = $2000 (not $3000).
      const state = makeState({
        assets: [{ id: "a1", category: "Savings", amount: 10000, monthlyContribution: 1000 }],
        income: [{ id: "i1", category: "Salary", amount: 5000 }],
        expenses: [{ id: "e1", category: "Rent", amount: 2000 }],
      });
      const result = projectFinances(state, 1);
      // After 1 month:
      // Asset grows by contribution ($1000) + surplus ($2000) = $13000
      // NOT contribution ($1000) + old-surplus ($3000) = $14000
      expect(result.points[1].totalAssets).toBe(13000);
    });

    it("handles contributions equal to surplus (zero remaining surplus)", () => {
      const state = makeState({
        assets: [{ id: "a1", category: "Savings", amount: 10000, monthlyContribution: 3000 }],
        income: [{ id: "i1", category: "Salary", amount: 5000 }],
        expenses: [{ id: "e1", category: "Rent", amount: 2000 }],
      });
      const result = projectFinances(state, 1);
      // surplus = 5000 - 2000 - 3000 = 0, contribution = 3000
      // After 1 month: 10000 + 3000 = 13000 (no surplus to add)
      expect(result.points[1].totalAssets).toBe(13000);
    });

    it("handles contributions exceeding surplus (negative remaining)", () => {
      const state = makeState({
        assets: [{ id: "a1", category: "Savings", amount: 10000, monthlyContribution: 4000 }],
        income: [{ id: "i1", category: "Salary", amount: 5000 }],
        expenses: [{ id: "e1", category: "Rent", amount: 2000 }],
      });
      const result = projectFinances(state, 1);
      // surplus = 5000 - 2000 - 4000 = -1000 (negative, not added to assets)
      // contribution = 4000
      // After 1 month: 10000 + 4000 = 14000
      expect(result.points[1].totalAssets).toBe(14000);
    });
  });
});
