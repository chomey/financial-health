import { describe, it, expect } from "vitest";
import { computeMonthlyGovernmentIncome, fortnightlyToMonthly, AU_PENSION_SINGLE_FORTNIGHTLY } from "@/lib/government-retirement";

describe("Retirement income chart data", () => {
  describe("coverage calculation", () => {
    it("full coverage when income >= expenses", () => {
      const govIncome = 1500;
      const portfolioWithdrawal = 3000;
      const expenses = 4000;
      const total = govIncome + portfolioWithdrawal;
      const coverage = Math.min(100, Math.round((total / expenses) * 100));
      expect(coverage).toBe(100);
    });

    it("partial coverage when income < expenses", () => {
      const govIncome = 1000;
      const portfolioWithdrawal = 2000;
      const expenses = 5000;
      const total = govIncome + portfolioWithdrawal;
      const coverage = Math.min(100, Math.round((total / expenses) * 100));
      expect(coverage).toBe(60);
    });

    it("gap is expenses minus income", () => {
      const total = 3000;
      const expenses = 5000;
      const gap = Math.max(0, expenses - total);
      expect(gap).toBe(2000);
    });

    it("no gap when income exceeds expenses", () => {
      const total = 6000;
      const expenses = 5000;
      const gap = Math.max(0, expenses - total);
      expect(gap).toBe(0);
    });
  });

  describe("portfolio withdrawal (4% rule)", () => {
    it("computes monthly withdrawal correctly", () => {
      const liquidAssets = 500_000;
      const monthlyWithdrawal = liquidAssets * 0.04 / 12;
      expect(monthlyWithdrawal).toBeCloseTo(1666.67, 0);
    });

    it("$1M portfolio gives ~$3,333/mo", () => {
      const monthlyWithdrawal = 1_000_000 * 0.04 / 12;
      expect(monthlyWithdrawal).toBeCloseTo(3333.33, 0);
    });
  });

  describe("government income by country", () => {
    it("CA: CPP + OAS combined", () => {
      const income = computeMonthlyGovernmentIncome("CA", { cppMonthly: 817, oasMonthly: 728 });
      expect(income).toBe(1545);
    });

    it("US: Social Security only", () => {
      const income = computeMonthlyGovernmentIncome("US", { ssMonthly: 1976 });
      expect(income).toBe(1976);
    });

    it("AU: Age Pension fortnightly to monthly", () => {
      const income = computeMonthlyGovernmentIncome("AU", { agePensionFortnightly: AU_PENSION_SINGLE_FORTNIGHTLY });
      expect(income).toBeCloseTo(fortnightlyToMonthly(AU_PENSION_SINGLE_FORTNIGHTLY), 1);
    });
  });
});
