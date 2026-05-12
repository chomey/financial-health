/**
 * Task 172: AU unit tests and validation
 *
 * Validates AU sample profiles produce reasonable dashboard metrics,
 * country switching preserves financial data, super contribution limits,
 * and franking credit gross-up calculations.
 */
import { describe, it, expect } from "vitest";
import { computeTotals } from "@/lib/compute-totals";
import { getProfilesForCountry } from "@/lib/sample-profiles";
import { getDefaultFilingStatus } from "@/lib/tax-credits";
import { TAX_SHELTERED_LIMITS, isTaxSheltered, getMonthlyLimit } from "@/lib/scenario";
import type { FinancialState } from "@/lib/financial-types";
import type { TaxCredit } from "@/lib/tax-credits";

const AU_PROFILES = getProfilesForCountry("AU");

// ─── AU sample profile: fresh-grad-au ─────────────────────────────────────────

describe("AU sample profile: fresh-grad-au", () => {
  const profile = AU_PROFILES.find((p) => p.id === "fresh-grad-au")!;

  it("profile exists in AU profiles", () => {
    expect(profile).toBeDefined();
    expect(profile.state.country).toBe("AU");
  });

  it("computeTotals uses AUD as home currency", () => {
    const totals = computeTotals(profile.state);
    expect(totals.homeCurrency).toBe("AUD");
  });

  it("monthly income is $5,417", () => {
    const totals = computeTotals(profile.state);
    expect(totals.monthlyIncome).toBe(5417);
  });

  it("monthly expenses are $3,390", () => {
    const totals = computeTotals(profile.state);
    // 2200+500+80+200+200+150+60 = 3390
    expect(totals.monthlyExpenses).toBe(3390);
  });

  it("totalAssets is $7,500 (Super + FHSS + Savings)", () => {
    const totals = computeTotals(profile.state);
    expect(totals.totalAssets).toBe(7500); // 4k super + 1k FHSS + 2.5k savings
  });

  it("totalDebts is $24,000 (student debt)", () => {
    const totals = computeTotals(profile.state);
    expect(totals.totalDebts).toBe(24000);
  });

  it("has no property equity (renting)", () => {
    const totals = computeTotals(profile.state);
    expect(totals.totalPropertyEquity).toBe(0);
    expect(totals.totalPropertyValue).toBe(0);
  });

  it("AU tax estimate is positive (AU brackets + Medicare Levy applied)", () => {
    const totals = computeTotals(profile.state);
    // $65k employment: federal ~$10,289 + Medicare ~$1,300 = ~$11,589
    expect(totals.totalTaxEstimate).toBeGreaterThan(9000);
    expect(totals.totalTaxEstimate).toBeLessThan(15000);
  });

  it("effective tax rate is between 14% and 20%", () => {
    const totals = computeTotals(profile.state);
    expect(totals.effectiveTaxRate).toBeGreaterThan(0.14);
    expect(totals.effectiveTaxRate).toBeLessThan(0.20);
  });

  it("monthly after-tax income is positive and less than gross", () => {
    const totals = computeTotals(profile.state);
    expect(totals.monthlyAfterTaxIncome).toBeGreaterThan(0);
    expect(totals.monthlyAfterTaxIncome).toBeLessThan(totals.monthlyIncome);
  });

  it("provincial/state tax is 0 (AU has no state income tax)", () => {
    const totals = computeTotals(profile.state);
    expect(totals.totalProvincialStateTax).toBe(0);
  });

  it("monthly contributions are tracked", () => {
    const totals = computeTotals(profile.state);
    expect(totals.totalMonthlyContributions).toBeGreaterThanOrEqual(0);
  });
});

// ─── AU sample profile: mid-career-au ────────────────────────────────────────

