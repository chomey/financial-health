import { describe, it, expect } from "vitest";
import {
  getAccountTypeDescription,
  getAllCategorySuggestions,
  getGroupedCategorySuggestions,
  getAssetCategoryFlag,
  getDefaultRoi,
  getDefaultRoiTaxTreatment,
  shouldShowRoiTaxToggle,
  getDefaultReinvest,
} from "@/components/AssetEntry";

describe("getAccountTypeDescription — delegates to country plugins", () => {
  it("returns CA descriptions from canadianVehicles", () => {
    expect(getAccountTypeDescription("TFSA")).toContain("$7,000");
    expect(getAccountTypeDescription("RRSP")).toContain("Tax-deferred");
    expect(getAccountTypeDescription("RESP")).toContain("Education");
    expect(getAccountTypeDescription("FHSA")).toContain("first home");
    expect(getAccountTypeDescription("LIRA")).toContain("Locked-in");
  });

  it("returns US descriptions from americanVehicles", () => {
    expect(getAccountTypeDescription("401k")).toContain("Employer-sponsored");
    expect(getAccountTypeDescription("Roth IRA")).toContain("income limits");
    expect(getAccountTypeDescription("HSA")).toContain("Triple tax");
    expect(getAccountTypeDescription("529")).toContain("Education");
  });

  it("returns AU descriptions from australianVehicles", () => {
    expect(getAccountTypeDescription("Super (Accumulation)")).toContain("15%");
    expect(getAccountTypeDescription("Super (Pension Phase)")).toContain("Tax-free");
    expect(getAccountTypeDescription("First Home Super Saver")).toContain("$50,000");
  });

  it("returns undefined for universal/unknown categories", () => {
    expect(getAccountTypeDescription("Savings")).toBeUndefined();
    expect(getAccountTypeDescription("Brokerage")).toBeUndefined();
    expect(getAccountTypeDescription("Other")).toBeUndefined();
  });
});

describe("getDefaultRoi — country plugins + universal fallback", () => {
  it("returns country-specific ROI from plugins", () => {
    expect(getDefaultRoi("TFSA")).toBe(5);
    expect(getDefaultRoi("RRSP")).toBe(5);
    expect(getDefaultRoi("401k")).toBe(7);
    expect(getDefaultRoi("Roth IRA")).toBe(7);
    expect(getDefaultRoi("Super (Accumulation)")).toBe(7);
  });

  it("returns universal fallback ROI for generic categories", () => {
    expect(getDefaultRoi("Savings")).toBe(2);
    expect(getDefaultRoi("Savings Account")).toBe(2);
    expect(getDefaultRoi("Checking")).toBe(0.5);
    expect(getDefaultRoi("Brokerage")).toBe(7);
  });

  it("returns undefined for unknown categories", () => {
    expect(getDefaultRoi("Other")).toBeUndefined();
    expect(getDefaultRoi("Custom")).toBeUndefined();
  });
});

describe("getDefaultRoiTaxTreatment — delegates to plugin isIncomeTaxRoi", () => {
  it("returns income for savings-type categories", () => {
    expect(getDefaultRoiTaxTreatment("Savings")).toBe("income");
    expect(getDefaultRoiTaxTreatment("Savings Account")).toBe("income");
    expect(getDefaultRoiTaxTreatment("Checking")).toBe("income");
    expect(getDefaultRoiTaxTreatment("GIC")).toBe("income");
    expect(getDefaultRoiTaxTreatment("HISA")).toBe("income");
  });

  it("returns capital-gains for investment accounts", () => {
    expect(getDefaultRoiTaxTreatment("TFSA")).toBe("capital-gains");
    expect(getDefaultRoiTaxTreatment("Brokerage")).toBe("capital-gains");
    expect(getDefaultRoiTaxTreatment("401k")).toBe("capital-gains");
    expect(getDefaultRoiTaxTreatment("RRSP")).toBe("capital-gains");
  });
});

describe("shouldShowRoiTaxToggle — hides for tax-sheltered via plugins", () => {
  it("returns false for tax-sheltered accounts", () => {
    expect(shouldShowRoiTaxToggle("TFSA")).toBe(false);
    expect(shouldShowRoiTaxToggle("FHSA")).toBe(false);
    expect(shouldShowRoiTaxToggle("Roth IRA")).toBe(false);
    expect(shouldShowRoiTaxToggle("Roth 401k")).toBe(false);
    expect(shouldShowRoiTaxToggle("HSA")).toBe(false);
    expect(shouldShowRoiTaxToggle("Super (Pension Phase)")).toBe(false);
  });

  it("returns true for taxable accounts", () => {
    expect(shouldShowRoiTaxToggle("Brokerage")).toBe(true);
    expect(shouldShowRoiTaxToggle("RRSP")).toBe(true);
    expect(shouldShowRoiTaxToggle("401k")).toBe(true);
  });
});

