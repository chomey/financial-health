/**
 * Required Minimum Distributions (RMD) for US and RRIF minimums for Canada.
 *
 * Country-specific tables and rules live in each country plugin's `rmd` field
 * (see `src/lib/countries/<country>/rmd.ts`). This file is a thin shim plus
 * the cross-country summary helper used by the dashboard.
 */

import { getCountry, type CountryCode } from "@/lib/countries";

export { US_RMD_START_AGE, getUsRmdPercent } from "@/lib/countries/usa/rmd";
export { CA_RRIF_CONVERSION_AGE, getCaRrifPercent } from "@/lib/countries/canada/rmd";

/**
 * Compute the annual minimum required distribution for a given account.
 * Returns 0 if not applicable to the account category.
 */
export function computeRequiredMinimumDistribution(
  balance: number,
  age: number,
  country: CountryCode,
  category: string,
): number {
  return getCountry(country).rmd.computeRmd(balance, age, category);
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
  country: CountryCode,
): RmdSummary[] {
  const rule = getCountry(country).rmd;
  const summaries: RmdSummary[] = [];

  for (const acct of accounts) {
    const annual = rule.computeRmd(acct.amount, age, acct.category);
    if (annual > 0) {
      const pct = (annual / acct.amount) * 100;
      summaries.push({
        category: acct.category,
        balance: acct.amount,
        annualMinimum: annual,
        percent: pct,
        ruleName: rule.ruleName,
      });
    }
  }

  return summaries;
}
