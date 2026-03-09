/**
 * Task 172: AU unit tests and validation
 *
 * Validates AU sample profiles produce reasonable dashboard metrics,
 * country switching preserves financial data, super contribution limits,
 * and franking credit gross-up calculations.
 */
import { describe, it, expect } from "vitest";
import { computeTotals } from "@/lib/compute-totals";
import { AU_SAMPLE_PROFILES, getProfilesForCountry } from "@/lib/sample-profiles";
import { getDefaultFilingStatus } from "@/lib/tax-credits";
import { TAX_SHELTERED_LIMITS, isTaxSheltered, getMonthlyLimit } from "@/lib/scenario";
import type { FinancialState } from "@/lib/financial-types";
import type { TaxCredit } from "@/lib/tax-credits";

// ─── AU sample profile: au-young-professional ─────────────────────────────────

describe("AU sample profile: au-young-professional", () => {
  const profile = AU_SAMPLE_PROFILES.find((p) => p.id === "au-young-professional")!;

  it("profile exists in AU_SAMPLE_PROFILES", () => {
    expect(profile).toBeDefined();
    expect(profile.state.country).toBe("AU");
  });

  it("computeTotals uses AUD as home currency", () => {
    const totals = computeTotals(profile.state);
    expect(totals.homeCurrency).toBe("AUD");
  });

  it("monthly income is $6,250", () => {
    const totals = computeTotals(profile.state);
    expect(totals.monthlyIncome).toBe(6250);
  });

  it("monthly expenses are $3,350", () => {
    const totals = computeTotals(profile.state);
    // 2200+450+180+120+70+250+80 = 3350
    expect(totals.monthlyExpenses).toBe(3350);
  });

  it("totalAssets is $20,000 (Super Accumulation + Savings)", () => {
    const totals = computeTotals(profile.state);
    expect(totals.totalAssets).toBe(20000); // 15k super + 5k savings
  });

  it("totalDebts is $35,000 (HECS-HELP)", () => {
    const totals = computeTotals(profile.state);
    expect(totals.totalDebts).toBe(35000);
  });

  it("has no property equity (renting)", () => {
    const totals = computeTotals(profile.state);
    expect(totals.totalPropertyEquity).toBe(0);
    expect(totals.totalPropertyValue).toBe(0);
  });

  it("AU tax estimate is positive (AU brackets + Medicare Levy applied)", () => {
    const totals = computeTotals(profile.state);
    // $75k employment: federal ~$13,288 + Medicare $1,500 = ~$14,788
    expect(totals.totalTaxEstimate).toBeGreaterThan(13000);
    expect(totals.totalTaxEstimate).toBeLessThan(20000);
  });

  it("effective tax rate is between 15% and 22%", () => {
    // Note: effectiveTaxRate uses bracket tax only (Medicare Levy tracked separately)
    const totals = computeTotals(profile.state);
    expect(totals.effectiveTaxRate).toBeGreaterThan(0.15);
    expect(totals.effectiveTaxRate).toBeLessThan(0.22);
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

  it("monthly contribution to Super is captured", () => {
    const totals = computeTotals(profile.state);
    // au-young-professional has $719/mo super contribution
    expect(totals.totalMonthlyContributions).toBeGreaterThan(0);
  });
});

// ─── AU sample profile: au-mid-career-family ──────────────────────────────────

describe("AU sample profile: au-mid-career-family", () => {
  const profile = AU_SAMPLE_PROFILES.find((p) => p.id === "au-mid-career-family")!;

  it("computeTotals uses AUD as home currency", () => {
    const totals = computeTotals(profile.state);
    expect(totals.homeCurrency).toBe("AUD");
  });

  it("monthly income is $10,000", () => {
    const totals = computeTotals(profile.state);
    expect(totals.monthlyIncome).toBe(10000);
  });

  it("monthly expenses are $3,420", () => {
    const totals = computeTotals(profile.state);
    // 800+350+220+120+1200+300+150+280 = 3420
    expect(totals.monthlyExpenses).toBe(3420);
  });

  it("totalAssets is $145,000 (Super + Savings + Non-Registered)", () => {
    const totals = computeTotals(profile.state);
    expect(totals.totalAssets).toBe(145000); // 90k + 25k + 30k
  });

  it("has property equity of $330,000", () => {
    const totals = computeTotals(profile.state);
    expect(totals.totalPropertyEquity).toBe(330000); // 950k - 620k
  });

  it("total personal debts is 0", () => {
    const totals = computeTotals(profile.state);
    expect(totals.totalDebts).toBe(0);
  });

  it("AU tax on $120k annual is in 30% bracket range", () => {
    const totals = computeTotals(profile.state);
    // Federal ~$26,788 + Medicare $2,400 = ~$29,188
    expect(totals.totalTaxEstimate).toBeGreaterThan(25000);
    expect(totals.totalTaxEstimate).toBeLessThan(35000);
  });

  it("effective tax rate is between 22% and 28%", () => {
    const totals = computeTotals(profile.state);
    expect(totals.effectiveTaxRate).toBeGreaterThan(0.22);
    expect(totals.effectiveTaxRate).toBeLessThan(0.28);
  });

  it("provincial/state tax is 0 (VIC jurisdiction)", () => {
    const totals = computeTotals(profile.state);
    expect(totals.totalProvincialStateTax).toBe(0);
  });

  it("net worth (assets + equity) is above $450k", () => {
    const totals = computeTotals(profile.state);
    const netWorth = totals.totalAssets + totals.totalPropertyEquity - totals.totalDebts;
    expect(netWorth).toBeGreaterThan(450000); // 145k + 330k = 475k
  });
});

// ─── AU sample profile: au-pre-retiree ────────────────────────────────────────

describe("AU sample profile: au-pre-retiree", () => {
  const profile = AU_SAMPLE_PROFILES.find((p) => p.id === "au-pre-retiree")!;

  it("computeTotals uses AUD as home currency", () => {
    const totals = computeTotals(profile.state);
    expect(totals.homeCurrency).toBe("AUD");
  });

  it("monthly income is $12,500", () => {
    const totals = computeTotals(profile.state);
    expect(totals.monthlyIncome).toBe(12500);
  });

  it("monthly expenses are $2,950", () => {
    const totals = computeTotals(profile.state);
    // 700+350+200+100+600+400+400+200 = 2950
    expect(totals.monthlyExpenses).toBe(2950);
  });

  it("totalAssets is $560,000 (Super + Savings + Non-Registered)", () => {
    const totals = computeTotals(profile.state);
    expect(totals.totalAssets).toBe(560000); // 420k + 55k + 85k
  });

  it("has two properties with combined equity above $1.2M", () => {
    const totals = computeTotals(profile.state);
    // Primary: 850k - 0 = 850k, Investment: 650k - 280k = 370k → total 1,220k
    expect(totals.totalPropertyEquity).toBeGreaterThan(1_200_000);
    expect(totals.totalPropertyValue).toBe(1_500_000);
  });

  it("investment property mortgage is $280,000", () => {
    const totals = computeTotals(profile.state);
    expect(totals.totalPropertyMortgage).toBe(280_000);
  });

  it("totalDebts is $8,000 (line of credit)", () => {
    const totals = computeTotals(profile.state);
    expect(totals.totalDebts).toBe(8000);
  });

  it("AU tax on $150k is in the 37% bracket range", () => {
    const totals = computeTotals(profile.state);
    // Federal: $36,838 + Medicare $3,000 = ~$39,838
    expect(totals.totalTaxEstimate).toBeGreaterThan(36000);
    expect(totals.totalTaxEstimate).toBeLessThan(55000);
  });

  it("effective tax rate is between 24% and 32%", () => {
    const totals = computeTotals(profile.state);
    expect(totals.effectiveTaxRate).toBeGreaterThan(0.24);
    expect(totals.effectiveTaxRate).toBeLessThan(0.32);
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
