import { describe, it, expect } from "vitest";
import { computeFireNumber, computeMonthlyObligations, computeSurplus } from "@/lib/compute-totals";

describe("computeFireNumber", () => {
  it("returns annual expenses / 4% SWR", () => {
    // $3,000/mo expenses → $36,000/yr → $900,000 FIRE number
    expect(computeFireNumber(3000)).toBe(900000);
  });

  it("returns undefined for zero expenses", () => {
    expect(computeFireNumber(0)).toBeUndefined();
  });

  it("returns undefined for negative expenses", () => {
    expect(computeFireNumber(-100)).toBeUndefined();
  });

  it("matches the 25x annual expenses rule", () => {
    const monthly = 5000;
    const annual = monthly * 12;
    // FIRE number = annual / 0.04 = annual * 25
    expect(computeFireNumber(monthly)).toBe(annual * 25);
  });
});

describe("computeMonthlyObligations", () => {
  it("sums expenses, mortgage, and debt payments", () => {
    expect(computeMonthlyObligations(2000, 1500, 500)).toBe(4000);
  });

  it("returns zero when all inputs are zero", () => {
    expect(computeMonthlyObligations(0, 0, 0)).toBe(0);
  });

  it("handles zero mortgage and debt payments", () => {
    expect(computeMonthlyObligations(3000, 0, 0)).toBe(3000);
  });

  it("handles only mortgage payments", () => {
    expect(computeMonthlyObligations(0, 2000, 0)).toBe(2000);
  });
});

describe("computeSurplus", () => {
  it("computes positive surplus when income exceeds outflows", () => {
    // income: 8000, inv returns: 200, expenses: 3000, contributions: 500, mortgage: 1500, debt: 300
    // surplus = 8000 + 200 - 3000 - 500 - 1500 - 300 = 2900
    expect(computeSurplus(8000, 200, 3000, 500, 1500, 300)).toBe(2900);
  });

  it("computes negative surplus when outflows exceed income", () => {
    // income: 3000, inv: 0, expenses: 2000, contributions: 500, mortgage: 1500, debt: 500
    // surplus = 3000 + 0 - 2000 - 500 - 1500 - 500 = -1500
    expect(computeSurplus(3000, 0, 2000, 500, 1500, 500)).toBe(-1500);
  });

  it("returns zero when income exactly equals outflows", () => {
    expect(computeSurplus(5000, 0, 3000, 1000, 800, 200)).toBe(0);
  });

  it("includes investment returns in surplus", () => {
    const withoutReturns = computeSurplus(5000, 0, 3000, 500, 0, 0);
    const withReturns = computeSurplus(5000, 300, 3000, 500, 0, 0);
    expect(withReturns - withoutReturns).toBe(300);
  });

  it("matches the formula: income + returns - expenses - contributions - mortgage - debt", () => {
    const income = 7500;
    const returns = 150;
    const expenses = 2500;
    const contributions = 1000;
    const mortgage = 2000;
    const debt = 400;
    const expected = income + returns - expenses - contributions - mortgage - debt;
    expect(computeSurplus(income, returns, expenses, contributions, mortgage, debt)).toBe(expected);
  });
});

describe("consolidated functions match previous inline behavior", () => {
  it("computeFireNumber matches (monthlyExpenses * 12) / 0.04", () => {
    const monthlyExpenses = 4500;
    const legacyResult = (monthlyExpenses * 12) / 0.04;
    expect(computeFireNumber(monthlyExpenses)).toBe(legacyResult);
  });

  it("computeMonthlyObligations matches monthlyExpenses + totalMortgagePayments + totalDebtPayments", () => {
    const e = 3000, m = 1800, d = 400;
    const legacyResult = e + m + d;
    expect(computeMonthlyObligations(e, m, d)).toBe(legacyResult);
  });

  it("computeSurplus matches monthlyAfterTaxIncome + investmentReturns - expenses - contributions - mortgage - debt", () => {
    const income = 6000, returns = 100, expenses = 2500, contributions = 800, mortgage = 1500, debt = 300;
    const legacyResult = income + returns - expenses - contributions - mortgage - debt;
    expect(computeSurplus(income, returns, expenses, contributions, mortgage, debt)).toBe(legacyResult);
  });
});
