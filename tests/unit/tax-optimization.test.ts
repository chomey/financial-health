import { describe, it, expect } from "vitest";
import { generateInsights, type FinancialData } from "@/lib/insights";
import { getMarginalRateForIncome } from "@/lib/tax-engine";

function makeData(overrides: Partial<FinancialData> = {}): FinancialData {
  return {
    totalAssets: 100_000,
    totalDebts: 0,
    monthlyIncome: 6_000,
    monthlyExpenses: 3_000,
    ...overrides,
  };
}

describe("getMarginalRateForIncome", () => {
  it("returns 0 for zero income", () => {
    expect(getMarginalRateForIncome(0, "CA", "ON")).toBe(0);
  });

  it("returns 0 for negative income", () => {
    expect(getMarginalRateForIncome(-1000, "CA", "ON")).toBe(0);
  });

  it("returns a positive rate for CA employment income", () => {
    const rate = getMarginalRateForIncome(80_000, "CA", "ON");
    expect(rate).toBeGreaterThan(0);
    expect(rate).toBeLessThan(1);
  });

  it("returns a positive rate for US employment income", () => {
    const rate = getMarginalRateForIncome(80_000, "US", "CA");
    expect(rate).toBeGreaterThan(0);
    expect(rate).toBeLessThan(1);
  });

  it("returns a higher marginal rate for higher income (CA)", () => {
    const low = getMarginalRateForIncome(30_000, "CA", "ON");
    const high = getMarginalRateForIncome(200_000, "CA", "ON");
    expect(high).toBeGreaterThan(low);
  });

  it("returns a higher marginal rate for higher income (US)", () => {
    const low = getMarginalRateForIncome(30_000, "US", "CA");
    const high = getMarginalRateForIncome(400_000, "US", "CA");
    expect(high).toBeGreaterThan(low);
  });
});

describe("tax optimization: taxable to tax-free suggestion", () => {
  it("generates suggestion when taxable balance is large enough", () => {
    // $100k taxable × 5% growth × 40% marginal = $2000/year savings → should show
    const data = makeData({
      marginalRate: 0.4,
      country: "CA",
      annualEmploymentIncome: 120_000,
      withdrawalTax: {
        taxDragMonths: 0,
        withdrawalOrder: ["Brokerage"],
        accountsByTreatment: {
          taxFree: { categories: [], total: 0 },
          taxDeferred: { categories: [], total: 0 },
          taxable: { categories: ["Brokerage"], total: 100_000 },
        },
      },
    });
    const insights = generateInsights(data);
    const suggestion = insights.find((i) => i.id === "tax-opt-taxable-to-free");
    expect(suggestion).toBeDefined();
    expect(suggestion?.type).toBe("tax-optimization");
    expect(suggestion?.message).toContain("TFSA");
    expect(suggestion?.message).toContain("40%");
  });

  it("uses Roth IRA label for US country", () => {
    const data = makeData({
      marginalRate: 0.35,
      country: "US",
      annualEmploymentIncome: 100_000,
      withdrawalTax: {
        taxDragMonths: 0,
        withdrawalOrder: ["Brokerage"],
        accountsByTreatment: {
          taxFree: { categories: [], total: 0 },
          taxDeferred: { categories: [], total: 0 },
          taxable: { categories: ["Brokerage"], total: 200_000 },
        },
      },
    });
    const insights = generateInsights(data);
    const suggestion = insights.find((i) => i.id === "tax-opt-taxable-to-free");
    expect(suggestion).toBeDefined();
    expect(suggestion?.message).toContain("Roth IRA");
  });

  it("does NOT generate suggestion when annual tax savings < $100", () => {
    // $1000 taxable × 5% growth × 20% marginal = $10/year savings → below threshold
    const data = makeData({
      marginalRate: 0.2,
      country: "CA",
      withdrawalTax: {
        taxDragMonths: 0,
        withdrawalOrder: ["Brokerage"],
        accountsByTreatment: {
          taxFree: { categories: [], total: 0 },
          taxDeferred: { categories: [], total: 0 },
          taxable: { categories: ["Brokerage"], total: 1_000 },
        },
      },
    });
    const insights = generateInsights(data);
    const suggestion = insights.find((i) => i.id === "tax-opt-taxable-to-free");
    expect(suggestion).toBeUndefined();
  });

  it("does NOT generate suggestion when taxable balance is 0", () => {
    const data = makeData({
      marginalRate: 0.4,
      country: "CA",
      withdrawalTax: {
        taxDragMonths: 0,
        withdrawalOrder: ["TFSA"],
        accountsByTreatment: {
          taxFree: { categories: ["TFSA"], total: 50_000 },
          taxDeferred: { categories: [], total: 0 },
          taxable: { categories: [], total: 0 },
        },
      },
    });
    const insights = generateInsights(data);
    const suggestion = insights.find((i) => i.id === "tax-opt-taxable-to-free");
    expect(suggestion).toBeUndefined();
  });
});

