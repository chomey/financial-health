import { describe, it, expect } from "vitest";
import { generateInsights, type FinancialData } from "@/lib/insights";
import {
  getCreditCategoriesForFilingStatus,
  checkIncomeEligibility,
  findCreditCategory,
  type TaxCredit,
} from "@/lib/tax-credits";

// ─── Cross-system integration tests for the full tax credits feature ─────────

describe("Tax credits regression — cross-system integration", () => {
  // ─── Category availability ──────────────────────────────────────────────────

  describe("CA categories", () => {
    it("returns DTC, CCB, CWB, GST/HST, Medical for single filers", () => {
      const cats = getCreditCategoriesForFilingStatus("CA", "single");
      const names = cats.map((c) => c.name);
      expect(names).toContain("Disability Tax Credit (DTC)");
      expect(names).toContain("Canada Child Benefit (CCB)");
      expect(names).toContain("Canada Workers Benefit (CWB)");
      expect(names).toContain("GST/HST Credit");
      expect(names).toContain("Medical Expense Tax Credit");
    });

    it("includes Spousal Amount Credit only for married filers", () => {
      const single = getCreditCategoriesForFilingStatus("CA", "single").map((c) => c.name);
      const married = getCreditCategoriesForFilingStatus("CA", "married-common-law").map((c) => c.name);
      expect(single).not.toContain("Spousal Amount Credit");
      expect(married).toContain("Spousal Amount Credit");
    });
  });

  describe("US categories", () => {
    it("returns EITC, Child Tax Credit, AOTC, SALT for single filers", () => {
      const cats = getCreditCategoriesForFilingStatus("US", "single");
      const names = cats.map((c) => c.name);
      expect(names).toContain("Earned Income Tax Credit (EITC)");
      expect(names).toContain("Child Tax Credit");
      expect(names).toContain("American Opportunity Tax Credit (AOTC)");
      expect(names).toContain("State and Local Tax (SALT) Deduction");
    });

    it("excludes info-only entries from picker", () => {
      const cats = getCreditCategoriesForFilingStatus("US", "single");
      const names = cats.map((c) => c.name);
      expect(names).not.toContain("Standard Deduction");
      expect(names).not.toContain("SSDI/SSI Benefits");
    });
  });

  // ─── Income eligibility ─────────────────────────────────────────────────────

  describe("income eligibility", () => {
    it("CWB is ineligible for high-income earners", () => {
      const cat = findCreditCategory("Canada Workers Benefit (CWB)", "CA");
      expect(cat).toBeTruthy();
      const result = checkIncomeEligibility(cat!, 80_000, "single");
      expect(result).toBe("ineligible");
    });

    it("CWB is eligible for low-income earners", () => {
      const cat = findCreditCategory("Canada Workers Benefit (CWB)", "CA");
      const result = checkIncomeEligibility(cat!, 18_000, "single");
      expect(result).toBe("eligible");
    });

    it("EITC is ineligible for married-separately", () => {
      const cat = findCreditCategory("Earned Income Tax Credit (EITC)", "US");
      expect(cat).toBeTruthy();
      const result = checkIncomeEligibility(cat!, 30_000, "married-separately");
      expect(result).toBe("ineligible");
    });
  });

  // ─── Insights integration ──────────────────────────────────────────────────

  describe("insights fire correctly with credits", () => {
    const baseData: FinancialData = {
      totalAssets: 50_000,
      totalDebts: 0,
      monthlyIncome: 4_000,
      monthlyExpenses: 2_500,
      monthlyGrossIncome: 5_000,
      annualTax: 12_000,
      effectiveTaxRate: 0.2,
      country: "CA",
    };

    it("summary insight fires with any credits", () => {
      const credits: TaxCredit[] = [
        { id: "1", category: "GST/HST Credit", annualAmount: 500, type: "refundable" },
      ];
      const insights = generateInsights({ ...baseData, taxCredits: credits, filingStatus: "single" });
      expect(insights.some((i) => i.type === "tax-credits-summary")).toBe(true);
    });

    it("unclaimed insight suggests credits for low-income CA users", () => {
      const credits: TaxCredit[] = [
        { id: "1", category: "GST/HST Credit", annualAmount: 400, type: "refundable" },
      ];
      const data: FinancialData = {
        ...baseData,
        monthlyGrossIncome: 2_000,
        monthlyIncome: 1_800,
        annualTax: 4_800,
        effectiveTaxRate: 0.1,
        taxCredits: credits,
        filingStatus: "single",
      };
      const insights = generateInsights(data);
      const unclaimed = insights.filter((i) => i.type === "tax-credits-unclaimed");
      expect(unclaimed.length).toBeGreaterThanOrEqual(1);
    });

    it("refundable insight fires when refundable credits exceed tax", () => {
      const credits: TaxCredit[] = [
        { id: "1", category: "Canada Workers Benefit (CWB)", annualAmount: 5_000, type: "refundable" },
      ];
      const data: FinancialData = {
        ...baseData,
        monthlyGrossIncome: 1_500,
        monthlyIncome: 1_350,
        annualTax: 2_400,
        effectiveTaxRate: 0.1,
        taxCredits: credits,
        filingStatus: "single",
      };
      const insights = generateInsights(data);
      expect(insights.some((i) => i.type === "tax-credits-refundable")).toBe(true);
    });

    it("ineligible insight fires for MFS + EITC", () => {
      const credits: TaxCredit[] = [
        { id: "1", category: "Earned Income Tax Credit (EITC)", annualAmount: 3_000, type: "refundable" },
        { id: "2", category: "Child Tax Credit", annualAmount: 2_000, type: "refundable" },
      ];
      const data: FinancialData = {
        ...baseData,
        country: "US",
        taxCredits: credits,
        filingStatus: "married-separately",
      };
      const insights = generateInsights(data);
      expect(insights.some((i) => i.type === "tax-credits-ineligible")).toBe(true);
    });

    it("no tax credit insights fire without credits", () => {
      const insights = generateInsights(baseData);
      const taxInsights = insights.filter((i) => i.type.startsWith("tax-credits-"));
      expect(taxInsights).toHaveLength(0);
    });
  });

  // ─── Country switching resets correctly ─────────────────────────────────────

  describe("country switching categories", () => {
    it("CA and US return different category sets", () => {
      const caCats = getCreditCategoriesForFilingStatus("CA", "single").map((c) => c.name);
      const usCats = getCreditCategoriesForFilingStatus("US", "single").map((c) => c.name);
      // CA-specific
      expect(caCats).toContain("Disability Tax Credit (DTC)");
      expect(usCats).not.toContain("Disability Tax Credit (DTC)");
      // US-specific
      expect(usCats).toContain("Earned Income Tax Credit (EITC)");
      expect(caCats).not.toContain("Earned Income Tax Credit (EITC)");
    });
  });
});
