/**
 * Canadian RRIF minimum withdrawal rule.
 *
 * RRSP must convert to RRIF by end of the year turning 71. RRIF minimums
 * start at age 72 (with a 1/(90-age) formula at 71) and increase yearly.
 */

import type { RmdRule } from "@/lib/countries/types";

export const CA_RRIF_CONVERSION_AGE = 71;

const CA_RRIF_MINIMUMS: Record<number, number> = {
  72: 5.40, 73: 5.53, 74: 5.67, 75: 5.82, 76: 5.98, 77: 6.17, 78: 6.36, 79: 6.58,
  80: 6.82, 81: 7.08, 82: 7.38, 83: 7.71, 84: 8.08, 85: 8.51, 86: 8.99, 87: 9.55,
  88: 10.21, 89: 10.99, 90: 11.92, 91: 13.06, 92: 14.49, 93: 16.34, 94: 18.79,
  95: 20.00,
};

export function getCaRrifPercent(age: number): number {
  if (age < CA_RRIF_CONVERSION_AGE) return 0;
  if (age === 71) return (1 / (90 - 71)) * 100;
  if (age >= 95) return 20.0;
  return CA_RRIF_MINIMUMS[age] ?? 0;
}

export const canadianRmd: RmdRule = {
  ruleName: "RRIF minimum",
  computeRmd(balance, age, category) {
    if (balance <= 0 || age <= 0) return 0;
    const lower = category.toLowerCase();
    if (lower.includes("rrsp") || lower.includes("lira") || lower.includes("rrif") || lower.includes("lif")) {
      return balance * getCaRrifPercent(age) / 100;
    }
    return 0;
  },
};
