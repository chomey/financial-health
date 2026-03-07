import { describe, it, expect } from "vitest";
import { getNetWorthMilestone, getAgeGroup, generateInsights, type FinancialData } from "@/lib/insights";

describe("getNetWorthMilestone", () => {
  it("returns null for negative net worth", () => {
    expect(getNetWorthMilestone(-1)).toBeNull();
    expect(getNetWorthMilestone(-100000)).toBeNull();
  });

  it("returns $0 milestone at exactly zero (function level — caller guards netWorth > 0 for insight generation)", () => {
    const m = getNetWorthMilestone(0);
    expect(m).not.toBeNull();
    expect(m!.amount).toBe(0);
    expect(m!.message).toContain("crossed from negative to positive");
  });

  it("returns $0 milestone for small positive amounts below $1k", () => {
    const m = getNetWorthMilestone(500);
    expect(m!.amount).toBe(0);
  });

  it("returns $1k milestone at $1,000", () => {
    const m = getNetWorthMilestone(1000);
    expect(m!.amount).toBe(1_000);
    expect(m!.message).toContain("first $1,000");
  });

  it("returns $5k milestone at $7,500", () => {
    const m = getNetWorthMilestone(7500);
    expect(m!.amount).toBe(5_000);
    expect(m!.message).toContain("$5k");
  });

  it("returns $10k milestone at exactly $10,000", () => {
    const m = getNetWorthMilestone(10_000);
    expect(m!.amount).toBe(10_000);
    expect(m!.message).toContain("$10k");
  });

  it("returns $25k milestone at $30,000", () => {
    const m = getNetWorthMilestone(30_000);
    expect(m!.amount).toBe(25_000);
  });

  it("returns $50k milestone at $75,000", () => {
    const m = getNetWorthMilestone(75_000);
    expect(m!.amount).toBe(50_000);
    expect(m!.message).toContain("$50k");
  });

  it("returns $100k milestone at $150,000", () => {
    const m = getNetWorthMilestone(150_000);
    expect(m!.amount).toBe(100_000);
    expect(m!.message).toContain("$100k");
    expect(m!.message).toContain("Munger");
  });

  it("returns $250k milestone at $300,000", () => {
    const m = getNetWorthMilestone(300_000);
    expect(m!.amount).toBe(250_000);
    expect(m!.message).toContain("$250k");
  });

  it("returns $500k milestone at $600,000", () => {
    const m = getNetWorthMilestone(600_000);
    expect(m!.amount).toBe(500_000);
    expect(m!.message).toContain("$500k");
  });

  it("returns $1M milestone at $1,000,000", () => {
    const m = getNetWorthMilestone(1_000_000);
    expect(m!.amount).toBe(1_000_000);
    expect(m!.message).toContain("Millionaire");
  });

  it("returns $2M milestone at $3,000,000", () => {
    const m = getNetWorthMilestone(3_000_000);
    expect(m!.amount).toBe(2_000_000);
    expect(m!.message).toContain("$2M");
  });

  it("returns $5M milestone at $7,000,000", () => {
    const m = getNetWorthMilestone(7_000_000);
    expect(m!.amount).toBe(5_000_000);
    expect(m!.message).toContain("$5M");
  });

  it("returns $10M milestone at $15,000,000", () => {
    const m = getNetWorthMilestone(15_000_000);
    expect(m!.amount).toBe(10_000_000);
    expect(m!.message).toContain("$10M+");
  });
});

describe("getAgeGroup", () => {
  it("returns Under 35 for age 25", () => {
    const g = getAgeGroup(25);
    expect(g).not.toBeNull();
    expect(g!.label).toBe("Under 35");
    expect(g!.median).toBe(39_000);
  });

  it("returns Under 35 for age 34", () => {
    const g = getAgeGroup(34);
    expect(g!.label).toBe("Under 35");
  });

  it("returns 35–44 for age 35", () => {
    const g = getAgeGroup(35);
    expect(g!.label).toBe("35–44");
    expect(g!.median).toBe(135_000);
  });

  it("returns 35–44 for age 44", () => {
    const g = getAgeGroup(44);
    expect(g!.label).toBe("35–44");
  });

  it("returns 45–54 for age 50", () => {
    const g = getAgeGroup(50);
    expect(g!.label).toBe("45–54");
    expect(g!.median).toBe(247_000);
  });

  it("returns 55–64 for age 60", () => {
    const g = getAgeGroup(60);
    expect(g!.label).toBe("55–64");
    expect(g!.median).toBe(364_000);
  });

  it("returns 65–74 for age 70", () => {
    const g = getAgeGroup(70);
    expect(g!.label).toBe("65–74");
    expect(g!.median).toBe(410_000);
  });

  it("returns 75+ for age 80", () => {
    const g = getAgeGroup(80);
    expect(g!.label).toBe("75+");
    expect(g!.median).toBe(335_000);
  });
});

