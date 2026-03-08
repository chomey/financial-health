import { describe, it, expect } from "vitest";
import { generateInsights, type FinancialData } from "@/lib/insights";
import { computeWithdrawalTaxSummary, INITIAL_STATE, type FinancialState } from "@/lib/financial-state";

describe("computeWithdrawalTaxSummary", () => {
  it("returns undefined when no liquid assets", () => {
    const state: FinancialState = {
      ...INITIAL_STATE,
      assets: [],
      debts: [],
      stocks: [],
    };
    const result = computeWithdrawalTaxSummary(state, 0, 0);
    expect(result).toBeUndefined();
  });

  it("groups TFSA as tax-free", () => {
    const state: FinancialState = {
      ...INITIAL_STATE,
      assets: [
        { id: "a1", category: "TFSA", amount: 50000 },
      ],
      debts: [],
      stocks: [],
    };
    const result = computeWithdrawalTaxSummary(state, 50000, 0);
    expect(result).toBeDefined();
    expect(result!.accountsByTreatment.taxFree.total).toBe(50000);
    expect(result!.accountsByTreatment.taxFree.categories).toContain("TFSA");
  });

  it("groups RRSP as tax-deferred", () => {
    const state: FinancialState = {
      ...INITIAL_STATE,
      assets: [
        { id: "a1", category: "RRSP", amount: 30000 },
      ],
      debts: [],
      stocks: [],
    };
    const result = computeWithdrawalTaxSummary(state, 30000, 0);
    expect(result).toBeDefined();
    expect(result!.accountsByTreatment.taxDeferred.total).toBe(30000);
    expect(result!.accountsByTreatment.taxDeferred.categories).toContain("RRSP");
  });

  it("groups Brokerage as taxable", () => {
    const state: FinancialState = {
      ...INITIAL_STATE,
      assets: [
        { id: "a1", category: "Brokerage", amount: 20000 },
      ],
      debts: [],
      stocks: [],
    };
    const result = computeWithdrawalTaxSummary(state, 20000, 0);
    expect(result).toBeDefined();
    expect(result!.accountsByTreatment.taxable.total).toBe(20000);
    expect(result!.accountsByTreatment.taxable.categories).toContain("Brokerage");
  });

  it("builds correct withdrawal order (taxable first, tax-free second, tax-deferred last)", () => {
    const state: FinancialState = {
      ...INITIAL_STATE,
      assets: [
        { id: "a1", category: "RRSP", amount: 30000 },
        { id: "a2", category: "TFSA", amount: 20000 },
        { id: "a3", category: "Brokerage", amount: 10000 },
      ],
      debts: [],
      stocks: [],
    };
    const result = computeWithdrawalTaxSummary(state, 60000, 0);
    expect(result).toBeDefined();
    // Taxable first (preserve tax shelters), then tax-free, then tax-deferred
    const brIdx = result!.withdrawalOrder.indexOf("Brokerage");
    const tfIdx = result!.withdrawalOrder.indexOf("TFSA");
    const rrIdx = result!.withdrawalOrder.indexOf("RRSP");
    expect(brIdx).toBeLessThan(tfIdx);
    expect(tfIdx).toBeLessThan(rrIdx);
  });

  it("computes tax drag > 0 for RRSP-heavy portfolio", () => {
    const state: FinancialState = {
      ...INITIAL_STATE,
      assets: [
        { id: "a1", category: "RRSP", amount: 100000 },
      ],
      debts: [],
      expenses: [{ id: "e1", category: "Rent", amount: 2000 }],
      income: [],
      stocks: [],
      country: "CA",
      jurisdiction: "ON",
    };
    const result = computeWithdrawalTaxSummary(state, 100000, 0);
    expect(result).toBeDefined();
    expect(result!.taxDragMonths).toBeGreaterThan(0);
  });

  it("computes zero tax drag for all-tax-free portfolio", () => {
    const state: FinancialState = {
      ...INITIAL_STATE,
      assets: [
        { id: "a1", category: "TFSA", amount: 50000 },
        { id: "a2", category: "Roth IRA", amount: 30000 },
      ],
      debts: [],
      expenses: [{ id: "e1", category: "Rent", amount: 2000 }],
      income: [],
      stocks: [],
    };
    const result = computeWithdrawalTaxSummary(state, 80000, 0);
    expect(result).toBeDefined();
    expect(result!.taxDragMonths).toBe(0);
  });

  it("excludes computed assets from double-counting", () => {
    const state: FinancialState = {
      ...INITIAL_STATE,
      assets: [
        { id: "a1", category: "Savings Account", amount: 10000 },
        { id: "_computed_stocks", category: "Stocks & Equity", amount: 5000, computed: true as const },
      ],
      debts: [],
      stocks: [],
    };
    // Computed stocks are included but won't double-count with totalStocks since hasComputedStocks check
    const result = computeWithdrawalTaxSummary(state, 10000, 0);
    expect(result).toBeDefined();
    // Total should include both real and computed assets
    const total = result!.accountsByTreatment.taxFree.total +
      result!.accountsByTreatment.taxDeferred.total +
      result!.accountsByTreatment.taxable.total;
    expect(total).toBe(15000);
  });
});

