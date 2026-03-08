import { describe, it, expect } from "vitest";
import {
  computeTotals,
  computeMetrics,
  computeMonthlyInvestmentReturns,
  toFinancialData,
  INITIAL_STATE,
  type FinancialState,
} from "@/lib/financial-state";
import { computeTax } from "@/lib/tax-engine";
import { projectFinances } from "@/lib/projections";
import { buildSankeyData } from "@/lib/sankey-data";

// Helper: create a minimal state for formula testing
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

describe("Formula Validation — Net Worth", () => {
  it("netWorth = totalAssets + totalStocks - totalDebts (without equity)", () => {
    const state = makeState({
      assets: [{ id: "a1", category: "Savings Account", amount: 50000 }],
      debts: [{ id: "d1", category: "Credit Card", amount: 5000 }],
      stocks: [{ id: "s1", symbol: "AAPL", shares: 10, lastFetchedPrice: 200, priceCurrency: "USD" }],
    });
    const metrics = computeMetrics(state);
    const nw = metrics.find((m) => m.title === "Net Worth")!;
    const totals = computeTotals(state);
    expect(nw.value).toBe(totals.totalAssets + totals.totalStocks - totals.totalDebts);
  });

  it("netWorthWithEquity adds property equity", () => {
    const state = makeState({
      assets: [{ id: "a1", category: "Savings Account", amount: 30000 }],
      debts: [{ id: "d1", category: "Car Loan", amount: 5000 }],
      properties: [{ id: "p1", name: "Home", value: 500000, mortgage: 300000 }],
    });
    const metrics = computeMetrics(state);
    const nw = metrics.find((m) => m.title === "Net Worth")!;
    const totals = computeTotals(state);
    // Primary value excludes equity
    expect(nw.value).toBe(totals.totalAssets + totals.totalStocks - totals.totalDebts);
    // valueWithEquity includes property equity
    expect(nw.valueWithEquity).toBe(
      totals.totalAssets + totals.totalStocks + totals.totalPropertyEquity - totals.totalDebts
    );
  });

  it("property equity is value minus mortgage, clamped to 0", () => {
    const state = makeState({
      properties: [{ id: "p1", name: "Home", value: 200000, mortgage: 250000 }],
    });
    const totals = computeTotals(state);
    expect(totals.totalPropertyEquity).toBe(0); // clamped, not negative
  });

  it("explainer breakdown adds up to net worth", () => {
    const state = makeState({
      assets: [
        { id: "a1", category: "Savings Account", amount: 10000 },
        { id: "a2", category: "TFSA", amount: 20000 },
      ],
      debts: [{ id: "d1", category: "Car Loan", amount: 3000 }],
      stocks: [{ id: "s1", symbol: "AAPL", shares: 5, lastFetchedPrice: 100 }],
    });
    const totals = computeTotals(state);
    const netWorth = totals.totalAssets + totals.totalStocks - totals.totalDebts;
    // Each component should sum correctly
    expect(netWorth).toBe(10000 + 20000 + 500 - 3000);
  });
});

describe("Formula Validation — Monthly Cash Flow", () => {
  it("surplus = afterTaxIncome + investmentReturns - expenses - contributions - mortgage", () => {
    const state = makeState({
      assets: [
        { id: "a1", category: "Savings Account", amount: 50000, roi: 3, monthlyContribution: 500 },
      ],
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
      expenses: [{ id: "e1", category: "Rent", amount: 1500 }],
      properties: [{ id: "p1", name: "Home", value: 400000, mortgage: 300000, monthlyPayment: 1200 }],
    });
    const totals = computeTotals(state);
    const investmentReturns = computeMonthlyInvestmentReturns(state.assets);
    const totalInvReturns = investmentReturns.reduce((s, r) => s + r.amount, 0);
    const metrics = computeMetrics(state);
    const surplus = metrics.find((m) => m.title === "Monthly Cash Flow")!;

    const expected = totals.monthlyAfterTaxIncome + totalInvReturns - totals.monthlyExpenses - totals.totalMonthlyContributions - totals.totalMortgagePayments;
    expect(surplus.value).toBeCloseTo(expected, 2);
  });

  it("investment returns use same ROI as shown in asset entries", () => {
    const roi = 5;
    const balance = 100000;
    const state = makeState({
      assets: [{ id: "a1", category: "Savings Account", amount: balance, roi }],
    });
    const returns = computeMonthlyInvestmentReturns(state.assets);
    expect(returns.length).toBe(1);
    expect(returns[0].amount).toBeCloseTo(balance * (roi / 100) / 12, 2);
    expect(returns[0].roi).toBe(roi);
    expect(returns[0].balance).toBe(balance);
  });
});

