import { describe, expect, it } from "vitest";
import { computeMetrics, computeTotals, toFinancialData, type FinancialState } from "@/lib/financial-state";

describe("multi-currency aggregation conversions", () => {
  it("converts foreign asset contributions, debt payments, and withdrawal/runway buckets to home currency", () => {
    const state: FinancialState = {
      assets: [
        {
          id: "usd-brokerage",
          category: "Brokerage",
          amount: 1_000,
          monthlyContribution: 100,
          currency: "USD",
          roi: 0,
        },
      ],
      debts: [
        {
          id: "usd-debt",
          category: "Credit Card",
          amount: 500,
          monthlyPayment: 50,
          currency: "USD",
        },
      ],
      income: [],
      expenses: [{ id: "rent", category: "Rent", amount: 300, currency: "CAD" }],
      properties: [],
      stocks: [],
      country: "CA",
      jurisdiction: "ON",
      fxManualOverride: 1.5,
    };

    const totals = computeTotals(state);
    expect(totals.totalAssets).toBe(1_500);
    expect(totals.totalMonthlyContributions).toBe(150);
    expect(totals.totalDebtPayments).toBe(75);

    const data = toFinancialData(state);
    expect(data.monthlyDebtPayments).toBe(75);
    expect(data.withdrawalTax?.accountsByTreatment.taxable.total).toBe(1_500);

    const runway = computeMetrics(state).find((m) => m.title === "Financial Runway");
    expect(runway?.runwayDetails?.monthlyTotal).toBe(375);
    expect(runway?.runwayDetails?.withdrawalOrder[0].startingBalance).toBe(1_500);
  });
});
