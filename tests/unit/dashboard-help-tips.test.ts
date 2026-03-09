import { describe, it, expect } from "vitest";
import { computeMetrics } from "@/lib/compute-metrics";
import { INITIAL_STATE } from "@/lib/financial-types";
import type { FinancialState } from "@/lib/financial-types";

const baseState: FinancialState = {
  ...INITIAL_STATE,
  country: "CA",
  jurisdiction: "ON",
  income: [
    {
      id: "inc-1",
      category: "Employment",
      amount: 6000,
      frequency: "monthly",
      currency: "CAD",
      incomeType: "employment",
    },
  ],
  expenses: [
    {
      id: "exp-1",
      category: "Housing",
      amount: 1500,
      frequency: "monthly",
      currency: "CAD",
    },
  ],
  assets: [
    {
      id: "asset-1",
      category: "TFSA",
      amount: 50000,
      roi: 7,
      currency: "CAD",
      taxTreatment: "tax-free",
    },
  ],
};

describe("dashboard metric helpText", () => {
  it("Net Worth metric has helpText", () => {
    const metrics = computeMetrics(baseState);
    const netWorth = metrics.find((m) => m.title === "Net Worth");
    expect(netWorth).toBeDefined();
    expect(netWorth!.helpText).toBeTruthy();
    expect(typeof netWorth!.helpText).toBe("string");
  });

  it("Monthly Cash Flow metric has helpText", () => {
    const metrics = computeMetrics(baseState);
    const cashFlow = metrics.find((m) => m.title === "Monthly Cash Flow");
    expect(cashFlow).toBeDefined();
    expect(cashFlow!.helpText).toBeTruthy();
  });

  it("Estimated Tax metric has helpText", () => {
    const metrics = computeMetrics(baseState);
    const tax = metrics.find((m) => m.title === "Estimated Tax");
    expect(tax).toBeDefined();
    expect(tax!.helpText).toBeTruthy();
    expect(tax!.helpText).toContain("Effective rate");
  });

  it("Financial Runway metric has helpText", () => {
    const metrics = computeMetrics(baseState);
    const runway = metrics.find((m) => m.title === "Financial Runway");
    expect(runway).toBeDefined();
    expect(runway!.helpText).toBeTruthy();
    expect(runway!.helpText).toContain("liquid");
  });

  it("Income Replacement metric has helpText when income is present", () => {
    const metrics = computeMetrics(baseState);
    const incomeReplacement = metrics.find((m) => m.title === "Income Replacement");
    expect(incomeReplacement).toBeDefined();
    expect(incomeReplacement!.helpText).toBeTruthy();
    expect(incomeReplacement!.helpText).toContain("4%");
  });

  it("Net Worth helpText mentions assets and debts", () => {
    const metrics = computeMetrics(baseState);
    const netWorth = metrics.find((m) => m.title === "Net Worth");
    expect(netWorth!.helpText).toMatch(/assets|debts/i);
  });

  it("Monthly Cash Flow helpText mentions income or expenses", () => {
    const metrics = computeMetrics(baseState);
    const cashFlow = metrics.find((m) => m.title === "Monthly Cash Flow");
    expect(cashFlow!.helpText).toMatch(/income|expenses/i);
  });
});
