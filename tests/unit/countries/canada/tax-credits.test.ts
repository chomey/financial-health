import { describe, it, expect } from "vitest";
import { canadianTaxCredits } from "@/lib/countries/canada/tax-credits";

describe("canadianTaxCredits", () => {
  it("returns CA-only categories", () => {
    const cats = canadianTaxCredits.getCategories(2025);
    expect(cats.length).toBeGreaterThan(0);
    for (const c of cats) {
      expect(c.jurisdiction).toBe("CA");
    }
  });

  it("filters out info-only entries by default", () => {
    const cats = canadianTaxCredits.getCategories(2025);
    expect(cats.every((c) => !c.infoOnly)).toBe(true);
  });

  it("findCategory looks up by name", () => {
    const all = canadianTaxCredits.getCategories(2025);
    expect(all.length).toBeGreaterThan(0);
    const found = canadianTaxCredits.findCategory(all[0].name, 2025);
    expect(found?.name).toBe(all[0].name);
  });

  it("findCategory returns undefined for unknown name", () => {
    expect(canadianTaxCredits.findCategory("Bogus Credit", 2025)).toBeUndefined();
  });

  it("married filter hides spouse-only credits when single", () => {
    const single = canadianTaxCredits.getCategoriesForFilingStatus("single", 2025);
    expect(single.every((c) => !c.requiresSpouse)).toBe(true);
  });

  it("married filter includes spouse-only credits when married-common-law", () => {
    const married = canadianTaxCredits.getCategoriesForFilingStatus("married-common-law", 2025);
    const single = canadianTaxCredits.getCategoriesForFilingStatus("single", 2025);
    expect(married.length).toBeGreaterThan(single.length);
    const spousalCredit = married.find((c) => c.name === "Spousal Amount Credit");
    expect(spousalCredit).toBeDefined();
  });

  it("applies year overrides for 2026", () => {
    const cats2025 = canadianTaxCredits.getCategories(2025);
    const cats2026 = canadianTaxCredits.getCategories(2026);
    const dtc2025 = cats2025.find((c) => c.name === "Disability Tax Credit (DTC)");
    const dtc2026 = cats2026.find((c) => c.name === "Disability Tax Credit (DTC)");
    expect(dtc2025?.maxAmount).toBe(10_138);
    expect(dtc2026?.maxAmount).toBe(10_412);
  });

  it("includes known credits", () => {
    const cats = canadianTaxCredits.getCategories(2025);
    const names = cats.map((c) => c.name);
    expect(names).toContain("GST/HST Credit");
    expect(names).toContain("Canada Child Benefit (CCB)");
    expect(names).toContain("Canada Workers Benefit (CWB)");
    expect(names).toContain("Medical Expense Tax Credit");
  });

  it("findCategory resolves year overrides", () => {
    const dtc2026 = canadianTaxCredits.findCategory("Disability Tax Credit (DTC)", 2026);
    expect(dtc2026?.maxAmount).toBe(10_412);
  });
});