describe("Formula Validation — Estimated Tax", () => {
  it("federal + provincial = total tax", () => {
    const state = makeState({
      income: [{ id: "i1", category: "Salary", amount: 8000 }],
    });
    const totals = computeTotals(state);
    expect(totals.totalFederalTax + totals.totalProvincialStateTax).toBeCloseTo(totals.totalTaxEstimate, 2);
  });

  it("effective rate = totalTax / totalTaxableIncome", () => {
    const state = makeState({
      income: [{ id: "i1", category: "Salary", amount: 7000 }],
      assets: [{ id: "a1", category: "Savings Account", amount: 50000, roi: 3 }],
    });
    const totals = computeTotals(state);
    const expectedRate = totals.totalTaxableBase > 0 ? totals.totalTaxEstimate / totals.totalTaxableBase : 0;
    expect(totals.effectiveTaxRate).toBeCloseTo(expectedRate, 6);
  });

  it("bracket math: sum of bracket taxes = subtotal", () => {
    const annualIncome = 100000;
    const taxResult = computeTax(annualIncome, "employment", "CA", "ON");
    // Federal + provincial should equal total
    expect(taxResult.federalTax + taxResult.provincialStateTax).toBeCloseTo(taxResult.totalTax, 2);
    // After-tax = income - total tax
    expect(taxResult.afterTaxIncome).toBeCloseTo(annualIncome - taxResult.totalTax, 2);
  });

  it("investment interest is included in taxable income for income-type accounts", () => {
    const salary = 5000; // monthly
    const balance = 100000;
    const roi = 4; // 4% annual
    const annualInterest = balance * (roi / 100);

    const stateWithInterest = makeState({
      income: [{ id: "i1", category: "Salary", amount: salary }],
      assets: [{ id: "a1", category: "Savings Account", amount: balance, roi }],
    });
    const stateWithoutInterest = makeState({
      income: [{ id: "i1", category: "Salary", amount: salary }],
    });
    const totalsWith = computeTotals(stateWithInterest);
    const totalsWithout = computeTotals(stateWithoutInterest);

    // Taxable base should include investment interest
    expect(totalsWith.totalTaxableBase).toBeCloseTo(salary * 12 + annualInterest, 2);
    expect(totalsWithout.totalTaxableBase).toBeCloseTo(salary * 12, 2);
    // Tax should be higher with investment interest
    expect(totalsWith.totalTaxEstimate).toBeGreaterThan(totalsWithout.totalTaxEstimate);
  });

  it("tax-free account interest is NOT included in taxable income", () => {
    const state = makeState({
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
      assets: [{ id: "a1", category: "TFSA", amount: 100000, roi: 4 }],
    });
    const totals = computeTotals(state);
    // TFSA is tax-free, so taxable base = salary only
    expect(totals.totalTaxableBase).toBeCloseTo(5000 * 12, 2);
    expect(totals.totalInvestmentInterest).toBe(0);
  });
});

