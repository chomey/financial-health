/**
 * Task 160: AU federal income tax brackets 2025/2026
 * Comprehensive tests for AU tax brackets, Medicare Levy, and tax engine.
 */
import { describe, it, expect } from "vitest";
import {
  AU_FEDERAL_2025,
  AU_FEDERAL_2026,
  AU_MEDICARE_LEVY,
  getAUBrackets,
  calculateMedicareLevy,
} from "@/lib/tax-tables";
import { computeTax } from "@/lib/tax-engine";

// ─── AU Federal Bracket Structure ───────────────────────────────────────────

describe("AU federal tax brackets 2025", () => {
  it("has 5 brackets", () => {
    expect(AU_FEDERAL_2025.brackets).toHaveLength(5);
  });

  it("first bracket is 0% up to $18,200 (tax-free threshold)", () => {
    expect(AU_FEDERAL_2025.brackets[0]).toEqual({ min: 0, max: 18_200, rate: 0 });
  });

  it("second bracket is 16% from $18,201 to $45,000", () => {
    expect(AU_FEDERAL_2025.brackets[1]).toEqual({ min: 18_200, max: 45_000, rate: 0.16 });
  });

  it("third bracket is 30% from $45,001 to $135,000", () => {
    expect(AU_FEDERAL_2025.brackets[2]).toEqual({ min: 45_000, max: 135_000, rate: 0.30 });
  });

  it("fourth bracket is 37% from $135,001 to $190,000", () => {
    expect(AU_FEDERAL_2025.brackets[3]).toEqual({ min: 135_000, max: 190_000, rate: 0.37 });
  });

  it("top bracket is 45% above $190,000", () => {
    expect(AU_FEDERAL_2025.brackets[4]).toEqual({ min: 190_000, max: Infinity, rate: 0.45 });
  });

  it("basicPersonalAmount is 0 (tax-free threshold handled via 0% bracket)", () => {
    expect(AU_FEDERAL_2025.basicPersonalAmount).toBe(0);
  });
});

describe("AU federal tax brackets 2026", () => {
  it("has 5 brackets with indexed thresholds", () => {
    expect(AU_FEDERAL_2026.brackets).toHaveLength(5);
    // 2026 thresholds should be higher than 2025 due to indexation
    expect(AU_FEDERAL_2026.brackets[0].max).toBeGreaterThan(AU_FEDERAL_2025.brackets[0].max);
    expect(AU_FEDERAL_2026.brackets[1].max).toBeGreaterThan(AU_FEDERAL_2025.brackets[1].max);
  });

  it("preserves same rate structure as 2025", () => {
    const rates2025 = AU_FEDERAL_2025.brackets.map(b => b.rate);
    const rates2026 = AU_FEDERAL_2026.brackets.map(b => b.rate);
    expect(rates2026).toEqual(rates2025);
  });
});

// ─── getAUBrackets ──────────────────────────────────────────────────────────

describe("getAUBrackets", () => {
  it("returns federal brackets for NSW", () => {
    const { federal, state } = getAUBrackets("NSW", 2025);
    expect(federal).toBe(AU_FEDERAL_2025);
    expect(state.brackets).toHaveLength(0);
  });

  it("returns empty state brackets (no state income tax in AU)", () => {
    const jurisdictions = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"];
    for (const j of jurisdictions) {
      const { state } = getAUBrackets(j, 2025);
      expect(state.brackets).toHaveLength(0);
      expect(state.basicPersonalAmount).toBe(0);
    }
  });

  it("returns 2026 brackets for year 2026", () => {
    const { federal } = getAUBrackets("VIC", 2026);
    expect(federal).toBe(AU_FEDERAL_2026);
  });

  it("throws for unsupported year", () => {
    expect(() => getAUBrackets("NSW", 2020)).toThrow("not supported");
  });
});

// ─── Medicare Levy ──────────────────────────────────────────────────────────

