import { describe, it, expect } from "vitest";
import { computeTotals, computeMetrics, toFinancialData } from "@/lib/financial-state";
import type { FinancialState } from "@/lib/financial-state";
import { projectFinances } from "@/lib/projections";
import { generateInsights } from "@/lib/insights";

function makeState(overrides: Partial<FinancialState> = {}): FinancialState {
  return {
    assets: [],
    debts: [],
    income: [],
    expenses: [],
    properties: [],
    stocks: [],
    country: "CA",
    jurisdiction: "ON",
    ...overrides,
  };
}

describe("tax summary in computeMetrics", () => {
  it("includes Estimated Tax metric card", () => {
    const state = makeState({
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
    });
    const metrics = computeMetrics(state);
    const taxMetric = metrics.find((m) => m.title === "Estimated Tax");
    expect(taxMetric).toBeDefined();
    expect(taxMetric!.icon).toBe("🏛️");
    expect(taxMetric!.value).toBeGreaterThan(0);
    expect(taxMetric!.format).toBe("currency");
  });

  it("shows effective tax rate on the tax metric", () => {
    const state = makeState({
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
    });
    const metrics = computeMetrics(state);
    const taxMetric = metrics.find((m) => m.title === "Estimated Tax");
    expect(taxMetric!.effectiveRate).toBeDefined();
    expect(taxMetric!.effectiveRate).toBeGreaterThan(0);
    expect(taxMetric!.effectiveRate).toBeLessThan(1);
  });

  it("shows zero tax for zero income", () => {
    const state = makeState({
      income: [],
    });
    const metrics = computeMetrics(state);
    const taxMetric = metrics.find((m) => m.title === "Estimated Tax");
    expect(taxMetric).toBeDefined();
    expect(taxMetric!.value).toBe(0);
  });

  it("tax metric has breakdown string when tax > 0", () => {
    const state = makeState({
      income: [{ id: "i1", category: "Salary", amount: 8000 }],
    });
    const metrics = computeMetrics(state);
    const taxMetric = metrics.find((m) => m.title === "Estimated Tax");
    expect(taxMetric!.breakdown).toBeDefined();
    expect(taxMetric!.breakdown).toContain("gross");
    expect(taxMetric!.breakdown).toContain("tax");
  });
});

describe("surplus uses after-tax income", () => {
  it("surplus is lower than gross income minus expenses", () => {
    const state = makeState({
      assets: [{ id: "a1", category: "Savings", amount: 10000 }],
      income: [{ id: "i1", category: "Salary", amount: 8000 }],
      expenses: [{ id: "e1", category: "Rent", amount: 2000 }],
    });
    const { monthlyAfterTaxIncome, monthlyIncome } = computeTotals(state);
    // After-tax income should be less than gross
    expect(monthlyAfterTaxIncome).toBeLessThan(monthlyIncome);

    const metrics = computeMetrics(state);
    const surplusMetric = metrics.find((m) => m.title === "Monthly Surplus");
    // Surplus should be based on after-tax, not gross
    const grossSurplus = monthlyIncome - 2000;
    expect(surplusMetric!.value).toBeLessThan(grossSurplus);
  });

  it("surplus breakdown mentions after-tax income", () => {
    const state = makeState({
      assets: [{ id: "a1", category: "Savings", amount: 10000 }],
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
      expenses: [{ id: "e1", category: "Rent", amount: 2000 }],
    });
    const metrics = computeMetrics(state);
    const surplusMetric = metrics.find((m) => m.title === "Monthly Surplus");
    expect(surplusMetric!.breakdown).toContain("after-tax income");
  });
});