describe("tax optimization: tax-deferred contribution suggestion", () => {
  it("generates RRSP suggestion for CA with high marginal rate and taxable accounts", () => {
    const data = makeData({
      marginalRate: 0.43,
      country: "CA",
      annualEmploymentIncome: 150_000,
      withdrawalTax: {
        taxDragMonths: 0,
        withdrawalOrder: [],
        accountsByTreatment: {
          taxFree: { categories: [], total: 0 },
          taxDeferred: { categories: [], total: 0 },
          taxable: { categories: ["Savings"], total: 10_000 },
        },
      },
    });
    const insights = generateInsights(data);
    const suggestion = insights.find((i) => i.id === "tax-opt-deferred-contribution");
    expect(suggestion).toBeDefined();
    expect(suggestion?.message).toContain("RRSP");
    expect(suggestion?.message).toContain("$4,300"); // 43% × $10k
  });

  it("generates 401(k) suggestion for US with high marginal rate and taxable accounts", () => {
    const data = makeData({
      marginalRate: 0.32,
      country: "US",
      annualEmploymentIncome: 120_000,
      withdrawalTax: {
        taxDragMonths: 0,
        withdrawalOrder: [],
        accountsByTreatment: {
          taxFree: { categories: [], total: 0 },
          taxDeferred: { categories: [], total: 0 },
          taxable: { categories: ["Savings"], total: 10_000 },
        },
      },
    });
    const insights = generateInsights(data);
    const suggestion = insights.find((i) => i.id === "tax-opt-deferred-contribution");
    expect(suggestion).toBeDefined();
    expect(suggestion?.message).toContain("401(k)");
    expect(suggestion?.message).toContain("$3,200"); // 32% × $10k
  });

  it("does NOT generate suggestion when marginal rate < 25%", () => {
    const data = makeData({
      marginalRate: 0.20,
      country: "CA",
      annualEmploymentIncome: 40_000,
      withdrawalTax: {
        taxDragMonths: 0,
        withdrawalOrder: [],
        accountsByTreatment: {
          taxFree: { categories: [], total: 0 },
          taxDeferred: { categories: [], total: 0 },
          taxable: { categories: [], total: 0 },
        },
      },
    });
    const insights = generateInsights(data);
    const suggestion = insights.find((i) => i.id === "tax-opt-deferred-contribution");
    expect(suggestion).toBeUndefined();
  });

  it("does NOT generate suggestion when no employment income", () => {
    const data = makeData({
      marginalRate: 0.43,
      country: "CA",
      // annualEmploymentIncome omitted — no employment income
      withdrawalTax: {
        taxDragMonths: 0,
        withdrawalOrder: [],
        accountsByTreatment: {
          taxFree: { categories: [], total: 0 },
          taxDeferred: { categories: [], total: 0 },
          taxable: { categories: [], total: 0 },
        },
      },
    });
    const insights = generateInsights(data);
    const suggestion = insights.find((i) => i.id === "tax-opt-deferred-contribution");
    expect(suggestion).toBeUndefined();
  });
});