describe("calculateMedicareLevy", () => {
  it("returns 0 for income below threshold ($26,000)", () => {
    expect(calculateMedicareLevy(20_000, 2025)).toBe(0);
    expect(calculateMedicareLevy(26_000, 2025)).toBe(0);
  });

  it("phases in between $26,000 and $32,500", () => {
    // At $29,000: 10% of ($29,000 - $26,000) = $300
    expect(calculateMedicareLevy(29_000, 2025)).toBeCloseTo(300, 0);
  });

  it("full 2% above shade-out ($32,500)", () => {
    // At $50,000: 2% × $50,000 = $1,000
    expect(calculateMedicareLevy(50_000, 2025)).toBeCloseTo(1_000, 0);
    // At $100,000: 2% × $100,000 = $2,000
    expect(calculateMedicareLevy(100_000, 2025)).toBeCloseTo(2_000, 0);
  });

  it("returns 0 for zero or negative income", () => {
    expect(calculateMedicareLevy(0, 2025)).toBe(0);
    expect(calculateMedicareLevy(-5000, 2025)).toBe(0);
  });

  it("uses 2026 thresholds when year >= 2026", () => {
    // $26,500 is below 2026 threshold ($26,650) → $0
    expect(calculateMedicareLevy(26_500, 2026)).toBe(0);
    // $26,500 is above 2025 threshold ($26,000) → phase-in
    expect(calculateMedicareLevy(26_500, 2025)).toBeGreaterThan(0);
  });
});

describe("AU_MEDICARE_LEVY constants", () => {
  it("has correct rate", () => {
    expect(AU_MEDICARE_LEVY.rate).toBe(0.02);
  });

  it("has correct phase-in rate", () => {
    expect(AU_MEDICARE_LEVY.phaseInRate).toBe(0.10);
  });

  it("2026 thresholds are higher than 2025", () => {
    expect(AU_MEDICARE_LEVY.singleThreshold2026).toBeGreaterThan(AU_MEDICARE_LEVY.singleThreshold2025);
    expect(AU_MEDICARE_LEVY.singleShadeOut2026).toBeGreaterThan(AU_MEDICARE_LEVY.singleShadeOut2025);
  });
});

// ─── computeTax for AU — marginal rate verification ─────────────────────────

describe("AU computeTax — marginal rates at key thresholds", () => {
  it("$0 income → 0% marginal rate", () => {
    const result = computeTax(0, "employment", "AU", "NSW", 2025);
    expect(result.marginalRate).toBe(0);
  });

  it("$15,000 (below tax-free) → 0% marginal rate", () => {
    const result = computeTax(15_000, "employment", "AU", "NSW", 2025);
    expect(result.marginalRate).toBe(0);
  });

  it("$30,000 (in 16% bracket, Medicare phase-in) → 16% + 10%", () => {
    const result = computeTax(30_000, "employment", "AU", "NSW", 2025);
    expect(result.marginalRate).toBeCloseTo(0.26, 4);
  });

  it("$80,000 (in 30% bracket, full Medicare) → 32%", () => {
    const result = computeTax(80_000, "employment", "AU", "NSW", 2025);
    expect(result.marginalRate).toBeCloseTo(0.32, 4);
  });

  it("$150,000 (in 37% bracket) → 39%", () => {
    const result = computeTax(150_000, "employment", "AU", "NSW", 2025);
    expect(result.marginalRate).toBeCloseTo(0.39, 4);
  });

  it("$250,000 (in 45% bracket) → 47%", () => {
    const result = computeTax(250_000, "employment", "AU", "NSW", 2025);
    expect(result.marginalRate).toBeCloseTo(0.47, 4);
  });
});

// ─── computeTax for AU — tax amount verification ────────────────────────────

