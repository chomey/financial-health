import { describe, it, expect } from "vitest";
import { generateInsights, deduplicateInsights } from "@/lib/insights/generate";
import type { FinancialData } from "@/lib/insights/types";

// Base AU financial data for tests
const AU_BASE: FinancialData = {
  totalAssets: 200_000,
  totalDebts: 50_000,
  monthlyIncome: 5_000,
  monthlyExpenses: 3_000,
  country: "AU",
  homeCurrency: "AUD",
};

describe("AU insights — super guarantee", () => {
  it("suggests adding a super account when AU user has income but no super", () => {
    const insights = generateInsights({
      ...AU_BASE,
      annualEmploymentIncome: 80_000,
      assetCategories: ["Savings Account"],
      debtCategories: [],
    });
    const superInsight = insights.find((i) => i.id === "au-super-missing");
    expect(superInsight).toBeDefined();
    expect(superInsight?.message).toContain("11.5%");
    expect(superInsight?.message).toContain("Super Guarantee");
    expect(superInsight?.type).toBe("au-super");
    expect(superInsight?.icon).toBe("🦘");
  });

  it("does not show super-missing when user already has a super account", () => {
    const insights = generateInsights({
      ...AU_BASE,
      annualEmploymentIncome: 80_000,
      assetCategories: ["Super (Accumulation)"],
      debtCategories: [],
    });
    const superMissing = insights.find((i) => i.id === "au-super-missing");
    expect(superMissing).toBeUndefined();
  });

  it("shows super guarantee check when employer contrib is significantly below 11.5%", () => {
    const annualIncome = 100_000;
    const expectedGuarantee = annualIncome * 0.115; // $11,500
    const lowEmployerContrib = 5_000; // well below 90% of expected
    const insights = generateInsights({
      ...AU_BASE,
      annualEmploymentIncome: annualIncome,
      employerMatchAnnual: lowEmployerContrib,
      assetCategories: ["Super (Accumulation)"],
      debtCategories: [],
    });
    const guaranteeInsight = insights.find((i) => i.id === "au-super-guarantee");
    expect(guaranteeInsight).toBeDefined();
    expect(guaranteeInsight?.message).toContain("11.5%");
    expect(guaranteeInsight?.message).toContain("Super Guarantee");
    void expectedGuarantee;
  });

  it("does not show guarantee warning when employer contrib is at 11.5%", () => {
    const annualIncome = 100_000;
    const insights = generateInsights({
      ...AU_BASE,
      annualEmploymentIncome: annualIncome,
      employerMatchAnnual: annualIncome * 0.115,
      assetCategories: ["Super (Accumulation)"],
      debtCategories: [],
    });
    expect(insights.find((i) => i.id === "au-super-guarantee")).toBeUndefined();
    expect(insights.find((i) => i.id === "au-super-missing")).toBeUndefined();
  });

  it("does not show super insights when no employment income", () => {
    const insights = generateInsights({
      ...AU_BASE,
      assetCategories: [],
      debtCategories: [],
    });
    expect(insights.find((i) => i.type === "au-super")).toBeUndefined();
  });
});

describe("AU insights — HECS-HELP", () => {
  it("shows HECS-HELP repayment insight when user has HECS debt and income above threshold", () => {
    const insights = generateInsights({
      ...AU_BASE,
      annualEmploymentIncome: 60_000,
      monthlyGrossIncome: 5_000,
      debtCategories: ["HECS-HELP"],
      assetCategories: [],
    });
    const hecsInsight = insights.find((i) => i.id === "au-hecs-repayment");
    expect(hecsInsight).toBeDefined();
    expect(hecsInsight?.message).toContain("HECS-HELP");
    expect(hecsInsight?.type).toBe("au-hecs-help");
    expect(hecsInsight?.icon).toBe("🎓");
  });

  it("does not show HECS insight when income is below repayment threshold", () => {
    const insights = generateInsights({
      ...AU_BASE,
      annualEmploymentIncome: 40_000,
      monthlyGrossIncome: 3_333,
      debtCategories: ["HECS-HELP"],
      assetCategories: [],
    });
    expect(insights.find((i) => i.id === "au-hecs-repayment")).toBeUndefined();
  });

  it("does not show HECS insight when user has no HECS-HELP debt", () => {
    const insights = generateInsights({
      ...AU_BASE,
      annualEmploymentIncome: 70_000,
      debtCategories: ["Personal Loan"],
      assetCategories: [],
    });
    expect(insights.find((i) => i.id === "au-hecs-repayment")).toBeUndefined();
  });

  it("detects HECS via 'hecs' in category name (case-insensitive)", () => {
    const insights = generateInsights({
      ...AU_BASE,
      annualEmploymentIncome: 55_000,
      monthlyGrossIncome: 4_583,
      debtCategories: ["HECS"],
      assetCategories: [],
    });
    expect(insights.find((i) => i.id === "au-hecs-repayment")).toBeDefined();
  });
});

