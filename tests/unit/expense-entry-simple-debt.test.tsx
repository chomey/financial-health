import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "../test-utils";
import userEvent from "@testing-library/user-event";
import ExpenseEntry, { SIMPLE_DEBT_CATEGORY } from "@/components/ExpenseEntry";
import type { Debt } from "@/components/DebtEntry";

const mockExpenses = [
  { id: "e1", category: "Rent/Mortgage Payment", amount: 1800 },
];

describe("ExpenseEntry simple mode debt payments subsection", () => {
  it("shows Debt Payments subsection in simple mode when onDebtsChange is provided", () => {
    render(
      <ExpenseEntry
        items={mockExpenses}
        debts={[]}
        onDebtsChange={vi.fn()}
      />,
      { mode: "simple" }
    );
    expect(screen.getByTestId("simple-debt-payments-section")).toBeInTheDocument();
    expect(screen.getByText("Debt Payments")).toBeInTheDocument();
  });

  it("does not show Debt Payments subsection in advanced mode", () => {
    render(
      <ExpenseEntry
        items={mockExpenses}
        debts={[]}
        onDebtsChange={vi.fn()}
      />,
      { mode: "advanced" }
    );
    expect(screen.queryByTestId("simple-debt-payments-section")).not.toBeInTheDocument();
  });

  it("does not show Debt Payments subsection in simple mode when onDebtsChange is not provided", () => {
    render(
      <ExpenseEntry items={mockExpenses} />,
      { mode: "simple" }
    );
    expect(screen.queryByTestId("simple-debt-payments-section")).not.toBeInTheDocument();
  });

  it("displays $0/mo when no debt payments exist", () => {
    render(
      <ExpenseEntry
        items={mockExpenses}
        debts={[]}
        onDebtsChange={vi.fn()}
      />,
      { mode: "simple" }
    );
    expect(screen.getByTestId("simple-debt-amount")).toHaveTextContent("$0/mo");
  });

  it("displays existing debt payment amount", () => {
    const debts: Debt[] = [
      { id: "d1", category: SIMPLE_DEBT_CATEGORY, amount: 0, monthlyPayment: 500 },
    ];
    render(
      <ExpenseEntry
        items={mockExpenses}
        debts={debts}
        onDebtsChange={vi.fn()}
      />,
      { mode: "simple" }
    );
    expect(screen.getByTestId("simple-debt-amount")).toHaveTextContent("$500/mo");
  });

  it("calls onDebtsChange with new debt item when amount is entered", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ExpenseEntry
        items={mockExpenses}
        debts={[]}
        onDebtsChange={onChange}
      />,
      { mode: "simple" }
    );
    await user.click(screen.getByTestId("simple-debt-amount"));
    const input = screen.getByTestId("simple-debt-input");
    await user.clear(input);
    await user.type(input, "300");
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          category: SIMPLE_DEBT_CATEGORY,
          monthlyPayment: 300,
        }),
      ])
    );
  });

  it("calls onDebtsChange updating existing debt item", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const debts: Debt[] = [
      { id: "d1", category: SIMPLE_DEBT_CATEGORY, amount: 0, monthlyPayment: 200 },
    ];
    render(
      <ExpenseEntry
        items={mockExpenses}
        debts={debts}
        onDebtsChange={onChange}
      />,
      { mode: "simple" }
    );
    await user.click(screen.getByTestId("simple-debt-amount"));
    const input = screen.getByTestId("simple-debt-input");
    await user.clear(input);
    await user.type(input, "450");
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith([
      { id: "d1", category: SIMPLE_DEBT_CATEGORY, amount: 0, monthlyPayment: 450 },
    ]);
  });

  it("removes debt item when amount is cleared to zero", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const debts: Debt[] = [
      { id: "d1", category: SIMPLE_DEBT_CATEGORY, amount: 0, monthlyPayment: 200 },
    ];
    render(
      <ExpenseEntry
        items={mockExpenses}
        debts={debts}
        onDebtsChange={onChange}
      />,
      { mode: "simple" }
    );
    await user.click(screen.getByTestId("simple-debt-amount"));
    const input = screen.getByTestId("simple-debt-input");
    await user.clear(input);
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("still renders expenses list in simple mode", () => {
    render(
      <ExpenseEntry
        items={mockExpenses}
        debts={[]}
        onDebtsChange={vi.fn()}
      />,
      { mode: "simple" }
    );
    expect(screen.getByText("Rent/Mortgage Payment")).toBeInTheDocument();
  });

  it("SIMPLE_DEBT_CATEGORY constant is 'Debt Payments'", () => {
    expect(SIMPLE_DEBT_CATEGORY).toBe("Debt Payments");
  });
});