describe("projections use after-tax surplus", () => {
  it("projection uses after-tax income for surplus allocation", () => {
    const state = makeState({
      assets: [{ id: "a1", category: "Savings", amount: 10000, roi: 0, surplusTarget: true }],
      income: [{ id: "i1", category: "Salary", amount: 8000 }],
      expenses: [{ id: "e1", category: "Rent", amount: 2000 }],
      country: "CA",
      jurisdiction: "ON",
    });

    const { monthlyAfterTaxIncome } = computeTotals(state);
    const afterTaxSurplus = monthlyAfterTaxIncome - 2000;

    const result = projectFinances(state, 1);
    // After 12 months, assets should grow by approximately afterTaxSurplus * 12
    const growthOver12Months = result.points[12].totalAssets - 10000;
    // Should be close to afterTaxSurplus * 12 (within rounding)
    expect(growthOver12Months).toBeGreaterThan(afterTaxSurplus * 11);
    expect(growthOver12Months).toBeLessThan(afterTaxSurplus * 13);
    // And definitely less than gross surplus * 12
    const grossSurplus = 8000 - 2000;
    expect(growthOver12Months).toBeLessThan(grossSurplus * 12);
  });

  it("projections with no income have no surplus growth", () => {
    const state = makeState({
      assets: [{ id: "a1", category: "Savings", amount: 10000, roi: 0 }],
    });
    const result = projectFinances(state, 1);
    expect(result.points[12].totalAssets).toBe(10000);
  });
});

describe("tax-related insights", () => {
  it("generates tax insight with effective rate", () => {
    const data = toFinancialData(makeState({
      income: [{ id: "i1", category: "Salary", amount: 8000 }],
    }));
    const insights = generateInsights(data);
    const taxInsight = insights.find((i) => i.type === "tax");
    expect(taxInsight).toBeDefined();
    expect(taxInsight!.icon).toBe("🏛️");
    expect(taxInsight!.message).toContain("effective tax rate");
  });

  it("generates capital gains insight when capital gains income exists", () => {
    const data = toFinancialData(makeState({
      income: [{ id: "i1", category: "Stock Sale", amount: 5000, incomeType: "capital-gains" as const }],
    }));
    const insights = generateInsights(data);
    const taxInsight = insights.find((i) => i.type === "tax");
    expect(taxInsight).toBeDefined();
    expect(taxInsight!.message).toContain("capital gains");
  });

  it("does not generate tax insight when income is zero", () => {
    const data = toFinancialData(makeState({}));
    const insights = generateInsights(data);
    const taxInsight = insights.find((i) => i.type === "tax");
    expect(taxInsight).toBeUndefined();
  });

  it("toFinancialData includes tax fields", () => {
    const data = toFinancialData(makeState({
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
    }));
    expect(data.effectiveTaxRate).toBeDefined();
    expect(data.effectiveTaxRate).toBeGreaterThan(0);
    expect(data.annualTax).toBeDefined();
    expect(data.annualTax).toBeGreaterThan(0);
    expect(data.hasCapitalGains).toBe(false);
  });

  it("toFinancialData marks hasCapitalGains when applicable", () => {
    const data = toFinancialData(makeState({
      income: [
        { id: "i1", category: "Salary", amount: 5000 },
        { id: "i2", category: "Stock Sale", amount: 2000, incomeType: "capital-gains" as const },
      ],
    }));
    expect(data.hasCapitalGains).toBe(true);
  });
});

describe("US tax produces different results than CA", () => {
  it("US and CA have different tax amounts for same income", () => {
    const caState = makeState({
      income: [{ id: "i1", category: "Salary", amount: 8000 }],
      country: "CA",
      jurisdiction: "ON",
    });
    const usState = makeState({
      income: [{ id: "i1", category: "Salary", amount: 8000 }],
      country: "US",
      jurisdiction: "CA",
    });

    const caTotals = computeTotals(caState);
    const usTotals = computeTotals(usState);

    // Both should have taxes > 0
    expect(caTotals.totalTaxEstimate).toBeGreaterThan(0);
    expect(usTotals.totalTaxEstimate).toBeGreaterThan(0);
    // Tax amounts should differ between countries
    expect(caTotals.totalTaxEstimate).not.toBe(usTotals.totalTaxEstimate);
  });
});
