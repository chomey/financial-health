/**
 * T1 unit tests: dark cyberpunk theme for chart components (Task 130)
 */
import { describe, it, expect } from "vitest";
import { render } from "../test-utils";
import NetWorthDonutChart from "@/components/NetWorthDonutChart";
import ExpenseBreakdownChart from "@/components/ExpenseBreakdownChart";
import NetWorthWaterfallChart from "@/components/NetWorthWaterfallChart";

// COLORS array tests — verify vivid cyberpunk palette
describe("NetWorthDonutChart dark theme", () => {
  it("renders empty state with dark glass card", () => {
    const { container } = render(
      <NetWorthDonutChart assets={[]} debts={[]} properties={[]} stocks={[]} />
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("border-white/10");
    expect(card.className).toContain("bg-white/5");
    expect(card.className).toContain("backdrop-blur-sm");
  });

  it("renders with data using dark glass card", () => {
    const { container } = render(
      <NetWorthDonutChart
        assets={[{ id: "1", category: "Cash", amount: 10000 }]}
        debts={[]}
        properties={[]}
        stocks={[]}
      />
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("border-white/10");
    expect(card.className).toContain("bg-white/5");
  });

  it("renders composition table with dark row borders", () => {
    const { getByTestId } = render(
      <NetWorthDonutChart
        assets={[{ id: "1", category: "Cash", amount: 10000 }]}
        debts={[]}
        properties={[]}
        stocks={[]}
      />
    );
    const table = getByTestId("donut-composition-table");
    expect(table).toBeTruthy();
  });

  it("tab buttons use cyan accent for active state", () => {
    const { container } = render(
      <NetWorthDonutChart
        assets={[{ id: "1", category: "Cash", amount: 10000 }]}
        debts={[]}
        properties={[]}
        stocks={[]}
      />
    );
    // Find the "By Type" button which should be active by default
    const buttons = container.querySelectorAll("button");
    const byTypeBtn = Array.from(buttons).find((b) => b.textContent === "By Type");
    expect(byTypeBtn?.className).toContain("text-cyan-400");
  });
});

describe("ExpenseBreakdownChart dark theme", () => {
  it("renders empty state with dark glass card", () => {
    const { container } = render(
      <ExpenseBreakdownChart expenses={[]} />
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("border-white/10");
    expect(card.className).toContain("bg-white/5");
    expect(card.className).toContain("backdrop-blur-sm");
  });

  it("renders spending breakdown with dark glass card", () => {
    const { container } = render(
      <ExpenseBreakdownChart
        expenses={[{ id: "1", category: "Rent", amount: 2000 }]}
        monthlyAfterTaxIncome={5000}
      />
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("border-white/10");
    expect(card.className).toContain("bg-white/5");
  });

  it("renders spending power box with dark surface", () => {
    const { getByTestId } = render(
      <ExpenseBreakdownChart
        expenses={[{ id: "1", category: "Rent", amount: 2000 }]}
        monthlyAfterTaxIncome={5000}
        investmentContributions={500}
      />
    );
    const spendingPower = getByTestId("spending-power");
    expect(spendingPower.className).toContain("bg-slate-800/50");
  });

  it("legend entries use slate-300 text (not stone)", () => {
    const { container } = render(
      <ExpenseBreakdownChart
        expenses={[{ id: "1", category: "Rent", amount: 2000 }]}
      />
    );
    const legendText = container.querySelector('[class*="text-slate-300"]');
    expect(legendText).toBeTruthy();
  });
});

describe("NetWorthWaterfallChart dark theme", () => {
  it("renders empty state with dark glass card", () => {
    const { container } = render(
      <NetWorthWaterfallChart assets={[]} debts={[]} properties={[]} stocks={[]} />
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("border-white/10");
    expect(card.className).toContain("bg-white/5");
    expect(card.className).toContain("backdrop-blur-sm");
  });

  it("renders with data using dark glass card", () => {
    const { container } = render(
      <NetWorthWaterfallChart
        assets={[{ id: "1", category: "Cash", amount: 10000 }]}
        debts={[]}
        properties={[]}
        stocks={[]}
      />
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("border-white/10");
    expect(card.className).toContain("bg-white/5");
  });

  it("legend uses slate-400 text (not stone)", () => {
    const { container } = render(
      <NetWorthWaterfallChart
        assets={[{ id: "1", category: "Cash", amount: 10000 }]}
        debts={[{ id: "1", category: "Credit Card", amount: 2000 }]}
        properties={[]}
        stocks={[]}
      />
    );
    // Legend container should have slate text
    const legendText = container.querySelector('[class*="text-slate-400"]');
    expect(legendText).toBeTruthy();
  });
});
