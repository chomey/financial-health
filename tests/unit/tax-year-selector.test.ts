import { describe, it, expect } from "vitest";
import {
  getCanadianBrackets,
  getUSBrackets,
  getUSCapitalGainsBrackets,
  CA_FEDERAL_2025,
  CA_FEDERAL_2026,
  US_FEDERAL_2025,
  US_FEDERAL_2026,
  US_CAPITAL_GAINS_2025,
  US_CAPITAL_GAINS_2026,
  SUPPORTED_TAX_YEARS,
  calculateProgressiveTax,
} from "@/lib/tax-tables";
import { computeTax } from "@/lib/tax-engine";
import {
  findCreditCategory,
  getCreditCategories,
  getCreditCategoriesForFilingStatus,
} from "@/lib/tax-credits";
import { encodeState, decodeState } from "@/lib/url-state";
import type { FinancialState } from "@/lib/financial-types";
import { INITIAL_STATE } from "@/lib/financial-types";

describe("SUPPORTED_TAX_YEARS", () => {
  it("includes 2025 and 2026", () => {
    expect(SUPPORTED_TAX_YEARS).toContain(2025);
    expect(SUPPORTED_TAX_YEARS).toContain(2026);
  });
});

describe("CA federal brackets differ by year", () => {
  it("2026 brackets are higher than 2025 (inflation-indexed)", () => {
    expect(CA_FEDERAL_2026.brackets[0].max).toBeGreaterThan(CA_FEDERAL_2025.brackets[0].max);
    expect(CA_FEDERAL_2026.basicPersonalAmount).toBeGreaterThan(CA_FEDERAL_2025.basicPersonalAmount);
  });

  it("2026 BPA is approximately 2.7% higher", () => {
    const ratio = CA_FEDERAL_2026.basicPersonalAmount / CA_FEDERAL_2025.basicPersonalAmount;
    expect(ratio).toBeGreaterThan(1.02);
    expect(ratio).toBeLessThan(1.04);
  });
});

describe("US federal brackets differ by year", () => {
  it("2026 brackets are higher than 2025 (inflation-indexed)", () => {
    expect(US_FEDERAL_2026.brackets[0].max).toBeGreaterThan(US_FEDERAL_2025.brackets[0].max);
    expect(US_FEDERAL_2026.basicPersonalAmount).toBeGreaterThan(US_FEDERAL_2025.basicPersonalAmount);
  });

  it("2026 capital gains brackets are higher than 2025", () => {
    expect(US_CAPITAL_GAINS_2026.brackets[0].max).toBeGreaterThan(US_CAPITAL_GAINS_2025.brackets[0].max);
  });
});

describe("getCanadianBrackets with year parameter", () => {
  it("returns 2025 brackets by default", () => {
    const { federal } = getCanadianBrackets("ON");
    expect(federal).toEqual(CA_FEDERAL_2025);
  });

  it("returns 2025 brackets when explicitly requested", () => {
    const { federal } = getCanadianBrackets("ON", 2025);
    expect(federal).toEqual(CA_FEDERAL_2025);
  });

  it("returns 2026 brackets when requested", () => {
    const { federal } = getCanadianBrackets("ON", 2026);
    expect(federal).toEqual(CA_FEDERAL_2026);
  });

  it("returns provincial brackets for 2026 (fallback to 2025 provincial values)", () => {
    const r2025 = getCanadianBrackets("ON", 2025);
    const r2026 = getCanadianBrackets("ON", 2026);
    // Provincial tables reuse 2025 values for 2026 (placeholder until published)
    expect(r2026.provincial).toEqual(r2025.provincial);
  });

  it("throws for unsupported year", () => {
    expect(() => getCanadianBrackets("ON", 2024)).toThrow("not supported");
  });
});

describe("getUSBrackets with year parameter", () => {
  it("returns 2025 brackets by default", () => {
    const { federal } = getUSBrackets("CA");
    expect(federal).toEqual(US_FEDERAL_2025);
  });

  it("returns 2026 brackets when requested", () => {
    const { federal } = getUSBrackets("CA", 2026);
    expect(federal).toEqual(US_FEDERAL_2026);
  });

  it("throws for unsupported year", () => {
    expect(() => getUSBrackets("CA", 2024)).toThrow("not supported");
  });
});

describe("getUSCapitalGainsBrackets", () => {
  it("returns 2025 by default", () => {
    expect(getUSCapitalGainsBrackets()).toEqual(US_CAPITAL_GAINS_2025);
  });

  it("returns 2026 when requested", () => {
    expect(getUSCapitalGainsBrackets(2026)).toEqual(US_CAPITAL_GAINS_2026);
  });
});

describe("computeTax with year parameter", () => {
  it("computes lower CA federal tax for 2026 at same income (higher BPA)", () => {
    const tax2025 = computeTax(60000, "employment", "CA", "ON", 2025);
    const tax2026 = computeTax(60000, "employment", "CA", "ON", 2026);
    // 2026 has higher BPA, so tax should be slightly lower
    expect(tax2026.totalTax).toBeLessThan(tax2025.totalTax);
  });

  it("computes lower US federal tax for 2026 at same income (higher standard deduction)", () => {
    const tax2025 = computeTax(60000, "employment", "US", "CA", 2025);
    const tax2026 = computeTax(60000, "employment", "US", "CA", 2026);
    expect(tax2026.totalTax).toBeLessThan(tax2025.totalTax);
  });

  it("defaults to 2025 when year not specified", () => {
    const taxDefault = computeTax(60000, "employment", "CA", "ON");
    const tax2025 = computeTax(60000, "employment", "CA", "ON", 2025);
    expect(taxDefault.totalTax).toEqual(tax2025.totalTax);
  });

  it("computes US capital gains with year-specific brackets", () => {
    const tax2025 = computeTax(100000, "capital-gains", "US", "TX", 2025);
    const tax2026 = computeTax(100000, "capital-gains", "US", "TX", 2026);
    // 2026 0% bracket is wider, so less tax
    expect(tax2026.totalTax).toBeLessThanOrEqual(tax2025.totalTax);
  });
});

