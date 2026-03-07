/**
 * T1 unit tests: dark theme styling for entry panel components (Task 129)
 */
import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "../test-utils";
import AssetEntry from "@/components/AssetEntry";
import DebtEntry from "@/components/DebtEntry";
import IncomeEntry from "@/components/IncomeEntry";
import ExpenseEntry from "@/components/ExpenseEntry";
import PropertyEntry from "@/components/PropertyEntry";

describe("AssetEntry dark theme", () => {
  it("renders dark glass card", () => {
    const { container } = render(<AssetEntry />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("bg-white/5");
    expect(card.className).toContain("backdrop-blur-sm");
    expect(card.className).toContain("border-white/10");
  });

  it("heading uses light text", () => {
    render(<AssetEntry />);
    const heading = screen.getByRole("heading");
    expect(heading.className).toContain("text-slate-200");
  });

  it("'Add Asset' button uses cyan accent", () => {
    render(<AssetEntry />);
    const btn = screen.getByText("+ Add Asset");
    expect(btn.className).toContain("text-cyan-400");
  });
});

describe("DebtEntry dark theme", () => {
  it("renders dark glass card", () => {
    const { container } = render(<DebtEntry />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("bg-white/5");
    expect(card.className).toContain("border-white/10");
  });

  it("heading uses light text", () => {
    render(<DebtEntry />);
    const heading = screen.getByRole("heading");
    expect(heading.className).toContain("text-slate-200");
  });

  it("'Add Debt' button uses cyan accent", () => {
    render(<DebtEntry />);
    const btn = screen.getByText("+ Add Debt");
    expect(btn.className).toContain("text-cyan-400");
  });

  it("debt amount button uses rose accent", () => {
    render(<DebtEntry />);
    const amountBtn = screen.getByLabelText(/Edit amount for Car Loan, currently/);
    expect(amountBtn.className).toContain("text-rose-400");
  });
});

describe("IncomeEntry dark theme", () => {
  it("renders dark glass card", () => {
    const { container } = render(<IncomeEntry />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("bg-white/5");
    expect(card.className).toContain("border-white/10");
  });

  it("'Add Income' button uses cyan accent", () => {
    render(<IncomeEntry />);
    const btn = screen.getByText("+ Add Income");
    expect(btn.className).toContain("text-cyan-400");
  });

  it("income amount displays in emerald", () => {
    render(<IncomeEntry />);
    const amountBtn = screen.getByLabelText(/Edit amount for Salary, currently/);
    expect(amountBtn.querySelector('[class*="text-emerald-400"]')).toBeInTheDocument();
  });
});

describe("ExpenseEntry dark theme", () => {
  it("renders dark glass card", () => {
    const { container } = render(<ExpenseEntry />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("bg-white/5");
    expect(card.className).toContain("border-white/10");
  });

  it("'Add Expense' button uses cyan accent", () => {
    render(<ExpenseEntry />);
    const btn = screen.getByText("+ Add Expense");
    expect(btn.className).toContain("text-cyan-400");
  });

  it("expense amount displays in rose", () => {
    render(<ExpenseEntry />);
    const amountBtn = screen.getByLabelText(/Edit amount for Groceries, currently/);
    expect(amountBtn.querySelector('[class*="text-rose-400"]')).toBeInTheDocument();
  });
});

describe("PropertyEntry dark theme", () => {
  it("renders dark glass card", () => {
    const { container } = render(<PropertyEntry />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("bg-white/5");
    expect(card.className).toContain("border-white/10");
  });

  it("heading uses light text", () => {
    render(<PropertyEntry />);
    const heading = screen.getByRole("heading");
    expect(heading.className).toContain("text-slate-200");
  });

  it("'Add Property' button uses cyan accent", () => {
    render(<PropertyEntry />);
    const btn = screen.getByText("+ Add Property");
    expect(btn.className).toContain("text-cyan-400");
  });

  it("property value displays in emerald", () => {
    const properties = [{ id: "p1", name: "Home", value: 500000, mortgage: 300000 }];
    render(<PropertyEntry properties={properties} />);
    const valueBtn = screen.getByLabelText(/Edit value for Home, currently/);
    expect(valueBtn.className).toContain("text-emerald-400");
  });

  it("mortgage displays in rose", () => {
    const properties = [{ id: "p1", name: "Home", value: 500000, mortgage: 300000 }];
    render(<PropertyEntry properties={properties} />);
    const mortgageBtn = screen.getByLabelText(/Edit mortgage for Home, currently/);
    expect(mortgageBtn.className).toContain("text-rose-400");
  });

  it("equity label displays in emerald", () => {
    const properties = [{ id: "p1", name: "Home", value: 500000, mortgage: 300000 }];
    render(<PropertyEntry properties={properties} />);
    const equityEl = screen.getByTestId("equity-p1");
    expect(equityEl.className).toContain("text-emerald-400");
  });
});
