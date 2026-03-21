import { describe, it, expect } from "vitest";
import {
  getUsRmdPercent,
  getCaRrifPercent,
  computeRequiredMinimumDistribution,
  getRmdSummaries,
  US_RMD_START_AGE,
  CA_RRIF_CONVERSION_AGE,
} from "@/lib/required-minimum-distributions";
import { toFinancialData } from "@/lib/financial-state";
import { INITIAL_STATE } from "@/lib/financial-types";

describe("Required Minimum Distributions", () => {
  describe("US RMD", () => {
    it("start age is 73", () => {
      expect(US_RMD_START_AGE).toBe(73);
    });

    it("returns 0 below age 73", () => {
      expect(getUsRmdPercent(72)).toBe(0);
      expect(getUsRmdPercent(50)).toBe(0);
    });

    it("returns ~3.77% at age 73 (divisor 26.5)", () => {
      expect(getUsRmdPercent(73)).toBeCloseTo(100 / 26.5, 1);
    });

    it("percentage increases with age", () => {
      const pct73 = getUsRmdPercent(73);
      const pct80 = getUsRmdPercent(80);
      const pct90 = getUsRmdPercent(90);
      expect(pct80).toBeGreaterThan(pct73);
      expect(pct90).toBeGreaterThan(pct80);
    });

    it("handles age 95+", () => {
      const pct95 = getUsRmdPercent(95);
      expect(pct95).toBeGreaterThan(10);
    });
  });

  describe("CA RRIF", () => {
    it("conversion age is 71", () => {
      expect(CA_RRIF_CONVERSION_AGE).toBe(71);
    });

    it("returns 0 below age 71", () => {
      expect(getCaRrifPercent(70)).toBe(0);
      expect(getCaRrifPercent(50)).toBe(0);
    });

    it("returns ~5.26% at age 71", () => {
      expect(getCaRrifPercent(71)).toBeCloseTo(100 / 19, 1);
    });

    it("returns 5.40% at age 72", () => {
      expect(getCaRrifPercent(72)).toBe(5.40);
    });

    it("percentage increases with age", () => {
      const pct72 = getCaRrifPercent(72);
      const pct80 = getCaRrifPercent(80);
      const pct90 = getCaRrifPercent(90);
      expect(pct80).toBeGreaterThan(pct72);
      expect(pct90).toBeGreaterThan(pct80);
    });

    it("caps at 20% for age 95+", () => {
      expect(getCaRrifPercent(95)).toBe(20);
      expect(getCaRrifPercent(100)).toBe(20);
    });
  });

  describe("computeRequiredMinimumDistribution", () => {
    it("US 401k at 75 with $500k balance", () => {
      const rmd = computeRequiredMinimumDistribution(500_000, 75, "US", "401k");
      // divisor at 75 = 24.6, so 500000/24.6 ≈ $20,325
      expect(rmd).toBeCloseTo(500_000 / 24.6, -1);
      expect(rmd).toBeGreaterThan(20_000);
    });

    it("US Traditional IRA at 73", () => {
      const rmd = computeRequiredMinimumDistribution(300_000, 73, "US", "Traditional IRA");
      expect(rmd).toBeGreaterThan(0);
    });

    it("US Roth IRA has no RMD", () => {
      expect(computeRequiredMinimumDistribution(100_000, 80, "US", "Roth IRA")).toBe(0);
    });

    it("US Roth 401k has no RMD", () => {
      expect(computeRequiredMinimumDistribution(100_000, 80, "US", "Roth 401k")).toBe(0);
    });

    it("CA RRSP at 75 with $400k balance", () => {
      const rmd = computeRequiredMinimumDistribution(400_000, 75, "CA", "RRSP");
      // 5.82% at 75
      expect(rmd).toBeCloseTo(400_000 * 0.0582, -1);
    });

    it("CA TFSA has no RRIF minimum", () => {
      expect(computeRequiredMinimumDistribution(100_000, 75, "CA", "TFSA")).toBe(0);
    });

    it("AU has no RMD equivalent", () => {
      expect(computeRequiredMinimumDistribution(100_000, 75, "AU", "Super (Accumulation)")).toBe(0);
    });

    it("returns 0 for zero balance", () => {
      expect(computeRequiredMinimumDistribution(0, 75, "US", "401k")).toBe(0);
    });
  });

  describe("getRmdSummaries", () => {
    it("returns summaries for applicable accounts", () => {
      const accounts = [
        { category: "401k", amount: 500_000 },
        { category: "Roth IRA", amount: 100_000 },
        { category: "Savings", amount: 50_000 },
      ];
      const summaries = getRmdSummaries(accounts, 75, "US");
      expect(summaries).toHaveLength(1);
      expect(summaries[0].category).toBe("401k");
      expect(summaries[0].ruleName).toBe("RMD");
      expect(summaries[0].annualMinimum).toBeGreaterThan(0);
    });

    it("CA summaries for RRSP", () => {
      const accounts = [
        { category: "RRSP", amount: 300_000 },
        { category: "TFSA", amount: 100_000 },
      ];
      const summaries = getRmdSummaries(accounts, 75, "CA");
      expect(summaries).toHaveLength(1);
      expect(summaries[0].category).toBe("RRSP");
      expect(summaries[0].ruleName).toBe("RRIF minimum");
    });

    it("returns empty for young user", () => {
      const summaries = getRmdSummaries([{ category: "401k", amount: 500_000 }], 50, "US");
      expect(summaries).toHaveLength(0);
    });
  });

  describe("toFinancialData integration", () => {
    it("includes RMD summaries for old CA user with RRSP", () => {
      const state = { ...INITIAL_STATE, age: 75, country: "CA" as const };
      const data = toFinancialData(state);
      expect(data.rmdSummaries).toBeDefined();
      expect(data.rmdSummaries!.length).toBeGreaterThan(0);
      expect(data.rmdSummaries![0].category).toBe("RRSP");
    });

    it("no RMD summaries for young user", () => {
      const state = { ...INITIAL_STATE, age: 40 };
      const data = toFinancialData(state);
      expect(data.rmdSummaries).toBeUndefined();
    });

    it("no RMD summaries when age not set", () => {
      const data = toFinancialData(INITIAL_STATE);
      expect(data.rmdSummaries).toBeUndefined();
    });
  });
});