describe("Formula Validation — Financial Runway", () => {
  it("runway = liquidAssets / monthlyObligations", () => {
    const state = makeState({
      assets: [{ id: "a1", category: "Savings Account", amount: 30000 }],
      expenses: [{ id: "e1", category: "Rent", amount: 2000 }],
      properties: [{ id: "p1", name: "Home", value: 400000, mortgage: 300000, monthlyPayment: 1500 }],
    });
    const totals = computeTotals(state);
    const metrics = computeMetrics(state);
    const runway = metrics.find((m) => m.title === "Financial Runway")!;

    const liquidTotal = totals.totalAssets + totals.totalStocks;
    const monthlyObligations = totals.monthlyExpenses + totals.totalMortgagePayments;
    const expected = monthlyObligations > 0 ? liquidTotal / monthlyObligations : 0;
    expect(runway.value).toBeCloseTo(expected, 1);
  });

  it("runway excludes property equity (illiquid)", () => {
    const state = makeState({
      assets: [{ id: "a1", category: "Savings Account", amount: 10000 }],
      expenses: [{ id: "e1", category: "Rent", amount: 2000 }],
      properties: [{ id: "p1", name: "Home", value: 500000, mortgage: 200000, monthlyPayment: 1200 }],
    });
    const totals = computeTotals(state);
    const metrics = computeMetrics(state);
    const runway = metrics.find((m) => m.title === "Financial Runway")!;
    // Runway uses only liquid assets (10000), not property equity (300000)
    const obligations = totals.monthlyExpenses + totals.totalMortgagePayments;
    expect(runway.value).toBeCloseTo(10000 / obligations, 1);
    // Verify obligations include mortgage
    expect(obligations).toBeGreaterThan(totals.monthlyExpenses);
  });

  it("with-growth runway accounts for compounding", () => {
    const state = makeState({
      assets: [{ id: "a1", category: "Savings Account", amount: 100000, roi: 8 }],
      expenses: [{ id: "e1", category: "Living", amount: 3000 }],
    });
    const metrics = computeMetrics(state);
    const runway = metrics.find((m) => m.title === "Financial Runway")!;
    // With 8% growth, runway with growth should exceed simple runway
    if (runway.runwayWithGrowth !== undefined) {
      expect(runway.runwayWithGrowth).toBeGreaterThan(runway.value);
    }
  });
});

describe("Formula Validation — Debt-to-Asset Ratio", () => {
  it("ratio = (debts + mortgage) / (assets + stocks + propertyValue)", () => {
    const state = makeState({
      assets: [{ id: "a1", category: "Savings Account", amount: 50000 }],
      debts: [{ id: "d1", category: "Car Loan", amount: 10000 }],
      properties: [{ id: "p1", name: "Home", value: 400000, mortgage: 300000 }],
      stocks: [{ id: "s1", symbol: "AAPL", shares: 10, lastFetchedPrice: 100 }],
    });
    const totals = computeTotals(state);
    const metrics = computeMetrics(state);
    const ratio = metrics.find((m) => m.title === "Debt-to-Asset Ratio")!;

    const totalAllAssets = totals.totalAssets + totals.totalStocks + totals.totalPropertyValue;
    const totalAllDebts = totals.totalDebts + totals.totalPropertyMortgage;
    const expected = totalAllAssets > 0 ? totalAllDebts / totalAllAssets : 0;
    expect(ratio.value).toBeCloseTo(expected, 2);
  });

  it("without-mortgage variant excludes property from both sides", () => {
    const state = makeState({
      assets: [{ id: "a1", category: "Savings Account", amount: 50000 }],
      debts: [{ id: "d1", category: "Car Loan", amount: 10000 }],
      properties: [{ id: "p1", name: "Home", value: 400000, mortgage: 300000 }],
    });
    const totals = computeTotals(state);
    const metrics = computeMetrics(state);
    const ratio = metrics.find((m) => m.title === "Debt-to-Asset Ratio")!;

    // Without mortgage: only consumer debts / liquid assets
    const assetsWithoutProperty = totals.totalAssets + totals.totalStocks;
    const expected = assetsWithoutProperty > 0 ? totals.totalDebts / assetsWithoutProperty : 0;
    expect(ratio.ratioWithoutMortgage).toBeCloseTo(expected, 2);
  });
});

