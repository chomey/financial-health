import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "../test-utils";
import IncomeEntry from "@/components/IncomeEntry";
import ExpenseEntry from "@/components/ExpenseEntry";

describe("IncomeEntry dual monthly/yearly display", () => {
  it("shows yearly total alongside monthly total in footer", () => {
    const items = [{ id: "i1", category: "Salary", amount: 5000 }];
    render(<IncomeEntry items={items} />);
    expect(screen.getByTestId("income-monthly-total")).toHaveTextContent("$5,000");
    expect(screen.getByTestId("income-yearly-total")).toHaveTextContent("$60,000");
  });

  it("shows /mo suffix on monthly income items", () => {
    const items = [{ id: "i1", category: "Salary", amount: 5000 }];
    render(<IncomeEntry items={items} />);
    expect(screen.getByText("$5,000/mo")).toBeInTheDocument();
  });

  it("shows yearly equivalent below monthly income item", () => {
    const items = [{ id: "i1", category: "Salary", amount: 5000 }];
    render(<IncomeEntry items={items} />);
    expect(screen.getByText("$60,000/yr")).toBeInTheDocument();
  });

  it("shows monthly equivalent for annually-entered income", () => {
    const items = [{ id: "i1", category: "Bonus", amount: 60000, frequency: "annually" as const }];
    render(<IncomeEntry items={items} />);
    expect(screen.getByText("$60,000/yr")).toBeInTheDocument();
    // secondary line shows monthly equivalent
    expect(screen.getByText("$5,000/mo")).toBeInTheDocument();
  });

  it("shows monthly total uses monthly-equivalent values", () => {
    const items = [{ id: "i1", category: "Bonus", amount: 60000, frequency: "annually" as const }];
    render(<IncomeEntry items={items} />);
    expect(screen.getByTestId("income-monthly-total")).toHaveTextContent("$5,000");
    expect(screen.getByTestId("income-yearly-total")).toHaveTextContent("$60,000");
  });

  it("formats the footer as Monthly: X | Yearly: Y", () => {
    const items = [{ id: "i1", category: "Salary", amount: 1000 }];
    render(<IncomeEntry items={items} />);
    const footer = screen.getByTestId("income-monthly-total").closest("span")?.parentElement;
    expect(footer?.textContent).toContain("Monthly:");
    expect(footer?.textContent).toContain("Yearly:");
    expect(footer?.textContent).toContain("|");
  });
});

describe("ExpenseEntry dual monthly/yearly display", () => {
  it("shows no monthly/yearly toggle button", () => {
    render(<ExpenseEntry />);
    expect(screen.queryByTestId("expense-view-toggle")).not.toBeInTheDocument();
  });

  it("shows monthly total in footer", () => {
    const items = [{ id: "e1", category: "Rent", amount: 2000 }];
    render(<ExpenseEntry items={items} />);
    expect(screen.getByTestId("expense-monthly-total")).toHaveTextContent("$2,000");
  });

  it("shows yearly total in footer", () => {
    const items = [{ id: "e1", category: "Rent", amount: 2000 }];
    render(<ExpenseEntry items={items} />);
    expect(screen.getByTestId("expense-yearly-total")).toHaveTextContent("$24,000");
  });

  it("shows /mo and /yr on expense item amounts", () => {
    const items = [{ id: "e1", category: "Rent", amount: 2000 }];
    render(<ExpenseEntry items={items} />);
    expect(screen.getByText("$2,000/mo")).toBeInTheDocument();
    expect(screen.getByText("$24,000/yr")).toBeInTheDocument();
  });

  it("formats expense footer as Monthly: X | Yearly: Y", () => {
    const items = [{ id: "e1", category: "Rent", amount: 1500 }];
    render(<ExpenseEntry items={items} />);
    const monthlyEl = screen.getByTestId("expense-monthly-total");
    const yearlyEl = screen.getByTestId("expense-yearly-total");
    expect(monthlyEl).toHaveTextContent("$1,500");
    expect(yearlyEl).toHaveTextContent("$18,000");
    const parent = monthlyEl.parentElement;
    expect(parent?.textContent).toContain("|");
  });

  it("auto-computed investment contributions row shows both amounts", () => {
    render(<ExpenseEntry investmentContributions={500} />);
    const row = screen.getByTestId("investment-contributions-row");
    expect(row.textContent).toContain("$500/mo");
    expect(row.textContent).toContain("$6,000/yr");
  });

  it("auto-computed mortgage payments row shows both amounts", () => {
    render(<ExpenseEntry mortgagePayments={1200} />);
    const row = screen.getByTestId("mortgage-payments-row");
    expect(row.textContent).toContain("$1,200/mo");
    expect(row.textContent).toContain("$14,400/yr");
  });
});