describe("AU sample profile: mid-career-au", () => {
  const profile = AU_PROFILES.find((p) => p.id === "mid-career-au")!;

  it("computeTotals uses AUD as home currency", () => {
    const totals = computeTotals(profile.state);
    expect(totals.homeCurrency).toBe("AUD");
  });

  it("monthly income is $9,167", () => {
    const totals = computeTotals(profile.state);
    expect(totals.monthlyIncome).toBe(9167);
  });

  it("monthly expenses are $3,670", () => {
    const totals = computeTotals(profile.state);
    // 750+150+350+1400+400+220+280+120 = 3670
    expect(totals.monthlyExpenses).toBe(3670);
  });

  it("totalAssets is $100,000 (Super + Savings)", () => {
    const totals = computeTotals(profile.state);
    expect(totals.totalAssets).toBe(100000); // 85k + 15k
  });

  it("has property equity of $280,000", () => {
    const totals = computeTotals(profile.state);
    expect(totals.totalPropertyEquity).toBe(280000); // 850k - 570k
  });

  it("personal debts are $18,000 (car loan)", () => {
    const totals = computeTotals(profile.state);
    expect(totals.totalDebts).toBe(18000);
  });

  it("AU tax on $110k annual is in 30% bracket range", () => {
    const totals = computeTotals(profile.state);
    // Federal ~$23,789 + Medicare $2,200 = ~$25,989
    expect(totals.totalTaxEstimate).toBeGreaterThan(22000);
    expect(totals.totalTaxEstimate).toBeLessThan(32000);
  });

  it("effective tax rate is between 19% and 26%", () => {
    const totals = computeTotals(profile.state);
    expect(totals.effectiveTaxRate).toBeGreaterThan(0.19);
    expect(totals.effectiveTaxRate).toBeLessThan(0.26);
  });

  it("provincial/state tax is 0 (VIC jurisdiction)", () => {
    const totals = computeTotals(profile.state);
    expect(totals.totalProvincialStateTax).toBe(0);
  });

  it("net worth (assets + equity - debts) is above $340k", () => {
    const totals = computeTotals(profile.state);
    const netWorth = totals.totalAssets + totals.totalPropertyEquity - totals.totalDebts;
    expect(netWorth).toBeGreaterThan(340000); // 100k + 280k - 18k = 362k
  });
});

// ─── AU sample profile: pre-retirement-au ────────────────────────────────────

describe("AU sample profile: pre-retirement-au", () => {
  const profile = AU_PROFILES.find((p) => p.id === "pre-retirement-au")!;

  it("computeTotals uses AUD as home currency", () => {
    const totals = computeTotals(profile.state);
    expect(totals.homeCurrency).toBe("AUD");
  });

  it("monthly income is $10,833", () => {
    const totals = computeTotals(profile.state);
    expect(totals.monthlyIncome).toBe(10833);
  });

  it("monthly expenses are $2,890", () => {
    const totals = computeTotals(profile.state);
    // 650+110+400+600+350+200+380+200 = 2890
    expect(totals.monthlyExpenses).toBe(2890);
  });

  it("totalAssets is $520,000 (Super + Savings + Brokerage)", () => {
    const totals = computeTotals(profile.state);
    expect(totals.totalAssets).toBe(520000); // 380k + 60k + 80k
  });

  it("has one property with equity above $800k", () => {
    const totals = computeTotals(profile.state);
    // Primary: 850k - 40k = 810k
    expect(totals.totalPropertyEquity).toBeGreaterThan(800000);
    expect(totals.totalPropertyValue).toBe(850000);
  });

  it("property mortgage is $40,000", () => {
    const totals = computeTotals(profile.state);
    expect(totals.totalPropertyMortgage).toBe(40_000);
  });

  it("totalDebts is $4,000 (credit card)", () => {
    const totals = computeTotals(profile.state);
    expect(totals.totalDebts).toBe(4000);
  });

  it("AU tax on $130k is in the 37% bracket range", () => {
    const totals = computeTotals(profile.state);
    // Federal: ~$30,486 + Medicare $2,600 = ~$33,086
    expect(totals.totalTaxEstimate).toBeGreaterThan(28000);
    expect(totals.totalTaxEstimate).toBeLessThan(40000);
  });

  it("effective tax rate is between 21% and 28%", () => {
    const totals = computeTotals(profile.state);
    expect(totals.effectiveTaxRate).toBeGreaterThan(0.21);
    expect(totals.effectiveTaxRate).toBeLessThan(0.28);
  });

  it("provincial/state tax is 0 (QLD jurisdiction)", () => {
    const totals = computeTotals(profile.state);
    expect(totals.totalProvincialStateTax).toBe(0);
  });

  it("net worth is above $1M (wealthy pre-retiree)", () => {
    const totals = computeTotals(profile.state);
    const netWorth = totals.totalAssets + totals.totalPropertyEquity - totals.totalDebts;
    expect(netWorth).toBeGreaterThan(1_000_000);
  });
});

