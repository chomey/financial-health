/**
 * Tax bracket tables for all supported countries.
 *
 * Canadian data has been extracted to @/lib/countries/canada/tax-tables.ts.
 * US data has been extracted to @/lib/countries/usa/tax-tables.ts.
 * Shared bracket types and calculateProgressiveTax live in @/lib/bracket-math.ts.
 * AU tables remain here pending future extraction tasks.
 */

// ─── Re-exports for backward compatibility ────────────────────────────────────

export type { BracketTable, TaxBracket } from "@/lib/bracket-math";
export { calculateProgressiveTax } from "@/lib/bracket-math";

export {
  CA_CAPITAL_GAINS,
  CA_FEDERAL_2025,
  CA_FEDERAL_2026,
  CA_AB_2025,
  CA_BC_2025,
  CA_MB_2025,
  CA_NB_2025,
  CA_NL_2025,
  CA_NS_2025,
  CA_NT_2025,
  CA_NU_2025,
  CA_ON_2025,
  CA_PE_2025,
  CA_QC_2025,
  CA_SK_2025,
  CA_YT_2025,
  CA_PROVINCIAL_2025,
  CA_PROVINCIAL_2026,
  getCanadianBrackets,
  calculateCanadianCapitalGainsInclusion,
} from "@/lib/countries/canada/tax-tables";

import { SUPPORTED_TAX_YEARS } from "@/lib/countries/canada/tax-tables";
export { SUPPORTED_TAX_YEARS };
export type { TaxYear } from "@/lib/countries/canada/tax-tables";

export {
  US_FEDERAL_2025,
  US_FEDERAL_2026,
  US_PROVINCIAL_2025,
  US_PROVINCIAL_2026,
  US_CAPITAL_GAINS_2025,
  US_CAPITAL_GAINS_2026,
  US_AL_2025, US_AK_2025, US_AZ_2025, US_AR_2025, US_CA_2025, US_CO_2025,
  US_CT_2025, US_DE_2025, US_FL_2025, US_GA_2025, US_HI_2025, US_ID_2025,
  US_IL_2025, US_IN_2025, US_IA_2025, US_KS_2025, US_KY_2025, US_LA_2025,
  US_ME_2025, US_MD_2025, US_MA_2025, US_MI_2025, US_MN_2025, US_MS_2025,
  US_MO_2025, US_MT_2025, US_NE_2025, US_NV_2025, US_NH_2025, US_NJ_2025,
  US_NM_2025, US_NY_2025, US_NC_2025, US_ND_2025, US_OH_2025, US_OK_2025,
  US_OR_2025, US_PA_2025, US_RI_2025, US_SC_2025, US_SD_2025, US_TN_2025,
  US_TX_2025, US_UT_2025, US_VT_2025, US_VA_2025, US_WA_2025, US_WV_2025,
  US_WI_2025, US_WY_2025, US_DC_2025,
  getUSBrackets,
  getUSCapitalGainsBrackets,
} from "@/lib/countries/usa/tax-tables";

import type { BracketTable } from "@/lib/bracket-math";

// ═══════════════════════════════════════════════════════════════════════════════
// Australian Federal Tax Bracket Tables (2024-25 / 2025-26)
//
// Sources:
// - ATO: https://www.ato.gov.au/tax-rates-and-codes/tax-rates-australian-residents
// - Medicare Levy: https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/medicare-levy
// - No state/territory income tax in Australia
// ═══════════════════════════════════════════════════════════════════════════════

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
 * 2025-26 Australian Federal Tax Brackets (estimated via ~2.5% indexation).
 * Official ATO values to be confirmed mid-2025.
 */
export const AU_FEDERAL_2026: BracketTable = {
  brackets: [
    { min: 0, max: 18_700, rate: 0 },
    { min: 18_700, max: 46_100, rate: 0.16 },
    { min: 46_100, max: 138_400, rate: 0.30 },
    { min: 138_400, max: 194_800, rate: 0.37 },
    { min: 194_800, max: Infinity, rate: 0.45 },
  ],
  basicPersonalAmount: 0,
};

/**
 * Medicare Levy: 2% of taxable income, with low-income phase-in thresholds.
 * Below the threshold: no levy. Between threshold and shade-out: reduced levy.
 * Above shade-out: full 2%.
 *
 * 2024-25 thresholds (singles):
 * - Exempt below $26,000
 * - Phase-in from $26,000 to $32,500 (10% of excess over threshold)
 * - Full 2% above $32,500
 *
 * Family threshold: $43,846 (+ $4,027 per dependent child)
 * We use single thresholds since we don't track family size in the tax engine.
 */
export const AU_MEDICARE_LEVY = {
  rate: 0.02,
  singleThreshold2025: 26_000,
  singleShadeOut2025: 32_500,
  phaseInRate: 0.10, // 10% of income above threshold until full levy
  singleThreshold2026: 26_650, // estimated ~2.5% indexation
  singleShadeOut2026: 33_313,
};

const AU_FEDERAL_BY_YEAR: Record<number, BracketTable> = {
  2025: AU_FEDERAL_2025,
  2026: AU_FEDERAL_2026,
};

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
  const federal = AU_FEDERAL_BY_YEAR[year];
  if (!federal) {
    throw new Error(`Tax year ${year} is not supported for AU. Supported years: ${SUPPORTED_TAX_YEARS.join(", ")}`);
  }

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
