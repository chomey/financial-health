import { describe, it, expect } from "vitest";
import {
  INITIAL_STATE,
  computeTotals,
  computeMetrics,
  toFinancialData,
} from "@/lib/financial-state";
import type { FinancialState } from "@/lib/financial-state";
import { computeTax } from "@/lib/tax-engine";

describe("financial-state", () => {
  describe("INITIAL_STATE", () => {
    it("contains mock data for all sections", () => {
      expect(INITIAL_STATE.assets.length).toBeGreaterThan(0);
      expect(INITIAL_STATE.debts.length).toBeGreaterThan(0);
      expect(INITIAL_STATE.income.length).toBeGreaterThan(0);
      expect(INITIAL_STATE.expenses.length).toBeGreaterThan(0);
    });
  });

  describe("computeTotals", () => {
    it("sums assets correctly from initial state", () => {
      const { totalAssets } = computeTotals(INITIAL_STATE);
      expect(totalAssets).toBe(5000 + 22000 + 28000);
    });

    it("sums debts correctly from initial state", () => {
      const { totalDebts } = computeTotals(INITIAL_STATE);
      expect(totalDebts).toBe(5000);
    });

    it("sums income correctly from initial state", () => {
      const { monthlyIncome } = computeTotals(INITIAL_STATE);
      expect(monthlyIncome).toBe(4500);
    });

    it("sums expenses correctly from initial state", () => {
      const { monthlyExpenses } = computeTotals(INITIAL_STATE);
      expect(monthlyExpenses).toBe(1800 + 500 + 50);
    });

    it("computes property equity from initial state", () => {
      const { totalPropertyEquity, totalPropertyValue, totalPropertyMortgage } = computeTotals(INITIAL_STATE);
      expect(totalPropertyValue).toBe(0);
      expect(totalPropertyMortgage).toBe(0);
      expect(totalPropertyEquity).toBe(0);
    });

    it("handles empty arrays", () => {
      const empty: FinancialState = {
        assets: [],
        debts: [],
        income: [],
        expenses: [],
        properties: [],
        stocks: [],
      };
      const totals = computeTotals(empty);
      expect(totals.totalAssets).toBe(0);
      expect(totals.totalDebts).toBe(0);
      expect(totals.monthlyIncome).toBe(0);
      expect(totals.monthlyExpenses).toBe(0);
      expect(totals.monthlyAfterTaxIncome).toBe(0);
      expect(totals.totalTaxEstimate).toBe(0);
    });

    it("computes after-tax monthly income for initial state", () => {
      const totals = computeTotals(INITIAL_STATE);
      // Gross monthly: 4500, after-tax should be less
      expect(totals.monthlyAfterTaxIncome).toBeLessThan(totals.monthlyIncome);
      expect(totals.monthlyAfterTaxIncome).toBeGreaterThan(0);
      expect(totals.totalTaxEstimate).toBeGreaterThan(0);
      expect(totals.effectiveTaxRate).toBeGreaterThan(0);
      expect(totals.effectiveTaxRate).toBeLessThan(1);
    });

    it("computes after-tax income matching individual tax computations", () => {
      const totals = computeTotals(INITIAL_STATE);
      // Manually compute: Salary $54k, employment, CA/ON
      const salaryTax = computeTax(54000, "employment", "CA", "ON");
      const expectedAfterTaxAnnual = salaryTax.afterTaxIncome;
      expect(totals.monthlyAfterTaxIncome).toBeCloseTo(expectedAfterTaxAnnual / 12, 2);
      expect(totals.totalTaxEstimate).toBeCloseTo(salaryTax.totalTax, 2);
    });

    it("handles capital gains income type for after-tax computation", () => {
      const state: FinancialState = {
        ...INITIAL_STATE,
        income: [
          { id: "i1", category: "Stock Sale", amount: 5000, incomeType: "capital-gains" },
        ],
        country: "CA",
        jurisdiction: "ON",
      };
      const totals = computeTotals(state);
      // Capital gains should be taxed at a lower effective rate than employment income
      const capGainsTax = computeTax(60000, "capital-gains", "CA", "ON");
      expect(totals.monthlyAfterTaxIncome).toBeCloseTo(capGainsTax.afterTaxIncome / 12, 2);
    });

    it("handles US income tax computation", () => {
      const state: FinancialState = {
        ...INITIAL_STATE,
        income: [
          { id: "i1", category: "Salary", amount: 5000 },
        ],
        country: "US",
        jurisdiction: "CA",
      };
      const totals = computeTotals(state);
      const usTax = computeTax(60000, "employment", "US", "CA");
      expect(totals.monthlyAfterTaxIncome).toBeCloseTo(usTax.afterTaxIncome / 12, 2);
      expect(totals.totalTaxEstimate).toBeCloseTo(usTax.totalTax, 2);
    });
  });

  describe("computeMetrics", () => {
    it("returns five metrics including Estimated Tax", () => {
      const metrics = computeMetrics(INITIAL_STATE);
      expect(metrics).toHaveLength(5);
      expect(metrics.map(m => m.title)).toContain("Estimated Tax");
    });

    it("computes net worth as liquid assets + property equity minus debts", () => {
      const metrics = computeMetrics(INITIAL_STATE);
      const netWorth = metrics.find((m) => m.title === "Net Worth");
      expect(netWorth).toBeDefined();
      // liquid assets (55000) + property equity (0) - debts (5000)
      expect(netWorth!.value).toBe(55000 + 0 - 5000);
      expect(netWorth!.format).toBe("currency");
    });

    it("computes monthly surplus using after-tax income minus expenses", () => {
      const metrics = computeMetrics(INITIAL_STATE);
      const surplus = metrics.find((m) => m.title === "Monthly Surplus");
      expect(surplus).toBeDefined();
      // After-tax surplus should be less than pre-tax surplus (4500 - 2350 = 2150)
      const preTaxSurplus = 4500 - 2350;
      expect(surplus!.value).toBeLessThan(preTaxSurplus);
      expect(surplus!.value).toBeGreaterThan(0);
      expect(surplus!.positive).toBe(true);
    });

    it("surplus uses after-tax income consistently with computeTotals", () => {
      const metrics = computeMetrics(INITIAL_STATE);
      const totals = computeTotals(INITIAL_STATE);
      const surplus = metrics.find((m) => m.title === "Monthly Surplus");
      expect(surplus!.value).toBeCloseTo(
        totals.monthlyAfterTaxIncome - totals.monthlyExpenses - totals.totalMonthlyContributions,
        2
      );
    });

    it("surplus breakdown mentions after-tax income", () => {
      const metrics = computeMetrics(INITIAL_STATE);
      const surplus = metrics.find((m) => m.title === "Monthly Surplus");
      expect(surplus!.breakdown).toContain("after-tax income");
    });

    it("estimated tax metric shows annual tax and effective rate", () => {
      const metrics = computeMetrics(INITIAL_STATE);
      const tax = metrics.find((m) => m.title === "Estimated Tax");
      expect(tax).toBeDefined();
      expect(tax!.value).toBeGreaterThan(0);
      expect(tax!.format).toBe("currency");
      expect(tax!.effectiveRate).toBeGreaterThan(0);
      expect(tax!.effectiveRate).toBeLessThan(1);
    });

    it("computes financial runway as assets / expenses", () => {
      const metrics = computeMetrics(INITIAL_STATE);
      const runway = metrics.find((m) => m.title === "Financial Runway");
      expect(runway).toBeDefined();
      expect(runway!.value).toBeCloseTo(55000 / 2350, 1);
      expect(runway!.format).toBe("months");
    });

    it("computes debt-to-asset ratio including property", () => {
      const metrics = computeMetrics(INITIAL_STATE);
      const ratio = metrics.find((m) => m.title === "Debt-to-Asset Ratio");
      expect(ratio).toBeDefined();
      // (debts 5000 + mortgage 0) / (liquid 55000 + equity 0)
      expect(ratio!.value).toBeCloseTo((5000 + 0) / (55000 + 0), 2);
      expect(ratio!.format).toBe("ratio");
    });

    it("marks net worth as positive when assets exceed debts", () => {
      const state: FinancialState = {
        ...INITIAL_STATE,
        assets: [{ id: "1", category: "Savings", amount: 500000 }],
        debts: [{ id: "d1", category: "Loan", amount: 10000 }],
      };
      const metrics = computeMetrics(state);
      const netWorth = metrics.find((m) => m.title === "Net Worth");
      expect(netWorth!.positive).toBe(true);
    });

    it("marks surplus as negative when expenses exceed after-tax income", () => {
      const state: FinancialState = {
        ...INITIAL_STATE,
        income: [{ id: "i1", category: "Salary", amount: 1000 }],
        expenses: [{ id: "e1", category: "Rent", amount: 2000 }],
      };
      const metrics = computeMetrics(state);
      const surplus = metrics.find((m) => m.title === "Monthly Surplus");
      expect(surplus!.positive).toBe(false);
      // After-tax income of $1000/mo ($12k/yr) is less than $1000 due to taxes,
      // so surplus is more negative than -1000
      expect(surplus!.value).toBeLessThan(0);
    });

    it("handles zero expenses for runway calculation", () => {
      const state: FinancialState = {
        ...INITIAL_STATE,
        expenses: [],
      };
      const metrics = computeMetrics(state);
      const runway = metrics.find((m) => m.title === "Financial Runway");
      expect(runway!.value).toBe(0);
    });

    it("recalculates when items change", () => {
      const stateA = { ...INITIAL_STATE };
      const stateB = {
        ...INITIAL_STATE,
        assets: [
          ...INITIAL_STATE.assets,
          { id: "4", category: "New Savings", amount: 50000 },
        ],
      };
      const metricsA = computeMetrics(stateA);
      const metricsB = computeMetrics(stateB);
      const netWorthA = metricsA.find((m) => m.title === "Net Worth")!.value;
      const netWorthB = metricsB.find((m) => m.title === "Net Worth")!.value;
      expect(netWorthB - netWorthA).toBe(50000);
    });
  });

  describe("after-tax vs pre-tax comparison", () => {
    it("after-tax surplus is always less than or equal to pre-tax surplus", () => {
      const totals = computeTotals(INITIAL_STATE);
      const preTaxSurplus = totals.monthlyIncome - totals.monthlyExpenses - totals.totalMonthlyContributions;
      const afterTaxSurplus = totals.monthlyAfterTaxIncome - totals.monthlyExpenses - totals.totalMonthlyContributions;
      expect(afterTaxSurplus).toBeLessThan(preTaxSurplus);
    });

    it("no-income state has zero tax", () => {
      const state: FinancialState = {
        ...INITIAL_STATE,
        income: [],
      };
      const totals = computeTotals(state);
      expect(totals.monthlyAfterTaxIncome).toBe(0);
      expect(totals.totalTaxEstimate).toBe(0);
      expect(totals.effectiveTaxRate).toBe(0);
    });

    it("capital gains income is taxed at lower effective rate than employment", () => {
      const employmentState: FinancialState = {
        ...INITIAL_STATE,
        income: [{ id: "i1", category: "Salary", amount: 5000 }],
        country: "CA",
        jurisdiction: "ON",
      };
      const capitalGainsState: FinancialState = {
        ...INITIAL_STATE,
        income: [{ id: "i1", category: "Stock Sale", amount: 5000, incomeType: "capital-gains" as const }],
        country: "CA",
        jurisdiction: "ON",
      };
      const empTotals = computeTotals(employmentState);
      const cgTotals = computeTotals(capitalGainsState);
      expect(cgTotals.effectiveTaxRate).toBeLessThan(empTotals.effectiveTaxRate);
      expect(cgTotals.monthlyAfterTaxIncome).toBeGreaterThan(empTotals.monthlyAfterTaxIncome);
    });
  });

  describe("currency conversion in computeTotals", () => {
    it("converts USD asset to CAD for CA user", () => {
      const state: FinancialState = {
        ...INITIAL_STATE,
        assets: [{ id: "a1", category: "Brokerage", amount: 10000, currency: "USD" }],
        debts: [],
        country: "CA",
        fxRates: { USD_CAD: 1.37, CAD_USD: 0.73 },
      };
      const totals = computeTotals(state);
      expect(totals.totalAssets).toBeCloseTo(13700, 0);
      expect(totals.homeCurrency).toBe("CAD");
    });

    it("converts CAD debt to USD for US user", () => {
      const state: FinancialState = {
        ...INITIAL_STATE,
        assets: [],
        debts: [{ id: "d1", category: "Loan", amount: 10000, currency: "CAD" }],
        country: "US",
        jurisdiction: "CA",
        fxRates: { USD_CAD: 1.37, CAD_USD: 0.73 },
      };
      const totals = computeTotals(state);
      expect(totals.totalDebts).toBeCloseTo(7300, 0);
      expect(totals.homeCurrency).toBe("USD");
    });

    it("does not convert when item currency matches home currency", () => {
      const state: FinancialState = {
        ...INITIAL_STATE,
        assets: [{ id: "a1", category: "TFSA", amount: 10000, currency: "CAD" }],
        debts: [],
        country: "CA",
        fxRates: { USD_CAD: 1.37, CAD_USD: 0.73 },
      };
      const totals = computeTotals(state);
      expect(totals.totalAssets).toBe(10000);
    });

    it("does not convert when no currency is specified (defaults to home)", () => {
      const state: FinancialState = {
        ...INITIAL_STATE,
        assets: [{ id: "a1", category: "TFSA", amount: 10000 }],
        debts: [],
        country: "CA",
      };
      const totals = computeTotals(state);
      expect(totals.totalAssets).toBe(10000);
    });

    it("uses manual FX override when set", () => {
      const state: FinancialState = {
        ...INITIAL_STATE,
        assets: [{ id: "a1", category: "Brokerage", amount: 10000, currency: "USD" }],
        debts: [],
        country: "CA",
        fxManualOverride: 1.40, // 1 USD = 1.40 CAD
      };
      const totals = computeTotals(state);
      expect(totals.totalAssets).toBeCloseTo(14000, 0);
    });

    it("converts property values and mortgages", () => {
      const state: FinancialState = {
        ...INITIAL_STATE,
        assets: [],
        debts: [],
        properties: [{ id: "p1", name: "US Condo", value: 200000, mortgage: 150000, currency: "USD" }],
        country: "CA",
        fxRates: { USD_CAD: 1.37, CAD_USD: 0.73 },
      };
      const totals = computeTotals(state);
      expect(totals.totalPropertyValue).toBeCloseTo(200000 * 1.37, 0);
      expect(totals.totalPropertyMortgage).toBeCloseTo(150000 * 1.37, 0);
      expect(totals.totalPropertyEquity).toBeCloseTo(50000 * 1.37, 0);
    });
  });

  describe("tax-adjusted runway", () => {
    it("shows runwayAfterTax when portfolio has tax-deferred accounts with high expenses", () => {
      // Large RRSP balance with high monthly expenses → higher tax rate on withdrawals
      const state: FinancialState = {
        assets: [
          { id: "a1", category: "TFSA", amount: 50000 },
          { id: "a2", category: "RRSP", amount: 200000 },
        ],
        debts: [],
        income: [],
        expenses: [{ id: "e1", category: "Living", amount: 5000 }],
        properties: [],
        stocks: [],
        country: "CA",
        jurisdiction: "ON",
      };
      const metrics = computeMetrics(state);
      const runway = metrics.find((m) => m.title === "Financial Runway");
      expect(runway).toBeDefined();
      // Base runway: 250000 / 5000 = 50 months
      expect(runway!.value).toBeCloseTo(50, 1);
      // Tax-adjusted runway should be less because RRSP withdrawals are taxed ($60k/yr)
      expect(runway!.runwayAfterTax).toBeDefined();
      expect(runway!.runwayAfterTax!).toBeLessThan(runway!.value);
      expect(runway!.runwayAfterTax!).toBeGreaterThan(0);
    });

    it("does not show runwayAfterTax when all accounts are tax-free", () => {
      const state: FinancialState = {
        assets: [
          { id: "a1", category: "TFSA", amount: 20000 },
          { id: "a2", category: "Roth IRA", amount: 30000 },
        ],
        debts: [],
        income: [],
        expenses: [{ id: "e1", category: "Living", amount: 2000 }],
        properties: [],
        stocks: [],
        country: "CA",
        jurisdiction: "ON",
      };
      const metrics = computeMetrics(state);
      const runway = metrics.find((m) => m.title === "Financial Runway");
      // All tax-free, no meaningful tax drag
      expect(runway!.runwayAfterTax).toBeUndefined();
    });

    it("tax-adjusted runway is lower than growth-aware runway for US 401k", () => {
      // Large 401k with high expenses → significant tax on $60k/yr withdrawals
      const state: FinancialState = {
        assets: [
          { id: "a1", category: "401k", amount: 300000 },
        ],
        debts: [],
        income: [],
        expenses: [{ id: "e1", category: "Living", amount: 5000 }],
        properties: [],
        stocks: [],
        country: "US",
        jurisdiction: "CA",
      };
      const metrics = computeMetrics(state);
      const runway = metrics.find((m) => m.title === "Financial Runway");
      expect(runway!.value).toBeCloseTo(60, 1);
      // 401k has 7% default ROI, so runwayWithGrowth is set
      expect(runway!.runwayWithGrowth).toBeDefined();
      // Tax-adjusted should be less than growth-aware (tax eats into the benefit)
      expect(runway!.runwayAfterTax).toBeDefined();
      expect(runway!.runwayAfterTax!).toBeLessThan(runway!.runwayWithGrowth!);
      expect(runway!.runwayAfterTax!).toBeGreaterThan(0);
    });

    it("mixed portfolio: tax-free accounts withdrawn first extend runway", () => {
      // Compare: all RRSP vs half TFSA + half RRSP with high expenses
      const allDeferred: FinancialState = {
        assets: [{ id: "a1", category: "RRSP", amount: 200000 }],
        debts: [], income: [],
        expenses: [{ id: "e1", category: "Living", amount: 5000 }],
        properties: [], stocks: [],
        country: "CA", jurisdiction: "ON",
      };
      const mixed: FinancialState = {
        assets: [
          { id: "a1", category: "TFSA", amount: 100000 },
          { id: "a2", category: "RRSP", amount: 100000 },
        ],
        debts: [], income: [],
        expenses: [{ id: "e1", category: "Living", amount: 5000 }],
        properties: [], stocks: [],
        country: "CA", jurisdiction: "ON",
      };
      const deferredMetrics = computeMetrics(allDeferred);
      const mixedMetrics = computeMetrics(mixed);
      const deferredRunway = deferredMetrics.find((m) => m.title === "Financial Runway")!;
      const mixedRunway = mixedMetrics.find((m) => m.title === "Financial Runway")!;
      // Both have same base runway (40 months)
      expect(deferredRunway.value).toBeCloseTo(mixedRunway.value, 1);
      // Mixed should have better tax-adjusted runway because TFSA is withdrawn first
      expect(mixedRunway.runwayAfterTax!).toBeGreaterThan(deferredRunway.runwayAfterTax!);
    });
  });

  describe("toFinancialData", () => {
    it("converts state to FinancialData for insights", () => {
      const data = toFinancialData(INITIAL_STATE);
      // totalAssets includes property value (not equity): 55000 + 0
      expect(data.totalAssets).toBe(55000);
      // totalDebts includes mortgage: 5000 + 0
      expect(data.totalDebts).toBe(5000);
      // netWorth = totalAssets - totalDebts matches computeMetrics
      expect(data.totalAssets - data.totalDebts).toBe(55000 - 5000);
      // liquidAssets excludes property
      expect(data.liquidAssets).toBe(55000);
      // monthlyIncome now uses after-tax income
      const totals = computeTotals(INITIAL_STATE);
      expect(data.monthlyIncome).toBeCloseTo(totals.monthlyAfterTaxIncome, 2);
      expect(data.monthlyIncome).toBeLessThan(4500); // less than gross
      expect(data.monthlyExpenses).toBe(2350);
    });
  });
});
