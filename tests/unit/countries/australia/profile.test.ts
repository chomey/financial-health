import { describe, it, expect } from "vitest";
import { getCountry } from "@/lib/countries";

describe("AUSTRALIA CountryProfile", () => {
  it("registers and resolves via getCountry", () => {
    const au = getCountry("AU");
    expect(au.code).toBe("AU");
    expect(au.displayName).toBe("Australia");
    expect(au.homeCurrency).toBe("AUD");
    expect(au.locale).toBe("en-AU");
    expect(au.defaultJurisdiction).toBe("NSW");
  });

  it("has all 8 states and territories", () => {
    const au = getCountry("AU");
    expect(au.jurisdictions).toHaveLength(8);
    const codes = au.jurisdictions.map((j) => j.code);
    for (const code of ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"]) {
      expect(codes).toContain(code);
    }
  });

  it("has correct filing statuses", () => {
    const au = getCountry("AU");
    const values = au.filingStatuses.map((f) => f.value);
    expect(values).toContain("single");
    expect(values).toContain("married-de-facto");
    expect(au.filingStatuses).toHaveLength(2);
    expect(au.defaultFilingStatus).toBe("single");
  });

  it("has fiscal year boundary starting July 1", () => {
    const au = getCountry("AU");
    expect(au.taxYearBoundary).toEqual({ startMonth: 7, startDay: 1 });
  });

  it("formats tax year label correctly", () => {
    const au = getCountry("AU");
    expect(au.taxYearLabel(2025)).toBe("2024/25 FY");
    expect(au.taxYearLabel(2026)).toBe("2025/26 FY");
    expect(au.taxYearLabel(2030)).toBe("2029/30 FY");
  });

  it("has all plugin instances", () => {
    const au = getCountry("AU");
    expect(au.taxEngine).toBeDefined();
    expect(au.vehicles).toBeDefined();
    expect(au.governmentRetirement).toBeDefined();
    expect(au.taxCredits).toBeDefined();
    expect(au.profiles).toBeDefined();
    expect(au.insights).toBeDefined();
  });

  it("NSW is included in jurisdictions list", () => {
    const au = getCountry("AU");
    const nsw = au.jurisdictions.find((j) => j.code === "NSW");
    expect(nsw).toBeDefined();
    expect(nsw?.name).toBe("New South Wales");
  });
});
