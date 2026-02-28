import { describe, it, expect } from "vitest";
import {
  getCanadianBrackets,
  calculateProgressiveTax,
  calculateCanadianCapitalGainsInclusion,
  CA_FEDERAL_2025,
  CA_ON_2025,
  CA_BC_2025,
  CA_AB_2025,
  CA_QC_2025,
  CA_CAPITAL_GAINS,
} from "@/lib/tax-tables";

describe("getCanadianBrackets", () => {
  it("returns federal and provincial tables for valid province codes", () => {
    const result = getCanadianBrackets("ON");
    expect(result.federal).toBe(CA_FEDERAL_2025);
    expect(result.provincial).toBe(CA_ON_2025);
  });

  it("is case-insensitive for province codes", () => {
    const result = getCanadianBrackets("bc");
    expect(result.provincial).toBe(CA_BC_2025);
  });

  it("returns correct tables for all 13 provinces/territories", () => {
    const codes = ["AB", "BC", "MB", "NB", "NL", "NT", "NS", "NU", "ON", "PE", "QC", "SK", "YT"];
    for (const code of codes) {
      const result = getCanadianBrackets(code);
      expect(result.federal).toBe(CA_FEDERAL_2025);
      expect(result.provincial.brackets.length).toBeGreaterThan(0);
      expect(result.provincial.basicPersonalAmount).toBeGreaterThan(0);
    }
  });

  it("throws for unknown province code", () => {
    expect(() => getCanadianBrackets("XX")).toThrow("Unknown Canadian province/territory code");
  });

  it("throws for unsupported tax year", () => {
    expect(() => getCanadianBrackets("ON", 2024)).toThrow("Tax year 2024 is not supported");
  });
});

describe("calculateProgressiveTax", () => {
  it("returns 0 for zero income", () => {
    expect(calculateProgressiveTax(0, CA_FEDERAL_2025)).toBe(0);
  });

  it("returns 0 for negative income", () => {
    expect(calculateProgressiveTax(-10000, CA_FEDERAL_2025)).toBe(0);
  });

  it("returns 0 for income below basic personal amount", () => {
    // Federal BPA is $16,129 at 15% rate → credit = $2,419.35
    // Tax on $16,129 = $16,129 × 0.15 = $2,419.35 → net tax = 0
    expect(calculateProgressiveTax(16_129, CA_FEDERAL_2025)).toBeCloseTo(0, 2);
  });

  it("calculates federal tax correctly for $50,000 income", () => {
    // $50,000 is entirely in the first bracket (0–57,375 at 15%)
    // Gross tax = $50,000 × 0.15 = $7,500
    // BPA credit = $16,129 × 0.15 = $2,419.35
    // Net tax = $7,500 - $2,419.35 = $5,080.65
    const tax = calculateProgressiveTax(50_000, CA_FEDERAL_2025);
    expect(tax).toBeCloseTo(5_080.65, 0);
  });

  it("calculates federal tax correctly for $100,000 income", () => {
    // Bracket 1: $57,375 × 0.15 = $8,606.25
    // Bracket 2: ($100,000 - $57,375) × 0.205 = $42,625 × 0.205 = $8,738.13
    // Gross tax = $17,344.38
    // BPA credit = $16,129 × 0.15 = $2,419.35
    // Net tax = $14,925.03
    const tax = calculateProgressiveTax(100_000, CA_FEDERAL_2025);
    expect(tax).toBeCloseTo(14_925, 0);
  });

  it("calculates Ontario provincial tax correctly for $100,000 income", () => {
    // ON brackets:
    // $52,886 × 0.0505 = $2,670.74
    // ($100,000 - $52,886) × 0.0915 = $47,114 × 0.0915 = $4,310.93
    // Gross = $6,981.67
    // BPA credit = $11,865 × 0.0505 = $599.18
    // Net = $6,382.49
    const tax = calculateProgressiveTax(100_000, CA_ON_2025);
    expect(tax).toBeCloseTo(6_382, 0);
  });

  it("calculates combined federal + Ontario tax for $100,000", () => {
    const federal = calculateProgressiveTax(100_000, CA_FEDERAL_2025);
    const provincial = calculateProgressiveTax(100_000, CA_ON_2025);
    const combined = federal + provincial;
    // Combined should be approximately $21,307
    expect(combined).toBeCloseTo(21_307, -2); // within $100
  });

  it("calculates Alberta tax for $200,000 income", () => {
    // AB: 10% up to $148,269, 12% to $177,922, 13% to $237,230
    // $148,269 × 0.10 = $14,826.90
    // ($177,922 - $148,269) × 0.12 = $29,653 × 0.12 = $3,558.36
    // ($200,000 - $177,922) × 0.13 = $22,078 × 0.13 = $2,870.14
    // Gross = $21,255.40
    // BPA credit = $21,003 × 0.10 = $2,100.30
    // Net = $19,155.10
    const tax = calculateProgressiveTax(200_000, CA_AB_2025);
    expect(tax).toBeCloseTo(19_155, 0);
  });

  it("handles high income with top bracket correctly", () => {
    const tax = calculateProgressiveTax(500_000, CA_FEDERAL_2025);
    // Should be significantly higher than $100k income tax
    expect(tax).toBeGreaterThan(100_000);
  });

  it("ensures tax never goes negative (BPA credit capped at 0)", () => {
    // Very low income — credit should not make tax negative
    const tax = calculateProgressiveTax(5_000, CA_FEDERAL_2025);
    expect(tax).toBe(0);
  });
});

