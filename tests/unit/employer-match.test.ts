import { describe, it, expect } from "vitest";
import { computeEmployerMatchMonthly, EMPLOYER_MATCH_ELIGIBLE } from "@/components/AssetEntry";
import { generateInsights } from "@/lib/insights";

describe("computeEmployerMatchMonthly", () => {
  it("returns 0 when matchPct is 0", () => {
    expect(computeEmployerMatchMonthly(500, 0, 6, 80000)).toBe(0);
  });

  it("returns 0 when matchCap is 0", () => {
    expect(computeEmployerMatchMonthly(500, 50, 0, 80000)).toBe(0);
  });

  it("returns 0 when monthlyContribution is 0", () => {
    expect(computeEmployerMatchMonthly(0, 50, 6, 80000)).toBe(0);
  });

  it("returns 0 when annualSalary is 0", () => {
    expect(computeEmployerMatchMonthly(500, 50, 6, 0)).toBe(0);
  });

  it("computes match not limited by cap — 50% match, 6% cap, $80k salary, $500/mo contrib", () => {
    // Match on contrib: $500 * 50% = $250
    // Monthly cap: $80,000 * 6% / 12 = $400
    // Result: min($250, $400) = $250
    expect(computeEmployerMatchMonthly(500, 50, 6, 80000)).toBe(250);
  });

  it("computes match limited by salary cap — 100% match, 3% cap, $50k salary, $500/mo contrib", () => {
    // Match on contrib: $500 * 100% = $500
    // Monthly cap: $50,000 * 3% / 12 = $125
    // Result: min($500, $125) = $125
    expect(computeEmployerMatchMonthly(500, 100, 3, 50000)).toBe(125);
  });

  it("handles exact cap boundary — match equals cap exactly", () => {
    // Match on contrib: $200 * 50% = $100
    // Monthly cap: $24,000 * 5% / 12 = $100
    // Result: min($100, $100) = $100
    expect(computeEmployerMatchMonthly(200, 50, 5, 24000)).toBe(100);
  });

  it("handles large contribution exceeding cap", () => {
    // Match on contrib: $2000 * 50% = $1000
    // Monthly cap: $60,000 * 6% / 12 = $300
    // Result: min($1000, $300) = $300
    expect(computeEmployerMatchMonthly(2000, 50, 6, 60000)).toBe(300);
  });

  it("handles fractional results", () => {
    // Match on contrib: $300 * 75% = $225
    // Monthly cap: $90,000 * 4% / 12 = $300
    // Result: min($225, $300) = $225
    expect(computeEmployerMatchMonthly(300, 75, 4, 90000)).toBeCloseTo(225);
  });
});

describe("EMPLOYER_MATCH_ELIGIBLE", () => {
  it("includes RRSP", () => {
    expect(EMPLOYER_MATCH_ELIGIBLE.has("RRSP")).toBe(true);
  });

  it("includes 401k", () => {
    expect(EMPLOYER_MATCH_ELIGIBLE.has("401k")).toBe(true);
  });

  it("includes Roth 401k", () => {
    expect(EMPLOYER_MATCH_ELIGIBLE.has("Roth 401k")).toBe(true);
  });

  it("does NOT include TFSA", () => {
    expect(EMPLOYER_MATCH_ELIGIBLE.has("TFSA")).toBe(false);
  });

  it("does NOT include IRA", () => {
    expect(EMPLOYER_MATCH_ELIGIBLE.has("IRA")).toBe(false);
  });

  it("does NOT include Roth IRA", () => {
    expect(EMPLOYER_MATCH_ELIGIBLE.has("Roth IRA")).toBe(false);
  });
});

describe("employer match insight", () => {
  it("generates insight when employer match annual is set", () => {
    const insights = generateInsights({
      totalAssets: 50000,
      totalDebts: 10000,
      monthlyIncome: 5000,
      monthlyExpenses: 4000,
      homeCurrency: "CAD",
      employerMatchAnnual: 3600,
    });
    const matchInsight = insights.find((i) => i.id === "employer-match");
    expect(matchInsight).toBeDefined();
    expect(matchInsight?.type).toBe("employer-match");
    expect(matchInsight?.message).toContain("3,600");
    expect(matchInsight?.message).toContain("free money");
  });

  it("does NOT generate insight when no employer match", () => {
    const insights = generateInsights({
      totalAssets: 50000,
      totalDebts: 10000,
      monthlyIncome: 5000,
      monthlyExpenses: 4000,
      homeCurrency: "CAD",
    });
    const matchInsight = insights.find((i) => i.id === "employer-match");
    expect(matchInsight).toBeUndefined();
  });

  it("does NOT generate insight when employer match is 0", () => {
    const insights = generateInsights({
      totalAssets: 50000,
      totalDebts: 10000,
      monthlyIncome: 5000,
      monthlyExpenses: 4000,
      homeCurrency: "CAD",
      employerMatchAnnual: 0,
    });
    const matchInsight = insights.find((i) => i.id === "employer-match");
    expect(matchInsight).toBeUndefined();
  });
});
