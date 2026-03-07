import { describe, it, expect } from "vitest";
import {
  applyModification,
  compareScenarios,
  EMPTY_MODIFICATION,
  isTaxSheltered,
  getMonthlyLimit,
  TAX_SHELTERED_LIMITS,
  applyPreset,
  type ScenarioModification,
} from "@/lib/scenario";
import type { FinancialState } from "@/lib/financial-state";

const baseState: FinancialState = {
  assets: [
    { id: "a1", category: "Savings", amount: 50000, roi: 2, surplusTarget: true },
    { id: "a2", category: "RRSP", amount: 80000, roi: 5, monthlyContribution: 300 },
    { id: "a3", category: "TFSA", amount: 30000, roi: 5, monthlyContribution: 200 },
  ],
  debts: [
    { id: "d1", category: "Car Loan", amount: 15000, interestRate: 6, monthlyPayment: 400 },
  ],
  income: [{ id: "i1", category: "Salary", amount: 6000 }],
  expenses: [{ id: "e1", category: "Rent", amount: 1800 }],
  properties: [
    { id: "p1", name: "Home", value: 500000, mortgage: 300000, interestRate: 5, monthlyPayment: 2000 },
  ],
  stocks: [],
  country: "CA",
  jurisdiction: "ON",
};

describe("isTaxSheltered", () => {
  it("identifies Canadian tax-sheltered accounts", () => {
    expect(isTaxSheltered("TFSA")).toBe(true);
    expect(isTaxSheltered("RRSP")).toBe(true);
    expect(isTaxSheltered("RESP")).toBe(true);
    expect(isTaxSheltered("FHSA")).toBe(true);
  });

  it("identifies US tax-sheltered accounts", () => {
    expect(isTaxSheltered("401k")).toBe(true);
    expect(isTaxSheltered("Roth IRA")).toBe(true);
    expect(isTaxSheltered("IRA")).toBe(true);
    expect(isTaxSheltered("HSA")).toBe(true);
    expect(isTaxSheltered("529")).toBe(true);
  });

  it("returns false for non-tax-sheltered accounts", () => {
    expect(isTaxSheltered("Savings")).toBe(false);
    expect(isTaxSheltered("Checking")).toBe(false);
    expect(isTaxSheltered("Brokerage")).toBe(false);
  });
});

describe("getMonthlyLimit", () => {
  it("returns correct monthly limit for TFSA", () => {
    expect(getMonthlyLimit("TFSA")).toBeCloseTo(7000 / 12, 1);
  });

  it("returns correct monthly limit for 401k", () => {
    expect(getMonthlyLimit("401k")).toBeCloseTo(23500 / 12, 1);
  });

  it("returns 0 for non-tax-sheltered accounts", () => {
    expect(getMonthlyLimit("Savings")).toBe(0);
  });
});

describe("TAX_SHELTERED_LIMITS", () => {
  it("has correct country assignments", () => {
    expect(TAX_SHELTERED_LIMITS["TFSA"].country).toBe("CA");
    expect(TAX_SHELTERED_LIMITS["401k"].country).toBe("US");
    expect(TAX_SHELTERED_LIMITS["Roth IRA"].country).toBe("US");
    expect(TAX_SHELTERED_LIMITS["RRSP"].country).toBe("CA");
  });
});

describe("applyModification — retireToday", () => {
  it("zeros all income when retireToday is true", () => {
    const mod: ScenarioModification = { ...EMPTY_MODIFICATION, retireToday: true };
    const result = applyModification(baseState, mod);
    expect(result.income.every((i) => i.amount === 0)).toBe(true);
  });

  it("preserves income items (just zeros amounts)", () => {
    const stateMultiIncome: FinancialState = {
      ...baseState,
      income: [
        { id: "i1", category: "Salary", amount: 6000 },
        { id: "i2", category: "Side Job", amount: 1000 },
      ],
    };
    const mod: ScenarioModification = { ...EMPTY_MODIFICATION, retireToday: true };
    const result = applyModification(stateMultiIncome, mod);
    expect(result.income).toHaveLength(2);
    expect(result.income[0].amount).toBe(0);
    expect(result.income[1].amount).toBe(0);
    expect(result.income[0].category).toBe("Salary");
  });

  it("does not modify income when retireToday is false", () => {
    const mod: ScenarioModification = { ...EMPTY_MODIFICATION, retireToday: false };
    const result = applyModification(baseState, mod);
    expect(result.income[0].amount).toBe(6000);
  });
});

