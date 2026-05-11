import { describe, it, expect } from "vitest";
import { USA } from "@/lib/countries/usa";
import { getCountry, getRegisteredCountries } from "@/lib/countries";

describe("USA CountryProfile", () => {
  it("has correct metadata", () => {
    expect(USA.code).toBe("US");
    expect(USA.displayName).toBe("United States");
    expect(USA.shortLabel).toBe("USA");
    expect(USA.flagEmoji).toBe("🇺🇸");
    expect(USA.homeCurrency).toBe("USD");
    expect(USA.locale).toBe("en-US");
  });

  it("has 51 jurisdictions (50 states + DC)", () => {
    expect(USA.jurisdictions).toHaveLength(51);
  });

  it("includes all 50 states and DC", () => {
    const codes = USA.jurisdictions.map((j) => j.code);
    expect(codes).toContain("CA");
    expect(codes).toContain("TX");
    expect(codes).toContain("NY");
    expect(codes).toContain("FL");
    expect(codes).toContain("DC");
    expect(codes).toContain("AK");
    expect(codes).toContain("HI");
    expect(codes).toContain("WY");
  });

  it("has defaultJurisdiction CA", () => {
    expect(USA.defaultJurisdiction).toBe("CA");
    const codes = USA.jurisdictions.map((j) => j.code);
    expect(codes).toContain(USA.defaultJurisdiction);
  });

  it("has four filing statuses", () => {
    expect(USA.filingStatuses).toHaveLength(4);
    const values = USA.filingStatuses.map((f) => f.value);
    expect(values).toContain("single");
    expect(values).toContain("married-jointly");
    expect(values).toContain("married-separately");
    expect(values).toContain("head-of-household");
  });

  it("has defaultFilingStatus single", () => {
    expect(USA.defaultFilingStatus).toBe("single");
  });

  it("taxYearLabel returns String(year)", () => {
    expect(USA.taxYearLabel(2025)).toBe("2025");
    expect(USA.taxYearLabel(2026)).toBe("2026");
  });

  it("has calendar tax year boundary", () => {
    expect(USA.taxYearBoundary).toEqual({ startMonth: 1, startDay: 1 });
  });

  it("has all required plugins wired", () => {
    expect(USA.taxEngine).toBeDefined();
    expect(USA.vehicles).toBeDefined();
    expect(USA.governmentRetirement).toBeDefined();
    expect(USA.taxCredits).toBeDefined();
    expect(USA.profiles).toBeDefined();
    expect(USA.insights).toBeDefined();
  });

  it("is registered in the country registry", () => {
    const profile = getCountry("US");
    expect(profile.code).toBe("US");
  });

  it("appears in getRegisteredCountries()", () => {
    const countries = getRegisteredCountries();
    const us = countries.find((c) => c.code === "US");
    expect(us).toBeDefined();
    expect(us?.displayName).toBe("United States");
  });
});
