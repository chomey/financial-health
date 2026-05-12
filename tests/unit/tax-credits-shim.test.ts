import { describe, it, expect } from "vitest";
import {
  getCreditCategories,
  getCreditCategoriesForFilingStatus,
  findCreditCategory,
} from "@/lib/tax-credits";
import { getCountry } from "@/lib/countries";

describe("tax-credits shim — delegates to country registry", () => {
  describe("getCreditCategories", () => {
    it("CA result matches getCountry(CA).taxCredits.getCategories", () => {
      const viaShim = getCreditCategories("CA", 2025);
      const direct = getCountry("CA").taxCredits.getCategories(2025);
      expect(viaShim).toEqual(direct);
    });

    it("US result matches getCountry(US).taxCredits.getCategories", () => {
      const viaShim = getCreditCategories("US", 2025);
      const direct = getCountry("US").taxCredits.getCategories(2025);
      expect(viaShim).toEqual(direct);
    });

    it("AU result matches getCountry(AU).taxCredits.getCategories", () => {
      const viaShim = getCreditCategories("AU", 2025);
      const direct = getCountry("AU").taxCredits.getCategories(2025);
      expect(viaShim).toEqual(direct);
    });

    it("excludes info-only entries for CA", () => {
      const cats = getCreditCategories("CA", 2025);
      expect(cats.every((c) => !c.infoOnly)).toBe(true);
    });

    it("applies year overrides for 2026 (CA DTC maxAmount)", () => {
      const cats2025 = getCreditCategories("CA", 2025);
      const cats2026 = getCreditCategories("CA", 2026);
      const dtc2025 = cats2025.find((c) => c.name === "Disability Tax Credit (DTC)");
      const dtc2026 = cats2026.find((c) => c.name === "Disability Tax Credit (DTC)");
      expect(dtc2025?.maxAmount).toBe(10_138);
      expect(dtc2026?.maxAmount).toBe(10_412);
    });
  });

  describe("getCreditCategoriesForFilingStatus", () => {
    it("CA single result matches registry", () => {
      const viaShim = getCreditCategoriesForFilingStatus("CA", "single", 2025);
      const direct = getCountry("CA").taxCredits.getCategoriesForFilingStatus("single", 2025);
      expect(viaShim).toEqual(direct);
    });

    it("US married-jointly result matches registry", () => {
      const viaShim = getCreditCategoriesForFilingStatus("US", "married-jointly", 2025);
      const direct = getCountry("US").taxCredits.getCategoriesForFilingStatus("married-jointly", 2025);
      expect(viaShim).toEqual(direct);
    });

    it("excludes spouse-only credits for single CA filers", () => {
      const cats = getCreditCategoriesForFilingStatus("CA", "single", 2025);
      expect(cats.every((c) => !c.requiresSpouse)).toBe(true);
    });

    it("includes spouse-only credits for married CA filers", () => {
      const cats = getCreditCategoriesForFilingStatus("CA", "married-common-law", 2025);
      expect(cats.some((c) => c.requiresSpouse)).toBe(true);
    });
  });

  describe("findCreditCategory", () => {
    it("CA: finds DTC by name and delegates via registry", () => {
      const viaShim = findCreditCategory("Disability Tax Credit (DTC)", "CA", 2025);
      const direct = getCountry("CA").taxCredits.findCategory("Disability Tax Credit (DTC)", 2025);
      expect(viaShim).toEqual(direct);
      expect(viaShim?.name).toBe("Disability Tax Credit (DTC)");
    });

    it("US: finds EITC by name", () => {
      const cat = findCreditCategory("Earned Income Tax Credit (EITC)", "US", 2025);
      expect(cat?.name).toBe("Earned Income Tax Credit (EITC)");
      expect(cat?.type).toBe("refundable");
    });

    it("returns undefined for unknown category", () => {
      expect(findCreditCategory("Nonexistent Credit", "CA", 2025)).toBeUndefined();
    });

    it("applies year override when finding for 2026", () => {
      const cat2025 = findCreditCategory("Disability Tax Credit (DTC)", "CA", 2025);
      const cat2026 = findCreditCategory("Disability Tax Credit (DTC)", "CA", 2026);
      expect(cat2025?.maxAmount).toBe(10_138);
      expect(cat2026?.maxAmount).toBe(10_412);
    });

    it("defaults year to 2025", () => {
      const withDefault = findCreditCategory("Disability Tax Credit (DTC)", "CA");
      const explicit = findCreditCategory("Disability Tax Credit (DTC)", "CA", 2025);
      expect(withDefault).toEqual(explicit);
    });
  });
});
