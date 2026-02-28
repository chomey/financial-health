import { describe, it, expect } from "vitest";
import {
  applyModification,
  compareScenarios,
  EMPTY_MODIFICATION,
  type ScenarioModification,
} from "@/lib/scenario";
import type { FinancialState } from "@/lib/financial-state";

const baseState: FinancialState = {
  assets: [
    { id: "a1", category: "Savings", amount: 10000, surplusTarget: true },
    { id: "a2", category: "RRSP", amount: 50000, monthlyContribution: 500 },
  ],
  debts: [
    { id: "d1", category: "Car Loan", amount: 15000, interestRate: 6, monthlyPayment: 400 },
    { id: "d2", category: "Credit Card", amount: 5000, interestRate: 19.9, monthlyPayment: 200 },
  ],
  income: [{ id: "i1", category: "Salary", amount: 5000 }],
  expenses: [{ id: "e1", category: "Rent", amount: 1500 }],
  properties: [],
  stocks: [],
  country: "CA",
  jurisdiction: "ON",
};

describe("applyModification", () => {
  it("returns unmodified state with empty modification", () => {
    const result = applyModification(baseState, EMPTY_MODIFICATION);
    expect(result.debts).toHaveLength(2);
    expect(result.assets[1].monthlyContribution).toBe(500);
  });

  it("excludes debts by ID", () => {
    const mod: ScenarioModification = {
      ...EMPTY_MODIFICATION,
      excludedDebtIds: ["d1"],
    };
    const result = applyModification(baseState, mod);
    expect(result.debts).toHaveLength(1);
    expect(result.debts[0].id).toBe("d2");
  });

  it("excludes multiple debts", () => {
    const mod: ScenarioModification = {
      ...EMPTY_MODIFICATION,
      excludedDebtIds: ["d1", "d2"],
    };
    const result = applyModification(baseState, mod);
    expect(result.debts).toHaveLength(0);
  });

  it("overrides monthly contribution for specific asset", () => {
    const mod: ScenarioModification = {
      ...EMPTY_MODIFICATION,
      contributionOverrides: { a2: 1000 },
    };
    const result = applyModification(baseState, mod);
    expect(result.assets[1].monthlyContribution).toBe(1000);
    // Other asset unchanged
    expect(result.assets[0].amount).toBe(10000);
  });

  it("applies income adjustment to first income item", () => {
    const mod: ScenarioModification = {
      ...EMPTY_MODIFICATION,
      incomeAdjustment: 1000,
    };
    const result = applyModification(baseState, mod);
    expect(result.income[0].amount).toBe(6000);
  });

  it("applies negative income adjustment (floors at 0)", () => {
    const mod: ScenarioModification = {
      ...EMPTY_MODIFICATION,
      incomeAdjustment: -10000,
    };
    const result = applyModification(baseState, mod);
    expect(result.income[0].amount).toBe(0);
  });

  it("applies windfall to surplus target asset", () => {
    const mod: ScenarioModification = {
      ...EMPTY_MODIFICATION,
      windfall: 25000,
    };
    const result = applyModification(baseState, mod);
    // a1 is surplusTarget
    expect(result.assets[0].amount).toBe(35000);
    // a2 unchanged
    expect(result.assets[1].amount).toBe(50000);
  });

  it("applies windfall to first asset if no surplus target", () => {
    const stateNoTarget: FinancialState = {
      ...baseState,
      assets: [
        { id: "a1", category: "Savings", amount: 10000 },
        { id: "a2", category: "RRSP", amount: 50000 },
      ],
    };
    const mod: ScenarioModification = {
      ...EMPTY_MODIFICATION,
      windfall: 5000,
    };
    const result = applyModification(stateNoTarget, mod);
    expect(result.assets[0].amount).toBe(15000);
  });

  it("does not modify original state", () => {
    const mod: ScenarioModification = {
      ...EMPTY_MODIFICATION,
      excludedDebtIds: ["d1"],
      windfall: 10000,
    };
    applyModification(baseState, mod);
    expect(baseState.debts).toHaveLength(2);
    expect(baseState.assets[0].amount).toBe(10000);
  });
});

describe("compareScenarios", () => {
  it("returns null-like comparison when no modifications applied", () => {
    const result = compareScenarios(baseState, EMPTY_MODIFICATION, 10);
    // With no changes, deltas should be zero
    result.netWorthDeltas.forEach((d) => {
      expect(d.delta).toBe(0);
    });
  });

  it("removing a debt increases or maintains projected net worth", () => {
    // Use a large, slow-to-pay-off debt so the benefit is visible at year 5
    const stateWithBigDebt: FinancialState = {
      ...baseState,
      debts: [
        ...baseState.debts,
        { id: "d3", category: "Student Loan", amount: 80000, interestRate: 5, monthlyPayment: 500 },
      ],
    };
    const mod: ScenarioModification = {
      ...EMPTY_MODIFICATION,
      excludedDebtIds: ["d3"], // remove $80k student loan
    };
    const result = compareScenarios(stateWithBigDebt, mod, 10);
    // Removing a large debt should show improved net worth (saved interest)
    const year5 = result.netWorthDeltas.find((d) => d.year === 5);
    expect(year5).toBeDefined();
    // Delta should be positive — debt balance elimination saves interest
    expect(year5!.delta).toBeGreaterThan(0);
  });

  it("adding a windfall increases projected net worth", () => {
    const mod: ScenarioModification = {
      ...EMPTY_MODIFICATION,
      windfall: 50000,
    };
    const result = compareScenarios(baseState, mod, 10);
    const year5 = result.netWorthDeltas.find((d) => d.year === 5);
    expect(year5).toBeDefined();
    expect(year5!.delta).toBeGreaterThan(40000); // windfall + some growth
  });

  it("provides debt-free delta when applicable", () => {
    const mod: ScenarioModification = {
      ...EMPTY_MODIFICATION,
      excludedDebtIds: ["d1", "d2"], // remove all debts
    };
    const result = compareScenarios(baseState, mod, 10);
    // With all debts removed, scenario is immediately debt-free
    expect(result.consumerDebtFreeDeltaMonths).not.toBeNull();
    if (result.consumerDebtFreeDeltaMonths !== null) {
      expect(result.consumerDebtFreeDeltaMonths).toBeLessThanOrEqual(0);
    }
  });

  it("increasing income improves net worth projection", () => {
    const mod: ScenarioModification = {
      ...EMPTY_MODIFICATION,
      incomeAdjustment: 2000,
    };
    const result = compareScenarios(baseState, mod, 10);
    const year10 = result.netWorthDeltas.find((d) => d.year === 10);
    expect(year10).toBeDefined();
    expect(year10!.delta).toBeGreaterThan(0);
  });

  it("returns milestone deltas for years within range", () => {
    const result = compareScenarios(baseState, EMPTY_MODIFICATION, 10);
    const years = result.netWorthDeltas.map((d) => d.year);
    expect(years).toContain(5);
    expect(years).toContain(10);
    // Should NOT contain 20 or 30 when projecting 10 years
    expect(years).not.toContain(20);
    expect(years).not.toContain(30);
  });

  it("returns 20/30 year deltas when projecting 30 years", () => {
    const result = compareScenarios(baseState, EMPTY_MODIFICATION, 30);
    const years = result.netWorthDeltas.map((d) => d.year);
    expect(years).toContain(20);
    expect(years).toContain(30);
  });
});