describe("getDefaultReinvest — delegates to plugin isReinvestDefault", () => {
  it("returns true for registered accounts", () => {
    expect(getDefaultReinvest("TFSA")).toBe(true);
    expect(getDefaultReinvest("RRSP")).toBe(true);
    expect(getDefaultReinvest("401k")).toBe(true);
    expect(getDefaultReinvest("Roth IRA")).toBe(true);
    expect(getDefaultReinvest("Super (Accumulation)")).toBe(true);
    expect(getDefaultReinvest("Brokerage")).toBe(true);
  });

  it("returns false for non-reinvest categories", () => {
    expect(getDefaultReinvest("Savings")).toBe(false);
    expect(getDefaultReinvest("Checking")).toBe(false);
    expect(getDefaultReinvest("Vehicle")).toBe(false);
    expect(getDefaultReinvest("Other")).toBe(false);
  });
});

describe("getAssetCategoryFlag — flag emoji from plugin.vehicles.flagEmoji", () => {
  it("returns CA flag for Canadian vehicles", () => {
    expect(getAssetCategoryFlag("TFSA")).toBe("🇨🇦");
    expect(getAssetCategoryFlag("RRSP")).toBe("🇨🇦");
    expect(getAssetCategoryFlag("LIRA")).toBe("🇨🇦");
  });

  it("returns US flag for American vehicles", () => {
    expect(getAssetCategoryFlag("401k")).toBe("🇺🇸");
    expect(getAssetCategoryFlag("Roth IRA")).toBe("🇺🇸");
    expect(getAssetCategoryFlag("HSA")).toBe("🇺🇸");
  });

  it("returns AU flag for Australian vehicles", () => {
    expect(getAssetCategoryFlag("Super (Accumulation)")).toBe("🇦🇺");
    expect(getAssetCategoryFlag("Super (Pension Phase)")).toBe("🇦🇺");
  });

  it("returns empty string for universal/unknown categories", () => {
    expect(getAssetCategoryFlag("Savings")).toBe("");
    expect(getAssetCategoryFlag("Brokerage")).toBe("");
    expect(getAssetCategoryFlag("Other")).toBe("");
    expect(getAssetCategoryFlag("Unknown")).toBe("");
  });
});

describe("getGroupedCategorySuggestions — builds from registered countries", () => {
  it("returns 4 groups: CA, US, AU, General", () => {
    const groups = getGroupedCategorySuggestions();
    expect(groups).toHaveLength(4);
    expect(groups[0].label).toBe("🇨🇦 Canada");
    expect(groups[1].label).toBe("🇺🇸 USA");
    expect(groups[2].label).toBe("🇦🇺 Australia");
    expect(groups[3].label).toBe("General");
  });

  it("each country group contains its vehicle categories", () => {
    const groups = getGroupedCategorySuggestions();
    expect(groups[0].items).toContain("TFSA");
    expect(groups[0].items).toContain("RRSP");
    expect(groups[1].items).toContain("401k");
    expect(groups[1].items).toContain("HSA");
    expect(groups[2].items).toContain("Super (Accumulation)");
  });

  it("General group has universal categories", () => {
    const groups = getGroupedCategorySuggestions();
    const general = groups[3];
    expect(general.items).toContain("Savings");
    expect(general.items).toContain("Checking");
    expect(general.items).toContain("Brokerage");
    expect(general.items).toContain("Vehicle");
    expect(general.items).toContain("Other");
  });
});

describe("getAllCategorySuggestions — 19 total items", () => {
  it("includes all country and universal categories", () => {
    const all = getAllCategorySuggestions();
    expect(all).toContain("TFSA");
    expect(all).toContain("401k");
    expect(all).toContain("Super (Accumulation)");
    expect(all).toContain("Savings");
    expect(all).toContain("Other");
  });

  it("returns exactly 19 items (5 CA + 6 US + 3 AU + 5 universal)", () => {
    expect(getAllCategorySuggestions().length).toBe(19);
  });
});
