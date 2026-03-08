import { describe, it, expect } from "vitest";
import {
  getBenchmarksForCountry,
  getBenchmarkForAge,
  getNationalAverage,
  computeBenchmarkComparisons,
  DATA_SOURCES,
} from "@/lib/benchmarks";

describe("AU benchmarks", () => {
  describe("getBenchmarksForCountry('AU')", () => {
    it("returns 6 age groups", () => {
      expect(getBenchmarksForCountry("AU")).toHaveLength(6);
    });

    it("has contiguous age ranges covering 18–120", () => {
      const benchmarks = getBenchmarksForCountry("AU");
      expect(benchmarks[0].ageMin).toBe(18);
      expect(benchmarks[benchmarks.length - 1].ageMax).toBe(120);
      for (let i = 1; i < benchmarks.length; i++) {
        expect(benchmarks[i].ageMin).toBe(benchmarks[i - 1].ageMax + 1);
      }
    });

    it("all benchmark values are positive", () => {
      const benchmarks = getBenchmarksForCountry("AU");
      for (const b of benchmarks) {
        expect(b.medianNetWorth).toBeGreaterThan(0);
        expect(b.medianSavingsRate).toBeGreaterThan(0);
        expect(b.medianDebtToIncomeRatio).toBeGreaterThan(0);
        expect(b.recommendedEmergencyMonths).toBeGreaterThanOrEqual(3);
        expect(b.medianIncome).toBeGreaterThan(0);
      }
    });

    it("age group labels are correct", () => {
      const labels = getBenchmarksForCountry("AU").map((b) => b.label);
      expect(labels).toEqual(["18–24", "25–34", "35–44", "45–54", "55–64", "65+"]);
    });

    it("net worth increases with age up to 65+", () => {
      const benchmarks = getBenchmarksForCountry("AU");
      for (let i = 1; i < benchmarks.length - 1; i++) {
        expect(benchmarks[i].medianNetWorth).toBeGreaterThan(benchmarks[i - 1].medianNetWorth);
      }
    });

    it("net worth values are AUD-scale (significantly higher than US due to property)", () => {
      const au = getBenchmarksForCountry("AU");
      const us = getBenchmarksForCountry("US");
      // AU median net worth for 35-44 should be much higher than US due to property prices
      const au3544 = au.find((b) => b.label === "35–44")!;
      const us3544 = us.find((b) => b.label === "35–44")!;
      expect(au3544.medianNetWorth).toBeGreaterThan(us3544.medianNetWorth);
    });

    it("debt-to-income ratio reflects AU mortgage burden (high for mid-career)", () => {
      const au = getBenchmarksForCountry("AU");
      const mid = au.find((b) => b.label === "35–44")!;
      // AU DTI should be > 2.0 for mortgage-heavy age group
      expect(mid.medianDebtToIncomeRatio).toBeGreaterThanOrEqual(2.0);
    });

    it("emergency months increase with age", () => {
      const benchmarks = getBenchmarksForCountry("AU");
      expect(benchmarks[0].recommendedEmergencyMonths).toBeLessThanOrEqual(
        benchmarks[benchmarks.length - 1].recommendedEmergencyMonths
      );
    });
  });

  describe("getBenchmarkForAge('AU')", () => {
    it("returns 18–24 bracket for age 20", () => {
      const b = getBenchmarkForAge(20, "AU");
      expect(b).not.toBeNull();
      expect(b!.label).toBe("18–24");
      expect(b!.medianNetWorth).toBe(43_000);
    });

    it("returns 25–34 bracket for age 28", () => {
      const b = getBenchmarkForAge(28, "AU");
      expect(b!.label).toBe("25–34");
      expect(b!.medianIncome).toBe(68_000);
    });

    it("returns 35–44 bracket for age 40", () => {
      const b = getBenchmarkForAge(40, "AU");
      expect(b!.label).toBe("35–44");
      expect(b!.medianNetWorth).toBe(470_000);
    });

    it("returns 45–54 bracket for age 50", () => {
      const b = getBenchmarkForAge(50, "AU");
      expect(b!.label).toBe("45–54");
      expect(b!.medianNetWorth).toBe(860_000);
    });

    it("returns 55–64 bracket for age 60", () => {
      const b = getBenchmarkForAge(60, "AU");
      expect(b!.label).toBe("55–64");
      expect(b!.medianNetWorth).toBe(1_150_000);
    });

    it("returns 65+ bracket for age 70", () => {
      const b = getBenchmarkForAge(70, "AU");
      expect(b!.label).toBe("65+");
      expect(b!.medianNetWorth).toBe(1_100_000);
    });

    it("returns null for age below 18", () => {
      expect(getBenchmarkForAge(17, "AU")).toBeNull();
    });
  });

  describe("getNationalAverage('AU')", () => {
    it("returns AU national average with positive values", () => {
      const avg = getNationalAverage("AU");
      expect(avg.netWorth).toBeGreaterThan(0);
      expect(avg.savingsRate).toBeGreaterThan(0);
      expect(avg.debtToIncomeRatio).toBeGreaterThan(0);
      expect(avg.emergencyMonths).toBeGreaterThan(0);
      expect(avg.income).toBeGreaterThan(0);
    });

    it("AU national average net worth is ~672,800 AUD", () => {
      const avg = getNationalAverage("AU");
      expect(avg.netWorth).toBe(672_800);
    });

    it("AU national average income is 65,000 AUD", () => {
      const avg = getNationalAverage("AU");
      expect(avg.income).toBe(65_000);
    });

    it("AU national average DTI reflects mortgage burden", () => {
      const avg = getNationalAverage("AU");
      expect(avg.debtToIncomeRatio).toBeGreaterThanOrEqual(1.5);
    });
  });

  describe("computeBenchmarkComparisons for AU", () => {
    it("returns 5 comparisons for age 35 AU user", () => {
      const comparisons = computeBenchmarkComparisons(35, "AU", 500_000, 0.15, 6, 1.5, 80_000);
      expect(comparisons).toHaveLength(5);
    });

    it("net worth comparison uses correct AU benchmark", () => {
      const comparisons = computeBenchmarkComparisons(40, "AU", 500_000, 0.12, 4, 2.0, 80_000);
      const nw = comparisons.find((c) => c.metric === "Net Worth")!;
      expect(nw.benchmarkValue).toBe(470_000);
      expect(nw.ageGroupLabel).toBe("35–44");
    });

    it("user above AU median net worth shows positive message", () => {
      const comparisons = computeBenchmarkComparisons(40, "AU", 800_000, 0.12, 4, 2.0, 80_000);
      const nw = comparisons.find((c) => c.metric === "Net Worth")!;
      expect(nw.aboveBenchmark).toBe(true);
      expect(nw.percentile).toBeGreaterThan(50);
    });

    it("user below AU median net worth shows encouraging message", () => {
      const comparisons = computeBenchmarkComparisons(40, "AU", 100_000, 0.08, 2, 3.0, 60_000);
      const nw = comparisons.find((c) => c.metric === "Net Worth")!;
      expect(nw.aboveBenchmark).toBe(false);
      expect(nw.message).toContain("building toward");
    });

    it("income comparison includes AUD values", () => {
      const comparisons = computeBenchmarkComparisons(30, "AU", 200_000, 0.10, 3, 1.5, 80_000);
      const inc = comparisons.find((c) => c.metric === "Income")!;
      expect(inc).toBeDefined();
      expect(inc.benchmarkValue).toBe(68_000);
      expect(inc.aboveBenchmark).toBe(true);
    });

    it("omits income comparison when annualIncome is undefined", () => {
      const comparisons = computeBenchmarkComparisons(30, "AU", 200_000, 0.10, 3, 1.5);
      expect(comparisons.find((c) => c.metric === "Income")).toBeUndefined();
      expect(comparisons).toHaveLength(4);
    });

    it("national average for AU is correct", () => {
      const comparisons = computeBenchmarkComparisons(40, "AU", 500_000, 0.12, 4, 1.8, 80_000);
      const nw = comparisons.find((c) => c.metric === "Net Worth")!;
      expect(nw.nationalAverage).toBe(672_800);
    });
  });

  describe("DATA_SOURCES", () => {
    it("AU data source references ABS", () => {
      expect(DATA_SOURCES.AU).toContain("Australian Bureau of Statistics");
    });

    it("AU data source references 2021-22", () => {
      expect(DATA_SOURCES.AU).toContain("2021-22");
    });
  });

  describe("CA and US regression", () => {
    it("CA benchmarks unaffected", () => {
      const ca = getBenchmarksForCountry("CA");
      expect(ca).toHaveLength(6);
      expect(ca[0].medianNetWorth).toBe(5_000);
    });

    it("US benchmarks unaffected", () => {
      const us = getBenchmarksForCountry("US");
      expect(us).toHaveLength(6);
      expect(us[0].medianNetWorth).toBe(8_000);
    });

    it("CA national average unaffected", () => {
      expect(getNationalAverage("CA").netWorth).toBe(330_000);
    });

    it("US national average unaffected", () => {
      expect(getNationalAverage("US").netWorth).toBe(290_000);
    });
  });
});