describe("withdrawal-tax insights", () => {
  it("generates tax-free insight when TFSA holdings exist", () => {
    const data: FinancialData = {
      totalAssets: 100000,
      totalDebts: 0,
      monthlyIncome: 5000,
      monthlyExpenses: 3000,
      withdrawalTax: {
        taxDragMonths: 2,
        withdrawalOrder: ["TFSA", "Brokerage", "RRSP"],
        accountsByTreatment: {
          taxFree: { categories: ["TFSA"], total: 40000 },
          taxDeferred: { categories: ["RRSP"], total: 40000 },
          taxable: { categories: ["Brokerage"], total: 20000 },
        },
      },
    };
    const insights = generateInsights(data);
    const taxFreeInsight = insights.find((i) => i.id === "withdrawal-tax-free");
    expect(taxFreeInsight).toBeDefined();
    expect(taxFreeInsight!.message).toContain("TFSA");
    expect(taxFreeInsight!.message).toContain("40%");
    expect(taxFreeInsight!.message).toContain("tax-free");
  });

  it("generates tax-deferred heavy insight when >50% in tax-deferred", () => {
    const data: FinancialData = {
      totalAssets: 100000,
      totalDebts: 0,
      monthlyIncome: 5000,
      monthlyExpenses: 3000,
      withdrawalTax: {
        taxDragMonths: 3,
        withdrawalOrder: ["TFSA", "RRSP"],
        accountsByTreatment: {
          taxFree: { categories: ["TFSA"], total: 20000 },
          taxDeferred: { categories: ["RRSP"], total: 80000 },
          taxable: { categories: [], total: 0 },
        },
      },
    };
    const insights = generateInsights(data);
    const deferredInsight = insights.find((i) => i.id === "withdrawal-tax-deferred-heavy");
    expect(deferredInsight).toBeDefined();
    expect(deferredInsight!.message).toContain("TFSA");
    expect(deferredInsight!.message).toContain("RRSP");
  });

  it("suggests opening tax-free account when none exist", () => {
    const data: FinancialData = {
      totalAssets: 50000,
      totalDebts: 0,
      monthlyIncome: 5000,
      monthlyExpenses: 3000,
      withdrawalTax: {
        taxDragMonths: 4,
        withdrawalOrder: ["RRSP"],
        accountsByTreatment: {
          taxFree: { categories: [], total: 0 },
          taxDeferred: { categories: ["RRSP"], total: 50000 },
          taxable: { categories: [], total: 0 },
        },
      },
    };
    const insights = generateInsights(data);
    const noFreeInsight = insights.find((i) => i.id === "withdrawal-tax-no-free");
    expect(noFreeInsight).toBeDefined();
    expect(noFreeInsight!.message).toMatch(/TFSA|Roth IRA/);
  });

  it("generates tax drag insight when drag exceeds 0.5 months", () => {
    const data: FinancialData = {
      totalAssets: 100000,
      totalDebts: 0,
      monthlyIncome: 5000,
      monthlyExpenses: 3000,
      withdrawalTax: {
        taxDragMonths: 3.5,
        withdrawalOrder: ["TFSA", "RRSP"],
        accountsByTreatment: {
          taxFree: { categories: ["TFSA"], total: 20000 },
          taxDeferred: { categories: ["RRSP"], total: 80000 },
          taxable: { categories: [], total: 0 },
        },
      },
    };
    const insights = generateInsights(data);
    const dragInsight = insights.find((i) => i.id === "withdrawal-tax-drag");
    expect(dragInsight).toBeDefined();
    expect(dragInsight!.message).toContain("3.5 months");
  });

  it("does not generate drag insight when drag is minimal", () => {
    const data: FinancialData = {
      totalAssets: 100000,
      totalDebts: 0,
      monthlyIncome: 5000,
      monthlyExpenses: 3000,
      withdrawalTax: {
        taxDragMonths: 0.2,
        withdrawalOrder: ["TFSA"],
        accountsByTreatment: {
          taxFree: { categories: ["TFSA"], total: 95000 },
          taxDeferred: { categories: [], total: 0 },
          taxable: { categories: ["Savings"], total: 5000 },
        },
      },
    };
    const insights = generateInsights(data);
    const dragInsight = insights.find((i) => i.id === "withdrawal-tax-drag");
    expect(dragInsight).toBeUndefined();
  });

  it("all withdrawal-tax insights have type withdrawal-tax", () => {
    const data: FinancialData = {
      totalAssets: 100000,
      totalDebts: 0,
      monthlyIncome: 5000,
      monthlyExpenses: 3000,
      withdrawalTax: {
        taxDragMonths: 3,
        withdrawalOrder: ["TFSA", "RRSP"],
        accountsByTreatment: {
          taxFree: { categories: ["TFSA"], total: 20000 },
          taxDeferred: { categories: ["RRSP"], total: 80000 },
          taxable: { categories: [], total: 0 },
        },
      },
    };
    const insights = generateInsights(data);
    const wtInsights = insights.filter((i) => i.id.startsWith("withdrawal-tax"));
    expect(wtInsights.length).toBeGreaterThan(0);
    for (const insight of wtInsights) {
      expect(insight.type).toBe("withdrawal-tax");
    }
  });
});
