import { describe, it, expect } from "vitest";
import { computeExpenseBreakdown } from "@/components/ExpenseBreakdownChart";
import type { ExpenseItem } from "@/components/ExpenseEntry";

describe("computeExpenseBreakdown", () => {
  it("returns empty array when no expenses", () => {
    const result = computeExpenseBreakdown([], 0, 0, 0, 0);
    expect(result).toEqual([]);
  });

  it("includes manual expense items", () => {
    const expenses: ExpenseItem[] = [
      { id: "e1", category: "Rent", amount: 1800 },
      { id: "e2", category: "Groceries", amount: 600 },
    ];
    const result = computeExpenseBreakdown(expenses, 0, 0, 0, 0);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Rent");
    expect(result[0].value).toBe(1800);
    expect(result[0].isAuto).toBe(false);
    expect(result[1].name).toBe("Groceries");
    expect(result[1].value).toBe(600);
  });

  it("skips zero-amount expenses", () => {
    const expenses: ExpenseItem[] = [
      { id: "e1", category: "Rent", amount: 1800 },
      { id: "e2", category: "Empty", amount: 0 },
    ];
    const result = computeExpenseBreakdown(expenses, 0, 0, 0, 0);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Rent");
  });

  it("adds auto-generated investment contributions", () => {
    const expenses: ExpenseItem[] = [
      { id: "e1", category: "Rent", amount: 1000 },
    ];
    const result = computeExpenseBreakdown(expenses, 500, 0, 0, 0);
    expect(result).toHaveLength(2);
    const autoSlice = result.find((s) => s.name === "Investment Contributions");
    expect(autoSlice).toBeDefined();
    expect(autoSlice!.value).toBe(500);
    expect(autoSlice!.isAuto).toBe(true);
  });

  it("adds auto-generated mortgage payments", () => {
    const result = computeExpenseBreakdown([], 0, 1200, 0, 0);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Mortgage Payments");
    expect(result[0].isAuto).toBe(true);
  });

  it("adds combined taxes as auto-generated", () => {
    const result = computeExpenseBreakdown([], 0, 0, 400, 200);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Taxes");
    expect(result[0].value).toBe(600);
    expect(result[0].isAuto).toBe(true);
  });

  it("sorts slices largest to smallest", () => {
    const expenses: ExpenseItem[] = [
      { id: "e1", category: "Small", amount: 100 },
      { id: "e2", category: "Large", amount: 2000 },
      { id: "e3", category: "Medium", amount: 500 },
    ];
    const result = computeExpenseBreakdown(expenses, 0, 0, 0, 0);
    expect(result[0].name).toBe("Large");
    expect(result[1].name).toBe("Medium");
    expect(result[2].name).toBe("Small");
  });

  it("computes correct percentages", () => {
    const expenses: ExpenseItem[] = [
      { id: "e1", category: "A", amount: 750 },
      { id: "e2", category: "B", amount: 250 },
    ];
    const result = computeExpenseBreakdown(expenses, 0, 0, 0, 0);
    expect(result[0].percentage).toBeCloseTo(75);
    expect(result[1].percentage).toBeCloseTo(25);
  });

  it("includes all auto categories together with manual", () => {
    const expenses: ExpenseItem[] = [
      { id: "e1", category: "Rent", amount: 1800 },
    ];
    const result = computeExpenseBreakdown(expenses, 500, 1200, 300, 100);
    expect(result).toHaveLength(4); // Rent + Contributions + Mortgage + Taxes
    const total = result.reduce((s, r) => s + r.value, 0);
    expect(total).toBe(1800 + 500 + 1200 + 400);
  });
});
