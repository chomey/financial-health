import { describe, it, expect } from "vitest";
import { buildSankeyData, SANKEY_COLORS, type CashFlowInput } from "@/lib/sankey-data";

function makeInput(overrides: Partial<CashFlowInput> = {}): CashFlowInput {
  return {
    income: [{ id: "i1", category: "Salary", amount: 5000 }],
    expenses: [
      { id: "e1", category: "Rent", amount: 1800 },
      { id: "e2", category: "Groceries", amount: 500 },
    ],
    investmentContributions: 500,
    mortgagePayments: 0,
    monthlyFederalTax: 400,
    monthlyProvincialTax: 200,
    monthlySurplus: 1600,
    ...overrides,
  };
}

describe("buildSankeyData", () => {
  it("returns empty data with no income", () => {
    const result = buildSankeyData(makeInput({ income: [] }));
    expect(result.nodes).toHaveLength(0);
    expect(result.links).toHaveLength(0);
  });

  it("returns empty data with zero-amount income", () => {
    const result = buildSankeyData(
      makeInput({ income: [{ id: "i1", category: "Salary", amount: 0 }] })
    );
    expect(result.nodes).toHaveLength(0);
  });

  it("creates income nodes for each income source", () => {
    const result = buildSankeyData(
      makeInput({
        income: [
          { id: "i1", category: "Salary", amount: 4000 },
          { id: "i2", category: "Freelance", amount: 1000 },
        ],
      })
    );
    const incomeNodes = result.nodes.filter((n) => n.type === "income");
    expect(incomeNodes).toHaveLength(2);
    expect(incomeNodes[0].label).toBe("Salary");
    expect(incomeNodes[1].label).toBe("Freelance");
  });

  it("creates tax node when taxes are positive", () => {
    const result = buildSankeyData(makeInput());
    const taxNode = result.nodes.find((n) => n.id === "taxes");
    expect(taxNode).toBeDefined();
    expect(taxNode!.value).toBe(600); // 400 + 200
    expect(taxNode!.type).toBe("tax");
  });

  it("omits tax node when taxes are zero", () => {
    const result = buildSankeyData(
      makeInput({ monthlyFederalTax: 0, monthlyProvincialTax: 0 })
    );
    expect(result.nodes.find((n) => n.id === "taxes")).toBeUndefined();
  });

  it("creates after-tax income pool node", () => {
    const result = buildSankeyData(makeInput());
    const pool = result.nodes.find((n) => n.id === "after-tax");
    expect(pool).toBeDefined();
    expect(pool!.type).toBe("pool");
    expect(pool!.value).toBe(5000 - 600); // gross - tax
  });

  it("creates expense nodes for each expense", () => {
    const result = buildSankeyData(makeInput());
    const expenseNodes = result.nodes.filter((n) => n.type === "expense");
    expect(expenseNodes).toHaveLength(2);
    expect(expenseNodes[0].label).toBe("Rent");
    expect(expenseNodes[1].label).toBe("Groceries");
  });

  it("creates investment node when contributions > 0", () => {
    const result = buildSankeyData(makeInput({ investmentContributions: 500 }));
    const inv = result.nodes.find((n) => n.id === "investments");
    expect(inv).toBeDefined();
    expect(inv!.type).toBe("investment");
  });

  it("skips investment node when contributions are 0", () => {
    const result = buildSankeyData(makeInput({ investmentContributions: 0 }));
    expect(result.nodes.find((n) => n.id === "investments")).toBeUndefined();
  });

  it("creates mortgage node when payments > 0", () => {
    const result = buildSankeyData(makeInput({ mortgagePayments: 1200 }));
    const node = result.nodes.find((n) => n.id === "mortgage");
    expect(node).toBeDefined();
    expect(node!.type).toBe("debt");
  });

  it("creates surplus node for remaining after-tax income", () => {
    const result = buildSankeyData(makeInput());
    const surplus = result.nodes.find((n) => n.id === "surplus");
    expect(surplus).toBeDefined();
    expect(surplus!.type).toBe("surplus");
    // after-tax: 5000-600=4400; expenses: 1800+500=2300; investments: 500; surplus: 1600
    expect(surplus!.value).toBe(4400 - 2300 - 500);
  });

  it("links income sources to taxes proportionally", () => {
    const result = buildSankeyData(
      makeInput({
        income: [
          { id: "i1", category: "Salary", amount: 4000 },
          { id: "i2", category: "Freelance", amount: 1000 },
        ],
        monthlyFederalTax: 500,
        monthlyProvincialTax: 0,
      })
    );
    const taxLinks = result.links.filter((l) => l.target === "taxes");
    expect(taxLinks).toHaveLength(2);
    // Salary is 80% of income → 80% of tax
    expect(taxLinks[0].value).toBe(400);
    // Freelance is 20% → 20% of tax
    expect(taxLinks[1].value).toBe(100);
  });

  it("links after-tax pool to all destination nodes", () => {
    const result = buildSankeyData(makeInput());
    const poolLinks = result.links.filter((l) => l.source === "after-tax");
    // Rent, Groceries, Investments, Surplus
    expect(poolLinks.length).toBeGreaterThanOrEqual(3);
  });

  it("normalizes weekly income to monthly", () => {
    const result = buildSankeyData(
      makeInput({
        income: [{ id: "i1", category: "Weekly Job", amount: 1000, frequency: "weekly" }],
        monthlyFederalTax: 0,
        monthlyProvincialTax: 0,
        expenses: [],
        investmentContributions: 0,
      })
    );
    const incomeNode = result.nodes.find((n) => n.id === "income-i1");
    // weekly: 1000 * 52/12 ≈ 4333.33
    expect(incomeNode!.value).toBeCloseTo(4333.33, 0);
  });

  it("filters out zero-amount expenses", () => {
    const result = buildSankeyData(
      makeInput({
        expenses: [
          { id: "e1", category: "Rent", amount: 1800 },
          { id: "e2", category: "None", amount: 0 },
        ],
      })
    );
    const expenseNodes = result.nodes.filter((n) => n.type === "expense");
    expect(expenseNodes).toHaveLength(1);
    expect(expenseNodes[0].label).toBe("Rent");
  });
});

describe("SANKEY_COLORS", () => {
  it("has colors for all node types", () => {
    const types = ["income", "tax", "pool", "expense", "investment", "debt", "surplus"];
    for (const type of types) {
      expect(SANKEY_COLORS[type]).toBeDefined();
      expect(SANKEY_COLORS[type]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
