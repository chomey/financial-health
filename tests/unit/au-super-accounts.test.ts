import { describe, it, expect } from "vitest";
import {
  getAllCategorySuggestions,
  getGroupedCategorySuggestions,
  getDefaultRoi,
  AU_ASSET_CATEGORIES,
  getAssetCategoryFlag,
  EMPLOYER_MATCH_ELIGIBLE,
  getDefaultReinvest,
  DEFAULT_ROI,
} from "@/components/AssetEntry";
import { shouldShowRoiTaxToggle } from "@/components/AssetEntry";
import {
  getTaxTreatment,
  classifyTaxTreatment,
  getWithdrawalTaxRate,
} from "@/lib/withdrawal-tax";
import {
  TAX_SHELTERED_LIMITS,
  isTaxSheltered,
  getMonthlyLimit,
} from "@/lib/scenario";

describe("AU superannuation account types", () => {
  const AU_SUPER_ACCOUNTS = [
    "Super (Accumulation)",
    "Super (Pension Phase)",
    "First Home Super Saver",
  ];

  describe("AssetEntry category suggestions", () => {
    it("includes AU super accounts in all suggestions", () => {
      const all = getAllCategorySuggestions();
      for (const account of AU_SUPER_ACCOUNTS) {
        expect(all).toContain(account);
      }
    });

    it("includes AU group in grouped suggestions", () => {
      const groups = getGroupedCategorySuggestions();
      const auGroup = groups.find((g) => g.label.includes("Australia"));
      expect(auGroup).toBeDefined();
      expect(auGroup!.items).toEqual(AU_SUPER_ACCOUNTS);
    });

    it("has AU asset categories set", () => {
      for (const account of AU_SUPER_ACCOUNTS) {
        expect(AU_ASSET_CATEGORIES.has(account)).toBe(true);
      }
    });

    it("shows AU flag for super accounts", () => {
      for (const account of AU_SUPER_ACCOUNTS) {
        expect(getAssetCategoryFlag(account)).toBe("🇦🇺");
      }
    });
  });

  describe("default ROI assumptions", () => {
    it("sets 7% default ROI for Super (Accumulation)", () => {
      expect(getDefaultRoi("Super (Accumulation)")).toBe(7);
    });

    it("sets 7% default ROI for Super (Pension Phase)", () => {
      expect(getDefaultRoi("Super (Pension Phase)")).toBe(7);
    });

    it("sets 7% default ROI for First Home Super Saver", () => {
      expect(getDefaultRoi("First Home Super Saver")).toBe(7);
    });
  });

  describe("employer match eligibility", () => {
    it("Super (Accumulation) is eligible for employer match", () => {
      expect(EMPLOYER_MATCH_ELIGIBLE.has("Super (Accumulation)")).toBe(true);
    });

    it("Super (Pension Phase) is not eligible for employer match", () => {
      expect(EMPLOYER_MATCH_ELIGIBLE.has("Super (Pension Phase)")).toBe(false);
    });

    it("First Home Super Saver is not eligible for employer match", () => {
      expect(EMPLOYER_MATCH_ELIGIBLE.has("First Home Super Saver")).toBe(false);
    });
  });

  describe("reinvest defaults", () => {
    it("all AU super accounts default to reinvesting returns", () => {
      for (const account of AU_SUPER_ACCOUNTS) {
        expect(getDefaultReinvest(account)).toBe(true);
      }
    });
  });

  describe("ROI tax toggle visibility", () => {
    it("hides ROI tax toggle for Super (Pension Phase) — tax-free", () => {
      expect(shouldShowRoiTaxToggle("Super (Pension Phase)")).toBe(false);
    });

    it("shows ROI tax toggle for Super (Accumulation)", () => {
      expect(shouldShowRoiTaxToggle("Super (Accumulation)")).toBe(true);
    });
  });

  describe("TAX_SHELTERED_LIMITS", () => {
    it("Super (Accumulation) has $30,000 annual concessional cap", () => {
      expect(TAX_SHELTERED_LIMITS["Super (Accumulation)"]).toEqual({
        annual: 30000,
        country: "AU",
      });
    });

    it("Super (Pension Phase) has $120,000 annual non-concessional cap", () => {
      expect(TAX_SHELTERED_LIMITS["Super (Pension Phase)"]).toEqual({
        annual: 120000,
        country: "AU",
      });
    });

    it("First Home Super Saver has $15,000 annual cap", () => {
      expect(TAX_SHELTERED_LIMITS["First Home Super Saver"]).toEqual({
        annual: 15000,
        country: "AU",
      });
    });

    it("all AU super accounts are recognized as tax-sheltered", () => {
      for (const account of AU_SUPER_ACCOUNTS) {
        expect(isTaxSheltered(account)).toBe(true);
      }
    });

    it("returns correct monthly limits", () => {
      expect(getMonthlyLimit("Super (Accumulation)")).toBe(
        Math.round((30000 / 12) * 100) / 100
      );
      expect(getMonthlyLimit("Super (Pension Phase)")).toBe(
        Math.round((120000 / 12) * 100) / 100
      );
      expect(getMonthlyLimit("First Home Super Saver")).toBe(
        Math.round((15000 / 12) * 100) / 100
      );
    });
  });

  describe("withdrawal tax classification", () => {
    it("classifies Super (Pension Phase) as tax-free", () => {
      expect(classifyTaxTreatment("Super (Pension Phase)")).toBe("tax-free");
    });

    it("classifies Super (Accumulation) as super-accumulation", () => {
      expect(classifyTaxTreatment("Super (Accumulation)")).toBe(
        "super-accumulation"
      );
    });

    it("classifies First Home Super Saver as super-fhss", () => {
      expect(classifyTaxTreatment("First Home Super Saver")).toBe(
        "super-fhss"
      );
    });

    it("does not misclassify Super (Pension Phase) as tax-deferred via pension keyword", () => {
      // Super pension phase must be caught before generic "pension" keyword
      expect(classifyTaxTreatment("Super (Pension Phase)")).not.toBe(
        "tax-deferred"
      );
    });
  });

  describe("withdrawal tax computation", () => {
    it("Super (Pension Phase) withdrawal is tax-free", () => {
      const result = getWithdrawalTaxRate(
        "Super (Pension Phase)",
        "AU",
        "NSW",
        50000
      );
      expect(result.effectiveRate).toBe(0);
      expect(result.taxFreeAmount).toBe(50000);
      expect(result.taxableAmount).toBe(0);
    });

    it("Super (Accumulation) withdrawal is taxed at flat 15%", () => {
      const result = getWithdrawalTaxRate(
        "Super (Accumulation)",
        "AU",
        "NSW",
        100000
      );
      expect(result.effectiveRate).toBe(0.15);
      expect(result.taxableAmount).toBe(100000);
      expect(result.taxFreeAmount).toBe(85000);
    });

    it("First Home Super Saver withdrawal uses marginal rate minus 30% offset", () => {
      const result = getWithdrawalTaxRate(
        "First Home Super Saver",
        "AU",
        "NSW",
        50000
      );
      // The effective rate should be max(0, marginal_effective - 0.30)
      expect(result.effectiveRate).toBeGreaterThanOrEqual(0);
      expect(result.effectiveRate).toBeLessThan(0.30);
      expect(result.taxableAmount).toBe(50000);
    });

    it("FHSS at low income results in 0% effective rate (marginal < 30%)", () => {
      // At $15,000, AU marginal effective rate is well below 30%, so offset zeroes it out
      const result = getWithdrawalTaxRate(
        "First Home Super Saver",
        "AU",
        "NSW",
        15000
      );
      expect(result.effectiveRate).toBe(0);
      expect(result.taxFreeAmount).toBe(15000);
    });

    it("Super (Accumulation) at zero withdrawal returns zero", () => {
      const result = getWithdrawalTaxRate(
        "Super (Accumulation)",
        "AU",
        "NSW",
        0
      );
      expect(result.effectiveRate).toBe(0);
      expect(result.taxFreeAmount).toBe(0);
      expect(result.taxableAmount).toBe(0);
    });
  });

  describe("does not break CA/US classification", () => {
    it("TFSA is still tax-free", () => {
      expect(classifyTaxTreatment("TFSA")).toBe("tax-free");
    });

    it("RRSP is still tax-deferred", () => {
      expect(classifyTaxTreatment("RRSP")).toBe("tax-deferred");
    });

    it("401k is still tax-deferred", () => {
      expect(classifyTaxTreatment("401k")).toBe("tax-deferred");
    });

    it("Roth IRA is still tax-free", () => {
      expect(classifyTaxTreatment("Roth IRA")).toBe("tax-free");
    });

    it("Brokerage is still taxable", () => {
      expect(classifyTaxTreatment("Brokerage")).toBe("taxable");
    });
  });
});
