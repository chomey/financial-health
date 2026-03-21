/**
 * Required Minimum Distributions (RMD) for US and RRIF minimums for Canada.
 *
 * US: RMDs required from 401k/Traditional IRA starting at age 73 (SECURE 2.0 Act).
 * CA: RRSP must convert to RRIF by end of year turning 71. RRIF minimum withdrawals start at 72.
 *
 * These are the minimum percentages that MUST be withdrawn each year.
 */

// ── US RMD Table (Uniform Lifetime Table, IRS Publication 590-B) ─────────────
// Maps age to the distribution period (divisor). RMD = balance / divisor.
// Percentage = 1 / divisor × 100.

const US_RMD_DIVISORS: Record<number, number> = {
  73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0, 79: 21.1, 80: 20.2,
  81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8, 85: 16.0, 86: 15.2, 87: 14.4, 88: 13.7,
  89: 12.9, 90: 12.2, 91: 11.5, 92: 10.8, 93: 10.1, 94: 9.5, 95: 8.9, 96: 8.4,
  97: 7.8, 98: 7.3, 99: 6.8, 100: 6.4, 101: 6.0, 102: 5.6, 103: 5.2, 104: 4.9,
  105: 4.6, 106: 4.3, 107: 4.1, 108: 3.9, 109: 3.7, 110: 3.5, 111: 3.4, 112: 3.3,
  113: 3.1, 114: 3.0, 115: 2.9, 116: 2.8, 117: 2.7, 118: 2.5, 119: 2.3, 120: 2.0,
};

/** US RMD start age (SECURE 2.0 Act, born 1960+) */
export const US_RMD_START_AGE = 73;

/** CA RRIF conversion deadline — must convert RRSP to RRIF by end of year turning 71 */
export const CA_RRIF_CONVERSION_AGE = 71;

// ── CA RRIF Minimum Withdrawal Table ─────────────────────────────────────────
// Minimum percentage of RRIF balance that must be withdrawn each year.
// Based on CRA prescribed factors.

const CA_RRIF_MINIMUMS: Record<number, number> = {
  // Under 71: 1/(90-age) formula
  72: 5.40, 73: 5.53, 74: 5.67, 75: 5.82, 76: 5.98, 77: 6.17, 78: 6.36, 79: 6.58,
  80: 6.82, 81: 7.08, 82: 7.38, 83: 7.71, 84: 8.08, 85: 8.51, 86: 8.99, 87: 9.55,
  88: 10.21, 89: 10.99, 90: 11.92, 91: 13.06, 92: 14.49, 93: 16.34, 94: 18.79,
  95: 20.00, // 20% minimum for 95+
};

/**
 * Get US RMD percentage for a given age.
 * Returns 0 if below RMD start age.
 */
export function getUsRmdPercent(age: number): number {
  if (age < US_RMD_START_AGE) return 0;
  const divisor = US_RMD_DIVISORS[Math.min(age, 120)];
  if (!divisor) return 0;
  return (1 / divisor) * 100;
}

/**
 * Get CA RRIF minimum withdrawal percentage for a given age.
 * Returns 0 if below RRIF conversion age.
 */
export function getCaRrifPercent(age: number): number {
  if (age < CA_RRIF_CONVERSION_AGE) return 0;
  // Under 72: formula 1/(90-age)
  if (age === 71) return (1 / (90 - 71)) * 100; // ~5.26%
  if (age >= 95) return 20.0;
  return CA_RRIF_MINIMUMS[age] ?? 0;
}

/**
 * Compute the annual minimum required distribution for a given account.
 * @param balance - Current account balance
 * @param age - Current age of the account holder
 * @param country - "CA" or "US"
 * @param category - Account category name (to determine if RMD/RRIF applies)
 * @returns Annual minimum withdrawal amount, or 0 if not applicable
 */
export function computeRequiredMinimumDistribution(
  balance: number,
  age: number,
  country: "CA" | "US" | "AU",
  category: string,
): number {
  if (balance <= 0 || age <= 0) return 0;

  const lower = category.toLowerCase();

  if (country === "US") {
    // RMD applies to 401k, Traditional IRA, 403b, 457 (not Roth IRA, not Roth 401k)
    if (
      (lower.includes("401k") || lower.includes("ira") || lower.includes("403b") || lower.includes("457")) &&
      !lower.includes("roth")
    ) {
      const pct = getUsRmdPercent(age);
      return balance * pct / 100;
    }
  }

  if (country === "CA") {
    // RRIF minimum applies to RRSP (converted to RRIF) and LIRA (converted to LIF)
    if (lower.includes("rrsp") || lower.includes("lira") || lower.includes("rrif") || lower.includes("lif")) {
      const pct = getCaRrifPercent(age);
      return balance * pct / 100;
    }
  }

  // AU: No equivalent forced withdrawal mechanism
  return 0;
}

export interface RmdSummary {
  /** Account category */
  category: string;
  /** Current balance */
  balance: number;
  /** Minimum annual withdrawal required */
  annualMinimum: number;
  /** Minimum percentage */
  percent: number;
  /** Country-specific rule name */
  ruleName: string;
}

/**
 * Get RMD/RRIF summary for all applicable accounts.
 */
export function getRmdSummaries(
  accounts: { category: string; amount: number }[],
  age: number,
  country: "CA" | "US" | "AU",
): RmdSummary[] {
  const summaries: RmdSummary[] = [];

  for (const acct of accounts) {
    const annual = computeRequiredMinimumDistribution(acct.amount, age, country, acct.category);
    if (annual > 0) {
      const pct = (annual / acct.amount) * 100;
      summaries.push({
        category: acct.category,
        balance: acct.amount,
        annualMinimum: annual,
        percent: pct,
        ruleName: country === "CA" ? "RRIF minimum" : "RMD",
      });
    }
  }

  return summaries;
}
