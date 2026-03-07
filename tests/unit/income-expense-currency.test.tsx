import { describe, it, expect } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { render } from "../test-utils";
import IncomeEntry from "@/components/IncomeEntry";
import ExpenseEntry from "@/components/ExpenseEntry";
import type { IncomeItem } from "@/components/IncomeEntry";
import type { ExpenseItem } from "@/components/ExpenseEntry";
import { computeTotals } from "@/lib/financial-state";
import type { FinancialState } from "@/lib/financial-state";
import { FALLBACK_RATES } from "@/lib/currency";

const hc = "CAD";
const fxRates = FALLBACK_RATES; // USD_CAD = 1.37, CAD_USD = 0.73

const baseState: FinancialState = {
  assets: [],
  debts: [],
  income: [],
  expenses: [],
  properties: [],
  stocks: [],
  country: "CA",
};

// --- computeTotals FX tests ---

describe("computeTotals - FX-aware income", () => {
  it("counts home-currency income at face value", () => {
    const state: FinancialState = {
      ...baseState,
      income: [{ id: "i1", category: "Salary", amount: 5000, currency: "CAD" }],
    };
    const { monthlyIncome } = computeTotals(state);
    expect(monthlyIncome).toBeCloseTo(5000, 1);
  });

  it("converts USD income to CAD (home) using FX rate", () => {
    const state: FinancialState = {
      ...baseState,
      fxRates: { USD_CAD: 1.37, CAD_USD: 0.73 },
      income: [{ id: "i1", category: "USD Salary", amount: 1000, currency: "USD" }],
    };
    const { monthlyIncome } = computeTotals(state);
    // 1000 USD * 1.37 = 1370 CAD
    expect(monthlyIncome).toBeCloseTo(1370, 0);
  });

  it("mixes home and foreign income correctly", () => {
    const state: FinancialState = {
      ...baseState,
      fxRates: { USD_CAD: 1.37, CAD_USD: 0.73 },
      income: [
        { id: "i1", category: "CAD Salary", amount: 5000, currency: "CAD" },
        { id: "i2", category: "USD Freelance", amount: 1000, currency: "USD" },
      ],
    };
    const { monthlyIncome } = computeTotals(state);
    // 5000 + 1000 * 1.37 = 6370
    expect(monthlyIncome).toBeCloseTo(6370, 0);
  });

  it("income without currency treated as home currency", () => {
    const state: FinancialState = {
      ...baseState,
      income: [{ id: "i1", category: "Salary", amount: 4000 }],
    };
    const { monthlyIncome } = computeTotals(state);
    expect(monthlyIncome).toBeCloseTo(4000, 1);
  });
});

describe("computeTotals - FX-aware expenses", () => {
  it("counts home-currency expenses at face value", () => {
    const state: FinancialState = {
      ...baseState,
      expenses: [{ id: "e1", category: "Rent", amount: 2000, currency: "CAD" }],
    };
    const { monthlyExpenses } = computeTotals(state);
    expect(monthlyExpenses).toBeCloseTo(2000, 1);
  });

  it("converts USD expense to CAD (home) using FX rate", () => {
    const state: FinancialState = {
      ...baseState,
      fxRates: { USD_CAD: 1.37, CAD_USD: 0.73 },
      expenses: [{ id: "e1", category: "USD Subscription", amount: 100, currency: "USD" }],
    };
    const { monthlyExpenses } = computeTotals(state);
    // 100 * 1.37 = 137 CAD
    expect(monthlyExpenses).toBeCloseTo(137, 0);
  });

  it("expense without currency treated as home currency", () => {
    const state: FinancialState = {
      ...baseState,
      expenses: [{ id: "e1", category: "Groceries", amount: 600 }],
    };
    const { monthlyExpenses } = computeTotals(state);
    expect(monthlyExpenses).toBeCloseTo(600, 1);
  });
});

// --- IncomeEntry UI tests ---

describe("IncomeEntry - CurrencyBadge", () => {
  const items: IncomeItem[] = [{ id: "i1", category: "Salary", amount: 5000 }];

  it("does not render currency badge when homeCurrency/fxRates not provided", () => {
    render(<IncomeEntry items={items} />);
    expect(screen.queryByTestId("currency-badge")).not.toBeInTheDocument();
  });

  it("renders currency badge when homeCurrency and fxRates are provided", () => {
    render(<IncomeEntry items={items} homeCurrency={hc} fxRates={fxRates} />);
    expect(screen.getByTestId("currency-badge")).toBeInTheDocument();
  });

  it("badge shows home currency label by default", () => {
    render(<IncomeEntry items={items} homeCurrency={hc} fxRates={fxRates} />);
    expect(screen.getByTestId("currency-badge")).toHaveTextContent("CAD");
  });

  it("clicking badge toggles to foreign currency", () => {
    render(<IncomeEntry items={items} homeCurrency={hc} fxRates={fxRates} />);
    const badge = screen.getByTestId("currency-badge");
    fireEvent.click(badge);
    expect(screen.getByTestId("currency-badge")).toHaveTextContent("USD");
  });

  it("shows converted amount after switching to foreign currency", () => {
    const usdItems: IncomeItem[] = [{ id: "i1", category: "USD Salary", amount: 1000, currency: "USD" }];
    render(<IncomeEntry items={usdItems} homeCurrency={hc} fxRates={fxRates} />);
    expect(screen.getByTestId("currency-converted")).toBeInTheDocument();
  });

  it("income-details testid is present for each item", () => {
    render(<IncomeEntry items={items} homeCurrency={hc} fxRates={fxRates} />);
    expect(screen.getByTestId("income-details-i1")).toBeInTheDocument();
  });
});

// --- ExpenseEntry UI tests ---

describe("ExpenseEntry - CurrencyBadge", () => {
  const items: ExpenseItem[] = [{ id: "e1", category: "Rent", amount: 2000 }];

  it("does not render currency badge when homeCurrency/fxRates not provided", () => {
    render(<ExpenseEntry items={items} />);
    expect(screen.queryByTestId("currency-badge")).not.toBeInTheDocument();
  });

  it("renders currency badge when homeCurrency and fxRates are provided", () => {
    render(<ExpenseEntry items={items} homeCurrency={hc} fxRates={fxRates} />);
    expect(screen.getByTestId("currency-badge")).toBeInTheDocument();
  });

  it("badge shows home currency label by default", () => {
    render(<ExpenseEntry items={items} homeCurrency={hc} fxRates={fxRates} />);
    expect(screen.getByTestId("currency-badge")).toHaveTextContent("CAD");
  });

  it("clicking badge toggles to foreign currency", () => {
    render(<ExpenseEntry items={items} homeCurrency={hc} fxRates={fxRates} />);
    const badge = screen.getByTestId("currency-badge");
    fireEvent.click(badge);
    expect(screen.getByTestId("currency-badge")).toHaveTextContent("USD");
  });

  it("expense-details testid is present for each item", () => {
    render(<ExpenseEntry items={items} homeCurrency={hc} fxRates={fxRates} />);
    expect(screen.getByTestId("expense-details-e1")).toBeInTheDocument();
  });
});
