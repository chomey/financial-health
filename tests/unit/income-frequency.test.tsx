import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { normalizeToMonthly } from "@/components/IncomeEntry";
import type { IncomeFrequency } from "@/components/IncomeEntry";
import IncomeEntry from "@/components/IncomeEntry";
import { encodeState, decodeState } from "@/lib/url-state";
import { computeTotals } from "@/lib/financial-state";
import type { FinancialState } from "@/lib/financial-state";

describe("normalizeToMonthly", () => {
  it("returns amount unchanged for monthly frequency", () => {
    expect(normalizeToMonthly(1000, "monthly")).toBe(1000);
  });

  it("returns amount unchanged when frequency is undefined (default)", () => {
    expect(normalizeToMonthly(1000)).toBe(1000);
  });

  it("converts weekly to monthly (× 52/12)", () => {
    const result = normalizeToMonthly(500, "weekly");
    expect(result).toBeCloseTo(500 * 52 / 12, 2);
  });

  it("converts biweekly to monthly (× 26/12)", () => {
    const result = normalizeToMonthly(2000, "biweekly");
    expect(result).toBeCloseTo(2000 * 26 / 12, 2);
  });

  it("converts quarterly to monthly (÷ 3)", () => {
    expect(normalizeToMonthly(3000, "quarterly")).toBeCloseTo(1000, 2);
  });

  it("converts semi-annually to monthly (÷ 6)", () => {
    expect(normalizeToMonthly(6000, "semi-annually")).toBeCloseTo(1000, 2);
  });

  it("converts annually to monthly (÷ 12)", () => {
    expect(normalizeToMonthly(12000, "annually")).toBeCloseTo(1000, 2);
  });

  it("handles zero amount", () => {
    expect(normalizeToMonthly(0, "weekly")).toBe(0);
  });
});

describe("IncomeEntry frequency UI", () => {
  it("renders frequency dropdowns for each income item", () => {
    render(<IncomeEntry />);
    const frequencySelects = screen.getAllByLabelText(/Change frequency for/);
    expect(frequencySelects.length).toBe(2); // Salary and Freelance
  });

  it("defaults to monthly frequency for existing items", () => {
    render(<IncomeEntry />);
    const salaryFreq = screen.getByTestId("frequency-i1") as HTMLSelectElement;
    expect(salaryFreq.value).toBe("monthly");
  });

  it("changes frequency and updates monthly total", async () => {
    const user = userEvent.setup();
    render(<IncomeEntry />);

    // Change Salary ($5,500) from monthly to annually
    const salaryFreq = screen.getByTestId("frequency-i1");
    await user.selectOptions(salaryFreq, "annually");

    // Monthly total should be: $5,500/12 + $800 ≈ $1,258
    const totalEl = screen.getByTestId("income-monthly-total");
    const totalText = totalEl.textContent!;
    // $5500/12 = $458.33, + $800 = $1258.33 ≈ $1,258
    expect(totalText).toBe("$1,258");
  });

  it("shows frequency selector in the add new form", async () => {
    const user = userEvent.setup();
    render(<IncomeEntry />);
    await user.click(screen.getByText("+ Add Income"));
    expect(screen.getByTestId("new-income-frequency")).toBeInTheDocument();
  });

  it("adds new item with non-default frequency", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<IncomeEntry items={[]} onChange={onChange} />);

    await user.click(screen.getByText("+ Add Income"));
    await user.type(screen.getByLabelText("New income category"), "Dividends");
    await user.type(screen.getByLabelText("New income amount"), "1200");
    await user.selectOptions(screen.getByTestId("new-income-frequency"), "quarterly");
    await user.click(screen.getByLabelText("Confirm add income"));

    // Verify onChange was called with frequency
    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall[0].frequency).toBe("quarterly");
  });

  it("calls onChange when frequency changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const items = [{ id: "i1", category: "Salary", amount: 5500 }];
    render(<IncomeEntry items={items} onChange={onChange} />);

    const freq = screen.getByTestId("frequency-i1");
    await user.selectOptions(freq, "biweekly");

    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall[0].frequency).toBe("biweekly");
  });
});

describe("URL state roundtrip with frequency", () => {
  it("roundtrips income with frequency field", () => {
    const state: FinancialState = {
      assets: [],
      debts: [],
      income: [
        { id: "i1", category: "Salary", amount: 2500, frequency: "biweekly" as IncomeFrequency },
        { id: "i2", category: "Rent", amount: 1200, frequency: "monthly" as IncomeFrequency },
      ],
      expenses: [],

      properties: [],
    };

    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.income[0].frequency).toBe("biweekly");
    // Monthly frequency is omitted in compact form, should be undefined on restore
    expect(decoded!.income[1].frequency).toBeUndefined();
  });

  it("handles backward compatibility (no frequency field)", () => {
    const state: FinancialState = {
      assets: [],
      debts: [],
      income: [{ id: "i1", category: "Salary", amount: 5500 }],
      expenses: [],

      properties: [],
    };

    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.income[0].frequency).toBeUndefined();
    expect(decoded!.income[0].amount).toBe(5500);
  });
});

describe("computeTotals with frequency", () => {
  it("normalizes income to monthly in computeTotals", () => {
    const state: FinancialState = {
      assets: [],
      debts: [],
      income: [
        { id: "i1", category: "Salary", amount: 12000, frequency: "annually" as IncomeFrequency },
      ],
      expenses: [],

      properties: [],
    };

    const totals = computeTotals(state);
    expect(totals.monthlyIncome).toBeCloseTo(1000, 2);
  });

  it("computes correct total with mixed frequencies", () => {
    const state: FinancialState = {
      assets: [],
      debts: [],
      income: [
        { id: "i1", category: "Salary", amount: 2500, frequency: "biweekly" as IncomeFrequency },
        { id: "i2", category: "Freelance", amount: 800 }, // default monthly
        { id: "i3", category: "Dividends", amount: 3000, frequency: "quarterly" as IncomeFrequency },
      ],
      expenses: [],

      properties: [],
    };

    const totals = computeTotals(state);
    const expected = (2500 * 26 / 12) + 800 + (3000 / 3);
    expect(totals.monthlyIncome).toBeCloseTo(expected, 2);
  });
});