describe("net-worth-milestone insight generation", () => {
  const baseData: FinancialData = {
    totalAssets: 150_000,
    totalDebts: 0,
    monthlyIncome: 6000,
    monthlyExpenses: 3000,
  };

  it("generates milestone insight for positive net worth", () => {
    const insights = generateInsights(baseData);
    const milestone = insights.find((i) => i.type === "net-worth-milestone");
    expect(milestone).toBeDefined();
    expect(milestone!.icon).toBe("🏆");
    // 150k net worth → $100k milestone
    expect(milestone!.message).toContain("$100k");
  });

  it("does not generate milestone insight for negative net worth", () => {
    const data: FinancialData = { ...baseData, totalAssets: 5000, totalDebts: 100_000 };
    const insights = generateInsights(data);
    expect(insights.find((i) => i.type === "net-worth-milestone")).toBeUndefined();
  });

  it("does not generate milestone for exactly zero net worth", () => {
    const data: FinancialData = { ...baseData, totalAssets: 1000, totalDebts: 1000 };
    const insights = generateInsights(data);
    expect(insights.find((i) => i.type === "net-worth-milestone")).toBeUndefined();
  });

  it("generates $0 milestone for small positive net worth (crossing from negative)", () => {
    const data: FinancialData = { ...baseData, totalAssets: 100, totalDebts: 0 };
    const insights = generateInsights(data);
    const milestone = insights.find((i) => i.type === "net-worth-milestone");
    expect(milestone).toBeDefined();
    expect(milestone!.message).toContain("crossed from negative to positive");
  });

  it("generates $1M milestone for millionaire", () => {
    const data: FinancialData = { ...baseData, totalAssets: 1_200_000 };
    const insights = generateInsights(data);
    const milestone = insights.find((i) => i.type === "net-worth-milestone");
    expect(milestone).toBeDefined();
    expect(milestone!.message).toContain("Millionaire");
  });
});

describe("net-worth-percentile insight generation", () => {
  const baseData: FinancialData = {
    totalAssets: 150_000,
    totalDebts: 0,
    monthlyIncome: 6000,
    monthlyExpenses: 3000,
  };

  it("does not generate percentile insight without currentAge", () => {
    const insights = generateInsights(baseData);
    expect(insights.find((i) => i.type === "net-worth-percentile")).toBeUndefined();
  });

  it("generates 'above median' insight when net worth exceeds age group median", () => {
    // Age 30, Under 35 median = $39k, net worth = $150k (above)
    const data: FinancialData = { ...baseData, currentAge: 30 };
    const insights = generateInsights(data);
    const insight = insights.find((i) => i.type === "net-worth-percentile");
    expect(insight).toBeDefined();
    expect(insight!.id).toBe("net-worth-percentile-above");
    expect(insight!.message).toContain("above the median");
    expect(insight!.message).toContain("Under 35");
    expect(insight!.icon).toBe("📊");
  });

  it("generates 'below median' insight when net worth is below age group median", () => {
    // Age 50, 45–54 median = $247k, net worth = $50k (below)
    const data: FinancialData = { ...baseData, totalAssets: 50_000, currentAge: 50 };
    const insights = generateInsights(data);
    const insight = insights.find((i) => i.type === "net-worth-percentile");
    expect(insight).toBeDefined();
    expect(insight!.id).toBe("net-worth-percentile-below");
    expect(insight!.message).toContain("45–54");
    expect(insight!.message).toContain("every dollar saved");
  });

  it("generates insight for 65+ age group", () => {
    const data: FinancialData = { ...baseData, totalAssets: 500_000, currentAge: 70 };
    const insights = generateInsights(data);
    const insight = insights.find((i) => i.type === "net-worth-percentile");
    expect(insight).toBeDefined();
    expect(insight!.message).toContain("65–74");
  });

  it("generates insight for 75+ age group", () => {
    const data: FinancialData = { ...baseData, totalAssets: 500_000, currentAge: 80 };
    const insights = generateInsights(data);
    const insight = insights.find((i) => i.type === "net-worth-percentile");
    expect(insight).toBeDefined();
    expect(insight!.message).toContain("75+");
  });
});
