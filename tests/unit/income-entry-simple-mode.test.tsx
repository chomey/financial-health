import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "../test-utils";
import IncomeEntry from "@/components/IncomeEntry";
import type { IncomeItem } from "@/components/IncomeEntry";

const SAMPLE_INCOME: IncomeItem[] = [
  { id: "i1", category: "Salary", amount: 5500, frequency: "monthly" },
  { id: "i2", category: "Dividends", amount: 1200, frequency: "annually", incomeType: "capital-gains" },
];

describe("IncomeEntry — simple mode", () => {
  it("shows category and amount in simple mode", () => {
    render(<IncomeEntry items={SAMPLE_INCOME} />, { mode: "simple" });
    expect(screen.getByText("Salary")).toBeInTheDocument();
    expect(screen.getByText("Dividends")).toBeInTheDocument();
  });

  it("shows frequency dropdown in simple mode", () => {
    render(<IncomeEntry items={SAMPLE_INCOME} />, { mode: "simple" });
    expect(screen.getByTestId("frequency-i1")).toBeInTheDocument();
    expect(screen.getByTestId("frequency-i2")).toBeInTheDocument();
  });

  it("hides income type selector in simple mode", () => {
    render(<IncomeEntry items={SAMPLE_INCOME} />, { mode: "simple" });
    expect(screen.queryByTestId("income-type-i1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("income-type-i2")).not.toBeInTheDocument();
  });

  it("shows income type selector in advanced mode", () => {
    render(<IncomeEntry items={SAMPLE_INCOME} />, { mode: "advanced" });
    expect(screen.getByTestId("income-type-i1")).toBeInTheDocument();
    expect(screen.getByTestId("income-type-i2")).toBeInTheDocument();
  });

  it("hides new income type selector in simple mode add form", async () => {
    const user = userEvent.setup();
    render(<IncomeEntry items={[]} />, { mode: "simple" });
    await user.click(screen.getByText("+ Add Income"));
    expect(screen.queryByTestId("new-income-type")).not.toBeInTheDocument();
  });

  it("shows new income type selector in advanced mode add form", async () => {
    const user = userEvent.setup();
    render(<IncomeEntry items={[]} />, { mode: "advanced" });
    await user.click(screen.getByText("+ Add Income"));
    expect(screen.getByTestId("new-income-type")).toBeInTheDocument();
  });

  it("shows new frequency dropdown in simple mode add form", async () => {
    const user = userEvent.setup();
    render(<IncomeEntry items={[]} />, { mode: "simple" });
    await user.click(screen.getByText("+ Add Income"));
    expect(screen.getByTestId("new-income-frequency")).toBeInTheDocument();
  });

  it("shows monthly total in simple mode", () => {
    render(<IncomeEntry items={SAMPLE_INCOME} />, { mode: "simple" });
    expect(screen.getByTestId("income-monthly-total")).toBeInTheDocument();
  });
});
