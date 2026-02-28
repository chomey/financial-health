/**
 * Tax Computation Engine
 *
 * Computes federal + provincial/state tax for both Canadian and US residents.
 * Handles employment income, capital gains, and other income types.
 */

import {
  calculateProgressiveTax,
  calculateCanadianCapitalGainsInclusion,
  getCanadianBrackets,
  getUSBrackets,
  US_CAPITAL_GAINS_2025,
  type BracketTable,
} from "./tax-tables";

export interface TaxResult {
  federalTax: number;
  provincialStateTax: number;
  totalTax: number;
  effectiveRate: number;
  afterTaxIncome: number;
  marginalRate: number;
}

export type IncomeType = "employment" | "capital-gains" | "other";

/**
 * Calculate the marginal rate for a given income level in a bracket table.
 * Returns the rate of the bracket that the income falls into.
 */
function getMarginalRate(taxableIncome: number, table: BracketTable): number {
  if (taxableIncome <= 0) return 0;
  for (const bracket of table.brackets) {
    if (taxableIncome <= bracket.max) {
      return bracket.rate;
    }
  }
  // Should not reach here if brackets end with Infinity
  const last = table.brackets[table.brackets.length - 1];
  return last?.rate ?? 0;
}

/**
 * Calculate US federal tax with the standard deduction applied as a deduction
 * (subtracted from gross income), NOT as a credit like Canadian BPA.
 */
function calculateUSFederalTax(grossIncome: number, table: BracketTable): number {
  const taxableIncome = Math.max(0, grossIncome - table.basicPersonalAmount);
  if (taxableIncome <= 0) return 0;

  // Calculate tax on the taxable income (after deduction) using raw brackets
  // without the BPA credit logic in calculateProgressiveTax
  let tax = 0;
  for (const bracket of table.brackets) {
    if (taxableIncome <= bracket.min) break;
    const taxableInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
    tax += taxableInBracket * bracket.rate;
  }
  return Math.max(0, tax);
}

/**
 * Get the marginal rate for US federal tax (after standard deduction).
 */
function getUSFederalMarginalRate(grossIncome: number, table: BracketTable): number {
  const taxableIncome = Math.max(0, grossIncome - table.basicPersonalAmount);
  return getMarginalRate(taxableIncome, table);
}

/**
 * Compute tax for a given annual income.
 *
 * @param annualIncome - Gross annual income (before any deductions)
 * @param incomeType - Type of income: "employment", "capital-gains", or "other"
 * @param country - "CA" for Canada or "US" for United States
 * @param jurisdiction - Province/territory code (e.g., "ON") or state code (e.g., "CA")
 * @returns TaxResult with federal, provincial/state, total tax, rates, and after-tax income
 */
export function computeTax(
  annualIncome: number,
  incomeType: IncomeType,
  country: "CA" | "US",
  jurisdiction: string
): TaxResult {
  if (annualIncome <= 0) {
    return {
      federalTax: 0,
      provincialStateTax: 0,
      totalTax: 0,
      effectiveRate: 0,
      afterTaxIncome: 0,
      marginalRate: 0,
    };
  }

  if (country === "CA") {
    return computeCanadianTax(annualIncome, incomeType, jurisdiction);
  } else {
    return computeUSTax(annualIncome, incomeType, jurisdiction);
  }
}

function computeCanadianTax(
  annualIncome: number,
  incomeType: IncomeType,
  province: string
): TaxResult {
  const { federal, provincial } = getCanadianBrackets(province);

  let taxableIncome: number;
  if (incomeType === "capital-gains") {
    // Capital gains: apply inclusion rate, then tax at normal rates
    taxableIncome = calculateCanadianCapitalGainsInclusion(annualIncome);
  } else {
    // Employment and other income: taxed at full amount
    taxableIncome = annualIncome;
  }

  const federalTax = calculateProgressiveTax(taxableIncome, federal);
  const provincialTax = calculateProgressiveTax(taxableIncome, provincial);
  const totalTax = federalTax + provincialTax;

  // Marginal rate: combined federal + provincial rate at the taxable income level
  const federalMarginal = getMarginalRate(taxableIncome, federal);
  const provincialMarginal = getMarginalRate(taxableIncome, provincial);
  let marginalRate = federalMarginal + provincialMarginal;

  // For capital gains, the marginal rate is reduced by the inclusion rate
  if (incomeType === "capital-gains") {
    // The effective marginal rate on capital gains depends on how much
    // of the next dollar is included. If total gains <= $250k, 50% inclusion;
    // above that, 66.67% inclusion.
    const inclusionRate = annualIncome <= 250_000 ? 0.5 : 2 / 3;
    marginalRate *= inclusionRate;
  }

  const effectiveRate = annualIncome > 0 ? totalTax / annualIncome : 0;
  const afterTaxIncome = annualIncome - totalTax;

  return {
    federalTax,
    provincialStateTax: provincialTax,
    totalTax,
    effectiveRate,
    afterTaxIncome,
    marginalRate,
  };
}

function computeUSTax(
  annualIncome: number,
  incomeType: IncomeType,
  state: string
): TaxResult {
  const { federal, state: stateTable } = getUSBrackets(state);

  if (incomeType === "capital-gains") {
    return computeUSCapitalGainsTax(annualIncome, federal, stateTable);
  }

  // Employment / other income: apply standard deduction for federal
  const federalTax = calculateUSFederalTax(annualIncome, federal);

  // State tax: most states don't have a standard deduction in our tables
  // (basicPersonalAmount = 0), so calculateProgressiveTax works directly.
  // States with no income tax have empty brackets and return 0.
  const stateTax = stateTable.brackets.length > 0
    ? calculateProgressiveTax(annualIncome, stateTable)
    : 0;

  const totalTax = federalTax + stateTax;
  const effectiveRate = annualIncome > 0 ? totalTax / annualIncome : 0;
  const afterTaxIncome = annualIncome - totalTax;

  const federalMarginal = getUSFederalMarginalRate(annualIncome, federal);
  const stateMarginal = stateTable.brackets.length > 0
    ? getMarginalRate(annualIncome, stateTable)
    : 0;
  const marginalRate = federalMarginal + stateMarginal;

  return {
    federalTax,
    provincialStateTax: stateTax,
    totalTax,
    effectiveRate,
    afterTaxIncome,
    marginalRate,
  };
}

function computeUSCapitalGainsTax(
  capitalGains: number,
  federal: BracketTable,
  stateTable: BracketTable
): TaxResult {
  // US long-term capital gains use their own bracket table
  const federalTax = calculateProgressiveTax(capitalGains, US_CAPITAL_GAINS_2025);

  // Most states tax capital gains as ordinary income
  const stateTax = stateTable.brackets.length > 0
    ? calculateProgressiveTax(capitalGains, stateTable)
    : 0;

  const totalTax = federalTax + stateTax;
  const effectiveRate = capitalGains > 0 ? totalTax / capitalGains : 0;
  const afterTaxIncome = capitalGains - totalTax;

  const federalMarginal = getMarginalRate(capitalGains, US_CAPITAL_GAINS_2025);
  const stateMarginal = stateTable.brackets.length > 0
    ? getMarginalRate(capitalGains, stateTable)
    : 0;
  const marginalRate = federalMarginal + stateMarginal;

  return {
    federalTax,
    provincialStateTax: stateTax,
    totalTax,
    effectiveRate,
    afterTaxIncome,
    marginalRate,
  };
}