describe("applyModification — maxTaxSheltered", () => {
  it("increases contributions to annual limits for tax-sheltered accounts", () => {
    const mod: ScenarioModification = { ...EMPTY_MODIFICATION, maxTaxSheltered: true };
    const result = applyModification(baseState, mod);
    const rrsp = result.assets.find((a) => a.category === "RRSP");
    const tfsa = result.assets.find((a) => a.category === "TFSA");
    expect(rrsp!.monthlyContribution).toBeCloseTo(31560 / 12, 1);
    expect(tfsa!.monthlyContribution).toBeCloseTo(7000 / 12, 1);
  });

  it("does not decrease contributions already at or above the limit", () => {
    const stateMaxed: FinancialState = {
      ...baseState,
      assets: [
        { id: "a1", category: "Savings", amount: 50000, roi: 2 },
        { id: "a2", category: "TFSA", amount: 30000, roi: 5, monthlyContribution: 1000 },
      ],
    };
    const mod: ScenarioModification = { ...EMPTY_MODIFICATION, maxTaxSheltered: true };
    const result = applyModification(stateMaxed, mod);
    const tfsa = result.assets.find((a) => a.category === "TFSA");
    // Monthly limit for TFSA is ~583, but current is 1000 so keep higher
    expect(tfsa!.monthlyContribution).toBe(1000);
  });

  it("does not affect non-tax-sheltered accounts", () => {
    const mod: ScenarioModification = { ...EMPTY_MODIFICATION, maxTaxSheltered: true };
    const result = applyModification(baseState, mod);
    const savings = result.assets.find((a) => a.category === "Savings");
    expect(savings!.monthlyContribution).toBeUndefined();
  });
});

describe("applyModification — housingDownsizePercent", () => {
  it("reduces property values and mortgages proportionally", () => {
    const mod: ScenarioModification = { ...EMPTY_MODIFICATION, housingDownsizePercent: 20 };
    const result = applyModification(baseState, mod);
    expect(result.properties[0].value).toBe(400000);
    expect(result.properties[0].mortgage).toBe(240000);
  });

  it("reduces monthly payment proportionally", () => {
    const mod: ScenarioModification = { ...EMPTY_MODIFICATION, housingDownsizePercent: 50 };
    const result = applyModification(baseState, mod);
    expect(result.properties[0].monthlyPayment).toBe(1000);
  });

  it("adds released equity to surplus target asset", () => {
    // Original equity: 500000 - 300000 = 200000
    // After 20% downsize: 400000 - 240000 = 160000
    // Released equity: 200000 - 160000 = 40000
    const mod: ScenarioModification = { ...EMPTY_MODIFICATION, housingDownsizePercent: 20 };
    const result = applyModification(baseState, mod);
    const savings = result.assets.find((a) => a.id === "a1");
    expect(savings!.amount).toBe(50000 + 40000);
  });

  it("does nothing when set to 0%", () => {
    const mod: ScenarioModification = { ...EMPTY_MODIFICATION, housingDownsizePercent: 0 };
    const result = applyModification(baseState, mod);
    expect(result.properties[0].value).toBe(500000);
    expect(result.assets[0].amount).toBe(50000);
  });

  it("handles state without properties", () => {
    const stateNoProps: FinancialState = { ...baseState, properties: [] };
    const mod: ScenarioModification = { ...EMPTY_MODIFICATION, housingDownsizePercent: 30 };
    const result = applyModification(stateNoProps, mod);
    expect(result.properties).toHaveLength(0);
    expect(result.assets[0].amount).toBe(50000);
  });
});

describe("applyModification — roiAdjustment", () => {
  it("adjusts ROI by the specified amount", () => {
    const mod: ScenarioModification = { ...EMPTY_MODIFICATION, roiAdjustment: -2 };
    const result = applyModification(baseState, mod);
    expect(result.assets[0].roi).toBe(0); // 2 - 2 = 0
    expect(result.assets[1].roi).toBe(3); // 5 - 2 = 3
    expect(result.assets[2].roi).toBe(3); // 5 - 2 = 3
  });

  it("floors ROI at 0", () => {
    const mod: ScenarioModification = { ...EMPTY_MODIFICATION, roiAdjustment: -10 };
    const result = applyModification(baseState, mod);
    expect(result.assets[0].roi).toBe(0);
    expect(result.assets[1].roi).toBe(0);
  });

  it("increases ROI with positive adjustment", () => {
    const mod: ScenarioModification = { ...EMPTY_MODIFICATION, roiAdjustment: 3 };
    const result = applyModification(baseState, mod);
    expect(result.assets[0].roi).toBe(5); // 2 + 3
    expect(result.assets[1].roi).toBe(8); // 5 + 3
  });

  it("skips assets without explicit ROI", () => {
    const stateNoRoi: FinancialState = {
      ...baseState,
      assets: [
        { id: "a1", category: "Savings", amount: 10000 }, // no roi set
      ],
    };
    const mod: ScenarioModification = { ...EMPTY_MODIFICATION, roiAdjustment: 3 };
    const result = applyModification(stateNoRoi, mod);
    expect(result.assets[0].roi).toBeUndefined();
  });
});

