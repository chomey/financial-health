import { describe, it, expect } from "vitest";
import {
  compareDebtStrategies,
  type DebtForStrategy,
} from "@/lib/debt-payoff";
import { generateInsights, type FinancialData } from "@/lib/insights";

// ─── compareDebtStrategies ────────────────────────────────────────────────────

describe("compareDebtStrategies", () => {
  const multiDebt: DebtForStrategy[] = [
    { category: "Credit Card", balance: 5000, annualRate: 19.9, monthlyPayment: 200 },
    { category: "Car Loan", balance: 12000, annualRate: 6.5, monthlyPayment: 300 },
  ];

  it("returns null when fewer than 2 eligible debts", () => {
    expect(compareDebtStrategies([multiDebt[0]])).toBeNull();
    expect(compareDebtStrategies([])).toBeNull();
  });

  it("returns null when a debt payment does not cover interest", () => {
    const debts: DebtForStrategy[] = [
      { category: "A", balance: 10000, annualRate: 24, monthlyPayment: 10 }, // interest = $200/month
      { category: "B", balance: 5000, annualRate: 5, monthlyPayment: 100 },
    ];
    expect(compareDebtStrategies(debts)).toBeNull();
  });

  it("returns all three strategies for a valid multi-debt scenario", () => {
    const result = compareDebtStrategies(multiDebt);
    expect(result).not.toBeNull();
    expect(result!.avalanche).toBeDefined();
    expect(result!.snowball).toBeDefined();
    expect(result!.current).toBeDefined();
  });

  it("avalanche pays off highest-rate debt first (credit card 19.9% before car 6.5%)", () => {
    const result = compareDebtStrategies(multiDebt);
    expect(result).not.toBeNull();
    // Avalanche should save at least as much interest as snowball
    expect(result!.avalancheInterestSavings).toBeGreaterThanOrEqual(result!.snowballInterestSavings);
  });

  it("avalanche total interest is less than current strategy", () => {
    const result = compareDebtStrategies(multiDebt);
    expect(result).not.toBeNull();
    expect(result!.avalanche.totalInterestPaid).toBeLessThan(result!.current.totalInterestPaid);
    expect(result!.avalancheInterestSavings).toBeGreaterThan(0);
  });

  it("snowball total interest is less than current strategy", () => {
    const result = compareDebtStrategies(multiDebt);
    expect(result).not.toBeNull();
    expect(result!.snowball.totalInterestPaid).toBeLessThan(result!.current.totalInterestPaid);
    expect(result!.snowballInterestSavings).toBeGreaterThan(0);
  });

  it("avalanche and snowball finish faster than current strategy", () => {
    const result = compareDebtStrategies(multiDebt);
    expect(result).not.toBeNull();
    expect(result!.avalanche.totalMonths).toBeLessThanOrEqual(result!.current.totalMonths);
    expect(result!.snowball.totalMonths).toBeLessThanOrEqual(result!.current.totalMonths);
  });

  it("snowball order: smallest balance paid first (car loan $12k before credit card $5k is NOT snowball order)", () => {
    // Credit card has smaller balance ($5k), so snowball targets it first despite lower rate
    const debts: DebtForStrategy[] = [
      { category: "Credit Card", balance: 2000, annualRate: 5, monthlyPayment: 100 },
      { category: "Car Loan", balance: 10000, annualRate: 20, monthlyPayment: 300 },
    ];
    const result = compareDebtStrategies(debts);
    expect(result).not.toBeNull();
    // Avalanche (car loan 20% first) should save more interest than snowball (credit card 5% first)
    expect(result!.avalancheInterestSavings).toBeGreaterThan(result!.snowballInterestSavings);
  });

  it("handles three debts", () => {
    const debts: DebtForStrategy[] = [
      { category: "Credit Card", balance: 3000, annualRate: 21, monthlyPayment: 150 },
      { category: "Student Loan", balance: 8000, annualRate: 5, monthlyPayment: 200 },
      { category: "Car Loan", balance: 5000, annualRate: 9, monthlyPayment: 180 },
    ];
    const result = compareDebtStrategies(debts);
    expect(result).not.toBeNull();
    expect(result!.avalanche.totalInterestPaid).toBeGreaterThan(0);
    expect(result!.snowball.totalInterestPaid).toBeGreaterThan(0);
    expect(result!.current.totalInterestPaid).toBeGreaterThan(0);
    // Avalanche (credit card 21% first) should save most interest
    expect(result!.avalancheInterestSavings).toBeGreaterThan(0);
  });

  it("payoff durations are human readable", () => {
    const result = compareDebtStrategies(multiDebt);
    expect(result).not.toBeNull();
    // Duration strings should be non-empty and not 'Never'
    expect(result!.avalanche.payoffDuration).not.toBe("Never");
    expect(result!.snowball.payoffDuration).not.toBe("Never");
    expect(result!.current.payoffDuration).not.toBe("Never");
    expect(result!.avalanche.payoffDuration.length).toBeGreaterThan(0);
  });

  it("debts with zero balance are excluded from comparison", () => {
    const debts: DebtForStrategy[] = [
      { category: "Credit Card", balance: 0, annualRate: 19.9, monthlyPayment: 200 },
      { category: "Car Loan", balance: 8000, annualRate: 6.5, monthlyPayment: 300 },
      { category: "Student Loan", balance: 4000, annualRate: 4.5, monthlyPayment: 150 },
    ];
    // Zero balance excluded → 2 eligible debts → should still work
    const result = compareDebtStrategies(debts);
    expect(result).not.toBeNull();
  });

  it("returns null when fewer than 2 eligible after filtering zeros", () => {
    const debts: DebtForStrategy[] = [
      { category: "A", balance: 0, annualRate: 10, monthlyPayment: 100 },
      { category: "B", balance: 5000, annualRate: 10, monthlyPayment: 150 },
    ];
    expect(compareDebtStrategies(debts)).toBeNull();
  });

  it("avalancheInterestSavings and snowballInterestSavings are non-negative for equal-rate debts", () => {
    const debts: DebtForStrategy[] = [
      { category: "A", balance: 5000, annualRate: 10, monthlyPayment: 200 },
      { category: "B", balance: 3000, annualRate: 10, monthlyPayment: 150 },
    ];
    const result = compareDebtStrategies(debts);
    expect(result).not.toBeNull();
    expect(result!.avalancheInterestSavings).toBeGreaterThanOrEqual(0);
    expect(result!.snowballInterestSavings).toBeGreaterThanOrEqual(0);
  });
});

