import { describe, it, expect } from "vitest";
import { generateInsights, type FinancialData } from "@/lib/insights";
import type { TaxCredit } from "@/lib/tax-credits";

/** Base financial data for tax-credit insight tests */
const baseData: FinancialData = {
  totalAssets: 100_000,
  totalDebts: 0,
  monthlyIncome: 5_000,
  monthlyExpenses: 3_000,
  monthlyGrossIncome: 6_000,
  annualTax: 14_400, // 20% of 72k gross
  effectiveTaxRate: 0.2,
  country: "CA",
};

// Helper — find insights by type
const ofType = (insights: ReturnType<typeof generateInsights>, type: string) =>
  insights.filter((i) => i.type === type);

// ─── tax-credits-summary ────────────────────────────────────────────────────

describe("tax-credits-summary insight", () => {
  it("generated when user has credits", () => {
    const credits: TaxCredit[] = [
      { id: "1", category: "GST/HST Credit", annualAmount: 500, type: "refundable" },
    ];
    const data: FinancialData = { ...baseData, taxCredits: credits, filingStatus: "single" };
    const insights = generateInsights(data);
    const summary = ofType(insights, "tax-credits-summary");
    expect(summary).toHaveLength(1);
    expect(summary[0].message).toContain("$500");
  });

  it("not generated when user has no credits", () => {
    const insights = generateInsights(baseData);
    expect(ofType(insights, "tax-credits-summary")).toHaveLength(0);
  });

  it("includes effective rate change when annualTax is known", () => {
    const credits: TaxCredit[] = [
      { id: "1", category: "GST/HST Credit", annualAmount: 2_000, type: "refundable" },
    ];
    // annualGrossIncome = 6000 * 12 = 72_000
    // taxBefore = annualTax + credits = 14_400 + 2_000 = 16_400 → 22.8%
    // taxAfter  = annualTax = 14_400 → 20.0%
    const data: FinancialData = { ...baseData, taxCredits: credits, filingStatus: "single" };
    const insights = generateInsights(data);
    const summary = ofType(insights, "tax-credits-summary");
    expect(summary[0].message).toContain("%");
  });

  it("notes phase-out when user claims credit they're ineligible for", () => {
    // EITC (US) is ineligible for married-separately
    const credits: TaxCredit[] = [
      { id: "1", category: "Earned Income Tax Credit (EITC)", annualAmount: 3_000, type: "refundable" },
    ];
    const data: FinancialData = {
      ...baseData,
      country: "US",
      taxCredits: credits,
      filingStatus: "married-separately",
    };
    const insights = generateInsights(data);
    const summary = ofType(insights, "tax-credits-summary");
    expect(summary[0].message).toContain("may be reduced or unavailable");
  });

  it("does NOT note phase-out when all credits are eligible", () => {
    const credits: TaxCredit[] = [
      { id: "1", category: "GST/HST Credit", annualAmount: 500, type: "refundable" },
    ];
    const data: FinancialData = {
      ...baseData,
      taxCredits: credits,
      filingStatus: "single",
      monthlyGrossIncome: 2_000, // low income — eligible for GST credit
    };
    const insights = generateInsights(data);
    const summary = ofType(insights, "tax-credits-summary");
    expect(summary[0].message).not.toContain("may be reduced or unavailable");
  });
});

// ─── tax-credits-unclaimed ──────────────────────────────────────────────────