describe("Formula Validation — Projection Chart", () => {
  it("surplus accumulation matches monthly surplus metric (no mortgage)", () => {
    const state = makeState({
      assets: [{ id: "a1", category: "Savings Account", amount: 10000, roi: 0, surplusTarget: true }],
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
      expenses: [{ id: "e1", category: "Living", amount: 2000 }],
    });
    const totals = computeTotals(state);
    const baseSurplus = totals.monthlyAfterTaxIncome - totals.monthlyExpenses - totals.totalMonthlyContributions - totals.totalMortgagePayments;

    const result = projectFinances(state, 1, "moderate");
    // After 12 months with 0% ROI, assets should grow by 12 * baseSurplus
    const startNW = result.points[0].netWorth;
    const endNW = result.points[12].netWorth;
    const growth = endNW - startNW;
    expect(growth).toBeCloseTo(12 * baseSurplus, 0);
  });

  it("projection with mortgage does not overspend (surplus accounts for mortgage)", () => {
    const state = makeState({
      assets: [{ id: "a1", category: "Savings Account", amount: 50000, roi: 0, surplusTarget: true }],
      income: [{ id: "i1", category: "Salary", amount: 6000 }],
      expenses: [{ id: "e1", category: "Living", amount: 2000 }],
      properties: [{ id: "p1", name: "Home", value: 400000, mortgage: 300000, monthlyPayment: 1500, interestRate: 0 }],
    });
    const totals = computeTotals(state);
    const surplus = totals.monthlyAfterTaxIncome - totals.monthlyExpenses - totals.totalMonthlyContributions - totals.totalMortgagePayments;

    const result = projectFinances(state, 1, "moderate");
    // Assets should only grow by surplus (not surplus + mortgage)
    const startAssets = result.points[0].totalAssets;
    const endAssets = result.points[12].totalAssets;
    const assetGrowth = endAssets - startAssets;
    // Asset growth should match surplus * 12 (mortgage payments go to equity, not savings)
    expect(assetGrowth).toBeCloseTo(surplus * 12, -1);
    // Mortgage should decrease by payments (0% interest → all goes to principal)
    const startMortgage = result.points[0].mortgageDebts;
    const endMortgage = result.points[12].mortgageDebts;
    expect(startMortgage! - endMortgage!).toBeCloseTo(1500 * 12, -1);
  });

  it("drawdown triggers when expenses + mortgage exceed income", () => {
    const state = makeState({
      assets: [{ id: "a1", category: "Savings Account", amount: 100000, roi: 0 }],
      income: [{ id: "i1", category: "Part-time", amount: 1000 }],
      expenses: [{ id: "e1", category: "Living", amount: 2000 }],
      properties: [{ id: "p1", name: "Home", value: 400000, mortgage: 200000, monthlyPayment: 1000, interestRate: 0 }],
    });
    // afterTaxIncome ≈ $1000/mo (low income, minimal tax)
    // expenses + mortgage = $3000/mo > income → drawdown
    const result = projectFinances(state, 1, "moderate");
    // In drawdown, assets should decrease
    expect(result.points[12].totalAssets).toBeLessThan(result.points[0].totalAssets);
  });

  it("debt paydown follows amortization math", () => {
    const state = makeState({
      debts: [{
        id: "d1", category: "Car Loan", amount: 10000,
        interestRate: 6, monthlyPayment: 500,
      }],
      assets: [{ id: "a1", category: "Savings Account", amount: 1000, roi: 0 }],
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
      expenses: [{ id: "e1", category: "Living", amount: 2000 }],
    });
    const result = projectFinances(state, 2, "moderate");
    // After month 1: balance = 10000 * (1 + 0.06/12) - 500 = 10000 * 1.005 - 500 = 9550
    // Debt should decrease over time
    expect(result.points[12].consumerDebts).toBeLessThan(result.points[0].consumerDebts!);
    // Should eventually reach 0 (10000 at 6% with $500/mo ≈ 21 months)
    expect(result.consumerDebtFreeMonth).toBeGreaterThan(0);
    expect(result.consumerDebtFreeMonth!).toBeLessThan(24);
  });
});

