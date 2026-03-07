import { describe, it, expect } from "vitest";
import { computeFireNumber, findMonthAtTarget, type ProjectionPoint } from "@/lib/projections";
import { generateInsights, type FinancialData } from "@/lib/insights";

// --- computeFireNumber ---
describe("computeFireNumber", () => {
  it("returns annual expenses / SWR", () => {
    // $5000/mo expenses, 4% SWR => $5000 * 12 / 0.04 = $1,500,000
    expect(computeFireNumber(5000, 4)).toBe(1_500_000);
  });

  it("returns correct value for 3% SWR", () => {
    // $3000/mo, 3% SWR => $3000 * 12 / 0.03 = $1,200,000
    expect(computeFireNumber(3000, 3)).toBeCloseTo(1_200_000, 0);
  });

  it("returns correct value for 5% SWR", () => {
    // $4000/mo, 5% SWR => $4000 * 12 / 0.05 = $960,000
    expect(computeFireNumber(4000, 5)).toBeCloseTo(960_000, 0);
  });

  it("returns 0 for zero expenses", () => {
    expect(computeFireNumber(0, 4)).toBe(0);
  });

  it("returns 0 for zero SWR", () => {
    expect(computeFireNumber(5000, 0)).toBe(0);
  });

  it("returns 0 for negative SWR", () => {
    expect(computeFireNumber(5000, -1)).toBe(0);
  });

  it("4% rule: $40k/yr expenses => $1M FIRE number", () => {
    const monthlyExpenses = 40_000 / 12;
    expect(computeFireNumber(monthlyExpenses, 4)).toBeCloseTo(1_000_000, 0);
  });
});

// --- findMonthAtTarget ---
function makePoints(netWorths: number[]): ProjectionPoint[] {
  return netWorths.map((nw, i) => ({
    month: i,
    year: i / 12,
    netWorth: nw,
    totalAssets: nw,
    totalDebts: 0,
    consumerDebts: 0,
    mortgageDebts: 0,
    totalPropertyEquity: 0,
  }));
}

describe("findMonthAtTarget", () => {
  it("finds the first month when net worth crosses target", () => {
    const points = makePoints([0, 100_000, 500_000, 1_000_000, 1_500_000]);
    expect(findMonthAtTarget(points, 500_000)).toBe(2);
  });

  it("returns 0 when already at target at month 0", () => {
    const points = makePoints([1_500_000, 2_000_000]);
    expect(findMonthAtTarget(points, 500_000)).toBe(0);
  });

  it("returns null when target never reached", () => {
    const points = makePoints([0, 100_000, 200_000, 300_000]);
    expect(findMonthAtTarget(points, 1_000_000)).toBeNull();
  });

  it("returns null for empty points array", () => {
    expect(findMonthAtTarget([], 500_000)).toBeNull();
  });

  it("returns null for target <= 0", () => {
    const points = makePoints([100_000, 200_000]);
    expect(findMonthAtTarget(points, 0)).toBeNull();
    expect(findMonthAtTarget(points, -1)).toBeNull();
  });
});

// --- FIRE insight generation ---
function baseData(overrides: Partial<FinancialData> = {}): FinancialData {
  return {
    totalAssets: 200_000,
    totalDebts: 0,
    monthlyIncome: 8000,
    monthlyExpenses: 5000,
    ...overrides,
  };
}

describe("FIRE insight", () => {
  it("generates FIRE insight when fireNumber is set", () => {
    const data = baseData({ fireNumber: 1_500_000 });
    const insights = generateInsights(data);
    const fireInsight = insights.find((i) => i.type === "fire");
    expect(fireInsight).toBeDefined();
    // Message contains the FIRE number in some formatted form
    expect(fireInsight?.message).toMatch(/1[,.]?5/); // 1,500,000 or 1.5M
    expect(fireInsight?.icon).toBe("🔥");
  });

  it("shows progress percentage when not yet at FIRE", () => {
    const data = baseData({
      totalAssets: 300_000, // 300k / 1.5M = 20%
      fireNumber: 1_500_000,
    });
    const insights = generateInsights(data);
    const fireInsight = insights.find((i) => i.type === "fire");
    expect(fireInsight?.message).toContain("20%");
  });

  it("celebrates when net worth >= FIRE number", () => {
    const data = baseData({
      totalAssets: 2_000_000,
      totalDebts: 0,
      fireNumber: 1_500_000,
    });
    const insights = generateInsights(data);
    const fireInsight = insights.find((i) => i.type === "fire");
    expect(fireInsight?.id).toBe("fire-achieved");
    expect(fireInsight?.message).toContain("financial independence");
  });

  it("does not generate FIRE insight when fireNumber is not set", () => {
    const data = baseData(); // no fireNumber
    const insights = generateInsights(data);
    const fireInsight = insights.find((i) => i.type === "fire");
    expect(fireInsight).toBeUndefined();
  });

  it("does not generate FIRE insight when fireNumber is 0", () => {
    const data = baseData({ fireNumber: 0 });
    const insights = generateInsights(data);
    const fireInsight = insights.find((i) => i.type === "fire");
    expect(fireInsight).toBeUndefined();
  });

  it("includes years to FIRE in message when yearsToFire is provided", () => {
    const data = baseData({
      totalAssets: 300_000,
      fireNumber: 1_500_000,
      yearsToFire: 12.5,
    });
    const insights = generateInsights(data);
    const fireInsight = insights.find((i) => i.type === "fire");
    expect(fireInsight?.message).toContain("12.5 years");
  });
});