describe("tax credits year overrides", () => {
  it("returns base values for 2025", () => {
    const dtc = findCreditCategory("Disability Tax Credit (DTC)", "CA", 2025);
    expect(dtc).toBeDefined();
    expect(dtc!.maxAmount).toBe(10_138);
  });

  it("returns overridden maxAmount for 2026", () => {
    const dtc = findCreditCategory("Disability Tax Credit (DTC)", "CA", 2026);
    expect(dtc).toBeDefined();
    expect(dtc!.maxAmount).toBe(10_412);
  });

  it("returns overridden description for 2026", () => {
    const dtc = findCreditCategory("Disability Tax Credit (DTC)", "CA", 2026);
    expect(dtc!.description).toContain("$10,412");
  });

  it("CWB has updated phase-out thresholds for 2026", () => {
    const cwb2025 = findCreditCategory("Canada Workers Benefit (CWB)", "CA", 2025);
    const cwb2026 = findCreditCategory("Canada Workers Benefit (CWB)", "CA", 2026);
    expect(cwb2026!.maxAmount).toBeGreaterThan(cwb2025!.maxAmount!);
    expect(cwb2026!.incomeLimits.single?.phaseOutStart).toBeGreaterThan(
      cwb2025!.incomeLimits.single?.phaseOutStart!
    );
  });

  it("CCB has updated phase-out for 2026", () => {
    const ccb2026 = findCreditCategory("Canada Child Benefit (CCB)", "CA", 2026);
    expect(ccb2026!.maxAmount).toBe(8_213);
    expect(ccb2026!.incomeLimits.single?.phaseOutStart).toBe(38_499);
  });

  it("US EITC has updated values for 2026", () => {
    const eitc2026 = findCreditCategory("Earned Income Tax Credit (EITC)", "US", 2026);
    expect(eitc2026!.maxAmount).toBe(8_271);
  });

  it("US Child Tax Credit has same base amount for 2026 (statutory, not indexed)", () => {
    const ctc2026 = findCreditCategory("Child Tax Credit", "US", 2026);
    expect(ctc2026!.maxAmount).toBe(2_000);
  });

  it("US Saver's Credit has updated income limits for 2026", () => {
    const sc2026 = findCreditCategory("Saver's Credit", "US", 2026);
    expect(sc2026!.incomeLimits.single?.hardCap).toBe(40_600);
  });

  it("getCreditCategories returns year-resolved categories", () => {
    const cats2025 = getCreditCategories("CA", 2025);
    const cats2026 = getCreditCategories("CA", 2026);
    const dtc2025 = cats2025.find((c) => c.name === "Disability Tax Credit (DTC)");
    const dtc2026 = cats2026.find((c) => c.name === "Disability Tax Credit (DTC)");
    expect(dtc2025!.maxAmount).toBe(10_138);
    expect(dtc2026!.maxAmount).toBe(10_412);
  });

  it("getCreditCategoriesForFilingStatus passes year through", () => {
    const cats = getCreditCategoriesForFilingStatus("CA", "single", 2026);
    const cwb = cats.find((c) => c.name === "Canada Workers Benefit (CWB)");
    expect(cwb!.maxAmount).toBe(1_677);
  });

  it("credits without yearOverrides return unchanged for any year", () => {
    // Moving Expenses Deduction has no yearOverrides
    const mov2025 = findCreditCategory("Moving Expenses Deduction", "CA", 2025);
    const mov2026 = findCreditCategory("Moving Expenses Deduction", "CA", 2026);
    expect(mov2025).toEqual(mov2026);
  });
});

describe("URL state roundtrip with taxYear", () => {
  it("persists taxYear=2026 through encode/decode", () => {
    const state: FinancialState = { ...INITIAL_STATE, taxYear: 2026 };
    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.taxYear).toBe(2026);
  });

  it("omits taxYear from URL when 2025 (default)", () => {
    const state: FinancialState = { ...INITIAL_STATE, taxYear: 2025 };
    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    // taxYear should be undefined (omitted) since 2025 is default
    expect(decoded!.taxYear).toBeUndefined();
  });

  it("backward compatible: old URLs without taxYear decode to undefined", () => {
    const state: FinancialState = { ...INITIAL_STATE };
    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.taxYear).toBeUndefined();
  });
});

describe("tax computation uses different brackets per year", () => {
  it("2026 CA federal BPA credit saves more tax", () => {
    // At income just above BPA, the difference is visible
    const income = 20000;
    const tax2025 = calculateProgressiveTax(income, CA_FEDERAL_2025);
    const tax2026 = calculateProgressiveTax(income, CA_FEDERAL_2026);
    // Higher BPA → larger credit → less tax
    expect(tax2026).toBeLessThan(tax2025);
  });
});
