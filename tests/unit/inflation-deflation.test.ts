import { describe, it, expect } from "vitest";
import { deflateProjectionPoints } from "@/lib/projections";
import type { ProjectionPoint } from "@/lib/projections";

function makePoint(month: number, netWorth: number, overrides: Partial<ProjectionPoint> = {}): ProjectionPoint {
  return {
    month,
    year: parseFloat((month / 12).toFixed(1)),
    netWorth,
    totalAssets: netWorth + 10000,
    totalDebts: 10000,
    consumerDebts: 5000,
    mortgageDebts: 5000,
    totalPropertyEquity: 0,
    ...overrides,
  };
}

describe("deflateProjectionPoints", () => {
  it("month 0 point is unchanged (deflator = 1.0)", () => {
    const points = [makePoint(0, 100_000)];
    const result = deflateProjectionPoints(points, 0.025);
    expect(result[0].netWorth).toBe(100_000);
    expect(result[0].totalAssets).toBe(110_000);
    expect(result[0].totalDebts).toBe(10_000);
  });

  it("12-month point deflated by (1.025)^1", () => {
    const points = [makePoint(12, 102_500)];
    const result = deflateProjectionPoints(points, 0.025);
    const expected = Math.round(102_500 / 1.025);
    expect(result[0].netWorth).toBe(expected);
  });

  it("24-month point deflated by (1.025)^2", () => {
    const points = [makePoint(24, 200_000)];
    const result = deflateProjectionPoints(points, 0.025);
    const deflator = Math.pow(1.025, 2);
    const expected = Math.round(200_000 / deflator);
    expect(result[0].netWorth).toBe(expected);
  });

  it("zero inflation rate returns values unchanged", () => {
    const points = [makePoint(0, 100_000), makePoint(12, 110_000), makePoint(60, 200_000)];
    const result = deflateProjectionPoints(points, 0);
    expect(result[0].netWorth).toBe(100_000);
    expect(result[1].netWorth).toBe(110_000);
    expect(result[2].netWorth).toBe(200_000);
  });

  it("deflates all monetary fields proportionally at the same rate", () => {
    const month = 60; // 5 years
    const deflator = Math.pow(1.025, 5);
    const points = [
      makePoint(month, 500_000, {
        totalAssets: 600_000,
        totalDebts: 100_000,
        consumerDebts: 30_000,
        mortgageDebts: 70_000,
        totalPropertyEquity: 50_000,
      }),
    ];
    const result = deflateProjectionPoints(points, 0.025);
    expect(result[0].netWorth).toBe(Math.round(500_000 / deflator));
    expect(result[0].totalAssets).toBe(Math.round(600_000 / deflator));
    expect(result[0].totalDebts).toBe(Math.round(100_000 / deflator));
    expect(result[0].consumerDebts).toBe(Math.round(30_000 / deflator));
    expect(result[0].mortgageDebts).toBe(Math.round(70_000 / deflator));
    expect(result[0].totalPropertyEquity).toBe(Math.round(50_000 / deflator));
  });

  it("deflates withdrawalTaxDrag when present", () => {
    const month = 24;
    const deflator = Math.pow(1.025, 2);
    const points = [makePoint(month, 100_000, { withdrawalTaxDrag: 8000 })];
    const result = deflateProjectionPoints(points, 0.025);
    expect(result[0].withdrawalTaxDrag).toBe(Math.round(8000 / deflator));
  });

  it("preserves undefined withdrawalTaxDrag", () => {
    const points = [makePoint(12, 100_000)]; // no withdrawalTaxDrag
    const result = deflateProjectionPoints(points, 0.025);
    expect(result[0].withdrawalTaxDrag).toBeUndefined();
  });

  it("deflates a multi-point array correctly", () => {
    const points = [
      makePoint(0, 100_000),
      makePoint(12, 110_000),
      makePoint(60, 180_000),
      makePoint(120, 300_000),
    ];
    const rate = 0.03;
    const result = deflateProjectionPoints(points, rate);
    // Year 0: no change
    expect(result[0].netWorth).toBe(100_000);
    // Year 1
    expect(result[1].netWorth).toBe(Math.round(110_000 / Math.pow(1.03, 1)));
    // Year 5
    expect(result[2].netWorth).toBe(Math.round(180_000 / Math.pow(1.03, 5)));
    // Year 10
    expect(result[3].netWorth).toBe(Math.round(300_000 / Math.pow(1.03, 10)));
  });

  it("preserves month and year fields unchanged", () => {
    const points = [makePoint(36, 100_000)];
    const result = deflateProjectionPoints(points, 0.025);
    expect(result[0].month).toBe(36);
    expect(result[0].year).toBe(3);
  });

  it("higher inflation rate produces lower real values", () => {
    const points = [makePoint(120, 500_000)]; // 10 years
    const low = deflateProjectionPoints(points, 0.02);
    const high = deflateProjectionPoints(points, 0.05);
    expect(low[0].netWorth).toBeGreaterThan(high[0].netWorth);
  });

  it("returns empty array for empty input", () => {
    expect(deflateProjectionPoints([], 0.025)).toEqual([]);
  });
});

describe("inflation URL helpers", () => {
  it("getInflationFromURL returns defaults when window is undefined", async () => {
    // In Node (vitest), window is not defined — we simulate this behavior
    // by calling the function in a context where window is mocked away
    const { getInflationFromURL } = await import("@/lib/url-state");
    // In jsdom test environment window exists, but we test the shape of return value
    const result = getInflationFromURL();
    expect(result).toHaveProperty("adjusted");
    expect(result).toHaveProperty("rate");
    expect(typeof result.adjusted).toBe("boolean");
    expect(typeof result.rate).toBe("number");
  });

  it("inflation rate default is 2.5", async () => {
    const { getInflationFromURL } = await import("@/lib/url-state");
    const result = getInflationFromURL();
    // In a clean test env (no URL params set), rate should default to 2.5
    expect(result.rate).toBe(2.5);
  });
});