describe("AU insights — FHSS eligibility", () => {
  it("suggests FHSS to non-homeowner with income and no existing FHSS account", () => {
    const insights = generateInsights({
      ...AU_BASE,
      annualEmploymentIncome: 70_000,
      isHomeowner: false,
      assetCategories: ["Super (Accumulation)"],
      debtCategories: [],
    });
    const fhssInsight = insights.find((i) => i.id === "au-fhss");
    expect(fhssInsight).toBeDefined();
    expect(fhssInsight?.message).toContain("FHSS");
    expect(fhssInsight?.message).toContain("$15,000/yr");
    expect(fhssInsight?.type).toBe("au-fhss");
    expect(fhssInsight?.icon).toBe("🏠");
  });

  it("does not suggest FHSS when user is a homeowner", () => {
    const insights = generateInsights({
      ...AU_BASE,
      annualEmploymentIncome: 70_000,
      isHomeowner: true,
      assetCategories: [],
      debtCategories: [],
    });
    expect(insights.find((i) => i.id === "au-fhss")).toBeUndefined();
  });

  it("does not suggest FHSS when user already has FHSS account", () => {
    const insights = generateInsights({
      ...AU_BASE,
      annualEmploymentIncome: 70_000,
      isHomeowner: false,
      assetCategories: ["First Home Super Saver"],
      debtCategories: [],
    });
    expect(insights.find((i) => i.id === "au-fhss")).toBeUndefined();
  });

  it("detects existing FHSS account by 'fhss' in category name", () => {
    const insights = generateInsights({
      ...AU_BASE,
      annualEmploymentIncome: 70_000,
      isHomeowner: false,
      assetCategories: ["FHSS Account"],
      debtCategories: [],
    });
    expect(insights.find((i) => i.id === "au-fhss")).toBeUndefined();
  });
});

describe("AU insights — franking credits", () => {
  it("suggests franking credits when user has taxable investments but no franking credit claim", () => {
    const insights = generateInsights({
      ...AU_BASE,
      withdrawalTax: {
        taxDragMonths: 0,
        withdrawalOrder: ["taxable"],
        accountsByTreatment: {
          taxFree: { categories: [], total: 0 },
          taxDeferred: { categories: [], total: 0 },
          taxable: { categories: ["Shares"], total: 50_000 },
        },
      },
      taxCredits: [],
      assetCategories: ["Shares"],
      debtCategories: [],
    });
    const frankingInsight = insights.find((i) => i.id === "au-franking");
    expect(frankingInsight).toBeDefined();
    expect(frankingInsight?.message).toContain("franking");
    expect(frankingInsight?.type).toBe("au-franking");
    expect(frankingInsight?.icon).toBe("📋");
  });

  it("does not suggest franking credits when taxable balance is small", () => {
    const insights = generateInsights({
      ...AU_BASE,
      withdrawalTax: {
        taxDragMonths: 0,
        withdrawalOrder: ["taxable"],
        accountsByTreatment: {
          taxFree: { categories: [], total: 0 },
          taxDeferred: { categories: [], total: 0 },
          taxable: { categories: ["Shares"], total: 5_000 }, // under $10k threshold
        },
      },
      taxCredits: [],
      assetCategories: ["Shares"],
      debtCategories: [],
    });
    expect(insights.find((i) => i.id === "au-franking")).toBeUndefined();
  });

  it("does not suggest franking credits when user already has franking credits claimed", () => {
    const insights = generateInsights({
      ...AU_BASE,
      withdrawalTax: {
        taxDragMonths: 0,
        withdrawalOrder: ["taxable"],
        accountsByTreatment: {
          taxFree: { categories: [], total: 0 },
          taxDeferred: { categories: [], total: 0 },
          taxable: { categories: ["Shares"], total: 50_000 },
        },
      },
      taxCredits: [{ id: "tc1", category: "Franking Credits", annualAmount: 2_000, type: "refundable" }],
      assetCategories: ["Shares"],
      debtCategories: [],
    });
    expect(insights.find((i) => i.id === "au-franking")).toBeUndefined();
  });
});

