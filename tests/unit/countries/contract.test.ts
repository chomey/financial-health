import { describe, it, expect } from "vitest";
import { getRegisteredCountries } from "@/lib/countries";

describe("CountryProfile contract", () => {
  for (const profile of getRegisteredCountries()) {
    describe(profile.code, () => {
      it("homeCurrency is in SupportedCurrency", () => {
        expect(["CAD", "USD", "AUD", "GBP"]).toContain(profile.homeCurrency);
      });

      it("locale is a recognised BCP-47 tag", () => {
        expect(() => new Intl.NumberFormat(profile.locale)).not.toThrow();
      });

      it("defaultJurisdiction appears in jurisdictions", () => {
        expect(profile.jurisdictions.map((j) => j.code)).toContain(profile.defaultJurisdiction);
      });

      it("defaultFilingStatus appears in filingStatuses", () => {
        expect(profile.filingStatuses.map((f) => f.value)).toContain(profile.defaultFilingStatus);
      });

      it("vehicles.categories non-empty", () => {
        expect(profile.vehicles.categories.length).toBeGreaterThan(0);
      });

      it("zero income → zero tax", () => {
        const r = profile.taxEngine.computeTax(0, "employment", profile.defaultJurisdiction, 2025);
        expect(r.totalTax).toBe(0);
        expect(r.afterTaxIncome).toBe(0);
      });

      it("breakdown sums to totalTax (within rounding)", () => {
        const r = profile.taxEngine.computeTax(80_000, "employment", profile.defaultJurisdiction, 2025);
        const sum = r.breakdown.reduce((acc, b) => acc + b.amount, 0);
        expect(sum).toBeCloseTo(r.totalTax, 0);
      });

      it("marginalRate is between 0 and 1", () => {
        const r = profile.taxEngine.computeTax(80_000, "employment", profile.defaultJurisdiction, 2025);
        expect(r.marginalRate).toBeGreaterThanOrEqual(0);
        expect(r.marginalRate).toBeLessThanOrEqual(1);
      });

      it("effectiveRate <= marginalRate at sample income", () => {
        const r = profile.taxEngine.computeTax(80_000, "employment", profile.defaultJurisdiction, 2025);
        expect(r.effectiveRate).toBeLessThanOrEqual(r.marginalRate + 0.0001);
      });

      it("taxYearLabel returns non-empty string", () => {
        expect(profile.taxYearLabel(2025).length).toBeGreaterThan(0);
      });
    });
  }
});
