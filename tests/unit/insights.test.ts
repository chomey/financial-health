import { describe, it, expect } from "vitest";
import { generateInsights, type FinancialData } from "@/lib/insights";

const mockData: FinancialData = {
  totalAssets: 65500,
  totalDebts: 295000,
  monthlyIncome: 6300,
  monthlyExpenses: 2950,
};

describe("generateInsights", () => {
  it("returns an array of insights", () => {
    const insights = generateInsights(mockData);
    expect(Array.isArray(insights)).toBe(true);
    expect(insights.length).toBeGreaterThan(0);
  });

  it("generates 3-5 insights for mock data", () => {
    const insights = generateInsights(mockData);
    expect(insights.length).toBeGreaterThanOrEqual(3);
    expect(insights.length).toBeLessThanOrEqual(5);
  });

  it("each insight has required fields", () => {
    const insights = generateInsights(mockData);
    for (const insight of insights) {
      expect(insight.id).toBeTruthy();
      expect(insight.type).toBeTruthy();
      expect(insight.message).toBeTruthy();
      expect(insight.icon).toBeTruthy();
    }
  });

  it("generates a strong runway insight for 22+ months", () => {
    const insights = generateInsights(mockData);
    const runway = insights.find((i) => i.type === "runway");
    expect(runway).toBeDefined();
    expect(runway!.message).toContain("22 months");
    expect(runway!.message).toContain("strong safety net");
    expect(runway!.icon).toBe("🛡️");
  });

  it("generates a solid runway insight for 3-11 months", () => {
    const data: FinancialData = {
      ...mockData,
      totalAssets: 15000,
      monthlyExpenses: 3000,
    };
    const insights = generateInsights(data);
    const runway = insights.find((i) => i.type === "runway");
    expect(runway).toBeDefined();
    expect(runway!.message).toContain("solid buffer");
  });

  it("generates a building runway insight for 1-2 months", () => {
    const data: FinancialData = {
      ...mockData,
      totalAssets: 5000,
      monthlyExpenses: 3000,
    };
    const insights = generateInsights(data);
    const runway = insights.find((i) => i.type === "runway");
    expect(runway).toBeDefined();
    expect(runway!.message).toContain("strengthens your safety net");
  });

  it("generates a positive surplus insight", () => {
    const insights = generateInsights(mockData);
    const surplus = insights.find((i) => i.type === "surplus");
    expect(surplus).toBeDefined();
    expect(surplus!.message).toContain("$3,350");
    expect(surplus!.message).toContain("building your future");
    expect(surplus!.icon).toBe("📈");
  });

  it("generates a balanced surplus insight when income equals expenses", () => {
    const data: FinancialData = {
      ...mockData,
      monthlyIncome: 3000,
      monthlyExpenses: 3000,
    };
    const insights = generateInsights(data);
    const surplus = insights.find((i) => i.type === "surplus");
    expect(surplus).toBeDefined();
    expect(surplus!.message).toContain("breaking even");
  });

  it("generates no surplus insight when deficit exists", () => {
    const data: FinancialData = {
      ...mockData,
      monthlyIncome: 2000,
      monthlyExpenses: 3000,
    };
    const insights = generateInsights(data);
    const surplus = insights.find((i) => i.type === "surplus");
    expect(surplus).toBeUndefined();
  });

  it("generates a savings rate insight for 53% rate", () => {
    const insights = generateInsights(mockData);
    const rate = insights.find((i) => i.type === "savings-rate");
    expect(rate).toBeDefined();
    expect(rate!.message).toContain("53%");
    expect(rate!.message).toContain("excellent");
    expect(rate!.icon).toBe("⭐");
  });

  it("generates a good savings rate insight for 10-19%", () => {
    const data: FinancialData = {
      ...mockData,
      monthlyIncome: 3000,
      monthlyExpenses: 2550,
    };
    const insights = generateInsights(data);
    const rate = insights.find((i) => i.type === "savings-rate");
    expect(rate).toBeDefined();
    expect(rate!.message).toContain("healthy habit");
  });

  it("generates a net worth insight when debts exceed assets", () => {
    const insights = generateInsights(mockData);
    const nw = insights.find((i) => i.type === "net-worth");
    expect(nw).toBeDefined();
    expect(nw!.message).toContain("common with mortgages");
    expect(nw!.icon).toBe("💰");
  });

  it("generates a positive net worth insight when assets exceed debts", () => {
    const data: FinancialData = {
      ...mockData,
      totalAssets: 500000,
      totalDebts: 200000,
    };
    const insights = generateInsights(data);
    const nw = insights.find((i) => i.type === "net-worth");
    expect(nw).toBeDefined();
    expect(nw!.message).toContain("$300,000");
    expect(nw!.message).toContain("positive");
  });

  it("returns empty array when all values are zero", () => {
    const data: FinancialData = {
      totalAssets: 0,
      totalDebts: 0,
      monthlyIncome: 0,
      monthlyExpenses: 0,
    };
    const insights = generateInsights(data);
    expect(insights).toEqual([]);
  });

  it("assigns unique ids to all insights", () => {
    const insights = generateInsights(mockData);
    const ids = insights.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