describe("applyPreset", () => {
  it("conservative preset applies -2% ROI adjustment", () => {
    const mod = applyPreset("conservative", baseState);
    expect(mod.roiAdjustment).toBe(-2);
    expect(mod.retireToday).toBe(false);
    expect(mod.maxTaxSheltered).toBe(false);
  });

  it("aggressive-saver preset enables maxTaxSheltered", () => {
    const mod = applyPreset("aggressive-saver", baseState);
    expect(mod.maxTaxSheltered).toBe(true);
    expect(mod.roiAdjustment).toBe(0);
  });

  it("early-retirement preset enables retireToday", () => {
    const mod = applyPreset("early-retirement", baseState);
    expect(mod.retireToday).toBe(true);
    expect(mod.roiAdjustment).toBe(0);
  });
});

describe("compareScenarios — enhanced", () => {
  it("retire-today scenario returns runway estimate", () => {
    const mod: ScenarioModification = { ...EMPTY_MODIFICATION, retireToday: true };
    const result = compareScenarios(baseState, mod, 30);
    expect(result.scenarioRunwayMonths).not.toBeNull();
    // With $160k in assets and ~$4k/mo expenses, should survive a while
    expect(result.scenarioRunwayMonths).toBeGreaterThan(0);
  });

  it("non-retire scenario returns null runway", () => {
    const mod: ScenarioModification = { ...EMPTY_MODIFICATION, roiAdjustment: -1 };
    const result = compareScenarios(baseState, mod, 10);
    expect(result.scenarioRunwayMonths).toBeNull();
  });

  it("lowering ROI decreases net worth projections", () => {
    const mod: ScenarioModification = { ...EMPTY_MODIFICATION, roiAdjustment: -3 };
    const result = compareScenarios(baseState, mod, 10);
    const year10 = result.netWorthDeltas.find((d) => d.year === 10);
    expect(year10).toBeDefined();
    expect(year10!.delta).toBeLessThanOrEqual(0);
  });

  it("maxing tax-sheltered contributions affects projections", () => {
    const mod: ScenarioModification = { ...EMPTY_MODIFICATION, maxTaxSheltered: true };
    const result = compareScenarios(baseState, mod, 10);
    // More contributions = different net worth
    const year10 = result.netWorthDeltas.find((d) => d.year === 10);
    expect(year10).toBeDefined();
    // The delta should be non-zero since contributions changed
    expect(year10!.scenario).not.toBe(year10!.baseline);
  });

  it("housing downsize changes projections", () => {
    const mod: ScenarioModification = { ...EMPTY_MODIFICATION, housingDownsizePercent: 30 };
    const result = compareScenarios(baseState, mod, 10);
    const year5 = result.netWorthDeltas.find((d) => d.year === 5);
    expect(year5).toBeDefined();
    expect(year5!.delta).not.toBe(0);
  });
});

describe("combined modifications", () => {
  it("applies multiple modifications together", () => {
    const mod: ScenarioModification = {
      excludedDebtIds: ["d1"],
      contributionOverrides: {},
      incomeAdjustment: 0,
      windfall: 10000,
      retireToday: false,
      maxTaxSheltered: true,
      housingDownsizePercent: 10,
      roiAdjustment: 1,
    };
    const result = applyModification(baseState, mod);
    // Debt removed
    expect(result.debts).toHaveLength(0);
    // Windfall added to surplus target
    expect(result.assets[0].amount).toBeGreaterThan(50000);
    // ROI adjusted
    expect(result.assets[0].roi).toBe(3); // 2 + 1
    // Tax-sheltered maxed
    const rrsp = result.assets.find((a) => a.category === "RRSP");
    expect(rrsp!.monthlyContribution).toBeCloseTo(31560 / 12, 1);
    // Property downsized
    expect(result.properties[0].value).toBe(450000);
  });
});
