import { describe, it, expect } from "vitest";
import { australianVehicles } from "@/lib/countries/australia/vehicles";

describe("australianVehicles", () => {
  it("lists AU-specific categories", () => {
    expect(australianVehicles.categories).toEqual([
      "Super (Accumulation)",
      "Super (Pension Phase)",
      "First Home Super Saver",
    ]);
  });

  it("flagEmoji is the Australian flag", () => {
    expect(australianVehicles.flagEmoji).toBe("🇦🇺");
  });

  it("returns descriptions for known accounts", () => {
    expect(australianVehicles.getDescription("Super (Accumulation)")).toMatch(/15%|salary sacrifice/i);
    expect(australianVehicles.getDescription("Super (Pension Phase)")).toMatch(/tax-free/i);
    expect(australianVehicles.getDescription("First Home Super Saver")).toMatch(/first home/i);
    expect(australianVehicles.getDescription("Bogus")).toBeUndefined();
  });

  it("returns 7% default ROI for all AU super categories", () => {
    expect(australianVehicles.getDefaultRoi("Super (Accumulation)")).toBe(7);
    expect(australianVehicles.getDefaultRoi("Super (Pension Phase)")).toBe(7);
    expect(australianVehicles.getDefaultRoi("First Home Super Saver")).toBe(7);
    expect(australianVehicles.getDefaultRoi("Bogus")).toBeUndefined();
  });

  it("classifies Super (Pension Phase) as tax-sheltered", () => {
    expect(australianVehicles.isTaxSheltered("Super (Pension Phase)")).toBe(true);
    expect(australianVehicles.isTaxSheltered("Super (Accumulation)")).toBe(false);
    expect(australianVehicles.isTaxSheltered("First Home Super Saver")).toBe(false);
  });

  it("classifies Super (Accumulation) as tax-deferred", () => {
    expect(australianVehicles.isTaxDeferred("Super (Accumulation)")).toBe(true);
    expect(australianVehicles.isTaxDeferred("Super (Pension Phase)")).toBe(false);
    expect(australianVehicles.isTaxDeferred("First Home Super Saver")).toBe(false);
  });

  it("no overlap between tax-sheltered and tax-deferred", () => {
    for (const cat of australianVehicles.categories) {
      const sheltered = australianVehicles.isTaxSheltered(cat);
      const deferred = australianVehicles.isTaxDeferred(cat);
      expect(sheltered && deferred).toBe(false);
    }
  });

  it("classifies Savings as income-tax ROI, not super categories", () => {
    expect(australianVehicles.isIncomeTaxRoi("Savings")).toBe(true);
    expect(australianVehicles.isIncomeTaxRoi("Super (Accumulation)")).toBe(false);
    expect(australianVehicles.isIncomeTaxRoi("Super (Pension Phase)")).toBe(false);
  });

  it("classifies all super categories and Brokerage as reinvest-default", () => {
    expect(australianVehicles.isReinvestDefault("Super (Accumulation)")).toBe(true);
    expect(australianVehicles.isReinvestDefault("Super (Pension Phase)")).toBe(true);
    expect(australianVehicles.isReinvestDefault("First Home Super Saver")).toBe(true);
    expect(australianVehicles.isReinvestDefault("Brokerage")).toBe(true);
    expect(australianVehicles.isReinvestDefault("Savings")).toBe(false);
  });

  it("classifies Super (Accumulation) as employer-match-eligible", () => {
    expect(australianVehicles.isEmployerMatchEligible("Super (Accumulation)")).toBe(true);
    expect(australianVehicles.isEmployerMatchEligible("Super (Pension Phase)")).toBe(false);
    expect(australianVehicles.isEmployerMatchEligible("First Home Super Saver")).toBe(false);
  });
});
