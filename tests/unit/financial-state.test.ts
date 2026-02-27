import { describe, it, expect } from "vitest";
import {
  INITIAL_STATE,
  computeTotals,
  computeMetrics,
  toFinancialData,
} from "@/lib/financial-state";
import type { FinancialState } from "@/lib/financial-state";

describe("financial-state", () => {
  describe("INITIAL_STATE", () => {
    it("contains mock data for all sections", () => {
      expect(INITIAL_STATE.assets.length).toBeGreaterThan(0);
      expect(INITIAL_STATE.debts.length).toBeGreaterThan(0);
      expect(INITIAL_STATE.income.length).toBeGreaterThan(0);
      expect(INITIAL_STATE.expenses.length).toBeGreaterThan(0);
      expect(INITIAL_STATE.goals.length).toBeGreaterThan(0);
    });
  });

  describe("computeTotals", () => {
    it("sums assets correctly from initial state", () => {
      const { totalAssets } = computeTotals(INITIAL_STATE);
      expect(totalAssets).toBe(12000 + 35000 + 18500);
    });

    it("sums debts correctly from initial state", () => {
      const { totalDebts } = computeTotals(INITIAL_STATE);
      expect(totalDebts).toBe(280000 + 15000);
    });

    it("sums income correctly from initial state", () => {
      const { monthlyIncome } = computeTotals(INITIAL_STATE);
      expect(monthlyIncome).toBe(5500 + 800);
    });

    it("sums expenses correctly from initial state", () => {
      const { monthlyExpenses } = computeTotals(INITIAL_STATE);
      expect(monthlyExpenses).toBe(2200 + 600 + 150);
    });

    it("handles empty arrays", () => {
      const empty: FinancialState = {
        assets: [],
        debts: [],
        income: [],
        expenses: [],
        goals: [],
      };
      const totals = computeTotals(empty);
      expect(totals.totalAssets).toBe(0);
      expect(totals.totalDebts).toBe(0);
      expect(totals.monthlyIncome).toBe(0);
      expect(totals.monthlyExpenses).toBe(0);
    });
  });

  describe("computeMetrics", () => {
    it("returns four metrics", () => {
      const metrics = computeMetrics(INITIAL_STATE);
      expect(metrics).toHaveLength(4);
    });

    it("computes net worth as assets minus debts", () => {
      const metrics = computeMetrics(INITIAL_STATE);
      const netWorth = metrics.find((m) => m.title === "Net Worth");
      expect(netWorth).toBeDefined();
      expect(netWorth!.value).toBe(65500 - 295000);
      expect(netWorth!.format).toBe("currency");
    });

    it("computes monthly surplus as income minus expenses", () => {
      const metrics = computeMetrics(INITIAL_STATE);
      const surplus = metrics.find((m) => m.title === "Monthly Surplus");
      expect(surplus).toBeDefined();
      expect(surplus!.value).toBe(6300 - 2950);
      expect(surplus!.positive).toBe(true);
    });

    it("computes financial runway as assets / expenses", () => {
      const metrics = computeMetrics(INITIAL_STATE);
      const runway = metrics.find((m) => m.title === "Financial Runway");
      expect(runway).toBeDefined();
      expect(runway!.value).toBeCloseTo(65500 / 2950, 1);
      expect(runway!.format).toBe("months");
    });

    it("computes debt-to-asset ratio", () => {
      const metrics = computeMetrics(INITIAL_STATE);
      const ratio = metrics.find((m) => m.title === "Debt-to-Asset Ratio");
      expect(ratio).toBeDefined();
      expect(ratio!.value).toBeCloseTo(295000 / 65500, 2);
      expect(ratio!.format).toBe("ratio");
    });

    it("marks net worth as positive when assets exceed debts", () => {
      const state: FinancialState = {
        ...INITIAL_STATE,
        assets: [{ id: "1", category: "Savings", amount: 500000 }],
        debts: [{ id: "d1", category: "Loan", amount: 10000 }],
      };
      const metrics = computeMetrics(state);
      const netWorth = metrics.find((m) => m.title === "Net Worth");
      expect(netWorth!.positive).toBe(true);
    });

    it("marks surplus as negative when expenses exceed income", () => {
      const state: FinancialState = {
        ...INITIAL_STATE,
        income: [{ id: "i1", category: "Salary", amount: 1000 }],
        expenses: [{ id: "e1", category: "Rent", amount: 2000 }],
      };
      const metrics = computeMetrics(state);
      const surplus = metrics.find((m) => m.title === "Monthly Surplus");
      expect(surplus!.positive).toBe(false);
      expect(surplus!.value).toBe(-1000);
    });

    it("handles zero expenses for runway calculation", () => {
      const state: FinancialState = {
        ...INITIAL_STATE,
        expenses: [],
      };
      const metrics = computeMetrics(state);
      const runway = metrics.find((m) => m.title === "Financial Runway");
      expect(runway!.value).toBe(0);
    });

    it("recalculates when items change", () => {
      const stateA = { ...INITIAL_STATE };
      const stateB = {
        ...INITIAL_STATE,
        assets: [
          ...INITIAL_STATE.assets,
          { id: "4", category: "New Savings", amount: 50000 },
        ],
      };
      const metricsA = computeMetrics(stateA);
      const metricsB = computeMetrics(stateB);
      const netWorthA = metricsA.find((m) => m.title === "Net Worth")!.value;
      const netWorthB = metricsB.find((m) => m.title === "Net Worth")!.value;
      expect(netWorthB - netWorthA).toBe(50000);
    });
  });

  describe("toFinancialData", () => {
    it("converts state to FinancialData for insights", () => {
      const data = toFinancialData(INITIAL_STATE);
      expect(data.totalAssets).toBe(65500);
      expect(data.totalDebts).toBe(295000);
      expect(data.monthlyIncome).toBe(6300);
      expect(data.monthlyExpenses).toBe(2950);
    });

    it("maps goals correctly", () => {
      const data = toFinancialData(INITIAL_STATE);
      expect(data.goals).toHaveLength(3);
      expect(data.goals[0]).toEqual({
        name: "Rainy Day Fund",
        target: 20000,
        current: 14500,
      });
    });
  });
});
