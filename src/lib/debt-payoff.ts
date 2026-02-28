/**
 * Debt payoff calculation utilities using standard amortization math.
 */

export interface DebtPayoffResult {
  /** Total months to pay off the debt, or Infinity if payment doesn't cover interest */
  months: number;
  /** Total interest paid over the life of the loan */
  totalInterest: number;
  /** Whether the monthly payment covers the monthly interest */
  coversInterest: boolean;
  /** Human-readable payoff duration (e.g., "4 years 2 months") */
  payoffDuration: string;
}

/**
 * Calculate the payoff timeline for a debt given its balance, annual interest rate,
 * and monthly payment amount.
 *
 * Uses standard amortization: each month, apply monthly interest (rate/12) to the
 * balance, then subtract the payment. Iterate until balance reaches 0.
 *
 * @param balance - Current debt balance ($)
 * @param annualRate - Annual interest rate (%, e.g., 19.9 for 19.9%)
 * @param monthlyPayment - Monthly payment amount ($)
 * @returns PayoffResult with months, total interest, and whether payment covers interest
 */
export function calculateDebtPayoff(
  balance: number,
  annualRate: number,
  monthlyPayment: number
): DebtPayoffResult {
  if (balance <= 0) {
    return { months: 0, totalInterest: 0, coversInterest: true, payoffDuration: "Paid off" };
  }

  if (monthlyPayment <= 0) {
    return { months: Infinity, totalInterest: Infinity, coversInterest: false, payoffDuration: "No payment set" };
  }

  const monthlyRate = annualRate / 100 / 12;
  const monthlyInterest = balance * monthlyRate;

  // If payment doesn't cover interest, the balance will grow forever
  if (monthlyPayment <= monthlyInterest) {
    return {
      months: Infinity,
      totalInterest: Infinity,
      coversInterest: false,
      payoffDuration: "Payment doesn\u2019t cover interest",
    };
  }

  // If no interest, simple division
  if (annualRate === 0) {
    const months = Math.ceil(balance / monthlyPayment);
    return {
      months,
      totalInterest: 0,
      coversInterest: true,
      payoffDuration: formatDuration(months),
    };
  }

  // Iterate month by month
  let remaining = balance;
  let totalInterest = 0;
  let months = 0;
  const maxMonths = 1200; // 100-year cap to prevent infinite loops

  while (remaining > 0.01 && months < maxMonths) {
    const interest = remaining * monthlyRate;
    totalInterest += interest;
    remaining = remaining + interest - monthlyPayment;
    months++;

    // If last payment overshoots, clamp
    if (remaining < 0) {
      remaining = 0;
    }
  }

  return {
    months,
    totalInterest: Math.round(totalInterest * 100) / 100,
    coversInterest: true,
    payoffDuration: formatDuration(months),
  };
}

/**
 * Format a number of months as a human-readable duration string.
 */
export function formatDuration(totalMonths: number): string {
  if (totalMonths <= 0) return "Paid off";
  if (!isFinite(totalMonths)) return "Never";

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  if (years === 0) {
    return months === 1 ? "1 month" : `${months} months`;
  }
  if (months === 0) {
    return years === 1 ? "1 year" : `${years} years`;
  }

  const yearStr = years === 1 ? "1 year" : `${years} years`;
  const monthStr = months === 1 ? "1 month" : `${months} months`;
  return `${yearStr} ${monthStr}`;
}

/**
 * Format a currency value for display in payoff summaries.
 */
export function formatPayoffCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}
