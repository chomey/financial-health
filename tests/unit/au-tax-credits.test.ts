import { describe, it, expect } from "vitest";
import {
  checkIncomeEligibility,
  getIncomeLimitDescription,
  getCreditCategories,
  getCreditCategoriesForFilingStatus,
  getAllCreditCategories,
  findCreditCategory,
  getFilingStatuses,
  getDefaultFilingStatus,
  type FilingStatus,
} from "@/lib/tax-credits";

describe("AU Tax Credits and Offsets", () => {
  describe("AU filing statuses", () => {
    it("returns AU filing statuses: single and married-de-facto", () => {
      const statuses = getFilingStatuses("AU");
      expect(statuses).toHaveLength(2);
      expect(statuses.map((s) => s.value)).toEqual(["single", "married-de-facto"]);
    });

    it("returns correct labels for AU statuses", () => {
      const statuses = getFilingStatuses("AU");
      expect(statuses[0].label).toBe("Single");
      expect(statuses[1].label).toBe("Married / De Facto");
    });

    it("defaults to single for AU", () => {
      expect(getDefaultFilingStatus("AU")).toBe("single");
    });
  });

  describe("AU credit categories", () => {
    it("returns non-info AU credits from getCreditCategories", () => {
      const cats = getCreditCategories("AU");
      expect(cats.length).toBeGreaterThanOrEqual(6);
      // Info-only categories should be excluded
      const names = cats.map((c) => c.name);
      expect(names).not.toContain("Medicare Levy Surcharge (MLS)");
      expect(names).not.toContain("Super (Concessional Contributions)");
    });

    it("includes all AU categories (including info-only) from getAllCreditCategories", () => {
      const all = getAllCreditCategories("AU");
      const names = all.map((c) => c.name);
      expect(names).toContain("Medicare Levy Surcharge (MLS)");
      expect(names).toContain("Super (Concessional Contributions)");
    });

    it("all AU categories have jurisdiction AU", () => {
      const all = getAllCreditCategories("AU");
      for (const c of all) {
        expect(c.jurisdiction).toBe("AU");
      }
    });

    it("excludes spouse-only credits for single filers", () => {
      const single = getCreditCategoriesForFilingStatus("AU", "single");
      const names = single.map((c) => c.name);
      expect(names).not.toContain("Spouse Super Tax Offset");
    });

    it("includes spouse-only credits for married-de-facto filers", () => {
      const married = getCreditCategoriesForFilingStatus("AU", "married-de-facto");
      const names = married.map((c) => c.name);
      expect(names).toContain("Spouse Super Tax Offset");
    });
  });

  describe("LITO (Low Income Tax Offset)", () => {
    const lito = findCreditCategory("Low Income Tax Offset (LITO)", "AU")!;

    it("exists with correct properties", () => {
      expect(lito).toBeDefined();
      expect(lito.type).toBe("non-refundable");
      expect(lito.maxAmount).toBe(700);
      expect(lito.fixedAmount).toBe(true);
    });

    it("eligible below $37,500", () => {
      expect(checkIncomeEligibility(lito, 30_000, "single")).toBe("eligible");
      expect(checkIncomeEligibility(lito, 37_500, "single")).toBe("eligible");
    });

    it("reduced between $37,500 and $66,667", () => {
      expect(checkIncomeEligibility(lito, 40_000, "single")).toBe("reduced");
      expect(checkIncomeEligibility(lito, 60_000, "single")).toBe("reduced");
    });

    it("ineligible above $66,667", () => {
      expect(checkIncomeEligibility(lito, 66_668, "single")).toBe("ineligible");
      expect(checkIncomeEligibility(lito, 100_000, "single")).toBe("ineligible");
    });

    it("same thresholds for married-de-facto", () => {
      expect(checkIncomeEligibility(lito, 30_000, "married-de-facto")).toBe("eligible");
      expect(checkIncomeEligibility(lito, 50_000, "married-de-facto")).toBe("reduced");
      expect(checkIncomeEligibility(lito, 70_000, "married-de-facto")).toBe("ineligible");
    });
  });

  describe("SAPTO (Senior Australians and Pensioners Tax Offset)", () => {
    const sapto = findCreditCategory("Senior Australians and Pensioners Tax Offset (SAPTO)", "AU")!;

    it("exists with correct properties", () => {
      expect(sapto).toBeDefined();
      expect(sapto.type).toBe("non-refundable");
      expect(sapto.maxAmount).toBe(2_230);
      expect(sapto.fixedAmount).toBe(true);
    });

    it("has amount options for single and couple", () => {
      expect(sapto.amountOptions).toHaveLength(2);
      expect(sapto.amountOptions![0].value).toBe(2_230);
      expect(sapto.amountOptions![1].value).toBe(1_602);
    });

    it("single: eligible below $32,279, reduced to $50,119, ineligible above", () => {
      expect(checkIncomeEligibility(sapto, 30_000, "single")).toBe("eligible");
      expect(checkIncomeEligibility(sapto, 40_000, "single")).toBe("reduced");
      expect(checkIncomeEligibility(sapto, 51_000, "single")).toBe("ineligible");
    });

    it("married-de-facto: eligible below $28,974, reduced to $41,790, ineligible above", () => {
      expect(checkIncomeEligibility(sapto, 25_000, "married-de-facto")).toBe("eligible");
      expect(checkIncomeEligibility(sapto, 35_000, "married-de-facto")).toBe("reduced");
      expect(checkIncomeEligibility(sapto, 42_000, "married-de-facto")).toBe("ineligible");
    });
  });

  describe("Medicare Levy Surcharge (MLS)", () => {
    it("is info-only", () => {
      const all = getAllCreditCategories("AU");
      const mls = all.find((c) => c.name === "Medicare Levy Surcharge (MLS)");
      expect(mls).toBeDefined();
      expect(mls!.infoOnly).toBe(true);
    });

    it("has correct income thresholds", () => {
      const all = getAllCreditCategories("AU");
      const mls = all.find((c) => c.name === "Medicare Levy Surcharge (MLS)")!;
      expect(mls.incomeLimits.single?.phaseOutStart).toBe(93_000);
      expect(mls.incomeLimits["married-de-facto"]?.phaseOutStart).toBe(186_000);
    });
  });

  describe("Private Health Insurance Rebate", () => {
    const phi = findCreditCategory("Private Health Insurance Rebate", "AU")!;

    it("exists as refundable", () => {
      expect(phi).toBeDefined();
      expect(phi.type).toBe("refundable");
    });

    it("phases out based on income", () => {
      expect(checkIncomeEligibility(phi, 80_000, "single")).toBe("eligible");
      expect(checkIncomeEligibility(phi, 100_000, "single")).toBe("reduced");
      expect(checkIncomeEligibility(phi, 150_000, "single")).toBe("ineligible");
    });

    it("family thresholds are double single thresholds", () => {
      expect(phi.incomeLimits["married-de-facto"]?.phaseOutStart).toBe(186_000);
      expect(phi.incomeLimits["married-de-facto"]?.phaseOutEnd).toBe(288_000);
    });
  });

  describe("Franking Credits (Dividend Imputation)", () => {
    const franking = findCreditCategory("Franking Credits (Dividend Imputation)", "AU")!;

    it("exists as refundable with no income limits", () => {
      expect(franking).toBeDefined();
      expect(franking.type).toBe("refundable");
      expect(checkIncomeEligibility(franking, 500_000, "single")).toBe("eligible");
      expect(checkIncomeEligibility(franking, 500_000, "married-de-facto")).toBe("eligible");
    });
  });

  describe("Super Co-contribution", () => {
    const coco = findCreditCategory("Super Co-contribution", "AU")!;

    it("exists with correct properties", () => {
      expect(coco).toBeDefined();
      expect(coco.type).toBe("refundable");
      expect(coco.maxAmount).toBe(500);
      expect(coco.fixedAmount).toBe(true);
    });

    it("eligible below $45,400", () => {
      expect(checkIncomeEligibility(coco, 40_000, "single")).toBe("eligible");
    });

    it("reduced between $45,400 and $60,400", () => {
      expect(checkIncomeEligibility(coco, 50_000, "single")).toBe("reduced");
    });

    it("ineligible above $60,400", () => {
      expect(checkIncomeEligibility(coco, 61_000, "single")).toBe("ineligible");
    });
  });

  describe("Spouse Super Tax Offset", () => {
    const spouse = findCreditCategory("Spouse Super Tax Offset", "AU")!;

    it("exists with correct properties", () => {
      expect(spouse).toBeDefined();
      expect(spouse.type).toBe("non-refundable");
      expect(spouse.maxAmount).toBe(540);
      expect(spouse.requiresSpouse).toBe(true);
    });
  });

  describe("Zone Tax Offset", () => {
    const zone = findCreditCategory("Zone Tax Offset", "AU")!;

    it("exists with amount options for zones", () => {
      expect(zone).toBeDefined();
      expect(zone.type).toBe("non-refundable");
      expect(zone.amountOptions).toHaveLength(3);
      expect(zone.amountOptions![0].label).toBe("Zone A");
      expect(zone.amountOptions![2].value).toBe(1_173);
    });

    it("has no income limits", () => {
      expect(checkIncomeEligibility(zone, 1_000_000, "single")).toBe("eligible");
    });
  });

  describe("Income limit descriptions for AU credits", () => {
    it("returns phase-out description for LITO", () => {
      const lito = findCreditCategory("Low Income Tax Offset (LITO)", "AU")!;
      const desc = getIncomeLimitDescription(lito, "single");
      expect(desc).toContain("37,500");
      expect(desc).toContain("66,667");
    });

    it("returns null for franking credits (no limits)", () => {
      const franking = findCreditCategory("Franking Credits (Dividend Imputation)", "AU")!;
      expect(getIncomeLimitDescription(franking, "single")).toBeNull();
    });
  });

  describe("CA/US regression — AU changes don't affect other countries", () => {
    it("CA still returns 2 filing statuses", () => {
      expect(getFilingStatuses("CA")).toHaveLength(2);
      expect(getFilingStatuses("CA").map((s) => s.value)).toEqual(["single", "married-common-law"]);
    });

    it("US still returns 4 filing statuses", () => {
      expect(getFilingStatuses("US")).toHaveLength(4);
    });

    it("CA credits unchanged", () => {
      const ca = getCreditCategories("CA");
      expect(ca.length).toBeGreaterThan(0);
      expect(ca.every((c) => c.jurisdiction === "CA")).toBe(true);
    });

    it("US credits unchanged", () => {
      const us = getCreditCategories("US");
      expect(us.length).toBeGreaterThan(0);
      expect(us.every((c) => c.jurisdiction === "US")).toBe(true);
    });
  });
});