describe("tax optimization: use tax-free room suggestion", () => {
  it("generates suggestion when taxable > tax-free and no deferred accounts", () => {
    // Use small taxable balance so taxable-to-free suggestion ($1500×5%×20%=$15 < $100) does NOT fire,
    // but taxable > tax-free (0) and taxable > 1000 so the room suggestion fires instead.
    const data = makeData({
      marginalRate: 0.20,
      country: "CA",
      withdrawalTax: {
        taxDragMonths: 0,
        withdrawalOrder: ["Savings"],
        accountsByTreatment: {
          taxFree: { categories: [], total: 0 },
          taxDeferred: { categories: [], total: 0 },
          taxable: { categories: ["Savings"], total: 1_500 },
        },
      },
    });
    const insights = generateInsights(data);
    const suggestion = insights.find((i) => i.id === "tax-opt-use-tax-free-room");
    expect(suggestion).toBeDefined();
    expect(suggestion?.message).toContain("TFSA");
  });

  it("does NOT show tax-free-room suggestion when taxable-to-free suggestion already shown", () => {
    // taxable × 5% growth × marginalRate > $100 → taxable-to-free suggestion shown instead
    const data = makeData({
      marginalRate: 0.4,
      country: "CA",
      withdrawalTax: {
        taxDragMonths: 0,
        withdrawalOrder: ["Brokerage"],
        accountsByTreatment: {
          taxFree: { categories: [], total: 0 },
          taxDeferred: { categories: [], total: 0 },
          taxable: { categories: ["Brokerage"], total: 100_000 },
        },
      },
    });
    const insights = generateInsights(data);
    // taxable-to-free should be shown but NOT tax-free-room (duplicate)
    const suggestion1 = insights.find((i) => i.id === "tax-opt-taxable-to-free");
    const suggestion2 = insights.find((i) => i.id === "tax-opt-use-tax-free-room");
    expect(suggestion1).toBeDefined();
    expect(suggestion2).toBeUndefined();
  });

  it("does NOT generate suggestion when taxable <= tax-free", () => {
    const data = makeData({
      marginalRate: 0.35,
      country: "CA",
      withdrawalTax: {
        taxDragMonths: 0,
        withdrawalOrder: ["TFSA"],
        accountsByTreatment: {
          taxFree: { categories: ["TFSA"], total: 60_000 },
          taxDeferred: { categories: [], total: 0 },
          taxable: { categories: ["Savings"], total: 10_000 },
        },
      },
    });
    const insights = generateInsights(data);
    const suggestion = insights.find((i) => i.id === "tax-opt-use-tax-free-room");
    expect(suggestion).toBeUndefined();
  });
});

describe("tax optimization: no suggestions without marginal rate", () => {
  it("generates no tax-optimization insights when marginalRate is undefined", () => {
    const data = makeData({
      withdrawalTax: {
        taxDragMonths: 0,
        withdrawalOrder: [],
        accountsByTreatment: {
          taxFree: { categories: [], total: 0 },
          taxDeferred: { categories: [], total: 0 },
          taxable: { categories: ["Brokerage"], total: 200_000 },
        },
      },
    });
    const insights = generateInsights(data);
    const taxOptInsights = insights.filter((i) => i.type === "tax-optimization");
    expect(taxOptInsights).toHaveLength(0);
  });

  it("generates no tax-optimization insights when withdrawalTax is missing", () => {
    const data = makeData({
      marginalRate: 0.43,
      country: "CA",
      annualEmploymentIncome: 150_000,
    });
    const insights = generateInsights(data);
    const taxOptInsights = insights.filter((i) => i.type === "tax-optimization");
    expect(taxOptInsights).toHaveLength(0);
  });
});
