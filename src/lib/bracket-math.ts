/**
 * Shared bracket math types and helpers used across all country tax engines.
 */

export interface TaxBracket {
  min: number;
  max: number;
  rate: number;
}

export interface BracketTable {
  brackets: TaxBracket[];
  basicPersonalAmount: number;
}

/**
 * Calculate tax using progressive brackets.
 * Applies the basic personal amount as a non-refundable credit at the lowest rate.
 */
export function calculateProgressiveTax(
  taxableIncome: number,
  table: BracketTable
): number {
  if (taxableIncome <= 0) return 0;

  let tax = 0;
  for (const bracket of table.brackets) {
    if (taxableIncome <= bracket.min) break;
    const taxableInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
    tax += taxableInBracket * bracket.rate;
  }

  // Basic personal amount credit: reduces tax by BPA × lowest bracket rate
  const lowestRate = table.brackets[0]?.rate ?? 0;
  const bpaCredit = table.basicPersonalAmount * lowestRate;
  return Math.max(0, tax - bpaCredit);
}

/**
 * Return the rate of the bracket that the income falls into.
 */
export function getMarginalRate(taxableIncome: number, table: BracketTable): number {
  if (taxableIncome <= 0) return 0;
  for (const bracket of table.brackets) {
    if (taxableIncome <= bracket.max) {
      return bracket.rate;
    }
  }
  const last = table.brackets[table.brackets.length - 1];
  return last?.rate ?? 0;
}

/**
 * Walk the brackets and return per-bracket segments with the amount and tax
 * that falls inside each one. Used to render the tax-explainer visualisation.
 * Pass `taxableIncome: 0` to get a reference rendering (all amounts zero).
 */
export function buildBracketSegments(
  taxableIncome: number,
  table: BracketTable,
): { min: number; max: number; rate: number; amountInBracket: number; taxInBracket: number }[] {
  return table.brackets.map((bracket) => {
    if (taxableIncome <= bracket.min) {
      return { min: bracket.min, max: bracket.max, rate: bracket.rate, amountInBracket: 0, taxInBracket: 0 };
    }
    const amountInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
    return {
      min: bracket.min,
      max: bracket.max,
      rate: bracket.rate,
      amountInBracket,
      taxInBracket: amountInBracket * bracket.rate,
    };
  });
}
