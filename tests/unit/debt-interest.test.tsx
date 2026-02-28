import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DebtEntry, { getDefaultDebtInterest, DEFAULT_DEBT_INTEREST } from "@/components/DebtEntry";
import { encodeState, decodeState, toCompact, fromCompact } from "@/lib/url-state";
import { generateInsights } from "@/lib/insights";
import type { FinancialState } from "@/lib/financial-state";
import { toFinancialData } from "@/lib/financial-state";

describe("getDefaultDebtInterest", () => {
  it("returns 19.9 for Credit Card", () => {
    expect(getDefaultDebtInterest("Credit Card")).toBe(19.9);
  });

  it("returns 6 for Car Loan", () => {
    expect(getDefaultDebtInterest("Car Loan")).toBe(6);
  });

  it("returns 5 for Student Loan", () => {
    expect(getDefaultDebtInterest("Student Loan")).toBe(5);
  });

  it("returns 8 for Personal Loan", () => {
    expect(getDefaultDebtInterest("Personal Loan")).toBe(8);
  });

  it("returns undefined for unknown categories", () => {
    expect(getDefaultDebtInterest("Unknown Debt")).toBeUndefined();
    expect(getDefaultDebtInterest("Other")).toBeUndefined();
  });
});

describe("Debt interest rate and payment UI", () => {
  it("shows interest rate suggested badge for known debt types", () => {
    const items = [{ id: "d1", category: "Credit Card", amount: 5000 }];
    render(<DebtEntry items={items} />);
    const badge = screen.getByTestId("interest-badge-d1");
    expect(badge).toHaveTextContent("19.9% APR (suggested)");
  });

  it("shows placeholder text for unknown category interest", () => {
    const items = [{ id: "d1", category: "Other", amount: 5000 }];
    render(<DebtEntry items={items} />);
    const badge = screen.getByTestId("interest-badge-d1");
    expect(badge).toHaveTextContent("Interest rate %");
  });

  it("shows set interest rate without (suggested) label", () => {
    const items = [{ id: "d1", category: "Credit Card", amount: 5000, interestRate: 22.5 }];
    render(<DebtEntry items={items} />);
    const badge = screen.getByTestId("interest-badge-d1");
    expect(badge).toHaveTextContent("22.5% APR");
    expect(badge).not.toHaveTextContent("suggested");
  });

  it("shows payment badge when set", () => {
    const items = [{ id: "d1", category: "Car Loan", amount: 15000, monthlyPayment: 350 }];
    render(<DebtEntry items={items} />);
    const badge = screen.getByTestId("debt-payment-badge-d1");
    expect(badge).toHaveTextContent("$350/mo");
  });

  it("shows placeholder for monthly payment when not set", () => {
    const items = [{ id: "d1", category: "Car Loan", amount: 15000 }];
    render(<DebtEntry items={items} />);
    const badge = screen.getByTestId("debt-payment-badge-d1");
    expect(badge).toHaveTextContent("Monthly payment");
  });

  it("allows editing interest rate via click", async () => {
    const user = userEvent.setup();
    const items = [{ id: "d1", category: "Car Loan", amount: 15000 }];
    render(<DebtEntry items={items} />);

    await user.click(screen.getByTestId("interest-badge-d1"));
    const input = screen.getByLabelText("Edit interest rate for Car Loan");
    expect(input).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, "5.5");
    await user.keyboard("{Enter}");

    const badge = screen.getByTestId("interest-badge-d1");
    expect(badge).toHaveTextContent("5.5% APR");
    expect(badge).not.toHaveTextContent("suggested");
  });

  it("allows editing monthly payment via click", async () => {
    const user = userEvent.setup();
    const items = [{ id: "d1", category: "Car Loan", amount: 15000 }];
    render(<DebtEntry items={items} />);

    await user.click(screen.getByTestId("debt-payment-badge-d1"));
    const input = screen.getByLabelText("Edit monthly payment for Car Loan");
    expect(input).toBeInTheDocument();

    await user.type(input, "350");
    await user.keyboard("{Enter}");

    const badge = screen.getByTestId("debt-payment-badge-d1");
    expect(badge).toHaveTextContent("$350/mo");
  });

  it("calls onChange when interest rate is set", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const items = [{ id: "d1", category: "Car Loan", amount: 15000 }];
    render(<DebtEntry items={items} onChange={onChange} />);

    await user.click(screen.getByTestId("interest-badge-d1"));
    const input = screen.getByLabelText("Edit interest rate for Car Loan");
    await user.type(input, "7");
    await user.keyboard("{Enter}");

    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall[0].interestRate).toBe(7);
  });
});