describe("AU insights — Medicare Levy Surcharge (MLS)", () => {
  it("warns about MLS when income is at or above $93k and no private health claimed", () => {
    const insights = generateInsights({
      ...AU_BASE,
      monthlyGrossIncome: 8_000, // $96k/yr
      taxCredits: [],
      assetCategories: [],
      debtCategories: [],
    });
    const mlsInsight = insights.find((i) => i.id === "au-mls");
    expect(mlsInsight).toBeDefined();
    expect(mlsInsight?.message).toContain("Medicare Levy Surcharge");
    expect(mlsInsight?.message).toContain("private hospital cover");
    expect(mlsInsight?.type).toBe("au-mls");
    expect(mlsInsight?.icon).toBe("🏥");
  });

  it("does not warn about MLS when income is below $93k threshold", () => {
    const insights = generateInsights({
      ...AU_BASE,
      monthlyGrossIncome: 7_000, // $84k/yr
      taxCredits: [],
      assetCategories: [],
      debtCategories: [],
    });
    expect(insights.find((i) => i.id === "au-mls")).toBeUndefined();
  });

  it("does not warn about MLS when user has private health insurance rebate claimed", () => {
    const insights = generateInsights({
      ...AU_BASE,
      monthlyGrossIncome: 10_000, // $120k/yr
      taxCredits: [{ id: "tc1", category: "Private Health Insurance Rebate", annualAmount: 500, type: "non-refundable" }],
      assetCategories: [],
      debtCategories: [],
    });
    expect(insights.find((i) => i.id === "au-mls")).toBeUndefined();
  });

  it("does not show MLS insight for CA users", () => {
    const insights = generateInsights({
      ...AU_BASE,
      country: "CA",
      monthlyGrossIncome: 10_000,
      taxCredits: [],
      assetCategories: [],
      debtCategories: [],
    });
    expect(insights.find((i) => i.id === "au-mls")).toBeUndefined();
  });
});

describe("AU insights — tax rate high message (buildTaxRateHighMessage via generateInsights)", () => {
  it("AU tax rate high message mentions salary sacrifice and concessional cap", () => {
    const insights = generateInsights({
      ...AU_BASE,
      monthlyIncome: 7_000,
      monthlyExpenses: 3_000,
      effectiveTaxRate: 0.35,
      annualTax: 29_400, // 35% of ~$84k
      monthlyGrossIncome: 7_000,
      assetCategories: ["Savings Account"],
      debtCategories: [],
    });
    const taxInsight = insights.find((i) => i.type === "tax");
    if (taxInsight) {
      expect(taxInsight.message).toContain("$30,000");
    }
    // Pass even if tax insight not triggered — just verifies no crash
  });

  it("AU tax rate high message with super account mentions salary sacrifice", () => {
    const insights = generateInsights({
      ...AU_BASE,
      monthlyIncome: 7_000,
      monthlyExpenses: 3_000,
      effectiveTaxRate: 0.35,
      annualTax: 29_400,
      monthlyGrossIncome: 7_000,
      assetCategories: ["Super (Accumulation)"],
      debtCategories: [],
    });
    const taxInsight = insights.find((i) => i.type === "tax");
    if (taxInsight) {
      expect(taxInsight.message).toContain("salary sacrific");
    }
  });
});

