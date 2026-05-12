/**
 * US Required Minimum Distributions (Uniform Lifetime Table, IRS Pub 590-B).
 *
 * RMDs apply to 401k / Traditional IRA / 403b / 457 from age 73 (SECURE 2.0).
 * Roth accounts are exempt. RMD = balance / divisor for the holder's age.
 */

import type { RmdRule } from "@/lib/countries/types";

export const US_RMD_START_AGE = 73;

const US_RMD_DIVISORS: Record<number, number> = {
  73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0, 79: 21.1, 80: 20.2,
  81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8, 85: 16.0, 86: 15.2, 87: 14.4, 88: 13.7,
  89: 12.9, 90: 12.2, 91: 11.5, 92: 10.8, 93: 10.1, 94: 9.5, 95: 8.9, 96: 8.4,
  97: 7.8, 98: 7.3, 99: 6.8, 100: 6.4, 101: 6.0, 102: 5.6, 103: 5.2, 104: 4.9,
  105: 4.6, 106: 4.3, 107: 4.1, 108: 3.9, 109: 3.7, 110: 3.5, 111: 3.4, 112: 3.3,
  113: 3.1, 114: 3.0, 115: 2.9, 116: 2.8, 117: 2.7, 118: 2.5, 119: 2.3, 120: 2.0,
};

export function getUsRmdPercent(age: number): number {
  if (age < US_RMD_START_AGE) return 0;
  const divisor = US_RMD_DIVISORS[Math.min(age, 120)];
  if (!divisor) return 0;
  return (1 / divisor) * 100;
}

export const americanRmd: RmdRule = {
  ruleName: "RMD",
  computeRmd(balance, age, category) {
    if (balance <= 0 || age <= 0) return 0;
    const lower = category.toLowerCase();
    if (
      (lower.includes("401k") || lower.includes("ira") || lower.includes("403b") || lower.includes("457")) &&
      !lower.includes("roth")
    ) {
      return balance * getUsRmdPercent(age) / 100;
    }
    return 0;
  },
};
