import { describe, it, expect } from "vitest";
import { canadianVehicles } from "@/lib/countries/canada/vehicles";

describe("canadianVehicles", () => {
  it("lists CA-specific categories", () => {
    expect(canadianVehicles.categories).toEqual(["TFSA", "RRSP", "RESP", "FHSA", "LIRA"]);
  });

  it("flagEmoji is the maple leaf", () => {
    expect(canadianVehicles.flagEmoji).toBe("🇨🇦");
  });

  it("returns descriptions for known accounts", () => {
    expect(canadianVehicles.getDescription("TFSA")).toMatch(/tax-free/i);
    expect(canadianVehicles.getDescription("RRSP")).toMatch(/tax-deferred|tax\s*deferred/i);
    expect(canadianVehicles.getDescription("Bogus")).toBeUndefined();
  });

  it("returns default ROI for known accounts", () => {
    expect(canadianVehicles.getDefaultRoi("TFSA")).toBe(5);
    expect(canadianVehicles.getDefaultRoi("RRSP")).toBe(5);
    expect(canadianVehicles.getDefaultRoi("Bogus")).toBeUndefined();
  });

  it("classifies TFSA and FHSA as tax-sheltered", () => {
    expect(canadianVehicles.isTaxSheltered("TFSA")).toBe(true);
    expect(canadianVehicles.isTaxSheltered("FHSA")).toBe(true);
    expect(canadianVehicles.isTaxSheltered("RRSP")).toBe(false);
  });

  it("classifies RRSP/RESP/LIRA as tax-deferred", () => {
    expect(canadianVehicles.isTaxDeferred("RRSP")).toBe(true);
    expect(canadianVehicles.isTaxDeferred("RESP")).toBe(true);
    expect(canadianVehicles.isTaxDeferred("LIRA")).toBe(true);
    expect(canadianVehicles.isTaxDeferred("TFSA")).toBe(false);
  });

  it("classifies Savings as income-tax ROI", () => {
    expect(canadianVehicles.isIncomeTaxRoi("Savings")).toBe(true);
    expect(canadianVehicles.isIncomeTaxRoi("Brokerage")).toBe(false);
  });

  it("classifies registered accounts and Brokerage as reinvest-default", () => {
    expect(canadianVehicles.isReinvestDefault("RRSP")).toBe(true);
    expect(canadianVehicles.isReinvestDefault("TFSA")).toBe(true);
    expect(canadianVehicles.isReinvestDefault("Brokerage")).toBe(true);
    expect(canadianVehicles.isReinvestDefault("Savings")).toBe(false);
  });

  it("classifies RRSP as employer-match-eligible", () => {
    expect(canadianVehicles.isEmployerMatchEligible("RRSP")).toBe(true);
    expect(canadianVehicles.isEmployerMatchEligible("TFSA")).toBe(false);
  });
});
