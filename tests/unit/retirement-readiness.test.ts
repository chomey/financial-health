import { describe, it, expect } from "vitest";
import { computeRetirementReadiness, getTierLabel, type RetirementReadinessInput } from "@/lib/retirement-readiness";

const BASE_INPUT: RetirementReadinessInput = {
  incomeReplacementRatio: 50,
  runwayMonths: 12,
  monthlyGovernmentIncome: 0,
  monthlyExpenses: 3000,
  totalDebts: 10_000,
  totalAssets: 100_000,
  taxFreeTotal: 30_000,
  taxDeferredTotal: 40_000,
  taxableTotal: 30_000,
};

describe("Retirement readiness score", () => {
  describe("tier labels", () => {
    it("80+ = Retirement Ready", () => expect(getTierLabel(80)).toBe("Retirement Ready"));
    it("60-79 = Strong", () => expect(getTierLabel(65)).toBe("Strong"));
    it("40-59 = On Track", () => expect(getTierLabel(45)).toBe("On Track"));
    it("20-39 = Building", () => expect(getTierLabel(25)).toBe("Building"));
    it("0-19 = Getting Started", () => expect(getTierLabel(10)).toBe("Getting Started"));
    it("100 = Retirement Ready", () => expect(getTierLabel(100)).toBe("Retirement Ready"));
    it("0 = Getting Started", () => expect(getTierLabel(0)).toBe("Getting Started"));
  });

  describe("score computation", () => {
    it("produces a score between 0 and 100", () => {
      const result = computeRetirementReadiness(BASE_INPUT);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it("includes a tier label", () => {
      const result = computeRetirementReadiness(BASE_INPUT);
      expect(result.tier).toBeTruthy();
      expect(["Retirement Ready", "Strong", "On Track", "Building", "Getting Started"]).toContain(result.tier);
    });

    it("has all 5 component scores", () => {
      const result = computeRetirementReadiness(BASE_INPUT);
      expect(result.components.incomeReplacement).toBeDefined();
      expect(result.components.runway).toBeDefined();
      expect(result.components.governmentBenefits).toBeDefined();
      expect(result.components.debtPosition).toBeDefined();
      expect(result.components.taxDiversification).toBeDefined();
    });

    it("higher income replacement improves score", () => {
      const low = computeRetirementReadiness({ ...BASE_INPUT, incomeReplacementRatio: 10 });
      const high = computeRetirementReadiness({ ...BASE_INPUT, incomeReplacementRatio: 80 });
      expect(high.score).toBeGreaterThan(low.score);
    });

    it("longer runway improves score", () => {
      const short = computeRetirementReadiness({ ...BASE_INPUT, runwayMonths: 3 });
      const long = computeRetirementReadiness({ ...BASE_INPUT, runwayMonths: 24 });
      expect(long.score).toBeGreaterThan(short.score);
    });

    it("government benefits improve score", () => {
      const noGov = computeRetirementReadiness({ ...BASE_INPUT, monthlyGovernmentIncome: 0 });
      const withGov = computeRetirementReadiness({ ...BASE_INPUT, monthlyGovernmentIncome: 1500 });
      expect(withGov.score).toBeGreaterThan(noGov.score);
    });

    it("lower debt improves score", () => {
      const highDebt = computeRetirementReadiness({ ...BASE_INPUT, totalDebts: 80_000 });
      const lowDebt = computeRetirementReadiness({ ...BASE_INPUT, totalDebts: 5_000 });
      expect(lowDebt.score).toBeGreaterThan(highDebt.score);
    });

    it("tax diversification improves score", () => {
      const oneType = computeRetirementReadiness({ ...BASE_INPUT, taxFreeTotal: 100_000, taxDeferredTotal: 0, taxableTotal: 0 });
      const threeTypes = computeRetirementReadiness({ ...BASE_INPUT, taxFreeTotal: 33_000, taxDeferredTotal: 33_000, taxableTotal: 34_000 });
      expect(threeTypes.score).toBeGreaterThan(oneType.score);
    });

    it("perfect inputs give high score", () => {
      const perfect = computeRetirementReadiness({
        incomeReplacementRatio: 100,
        runwayMonths: 36,
        monthlyGovernmentIncome: 2000,
        monthlyExpenses: 3000,
        totalDebts: 0,
        totalAssets: 1_000_000,
        taxFreeTotal: 300_000,
        taxDeferredTotal: 400_000,
        taxableTotal: 300_000,
      });
      expect(perfect.score).toBeGreaterThanOrEqual(80);
      expect(perfect.tier).toBe("Retirement Ready");
    });

    it("worst case gives low score", () => {
      const worst = computeRetirementReadiness({
        incomeReplacementRatio: 0,
        runwayMonths: 0,
        monthlyGovernmentIncome: 0,
        monthlyExpenses: 5000,
        totalDebts: 100_000,
        totalAssets: 50_000,
        taxFreeTotal: 0,
        taxDeferredTotal: 0,
        taxableTotal: 0,
      });
      expect(worst.score).toBeLessThanOrEqual(20);
    });
  });
});
