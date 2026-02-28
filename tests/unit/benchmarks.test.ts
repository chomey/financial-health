import { describe, it, expect } from "vitest";
import {
  getBenchmarksForCountry,
  getBenchmarkForAge,
  computeBenchmarkComparisons,
  DATA_SOURCES,
} from "@/lib/benchmarks";
import { encodeState, decodeState } from "@/lib/url-state";
import { INITIAL_STATE } from "@/lib/financial-state";

describe("benchmarks", () => {
  describe("getBenchmarksForCountry", () => {
    it("returns 6 age groups for CA", () => {
      const benchmarks = getBenchmarksForCountry("CA");
      expect(benchmarks).toHaveLength(6);
    });

    it("returns 6 age groups for US", () => {
      const benchmarks = getBenchmarksForCountry("US");
      expect(benchmarks).toHaveLength(6);
    });

    it("has contiguous age ranges covering 18–120", () => {
      for (const country of ["CA", "US"] as const) {
        const benchmarks = getBenchmarksForCountry(country);
        expect(benchmarks[0].ageMin).toBe(18);
        expect(benchmarks[benchmarks.length - 1].ageMax).toBe(120);
        for (let i = 1; i < benchmarks.length; i++) {
          expect(benchmarks[i].ageMin).toBe(benchmarks[i - 1].ageMax + 1);
        }
      }
    });

    it("all benchmark values are positive", () => {
      for (const country of ["CA", "US"] as const) {
        const benchmarks = getBenchmarksForCountry(country);
        for (const b of benchmarks) {
          expect(b.medianNetWorth).toBeGreaterThan(0);
          expect(b.medianSavingsRate).toBeGreaterThan(0);
          expect(b.medianDebtToIncomeRatio).toBeGreaterThan(0);
          expect(b.recommendedEmergencyMonths).toBeGreaterThanOrEqual(3);
        }
      }
    });
  });

  describe("getBenchmarkForAge", () => {
    it("returns correct benchmark for age 30 CA", () => {
      const b = getBenchmarkForAge(30, "CA");
      expect(b).not.toBeNull();
      expect(b!.label).toBe("25–34");
    });

    it("returns correct benchmark for age 45 US", () => {
      const b = getBenchmarkForAge(45, "US");
      expect(b).not.toBeNull();
      expect(b!.label).toBe("45–54");
    });

    it("returns correct benchmark for age 18 (minimum)", () => {
      const b = getBenchmarkForAge(18, "CA");
      expect(b).not.toBeNull();
      expect(b!.label).toBe("18–24");
    });

    it("returns correct benchmark for age 80 (65+)", () => {
      const b = getBenchmarkForAge(80, "US");
      expect(b).not.toBeNull();
      expect(b!.label).toBe("65+");
    });

    it("returns null for age below 18", () => {
      const b = getBenchmarkForAge(17, "CA");
      expect(b).toBeNull();
    });
  });

  describe("computeBenchmarkComparisons", () => {
    it("returns 4 comparisons for valid age", () => {
      const comparisons = computeBenchmarkComparisons(30, "CA", 100000, 0.15, 6, 1.0);
      expect(comparisons).toHaveLength(4);
      expect(comparisons.map((c) => c.metric)).toEqual([
        "Net Worth",
        "Savings Rate",
        "Emergency Fund",
        "Debt-to-Income",
      ]);
    });

    it("returns empty for invalid age", () => {
      const comparisons = computeBenchmarkComparisons(10, "CA", 100000, 0.15, 6, 1.0);
      expect(comparisons).toHaveLength(0);
    });

    it("marks net worth above median correctly", () => {
      // CA 25-34 median net worth is $48,800
      const comparisons = computeBenchmarkComparisons(30, "CA", 100000, 0.15, 6, 1.0);
      const nw = comparisons.find((c) => c.metric === "Net Worth")!;
      expect(nw.aboveBenchmark).toBe(true);
      expect(nw.message).toContain("above the median");
    });

    it("marks net worth below median correctly", () => {
      const comparisons = computeBenchmarkComparisons(30, "CA", 10000, 0.15, 6, 1.0);
      const nw = comparisons.find((c) => c.metric === "Net Worth")!;
      expect(nw.aboveBenchmark).toBe(false);
      expect(nw.message).toContain("building toward it");
    });

    it("marks savings rate above median correctly", () => {
      // CA 25-34 median savings rate is 10%
      const comparisons = computeBenchmarkComparisons(30, "CA", 100000, 0.15, 6, 1.0);
      const sr = comparisons.find((c) => c.metric === "Savings Rate")!;
      expect(sr.aboveBenchmark).toBe(true);
      expect(sr.message).toContain("above the median");
    });

    it("marks emergency fund above recommended correctly", () => {
      // CA 25-34 recommended emergency months is 3
      const comparisons = computeBenchmarkComparisons(30, "CA", 100000, 0.15, 6, 1.0);
      const ef = comparisons.find((c) => c.metric === "Emergency Fund")!;
      expect(ef.aboveBenchmark).toBe(true);
      expect(ef.message).toContain("more than the recommended");
    });

    it("debt-to-income below median is above benchmark (lower is better)", () => {
      // CA 25-34 median DTI is 1.5
      const comparisons = computeBenchmarkComparisons(30, "CA", 100000, 0.15, 6, 0.5);
      const di = comparisons.find((c) => c.metric === "Debt-to-Income")!;
      expect(di.aboveBenchmark).toBe(true);
      expect(di.message).toContain("better than the median");
    });

    it("debt-to-income above median shows encouraging message", () => {
      const comparisons = computeBenchmarkComparisons(30, "CA", 100000, 0.15, 6, 3.0);
      const di = comparisons.find((c) => c.metric === "Debt-to-Income")!;
      expect(di.aboveBenchmark).toBe(false);
      expect(di.message).toContain("typical for your age group");
    });

    it("uses correct US benchmarks", () => {
      // US 35-44 median net worth is $135,600
      const comparisons = computeBenchmarkComparisons(40, "US", 200000, 0.15, 6, 1.0);
      const nw = comparisons.find((c) => c.metric === "Net Worth")!;
      expect(nw.benchmarkValue).toBe(135600);
      expect(nw.aboveBenchmark).toBe(true);
    });
  });

  describe("DATA_SOURCES", () => {
    it("has sources for both countries", () => {
      expect(DATA_SOURCES.CA).toContain("Statistics Canada");
      expect(DATA_SOURCES.US).toContain("Federal Reserve");
    });
  });

  describe("URL state encoding with age", () => {
    it("round-trips age through URL encoding", () => {
      const state = { ...INITIAL_STATE, age: 35 };
      const encoded = encodeState(state);
      const decoded = decodeState(encoded);
      expect(decoded).not.toBeNull();
      expect(decoded!.age).toBe(35);
    });

    it("omits age when undefined", () => {
      const state = { ...INITIAL_STATE, age: undefined };
      const encoded = encodeState(state);
      const decoded = decodeState(encoded);
      expect(decoded).not.toBeNull();
      expect(decoded!.age).toBeUndefined();
    });

    it("backward compat: missing age decodes as undefined", () => {
      // Encode without age, then decode
      const state = { ...INITIAL_STATE };
      delete (state as Record<string, unknown>).age;
      const encoded = encodeState(state);
      const decoded = decodeState(encoded);
      expect(decoded).not.toBeNull();
      expect(decoded!.age).toBeUndefined();
    });
  });
});
