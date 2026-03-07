import { describe, it, expect } from "vitest";
import {
  getBenchmarkForAge,
  getBenchmarksForCountry,
  estimatePercentile,
  computeBenchmarkComparisons,
  type BenchmarkComparison,
} from "@/lib/benchmarks";

describe("getBenchmarkForAge", () => {
  it("returns correct age group for Canada", () => {
    expect(getBenchmarkForAge(25, "CA")?.label).toBe("25–34");
    expect(getBenchmarkForAge(34, "CA")?.label).toBe("25–34");
    expect(getBenchmarkForAge(35, "CA")?.label).toBe("35–44");
    expect(getBenchmarkForAge(44, "CA")?.label).toBe("35–44");
    expect(getBenchmarkForAge(55, "CA")?.label).toBe("55–64");
    expect(getBenchmarkForAge(65, "CA")?.label).toBe("65+");
    expect(getBenchmarkForAge(100, "CA")?.label).toBe("65+");
  });

  it("returns correct age group for US", () => {
    expect(getBenchmarkForAge(30, "US")?.label).toBe("25–34");
    expect(getBenchmarkForAge(40, "US")?.label).toBe("35–44");
    expect(getBenchmarkForAge(50, "US")?.label).toBe("45–54");
    expect(getBenchmarkForAge(60, "US")?.label).toBe("55–64");
    expect(getBenchmarkForAge(70, "US")?.label).toBe("65+");
  });

  it("returns null for ages outside range", () => {
    expect(getBenchmarkForAge(10, "CA")).toBeNull();
    expect(getBenchmarkForAge(17, "US")).toBeNull();
  });

  it("returns 18–24 group for boundary age 18", () => {
    expect(getBenchmarkForAge(18, "CA")?.label).toBe("18–24");
    expect(getBenchmarkForAge(18, "US")?.label).toBe("18–24");
  });

  it("all benchmark groups have valid ageMin <= ageMax", () => {
    for (const country of ["CA", "US"] as const) {
      for (const b of getBenchmarksForCountry(country)) {
        expect(b.ageMin).toBeLessThanOrEqual(b.ageMax);
      }
    }
  });
});

describe("estimatePercentile", () => {
  it("returns 50 when user value equals median", () => {
    expect(estimatePercentile(100_000, 100_000)).toBe(50);
  });

  it("returns > 50 when user is above median (higher is better)", () => {
    const pct = estimatePercentile(200_000, 100_000);
    expect(pct).toBeGreaterThan(50);
    expect(pct).toBeLessThanOrEqual(99);
  });

  it("returns < 50 when user is below median (higher is better)", () => {
    const pct = estimatePercentile(50_000, 100_000);
    expect(pct).toBeGreaterThan(1);
    expect(pct).toBeLessThan(50);
  });

  it("returns > 50 when user debt ratio is BELOW median (lower is better)", () => {
    // lower debt = better = higher percentile when higherIsBetter=false
    const pct = estimatePercentile(0.5, 1.5, 1.0, false);
    expect(pct).toBeGreaterThan(50);
  });

  it("returns < 50 when user debt ratio is ABOVE median (lower is better)", () => {
    const pct = estimatePercentile(2.0, 1.0, 1.0, false);
    expect(pct).toBeLessThan(50);
  });

  it("clamps output to 1-99 range", () => {
    const very_high = estimatePercentile(1_000_000_000, 100_000);
    expect(very_high).toBeLessThanOrEqual(99);
    expect(very_high).toBeGreaterThanOrEqual(1);

    const very_low = estimatePercentile(1, 100_000);
    expect(very_low).toBeLessThanOrEqual(99);
    expect(very_low).toBeGreaterThanOrEqual(1);
  });

  it("handles zero or negative values gracefully without throwing", () => {
    expect(() => estimatePercentile(0, 100_000)).not.toThrow();
    expect(() => estimatePercentile(100_000, 0)).not.toThrow();
    expect(() => estimatePercentile(0, 0)).not.toThrow();
  });

  it("returns a number in range [1,99] for realistic net worth values", () => {
    const cases = [5_000, 48_800, 234_400, 351_400, 543_200];
    for (const v of cases) {
      const pct = estimatePercentile(v, 234_400);
      expect(pct).toBeGreaterThanOrEqual(1);
      expect(pct).toBeLessThanOrEqual(99);
    }
  });
});

describe("computeBenchmarkComparisons", () => {
  it("returns empty array for age below 18", () => {
    const result = computeBenchmarkComparisons(10, "CA", 100_000, 0.1, 3, 0.5);
    expect(result).toHaveLength(0);
  });

  it("returns 4 comparisons when income is not provided", () => {
    const result = computeBenchmarkComparisons(35, "CA", 100_000, 0.1, 3, 0.5);
    expect(result).toHaveLength(4);
    const metrics = result.map((c) => c.metric);
    expect(metrics).toContain("Net Worth");
    expect(metrics).toContain("Savings Rate");
    expect(metrics).toContain("Emergency Fund");
    expect(metrics).toContain("Debt-to-Income");
    expect(metrics).not.toContain("Income");
  });

  it("returns 5 comparisons when income is provided", () => {
    const result = computeBenchmarkComparisons(35, "CA", 100_000, 0.1, 3, 0.5, 70_000);
    expect(result).toHaveLength(5);
    const metrics = result.map((c) => c.metric);
    expect(metrics).toContain("Income");
  });

  it("each comparison has percentile and ageGroupLabel", () => {
    const result = computeBenchmarkComparisons(38, "CA", 300_000, 0.15, 4, 1.0, 72_000);
    for (const c of result) {
      expect(c.percentile).toBeGreaterThanOrEqual(1);
      expect(c.percentile).toBeLessThanOrEqual(99);
      expect(c.ageGroupLabel).toBe("35–44");
    }
  });

  it("net worth message includes specific dollar amounts", () => {
    const result = computeBenchmarkComparisons(38, "CA", 300_000, 0.1, 3, 0.5);
    const nw = result.find((c) => c.metric === "Net Worth")!;
    expect(nw.message).toMatch(/\$|CA\$|median/i);
  });

  it("aboveBenchmark is true when user net worth > median", () => {
    const result = computeBenchmarkComparisons(38, "CA", 500_000, 0.1, 3, 0.5);
    const nw = result.find((c) => c.metric === "Net Worth")!;
    expect(nw.aboveBenchmark).toBe(true);
  });

  it("aboveBenchmark is false when user net worth < median", () => {
    const result = computeBenchmarkComparisons(38, "CA", 10_000, 0.1, 3, 0.5);
    const nw = result.find((c) => c.metric === "Net Worth")!;
    expect(nw.aboveBenchmark).toBe(false);
  });

  it("debt-to-income aboveBenchmark is true when user ratio is lower (better)", () => {
    const result = computeBenchmarkComparisons(38, "CA", 200_000, 0.1, 3, 0.5);
    const di = result.find((c) => c.metric === "Debt-to-Income")!;
    // CA 35-44 median DTI is 1.7, user is 0.5 — should be "above" (better)
    expect(di.aboveBenchmark).toBe(true);
  });

  it("works for US benchmarks at age 50", () => {
    const result = computeBenchmarkComparisons(50, "US", 247_200, 0.15, 5, 1.1, 72_000);
    expect(result.length).toBeGreaterThan(0);
    for (const c of result) {
      expect(c.ageGroupLabel).toBe("45–54");
    }
    // User matches median net worth exactly → percentile ~ 50
    const nw = result.find((c) => c.metric === "Net Worth")!;
    expect(nw.percentile).toBeCloseTo(50, -1); // within ±10
  });
});
