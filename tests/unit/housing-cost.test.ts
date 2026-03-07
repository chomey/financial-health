import { describe, it, expect } from "vitest";
import { generateInsights, type FinancialData } from "@/lib/insights";

const baseData: FinancialData = {
  totalAssets: 100000,
  totalDebts: 50000,
  monthlyIncome: 6000,
  monthlyExpenses: 3000,
  monthlyGrossIncome: 8000,
};

describe("housing-cost insight", () => {
  it("does not generate insight when monthlyHousingCost is missing", () => {
    const data: FinancialData = { ...baseData, monthlyHousingCost: undefined };
    const insights = generateInsights(data);
    expect(insights.find((i) => i.type === "housing-cost")).toBeUndefined();
  });

  it("does not generate insight when monthlyHousingCost is zero", () => {
    const data: FinancialData = { ...baseData, monthlyHousingCost: 0 };
    const insights = generateInsights(data);
    expect(insights.find((i) => i.type === "housing-cost")).toBeUndefined();
  });

  it("does not generate insight when monthlyGrossIncome is missing", () => {
    const data: FinancialData = { ...baseData, monthlyHousingCost: 2000, monthlyGrossIncome: undefined };
    const insights = generateInsights(data);
    expect(insights.find((i) => i.type === "housing-cost")).toBeUndefined();
  });

  it("generates well-within-budget tier for housing < 25%", () => {
    // 1600 / 8000 = 20%
    const data: FinancialData = { ...baseData, monthlyHousingCost: 1600, monthlyGrossIncome: 8000 };
    const insights = generateInsights(data);
    const insight = insights.find((i) => i.type === "housing-cost");
    expect(insight).toBeDefined();
    expect(insight!.message).toContain("20.0%");
    expect(insight!.message).toContain("well within budget");
    expect(insight!.message).toContain("30%");
    expect(insight!.icon).toBe("🏠");
  });

  it("generates sweet-spot tier for housing 25-30%", () => {
    // 2160 / 8000 = 27%
    const data: FinancialData = { ...baseData, monthlyHousingCost: 2160, monthlyGrossIncome: 8000 };
    const insights = generateInsights(data);
    const insight = insights.find((i) => i.type === "housing-cost");
    expect(insight).toBeDefined();
    expect(insight!.message).toContain("27.0%");
    expect(insight!.message).toContain("sweet spot");
  });

  it("generates above-30%-rule tier for housing 31-40%", () => {
    // 2880 / 8000 = 36%
    const data: FinancialData = { ...baseData, monthlyHousingCost: 2880, monthlyGrossIncome: 8000 };
    const insights = generateInsights(data);
    const insight = insights.find((i) => i.type === "housing-cost");
    expect(insight).toBeDefined();
    expect(insight!.message).toContain("36.0%");
    expect(insight!.message).toContain("30%");
  });

  it("generates cost-burdened tier for housing >= 40%", () => {
    // 3600 / 8000 = 45%
    const data: FinancialData = { ...baseData, monthlyHousingCost: 3600, monthlyGrossIncome: 8000 };
    const insights = generateInsights(data);
    const insight = insights.find((i) => i.type === "housing-cost");
    expect(insight).toBeDefined();
    expect(insight!.message).toContain("45.0%");
    expect(insight!.message).toContain("cost-burdened");
  });

  it("boundary: exactly 25% is sweet-spot tier", () => {
    // 2000 / 8000 = 25%
    const data: FinancialData = { ...baseData, monthlyHousingCost: 2000, monthlyGrossIncome: 8000 };
    const insights = generateInsights(data);
    const insight = insights.find((i) => i.type === "housing-cost");
    expect(insight).toBeDefined();
    expect(insight!.message).toContain("sweet spot");
  });

  it("boundary: exactly 31% is above-30%-rule tier", () => {
    // 2480 / 8000 = 31%
    const data: FinancialData = { ...baseData, monthlyHousingCost: 2480, monthlyGrossIncome: 8000 };
    const insights = generateInsights(data);
    const insight = insights.find((i) => i.type === "housing-cost");
    expect(insight).toBeDefined();
    expect(insight!.message).not.toContain("sweet spot");
    expect(insight!.message).not.toContain("well within budget");
    expect(insight!.message).not.toContain("cost-burdened");
  });

  it("boundary: exactly 41% is cost-burdened tier", () => {
    // 3280 / 8000 = 41%
    const data: FinancialData = { ...baseData, monthlyHousingCost: 3280, monthlyGrossIncome: 8000 };
    const insights = generateInsights(data);
    const insight = insights.find((i) => i.type === "housing-cost");
    expect(insight).toBeDefined();
    expect(insight!.message).toContain("cost-burdened");
  });
});

describe("monthlyHousingCost computation in financial-state", () => {
  it("toFinancialData uses mortgage payment when property has mortgage", async () => {
    const { toFinancialData } = await import("@/lib/financial-state");
    const minimalState = {
      assets: [],
      debts: [],
      income: [{ id: "i1", category: "Salary", amount: 8000 }],
      expenses: [{ id: "e1", category: "Groceries", amount: 600 }],
      properties: [
        {
          id: "p1",
          name: "123 Main St",
          value: 500000,
          mortgage: 350000,
          monthlyPayment: 2200,
        },
      ],
      stocks: [],
      country: "CA" as const,
      jurisdiction: "ON" as const,
    };
    const data = toFinancialData(minimalState as Parameters<typeof toFinancialData>[0]);
    expect(data.monthlyHousingCost).toBe(2200);
  });

  it("toFinancialData uses rent expense when no mortgage", async () => {
    const { toFinancialData } = await import("@/lib/financial-state");
    const minimalState = {
      assets: [],
      debts: [],
      income: [{ id: "i1", category: "Salary", amount: 8000 }],
      expenses: [
        { id: "e1", category: "Rent/Mortgage Payment", amount: 1800 },
        { id: "e2", category: "Groceries", amount: 600 },
      ],
      properties: [],
      stocks: [],
      country: "CA" as const,
      jurisdiction: "ON" as const,
    };
    const data = toFinancialData(minimalState as Parameters<typeof toFinancialData>[0]);
    expect(data.monthlyHousingCost).toBe(1800);
  });

  it("toFinancialData returns undefined when no housing costs", async () => {
    const { toFinancialData } = await import("@/lib/financial-state");
    const minimalState = {
      assets: [],
      debts: [],
      income: [{ id: "i1", category: "Salary", amount: 8000 }],
      expenses: [{ id: "e1", category: "Groceries", amount: 600 }],
      properties: [],
      stocks: [],
      country: "CA" as const,
      jurisdiction: "ON" as const,
    };
    const data = toFinancialData(minimalState as Parameters<typeof toFinancialData>[0]);
    expect(data.monthlyHousingCost).toBeUndefined();
  });
});