// ─── All AU profiles pass computeTotals without error ─────────────────────────

describe("AU sample profiles: computation correctness", () => {
  it("all 3 AU profiles compute without throwing", () => {
    const profiles = getProfilesForCountry("AU");
    expect(() => {
      for (const profile of profiles) {
        computeTotals(profile.state);
      }
    }).not.toThrow();
  });

  it("all 3 AU profiles use AUD home currency", () => {
    const profiles = getProfilesForCountry("AU");
    for (const profile of profiles) {
      expect(computeTotals(profile.state).homeCurrency).toBe("AUD");
    }
  });

  it("all 3 AU profiles have positive monthly income", () => {
    const profiles = getProfilesForCountry("AU");
    for (const profile of profiles) {
      expect(computeTotals(profile.state).monthlyIncome).toBeGreaterThan(0);
    }
  });

  it("all 3 AU profiles have positive monthly expenses", () => {
    const profiles = getProfilesForCountry("AU");
    for (const profile of profiles) {
      expect(computeTotals(profile.state).monthlyExpenses).toBeGreaterThan(0);
    }
  });

  it("all 3 AU profiles have a positive tax estimate (AU tax applied)", () => {
    const profiles = getProfilesForCountry("AU");
    for (const profile of profiles) {
      expect(computeTotals(profile.state).totalTaxEstimate).toBeGreaterThan(0);
    }
  });

  it("all 3 AU profiles have 0 provincial/state tax (no AU state income tax)", () => {
    const profiles = getProfilesForCountry("AU");
    for (const profile of profiles) {
      expect(computeTotals(profile.state).totalProvincialStateTax).toBe(0);
    }
  });

  it("all 3 AU profiles have positive after-tax monthly income", () => {
    const profiles = getProfilesForCountry("AU");
    for (const profile of profiles) {
      const totals = computeTotals(profile.state);
      expect(totals.monthlyAfterTaxIncome).toBeGreaterThan(0);
    }
  });

  it("income increases across life stages (young < mid < pre-retiree)", () => {
    const profiles = getProfilesForCountry("AU");
    const [young, mid, pre] = profiles.map((p) => computeTotals(p.state).monthlyIncome);
    expect(young).toBeLessThan(mid);
    expect(mid).toBeLessThan(pre);
  });

  it("assets increase across life stages (young < mid < pre-retiree)", () => {
    const profiles = getProfilesForCountry("AU");
    const [young, mid, pre] = profiles.map((p) => computeTotals(p.state).totalAssets);
    expect(young).toBeLessThan(mid);
    expect(mid).toBeLessThan(pre);
  });
});

// ─── Country switching CA→AU→US preserves financial data ──────────────────────

