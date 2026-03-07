import { describe, it, expect } from "vitest";
import { generateInsights, type FinancialData } from "@/lib/insights";

const baseData: FinancialData = {
  totalAssets: 100000,
  totalDebts: 50000,
  monthlyIncome: 6000,
  monthlyExpenses: 3000,
  monthlyGrossIncome: 8000,
};

describe("debt-to-income insight", () => {
  it("does not generate insight when monthlyGrossIncome is missing", () => {
    const data: FinancialData = { ...baseData, monthlyGrossIncome: undefined, monthlyDebtPayments: 1000 };
    const insights = generateInsights(data);
    expect(insights.find((i) => i.type === "debt-to-income")).toBeUndefined();
  });

  it("does not generate insight when monthlyGrossIncome is zero", () => {
    const data: FinancialData = { ...baseData, monthlyGrossIncome: 0, monthlyDebtPayments: 1000 };
    const insights = generateInsights(data);
    expect(insights.find((i) => i.type === "debt-to-income")).toBeUndefined();
  });

  it("generates excellent tier insight for DTI < 20%", () => {
    // 1000 / 8000 = 12.5%
    const data: FinancialData = { ...baseData, monthlyDebtPayments: 1000, monthlyGrossIncome: 8000 };
    const insights = generateInsights(data);
    const dti = insights.find((i) => i.type === "debt-to-income");
    expect(dti).toBeDefined();
    expect(dti!.message).toContain("12.5%");
    expect(dti!.message).toContain("excellent");
    expect(dti!.message).toContain("low risk");
    expect(dti!.icon).toBe("📊");
  });

  it("generates good tier insight for DTI 20-35%", () => {
    // 2000 / 8000 = 25%
    const data: FinancialData = { ...baseData, monthlyDebtPayments: 2000, monthlyGrossIncome: 8000 };
    const insights = generateInsights(data);
    const dti = insights.find((i) => i.type === "debt-to-income");
    expect(dti).toBeDefined();
    expect(dti!.message).toContain("25.0%");
    expect(dti!.message).toContain("good");
    expect(dti!.message).toContain("qualify for most loans");
  });

  it("generates moderate tier insight for DTI 36-43%", () => {
    // 3200 / 8000 = 40%
    const data: FinancialData = { ...baseData, monthlyDebtPayments: 3200, monthlyGrossIncome: 8000 };
    const insights = generateInsights(data);
    const dti = insights.find((i) => i.type === "debt-to-income");
    expect(dti).toBeDefined();
    expect(dti!.message).toContain("40.0%");
    expect(dti!.message).toContain("moderate");
    expect(dti!.message).toContain("43%");
  });

  it("generates high tier insight for DTI >= 44%", () => {
    // 4000 / 8000 = 50%
    const data: FinancialData = { ...baseData, monthlyDebtPayments: 4000, monthlyGrossIncome: 8000 };
    const insights = generateInsights(data);
    const dti = insights.find((i) => i.type === "debt-to-income");
    expect(dti).toBeDefined();
    expect(dti!.message).toContain("50.0%");
    expect(dti!.message).toContain("high");
    expect(dti!.message).toContain("Lenders may decline");
  });

  it("generates insight when monthlyDebtPayments is 0 (debt-free)", () => {
    // 0 / 8000 = 0%
    const data: FinancialData = { ...baseData, monthlyDebtPayments: 0, monthlyGrossIncome: 8000 };
    const insights = generateInsights(data);
    const dti = insights.find((i) => i.type === "debt-to-income");
    expect(dti).toBeDefined();
    expect(dti!.message).toContain("0.0%");
    expect(dti!.message).toContain("excellent");
  });

  it("boundary: exactly 20% is good tier", () => {
    // 1600 / 8000 = 20%
    const data: FinancialData = { ...baseData, monthlyDebtPayments: 1600, monthlyGrossIncome: 8000 };
    const insights = generateInsights(data);
    const dti = insights.find((i) => i.type === "debt-to-income");
    expect(dti).toBeDefined();
    expect(dti!.message).toContain("good");
  });

  it("boundary: exactly 36% is moderate tier", () => {
    // 2880 / 8000 = 36%
    const data: FinancialData = { ...baseData, monthlyDebtPayments: 2880, monthlyGrossIncome: 8000 };
    const insights = generateInsights(data);
    const dti = insights.find((i) => i.type === "debt-to-income");
    expect(dti).toBeDefined();
    expect(dti!.message).toContain("moderate");
  });

  it("boundary: exactly 44% is high tier", () => {
    // 3520 / 8000 = 44%
    const data: FinancialData = { ...baseData, monthlyDebtPayments: 3520, monthlyGrossIncome: 8000 };
    const insights = generateInsights(data);
    const dti = insights.find((i) => i.type === "debt-to-income");
    expect(dti).toBeDefined();
    expect(dti!.message).toContain("high");
  });
});

describe("monthlyDebtPayments computation in financial-state", () => {
  it("toFinancialData includes monthlyDebtPayments field", async () => {
    const { toFinancialData } = await import("@/lib/financial-state");
    const minimalState = {
      assets: [],
      debts: [
        { id: "d1", category: "Car Loan", amount: 15000, interestRate: 6, monthlyPayment: 300 },
        { id: "d2", category: "Credit Card", amount: 5000, interestRate: 19.9, monthlyPayment: 150 },
      ],
      income: [{ id: "i1", category: "Salary", amount: 8000 }],
      expenses: [],
      properties: [],
      stocks: [],
      country: "CA" as const,
      jurisdiction: "ON" as const,
    };
    const data = toFinancialData(minimalState as Parameters<typeof toFinancialData>[0]);
    // 300 + 150 = 450 (no mortgage payments)
    expect(data.monthlyDebtPayments).toBe(450);
    expect(data.monthlyGrossIncome).toBeGreaterThan(0);
  });

  it("toFinancialData monthlyDebtPayments is 0 when no debts and no mortgages", async () => {
    const { toFinancialData } = await import("@/lib/financial-state");
    const minimalState = {
      assets: [],
      debts: [],
      income: [{ id: "i1", category: "Salary", amount: 8000 }],
      expenses: [],
      properties: [],
      stocks: [],
      country: "CA" as const,
      jurisdiction: "ON" as const,
    };
    const data = toFinancialData(minimalState as Parameters<typeof toFinancialData>[0]);
    expect(data.monthlyDebtPayments).toBe(0);
  });
});
