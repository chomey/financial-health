/**
 * Australian Federal Tax Bracket Tables (2024-25 / 2025-26)
 *
 * Sources:
 * - ATO: https://www.ato.gov.au/tax-rates-and-codes/tax-rates-australian-residents
 * - Medicare Levy: https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/medicare-levy
 * - No state/territory income tax in Australia
 */

import type { BracketTable } from "@/lib/bracket-math";
import { clampTaxYear } from "@/lib/countries/canada/tax-tables";

// ─── Federal ──────────────────────────────────────────────────────────────────

/**
 * 2024-25 Australian Federal Tax Brackets (Residents).
 * Stage 3 tax cuts effective 1 July 2024.
 * basicPersonalAmount represents the tax-free threshold ($18,200).
 */
export const AU_FEDERAL_2025: BracketTable = {
  brackets: [
    { min: 0, max: 18_200, rate: 0 },
    { min: 18_200, max: 45_000, rate: 0.16 },
    { min: 45_000, max: 135_000, rate: 0.30 },
    { min: 135_000, max: 190_000, rate: 0.37 },
    { min: 190_000, max: Infinity, rate: 0.45 },
  ],
  basicPersonalAmount: 0, // Tax-free threshold handled via the 0% bracket
};

/**
 * 2025-26 Australian Federal Tax Brackets (Residents).
 * ATO does not index thresholds; FY2025-26 rates are unchanged from
 * FY2024-25 (the 15% first-rate cut begins FY2026-27, not covered).
 */
export const AU_FEDERAL_2026: BracketTable = {
  brackets: [
    { min: 0, max: 18_200, rate: 0 },
    { min: 18_200, max: 45_000, rate: 0.16 },
    { min: 45_000, max: 135_000, rate: 0.30 },
    { min: 135_000, max: 190_000, rate: 0.37 },
    { min: 190_000, max: Infinity, rate: 0.45 },
  ],
  basicPersonalAmount: 0,
};

export const AU_FEDERAL_BY_YEAR: Record<number, BracketTable> = {
  2025: AU_FEDERAL_2025,
  2026: AU_FEDERAL_2026,
};

// ─── Medicare Levy ────────────────────────────────────────────────────────────

/**
 * Medicare Levy: 2% of taxable income, with low-income phase-in thresholds.
 * Below the threshold: no levy. Between threshold and shade-out: reduced levy.
 * Above shade-out: full 2%.
 *
 * Official thresholds (singles):
 * - FY2024-25: exempt at or below $27,222; phase-in to $34,027
 * - FY2025-26: exempt at or below $28,011; phase-in to $35,013
 *
 * Family threshold: $43,846 (+ $4,027 per dependent child)
 * We use single thresholds since we don't track family size in the tax engine.
 */
export const AU_MEDICARE_LEVY = {
  rate: 0.02,
  singleThreshold2025: 27_222,
  singleShadeOut2025: 34_027,
  phaseInRate: 0.10, // 10% of income above threshold until full levy
  singleThreshold2026: 28_011,
  singleShadeOut2026: 35_013,
};

// ─── Bracket accessor ─────────────────────────────────────────────────────────

/**
 * Get Australian federal tax brackets and Medicare Levy thresholds.
 * Australia has no state/territory income tax — returns empty brackets for state.
 * @param jurisdiction - AU state/territory code (e.g., "NSW", "VIC") — not used for tax calc
 * @param year - Tax year (2025 or 2026)
 */
export function getAUBrackets(
  jurisdiction: string,
  year: number = 2025
): { federal: BracketTable; state: BracketTable } {
  const federal = AU_FEDERAL_BY_YEAR[clampTaxYear(year)];

  // No state/territory income tax in Australia
  return {
    federal,
    state: { brackets: [], basicPersonalAmount: 0 },
  };
}

/**
 * Calculate Australian Medicare Levy for a given taxable income.
 * Handles the low-income phase-in where the levy is 10% of income above
 * the threshold, capped at the full 2% rate.
 */
export function calculateMedicareLevy(taxableIncome: number, year: number = 2025): number {
  if (taxableIncome <= 0) return 0;

  const { rate, phaseInRate } = AU_MEDICARE_LEVY;
  const threshold = year >= 2026 ? AU_MEDICARE_LEVY.singleThreshold2026 : AU_MEDICARE_LEVY.singleThreshold2025;
  const shadeOut = year >= 2026 ? AU_MEDICARE_LEVY.singleShadeOut2026 : AU_MEDICARE_LEVY.singleShadeOut2025;

  if (taxableIncome <= threshold) {
    return 0;
  }

  if (taxableIncome <= shadeOut) {
    // Phase-in: 10% of the amount above the threshold
    return (taxableIncome - threshold) * phaseInRate;
  }

  // Full levy
  return taxableIncome * rate;
}