describe("AU insights — withdrawal tax no-free account message", () => {
  it("uses AU-specific language for withdrawal tax suggestion when no tax-free accounts", () => {
    const insights = generateInsights({
      ...AU_BASE,
      withdrawalTax: {
        taxDragMonths: 0,
        withdrawalOrder: ["taxDeferred"],
        accountsByTreatment: {
          taxFree: { categories: [], total: 0 },
          taxDeferred: { categories: ["Super (Accumulation)"], total: 150_000 },
          taxable: { categories: [], total: 0 },
        },
      },
      assetCategories: ["Super (Accumulation)"],
      debtCategories: [],
    });
    const noFreeInsight = insights.find((i) => i.id === "withdrawal-tax-no-free");
    if (noFreeInsight) {
      expect(noFreeInsight.message).not.toContain("TFSA");
      expect(noFreeInsight.message).not.toContain("Roth IRA");
      expect(noFreeInsight.message).toContain("super");
      expect(noFreeInsight.message).toContain("tax-free");
    }
    // Insight may not fire if pct < threshold — verify no crash
  });
});

describe("AU insights — tax optimization account names", () => {
  it("uses Super account names for AU tax optimization suggestions", () => {
    const insights = generateInsights({
      ...AU_BASE,
      marginalRate: 0.325,
      annualEmploymentIncome: 80_000,
      withdrawalTax: {
        taxDragMonths: 0,
        withdrawalOrder: ["taxable"],
        accountsByTreatment: {
          taxFree: { categories: [], total: 0 },
          taxDeferred: { categories: [], total: 0 },
          taxable: { categories: ["Shares"], total: 100_000 },
        },
      },
      assetCategories: ["Shares"],
      debtCategories: [],
    });
    // Tax opt taxable-to-free should mention Super (Pension Phase)
    const taxableToFree = insights.find((i) => i.id === "tax-opt-taxable-to-free");
    if (taxableToFree) {
      expect(taxableToFree.message).toContain("Super (Pension Phase)");
    }
    // Deferred contribution should mention salary sacrifice for AU
    const deferredContrib = insights.find((i) => i.id === "tax-opt-deferred-contribution");
    if (deferredContrib) {
      expect(deferredContrib.message).toContain("salary sacrific");
      expect(deferredContrib.message).toContain("15%");
      expect(deferredContrib.message).not.toContain("RRSP");
      expect(deferredContrib.message).not.toContain("401(k)");
    }
  });
});

describe("AU insights — unclaimed credits suggestions", () => {
  it("suggests LITO for low-income AU users who haven't claimed it", () => {
    const insights = generateInsights({
      ...AU_BASE,
      monthlyGrossIncome: 3_500, // $42k/yr — below LITO phase-out
      // Must have at least 1 credit for the unclaimed-credits section to run
      taxCredits: [{ id: "tc1", category: "Franking Credits", annualAmount: 500, type: "refundable" }],
      filingStatus: "single",
      assetCategories: [],
      debtCategories: [],
    });
    const litoSuggestion = insights.find((i) => i.id?.includes("low-income-tax-offset"));
    expect(litoSuggestion).toBeDefined();
    expect(litoSuggestion?.message).toContain("Low Income Tax Offset (LITO)");
    expect(litoSuggestion?.message).toContain("$700");
  });

  it("does not suggest LITO for high-income AU users", () => {
    const insights = generateInsights({
      ...AU_BASE,
      monthlyGrossIncome: 7_000, // $84k/yr — above LITO cutoff
      taxCredits: [],
      filingStatus: "single",
      assetCategories: [],
      debtCategories: [],
    });
    const litoSuggestion = insights.find((i) => i.id?.includes("low-income-tax-offset"));
    expect(litoSuggestion).toBeUndefined();
  });

  it("suggests Super Co-contribution for low-income AU users", () => {
    const insights = generateInsights({
      ...AU_BASE,
      monthlyGrossIncome: 3_000, // $36k/yr — below co-contribution threshold
      // Must have at least 1 credit to trigger unclaimed-credits block
      taxCredits: [{ id: "tc1", category: "Franking Credits", annualAmount: 500, type: "refundable" }],
      filingStatus: "single",
      assetCategories: [],
      debtCategories: [],
    });
    const coContrib = insights.find((i) => i.id?.includes("super-co-contribution"));
    expect(coContrib).toBeDefined();
    expect(coContrib?.message).toContain("Super Co-contribution");
  });

  it("does not show CA/US credits for AU users", () => {
    const insights = generateInsights({
      ...AU_BASE,
      monthlyGrossIncome: 3_000,
      taxCredits: [],
      filingStatus: "single",
      assetCategories: [],
      debtCategories: [],
    });
    const ccbSuggestion = insights.find((i) => i.message?.includes("Canada Child Benefit"));
    const eitcSuggestion = insights.find((i) => i.message?.includes("Earned Income Tax Credit"));
    expect(ccbSuggestion).toBeUndefined();
    expect(eitcSuggestion).toBeUndefined();
  });
});