describe("Country switching CA→AU→US preserves financial data", () => {
  const sharedData = {
    income: [{ id: "i1", category: "Salary", amount: 5000, frequency: "monthly" as const, incomeType: "employment" as const }],
    expenses: [
      { id: "e1", category: "Rent/Mortgage Payment", amount: 1800 },
      { id: "e2", category: "Groceries", amount: 500 },
    ],
    assets: [
      { id: "a1", category: "Savings Account", amount: 20000, roi: 3 },
      { id: "a2", category: "TFSA", amount: 30000, roi: 5 },
    ],
    debts: [{ id: "d1", category: "Car Loan", amount: 12000, interestRate: 6 }],
    properties: [],
    stocks: [],
  };

  const caState: FinancialState = { ...sharedData, country: "CA", jurisdiction: "ON" };
  const auState: FinancialState = { ...sharedData, country: "AU", jurisdiction: "NSW" };
  const usState: FinancialState = { ...sharedData, country: "US", jurisdiction: "CA" };

  it("CA state uses CAD", () => {
    expect(computeTotals(caState).homeCurrency).toBe("CAD");
  });

  it("AU state uses AUD", () => {
    expect(computeTotals(auState).homeCurrency).toBe("AUD");
  });

  it("US state uses USD", () => {
    expect(computeTotals(usState).homeCurrency).toBe("USD");
  });

  it("income is preserved across all three country switches", () => {
    const caIncome = computeTotals(caState).monthlyIncome;
    const auIncome = computeTotals(auState).monthlyIncome;
    const usIncome = computeTotals(usState).monthlyIncome;
    expect(caIncome).toBe(5000);
    expect(auIncome).toBe(5000);
    expect(usIncome).toBe(5000);
  });

  it("expenses are preserved across all three country switches", () => {
    const caExp = computeTotals(caState).monthlyExpenses;
    const auExp = computeTotals(auState).monthlyExpenses;
    const usExp = computeTotals(usState).monthlyExpenses;
    expect(caExp).toBe(2300);
    expect(auExp).toBe(2300);
    expect(usExp).toBe(2300);
  });

  it("asset totals are preserved across all three country switches", () => {
    const caAssets = computeTotals(caState).totalAssets;
    const auAssets = computeTotals(auState).totalAssets;
    const usAssets = computeTotals(usState).totalAssets;
    expect(caAssets).toBe(50000);
    expect(auAssets).toBe(50000);
    expect(usAssets).toBe(50000);
  });

  it("debt totals are preserved across all three country switches", () => {
    const caDebts = computeTotals(caState).totalDebts;
    const auDebts = computeTotals(auState).totalDebts;
    const usDebts = computeTotals(usState).totalDebts;
    expect(caDebts).toBe(12000);
    expect(auDebts).toBe(12000);
    expect(usDebts).toBe(12000);
  });

  it("AU has 0 provincial/state tax; CA and US have positive provincial/state tax", () => {
    expect(computeTotals(auState).totalProvincialStateTax).toBe(0);
    expect(computeTotals(caState).totalProvincialStateTax).toBeGreaterThan(0);
    expect(computeTotals(usState).totalProvincialStateTax).toBeGreaterThan(0);
  });

  it("all three countries compute positive tax on $5k/mo income", () => {
    expect(computeTotals(caState).totalTaxEstimate).toBeGreaterThan(0);
    expect(computeTotals(auState).totalTaxEstimate).toBeGreaterThan(0);
    expect(computeTotals(usState).totalTaxEstimate).toBeGreaterThan(0);
  });

  it("getDefaultFilingStatus returns 'single' for all three countries", () => {
    expect(getDefaultFilingStatus("CA")).toBe("single");
    expect(getDefaultFilingStatus("AU")).toBe("single");
    expect(getDefaultFilingStatus("US")).toBe("single");
  });
});

// ─── Super contribution limits ─────────────────────────────────────────────────