describe("Formula Validation — Cash Flow Sankey", () => {
  it("total inflows = total outflows (flows sum correctly)", () => {
    const data = buildSankeyData({
      income: [
        { id: "i1", category: "Salary", amount: 5000, frequency: "monthly" },
        { id: "i2", category: "Freelance", amount: 1000, frequency: "monthly" },
      ],
      expenses: [
        { id: "e1", category: "Rent", amount: 1500 },
        { id: "e2", category: "Food", amount: 500 },
      ],
      investmentContributions: 300,
      mortgagePayments: 1200,
      monthlyFederalTax: 600,
      monthlyProvincialTax: 400,
      monthlySurplus: 1500,
    });

    // Total income flowing in
    const incomeLinks = data.links.filter((l) => l.source.startsWith("income-"));
    const totalInflows = incomeLinks.reduce((s, l) => s + l.value, 0);

    // Total flowing out from after-tax pool
    const outLinks = data.links.filter((l) => l.source === "after-tax");
    const totalOutflows = outLinks.reduce((s, l) => s + l.value, 0);

    // Tax links
    const taxLinks = data.links.filter((l) => l.target === "taxes");
    const totalTax = taxLinks.reduce((s, l) => s + l.value, 0);

    // Income = tax + after-tax outflows
    expect(totalInflows).toBeCloseTo(totalTax + totalOutflows, 1);
  });

  it("Sankey surplus = afterTax - expenses - investments - mortgage", () => {
    const grossIncome = 6000;
    const tax = 1000;
    const expenses = 2000;
    const investments = 500;
    const mortgage = 1500;

    const data = buildSankeyData({
      income: [{ id: "i1", category: "Salary", amount: grossIncome, frequency: "monthly" }],
      expenses: [{ id: "e1", category: "Living", amount: expenses }],
      investmentContributions: investments,
      mortgagePayments: mortgage,
      monthlyFederalTax: tax * 0.6,
      monthlyProvincialTax: tax * 0.4,
      monthlySurplus: 0, // not directly used by buildSankeyData
    });

    const surplusNode = data.nodes.find((n) => n.id === "surplus");
    const afterTax = grossIncome - tax;
    const expectedSurplus = afterTax - expenses - investments - mortgage;
    expect(surplusNode?.value).toBeCloseTo(expectedSurplus, 1);
  });

  it("investment return income is included in Sankey gross income", () => {
    const data = buildSankeyData({
      income: [{ id: "i1", category: "Salary", amount: 5000, frequency: "monthly" }],
      expenses: [{ id: "e1", category: "Living", amount: 2000 }],
      investmentContributions: 0,
      mortgagePayments: 0,
      monthlyFederalTax: 500,
      monthlyProvincialTax: 300,
      monthlySurplus: 0,
      investmentReturns: [
        { label: "Savings Account", monthlyAmount: 200 },
      ],
    });

    const invReturnNode = data.nodes.find((n) => n.type === "investment-income");
    expect(invReturnNode).toBeDefined();
    expect(invReturnNode!.value).toBe(200);

    // After-tax pool should include investment return income
    const afterTaxNode = data.nodes.find((n) => n.id === "after-tax");
    expect(afterTaxNode!.value).toBeCloseTo(5000 + 200 - 800, 1);
  });
});

describe("Formula Validation — Cross-metric Consistency", () => {
  it("toFinancialData netWorth matches computeMetrics netWorth", () => {
    const state = makeState({
      assets: [{ id: "a1", category: "Savings Account", amount: 50000 }],
      debts: [{ id: "d1", category: "Car Loan", amount: 5000 }],
      properties: [{ id: "p1", name: "Home", value: 400000, mortgage: 300000 }],
    });

    const metrics = computeMetrics(state);
    const finData = toFinancialData(state);

    const nwMetric = metrics.find((m) => m.title === "Net Worth")!;
    // toFinancialData uses: totalAssets - totalDebts format with property
    // which equals netWorthWithEquity from computeMetrics
    expect(finData.totalAssets - finData.totalDebts).toBeCloseTo(nwMetric.valueWithEquity!, 0);
  });

  it("tax components are consistent between computeTotals and computeTax", () => {
    const state = makeState({
      income: [{ id: "i1", category: "Salary", amount: 6000 }],
      taxYear: 2025,
    });
    const totals = computeTotals(state);
    const directTax = computeTax(6000 * 12, "employment", "CA", "ON", 2025);

    expect(totals.totalFederalTax).toBeCloseTo(directTax.federalTax, 2);
    expect(totals.totalProvincialStateTax).toBeCloseTo(directTax.provincialStateTax, 2);
    expect(totals.totalTaxEstimate).toBeCloseTo(directTax.totalTax, 2);
  });

  it("INITIAL_STATE metrics are all internally consistent", () => {
    const metrics = computeMetrics(INITIAL_STATE);
    const totals = computeTotals(INITIAL_STATE);

    // Net Worth
    const nw = metrics.find((m) => m.title === "Net Worth")!;
    expect(nw.value).toBe(totals.totalAssets + totals.totalStocks - totals.totalDebts);

    // Tax
    const tax = metrics.find((m) => m.title === "Estimated Tax")!;
    expect(tax.value).toBeCloseTo(totals.totalTaxEstimate, 2);

    // Runway
    const runway = metrics.find((m) => m.title === "Financial Runway")!;
    const liquidTotal = totals.totalAssets + totals.totalStocks;
    const obligations = totals.monthlyExpenses + totals.totalMortgagePayments;
    if (obligations > 0) {
      expect(runway.value).toBeCloseTo(liquidTotal / obligations, 1);
    }
  });
});
