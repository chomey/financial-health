import { describe, it, expect } from "vitest";
import { americanVehicles } from "@/lib/countries/usa/vehicles";

describe("americanVehicles", () => {
  it("lists US-specific categories", () => {
    expect(americanVehicles.categories).toEqual([
      "401k", "Roth 401k", "IRA", "Roth IRA", "529", "HSA",
    ]);
  });

  it("flagEmoji is the US flag", () => {
    expect(americanVehicles.flagEmoji).toBe("🇺🇸");
  });

  it("returns descriptions for known accounts", () => {
    expect(americanVehicles.getDescription("401k")).toMatch(/pre-tax/i);
    expect(americanVehicles.getDescription("Roth 401k")).toMatch(/after-tax/i);
    expect(americanVehicles.getDescription("IRA")).toMatch(/pre-tax/i);
    expect(americanVehicles.getDescription("Roth IRA")).toMatch(/after-tax/i);
    expect(americanVehicles.getDescription("529")).toMatch(/education/i);
    expect(americanVehicles.getDescription("HSA")).toMatch(/medical/i);
    expect(americanVehicles.getDescription("Bogus")).toBeUndefined();
  });

  it("returns 7% ROI for 401k and IRA accounts", () => {
    expect(americanVehicles.getDefaultRoi("401k")).toBe(7);
    expect(americanVehicles.getDefaultRoi("Roth 401k")).toBe(7);
    expect(americanVehicles.getDefaultRoi("IRA")).toBe(7);
    expect(americanVehicles.getDefaultRoi("Roth IRA")).toBe(7);
    expect(americanVehicles.getDefaultRoi("Bogus")).toBeUndefined();
  });

  it("returns 6% ROI for 529 and HSA", () => {
    expect(americanVehicles.getDefaultRoi("529")).toBe(6);
    expect(americanVehicles.getDefaultRoi("HSA")).toBe(6);
  });

  it("classifies Roth IRA, Roth 401k, HSA as tax-sheltered", () => {
    expect(americanVehicles.isTaxSheltered("Roth IRA")).toBe(true);
    expect(americanVehicles.isTaxSheltered("Roth 401k")).toBe(true);
    expect(americanVehicles.isTaxSheltered("HSA")).toBe(true);
    expect(americanVehicles.isTaxSheltered("401k")).toBe(false);
    expect(americanVehicles.isTaxSheltered("IRA")).toBe(false);
  });

  it("classifies 401k, IRA, 529 as tax-deferred", () => {
    expect(americanVehicles.isTaxDeferred("401k")).toBe(true);
    expect(americanVehicles.isTaxDeferred("IRA")).toBe(true);
    expect(americanVehicles.isTaxDeferred("529")).toBe(true);
    expect(americanVehicles.isTaxDeferred("Roth IRA")).toBe(false);
    expect(americanVehicles.isTaxDeferred("HSA")).toBe(false);
  });

  it("classifies Savings as income-tax ROI", () => {
    expect(americanVehicles.isIncomeTaxRoi("Savings")).toBe(true);
    expect(americanVehicles.isIncomeTaxRoi("Brokerage")).toBe(false);
    expect(americanVehicles.isIncomeTaxRoi("401k")).toBe(false);
  });

  it("classifies registered accounts and Brokerage as reinvest-default", () => {
    for (const cat of ["401k", "Roth 401k", "IRA", "Roth IRA", "529", "HSA", "Brokerage"]) {
      expect(americanVehicles.isReinvestDefault(cat)).toBe(true);
    }
    expect(americanVehicles.isReinvestDefault("Savings")).toBe(false);
  });

  it("classifies 401k and Roth 401k as employer-match-eligible", () => {
    expect(americanVehicles.isEmployerMatchEligible("401k")).toBe(true);
    expect(americanVehicles.isEmployerMatchEligible("Roth 401k")).toBe(true);
    expect(americanVehicles.isEmployerMatchEligible("IRA")).toBe(false);
    expect(americanVehicles.isEmployerMatchEligible("Roth IRA")).toBe(false);
    expect(americanVehicles.isEmployerMatchEligible("HSA")).toBe(false);
  });

  it("no overlap between tax-sheltered and tax-deferred", () => {
    for (const cat of americanVehicles.categories) {
      const sheltered = americanVehicles.isTaxSheltered(cat);
      const deferred = americanVehicles.isTaxDeferred(cat);
      expect(sheltered && deferred).toBe(false);
    }
  });
});
