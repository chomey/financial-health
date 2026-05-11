/**
 * Task 210: Australia tax tables — extracted to src/lib/countries/australia/tax-tables.ts
 */
import { describe, it, expect } from "vitest";
import {
  AU_FEDERAL_2025,
  AU_FEDERAL_2026,
  AU_FEDERAL_BY_YEAR,
  AU_MEDICARE_LEVY,
  getAUBrackets,
  calculateMedicareLevy,
} from "@/lib/countries/australia/tax-tables";

describe("AU_FEDERAL_2025", () => {
  it("has 5 brackets", () => {
    expect(AU_FEDERAL_2025.brackets).toHaveLength(5);
  });

  it("starts with tax-free 0% bracket up to $18,200", () => {
    expect(AU_FEDERAL_2025.brackets[0]).toEqual({ min: 0, max: 18_200, rate: 0 });
  });

  it("has 16% bracket from $18,200 to $45,000", () => {
    expect(AU_FEDERAL_2025.brackets[1]).toEqual({ min: 18_200, max: 45_000, rate: 0.16 });
  });

  it("has 30% bracket from $45,000 to $135,000", () => {
    expect(AU_FEDERAL_2025.brackets[2]).toEqual({ min: 45_000, max: 135_000, rate: 0.30 });
  });

  it("has 37% bracket from $135,000 to $190,000", () => {
    expect(AU_FEDERAL_2025.brackets[3]).toEqual({ min: 135_000, max: 190_000, rate: 0.37 });
  });

  it("has 45% top bracket above $190,000", () => {
    expect(AU_FEDERAL_2025.brackets[4]).toEqual({ min: 190_000, max: Infinity, rate: 0.45 });
  });

  it("basicPersonalAmount is 0 (tax-free handled via 0% bracket)", () => {
    expect(AU_FEDERAL_2025.basicPersonalAmount).toBe(0);
  });
});

describe("AU_FEDERAL_2026", () => {
  it("has 5 brackets with indexed thresholds higher than 2025", () => {
    expect(AU_FEDERAL_2026.brackets).toHaveLength(5);
    expect(AU_FEDERAL_2026.brackets[0].max).toBeGreaterThan(AU_FEDERAL_2025.brackets[0].max);
    expect(AU_FEDERAL_2026.brackets[1].max).toBeGreaterThan(AU_FEDERAL_2025.brackets[1].max);
    expect(AU_FEDERAL_2026.brackets[2].max).toBeGreaterThan(AU_FEDERAL_2025.brackets[2].max);
  });

  it("preserves same rate structure as 2025", () => {
    const rates2025 = AU_FEDERAL_2025.brackets.map(b => b.rate);
    const rates2026 = AU_FEDERAL_2026.brackets.map(b => b.rate);
    expect(rates2026).toEqual(rates2025);
  });
});

describe("AU_FEDERAL_BY_YEAR", () => {
  it("maps 2025 → AU_FEDERAL_2025", () => {
    expect(AU_FEDERAL_BY_YEAR[2025]).toBe(AU_FEDERAL_2025);
  });

  it("maps 2026 → AU_FEDERAL_2026", () => {
    expect(AU_FEDERAL_BY_YEAR[2026]).toBe(AU_FEDERAL_2026);
  });
});

describe("AU_MEDICARE_LEVY constants", () => {
  it("rate is 2%", () => {
    expect(AU_MEDICARE_LEVY.rate).toBe(0.02);
  });

  it("phaseInRate is 10%", () => {
    expect(AU_MEDICARE_LEVY.phaseInRate).toBe(0.10);
  });

  it("2026 thresholds are higher than 2025", () => {
    expect(AU_MEDICARE_LEVY.singleThreshold2026).toBeGreaterThan(AU_MEDICARE_LEVY.singleThreshold2025);
    expect(AU_MEDICARE_LEVY.singleShadeOut2026).toBeGreaterThan(AU_MEDICARE_LEVY.singleShadeOut2025);
  });
});

describe("getAUBrackets", () => {
  it("returns AU_FEDERAL_2025 for year 2025", () => {
    const { federal } = getAUBrackets("NSW", 2025);
    expect(federal).toBe(AU_FEDERAL_2025);
  });

  it("returns AU_FEDERAL_2026 for year 2026", () => {
    const { federal } = getAUBrackets("VIC", 2026);
    expect(federal).toBe(AU_FEDERAL_2026);
  });

  it("returns empty state brackets for every AU jurisdiction", () => {
    const jurisdictions = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"];
    for (const j of jurisdictions) {
      const { state } = getAUBrackets(j, 2025);
      expect(state.brackets).toHaveLength(0);
      expect(state.basicPersonalAmount).toBe(0);
    }
  });

  it("throws for unsupported year", () => {
    expect(() => getAUBrackets("NSW", 2020)).toThrow("not supported");
  });

  it("defaults to year 2025 when year is omitted", () => {
    const { federal } = getAUBrackets("QLD");
    expect(federal).toBe(AU_FEDERAL_2025);
  });
});

describe("calculateMedicareLevy", () => {
  it("returns 0 for income at or below threshold ($26,000)", () => {
    expect(calculateMedicareLevy(0, 2025)).toBe(0);
    expect(calculateMedicareLevy(20_000, 2025)).toBe(0);
    expect(calculateMedicareLevy(26_000, 2025)).toBe(0);
  });

  it("returns 0 for negative income", () => {
    expect(calculateMedicareLevy(-5_000, 2025)).toBe(0);
  });

  it("phases in at 10% of excess between $26,000 and $32,500", () => {
    // At $29,000: 10% × ($29,000 - $26,000) = $300
    expect(calculateMedicareLevy(29_000, 2025)).toBeCloseTo(300, 0);
  });

  it("applies full 2% above shade-out ($32,500)", () => {
    expect(calculateMedicareLevy(50_000, 2025)).toBeCloseTo(1_000, 0);
    expect(calculateMedicareLevy(100_000, 2025)).toBeCloseTo(2_000, 0);
  });

  it("uses 2026 thresholds when year >= 2026", () => {
    // $26,500 is below 2026 threshold ($26,650) → $0
    expect(calculateMedicareLevy(26_500, 2026)).toBe(0);
    // $26,500 is above 2025 threshold ($26,000) → phase-in applies
    expect(calculateMedicareLevy(26_500, 2025)).toBeGreaterThan(0);
  });

  it("defaults to year 2025 when year is omitted", () => {
    // $26,500 should trigger phase-in under 2025 rules
    expect(calculateMedicareLevy(26_500)).toBeGreaterThan(0);
  });
});
