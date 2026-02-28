import { describe, it, expect } from "vitest";
import {
  getAllCategorySuggestions,
  getGroupedCategorySuggestions,
  getAssetCategoryFlag,
  CA_ASSET_CATEGORIES,
  US_ASSET_CATEGORIES,
} from "@/components/AssetEntry";
import {
  getAllDebtCategorySuggestions,
  getGroupedDebtCategorySuggestions,
  getDebtCategoryFlag,
  CA_DEBT_CATEGORIES,
  US_DEBT_CATEGORIES,
} from "@/components/DebtEntry";
import { encodeState, decodeState } from "@/lib/url-state";
import type { FinancialState } from "@/lib/financial-state";

describe("Asset category suggestions (no region filter)", () => {
  it("getAllCategorySuggestions returns CA, US, and universal categories", () => {
    const all = getAllCategorySuggestions();
    expect(all).toContain("TFSA");
    expect(all).toContain("RRSP");
    expect(all).toContain("401k");
    expect(all).toContain("Roth IRA");
    expect(all).toContain("Savings");
    expect(all).toContain("Other");
  });

  it("getGroupedCategorySuggestions returns three groups: Canada, USA, General", () => {
    const groups = getGroupedCategorySuggestions();
    expect(groups).toHaveLength(3);
    expect(groups[0].label).toBe("🇨🇦 Canada");
    expect(groups[1].label).toBe("🇺🇸 USA");
    expect(groups[2].label).toBe("General");
  });

  it("Canada group contains CA-specific types", () => {
    const groups = getGroupedCategorySuggestions();
    const canada = groups[0];
    expect(canada.items).toContain("TFSA");
    expect(canada.items).toContain("RRSP");
    expect(canada.items).toContain("RESP");
    expect(canada.items).toContain("FHSA");
    expect(canada.items).toContain("LIRA");
  });

  it("USA group contains US-specific types", () => {
    const groups = getGroupedCategorySuggestions();
    const usa = groups[1];
    expect(usa.items).toContain("401k");
    expect(usa.items).toContain("IRA");
    expect(usa.items).toContain("Roth IRA");
    expect(usa.items).toContain("529");
    expect(usa.items).toContain("HSA");
  });

  it("General group contains universal types", () => {
    const groups = getGroupedCategorySuggestions();
    const general = groups[2];
    expect(general.items).toContain("Savings");
    expect(general.items).toContain("Checking");
    expect(general.items).toContain("Brokerage");
  });

  it("getAssetCategoryFlag returns correct flags", () => {
    expect(getAssetCategoryFlag("TFSA")).toBe("🇨🇦");
    expect(getAssetCategoryFlag("RRSP")).toBe("🇨🇦");
    expect(getAssetCategoryFlag("401k")).toBe("🇺🇸");
    expect(getAssetCategoryFlag("Roth IRA")).toBe("🇺🇸");
    expect(getAssetCategoryFlag("Savings")).toBe("");
    expect(getAssetCategoryFlag("Other")).toBe("");
  });
});

describe("Debt category suggestions (no region filter)", () => {
  it("getAllDebtCategorySuggestions returns CA, US, and universal categories", () => {
    const all = getAllDebtCategorySuggestions();
    expect(all).toContain("HELOC");
    expect(all).toContain("Canada Student Loan");
    expect(all).toContain("Medical Debt");
    expect(all).toContain("Federal Student Loan");
    expect(all).toContain("Car Loan");
    expect(all).toContain("Credit Card");
  });

  it("getGroupedDebtCategorySuggestions returns three groups: Canada, USA, General", () => {
    const groups = getGroupedDebtCategorySuggestions();
    expect(groups).toHaveLength(3);
    expect(groups[0].label).toBe("🇨🇦 Canada");
    expect(groups[1].label).toBe("🇺🇸 USA");
    expect(groups[2].label).toBe("General");
  });

  it("Canada group contains CA-specific debt types", () => {
    const groups = getGroupedDebtCategorySuggestions();
    expect(groups[0].items).toContain("HELOC");
    expect(groups[0].items).toContain("Canada Student Loan");
  });

  it("USA group contains US-specific debt types", () => {
    const groups = getGroupedDebtCategorySuggestions();
    expect(groups[1].items).toContain("Medical Debt");
    expect(groups[1].items).toContain("Federal Student Loan");
  });

  it("getDebtCategoryFlag returns correct flags", () => {
    expect(getDebtCategoryFlag("HELOC")).toBe("🇨🇦");
    expect(getDebtCategoryFlag("Medical Debt")).toBe("🇺🇸");
    expect(getDebtCategoryFlag("Car Loan")).toBe("");
  });
});

describe("FinancialState no longer has region field", () => {
  it("encodeState/decodeState works without region field", () => {
    const state: FinancialState = {
      assets: [{ id: "a1", category: "TFSA", amount: 10000 }],
      debts: [{ id: "d1", category: "Car Loan", amount: 5000 }],
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
      expenses: [{ id: "e1", category: "Rent", amount: 1500 }],
      properties: [],
    };
    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.assets[0].category).toBe("TFSA");
    expect(decoded!.debts[0].category).toBe("Car Loan");
    expect((decoded as Record<string, unknown>)).not.toHaveProperty("region");
  });

  it("CA_ASSET_CATEGORIES and US_ASSET_CATEGORIES sets are correct", () => {
    expect(CA_ASSET_CATEGORIES.has("TFSA")).toBe(true);
    expect(CA_ASSET_CATEGORIES.has("401k")).toBe(false);
    expect(US_ASSET_CATEGORIES.has("401k")).toBe(true);
    expect(US_ASSET_CATEGORIES.has("TFSA")).toBe(false);
  });

  it("CA_DEBT_CATEGORIES and US_DEBT_CATEGORIES sets are correct", () => {
    expect(CA_DEBT_CATEGORIES.has("HELOC")).toBe(true);
    expect(CA_DEBT_CATEGORIES.has("Medical Debt")).toBe(false);
    expect(US_DEBT_CATEGORIES.has("Medical Debt")).toBe(true);
    expect(US_DEBT_CATEGORIES.has("HELOC")).toBe(false);
  });
});
