import { describe, it, expect } from "vitest";
import { generateInsights, type FinancialData } from "@/lib/insights";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeData(overrides: Partial<FinancialData> = {}): FinancialData {
  return {
    totalAssets: 80_000,
    totalDebts: 0,
    monthlyIncome: 6_000,
    monthlyExpenses: 3_000,
    ...overrides,
  };
}

function withWithdrawalTax(
  overrides: Partial<FinancialData["withdrawalTax"]> = {},
): FinancialData["withdrawalTax"] {
  return {
    taxDragMonths: 0,
    withdrawalOrder: [],
    accountsByTreatment: {
      taxFree: { categories: [], total: 0 },
      taxDeferred: { categories: [], total: 0 },
      taxable: { categories: ["Savings"], total: 10_000 },
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// assetCategories / debtCategories populated in toFinancialData
// ---------------------------------------------------------------------------
describe("FinancialData assetCategories / debtCategories", () => {
  it("assetCategories and debtCategories are present in FinancialData type", () => {
    const data: FinancialData = makeData({
      assetCategories: ["TFSA", "RRSP", "Savings Account"],
      debtCategories: ["Car Loan"],
    });
    expect(data.assetCategories).toEqual(["TFSA", "RRSP", "Savings Account"]);
    expect(data.debtCategories).toEqual(["Car Loan"]);
  });
});

// ---------------------------------------------------------------------------
// tax-rate-high insight — context-aware by country and existing accounts
// ---------------------------------------------------------------------------
describe("tax-rate-high insight: CA context-aware", () => {
  const highTaxBase = makeData({
    effectiveTaxRate: 0.35,
    annualTax: 21_000,
    country: "CA",
  });

  it("suggests TFSA and RRSP when user has neither (CA)", () => {
    const data = { ...highTaxBase, assetCategories: ["Savings Account"] };
    const insights = generateInsights(data);
    const insight = insights.find((i) => i.id === "tax-rate-high");
    expect(insight).toBeDefined();
    expect(insight!.message).toContain("TFSA");
    expect(insight!.message).toContain("RRSP");
  });

  it("acknowledges TFSA and suggests RRSP when user has TFSA only (CA)", () => {
    const data = { ...highTaxBase, assetCategories: ["TFSA", "Savings Account"] };
    const insights = generateInsights(data);
    const insight = insights.find((i) => i.id === "tax-rate-high");
    expect(insight).toBeDefined();
    expect(insight!.message).toContain("TFSA");
    expect(insight!.message).toContain("RRSP");
    // Should acknowledge they already have TFSA
    expect(insight!.message).toMatch(/already using/i);
  });

  it("acknowledges RRSP and suggests TFSA when user has RRSP only (CA)", () => {
    const data = { ...highTaxBase, assetCategories: ["RRSP", "Savings Account"] };
    const insights = generateInsights(data);
    const insight = insights.find((i) => i.id === "tax-rate-high");
    expect(insight).toBeDefined();
    expect(insight!.message).toContain("RRSP");
    expect(insight!.message).toContain("TFSA");
    expect(insight!.message).toMatch(/already using/i);
  });

  it("encourages maximizing when user has both TFSA and RRSP (CA)", () => {
    const data = { ...highTaxBase, assetCategories: ["TFSA", "RRSP"] };
    const insights = generateInsights(data);
    const insight = insights.find((i) => i.id === "tax-rate-high");
    expect(insight).toBeDefined();
    expect(insight!.message).toMatch(/maximiz/i);
    expect(insight!.message).toContain("TFSA");
    expect(insight!.message).toContain("RRSP");
  });

  it("does not suggest TFSA or RRSP to US user", () => {
    const data = { ...highTaxBase, country: "US" as const, assetCategories: [] };
    const insights = generateInsights(data);
    const insight = insights.find((i) => i.id === "tax-rate-high");
    expect(insight).toBeDefined();
    expect(insight!.message).not.toContain("TFSA");
    expect(insight!.message).not.toContain("RRSP");
  });
});

describe("tax-rate-high insight: US context-aware", () => {
  const highTaxBaseUS = makeData({
    effectiveTaxRate: 0.35,
    annualTax: 21_000,
    country: "US",
  });

  it("suggests 401(k) and Roth IRA when user has neither (US)", () => {
    const data = { ...highTaxBaseUS, assetCategories: ["Savings Account"] };
    const insights = generateInsights(data);
    const insight = insights.find((i) => i.id === "tax-rate-high");
    expect(insight).toBeDefined();
    expect(insight!.message).toContain("401(k)");
    expect(insight!.message).toContain("Roth IRA");
  });

  it("acknowledges 401k and suggests Roth IRA when user has 401k only (US)", () => {
    const data = { ...highTaxBaseUS, assetCategories: ["401k"] };
    const insights = generateInsights(data);
    const insight = insights.find((i) => i.id === "tax-rate-high");
    expect(insight).toBeDefined();
    expect(insight!.message).toContain("401(k)");
    expect(insight!.message).toContain("Roth IRA");
    expect(insight!.message).toMatch(/already using/i);
  });

  it("acknowledges Roth IRA and suggests 401k match when user has Roth IRA only (US)", () => {
    const data = { ...highTaxBaseUS, assetCategories: ["Roth IRA"] };
    const insights = generateInsights(data);
    const insight = insights.find((i) => i.id === "tax-rate-high");
    expect(insight).toBeDefined();
    expect(insight!.message).toContain("Roth IRA");
    expect(insight!.message).toMatch(/401\(k\)/i);
    expect(insight!.message).toMatch(/already using/i);
  });

  it("encourages maximizing when user has 401k and Roth IRA (US)", () => {
    const data = { ...highTaxBaseUS, assetCategories: ["401k", "Roth IRA"] };
    const insights = generateInsights(data);
    const insight = insights.find((i) => i.id === "tax-rate-high");
    expect(insight).toBeDefined();
    expect(insight!.message).toMatch(/maximiz/i);
  });

  it("does not suggest 401k or Roth IRA to CA user", () => {
    const data = { ...highTaxBaseUS, country: "CA" as const, assetCategories: [] };
    const insights = generateInsights(data);
    const insight = insights.find((i) => i.id === "tax-rate-high");
    expect(insight).toBeDefined();
    expect(insight!.message).not.toContain("401(k)");
    expect(insight!.message).not.toContain("Roth IRA");
  });
});

// ---------------------------------------------------------------------------
// withdrawal-tax-no-free: country-specific suggestion
// ---------------------------------------------------------------------------
describe("withdrawal-tax-no-free: country-specific", () => {
  it("suggests TFSA for CA user with no tax-free accounts", () => {
    const data = makeData({
      country: "CA",
      withdrawalTax: {
        taxDragMonths: 0,
        withdrawalOrder: ["RRSP"],
        accountsByTreatment: {
          taxFree: { categories: [], total: 0 },
          taxDeferred: { categories: ["RRSP"], total: 50_000 },
          taxable: { categories: [], total: 0 },
        },
      },
    });
    const insights = generateInsights(data);
    const insight = insights.find((i) => i.id === "withdrawal-tax-no-free");
    expect(insight).toBeDefined();
    expect(insight!.message).toContain("TFSA");
    expect(insight!.message).not.toContain("Roth IRA");
  });

  it("suggests Roth IRA for US user with no tax-free accounts", () => {
    const data = makeData({
      country: "US",
      withdrawalTax: {
        taxDragMonths: 0,
        withdrawalOrder: ["401k"],
        accountsByTreatment: {
          taxFree: { categories: [], total: 0 },
          taxDeferred: { categories: ["401k"], total: 50_000 },
          taxable: { categories: [], total: 0 },
        },
      },
    });
    const insights = generateInsights(data);
    const insight = insights.find((i) => i.id === "withdrawal-tax-no-free");
    expect(insight).toBeDefined();
    expect(insight!.message).toContain("Roth IRA");
    expect(insight!.message).not.toContain("TFSA");
  });
});

// ---------------------------------------------------------------------------
// tax-opt-taxable-to-free: uses "maximizing" when user already has account
// ---------------------------------------------------------------------------
describe("tax-opt-taxable-to-free: context-aware action phrase", () => {
  it('says "Maximizing your TFSA" when CA user already has a TFSA', () => {
    const data = makeData({
      marginalRate: 0.4,
      country: "CA",
      assetCategories: ["TFSA", "Savings Account"],
      withdrawalTax: withWithdrawalTax({
        accountsByTreatment: {
          taxFree: { categories: ["TFSA"], total: 10_000 },
          taxDeferred: { categories: [], total: 0 },
          taxable: { categories: ["Savings"], total: 100_000 },
        },
      }),
    });
    const insights = generateInsights(data);
    const insight = insights.find((i) => i.id === "tax-opt-taxable-to-free");
    expect(insight).toBeDefined();
    expect(insight!.message).toMatch(/Maximizing your TFSA/);
  });

  it('says "Shifting contributions to a TFSA" when CA user has no TFSA', () => {
    const data = makeData({
      marginalRate: 0.4,
      country: "CA",
      assetCategories: ["Savings Account"],
      withdrawalTax: withWithdrawalTax({
        accountsByTreatment: {
          taxFree: { categories: [], total: 0 },
          taxDeferred: { categories: [], total: 0 },
          taxable: { categories: ["Savings"], total: 100_000 },
        },
      }),
    });
    const insights = generateInsights(data);
    const insight = insights.find((i) => i.id === "tax-opt-taxable-to-free");
    expect(insight).toBeDefined();
    expect(insight!.message).toMatch(/Shifting contributions to a TFSA/);
  });

  it('says "Maximizing your Roth IRA" when US user already has a Roth IRA', () => {
    const data = makeData({
      marginalRate: 0.35,
      country: "US",
      assetCategories: ["Roth IRA", "Brokerage"],
      withdrawalTax: withWithdrawalTax({
        accountsByTreatment: {
          taxFree: { categories: ["Roth IRA"], total: 10_000 },
          taxDeferred: { categories: [], total: 0 },
          taxable: { categories: ["Brokerage"], total: 100_000 },
        },
      }),
    });
    const insights = generateInsights(data);
    const insight = insights.find((i) => i.id === "tax-opt-taxable-to-free");
    expect(insight).toBeDefined();
    expect(insight!.message).toMatch(/Maximizing your Roth IRA/);
  });
});

// ---------------------------------------------------------------------------
// tax-opt-deferred-contribution: context-aware + requires taxable accounts
// ---------------------------------------------------------------------------
describe("tax-opt-deferred-contribution: context-aware", () => {
  it("skips RRSP suggestion when user has no taxable accounts (CA)", () => {
    const data = makeData({
      marginalRate: 0.43,
      country: "CA",
      annualEmploymentIncome: 150_000,
      assetCategories: ["RRSP"],
      withdrawalTax: withWithdrawalTax({
        accountsByTreatment: {
          taxFree: { categories: [], total: 0 },
          taxDeferred: { categories: ["RRSP"], total: 50_000 },
          taxable: { categories: [], total: 0 },
        },
      }),
    });
    const insights = generateInsights(data);
    const insight = insights.find((i) => i.id === "tax-opt-deferred-contribution");
    expect(insight).toBeUndefined();
  });

  it("shows 'increasing your RRSP' when user already has RRSP (CA)", () => {
    const data = makeData({
      marginalRate: 0.43,
      country: "CA",
      annualEmploymentIncome: 150_000,
      assetCategories: ["RRSP", "Savings Account"],
      withdrawalTax: withWithdrawalTax({
        accountsByTreatment: {
          taxFree: { categories: [], total: 0 },
          taxDeferred: { categories: ["RRSP"], total: 50_000 },
          taxable: { categories: ["Savings"], total: 10_000 },
        },
      }),
    });
    const insights = generateInsights(data);
    const insight = insights.find((i) => i.id === "tax-opt-deferred-contribution");
    expect(insight).toBeDefined();
    expect(insight!.message).toMatch(/increasing your RRSP/);
  });

  it("shows 'contributing to a RRSP' when user has no RRSP yet (CA)", () => {
    const data = makeData({
      marginalRate: 0.43,
      country: "CA",
      annualEmploymentIncome: 150_000,
      assetCategories: ["Savings Account"],
      withdrawalTax: withWithdrawalTax({
        accountsByTreatment: {
          taxFree: { categories: [], total: 0 },
          taxDeferred: { categories: [], total: 0 },
          taxable: { categories: ["Savings"], total: 10_000 },
        },
      }),
    });
    const insights = generateInsights(data);
    const insight = insights.find((i) => i.id === "tax-opt-deferred-contribution");
    expect(insight).toBeDefined();
    expect(insight!.message).toMatch(/contributing to a RRSP/);
  });

  it("shows 'increasing your 401(k)' when US user already has 401k", () => {
    const data = makeData({
      marginalRate: 0.32,
      country: "US",
      annualEmploymentIncome: 120_000,
      assetCategories: ["401k", "Brokerage"],
      withdrawalTax: withWithdrawalTax({
        accountsByTreatment: {
          taxFree: { categories: [], total: 0 },
          taxDeferred: { categories: ["401k"], total: 40_000 },
          taxable: { categories: ["Brokerage"], total: 10_000 },
        },
      }),
    });
    const insights = generateInsights(data);
    const insight = insights.find((i) => i.id === "tax-opt-deferred-contribution");
    expect(insight).toBeDefined();
    expect(insight!.message).toMatch(/increasing your 401\(k\)/);
  });

  it("skips 401k suggestion when US user has no taxable accounts", () => {
    const data = makeData({
      marginalRate: 0.32,
      country: "US",
      annualEmploymentIncome: 120_000,
      assetCategories: ["401k"],
      withdrawalTax: withWithdrawalTax({
        accountsByTreatment: {
          taxFree: { categories: [], total: 0 },
          taxDeferred: { categories: ["401k"], total: 40_000 },
          taxable: { categories: [], total: 0 },
        },
      }),
    });
    const insights = generateInsights(data);
    const insight = insights.find((i) => i.id === "tax-opt-deferred-contribution");
    expect(insight).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// tax-opt-use-tax-free-room: context-aware message
// ---------------------------------------------------------------------------
describe("tax-opt-use-tax-free-room: context-aware", () => {
  it("says 'Your TFSA has room' when user already has a TFSA (CA)", () => {
    const data = makeData({
      marginalRate: 0.2,
      country: "CA",
      assetCategories: ["TFSA", "Savings Account"],
      withdrawalTax: withWithdrawalTax({
        accountsByTreatment: {
          taxFree: { categories: ["TFSA"], total: 500 },
          taxDeferred: { categories: [], total: 0 },
          taxable: { categories: ["Savings"], total: 1_500 },
        },
      }),
    });
    const insights = generateInsights(data);
    const insight = insights.find((i) => i.id === "tax-opt-use-tax-free-room");
    expect(insight).toBeDefined();
    expect(insight!.message).toContain("Your TFSA has room");
  });

  it("says 'Opening a TFSA' when user has no TFSA (CA)", () => {
    const data = makeData({
      marginalRate: 0.2,
      country: "CA",
      assetCategories: ["Savings Account"],
      withdrawalTax: withWithdrawalTax({
        accountsByTreatment: {
          taxFree: { categories: [], total: 0 },
          taxDeferred: { categories: [], total: 0 },
          taxable: { categories: ["Savings"], total: 1_500 },
        },
      }),
    });
    const insights = generateInsights(data);
    const insight = insights.find((i) => i.id === "tax-opt-use-tax-free-room");
    expect(insight).toBeDefined();
    expect(insight!.message).toMatch(/Opening a TFSA/);
  });

  it("says 'Opening a Roth IRA' when US user has no Roth IRA", () => {
    const data = makeData({
      marginalRate: 0.2,
      country: "US",
      assetCategories: ["Savings Account"],
      withdrawalTax: withWithdrawalTax({
        accountsByTreatment: {
          taxFree: { categories: [], total: 0 },
          taxDeferred: { categories: [], total: 0 },
          taxable: { categories: ["Savings"], total: 1_500 },
        },
      }),
    });
    const insights = generateInsights(data);
    const insight = insights.find((i) => i.id === "tax-opt-use-tax-free-room");
    expect(insight).toBeDefined();
    expect(insight!.message).toMatch(/Opening a Roth IRA/);
  });
});
