import { describe, it, expect } from "vitest";
import { getDefaultRoiTaxTreatment, shouldShowRoiTaxToggle } from "@/components/AssetEntry";
import { getWithdrawalTaxRate } from "@/lib/withdrawal-tax";
import { encodeState, decodeState } from "@/lib/url-state";
import type { FinancialState } from "@/lib/financial-state";

describe("getDefaultRoiTaxTreatment", () => {
  it("returns 'income' for savings-type categories", () => {
    expect(getDefaultRoiTaxTreatment("Savings")).toBe("income");
    expect(getDefaultRoiTaxTreatment("Savings Account")).toBe("income");
    expect(getDefaultRoiTaxTreatment("Checking")).toBe("income");
    expect(getDefaultRoiTaxTreatment("GIC")).toBe("income");
    expect(getDefaultRoiTaxTreatment("Money Market")).toBe("income");
    expect(getDefaultRoiTaxTreatment("HISA")).toBe("income");
  });

  it("returns 'capital-gains' for investment categories", () => {
    expect(getDefaultRoiTaxTreatment("Brokerage")).toBe("capital-gains");
    expect(getDefaultRoiTaxTreatment("TFSA")).toBe("capital-gains");
    expect(getDefaultRoiTaxTreatment("RRSP")).toBe("capital-gains");
    expect(getDefaultRoiTaxTreatment("401k")).toBe("capital-gains");
    expect(getDefaultRoiTaxTreatment("Other")).toBe("capital-gains");
  });
});

describe("shouldShowRoiTaxToggle", () => {
  it("returns false for tax-sheltered accounts", () => {
    expect(shouldShowRoiTaxToggle("TFSA")).toBe(false);
    expect(shouldShowRoiTaxToggle("Roth IRA")).toBe(false);
    expect(shouldShowRoiTaxToggle("FHSA")).toBe(false);
    expect(shouldShowRoiTaxToggle("HSA")).toBe(false);
  });

  it("returns true for taxable accounts", () => {
    expect(shouldShowRoiTaxToggle("Savings")).toBe(true);
    expect(shouldShowRoiTaxToggle("Brokerage")).toBe(true);
    expect(shouldShowRoiTaxToggle("Checking")).toBe(true);
  });

  it("returns true for tax-deferred accounts", () => {
    expect(shouldShowRoiTaxToggle("RRSP")).toBe(true);
    expect(shouldShowRoiTaxToggle("401k")).toBe(true);
    expect(shouldShowRoiTaxToggle("IRA")).toBe(true);
  });
});

describe("getWithdrawalTaxRate with roiTaxTreatment", () => {
  it("uses capital gains rate by default for taxable accounts", () => {
    const result = getWithdrawalTaxRate("Brokerage", "CA", "ON", 50000, 50);
    // Capital gains: only gains portion (50%) taxed at capital gains rate
    expect(result.effectiveRate).toBeGreaterThan(0);
    expect(result.taxableAmount).toBe(25000);
  });

  it("uses income tax rate when roiTaxTreatment is 'income'", () => {
    const resultIncome = getWithdrawalTaxRate("Savings", "CA", "ON", 50000, 50, "income");
    const resultCapGains = getWithdrawalTaxRate("Savings", "CA", "ON", 50000, 50, "capital-gains");
    // Income tax should be higher than capital gains tax for the same gains amount
    expect(resultIncome.effectiveRate).toBeGreaterThan(resultCapGains.effectiveRate);
  });

  it("does not affect tax-free accounts", () => {
    const result = getWithdrawalTaxRate("TFSA", "CA", "ON", 50000, 50, "income");
    expect(result.effectiveRate).toBe(0);
    expect(result.taxFreeAmount).toBe(50000);
  });

  it("does not affect tax-deferred accounts", () => {
    const resultA = getWithdrawalTaxRate("RRSP", "CA", "ON", 50000, 100, "income");
    const resultB = getWithdrawalTaxRate("RRSP", "CA", "ON", 50000, 100, "capital-gains");
    // Tax-deferred always taxes full amount as employment income
    expect(resultA.effectiveRate).toBe(resultB.effectiveRate);
  });
});

describe("URL state roundtrip for roiTaxTreatment", () => {
  const baseState: FinancialState = {
    assets: [
      { id: "a1", category: "Savings Account", amount: 10000, roi: 3, roiTaxTreatment: "income", surplusTarget: true },
      { id: "a2", category: "Brokerage", amount: 50000, roi: 7 },
    ],
    debts: [],
    income: [],
    expenses: [],
    properties: [],
    stocks: [],
    country: "CA",
    jurisdiction: "ON",
  };

  it("persists roiTaxTreatment='income' through URL encode/decode", () => {
    const encoded = encodeState(baseState);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.assets[0].roiTaxTreatment).toBe("income");
  });

  it("omits roiTaxTreatment when undefined (default)", () => {
    const decoded = decodeState(encodeState(baseState));
    // Second asset has no roiTaxTreatment set
    expect(decoded!.assets[1].roiTaxTreatment).toBeUndefined();
  });

  it("omits capital-gains (default) from compact state", () => {
    const stateWithCapGains: FinancialState = {
      ...baseState,
      assets: [{ id: "a1", category: "Brokerage", amount: 50000, roi: 7, roiTaxTreatment: "capital-gains", surplusTarget: true }],
    };
    const encoded = encodeState(stateWithCapGains);
    const decoded = decodeState(encoded);
    // capital-gains is default, so it's not persisted
    expect(decoded!.assets[0].roiTaxTreatment).toBeUndefined();
  });
});
