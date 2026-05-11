/**
 * Tests for the new TaxResult shape introduced in Ralph task 219:
 * - `federalTax`/`provincialStateTax` removed
 * - `breakdown` is the single source of truth, required and non-empty
 *   for any positive income
 *
 * The dispatcher in `src/lib/tax-engine.ts` must populate `breakdown` for
 * every country it routes to.
 */

import { describe, it, expect } from "vitest";
import { computeTax } from "@/lib/tax-engine";

describe("computeTax breakdown — Canada", () => {
  it("populates Federal Tax (income-tax) and Provincial Tax (sub-federal)", () => {
    const result = computeTax(100_000, "employment", "CA", "ON", 2025);

    expect(result.breakdown).toHaveLength(2);
    const federal = result.breakdown.find((b) => b.kind === "income-tax");
    const provincial = result.breakdown.find((b) => b.kind === "sub-federal");

    expect(federal?.label).toBe("Federal Tax");
    expect(federal?.amount).toBeGreaterThan(0);
    expect(provincial?.label).toBe("Provincial Tax");
    expect(provincial?.amount).toBeGreaterThan(0);
    expect((federal?.amount ?? 0) + (provincial?.amount ?? 0)).toBeCloseTo(
      result.totalTax,
      2
    );
  });

  it("returns empty breakdown for zero income", () => {
    const result = computeTax(0, "employment", "CA", "ON", 2025);
    expect(result.breakdown).toEqual([]);
  });
});

describe("computeTax breakdown — USA", () => {
  it("populates Federal Tax (income-tax) and State Tax (sub-federal)", () => {
    const result = computeTax(100_000, "employment", "US", "CA", 2025);

    expect(result.breakdown).toHaveLength(2);
    const federal = result.breakdown.find((b) => b.kind === "income-tax");
    const state = result.breakdown.find((b) => b.kind === "sub-federal");

    expect(federal?.label).toBe("Federal Tax");
    expect(federal?.amount).toBeGreaterThan(0);
    expect(state?.label).toBe("State Tax");
    expect(state?.amount).toBeGreaterThan(0);
    expect((federal?.amount ?? 0) + (state?.amount ?? 0)).toBeCloseTo(
      result.totalTax,
      2
    );
  });

  it("State Tax line is $0 for no-income-tax states", () => {
    const result = computeTax(100_000, "employment", "US", "TX", 2025);
    const state = result.breakdown.find((b) => b.kind === "sub-federal");
    expect(state?.amount).toBe(0);
  });

  it("populates breakdown for capital gains too", () => {
    const result = computeTax(100_000, "capital-gains", "US", "CA", 2025);
    expect(result.breakdown).toHaveLength(2);
    const federal = result.breakdown.find((b) => b.kind === "income-tax");
    const state = result.breakdown.find((b) => b.kind === "sub-federal");
    expect((federal?.amount ?? 0) + (state?.amount ?? 0)).toBeCloseTo(
      result.totalTax,
      2
    );
  });
});

describe("computeTax breakdown — Australia", () => {
  it("populates Income Tax (income-tax) and Medicare Levy (social)", () => {
    const result = computeTax(100_000, "employment", "AU", "NSW", 2025);

    expect(result.breakdown).toHaveLength(2);
    const income = result.breakdown.find((b) => b.kind === "income-tax");
    const medicare = result.breakdown.find((b) => b.kind === "social");

    expect(income?.label).toBe("Income Tax");
    expect(income?.amount).toBeGreaterThan(0);
    expect(medicare?.label).toBe("Medicare Levy");
    expect(medicare?.amount).toBeCloseTo(2_000, 0);
    expect((income?.amount ?? 0) + (medicare?.amount ?? 0)).toBeCloseTo(
      result.totalTax,
      2
    );
  });

  it("breakdown has no sub-federal line for AU (no state income tax)", () => {
    const result = computeTax(100_000, "employment", "AU", "VIC", 2025);
    const subFederal = result.breakdown.find((b) => b.kind === "sub-federal");
    expect(subFederal).toBeUndefined();
  });
});
