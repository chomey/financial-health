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
    it("subtracts contributions from after-tax surplus", () => {
      const state = makeState({
        assets: [{ id: "a1", category: "TFSA", amount: 10000, monthlyContribution: 500 }],
        income: [{ id: "i1", category: "Salary", amount: 5000 }],
        expenses: [{ id: "e1", category: "Rent", amount: 2000 }],
      });
      const metrics = computeMetrics(state);
      const totals = computeTotals(state);
      const surplus = metrics.find((m) => m.title === "Monthly Surplus");
      // surplus = afterTaxIncome - 2000 - 500 (less than pre-tax 2500)
      expect(surplus!.value).toBeCloseTo(totals.monthlyAfterTaxIncome - 2000 - 500, 2);
      expect(surplus!.value).toBeLessThan(2500); // less than pre-tax
    });

    it("shows negative surplus when contributions exceed remaining after-tax income", () => {
      const state = makeState({
        assets: [{ id: "a1", category: "TFSA", amount: 10000, monthlyContribution: 2000 }],
        income: [{ id: "i1", category: "Salary", amount: 3000 }],
        expenses: [{ id: "e1", category: "Rent", amount: 2000 }],
      });
      const metrics = computeMetrics(state);
      const surplus = metrics.find((m) => m.title === "Monthly Surplus");
      // After-tax income is less than $3000, so surplus is even more negative than -1000
      expect(surplus!.value).toBeLessThan(-1000);
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
      // After-tax surplus = afterTax(5000) - 2000 - 1000 (less than pre-tax $2000)
      const state = makeState({
        assets: [{ id: "a1", category: "Savings", amount: 10000, roi: 0, monthlyContribution: 1000 }],
        income: [{ id: "i1", category: "Salary", amount: 5000 }],
        expenses: [{ id: "e1", category: "Rent", amount: 2000 }],
      });
      const totals = computeTotals(state);
      const afterTaxSurplus = totals.monthlyAfterTaxIncome - 2000 - 1000;
      const result = projectFinances(state, 1);
      // After 1 month: asset grows by contribution + after-tax surplus
      const expectedBalance = 10000 + 1000 + Math.max(0, afterTaxSurplus);
      expect(result.points[1].totalAssets).toBeCloseTo(expectedBalance, 0);
      // Must be less than pre-tax calculation (10000 + 1000 + 2000 = 13000)
      expect(result.points[1].totalAssets).toBeLessThan(13000);
    });

    it("handles contributions equal to after-tax surplus (zero remaining surplus)", () => {
      // Use a very simple case: income only covers expenses + contributions after tax
      const state = makeState({
        assets: [{ id: "a1", category: "Savings", amount: 10000, roi: 0, monthlyContribution: 3000 }],
        income: [{ id: "i1", category: "Salary", amount: 5000 }],
        expenses: [{ id: "e1", category: "Rent", amount: 2000 }],
      });
      const result = projectFinances(state, 1);
      // After-tax income < $5000, so surplus < 0 with $3000 contributions + $2000 expenses
      // Asset still gets contribution of $3000: 10000 + 3000 = 13000
      expect(result.points[1].totalAssets).toBe(13000);
    });

    it("handles contributions exceeding surplus (negative remaining)", () => {
      const state = makeState({
        assets: [{ id: "a1", category: "Savings", amount: 10000, roi: 0, monthlyContribution: 4000 }],
        income: [{ id: "i1", category: "Salary", amount: 5000 }],
        expenses: [{ id: "e1", category: "Rent", amount: 2000 }],
      });
      const result = projectFinances(state, 1);
      // surplus is deeply negative (after-tax(5000) - 2000 - 4000 < 0)
      // contribution = 4000
      // After 1 month: 10000 + 4000 = 14000
      expect(result.points[1].totalAssets).toBe(14000);
    });

    it("contributions compound with ROI over multiple years", () => {
      // $500/mo contribution at 12% annual ROI (1% monthly) on $10,000 starting balance
      const state = makeState({
        assets: [{ id: "a1", category: "Savings", amount: 10000, roi: 12, monthlyContribution: 500 }],
        income: [{ id: "i1", category: "Salary", amount: 5000 }],
        expenses: [{ id: "e1", category: "Rent", amount: 4500 }],
      });
      const result = projectFinances(state, 3);

      // Contributions still compound with ROI regardless of tax
      // After year 1: FV of $10k at 1%/mo + $500/mo annuity contribution
      const year1 = result.points[12].totalAssets;
      // After-tax surplus is small or negative, but contributions of $500 still happen
      // Base case: 10000*(1.01)^12 ≈ 11268 + annuity FV ≈ 6341 = ~17609
      // With after-tax surplus being small/negative, less surplus is added
      expect(year1).toBeGreaterThan(17000);

      // Compounding should still accelerate gains
      const year2 = result.points[24].totalAssets;
      const gainYear1 = year1 - 10000;
      const gainYear2 = year2 - year1;
      expect(gainYear2).toBeGreaterThan(gainYear1);

      const year3 = result.points[36].totalAssets;
      const gainYear3 = year3 - year2;
      expect(gainYear3).toBeGreaterThan(gainYear2);

      // Sanity: contributions + ROI should be well above raw contributions
      expect(year3).toBeGreaterThan(28000);
    });
  });
});