describe("tax-credits-unclaimed insight", () => {
  it("suggests CCB for CA user with child care expenses", () => {
    const credits: TaxCredit[] = [
      { id: "1", category: "GST/HST Credit", annualAmount: 400, type: "refundable" },
    ];
    const data: FinancialData = {
      ...baseData,
      country: "CA",
      taxCredits: credits,
      filingStatus: "single",
      hasChildCareExpenses: true,
      monthlyGrossIncome: 2_500, // low enough for CCB
    };
    const insights = generateInsights(data);
    const unclaimed = ofType(insights, "tax-credits-unclaimed");
    expect(unclaimed.some((i) => i.message.includes("Canada Child Benefit"))).toBe(true);
  });

  it("suggests CWB for low-income CA user", () => {
    const credits: TaxCredit[] = [
      { id: "1", category: "GST/HST Credit", annualAmount: 400, type: "refundable" },
    ];
    const data: FinancialData = {
      ...baseData,
      country: "CA",
      taxCredits: credits,
      filingStatus: "single",
      monthlyGrossIncome: 2_000, // ~24k/year < CWB phase-out-end
    };
    const insights = generateInsights(data);
    const unclaimed = ofType(insights, "tax-credits-unclaimed");
    expect(unclaimed.some((i) => i.message.includes("Canada Workers Benefit"))).toBe(true);
  });

  it("does NOT suggest CWB for high-income CA user", () => {
    const credits: TaxCredit[] = [
      { id: "1", category: "GST/HST Credit", annualAmount: 400, type: "refundable" },
    ];
    const data: FinancialData = {
      ...baseData,
      country: "CA",
      taxCredits: credits,
      filingStatus: "single",
      monthlyGrossIncome: 5_000, // 60k/year > CWB phase-out-end
    };
    const insights = generateInsights(data);
    const unclaimed = ofType(insights, "tax-credits-unclaimed");
    expect(unclaimed.some((i) => i.message.includes("Canada Workers Benefit"))).toBe(false);
  });

  it("suggests EITC for low-income US user", () => {
    const credits: TaxCredit[] = [
      { id: "1", category: "Child Tax Credit", annualAmount: 1_000, type: "refundable" },
    ];
    const data: FinancialData = {
      ...baseData,
      country: "US",
      taxCredits: credits,
      filingStatus: "single",
      monthlyGrossIncome: 2_000, // ~24k/year < EITC threshold
    };
    const insights = generateInsights(data);
    const unclaimed = ofType(insights, "tax-credits-unclaimed");
    expect(unclaimed.some((i) => i.message.includes("Earned Income Tax Credit"))).toBe(true);
  });

  it("does NOT suggest EITC for MFS US user (MFS ineligible)", () => {
    const credits: TaxCredit[] = [
      { id: "1", category: "Child Tax Credit", annualAmount: 1_000, type: "refundable" },
    ];
    const data: FinancialData = {
      ...baseData,
      country: "US",
      taxCredits: credits,
      filingStatus: "married-separately",
      monthlyGrossIncome: 2_000,
    };
    const insights = generateInsights(data);
    const unclaimed = ofType(insights, "tax-credits-unclaimed");
    expect(unclaimed.some((i) => i.message.includes("Earned Income Tax Credit"))).toBe(false);
  });

  it("suggests Residential Clean Energy for US homeowner", () => {
    const credits: TaxCredit[] = [
      { id: "1", category: "Child Tax Credit", annualAmount: 1_000, type: "refundable" },
    ];
    const data: FinancialData = {
      ...baseData,
      country: "US",
      taxCredits: credits,
      filingStatus: "single",
      isHomeowner: true,
      monthlyGrossIncome: 8_000, // too high for EITC
    };
    const insights = generateInsights(data);
    const unclaimed = ofType(insights, "tax-credits-unclaimed");
    expect(unclaimed.some((i) => i.message.includes("Residential Clean Energy"))).toBe(true);
  });

  it("suggests AOTC for US student with student loans", () => {
    const credits: TaxCredit[] = [
      { id: "1", category: "Child Tax Credit", annualAmount: 1_000, type: "refundable" },
    ];
    const data: FinancialData = {
      ...baseData,
      country: "US",
      taxCredits: credits,
      filingStatus: "single",
      hasStudentLoans: true,
      monthlyGrossIncome: 4_000, // ~48k, within AOTC range
    };
    const insights = generateInsights(data);
    const unclaimed = ofType(insights, "tax-credits-unclaimed");
    expect(unclaimed.some((i) => i.message.includes("American Opportunity Tax Credit"))).toBe(true);
  });

  it("shows at most 2 unclaimed credit suggestions", () => {
    const credits: TaxCredit[] = [
      { id: "1", category: "GST/HST Credit", annualAmount: 400, type: "refundable" },
    ];
    const data: FinancialData = {
      ...baseData,
      country: "CA",
      taxCredits: credits,
      filingStatus: "single",
      hasChildCareExpenses: true,
      hasStudentLoans: true,
      isHomeowner: true,
      monthlyGrossIncome: 2_000,
    };
    const insights = generateInsights(data);
    const unclaimed = ofType(insights, "tax-credits-unclaimed");
    expect(unclaimed.length).toBeLessThanOrEqual(2);
  });

  it("includes filing status label in suggestion message", () => {
    const credits: TaxCredit[] = [
      { id: "1", category: "GST/HST Credit", annualAmount: 400, type: "refundable" },
    ];
    const data: FinancialData = {
      ...baseData,
      country: "CA",
      taxCredits: credits,
      filingStatus: "married-common-law",
      monthlyGrossIncome: 2_000,
    };
    const insights = generateInsights(data);
    const unclaimed = ofType(insights, "tax-credits-unclaimed");
    if (unclaimed.length > 0) {
      expect(unclaimed[0].message).toContain("Married/Common-Law");
    }
  });
});

// ─── tax-credits-refundable ─────────────────────────────────────────────────

describe("tax-credits-refundable insight", () => {
  it("generated when refundable credits exceed estimated tax", () => {
    const credits: TaxCredit[] = [
      { id: "1", category: "Canada Workers Benefit (CWB)", annualAmount: 20_000, type: "refundable" },
    ];
    // annualTax = 14_400 < 20_000 refundable
    const data: FinancialData = { ...baseData, taxCredits: credits, filingStatus: "single" };
    const insights = generateInsights(data);
    const refundable = ofType(insights, "tax-credits-refundable");
    expect(refundable).toHaveLength(1);
    expect(refundable[0].message).toContain("tax refund");
  });

  it("not generated when refundable credits do not exceed tax", () => {
    const credits: TaxCredit[] = [
      { id: "1", category: "Canada Workers Benefit (CWB)", annualAmount: 500, type: "refundable" },
    ];
    // annualTax = 14_400 > 500
    const data: FinancialData = { ...baseData, taxCredits: credits, filingStatus: "single" };
    const insights = generateInsights(data);
    expect(ofType(insights, "tax-credits-refundable")).toHaveLength(0);
  });

  it("not generated for non-refundable credits", () => {
    const credits: TaxCredit[] = [
      { id: "1", category: "Disability Tax Credit (DTC)", annualAmount: 20_000, type: "non-refundable" },
    ];
    const data: FinancialData = { ...baseData, taxCredits: credits, filingStatus: "single" };
    const insights = generateInsights(data);
    expect(ofType(insights, "tax-credits-refundable")).toHaveLength(0);
  });
});

