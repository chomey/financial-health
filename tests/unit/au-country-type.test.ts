/**
 * Task 158: Widen country type to CA | US | AU
 * Tests for AU country type support in core modules.
 */
import { describe, it, expect } from "vitest";
import {
  getHomeCurrency,
  getForeignCurrency,
  FALLBACK_RATES,
  formatCurrencyCompact,
  type SupportedCurrency,
} from "@/lib/currency";
import { getProfilesForCountry } from "@/lib/sample-profiles";
import { getBenchmarksForCountry, getNationalAverage, DATA_SOURCES } from "@/lib/benchmarks";
import { getCreditCategories, getFilingStatuses, getDefaultFilingStatus } from "@/lib/tax-credits";
import { computeTax } from "@/lib/tax-engine";
import type { FinancialState } from "@/lib/financial-types";

describe("AU country type – currency", () => {
  it("getHomeCurrency returns AUD for AU", () => {
    expect(getHomeCurrency("AU")).toBe("AUD");
  });

  it("getHomeCurrency still returns CAD for CA", () => {
    expect(getHomeCurrency("CA")).toBe("CAD");
  });

  it("getHomeCurrency still returns USD for US", () => {
    expect(getHomeCurrency("US")).toBe("USD");
  });

  it("getForeignCurrency returns USD for AUD", () => {
    expect(getForeignCurrency("AUD")).toBe("USD");
  });

  it("getForeignCurrency still returns USD for CAD", () => {
    expect(getForeignCurrency("CAD")).toBe("USD");
  });

  it("getForeignCurrency still returns CAD for USD", () => {
    expect(getForeignCurrency("USD")).toBe("CAD");
  });

  it("AUD is a valid SupportedCurrency", () => {
    const currency: SupportedCurrency = "AUD";
    expect(currency).toBe("AUD");
  });
});

describe("AU country type – FX rates", () => {
  it("FALLBACK_RATES includes AUD_USD", () => {
    expect(FALLBACK_RATES["AUD_USD"]).toBeGreaterThan(0);
    expect(FALLBACK_RATES["AUD_USD"]).toBeLessThan(1);
  });

  it("FALLBACK_RATES includes USD_AUD", () => {
    expect(FALLBACK_RATES["USD_AUD"]).toBeGreaterThan(1);
  });

  it("FALLBACK_RATES includes AUD_CAD", () => {
    expect(FALLBACK_RATES["AUD_CAD"]).toBeGreaterThan(0);
  });

  it("FALLBACK_RATES includes CAD_AUD", () => {
    expect(FALLBACK_RATES["CAD_AUD"]).toBeGreaterThan(0);
  });

  it("AUD_USD and USD_AUD are reciprocals (approx)", () => {
    const aud2usd = FALLBACK_RATES["AUD_USD"];
    const usd2aud = FALLBACK_RATES["USD_AUD"];
    expect(Math.abs(aud2usd * usd2aud - 1)).toBeLessThan(0.05);
  });
});

describe("AU country type – compact currency format", () => {
  it("formats foreign AUD with AU$ prefix", () => {
    const result = formatCurrencyCompact(50000, "AUD", "CAD");
    expect(result).toBe("AU$50k");
  });

  it("formats home AUD as plain $", () => {
    const result = formatCurrencyCompact(50000, "AUD", "AUD");
    expect(result).toBe("$50k");
  });
});

describe("AU country type – profiles", () => {
  it("getProfilesForCountry accepts AU without throwing", () => {
    expect(() => getProfilesForCountry("AU")).not.toThrow();
  });

  it("returns an array for AU (falls back to CA profiles)", () => {
    const profiles = getProfilesForCountry("AU");
    expect(Array.isArray(profiles)).toBe(true);
    expect(profiles.length).toBeGreaterThan(0);
  });

  it("still returns CA profiles for CA", () => {
    const ca = getProfilesForCountry("CA");
    const au = getProfilesForCountry("AU");
    expect(ca.length).toBe(au.length); // same fallback
  });
});

describe("AU country type – benchmarks", () => {
  it("getBenchmarksForCountry accepts AU", () => {
    const benchmarks = getBenchmarksForCountry("AU");
    expect(Array.isArray(benchmarks)).toBe(true);
    expect(benchmarks.length).toBeGreaterThan(0);
  });

  it("getNationalAverage accepts AU", () => {
    const avg = getNationalAverage("AU");
    expect(avg).toBeDefined();
    expect(avg.netWorth).toBeGreaterThan(0);
  });

  it("DATA_SOURCES includes AU entry", () => {
    expect(DATA_SOURCES.AU).toBeTruthy();
    expect(DATA_SOURCES.AU).toContain("Australian");
  });
});

describe("AU country type – tax credits", () => {
  it("getCreditCategories returns AU credits", () => {
    const credits = getCreditCategories("AU", 2025);
    expect(Array.isArray(credits)).toBe(true);
    expect(credits.length).toBeGreaterThan(0);
    expect(credits.every((c) => c.jurisdiction === "AU")).toBe(true);
  });

  it("getFilingStatuses accepts AU and returns defaults", () => {
    const statuses = getFilingStatuses("AU");
    expect(Array.isArray(statuses)).toBe(true);
    expect(statuses.length).toBeGreaterThan(0);
  });

  it("getDefaultFilingStatus accepts AU", () => {
    const status = getDefaultFilingStatus("AU");
    expect(status).toBe("single");
  });
});

describe("AU country type – tax engine", () => {
  it("computeTax for AU computes real federal tax + Medicare Levy", () => {
    const result = computeTax(80000, "employment", "AU", "NSW", 2025);
    // $80k: 0% on first $18,200 + 16% on $18,200-$45,000 + 30% on $45,000-$80,000
    // = 0 + 4,288 + 10,500 = $14,788 federal
    // Medicare: $80k > $32,500 shade-out → full 2% = $1,600
    // Total: $16,388
    expect(result.federalTax).toBeCloseTo(14_788, 0);
    expect(result.totalTax).toBeCloseTo(16_388, 0);
    expect(result.provincialStateTax).toBe(0);
    expect(result.effectiveRate).toBeCloseTo(16_388 / 80_000, 4);
    expect(result.afterTaxIncome).toBeCloseTo(63_612, 0);
  });

  it("computeTax for AU with income below tax-free threshold", () => {
    const result = computeTax(15000, "employment", "AU", "NSW", 2025);
    expect(result.federalTax).toBe(0);
    expect(result.totalTax).toBe(0);
    expect(result.afterTaxIncome).toBe(15000);
  });

  it("computeTax for CA still works correctly after AU changes", () => {
    const result = computeTax(80000, "employment", "CA", "ON", 2025);
    expect(result.totalTax).toBeGreaterThan(0);
    expect(result.afterTaxIncome).toBeLessThan(80000);
  });

  it("computeTax for US still works correctly after AU changes", () => {
    const result = computeTax(80000, "employment", "US", "CA", 2025);
    expect(result.totalTax).toBeGreaterThan(0);
    expect(result.afterTaxIncome).toBeLessThan(80000);
  });
});

describe("AU country type – FinancialState", () => {
  it("FinancialState accepts AU as country", () => {
    const state: FinancialState = {
      assets: [],
      debts: [],
      income: [],
      expenses: [],
      properties: [],
      stocks: [],
      country: "AU",
      jurisdiction: "NSW",
    };
    expect(state.country).toBe("AU");
  });
});
