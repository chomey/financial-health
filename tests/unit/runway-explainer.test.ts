import { describe, it, expect } from "vitest";
import { simulateRunwayTimeSeries } from "@/lib/financial-state";
import { computeMetrics, type FinancialState } from "@/lib/financial-state";

describe("simulateRunwayTimeSeries", () => {
  it("returns empty arrays when monthlyWithdrawal is 0", () => {
    const result = simulateRunwayTimeSeries(
      [{ balance: 10000, monthlyRate: 0, taxTreatment: "tax-free", category: "TFSA", costBasisPercent: 100 }],
      0, "CA", "ON"
    );
    expect(result.withGrowth).toEqual([]);
    expect(result.withoutGrowth).toEqual([]);
    expect(result.withTax).toEqual([]);
  });

  it("returns empty arrays when buckets are empty", () => {
    const result = simulateRunwayTimeSeries([], 1000, "CA", "ON");
    expect(result.withGrowth).toEqual([]);
  });

  it("generates time series with correct initial balances", () => {
    const result = simulateRunwayTimeSeries(
      [{ balance: 10000, monthlyRate: 0, taxTreatment: "tax-free", category: "TFSA", costBasisPercent: 100 }],
      1000, "CA", "ON"
    );
    expect(result.withGrowth[0].month).toBe(0);
    expect(result.withGrowth[0].totalBalance).toBe(10000);
    expect(result.withGrowth[0].balances["TFSA"]).toBe(10000);
  });

  it("depletes balance over time without growth", () => {
    const result = simulateRunwayTimeSeries(
      [{ balance: 5000, monthlyRate: 0, taxTreatment: "tax-free", category: "TFSA", costBasisPercent: 100 }],
      1000, "CA", "ON"
    );
    // Should run out in 5 months
    expect(result.withoutGrowth.length).toBeGreaterThanOrEqual(5);
    const lastPoint = result.withoutGrowth[result.withoutGrowth.length - 1];
    expect(lastPoint.totalBalance).toBe(0);
  });

  it("growth extends runway vs no-growth", () => {
    const buckets = [
      { balance: 10000, monthlyRate: 0.005, taxTreatment: "tax-free" as const, category: "TFSA", costBasisPercent: 100 },
    ];
    const result = simulateRunwayTimeSeries(buckets, 500, "CA", "ON");
    // With growth should last longer
    expect(result.withGrowth.length).toBeGreaterThan(result.withoutGrowth.length);
  });

  it("tax drag reduces runway vs growth-only", () => {
    const buckets = [
      { balance: 50000, monthlyRate: 0.004, taxTreatment: "tax-deferred" as const, category: "RRSP", costBasisPercent: 100 },
    ];
    const result = simulateRunwayTimeSeries(buckets, 2000, "CA", "ON");
    // With tax should run out before withGrowth (tax grosses up withdrawals)
    expect(result.withTax.length).toBeLessThanOrEqual(result.withGrowth.length);
  });

  it("handles multiple account categories in balances", () => {
    const result = simulateRunwayTimeSeries(
      [
        { balance: 5000, monthlyRate: 0, taxTreatment: "tax-free", category: "TFSA", costBasisPercent: 100 },
        { balance: 10000, monthlyRate: 0, taxTreatment: "tax-deferred", category: "RRSP", costBasisPercent: 100 },
      ],
      1000, "CA", "ON"
    );
    expect(result.withGrowth[0].balances["TFSA"]).toBe(5000);
    expect(result.withGrowth[0].balances["RRSP"]).toBe(10000);
    expect(result.withGrowth[0].totalBalance).toBe(15000);
  });
});

