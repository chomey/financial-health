import { describe, it, expect } from "vitest";
import { buildSankeyData, SANKEY_COLORS, type CashFlowInput } from "@/lib/sankey-data";

function makeInput(overrides: Partial<CashFlowInput> = {}): CashFlowInput {
  return {
    income: [{ id: "i1", category: "Salary", amount: 5000 }],
    expenses: [{ id: "e1", category: "Rent", amount: 1800 }],
    investmentContributions: 500,
    mortgagePayments: 0,
    monthlyFederalTax: 400,
    monthlyProvincialTax: 200,
    monthlySurplus: 0,
    ...overrides,
  };
}

describe("buildSankeyData — investment returns", () => {
  it("creates investment-income nodes for each investment return", () => {
    const result = buildSankeyData(
      makeInput({
        investmentReturns: [
          { label: "Savings Account", monthlyAmount: 50 },
          { label: "GIC", monthlyAmount: 30 },
        ],
      })
    );
    const invIncomeNodes = result.nodes.filter((n) => n.type === "investment-income");
    expect(invIncomeNodes).toHaveLength(2);
    expect(invIncomeNodes[0].label).toBe("Savings Account");
    expect(invIncomeNodes[0].value).toBe(50);
    expect(invIncomeNodes[1].label).toBe("GIC");
    expect(invIncomeNodes[1].value).toBe(30);
  });

  it("includes investment returns in total gross income", () => {
    const result = buildSankeyData(
      makeInput({
        investmentReturns: [{ label: "Savings", monthlyAmount: 100 }],
        monthlyFederalTax: 0,
        monthlyProvincialTax: 0,
        expenses: [],
        investmentContributions: 0,
      })
    );
    const pool = result.nodes.find((n) => n.id === "after-tax");
    // Salary (5000) + investment returns (100) = 5100
    expect(pool!.value).toBe(5100);
  });

  it("links investment return nodes to taxes proportionally", () => {
    const result = buildSankeyData(
      makeInput({
        income: [{ id: "i1", category: "Salary", amount: 4000 }],
        investmentReturns: [{ label: "Savings", monthlyAmount: 1000 }],
        monthlyFederalTax: 500,
        monthlyProvincialTax: 0,
      })
    );
    // Investment return is 1000 / 5000 = 20% of total income, so 20% of $500 tax = $100
    const invReturnTaxLink = result.links.find(
      (l) => l.source === "inv-return-0" && l.target === "taxes"
    );
    expect(invReturnTaxLink).toBeDefined();
    expect(invReturnTaxLink!.value).toBe(100);
  });

  it("links investment return nodes to after-tax pool", () => {
    const result = buildSankeyData(
      makeInput({
        income: [{ id: "i1", category: "Salary", amount: 4000 }],
        investmentReturns: [{ label: "Savings", monthlyAmount: 1000 }],
        monthlyFederalTax: 500,
        monthlyProvincialTax: 0,
      })
    );
    const invReturnPoolLink = result.links.find(
      (l) => l.source === "inv-return-0" && l.target === "after-tax"
    );
    expect(invReturnPoolLink).toBeDefined();
    // 1000 - 100 (tax portion) = 900
    expect(invReturnPoolLink!.value).toBe(900);
  });

  it("links investment return directly to after-tax when no taxes", () => {
    const result = buildSankeyData(
      makeInput({
        investmentReturns: [{ label: "Savings", monthlyAmount: 200 }],
        monthlyFederalTax: 0,
        monthlyProvincialTax: 0,
      })
    );
    const invReturnLinks = result.links.filter((l) => l.source === "inv-return-0");
    expect(invReturnLinks).toHaveLength(1);
    expect(invReturnLinks[0].target).toBe("after-tax");
    expect(invReturnLinks[0].value).toBe(200);
  });

  it("filters out zero-amount investment returns", () => {
    const result = buildSankeyData(
      makeInput({
        investmentReturns: [
          { label: "Savings", monthlyAmount: 50 },
          { label: "Empty", monthlyAmount: 0 },
        ],
      })
    );
    const invIncomeNodes = result.nodes.filter((n) => n.type === "investment-income");
    expect(invIncomeNodes).toHaveLength(1);
  });

  it("works with no investmentReturns field (backward compat)", () => {
    const result = buildSankeyData(makeInput());
    const invIncomeNodes = result.nodes.filter((n) => n.type === "investment-income");
    expect(invIncomeNodes).toHaveLength(0);
    // Should still have regular nodes
    expect(result.nodes.length).toBeGreaterThan(0);
  });

  it("produces non-empty data with only investment returns and no employment income", () => {
    const result = buildSankeyData(
      makeInput({
        income: [],
        investmentReturns: [{ label: "Savings", monthlyAmount: 100 }],
        monthlyFederalTax: 0,
        monthlyProvincialTax: 0,
        expenses: [],
        investmentContributions: 0,
      })
    );
    expect(result.nodes.length).toBeGreaterThan(0);
    const pool = result.nodes.find((n) => n.id === "after-tax");
    expect(pool!.value).toBe(100);
  });
});

describe("SANKEY_COLORS — investment-income", () => {
  it("has a teal color for investment-income type", () => {
    expect(SANKEY_COLORS["investment-income"]).toBeDefined();
    expect(SANKEY_COLORS["investment-income"]).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("investment-income color is distinct from regular income", () => {
    expect(SANKEY_COLORS["investment-income"]).not.toBe(SANKEY_COLORS.income);
  });
});
