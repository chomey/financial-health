import { describe, it, expect } from "vitest";
import { computeMetrics, type FinancialState } from "@/lib/financial-state";

describe("RunwayExplainerDetails contains withdrawal tax data", () => {
  const baseState: FinancialState = {
    assets: [
      { id: "a1", category: "TFSA", amount: 20000 },
      { id: "a2", category: "RRSP", amount: 30000 },
      { id: "a3", category: "Brokerage", amount: 10000 },
    ],
    debts: [],
    income: [{ id: "i1", category: "Salary", amount: 5000 }],
    expenses: [{ id: "e1", category: "Rent", amount: 2000 }],
    properties: [],
    stocks: [],
    country: "CA",
    jurisdiction: "ON",
  };

  it("runwayDetails includes withdrawalOrder with taxTreatment for each entry", () => {
    const metrics = computeMetrics(baseState);
    const runway = metrics.find((m) => m.title === "Financial Runway");
    expect(runway?.runwayDetails).toBeDefined();
    const order = runway!.runwayDetails!.withdrawalOrder;
    expect(order.length).toBe(3);
    for (const entry of order) {
      expect(entry.taxTreatment).toBeDefined();
      expect(["tax-free", "taxable", "tax-deferred"]).toContain(entry.taxTreatment);
      expect(entry.startingBalance).toBeGreaterThan(0);
      expect(entry.category).toBeTruthy();
    }
  });

  it("runwayDetails includes taxDragMonths", () => {
    const metrics = computeMetrics(baseState);
    const runway = metrics.find((m) => m.title === "Financial Runway");
    expect(runway?.runwayDetails?.taxDragMonths).toBeDefined();
    expect(typeof runway!.runwayDetails!.taxDragMonths).toBe("number");
  });

  it("runwayAfterTax is set on the metric when there are taxable/deferred accounts", () => {
    const metrics = computeMetrics(baseState);
    const runway = metrics.find((m) => m.title === "Financial Runway");
    expect(runway?.runwayAfterTax).toBeDefined();
    expect(typeof runway!.runwayAfterTax).toBe("number");
  });

  it("withdrawal order entries can be grouped by treatment to derive accountsByTreatment", () => {
    const metrics = computeMetrics(baseState);
    const order = metrics.find((m) => m.title === "Financial Runway")!.runwayDetails!.withdrawalOrder;

    // Group like WithdrawalTaxSummary used to
    const grouped: Record<string, { categories: string[]; total: number }> = {
      "tax-free": { categories: [], total: 0 },
      "taxable": { categories: [], total: 0 },
      "tax-deferred": { categories: [], total: 0 },
    };
    for (const entry of order) {
      const g = grouped[entry.taxTreatment];
      if (g) {
        g.categories.push(entry.category);
        g.total += entry.startingBalance;
      }
    }

    expect(grouped["tax-free"].categories).toContain("TFSA");
    expect(grouped["tax-free"].total).toBe(20000);
    expect(grouped["tax-deferred"].categories).toContain("RRSP");
    expect(grouped["tax-deferred"].total).toBe(30000);
    expect(grouped["taxable"].categories).toContain("Brokerage");
    expect(grouped["taxable"].total).toBe(10000);
  });
});