describe("AU computeTax — tax amounts at key income levels", () => {
  it("$18,200 (exactly tax-free threshold) → $0 tax", () => {
    const result = computeTax(18_200, "employment", "AU", "NSW", 2025);
    expect(result.federalTax).toBe(0);
    expect(result.totalTax).toBe(0);
  });

  it("$45,000 (top of 16% bracket)", () => {
    // Federal: 16% × ($45,000 - $18,200) = 16% × $26,800 = $4,288
    // Medicare: full 2% × $45,000 = $900
    const result = computeTax(45_000, "employment", "AU", "NSW", 2025);
    expect(result.federalTax).toBeCloseTo(4_288, 0);
    expect(result.totalTax).toBeCloseTo(5_188, 0);
  });

  it("$135,000 (top of 30% bracket)", () => {
    // Federal: $4,288 + 30% × ($135,000 - $45,000) = $4,288 + $27,000 = $31,288
    // Medicare: 2% × $135,000 = $2,700
    const result = computeTax(135_000, "employment", "AU", "NSW", 2025);
    expect(result.federalTax).toBeCloseTo(31_288, 0);
    expect(result.totalTax).toBeCloseTo(33_988, 0);
  });

  it("$190,000 (top of 37% bracket)", () => {
    // Federal: $31,288 + 37% × ($190,000 - $135,000) = $31,288 + $20,350 = $51,638
    // Medicare: 2% × $190,000 = $3,800
    const result = computeTax(190_000, "employment", "AU", "NSW", 2025);
    expect(result.federalTax).toBeCloseTo(51_638, 0);
    expect(result.totalTax).toBeCloseTo(55_438, 0);
  });

  it("$300,000 (in 45% bracket)", () => {
    // Federal: $51,638 + 45% × ($300,000 - $190,000) = $51,638 + $49,500 = $101,138
    // Medicare: 2% × $300,000 = $6,000
    const result = computeTax(300_000, "employment", "AU", "NSW", 2025);
    expect(result.federalTax).toBeCloseTo(101_138, 0);
    expect(result.totalTax).toBeCloseTo(107_138, 0);
  });

  it("provincialStateTax is always 0", () => {
    const result = computeTax(100_000, "employment", "AU", "VIC", 2025);
    expect(result.provincialStateTax).toBe(0);
  });
});

// ─── AU capital gains ───────────────────────────────────────────────────────

describe("AU computeTax — capital gains", () => {
  it("applies 50% CGT discount", () => {
    // $100,000 capital gains → taxable = $50,000
    // Federal on $50k: 0 + 16% × $26,800 + 30% × $5,000 = $4,288 + $1,500 = $5,788
    // Medicare on $50k: 2% × $50,000 = $1,000
    const result = computeTax(100_000, "capital-gains", "AU", "NSW", 2025);
    expect(result.federalTax).toBeCloseTo(5_788, 0);
    expect(result.totalTax).toBeCloseTo(6_788, 0);
  });

  it("marginal rate is halved for capital gains", () => {
    // $100k CG → taxable $50k, in 30% bracket → marginal 30% + 2% ML = 32%, halved → 16%
    const result = computeTax(100_000, "capital-gains", "AU", "NSW", 2025);
    expect(result.marginalRate).toBeCloseTo(0.16, 4);
  });

  it("small capital gains below tax-free threshold → $0", () => {
    // $30,000 CG → taxable $15,000 → below $18,200 threshold
    const result = computeTax(30_000, "capital-gains", "AU", "NSW", 2025);
    expect(result.federalTax).toBe(0);
    expect(result.totalTax).toBe(0);
  });
});

// ─── AU 2026 tax year ───────────────────────────────────────────────────────

describe("AU computeTax — 2026 tax year", () => {
  it("uses indexed 2026 brackets", () => {
    // Same income should result in slightly less tax in 2026 due to indexation
    const result2025 = computeTax(100_000, "employment", "AU", "NSW", 2025);
    const result2026 = computeTax(100_000, "employment", "AU", "NSW", 2026);
    expect(result2026.totalTax).toBeLessThan(result2025.totalTax);
  });

  it("computes reasonable values for 2026", () => {
    const result = computeTax(80_000, "employment", "AU", "NSW", 2026);
    expect(result.federalTax).toBeGreaterThan(0);
    expect(result.totalTax).toBeGreaterThan(result.federalTax); // includes Medicare
    expect(result.afterTaxIncome).toBeGreaterThan(0);
    expect(result.afterTaxIncome).toBeLessThan(80_000);
  });
});

// ─── AU works across all jurisdictions ──────────────────────────────────────

describe("AU computeTax — all jurisdictions produce same result (no state tax)", () => {
  const jurisdictions = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"];

  it("all AU jurisdictions return identical tax for same income", () => {
    const baseline = computeTax(100_000, "employment", "AU", "NSW", 2025);
    for (const j of jurisdictions) {
      const result = computeTax(100_000, "employment", "AU", j, 2025);
      expect(result.totalTax).toBe(baseline.totalTax);
      expect(result.federalTax).toBe(baseline.federalTax);
      expect(result.provincialStateTax).toBe(0);
    }
  });
});
