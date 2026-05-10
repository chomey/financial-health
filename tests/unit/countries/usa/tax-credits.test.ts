import { describe, it, expect } from "vitest";
import { americanTaxCredits } from "@/lib/countries/usa/tax-credits";

describe("americanTaxCredits", () => {
  it("returns US-only categories", () => {
    const cats = americanTaxCredits.getCategories(2025);
    expect(cats.length).toBeGreaterThan(0);
    for (const c of cats) {
      expect(c.jurisdiction).toBe("US");
    }
  });

  it("filters out info-only entries by default", () => {
    const cats = americanTaxCredits.getCategories(2025);
    expect(cats.every((c) => !c.infoOnly)).toBe(true);
  });

  it("findCategory looks up by name", () => {
    const all = americanTaxCredits.getCategories(2025);
    expect(all.length).toBeGreaterThan(0);
    const found = americanTaxCredits.findCategory(all[0].name, 2025);
    expect(found?.name).toBe(all[0].name);
  });

  it("findCategory returns undefined for unknown name", () => {
    expect(americanTaxCredits.findCategory("Bogus Credit", 2025)).toBeUndefined();
  });

  it("getCategoriesForFilingStatus returns non-infoOnly entries", () => {
    const cats = americanTaxCredits.getCategoriesForFilingStatus("single", 2025);
    expect(cats.every((c) => !c.infoOnly)).toBe(true);
    expect(cats.length).toBeGreaterThan(0);
  });

  it("getCategoriesForFilingStatus returns same categories regardless of US filing status", () => {
    const single = americanTaxCredits.getCategoriesForFilingStatus("single", 2025);
    const mfj = americanTaxCredits.getCategoriesForFilingStatus("married-jointly", 2025);
    const hoh = americanTaxCredits.getCategoriesForFilingStatus("head-of-household", 2025);
    expect(single.length).toBe(mfj.length);
    expect(single.length).toBe(hoh.length);
  });

  it("applies year overrides for 2026", () => {
    const cats2025 = americanTaxCredits.getCategories(2025);
    const cats2026 = americanTaxCredits.getCategories(2026);
    const eitc2025 = cats2025.find((c) => c.name === "Earned Income Tax Credit (EITC)");
    const eitc2026 = cats2026.find((c) => c.name === "Earned Income Tax Credit (EITC)");
    expect(eitc2025?.maxAmount).toBe(8_046);
    expect(eitc2026?.maxAmount).toBe(8_271);
  });

  it("findCategory resolves year overrides", () => {
    const adoption2026 = americanTaxCredits.findCategory("Adoption Credit", 2026);
    expect(adoption2026?.maxAmount).toBe(17_764);
  });

  it("includes known US credits", () => {
    const cats = americanTaxCredits.getCategories(2025);
    const names = cats.map((c) => c.name);
    expect(names).toContain("Earned Income Tax Credit (EITC)");
    expect(names).toContain("Child Tax Credit");
    expect(names).toContain("American Opportunity Tax Credit (AOTC)");
    expect(names).toContain("Saver's Credit");
    expect(names).toContain("Premium Tax Credit");
  });

  it("infoOnly entries are excluded from getCategories but findable via findCategory", () => {
    const cats = americanTaxCredits.getCategories(2025);
    const names = cats.map((c) => c.name);
    expect(names).not.toContain("Standard Deduction");
    expect(names).not.toContain("HSA Deduction");
    const stdDed = americanTaxCredits.findCategory("Standard Deduction", 2025);
    expect(stdDed).toBeDefined();
    expect(stdDed?.infoOnly).toBe(true);
  });
});
