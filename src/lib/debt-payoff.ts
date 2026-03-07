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

// ─── Multi-debt strategy comparison ───────────────────────────────────────────

export interface DebtForStrategy {
  category: string;
  balance: number;
  /** Annual interest rate in percent (e.g. 19.9 for 19.9%) */
  annualRate: number;
  /** Current monthly payment ($) */
  monthlyPayment: number;
}

export interface StrategyResult {
  /** Total months until all debts are paid off */
  totalMonths: number;
  /** Total interest paid across all debts */
  totalInterestPaid: number;
  /** Human-readable payoff duration */
  payoffDuration: string;
}

export interface DebtStrategyComparison {
  avalanche: StrategyResult;
  snowball: StrategyResult;
  current: StrategyResult;
  /** Interest saved vs current strategy using avalanche (positive = savings) */
  avalancheInterestSavings: number;
  /** Months saved vs current strategy using avalanche (positive = faster) */
  avalancheMonthsSaved: number;
  /** Interest saved vs current strategy using snowball (positive = savings) */
  snowballInterestSavings: number;
  /** Months saved vs current strategy using snowball (positive = faster) */
  snowballMonthsSaved: number;
}

/**
 * Simulate the "current" strategy: each debt is paid with its fixed monthly payment,
 * no reallocation when a debt is paid off. Total months = when the last debt is paid off.
 */
function simulateCurrent(debts: DebtForStrategy[]): StrategyResult {
  const eligible = debts.filter((d) => d.balance > 0 && d.monthlyPayment > 0);
  if (eligible.length === 0) {
    return { totalMonths: 0, totalInterestPaid: 0, payoffDuration: "Paid off" };
  }

  let totalInterest = 0;
  let maxMonths = 0;

  for (const debt of eligible) {
    const result = calculateDebtPayoff(debt.balance, debt.annualRate, debt.monthlyPayment);
    if (!isFinite(result.months)) {
      return { totalMonths: Infinity, totalInterestPaid: Infinity, payoffDuration: "Never" };
    }
    totalInterest += result.totalInterest;
    if (result.months > maxMonths) maxMonths = result.months;
  }

  return {
    totalMonths: maxMonths,
    totalInterestPaid: Math.round(totalInterest * 100) / 100,
    payoffDuration: formatDuration(maxMonths),
  };
}

/**
 * Simulate avalanche or snowball strategy with payment reallocation.
 * When a debt is paid off its freed-up payment is redirected to the next target debt.
 * @param debts Eligible debts (balance > 0, payment > 0)
 * @param order Indices into `debts` specifying the payoff order (first = highest priority)
 */
function simulateWithRedistribution(debts: DebtForStrategy[], order: number[]): StrategyResult {
  if (order.length === 0) {
    return { totalMonths: 0, totalInterestPaid: 0, payoffDuration: "Paid off" };
  }

  const monthlyRate = debts.map((d) => d.annualRate / 100 / 12);
  const balances = debts.map((d) => d.balance);
  const minimums = debts.map((d) => d.monthlyPayment);
  const totalBudget = minimums.reduce((s, p) => s + p, 0);

  let totalInterest = 0;
  let month = 0;
  const maxMonths = 1200;

  // We work through the order list — the first unpaid debt in order is the "target"
  const remaining = [...order];

  while (month < maxMonths && remaining.length > 0) {
    month++;

    // Apply interest to all active debts
    for (const idx of remaining) {
      if (balances[idx] > 0.005) {
        const interest = balances[idx] * monthlyRate[idx];
        totalInterest += interest;
        balances[idx] += interest;
      }
    }

    // Pay minimums on all non-target debts; put the rest into the target
    const targetIdx = remaining[0];
    let budget = totalBudget;

    for (let i = 1; i < remaining.length; i++) {
      const idx = remaining[i];
      if (balances[idx] <= 0.005) continue;
      const pay = Math.min(minimums[idx], balances[idx]);
      balances[idx] -= pay;
      budget -= pay;
    }

    // Put all remaining budget into target
    if (budget > 0 && balances[targetIdx] > 0.005) {
      balances[targetIdx] -= budget;
      if (balances[targetIdx] < 0) balances[targetIdx] = 0;
    }

    // Remove fully paid debts from remaining list (front to back)
    while (remaining.length > 0 && balances[remaining[0]] <= 0.005) {
      remaining.shift();
    }
  }

  return {
    totalMonths: month,
    totalInterestPaid: Math.round(totalInterest * 100) / 100,
    payoffDuration: formatDuration(month),
  };
}

/**
 * Compare three debt payoff strategies for a set of debts:
 * - **Avalanche**: pay off highest interest rate first (minimizes total interest)
 * - **Snowball**: pay off smallest balance first (builds momentum)
 * - **Current**: each debt pays its own fixed payment, no reallocation
 *
 * Returns interest and time savings for avalanche and snowball vs the current strategy.
 * Requires at least 2 debts with balance, interest rate, and monthly payment set.
 * Returns null if the comparison cannot be made (e.g. all debts have zero payment).
 */
export function compareDebtStrategies(debts: DebtForStrategy[]): DebtStrategyComparison | null {
  const eligible = debts.filter(
    (d) => d.balance > 0 && d.monthlyPayment > 0 && d.annualRate >= 0
  );
  if (eligible.length < 2) return null;

  // Check any debt payment doesn't cover interest — if so, comparison is meaningless
  for (const d of eligible) {
    const monthlyInterest = d.balance * (d.annualRate / 100 / 12);
    if (d.monthlyPayment <= monthlyInterest) return null;
  }

  // Avalanche order: highest interest rate first
  const avalancheOrder = eligible
    .map((_, i) => i)
    .sort((a, b) => eligible[b].annualRate - eligible[a].annualRate);

  // Snowball order: smallest balance first
  const snowballOrder = eligible
    .map((_, i) => i)
    .sort((a, b) => eligible[a].balance - eligible[b].balance);

  const current = simulateCurrent(eligible);
  const avalanche = simulateWithRedistribution(eligible, avalancheOrder);
  const snowball = simulateWithRedistribution(eligible, snowballOrder);

  if (!isFinite(current.totalMonths) || !isFinite(avalanche.totalMonths) || !isFinite(snowball.totalMonths)) {
    return null;
  }

  return {
    avalanche,
    snowball,
    current,
    avalancheInterestSavings: Math.round((current.totalInterestPaid - avalanche.totalInterestPaid) * 100) / 100,
    avalancheMonthsSaved: current.totalMonths - avalanche.totalMonths,
    snowballInterestSavings: Math.round((current.totalInterestPaid - snowball.totalInterestPaid) * 100) / 100,
    snowballMonthsSaved: current.totalMonths - snowball.totalMonths,
  };
}