describe("AU super contribution limits", () => {
  it("Super (Accumulation) concessional cap is $30,000/yr", () => {
    const limit = TAX_SHELTERED_LIMITS["Super (Accumulation)"];
    expect(limit).toBeDefined();
    expect(limit.annual).toBe(30000);
    expect(limit.country).toBe("AU");
  });

  it("Super (Pension Phase) non-concessional cap is $120,000/yr", () => {
    const limit = TAX_SHELTERED_LIMITS["Super (Pension Phase)"];
    expect(limit).toBeDefined();
    expect(limit.annual).toBe(120000);
    expect(limit.country).toBe("AU");
  });

  it("First Home Super Saver annual limit is $15,000/yr", () => {
    const limit = TAX_SHELTERED_LIMITS["First Home Super Saver"];
    expect(limit).toBeDefined();
    expect(limit.annual).toBe(15000);
    expect(limit.country).toBe("AU");
  });

  it("Super (Accumulation) is tax-sheltered", () => {
    expect(isTaxSheltered("Super (Accumulation)")).toBe(true);
  });

  it("Super (Pension Phase) is tax-sheltered", () => {
    expect(isTaxSheltered("Super (Pension Phase)")).toBe(true);
  });

  it("First Home Super Saver is tax-sheltered", () => {
    expect(isTaxSheltered("First Home Super Saver")).toBe(true);
  });

  it("Super (Accumulation) monthly limit is $2,500", () => {
    const monthly = getMonthlyLimit("Super (Accumulation)");
    expect(monthly).toBeCloseTo(2500, 0);
  });

  it("First Home Super Saver monthly limit is $1,250", () => {
    const monthly = getMonthlyLimit("First Home Super Saver");
    expect(monthly).toBeCloseTo(1250, 0);
  });

  it("Super limits are higher than CA TFSA ($7,000) and US IRA ($7,000)", () => {
    expect(TAX_SHELTERED_LIMITS["Super (Accumulation)"].annual).toBeGreaterThan(
      TAX_SHELTERED_LIMITS["TFSA"].annual,
    );
    expect(TAX_SHELTERED_LIMITS["Super (Accumulation)"].annual).toBeGreaterThan(
      TAX_SHELTERED_LIMITS["IRA"].annual,
    );
  });
});

// ─── Franking credit gross-up (refundable credits reduce tax) ─────────────────

