import { describe, it, expect } from "vitest";
import { australianTaxCredits } from "@/lib/countries/australia/tax-credits";

describe("australianTaxCredits", () => {
  describe("getCategories", () => {
    it("returns only AU categories", () => {
      const categories = australianTaxCredits.getCategories(2025);
      expect(categories.every((c) => c.jurisdiction === "AU")).toBe(true);
    });

    it("excludes infoOnly entries", () => {
      const categories = australianTaxCredits.getCategories(2025);
      expect(categories.find((c) => c.name === "Super (Concessional Contributions)")).toBeUndefined();
      expect(categories.find((c) => c.name === "Medicare Levy Surcharge (MLS)")).toBeUndefined();
    });

    it("includes LITO", () => {
      const lito = australianTaxCredits.getCategories(2025).find((c) => c.name === "Low Income Tax Offset (LITO)");
      expect(lito).toBeDefined();
      expect(lito?.type).toBe("non-refundable");
      expect(lito?.maxAmount).toBe(700);
    });

    it("includes SAPTO", () => {
      const sapto = australianTaxCredits.getCategories(2025).find((c) => c.name === "Senior Australians and Pensioners Tax Offset (SAPTO)");
      expect(sapto).toBeDefined();
      expect(sapto?.type).toBe("non-refundable");
      expect(sapto?.maxAmount).toBe(2_230);
    });

    it("includes Super Co-contribution", () => {
      const coc = australianTaxCredits.getCategories(2025).find((c) => c.name === "Super Co-contribution");
      expect(coc).toBeDefined();
      expect(coc?.type).toBe("refundable");
      expect(coc?.maxAmount).toBe(500);
    });

    it("includes Franking Credits", () => {
      const fc = australianTaxCredits.getCategories(2025).find((c) => c.name === "Franking Credits (Dividend Imputation)");
      expect(fc).toBeDefined();
      expect(fc?.type).toBe("refundable");
    });

    it("includes new AU deductions", () => {
      const categories = australianTaxCredits.getCategories(2025);
      const names = categories.map((c) => c.name);
      expect(names).toContain("Work-Related Expenses Deduction");
      expect(names).toContain("Charitable Donations (DGR)");
      expect(names).toContain("Self-Education Expenses Deduction");
      expect(names).toContain("Rental Property Losses (Negative Gearing)");
      expect(names).toContain("Income Protection Insurance Deduction");
    });

    it("Work-Related Expenses has a maxAmount of 300", () => {
      const wre = australianTaxCredits.getCategories(2025).find((c) => c.name === "Work-Related Expenses Deduction");
      expect(wre?.maxAmount).toBe(300);
    });
  });

  describe("getCategoriesForFilingStatus", () => {
    it("excludes requiresSpouse entries for single filers", () => {
      const categories = australianTaxCredits.getCategoriesForFilingStatus("single", 2025);
      expect(categories.find((c) => c.name === "Spouse Super Tax Offset")).toBeUndefined();
    });

    it("includes requiresSpouse entries for married-de-facto filers", () => {
      const categories = australianTaxCredits.getCategoriesForFilingStatus("married-de-facto", 2025);
      expect(categories.find((c) => c.name === "Spouse Super Tax Offset")).toBeDefined();
    });

    it("excludes infoOnly entries regardless of filing status", () => {
      for (const status of ["single", "married-de-facto"] as const) {
        const categories = australianTaxCredits.getCategoriesForFilingStatus(status, 2025);
        expect(categories.find((c) => c.name === "Super (Concessional Contributions)")).toBeUndefined();
      }
    });

    it("LITO has correct phase-out for single", () => {
      const lito = australianTaxCredits.getCategoriesForFilingStatus("single", 2025).find((c) => c.name === "Low Income Tax Offset (LITO)");
      expect(lito?.incomeLimits.single?.phaseOutStart).toBe(37_500);
      expect(lito?.incomeLimits.single?.phaseOutEnd).toBe(66_667);
    });

    it("SAPTO has different phase-out for married-de-facto vs single", () => {
      const single = australianTaxCredits.getCategoriesForFilingStatus("single", 2025).find((c) => c.name === "Senior Australians and Pensioners Tax Offset (SAPTO)");
      const married = australianTaxCredits.getCategoriesForFilingStatus("married-de-facto", 2025).find((c) => c.name === "Senior Australians and Pensioners Tax Offset (SAPTO)");
      expect(single?.incomeLimits.single?.phaseOutStart).toBe(32_279);
      expect(married?.incomeLimits["married-de-facto"]?.phaseOutStart).toBe(28_974);
    });
  });

  describe("findCategory", () => {
    it("finds LITO by exact name", () => {
      const lito = australianTaxCredits.findCategory("Low Income Tax Offset (LITO)", 2025);
      expect(lito).toBeDefined();
      expect(lito?.jurisdiction).toBe("AU");
    });

    it("returns undefined for unknown name", () => {
      expect(australianTaxCredits.findCategory("Nonexistent Credit", 2025)).toBeUndefined();
    });

    it("finds infoOnly entries by name", () => {
      const super_ = australianTaxCredits.findCategory("Super (Concessional Contributions)", 2025);
      expect(super_).toBeDefined();
      expect(super_?.infoOnly).toBe(true);
    });

    it("finds Spouse Super Tax Offset by name", () => {
      const offset = australianTaxCredits.findCategory("Spouse Super Tax Offset", 2025);
      expect(offset).toBeDefined();
      expect(offset?.requiresSpouse).toBe(true);
    });
  });

  describe("category types", () => {
    it("Zone Tax Offset has amountOptions for all zones", () => {
      const zone = australianTaxCredits.findCategory("Zone Tax Offset", 2025);
      expect(zone?.amountOptions).toHaveLength(3);
      expect(zone?.amountOptions?.find((o) => o.label === "Zone A")?.value).toBe(338);
      expect(zone?.amountOptions?.find((o) => o.label === "Zone B")?.value).toBe(57);
      expect(zone?.amountOptions?.find((o) => o.label === "Special area")?.value).toBe(1_173);
    });

    it("SAPTO has amountOptions for single and couple", () => {
      const sapto = australianTaxCredits.findCategory("Senior Australians and Pensioners Tax Offset (SAPTO)", 2025);
      expect(sapto?.amountOptions).toHaveLength(2);
      expect(sapto?.amountOptions?.find((o) => o.label === "Single")?.value).toBe(2_230);
      expect(sapto?.amountOptions?.find((o) => o.label === "Couple (each)")?.value).toBe(1_602);
    });

    it("all deduction entries have type deduction", () => {
      const deductions = australianTaxCredits.getCategories(2025).filter((c) => c.type === "deduction");
      const deductionNames = deductions.map((c) => c.name);
      expect(deductionNames).toContain("Work-Related Expenses Deduction");
      expect(deductionNames).toContain("Charitable Donations (DGR)");
      expect(deductionNames).toContain("Rental Property Losses (Negative Gearing)");
      expect(deductionNames).toContain("Income Protection Insurance Deduction");
    });
  });
});
