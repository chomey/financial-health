import { describe, it, expect } from "vitest";
import { computeTax } from "@/lib/tax-engine";
import type { TaxResult } from "@/lib/tax-engine";

// Helper to check TaxResult shape
function expectValidResult(result: TaxResult) {
  expect(result.federalTax).toBeGreaterThanOrEqual(0);
  expect(result.provincialStateTax).toBeGreaterThanOrEqual(0);
  expect(result.totalTax).toBeGreaterThanOrEqual(0);
  expect(result.effectiveRate).toBeGreaterThanOrEqual(0);
  expect(result.effectiveRate).toBeLessThanOrEqual(1);
  expect(result.marginalRate).toBeGreaterThanOrEqual(0);
  expect(result.afterTaxIncome).toBeLessThanOrEqual(result.afterTaxIncome + result.totalTax);
  // totalTax = federal + provincial/state
  expect(result.totalTax).toBeCloseTo(result.federalTax + result.provincialStateTax, 2);
  // afterTaxIncome = income - totalTax (for positive income)
}

// ═══════════════════════════════════════════════════════════════════════════════
// Edge Cases
// ═══════════════════════════════════════════════════════════════════════════════

describe("computeTax — edge cases", () => {
  it("returns all zeros for zero income", () => {
    const result = computeTax(0, "employment", "CA", "ON");
    expect(result.federalTax).toBe(0);
    expect(result.provincialStateTax).toBe(0);
    expect(result.totalTax).toBe(0);
    expect(result.effectiveRate).toBe(0);
    expect(result.afterTaxIncome).toBe(0);
    expect(result.marginalRate).toBe(0);
  });

  it("returns all zeros for negative income", () => {
    const result = computeTax(-50_000, "employment", "CA", "ON");
    expect(result.totalTax).toBe(0);
    expect(result.afterTaxIncome).toBe(0);
  });

  it("returns all zeros for zero income (US)", () => {
    const result = computeTax(0, "employment", "US", "CA");
    expect(result.totalTax).toBe(0);
    expect(result.afterTaxIncome).toBe(0);
  });

  it("returns all zeros for negative income (US)", () => {
    const result = computeTax(-10_000, "capital-gains", "US", "NY");
    expect(result.totalTax).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Canadian Employment Income
// ═══════════════════════════════════════════════════════════════════════════════

describe("computeTax — Canadian employment income", () => {
  it("computes tax for $50,000 income in Ontario", () => {
    const result = computeTax(50_000, "employment", "CA", "ON");
    expectValidResult(result);

    // Federal: $50,000 in first bracket (15%), BPA credit = $16,129 × 0.15
    // Net federal ≈ $5,081
    expect(result.federalTax).toBeCloseTo(5_081, -1);

    // Provincial ON: $50,000 in first bracket (5.05%), BPA credit = $11,865 × 0.0505
    // Net provincial ≈ $1,926
    expect(result.provincialStateTax).toBeCloseTo(1_926, -1);

    expect(result.afterTaxIncome).toBeCloseTo(50_000 - result.totalTax, 2);
    expect(result.effectiveRate).toBeCloseTo(result.totalTax / 50_000, 4);
  });

  it("computes tax for $100,000 income in Ontario", () => {
    const result = computeTax(100_000, "employment", "CA", "ON");
    expectValidResult(result);

    // Combined federal + ON ≈ $21,307
    expect(result.totalTax).toBeCloseTo(21_307, -2);
    expect(result.afterTaxIncome).toBeCloseTo(100_000 - result.totalTax, 2);
  });

  it("computes tax for $100,000 income in Alberta", () => {
    const result = computeTax(100_000, "employment", "CA", "AB");
    expectValidResult(result);

    // Federal ≈ $14,925
    expect(result.federalTax).toBeCloseTo(14_925, -1);

    // AB: $100,000 in first bracket (10%), BPA credit = $21,003 × 0.10
    // Gross = $10,000, credit = $2,100.30, net ≈ $7,900
    expect(result.provincialStateTax).toBeCloseTo(7_900, -1);
  });

  it("computes tax for $200,000 income in BC", () => {
    const result = computeTax(200_000, "employment", "CA", "BC");
    expectValidResult(result);

    // Should have significant federal and provincial tax
    expect(result.federalTax).toBeGreaterThan(20_000);
    expect(result.provincialStateTax).toBeGreaterThan(10_000);
    expect(result.effectiveRate).toBeGreaterThan(0.25);
  });

  it("computes tax for $500,000 income in Quebec", () => {
    const result = computeTax(500_000, "employment", "CA", "QC");
    expectValidResult(result);

    // Very high income — combined rate should be significant
    expect(result.totalTax).toBeGreaterThan(200_000);
    expect(result.effectiveRate).toBeGreaterThan(0.40);
    expect(result.marginalRate).toBeGreaterThan(0.50);
  });

  it("returns zero tax for income below basic personal amount", () => {
    // Federal BPA = $16,129, ON BPA = $11,865
    // At $10,000: federal credit > tax, ON credit > tax
    const result = computeTax(10_000, "employment", "CA", "ON");
    expect(result.federalTax).toBe(0);
    expect(result.provincialStateTax).toBe(0);
    expect(result.totalTax).toBe(0);
    expect(result.afterTaxIncome).toBe(10_000);
  });

  it("treats 'other' income same as employment for Canadian tax", () => {
    const employment = computeTax(80_000, "employment", "CA", "ON");
    const other = computeTax(80_000, "other", "CA", "ON");
    expect(employment.totalTax).toBeCloseTo(other.totalTax, 2);
    expect(employment.federalTax).toBeCloseTo(other.federalTax, 2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Canadian Capital Gains
// ═══════════════════════════════════════════════════════════════════════════════

describe("computeTax — Canadian capital gains", () => {
  it("applies 50% inclusion for gains under $250,000", () => {
    const gains = computeTax(100_000, "capital-gains", "CA", "ON");
    const employment = computeTax(100_000, "employment", "CA", "ON");

    // Capital gains tax should be lower due to 50% inclusion
    expect(gains.totalTax).toBeLessThan(employment.totalTax);

    // Tax on $100k capital gains = tax on $50k taxable income
    const taxOn50k = computeTax(50_000, "employment", "CA", "ON");
    expect(gains.totalTax).toBeCloseTo(taxOn50k.totalTax, 0);
  });

  it("applies higher inclusion rate above $250,000", () => {
    const result = computeTax(400_000, "capital-gains", "CA", "ON");
    expectValidResult(result);

    // Taxable = $250k × 50% + $150k × 66.67% = $125k + $100k = $225k
    const taxOn225k = computeTax(225_000, "employment", "CA", "ON");
    expect(result.totalTax).toBeCloseTo(taxOn225k.totalTax, 0);
  });

  it("has lower effective rate than employment income", () => {
    const gains = computeTax(200_000, "capital-gains", "CA", "BC");
    const employment = computeTax(200_000, "employment", "CA", "BC");

    expect(gains.effectiveRate).toBeLessThan(employment.effectiveRate);
  });

  it("adjusts marginal rate by inclusion rate", () => {
    const result = computeTax(100_000, "capital-gains", "CA", "ON");
    // For gains <= $250k, marginal rate should be roughly half of
    // what it would be for employment income at the same taxable income ($50k)
    const employment = computeTax(50_000, "employment", "CA", "ON");
    // The employment marginal is at the $50k bracket level
    // The capital gains marginal should be approx employment marginal * 0.5
    expect(result.marginalRate).toBeCloseTo(employment.marginalRate * 0.5, 2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// US Employment Income
// ═══════════════════════════════════════════════════════════════════════════════

describe("computeTax — US employment income", () => {
  it("computes tax for $50,000 income in California", () => {
    const result = computeTax(50_000, "employment", "US", "CA");
    expectValidResult(result);

    // Federal: $50k - $15k deduction = $35k taxable
    // Bracket 1: $11,925 × 10% = $1,192.50
    // Bracket 2: ($35,000 - $11,925) × 12% = $23,075 × 0.12 = $2,769
    // Federal ≈ $3,962
    expect(result.federalTax).toBeCloseTo(3_962, -1);

    // CA state tax on $50k (no standard deduction in our tables):
    // Applied at graduated rates
    expect(result.provincialStateTax).toBeGreaterThan(0);
  });

  it("computes tax for $100,000 income in New York", () => {
    const result = computeTax(100_000, "employment", "US", "NY");
    expectValidResult(result);

    // Federal: $100k - $15k = $85k taxable
    // Should be less than calculateProgressiveTax($100k) since deduction is applied
    expect(result.federalTax).toBeGreaterThan(10_000);
    expect(result.federalTax).toBeLessThan(16_000);

    // NY state tax ≈ $5,432
    expect(result.provincialStateTax).toBeCloseTo(5_432, -1);
  });

  it("computes zero state tax for Texas (no state income tax)", () => {
    const result = computeTax(100_000, "employment", "US", "TX");
    expectValidResult(result);

    expect(result.provincialStateTax).toBe(0);
    expect(result.totalTax).toBe(result.federalTax);
  });

  it("computes zero state tax for Florida", () => {
    const result = computeTax(150_000, "employment", "US", "FL");
    expect(result.provincialStateTax).toBe(0);
  });

  it("returns zero federal tax for income at or below standard deduction", () => {
    const result = computeTax(15_000, "employment", "US", "TX");
    // $15k - $15k deduction = $0 taxable → $0 federal tax
    expect(result.federalTax).toBe(0);
  });

  it("returns zero federal tax for income below standard deduction", () => {
    const result = computeTax(10_000, "employment", "US", "TX");
    expect(result.federalTax).toBe(0);
    expect(result.afterTaxIncome).toBe(10_000);
  });

  it("handles very high US income correctly", () => {
    const result = computeTax(1_000_000, "employment", "US", "CA");
    expectValidResult(result);

    // Should have substantial tax
    expect(result.totalTax).toBeGreaterThan(300_000);
    expect(result.effectiveRate).toBeGreaterThan(0.30);
    // CA has 13.3% top rate + 37% federal top
    expect(result.marginalRate).toBeGreaterThan(0.45);
  });

  it("treats 'other' income same as employment for US tax", () => {
    const employment = computeTax(80_000, "employment", "US", "NY");
    const other = computeTax(80_000, "other", "US", "NY");
    expect(employment.totalTax).toBeCloseTo(other.totalTax, 2);
  });

  it("applies standard deduction correctly — US vs raw progressive calc", () => {
    // The US tax engine should apply standard deduction as a deduction from income,
    // not as a credit. So $50k income should have lower federal tax than
    // calculateProgressiveTax($50k, US_FEDERAL) which uses credit approach.
    const result = computeTax(50_000, "employment", "US", "TX");
    // Taxable = $50k - $15k = $35k
    // Tax on $35k: $11,925 × 10% + ($35k - $11,925) × 12%
    // = $1,192.50 + $2,769 = $3,961.50
    expect(result.federalTax).toBeCloseTo(3_961.50, 0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// US Capital Gains
// ═══════════════════════════════════════════════════════════════════════════════

describe("computeTax — US capital gains", () => {
  it("applies 0% rate for gains under $48,350", () => {
    const result = computeTax(40_000, "capital-gains", "US", "TX");
    // Federal: $0 (below 0% threshold)
    // TX: $0 (no state tax)
    expect(result.federalTax).toBe(0);
    expect(result.totalTax).toBe(0);
  });

  it("applies 15% rate for gains between thresholds", () => {
    const result = computeTax(100_000, "capital-gains", "US", "TX");
    // Federal: $48,350 × 0% + ($100k - $48,350) × 15% = $7,747.50
    expect(result.federalTax).toBeCloseTo(7_747.5, 0);
    expect(result.provincialStateTax).toBe(0);
  });

  it("capital gains have lower federal tax than employment", () => {
    const gains = computeTax(200_000, "capital-gains", "US", "CA");
    const employment = computeTax(200_000, "employment", "US", "CA");

    expect(gains.federalTax).toBeLessThan(employment.federalTax);
  });

  it("states tax capital gains as ordinary income", () => {
    const gains = computeTax(100_000, "capital-gains", "US", "CA");
    // CA state should still tax capital gains (as ordinary income)
    expect(gains.provincialStateTax).toBeGreaterThan(0);
  });

  it("no state tax on capital gains in no-tax states", () => {
    const noTaxStates = ["AK", "FL", "NV", "NH", "SD", "TN", "TX", "WA", "WY"];
    for (const state of noTaxStates) {
      const result = computeTax(100_000, "capital-gains", "US", state);
      expect(result.provincialStateTax).toBe(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Cross-Country Comparisons
// ═══════════════════════════════════════════════════════════════════════════════

describe("computeTax — cross-country", () => {
  it("afterTaxIncome = income - totalTax for all scenarios", () => {
    const scenarios: [number, "employment" | "capital-gains", "CA" | "US", string][] = [
      [50_000, "employment", "CA", "ON"],
      [100_000, "employment", "CA", "BC"],
      [200_000, "capital-gains", "CA", "AB"],
      [75_000, "employment", "US", "NY"],
      [150_000, "employment", "US", "TX"],
      [100_000, "capital-gains", "US", "CA"],
    ];

    for (const [income, type, country, jurisdiction] of scenarios) {
      const result = computeTax(income, type, country, jurisdiction);
      expect(result.afterTaxIncome).toBeCloseTo(income - result.totalTax, 2);
    }
  });

  it("effectiveRate = totalTax / income for all scenarios", () => {
    const scenarios: [number, "employment" | "capital-gains", "CA" | "US", string][] = [
      [80_000, "employment", "CA", "ON"],
      [120_000, "employment", "US", "CA"],
      [200_000, "capital-gains", "CA", "QC"],
    ];

    for (const [income, type, country, jurisdiction] of scenarios) {
      const result = computeTax(income, type, country, jurisdiction);
      expect(result.effectiveRate).toBeCloseTo(result.totalTax / income, 4);
    }
  });

  it("marginal rate is always >= effective rate", () => {
    const scenarios: [number, "employment" | "capital-gains", "CA" | "US", string][] = [
      [50_000, "employment", "CA", "ON"],
      [100_000, "employment", "US", "NY"],
      [200_000, "capital-gains", "CA", "BC"],
      [300_000, "employment", "US", "CA"],
    ];

    for (const [income, type, country, jurisdiction] of scenarios) {
      const result = computeTax(income, type, country, jurisdiction);
      if (result.totalTax > 0) {
        expect(result.marginalRate).toBeGreaterThanOrEqual(result.effectiveRate - 0.001);
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Error Handling
// ═══════════════════════════════════════════════════════════════════════════════

describe("computeTax — error handling", () => {
  it("throws for invalid Canadian province", () => {
    expect(() => computeTax(50_000, "employment", "CA", "XX")).toThrow(
      "Unknown Canadian province/territory code"
    );
  });

  it("throws for invalid US state", () => {
    expect(() => computeTax(50_000, "employment", "US", "XX")).toThrow(
      "Unknown US state code"
    );
  });
});