// ─── tax-credits-ineligible ─────────────────────────────────────────────────

describe("tax-credits-ineligible insight", () => {
  it("generated when user claims MFS-ineligible US credit", () => {
    const credits: TaxCredit[] = [
      { id: "1", category: "Earned Income Tax Credit (EITC)", annualAmount: 3_000, type: "refundable" },
      { id: "2", category: "Child Tax Credit", annualAmount: 2_000, type: "refundable" },
    ];
    const data: FinancialData = {
      ...baseData,
      country: "US",
      taxCredits: credits,
      filingStatus: "married-separately",
      monthlyGrossIncome: 4_000,
    };
    const insights = generateInsights(data);
    const ineligible = ofType(insights, "tax-credits-ineligible");
    expect(ineligible).toHaveLength(1);
    expect(ineligible[0].message).toContain("Married Filing Separately");
    expect(ineligible[0].message).toContain("1 of your claimed credit");
  });

  it("reports adjusted credit total excluding ineligible amounts", () => {
    const credits: TaxCredit[] = [
      { id: "1", category: "Earned Income Tax Credit (EITC)", annualAmount: 3_000, type: "refundable" }, // ineligible MFS
      { id: "2", category: "Child Tax Credit", annualAmount: 2_000, type: "refundable" }, // eligible MFS
    ];
    const data: FinancialData = {
      ...baseData,
      country: "US",
      taxCredits: credits,
      filingStatus: "married-separately",
      monthlyGrossIncome: 4_000,
    };
    const insights = generateInsights(data);
    const ineligible = ofType(insights, "tax-credits-ineligible");
    // Adjusted total = 2_000 (EITC excluded)
    expect(ineligible[0].message).toContain("$2,000");
  });

  it("not generated when all credits are eligible", () => {
    const credits: TaxCredit[] = [
      { id: "1", category: "GST/HST Credit", annualAmount: 500, type: "refundable" },
    ];
    const data: FinancialData = {
      ...baseData,
      country: "CA",
      taxCredits: credits,
      filingStatus: "single",
      monthlyGrossIncome: 2_000, // low income — eligible
    };
    const insights = generateInsights(data);
    expect(ofType(insights, "tax-credits-ineligible")).toHaveLength(0);
  });

  it("counts multiple ineligible credits", () => {
    const credits: TaxCredit[] = [
      { id: "1", category: "Earned Income Tax Credit (EITC)", annualAmount: 3_000, type: "refundable" },
      { id: "2", category: "Child and Dependent Care Credit", annualAmount: 1_000, type: "non-refundable" },
      { id: "3", category: "Child Tax Credit", annualAmount: 2_000, type: "refundable" },
    ];
    // Both EITC and Child & Dependent Care are MFS-ineligible
    const data: FinancialData = {
      ...baseData,
      country: "US",
      taxCredits: credits,
      filingStatus: "married-separately",
      monthlyGrossIncome: 4_000,
    };
    const insights = generateInsights(data);
    const ineligible = ofType(insights, "tax-credits-ineligible");
    expect(ineligible).toHaveLength(1);
    expect(ineligible[0].message).toContain("2 of your claimed credits");
  });

  it("includes AGI in message when income is known", () => {
    const credits: TaxCredit[] = [
      { id: "1", category: "Earned Income Tax Credit (EITC)", annualAmount: 3_000, type: "refundable" },
    ];
    const data: FinancialData = {
      ...baseData,
      country: "US",
      taxCredits: credits,
      filingStatus: "married-separately",
      monthlyGrossIncome: 4_000, // 48_000 AGI
    };
    const insights = generateInsights(data);
    const ineligible = ofType(insights, "tax-credits-ineligible");
    expect(ineligible[0].message).toContain("48,000");
  });

  it("works for CA credit with income above hard cap", () => {
    const credits: TaxCredit[] = [
      { id: "1", category: "Canada Training Credit", annualAmount: 250, type: "refundable" },
    ];
    // Canada Training Credit hardCap = 150_473; 15k/month = 180k > hardCap
    const data: FinancialData = {
      ...baseData,
      country: "CA",
      taxCredits: credits,
      filingStatus: "single",
      monthlyGrossIncome: 15_000,
    };
    const insights = generateInsights(data);
    const ineligible = ofType(insights, "tax-credits-ineligible");
    expect(ineligible).toHaveLength(1);
  });
});