describe("calculateCanadianCapitalGainsInclusion", () => {
  it("returns 0 for zero gains", () => {
    expect(calculateCanadianCapitalGainsInclusion(0)).toBe(0);
  });

  it("returns 0 for negative gains", () => {
    expect(calculateCanadianCapitalGainsInclusion(-5000)).toBe(0);
  });

  it("applies 50% inclusion for gains under $250,000", () => {
    expect(calculateCanadianCapitalGainsInclusion(100_000)).toBe(50_000);
    expect(calculateCanadianCapitalGainsInclusion(250_000)).toBe(125_000);
  });

  it("applies 66.67% inclusion for gains above $250,000", () => {
    // First $250k at 50% = $125,000
    // Next $100k at 66.67% = $66,670 (approximately)
    const inclusion = calculateCanadianCapitalGainsInclusion(350_000);
    const expected = 250_000 * 0.5 + 100_000 * (2 / 3);
    expect(inclusion).toBeCloseTo(expected, 2);
  });

  it("handles exactly $250,000 at first tier only", () => {
    expect(calculateCanadianCapitalGainsInclusion(250_000)).toBe(125_000);
  });
});

describe("bracket table integrity", () => {
  it("federal brackets are contiguous with no gaps", () => {
    const { brackets } = CA_FEDERAL_2025;
    for (let i = 1; i < brackets.length; i++) {
      expect(brackets[i].min).toBe(brackets[i - 1].max);
    }
    expect(brackets[0].min).toBe(0);
    expect(brackets[brackets.length - 1].max).toBe(Infinity);
  });

  it("all provincial brackets are contiguous with no gaps", () => {
    const codes = ["AB", "BC", "MB", "NB", "NL", "NT", "NS", "NU", "ON", "PE", "QC", "SK", "YT"];
    for (const code of codes) {
      const { provincial } = getCanadianBrackets(code);
      expect(provincial.brackets[0].min).toBe(0);
      expect(provincial.brackets[provincial.brackets.length - 1].max).toBe(Infinity);
      for (let i = 1; i < provincial.brackets.length; i++) {
        expect(provincial.brackets[i].min).toBe(provincial.brackets[i - 1].max);
      }
    }
  });

  it("all rates are between 0 and 1", () => {
    const codes = ["AB", "BC", "MB", "NB", "NL", "NT", "NS", "NU", "ON", "PE", "QC", "SK", "YT"];
    for (const code of codes) {
      const { federal, provincial } = getCanadianBrackets(code);
      for (const b of [...federal.brackets, ...provincial.brackets]) {
        expect(b.rate).toBeGreaterThan(0);
        expect(b.rate).toBeLessThan(1);
      }
    }
  });

  it("capital gains constants are valid", () => {
    expect(CA_CAPITAL_GAINS.firstTierLimit).toBe(250_000);
    expect(CA_CAPITAL_GAINS.firstTierRate).toBe(0.5);
    expect(CA_CAPITAL_GAINS.secondTierRate).toBeCloseTo(2 / 3, 4);
  });
});