describe("computeMetrics runwayDetails", () => {
  it("includes runwayDetails when there are liquid assets and obligations", () => {
    const state: FinancialState = {
      assets: [{ id: "a1", category: "TFSA", amount: 20000 }],
      debts: [],
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
      expenses: [{ id: "e1", category: "Rent", amount: 2000 }],
      properties: [],
      stocks: [],
      country: "CA",
      jurisdiction: "ON",
    };
    const metrics = computeMetrics(state);
    const runway = metrics.find((m) => m.title === "Financial Runway");
    expect(runway).toBeDefined();
    expect(runway!.runwayDetails).toBeDefined();
    expect(runway!.runwayDetails!.monthlyExpenses).toBe(2000);
    expect(runway!.runwayDetails!.monthlyTotal).toBe(2000);
    expect(runway!.runwayDetails!.categories).toContain("TFSA");
  });

  it("includes withdrawal order sorted by tax priority", () => {
    const state: FinancialState = {
      assets: [
        { id: "a1", category: "TFSA", amount: 10000 },
        { id: "a2", category: "RRSP", amount: 20000 },
        { id: "a3", category: "Savings Account", amount: 5000 },
      ],
      debts: [],
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
      expenses: [{ id: "e1", category: "Rent", amount: 2000 }],
      properties: [],
      stocks: [],
      country: "CA",
      jurisdiction: "ON",
    };
    const metrics = computeMetrics(state);
    const runway = metrics.find((m) => m.title === "Financial Runway");
    expect(runway!.runwayDetails).toBeDefined();
    const order = runway!.runwayDetails!.withdrawalOrder;
    // Taxable first (Savings Account), then tax-free (TFSA) to preserve shelter, then tax-deferred (RRSP)
    expect(order[0].category).toBe("Savings Account");
    expect(order[0].taxTreatment).toBe("taxable");
    expect(order[order.length - 1].category).toBe("RRSP");
    expect(order[order.length - 1].taxTreatment).toBe("tax-deferred");
  });

  it("includes mortgage in monthly obligations", () => {
    const state: FinancialState = {
      assets: [{ id: "a1", category: "TFSA", amount: 20000 }],
      debts: [],
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
      expenses: [{ id: "e1", category: "Rent", amount: 1000 }],
      properties: [{ id: "p1", name: "Home", value: 500000, mortgage: 400000, mortgageRate: 5, mortgageAmortization: 25 }],
      stocks: [],
      country: "CA",
      jurisdiction: "ON",
    };
    const metrics = computeMetrics(state);
    const runway = metrics.find((m) => m.title === "Financial Runway");
    expect(runway!.runwayDetails).toBeDefined();
    expect(runway!.runwayDetails!.monthlyMortgage).toBeGreaterThan(0);
    expect(runway!.runwayDetails!.monthlyTotal).toBeGreaterThan(runway!.runwayDetails!.monthlyExpenses);
  });

  it("has time series data with decreasing balances", () => {
    const state: FinancialState = {
      assets: [{ id: "a1", category: "Savings Account", amount: 10000 }],
      debts: [],
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
      expenses: [{ id: "e1", category: "Rent", amount: 2000 }],
      properties: [],
      stocks: [],
      country: "CA",
      jurisdiction: "ON",
    };
    const metrics = computeMetrics(state);
    const runway = metrics.find((m) => m.title === "Financial Runway");
    expect(runway!.runwayDetails).toBeDefined();
    const series = runway!.runwayDetails!.withGrowth;
    expect(series.length).toBeGreaterThan(1);
    // Balances decrease over time (no growth on savings)
    expect(series[0].totalBalance).toBeGreaterThan(series[series.length - 1].totalBalance);
  });

  it("does not include runwayDetails when no obligations", () => {
    const state: FinancialState = {
      assets: [{ id: "a1", category: "TFSA", amount: 20000 }],
      debts: [],
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
      expenses: [],
      properties: [],
      stocks: [],
      country: "CA",
      jurisdiction: "ON",
    };
    const metrics = computeMetrics(state);
    const runway = metrics.find((m) => m.title === "Financial Runway");
    expect(runway!.runwayDetails).toBeUndefined();
  });
});