// ─── generateInsights — debt-strategy insights ────────────────────────────────

describe("generateInsights debt-strategy", () => {
  const baseData: FinancialData = {
    totalAssets: 50000,
    totalDebts: 17000,
    monthlyIncome: 5000,
    monthlyExpenses: 2000,
    debts: [
      { category: "Credit Card", amount: 5000, interestRate: 19.9, monthlyPayment: 200 },
      { category: "Car Loan", amount: 12000, interestRate: 6.5, monthlyPayment: 300 },
    ],
  };

  it("generates a debt-strategy insight when 2+ debts with rates and payments", () => {
    const insights = generateInsights(baseData);
    const strategyInsights = insights.filter((i) => i.type === "debt-strategy");
    expect(strategyInsights.length).toBeGreaterThan(0);
  });

  it("debt-strategy insight message mentions the better strategy", () => {
    const insights = generateInsights(baseData);
    const strategyInsight = insights.find((i) => i.id === "debt-strategy-best");
    expect(strategyInsight).toBeDefined();
    expect(strategyInsight!.message).toMatch(/avalanche|snowball/i);
  });

  it("debt-strategy-timeline insight mentions payoff duration", () => {
    const insights = generateInsights(baseData);
    const timelineInsight = insights.find((i) => i.id === "debt-strategy-timeline");
    expect(timelineInsight).toBeDefined();
    expect(timelineInsight!.message).toMatch(/debt-free/i);
  });

  it("does NOT generate debt-strategy insight when only 1 debt", () => {
    const data: FinancialData = {
      ...baseData,
      debts: [{ category: "Car Loan", amount: 12000, interestRate: 6.5, monthlyPayment: 300 }],
    };
    const insights = generateInsights(data);
    const strategyInsights = insights.filter((i) => i.type === "debt-strategy");
    expect(strategyInsights.length).toBe(0);
  });

  it("does NOT generate debt-strategy insight when debts have no payment info", () => {
    const data: FinancialData = {
      ...baseData,
      debts: [
        { category: "Credit Card", amount: 5000 },
        { category: "Car Loan", amount: 12000 },
      ],
    };
    const insights = generateInsights(data);
    const strategyInsights = insights.filter((i) => i.type === "debt-strategy");
    expect(strategyInsights.length).toBe(0);
  });

  it("does NOT generate debt-strategy insight when no debts array", () => {
    const data: FinancialData = { ...baseData, debts: undefined };
    const insights = generateInsights(data);
    const strategyInsights = insights.filter((i) => i.type === "debt-strategy");
    expect(strategyInsights.length).toBe(0);
  });
});
