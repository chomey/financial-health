import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "../test-utils";
import IncomeEntry from "@/components/IncomeEntry";
import type { MonthlyInvestmentReturn } from "@/lib/financial-state";

const sampleReturns: MonthlyInvestmentReturn[] = [
  { label: "TFSA", amount: 250, balance: 30000, roi: 10 },
  { label: "RRSP", amount: 125, balance: 15000, roi: 10 },
];

describe("IncomeEntry - investment returns auto-computed section", () => {
  it("does not show auto-computed section when no investment returns provided", () => {
    render(<IncomeEntry items={[]} investmentReturns={[]} />);
    expect(screen.queryByTestId("investment-returns-auto-section")).not.toBeInTheDocument();
  });

  it("shows auto-computed section when investment returns are provided", () => {
    render(<IncomeEntry items={[]} investmentReturns={sampleReturns} />);
    expect(screen.getByTestId("investment-returns-auto-section")).toBeInTheDocument();
  });

  it("shows 'Auto-computed' heading when investment returns present", () => {
    render(<IncomeEntry items={[]} investmentReturns={sampleReturns} />);
    expect(screen.getByText("Auto-computed")).toBeInTheDocument();
  });

  it("renders one row per investment return", () => {
    render(<IncomeEntry items={[]} investmentReturns={sampleReturns} />);
    const rows = screen.getAllByTestId("investment-return-row");
    expect(rows).toHaveLength(2);
  });

  it("displays label as '{category} returns'", () => {
    render(<IncomeEntry items={[]} investmentReturns={sampleReturns} />);
    expect(screen.getByText("TFSA returns")).toBeInTheDocument();
    expect(screen.getByText("RRSP returns")).toBeInTheDocument();
  });

  it("displays auto badge on each row", () => {
    render(<IncomeEntry items={[]} investmentReturns={sampleReturns} />);
    const autoBadges = screen.getAllByText("auto");
    expect(autoBadges.length).toBeGreaterThanOrEqual(2);
  });

  it("displays formatted monthly return amounts", () => {
    render(<IncomeEntry items={[]} investmentReturns={sampleReturns} />);
    // TFSA: $250/mo, RRSP: $125/mo
    expect(screen.getByText("$250")).toBeInTheDocument();
    expect(screen.getByText("$125")).toBeInTheDocument();
  });

  it("includes investment returns in monthly total", () => {
    const items = [{ id: "i1", category: "Salary", amount: 5000 }];
    render(<IncomeEntry items={items} investmentReturns={sampleReturns} />);
    // total = 5000 + 250 + 125 = 5375
    expect(screen.getByTestId("income-monthly-total")).toHaveTextContent("$5,375");
  });

  it("shows only investment return total when no manual items", () => {
    render(<IncomeEntry items={[]} investmentReturns={sampleReturns} />);
    // total = 250 + 125 = 375
    expect(screen.getByTestId("income-monthly-total")).toHaveTextContent("$375");
  });

  it("does not show empty state when investment returns present but no manual items", () => {
    render(<IncomeEntry items={[]} investmentReturns={sampleReturns} />);
    expect(screen.queryByTestId("income-empty-state")).not.toBeInTheDocument();
  });

  it("shows empty state when no items and no investment returns", () => {
    render(<IncomeEntry items={[]} investmentReturns={[]} />);
    expect(screen.getByTestId("income-empty-state")).toBeInTheDocument();
  });

  it("auto rows are read-only (no edit buttons)", () => {
    render(<IncomeEntry items={[]} investmentReturns={sampleReturns} />);
    const rows = screen.getAllByTestId("investment-return-row");
    for (const row of rows) {
      // No delete button inside auto rows
      expect(row.querySelector("button")).toBeNull();
    }
  });

  it("shows both manual items and auto-computed returns together", () => {
    const items = [{ id: "i1", category: "Salary", amount: 5000 }];
    render(<IncomeEntry items={items} investmentReturns={sampleReturns} />);
    expect(screen.getByText("Salary")).toBeInTheDocument();
    expect(screen.getByText("TFSA returns")).toBeInTheDocument();
    expect(screen.getByText("RRSP returns")).toBeInTheDocument();
  });

  it("handles single investment return correctly", () => {
    const single: MonthlyInvestmentReturn[] = [
      { label: "Savings", amount: 100, balance: 12000, roi: 10 },
    ];
    render(<IncomeEntry items={[]} investmentReturns={single} />);
    expect(screen.getByText("Savings returns")).toBeInTheDocument();
    expect(screen.getByTestId("income-monthly-total")).toHaveTextContent("$100");
  });
});