describe("AU franking credit gross-up calculations", () => {
  const baseAUState: FinancialState = {
    country: "AU",
    jurisdiction: "NSW",
    income: [{ id: "i1", category: "Salary", amount: 6250, frequency: "monthly", incomeType: "employment" }],
    expenses: [],
    assets: [],
    debts: [],
    properties: [],
    stocks: [],
  };

  it("base AU state has positive tax estimate before any credits", () => {
    const totals = computeTotals(baseAUState);
    expect(totals.totalTaxEstimate).toBeGreaterThan(0);
  });

  it("adding a $1,000 franking credit reduces annual tax estimate", () => {
    const baseTax = computeTotals(baseAUState).totalTaxEstimate;
    const stateWithCredit: FinancialState = {
      ...baseAUState,
      taxCredits: [
        { id: "tc1", category: "Franking Credits (Dividend Imputation)", annualAmount: 1000, type: "refundable" },
      ] as TaxCredit[],
    };
    const creditTax = computeTotals(stateWithCredit).totalTaxEstimate;
    // Refundable credit reduces the bracket tax proportionally (Medicare Levy portion
    // is tracked in totalAnnualTax but not in finalTaxEstimate which uses federalTax only)
    expect(creditTax).toBeLessThan(baseTax);
    expect(baseTax - creditTax).toBeGreaterThan(500);  // meaningful reduction
    expect(baseTax - creditTax).toBeLessThan(1001);    // at most the credit amount
  });

  it("30% corporate tax: $700 net dividend grosses up to $1,000 ($300 imputation credit)", () => {
    // Formula: grossed-up = net / (1 - corporate_rate)
    const netDividend = 700;
    const corporateRate = 0.30;
    const grossedUp = netDividend / (1 - corporateRate);
    const frankingCredit = grossedUp - netDividend;

    // Verify the gross-up math
    expect(grossedUp).toBeCloseTo(1000, 1);
    expect(frankingCredit).toBeCloseTo(300, 1);

    // Adding the $300 refundable credit reduces the tax estimate
    const baseTax = computeTotals(baseAUState).totalTaxEstimate;
    const stateWithCredit: FinancialState = {
      ...baseAUState,
      taxCredits: [
        {
          id: "tc1",
          category: "Franking Credits (Dividend Imputation)",
          annualAmount: Math.round(frankingCredit),
          type: "refundable",
        },
      ] as TaxCredit[],
    };
    const creditTax = computeTotals(stateWithCredit).totalTaxEstimate;
    // Tax is reduced — the credit proportionally reduces the bracket portion
    expect(creditTax).toBeLessThan(baseTax);
    expect(baseTax - creditTax).toBeGreaterThan(100); // meaningful reduction
  });

  it("large franking credit reduces tax to 0 (refundable — excess is a cash refund)", () => {
    const stateWithLargeCredit: FinancialState = {
      ...baseAUState,
      taxCredits: [
        { id: "tc1", category: "Franking Credits (Dividend Imputation)", annualAmount: 100000, type: "refundable" },
      ] as TaxCredit[],
    };
    const totals = computeTotals(stateWithLargeCredit);
    // Tax estimate floors at 0 (the actual refund is handled separately)
    expect(totals.totalTaxEstimate).toBe(0);
  });

  it("credit benefit is tracked in totalCreditBenefit", () => {
    const creditAmount = 2000;
    const stateWithCredit: FinancialState = {
      ...baseAUState,
      taxCredits: [
        { id: "tc1", category: "Franking Credits (Dividend Imputation)", annualAmount: creditAmount, type: "refundable" },
      ] as TaxCredit[],
    };
    const totals = computeTotals(stateWithCredit);
    // totalCreditBenefit should reflect the applied credit
    expect(totals.totalCreditBenefit).toBeGreaterThan(0);
    expect(totals.totalCreditBenefit).toBeLessThanOrEqual(creditAmount);
  });

  it("franking credits only appear in AU; CA/US states compute without them", () => {
    // Verify base computation works for CA and US (no franking credits needed)
    const caState: FinancialState = { ...baseAUState, country: "CA", jurisdiction: "ON" };
    const usState: FinancialState = { ...baseAUState, country: "US", jurisdiction: "NY" };
    expect(computeTotals(caState).totalTaxEstimate).toBeGreaterThan(0);
    expect(computeTotals(usState).totalTaxEstimate).toBeGreaterThan(0);
  });
});

// ─── CA/US regression — AU additions must not break CA/US ─────────────────────

describe("CA/US regression after AU validation additions", () => {
  it("CA profiles still compute correctly with CAD currency", () => {
    const profiles = getProfilesForCountry("CA");
    for (const profile of profiles) {
      const totals = computeTotals(profile.state);
      expect(totals.homeCurrency).toBe("CAD");
      expect(totals.monthlyIncome).toBeGreaterThan(0);
      expect(totals.totalTaxEstimate).toBeGreaterThan(0);
      expect(totals.totalProvincialStateTax).toBeGreaterThan(0);
    }
  });

  it("US profiles still compute correctly with USD currency", () => {
    const profiles = getProfilesForCountry("US");
    for (const profile of profiles) {
      const totals = computeTotals(profile.state);
      expect(totals.homeCurrency).toBe("USD");
      expect(totals.monthlyIncome).toBeGreaterThan(0);
      expect(totals.totalTaxEstimate).toBeGreaterThan(0);
    }
  });

  it("getProfilesForCountry returns 3 profiles for each country", () => {
    expect(getProfilesForCountry("CA")).toHaveLength(3);
    expect(getProfilesForCountry("US")).toHaveLength(3);
    expect(getProfilesForCountry("AU")).toHaveLength(3);
  });
});