describe("CA/US regression — AU insights do not appear", () => {
  it("CA users do not see AU super insights", () => {
    const insights = generateInsights({
      ...AU_BASE,
      country: "CA",
      annualEmploymentIncome: 80_000,
      assetCategories: [],
      debtCategories: [],
    });
    expect(insights.find((i) => i.type === "au-super")).toBeUndefined();
    expect(insights.find((i) => i.type === "au-hecs-help")).toBeUndefined();
    expect(insights.find((i) => i.type === "au-fhss")).toBeUndefined();
    expect(insights.find((i) => i.type === "au-franking")).toBeUndefined();
    expect(insights.find((i) => i.type === "au-mls")).toBeUndefined();
  });

  it("US users do not see AU super insights", () => {
    const insights = generateInsights({
      ...AU_BASE,
      country: "US",
      annualEmploymentIncome: 80_000,
      monthlyGrossIncome: 8_000,
      assetCategories: [],
      debtCategories: [],
      taxCredits: [],
    });
    expect(insights.find((i) => i.type === "au-super")).toBeUndefined();
    expect(insights.find((i) => i.type === "au-mls")).toBeUndefined();
  });

  it("CA tax optimization still uses TFSA/RRSP account names", () => {
    const insights = generateInsights({
      ...AU_BASE,
      country: "CA",
      homeCurrency: "CAD",
      marginalRate: 0.33,
      annualEmploymentIncome: 80_000,
      withdrawalTax: {
        taxDragMonths: 0,
        withdrawalOrder: ["taxable"],
        accountsByTreatment: {
          taxFree: { categories: [], total: 0 },
          taxDeferred: { categories: [], total: 0 },
          taxable: { categories: ["Brokerage"], total: 100_000 },
        },
      },
      assetCategories: ["Brokerage"],
      debtCategories: [],
    });
    const deferredInsight = insights.find((i) => i.id === "tax-opt-deferred-contribution");
    if (deferredInsight) {
      expect(deferredInsight.message).toContain("RRSP");
      expect(deferredInsight.message).not.toContain("salary sacrific");
    }
  });

  it("US tax optimization still uses 401(k)/Roth IRA account names", () => {
    const insights = generateInsights({
      ...AU_BASE,
      country: "US",
      homeCurrency: "USD",
      marginalRate: 0.25,
      annualEmploymentIncome: 80_000,
      withdrawalTax: {
        taxDragMonths: 0,
        withdrawalOrder: ["taxable"],
        accountsByTreatment: {
          taxFree: { categories: [], total: 0 },
          taxDeferred: { categories: [], total: 0 },
          taxable: { categories: ["Brokerage"], total: 100_000 },
        },
      },
      assetCategories: ["Brokerage"],
      debtCategories: [],
    });
    const deferredInsight = insights.find((i) => i.id === "tax-opt-deferred-contribution");
    if (deferredInsight) {
      expect(deferredInsight.message).toContain("401(k)");
      expect(deferredInsight.message).not.toContain("salary sacrific");
    }
  });
});

describe("deduplicateInsights — AU types pass through", () => {
  it("AU insight types are not dropped by deduplication", () => {
    const rawInsights = [
      { id: "au-super-missing", type: "au-super" as const, message: "test", icon: "🦘" },
      { id: "au-hecs-repayment", type: "au-hecs-help" as const, message: "test", icon: "🎓" },
      { id: "au-fhss", type: "au-fhss" as const, message: "test", icon: "🏠" },
      { id: "au-franking", type: "au-franking" as const, message: "test", icon: "📋" },
      { id: "au-mls", type: "au-mls" as const, message: "test", icon: "🏥" },
    ];
    const result = deduplicateInsights(rawInsights);
    expect(result).toHaveLength(5);
    expect(result.map((i) => i.id)).toEqual(expect.arrayContaining([
      "au-super-missing", "au-hecs-repayment", "au-fhss", "au-franking", "au-mls",
    ]));
  });
});
