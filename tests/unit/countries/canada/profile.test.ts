import { describe, it, expect } from "vitest";
import { getCountry } from "@/lib/countries";

describe("CANADA CountryProfile", () => {
  it("registers and resolves via getCountry", () => {
    const ca = getCountry("CA");
    expect(ca.code).toBe("CA");
    expect(ca.displayName).toBe("Canada");
    expect(ca.homeCurrency).toBe("CAD");
    expect(ca.locale).toBe("en-CA");
    expect(ca.defaultJurisdiction).toBe("ON");
  });

  it("has all 13 provinces and territories", () => {
    const ca = getCountry("CA");
    expect(ca.jurisdictions).toHaveLength(13);
    const codes = ca.jurisdictions.map((j) => j.code);
    for (const code of ["AB", "BC", "MB", "NB", "NL", "NT", "NS", "NU", "ON", "PE", "QC", "SK", "YT"]) {
      expect(codes).toContain(code);
    }
  });

  it("has correct filing statuses", () => {
    const ca = getCountry("CA");
    const values = ca.filingStatuses.map((f) => f.value);
    expect(values).toContain("single");
    expect(values).toContain("married-common-law");
    expect(ca.defaultFilingStatus).toBe("single");
  });

  it("has calendar tax year boundary", () => {
    const ca = getCountry("CA");
    expect(ca.taxYearBoundary).toEqual({ startMonth: 1, startDay: 1 });
    expect(ca.taxYearLabel(2025)).toBe("2025");
    expect(ca.taxYearLabel(2026)).toBe("2026");
  });

  it("has all 6 plugin instances", () => {
    const ca = getCountry("CA");
    expect(ca.taxEngine).toBeDefined();
    expect(ca.vehicles.categories).toContain("TFSA");
    expect(ca.governmentRetirement).toBeDefined();
    expect(ca.taxCredits).toBeDefined();
    expect(ca.profiles.samples.length).toBeGreaterThan(0);
    expect(ca.insights).toBeDefined();
  });
});