describe("URL state encoding with debt interest and payment", () => {
  it("roundtrips debts with interest rate", () => {
    const state: FinancialState = {
      assets: [],
      debts: [{ id: "d1", category: "Credit Card", amount: 5000, interestRate: 19.9 }],
      income: [],
      expenses: [],
      goals: [],
      properties: [],
    };
    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.debts[0].interestRate).toBe(19.9);
  });

  it("roundtrips debts with monthly payment", () => {
    const state: FinancialState = {
      assets: [],
      debts: [{ id: "d1", category: "Car Loan", amount: 15000, monthlyPayment: 350 }],
      income: [],
      expenses: [],
      goals: [],
      properties: [],
    };
    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.debts[0].monthlyPayment).toBe(350);
  });

  it("roundtrips debts with both interest and payment", () => {
    const state: FinancialState = {
      assets: [],
      debts: [{ id: "d1", category: "Credit Card", amount: 5000, interestRate: 19.9, monthlyPayment: 150 }],
      income: [],
      expenses: [],
      goals: [],
      properties: [],
    };
    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.debts[0].interestRate).toBe(19.9);
    expect(decoded!.debts[0].monthlyPayment).toBe(150);
  });

  it("does not include interest/payment in compact when not set", () => {
    const state: FinancialState = {
      assets: [],
      debts: [{ id: "d1", category: "Car Loan", amount: 15000 }],
      income: [],
      expenses: [],
      goals: [],
      properties: [],
    };
    const compact = toCompact(state);
    expect(compact.d[0]).toEqual({ c: "Car Loan", a: 15000 });
    expect(compact.d[0].ir).toBeUndefined();
    expect(compact.d[0].mp).toBeUndefined();
  });

  it("includes interest/payment in compact when set", () => {
    const state: FinancialState = {
      assets: [],
      debts: [{ id: "d1", category: "Credit Card", amount: 5000, interestRate: 19.9, monthlyPayment: 150 }],
      income: [],
      expenses: [],
      goals: [],
      properties: [],
    };
    const compact = toCompact(state);
    expect(compact.d[0].ir).toBe(19.9);
    expect(compact.d[0].mp).toBe(150);
  });

  it("restores interest/payment from compact", () => {
    const compact = {
      a: [],
      d: [{ c: "Credit Card", a: 5000, ir: 19.9, mp: 150 }],
      i: [],
      e: [],
      g: [],
    };
    const state = fromCompact(compact);
    expect(state.debts[0].interestRate).toBe(19.9);
    expect(state.debts[0].monthlyPayment).toBe(150);
  });

  it("backward compat: no interest/payment in compact still works", () => {
    const compact = {
      a: [],
      d: [{ c: "Car Loan", a: 15000 }],
      i: [],
      e: [],
      g: [],
    };
    const state = fromCompact(compact);
    expect(state.debts[0].interestRate).toBeUndefined();
    expect(state.debts[0].monthlyPayment).toBeUndefined();
  });
});

describe("Insights with debt interest rates", () => {
  it("generates high-interest debt insight for credit card at 19.9%", () => {
    const insights = generateInsights({
      totalAssets: 50000,
      totalDebts: 10000,
      monthlyIncome: 5000,
      monthlyExpenses: 3000,
      goals: [],
      debts: [
        { category: "Credit Card", amount: 5000, interestRate: 19.9 },
        { category: "Car Loan", amount: 5000, interestRate: 6 },
      ],
    });
    const debtInsight = insights.find((i) => i.type === "debt-interest");
    expect(debtInsight).toBeDefined();
    expect(debtInsight!.message).toContain("Credit Card");
    expect(debtInsight!.message).toContain("19.9%");
  });

  it("generates debt priority insight when multiple debts have interest", () => {
    const insights = generateInsights({
      totalAssets: 50000,
      totalDebts: 20000,
      monthlyIncome: 5000,
      monthlyExpenses: 3000,
      goals: [],
      debts: [
        { category: "Car Loan", amount: 10000, interestRate: 6 },
        { category: "Personal Loan", amount: 10000, interestRate: 8 },
      ],
    });
    const debtInsight = insights.find((i) => i.type === "debt-interest");
    expect(debtInsight).toBeDefined();
    expect(debtInsight!.message).toContain("Personal Loan");
    expect(debtInsight!.message).toContain("8%");
  });

  it("does not generate debt insight when no debts have interest rates", () => {
    const insights = generateInsights({
      totalAssets: 50000,
      totalDebts: 10000,
      monthlyIncome: 5000,
      monthlyExpenses: 3000,
      goals: [],
      debts: [
        { category: "Car Loan", amount: 10000 },
      ],
    });
    const debtInsight = insights.find((i) => i.type === "debt-interest");
    expect(debtInsight).toBeUndefined();
  });

  it("toFinancialData passes debt details through", () => {
    const state: FinancialState = {
      assets: [],
      debts: [{ id: "d1", category: "Credit Card", amount: 5000, interestRate: 19.9, monthlyPayment: 150 }],
      income: [],
      expenses: [],
      goals: [],
      properties: [],
    };
    const data = toFinancialData(state);
    expect(data.debts).toHaveLength(1);
    expect(data.debts![0].category).toBe("Credit Card");
    expect(data.debts![0].interestRate).toBe(19.9);
    expect(data.debts![0].monthlyPayment).toBe(150);
  });
});
