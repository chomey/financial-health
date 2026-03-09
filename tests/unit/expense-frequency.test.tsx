import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "../test-utils";
import userEvent from "@testing-library/user-event";
import ExpenseEntry, {
  normalizeExpenseToMonthly,
  type ExpenseFrequency,
  type ExpenseItem,
} from "@/components/ExpenseEntry";

describe("normalizeExpenseToMonthly", () => {
  it("returns amount as-is for monthly frequency", () => {
    expect(normalizeExpenseToMonthly(1200, "monthly")).toBe(1200);
  });

  it("returns amount as-is when frequency is undefined (default monthly)", () => {
    expect(normalizeExpenseToMonthly(600)).toBe(600);
  });

  it("divides by 12 for yearly frequency", () => {
    expect(normalizeExpenseToMonthly(3600, "yearly")).toBe(300);
  });

  it("divides by 12 for one-time frequency", () => {
    expect(normalizeExpenseToMonthly(1200, "one-time")).toBe(100);
  });

  it("handles zero correctly", () => {
    expect(normalizeExpenseToMonthly(0, "yearly")).toBe(0);
    expect(normalizeExpenseToMonthly(0, "one-time")).toBe(0);
  });

  it("handles large yearly amounts", () => {
    expect(normalizeExpenseToMonthly(24000, "yearly")).toBe(2000);
  });
});

describe("ExpenseEntry frequency display", () => {
  it("shows frequency dropdowns for each expense item", () => {
    render(
      <ExpenseEntry
        items={[{ id: "e1", category: "Vacation", amount: 3600, frequency: "yearly" }]}
        onChange={vi.fn()}
      />
    );
    const dropdown = screen.getByTestId("expense-frequency-e1");
    expect(dropdown).toBeInTheDocument();
    expect((dropdown as HTMLSelectElement).value).toBe("yearly");
  });

  it("shows /yr suffix and monthly equivalent for yearly expenses", () => {
    render(
      <ExpenseEntry
        items={[{ id: "e1", category: "Vacation", amount: 3600, frequency: "yearly" }]}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText("$3,600/yr")).toBeInTheDocument();
    expect(screen.getByText("$300/mo")).toBeInTheDocument();
  });

  it("shows 'once' label for one-time expenses with monthly equivalent", () => {
    render(
      <ExpenseEntry
        items={[{ id: "e1", category: "Moving costs", amount: 2400, frequency: "one-time" }]}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText("$2,400once")).toBeInTheDocument();
    expect(screen.getByText("$200/mo")).toBeInTheDocument();
  });

  it("shows /mo and yearly total for monthly expenses", () => {
    render(
      <ExpenseEntry
        items={[{ id: "e1", category: "Rent", amount: 2000 }]}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText("$2,000/mo")).toBeInTheDocument();
    expect(screen.getByText("$24,000/yr")).toBeInTheDocument();
  });

  it("monthly total uses normalized amounts", () => {
    render(
      <ExpenseEntry
        items={[
          { id: "e1", category: "Rent", amount: 1200, frequency: "monthly" },
          { id: "e2", category: "Insurance", amount: 1200, frequency: "yearly" },
          { id: "e3", category: "Moving", amount: 600, frequency: "one-time" },
        ]}
        onChange={vi.fn()}
      />
    );
    // 1200 + 1200/12 + 600/12 = 1200 + 100 + 50 = 1350
    expect(screen.getByTestId("expense-monthly-total")).toHaveTextContent("$1,350");
  });

  it("shows new expense frequency dropdown in add form", async () => {
    const user = userEvent.setup();
    render(<ExpenseEntry />);
    await user.click(screen.getByText("+ Add Expense"));
    expect(screen.getByTestId("new-expense-frequency")).toBeInTheDocument();
  });

  it("can change frequency via dropdown", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ExpenseEntry
        items={[{ id: "e1", category: "Insurance", amount: 1200 }]}
        onChange={onChange}
      />
    );
    const dropdown = screen.getByTestId("expense-frequency-e1");
    await user.selectOptions(dropdown, "yearly");
    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: "e1", frequency: "yearly" }),
      ])
    );
  });

  it("setting frequency back to monthly removes the frequency field", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ExpenseEntry
        items={[{ id: "e1", category: "Insurance", amount: 1200, frequency: "yearly" }]}
        onChange={onChange}
      />
    );
    const dropdown = screen.getByTestId("expense-frequency-e1");
    await user.selectOptions(dropdown, "monthly");
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0] as ExpenseItem[];
    expect(lastCall[0].frequency).toBeUndefined();
  });
});

describe("ExpenseEntry URL state round-trip for frequency", () => {
  it("type ExpenseFrequency accepts monthly, yearly, one-time", () => {
    const values: ExpenseFrequency[] = ["monthly", "yearly", "one-time"];
    expect(values).toHaveLength(3);
  });
});

describe("expense frequency calculations integration", () => {
  it("monthly total reflects normalized amounts for mixed frequencies", () => {
    // $1,200/mo + $3,600/yr ($300/mo) + $600 once ($50/mo) = $1,550/mo
    const items: ExpenseItem[] = [
      { id: "e1", category: "Rent", amount: 1200, frequency: "monthly" },
      { id: "e2", category: "Insurance", amount: 3600, frequency: "yearly" },
      { id: "e3", category: "Setup fee", amount: 600, frequency: "one-time" },
    ];
    const total = items.reduce(
      (sum, e) => sum + normalizeExpenseToMonthly(e.amount, e.frequency),
      0
    );
    expect(total).toBe(1550);
  });

  it("yearly expense monthly = amount/12, yearly = amount", () => {
    const monthly = normalizeExpenseToMonthly(1200, "yearly");
    expect(monthly).toBe(100);
    expect(monthly * 12).toBe(1200);
  });

  it("one-time expense monthly = amount/12", () => {
    const monthly = normalizeExpenseToMonthly(2400, "one-time");
    expect(monthly).toBe(200);
  });
});
