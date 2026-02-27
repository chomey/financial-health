import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  getAllCategorySuggestions,
  getAssetCategoryFlag,
  CA_ASSET_CATEGORIES,
  US_ASSET_CATEGORIES,
} from "@/components/AssetEntry";
import {
  getAllDebtCategorySuggestions,
  getDebtCategoryFlag,
  CA_DEBT_CATEGORIES,
  US_DEBT_CATEGORIES,
} from "@/components/DebtEntry";
import AssetEntry from "@/components/AssetEntry";
import DebtEntry from "@/components/DebtEntry";

describe("Asset category flags", () => {
  it("returns 🇨🇦 for CA-specific asset categories", () => {
    expect(getAssetCategoryFlag("TFSA")).toBe("🇨🇦");
    expect(getAssetCategoryFlag("RRSP")).toBe("🇨🇦");
    expect(getAssetCategoryFlag("RESP")).toBe("🇨🇦");
    expect(getAssetCategoryFlag("FHSA")).toBe("🇨🇦");
    expect(getAssetCategoryFlag("LIRA")).toBe("🇨🇦");
  });

  it("returns 🇺🇸 for US-specific asset categories", () => {
    expect(getAssetCategoryFlag("401k")).toBe("🇺🇸");
    expect(getAssetCategoryFlag("IRA")).toBe("🇺🇸");
    expect(getAssetCategoryFlag("Roth IRA")).toBe("🇺🇸");
    expect(getAssetCategoryFlag("529")).toBe("🇺🇸");
    expect(getAssetCategoryFlag("HSA")).toBe("🇺🇸");
  });

  it("returns empty string for universal categories", () => {
    expect(getAssetCategoryFlag("Savings")).toBe("");
    expect(getAssetCategoryFlag("Checking")).toBe("");
    expect(getAssetCategoryFlag("Other")).toBe("");
  });

  it("CA_ASSET_CATEGORIES has all CA categories", () => {
    expect(CA_ASSET_CATEGORIES.size).toBe(5);
    expect(CA_ASSET_CATEGORIES.has("TFSA")).toBe(true);
  });

  it("US_ASSET_CATEGORIES has all US categories", () => {
    expect(US_ASSET_CATEGORIES.size).toBe(5);
    expect(US_ASSET_CATEGORIES.has("401k")).toBe(true);
  });
});

describe("Debt category flags", () => {
  it("returns 🇨🇦 for CA-specific debt categories", () => {
    expect(getDebtCategoryFlag("HELOC")).toBe("🇨🇦");
    expect(getDebtCategoryFlag("Canada Student Loan")).toBe("🇨🇦");
  });

  it("returns 🇺🇸 for US-specific debt categories", () => {
    expect(getDebtCategoryFlag("Medical Debt")).toBe("🇺🇸");
    expect(getDebtCategoryFlag("Federal Student Loan")).toBe("🇺🇸");
  });

  it("returns empty string for universal debt categories", () => {
    expect(getDebtCategoryFlag("Mortgage")).toBe("");
    expect(getDebtCategoryFlag("Car Loan")).toBe("");
    expect(getDebtCategoryFlag("Student Loan")).toBe("");
  });

  it("CA_DEBT_CATEGORIES has all CA categories", () => {
    expect(CA_DEBT_CATEGORIES.size).toBe(2);
    expect(CA_DEBT_CATEGORIES.has("HELOC")).toBe(true);
    expect(CA_DEBT_CATEGORIES.has("Canada Student Loan")).toBe(true);
  });

  it("US_DEBT_CATEGORIES has all US categories", () => {
    expect(US_DEBT_CATEGORIES.size).toBe(2);
    expect(US_DEBT_CATEGORIES.has("Medical Debt")).toBe(true);
    expect(US_DEBT_CATEGORIES.has("Federal Student Loan")).toBe(true);
  });
});

describe("Debt category region filtering", () => {
  it("returns CA + universal suggestions for CA region", () => {
    const ca = getAllDebtCategorySuggestions("CA");
    expect(ca).toContain("HELOC");
    expect(ca).toContain("Canada Student Loan");
    expect(ca).toContain("Car Loan");
    expect(ca).not.toContain("Medical Debt");
    expect(ca).not.toContain("Federal Student Loan");
  });

  it("returns US + universal suggestions for US region", () => {
    const us = getAllDebtCategorySuggestions("US");
    expect(us).toContain("Medical Debt");
    expect(us).toContain("Federal Student Loan");
    expect(us).toContain("Car Loan");
    expect(us).not.toContain("HELOC");
    expect(us).not.toContain("Canada Student Loan");
  });

  it("returns all suggestions for both or undefined", () => {
    const both = getAllDebtCategorySuggestions("both");
    expect(both).toContain("HELOC");
    expect(both).toContain("Medical Debt");
    expect(both).toContain("Car Loan");

    const undef = getAllDebtCategorySuggestions();
    expect(undef).toEqual(both);
  });

  it("always includes universal debt categories", () => {
    const universal = ["Car Loan", "Student Loan", "Credit Card", "Line of Credit", "Personal Loan", "Other"];
    for (const region of ["CA", "US", "both"] as const) {
      const suggestions = getAllDebtCategorySuggestions(region);
      for (const cat of universal) {
        expect(suggestions).toContain(cat);
      }
    }
  });
});

describe("AssetEntry flag badges in saved items", () => {
  it("shows 🇨🇦 flag next to TFSA in saved items", () => {
    // Default mock data includes TFSA
    render(<AssetEntry />);
    const tfsaButton = screen.getByRole("button", { name: /Edit category for TFSA/i });
    expect(tfsaButton.textContent).toContain("🇨🇦");
    expect(tfsaButton.textContent).toContain("TFSA");
  });

  it("does not show flag for universal categories", () => {
    render(<AssetEntry />);
    const savingsButton = screen.getByRole("button", { name: /Edit category for Savings Account/i });
    expect(savingsButton.textContent).not.toContain("🇨🇦");
    expect(savingsButton.textContent).not.toContain("🇺🇸");
  });
});

describe("DebtEntry region prop filtering", () => {
  it("renders without error with region prop", () => {
    render(<DebtEntry region="CA" />);
    expect(screen.getByText("Debts")).toBeInTheDocument();
  });
});
