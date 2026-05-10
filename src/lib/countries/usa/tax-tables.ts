/**
 * US Federal and State Tax Bracket Tables (2025/2026)
 *
 * Sources:
 * - Federal: IRS Rev. Proc. 2024-40 — https://www.irs.gov/filing/federal-income-tax-rates-and-brackets
 * - State: Tax Foundation 2025 State Income Tax Rates and Brackets
 *   https://taxfoundation.org/data/all/state/state-income-tax-rates/
 * - Capital gains: IRS Topic 409 — https://www.irs.gov/taxtopics/tc409
 */

import type { BracketTable } from "@/lib/bracket-math";
import { SUPPORTED_TAX_YEARS } from "@/lib/countries/canada/tax-tables";

// ─── US Federal ──────────────────────────────────────────────────────────────

/**
 * 2025 US Federal Tax Brackets (Single Filer).
 * Note: basicPersonalAmount stores the standard deduction for US ($15,000 for single filers).
 * Unlike Canadian BPA (applied as a credit), the US standard deduction is subtracted from
 * gross income before applying brackets. The tax engine (computeTax) handles this distinction.
 */
export const US_FEDERAL_2025: BracketTable = {
  brackets: [
    { min: 0, max: 11_925, rate: 0.10 },
    { min: 11_925, max: 48_475, rate: 0.12 },
    { min: 48_475, max: 103_350, rate: 0.22 },
    { min: 103_350, max: 197_300, rate: 0.24 },
    { min: 197_300, max: 250_525, rate: 0.32 },
    { min: 250_525, max: 626_350, rate: 0.35 },
    { min: 626_350, max: Infinity, rate: 0.37 },
  ],
  basicPersonalAmount: 15_000,
};

/**
 * 2026 US Federal Tax Brackets (Single Filer, estimated ~2.8% inflation adjustment).
 * These will be validated/corrected in Task 155 when official IRS values are published.
 */
export const US_FEDERAL_2026: BracketTable = {
  brackets: [
    { min: 0, max: 12_259, rate: 0.10 },
    { min: 12_259, max: 49_832, rate: 0.12 },
    { min: 49_832, max: 106_244, rate: 0.22 },
    { min: 106_244, max: 202_824, rate: 0.24 },
    { min: 202_824, max: 257_540, rate: 0.32 },
    { min: 257_540, max: 643_888, rate: 0.35 },
    { min: 643_888, max: Infinity, rate: 0.37 },
  ],
  basicPersonalAmount: 15_420,
};

// ─── US Capital Gains ─────────────────────────────────────────────────────────

/**
 * 2025 US Long-Term Capital Gains Tax Brackets (Single Filer).
 * These rates apply to long-term capital gains (assets held > 1 year).
 * Short-term capital gains are taxed as ordinary income.
 * Note: An additional 3.8% Net Investment Income Tax (NIIT) may apply
 * for income above $200,000 (single), but is not included in these brackets.
 */
export const US_CAPITAL_GAINS_2025: BracketTable = {
  brackets: [
    { min: 0, max: 48_350, rate: 0.00 },
    { min: 48_350, max: 533_400, rate: 0.15 },
    { min: 533_400, max: Infinity, rate: 0.20 },
  ],
  basicPersonalAmount: 0,
};

/**
 * 2026 US Long-Term Capital Gains Tax Brackets (Single Filer, estimated).
 */
export const US_CAPITAL_GAINS_2026: BracketTable = {
  brackets: [
    { min: 0, max: 49_703, rate: 0.00 },
    { min: 49_703, max: 548_334, rate: 0.15 },
    { min: 548_334, max: Infinity, rate: 0.20 },
  ],
  basicPersonalAmount: 0,
};

// ─── US State Tables ─────────────────────────────────────────────────────────
// States with no income tax use empty bracket arrays.
// For states with graduated brackets, thresholds are for single filers.
// basicPersonalAmount is set to 0 for states (state standard deductions vary
// widely and are handled separately in the tax engine if needed).

/** Alabama — Graduated brackets (single filer) */
export const US_AL_2025: BracketTable = {
  brackets: [
    { min: 0, max: 500, rate: 0.02 },
    { min: 500, max: 3_000, rate: 0.04 },
    { min: 3_000, max: Infinity, rate: 0.05 },
  ],
  basicPersonalAmount: 0,
};

/** Alaska — No state income tax */
export const US_AK_2025: BracketTable = {
  brackets: [],
  basicPersonalAmount: 0,
};

/** Arizona — Flat tax */
export const US_AZ_2025: BracketTable = {
  brackets: [
    { min: 0, max: Infinity, rate: 0.025 },
  ],
  basicPersonalAmount: 0,
};

/** Arkansas — Graduated brackets (single filer) */
export const US_AR_2025: BracketTable = {
  brackets: [
    { min: 0, max: 4_500, rate: 0.02 },
    { min: 4_500, max: Infinity, rate: 0.039 },
  ],
  basicPersonalAmount: 0,
};

/** California — Graduated brackets (single filer) */
export const US_CA_2025: BracketTable = {
  brackets: [
    { min: 0, max: 10_756, rate: 0.01 },
    { min: 10_756, max: 25_499, rate: 0.02 },
    { min: 25_499, max: 40_245, rate: 0.04 },
    { min: 40_245, max: 55_866, rate: 0.06 },
    { min: 55_866, max: 70_606, rate: 0.08 },
    { min: 70_606, max: 360_659, rate: 0.093 },
    { min: 360_659, max: 432_787, rate: 0.103 },
    { min: 432_787, max: 721_314, rate: 0.113 },
    { min: 721_314, max: 1_000_000, rate: 0.123 },
    { min: 1_000_000, max: Infinity, rate: 0.133 },
  ],
  basicPersonalAmount: 0,
};

/** Colorado — Flat tax */
export const US_CO_2025: BracketTable = {
  brackets: [
    { min: 0, max: Infinity, rate: 0.044 },
  ],
  basicPersonalAmount: 0,
};

/** Connecticut — Graduated brackets (single filer) */
export const US_CT_2025: BracketTable = {
  brackets: [
    { min: 0, max: 10_000, rate: 0.02 },
    { min: 10_000, max: 50_000, rate: 0.045 },
    { min: 50_000, max: 100_000, rate: 0.055 },
    { min: 100_000, max: 200_000, rate: 0.06 },
    { min: 200_000, max: 250_000, rate: 0.065 },
    { min: 250_000, max: 500_000, rate: 0.069 },
    { min: 500_000, max: Infinity, rate: 0.0699 },
  ],
  basicPersonalAmount: 0,
};

/** Delaware — Graduated brackets (single filer) */
export const US_DE_2025: BracketTable = {
  brackets: [
    { min: 0, max: 2_000, rate: 0.00 },
    { min: 2_000, max: 5_000, rate: 0.022 },
    { min: 5_000, max: 10_000, rate: 0.039 },
    { min: 10_000, max: 20_000, rate: 0.048 },
    { min: 20_000, max: 25_000, rate: 0.052 },
    { min: 25_000, max: 60_000, rate: 0.0555 },
    { min: 60_000, max: Infinity, rate: 0.066 },
  ],
  basicPersonalAmount: 0,
};

/** Florida — No state income tax */
export const US_FL_2025: BracketTable = {
  brackets: [],
  basicPersonalAmount: 0,
};

/** Georgia — Flat tax (effective 2025) */
export const US_GA_2025: BracketTable = {
  brackets: [
    { min: 0, max: Infinity, rate: 0.0539 },
  ],
  basicPersonalAmount: 0,
};

/** Hawaii — Graduated brackets (single filer) */
export const US_HI_2025: BracketTable = {
  brackets: [
    { min: 0, max: 9_600, rate: 0.014 },
    { min: 9_600, max: 14_400, rate: 0.032 },
    { min: 14_400, max: 19_200, rate: 0.055 },
    { min: 19_200, max: 24_000, rate: 0.064 },
    { min: 24_000, max: 36_000, rate: 0.068 },
    { min: 36_000, max: 48_000, rate: 0.072 },
    { min: 48_000, max: 125_000, rate: 0.076 },
    { min: 125_000, max: 175_000, rate: 0.079 },
    { min: 175_000, max: 225_000, rate: 0.0825 },
    { min: 225_000, max: 275_000, rate: 0.09 },
    { min: 275_000, max: 325_000, rate: 0.10 },
    { min: 325_000, max: Infinity, rate: 0.11 },
  ],
  basicPersonalAmount: 0,
};

/** Idaho — Flat tax */
export const US_ID_2025: BracketTable = {
  brackets: [
    { min: 0, max: Infinity, rate: 0.05695 },
  ],
  basicPersonalAmount: 0,
};

/** Illinois — Flat tax */
export const US_IL_2025: BracketTable = {
  brackets: [
    { min: 0, max: Infinity, rate: 0.0495 },
  ],
  basicPersonalAmount: 0,
};

/** Indiana — Flat tax */
export const US_IN_2025: BracketTable = {
  brackets: [
    { min: 0, max: Infinity, rate: 0.03 },
  ],
  basicPersonalAmount: 0,
};

/** Iowa — Flat tax */
export const US_IA_2025: BracketTable = {
  brackets: [
    { min: 0, max: Infinity, rate: 0.038 },
  ],
  basicPersonalAmount: 0,
};

/** Kansas — Graduated brackets (single filer) */
export const US_KS_2025: BracketTable = {
  brackets: [
    { min: 0, max: 23_000, rate: 0.052 },
    { min: 23_000, max: Infinity, rate: 0.0558 },
  ],
  basicPersonalAmount: 0,
};

/** Kentucky — Flat tax */
export const US_KY_2025: BracketTable = {
  brackets: [
    { min: 0, max: Infinity, rate: 0.04 },
  ],
  basicPersonalAmount: 0,
};

/** Louisiana — Flat tax (effective 2025) */
export const US_LA_2025: BracketTable = {
  brackets: [
    { min: 0, max: Infinity, rate: 0.03 },
  ],
  basicPersonalAmount: 0,
};

/** Maine — Graduated brackets (single filer) */
export const US_ME_2025: BracketTable = {
  brackets: [
    { min: 0, max: 26_800, rate: 0.058 },
    { min: 26_800, max: 63_450, rate: 0.0675 },
    { min: 63_450, max: Infinity, rate: 0.0715 },
  ],
  basicPersonalAmount: 0,
};

/** Maryland — Graduated brackets (single filer) */
export const US_MD_2025: BracketTable = {
  brackets: [
    { min: 0, max: 1_000, rate: 0.02 },
    { min: 1_000, max: 2_000, rate: 0.03 },
    { min: 2_000, max: 3_000, rate: 0.04 },
    { min: 3_000, max: 100_000, rate: 0.0475 },
    { min: 100_000, max: 125_000, rate: 0.05 },
    { min: 125_000, max: 150_000, rate: 0.0525 },
    { min: 150_000, max: 250_000, rate: 0.055 },
    { min: 250_000, max: Infinity, rate: 0.0575 },
  ],
  basicPersonalAmount: 0,
};

/** Massachusetts — Graduated brackets (single filer, millionaire's tax effective 2023) */
export const US_MA_2025: BracketTable = {
  brackets: [
    { min: 0, max: 1_083_150, rate: 0.05 },
    { min: 1_083_150, max: Infinity, rate: 0.09 },
  ],
  basicPersonalAmount: 0,
};

/** Michigan — Flat tax */
export const US_MI_2025: BracketTable = {
  brackets: [
    { min: 0, max: Infinity, rate: 0.0425 },
  ],
  basicPersonalAmount: 0,
};

/** Minnesota — Graduated brackets (single filer) */
export const US_MN_2025: BracketTable = {
  brackets: [
    { min: 0, max: 32_570, rate: 0.0535 },
    { min: 32_570, max: 106_990, rate: 0.068 },
    { min: 106_990, max: 198_630, rate: 0.0785 },
    { min: 198_630, max: Infinity, rate: 0.0985 },
  ],
  basicPersonalAmount: 0,
};

/** Mississippi — Flat tax (effective 2025) */
export const US_MS_2025: BracketTable = {
  brackets: [
    { min: 0, max: Infinity, rate: 0.044 },
  ],
  basicPersonalAmount: 0,
};

/** Missouri — Graduated brackets (single filer) */
export const US_MO_2025: BracketTable = {
  brackets: [
    { min: 0, max: 1_313, rate: 0.00 },
    { min: 1_313, max: 2_626, rate: 0.02 },
    { min: 2_626, max: 3_939, rate: 0.025 },
    { min: 3_939, max: 5_252, rate: 0.03 },
    { min: 5_252, max: 6_565, rate: 0.035 },
    { min: 6_565, max: 7_878, rate: 0.04 },
    { min: 7_878, max: 9_191, rate: 0.045 },
    { min: 9_191, max: Infinity, rate: 0.047 },
  ],
  basicPersonalAmount: 0,
};

/** Montana — Graduated brackets (single filer) */
export const US_MT_2025: BracketTable = {
  brackets: [
    { min: 0, max: 21_100, rate: 0.047 },
    { min: 21_100, max: Infinity, rate: 0.059 },
  ],
  basicPersonalAmount: 0,
};

/** Nebraska — Graduated brackets (single filer) */
export const US_NE_2025: BracketTable = {
  brackets: [
    { min: 0, max: 4_030, rate: 0.0246 },
    { min: 4_030, max: 24_120, rate: 0.0351 },
    { min: 24_120, max: 38_870, rate: 0.0501 },
    { min: 38_870, max: Infinity, rate: 0.052 },
  ],
  basicPersonalAmount: 0,
};

/** Nevada — No state income tax */
export const US_NV_2025: BracketTable = {
  brackets: [],
  basicPersonalAmount: 0,
};

/** New Hampshire — No state income tax (repealed interest/dividends tax effective 2025) */
export const US_NH_2025: BracketTable = {
  brackets: [],
  basicPersonalAmount: 0,
};

/** New Jersey — Graduated brackets (single filer) */
export const US_NJ_2025: BracketTable = {
  brackets: [
    { min: 0, max: 20_000, rate: 0.014 },
    { min: 20_000, max: 35_000, rate: 0.0175 },
    { min: 35_000, max: 40_000, rate: 0.035 },
    { min: 40_000, max: 75_000, rate: 0.05525 },
    { min: 75_000, max: 500_000, rate: 0.0637 },
    { min: 500_000, max: 1_000_000, rate: 0.0897 },
    { min: 1_000_000, max: Infinity, rate: 0.1075 },
  ],
  basicPersonalAmount: 0,
};

/** New Mexico — Graduated brackets (single filer) */
export const US_NM_2025: BracketTable = {
  brackets: [
    { min: 0, max: 5_500, rate: 0.015 },
    { min: 5_500, max: 16_500, rate: 0.032 },
    { min: 16_500, max: 33_500, rate: 0.043 },
    { min: 33_500, max: 66_500, rate: 0.047 },
    { min: 66_500, max: 210_000, rate: 0.049 },
    { min: 210_000, max: Infinity, rate: 0.059 },
  ],
  basicPersonalAmount: 0,
};

/** New York — Graduated brackets (single filer) */
export const US_NY_2025: BracketTable = {
  brackets: [
    { min: 0, max: 8_500, rate: 0.04 },
    { min: 8_500, max: 11_700, rate: 0.045 },
    { min: 11_700, max: 13_900, rate: 0.0525 },
    { min: 13_900, max: 80_650, rate: 0.055 },
    { min: 80_650, max: 215_400, rate: 0.06 },
    { min: 215_400, max: 1_077_550, rate: 0.0685 },
    { min: 1_077_550, max: 5_000_000, rate: 0.0965 },
    { min: 5_000_000, max: 25_000_000, rate: 0.103 },
    { min: 25_000_000, max: Infinity, rate: 0.109 },
  ],
  basicPersonalAmount: 0,
};

/** North Carolina — Flat tax */
export const US_NC_2025: BracketTable = {
  brackets: [
    { min: 0, max: Infinity, rate: 0.0425 },
  ],
  basicPersonalAmount: 0,
};

/** North Dakota — Graduated brackets (single filer, income below $48,475 is tax-free) */
export const US_ND_2025: BracketTable = {
  brackets: [
    { min: 0, max: 48_475, rate: 0.00 },
    { min: 48_475, max: 244_825, rate: 0.0195 },
    { min: 244_825, max: Infinity, rate: 0.025 },
  ],
  basicPersonalAmount: 0,
};

/** Ohio — Graduated brackets (single filer, income below $26,050 is tax-free) */
export const US_OH_2025: BracketTable = {
  brackets: [
    { min: 0, max: 26_050, rate: 0.00 },
    { min: 26_050, max: 100_000, rate: 0.0275 },
    { min: 100_000, max: Infinity, rate: 0.035 },
  ],
  basicPersonalAmount: 0,
};

/** Oklahoma — Graduated brackets (single filer) */
export const US_OK_2025: BracketTable = {
  brackets: [
    { min: 0, max: 1_000, rate: 0.0025 },
    { min: 1_000, max: 2_500, rate: 0.0075 },
    { min: 2_500, max: 3_750, rate: 0.0175 },
    { min: 3_750, max: 4_900, rate: 0.0275 },
    { min: 4_900, max: 7_200, rate: 0.0375 },
    { min: 7_200, max: Infinity, rate: 0.0475 },
  ],
  basicPersonalAmount: 0,
};

/** Oregon — Graduated brackets (single filer) */
export const US_OR_2025: BracketTable = {
  brackets: [
    { min: 0, max: 4_400, rate: 0.0475 },
    { min: 4_400, max: 11_050, rate: 0.0675 },
    { min: 11_050, max: 125_000, rate: 0.0875 },
    { min: 125_000, max: Infinity, rate: 0.099 },
  ],
  basicPersonalAmount: 0,
};

/** Pennsylvania — Flat tax */
export const US_PA_2025: BracketTable = {
  brackets: [
    { min: 0, max: Infinity, rate: 0.0307 },
  ],
  basicPersonalAmount: 0,
};

/** Rhode Island — Graduated brackets (single filer) */
export const US_RI_2025: BracketTable = {
  brackets: [
    { min: 0, max: 79_900, rate: 0.0375 },
    { min: 79_900, max: 181_650, rate: 0.0475 },
    { min: 181_650, max: Infinity, rate: 0.0599 },
  ],
  basicPersonalAmount: 0,
};

/** South Carolina — Graduated brackets (single filer) */
export const US_SC_2025: BracketTable = {
  brackets: [
    { min: 0, max: 3_560, rate: 0.00 },
    { min: 3_560, max: 17_830, rate: 0.03 },
    { min: 17_830, max: Infinity, rate: 0.062 },
  ],
  basicPersonalAmount: 0,
};

/** South Dakota — No state income tax */
export const US_SD_2025: BracketTable = {
  brackets: [],
  basicPersonalAmount: 0,
};

/** Tennessee — No state income tax */
export const US_TN_2025: BracketTable = {
  brackets: [],
  basicPersonalAmount: 0,
};

/** Texas — No state income tax */
export const US_TX_2025: BracketTable = {
  brackets: [],
  basicPersonalAmount: 0,
};

/** Utah — Flat tax */
export const US_UT_2025: BracketTable = {
  brackets: [
    { min: 0, max: Infinity, rate: 0.0455 },
  ],
  basicPersonalAmount: 0,
};

/** Vermont — Graduated brackets (single filer) */
export const US_VT_2025: BracketTable = {
  brackets: [
    { min: 0, max: 47_900, rate: 0.0335 },
    { min: 47_900, max: 116_000, rate: 0.066 },
    { min: 116_000, max: 242_000, rate: 0.076 },
    { min: 242_000, max: Infinity, rate: 0.0875 },
  ],
  basicPersonalAmount: 0,
};

/** Virginia — Graduated brackets (single filer) */
export const US_VA_2025: BracketTable = {
  brackets: [
    { min: 0, max: 3_000, rate: 0.02 },
    { min: 3_000, max: 5_000, rate: 0.03 },
    { min: 5_000, max: 17_000, rate: 0.05 },
    { min: 17_000, max: Infinity, rate: 0.0575 },
  ],
  basicPersonalAmount: 0,
};

/** Washington — No state income tax (7% capital gains tax exists but not general income tax) */
export const US_WA_2025: BracketTable = {
  brackets: [],
  basicPersonalAmount: 0,
};

/** West Virginia — Graduated brackets (single filer) */
export const US_WV_2025: BracketTable = {
  brackets: [
    { min: 0, max: 10_000, rate: 0.0222 },
    { min: 10_000, max: 25_000, rate: 0.0296 },
    { min: 25_000, max: 40_000, rate: 0.0333 },
    { min: 40_000, max: 60_000, rate: 0.0444 },
    { min: 60_000, max: Infinity, rate: 0.0482 },
  ],
  basicPersonalAmount: 0,
};

/** Wisconsin — Graduated brackets (single filer) */
export const US_WI_2025: BracketTable = {
  brackets: [
    { min: 0, max: 14_680, rate: 0.035 },
    { min: 14_680, max: 29_370, rate: 0.044 },
    { min: 29_370, max: 323_290, rate: 0.053 },
    { min: 323_290, max: Infinity, rate: 0.0765 },
  ],
  basicPersonalAmount: 0,
};

/** Wyoming — No state income tax */
export const US_WY_2025: BracketTable = {
  brackets: [],
  basicPersonalAmount: 0,
};

/** Washington DC — Graduated brackets */
export const US_DC_2025: BracketTable = {
  brackets: [
    { min: 0, max: 10_000, rate: 0.04 },
    { min: 10_000, max: 40_000, rate: 0.06 },
    { min: 40_000, max: 60_000, rate: 0.065 },
    { min: 60_000, max: 250_000, rate: 0.085 },
    { min: 250_000, max: 500_000, rate: 0.0925 },
    { min: 500_000, max: 1_000_000, rate: 0.0975 },
    { min: 1_000_000, max: Infinity, rate: 0.1075 },
  ],
  basicPersonalAmount: 0,
};

// ─── US State Lookup Maps ─────────────────────────────────────────────────────

export const US_PROVINCIAL_2025: Record<string, BracketTable> = {
  AL: US_AL_2025,
  AK: US_AK_2025,
  AZ: US_AZ_2025,
  AR: US_AR_2025,
  CA: US_CA_2025,
  CO: US_CO_2025,
  CT: US_CT_2025,
  DE: US_DE_2025,
  FL: US_FL_2025,
  GA: US_GA_2025,
  HI: US_HI_2025,
  ID: US_ID_2025,
  IL: US_IL_2025,
  IN: US_IN_2025,
  IA: US_IA_2025,
  KS: US_KS_2025,
  KY: US_KY_2025,
  LA: US_LA_2025,
  ME: US_ME_2025,
  MD: US_MD_2025,
  MA: US_MA_2025,
  MI: US_MI_2025,
  MN: US_MN_2025,
  MS: US_MS_2025,
  MO: US_MO_2025,
  MT: US_MT_2025,
  NE: US_NE_2025,
  NV: US_NV_2025,
  NH: US_NH_2025,
  NJ: US_NJ_2025,
  NM: US_NM_2025,
  NY: US_NY_2025,
  NC: US_NC_2025,
  ND: US_ND_2025,
  OH: US_OH_2025,
  OK: US_OK_2025,
  OR: US_OR_2025,
  PA: US_PA_2025,
  RI: US_RI_2025,
  SC: US_SC_2025,
  SD: US_SD_2025,
  TN: US_TN_2025,
  TX: US_TX_2025,
  UT: US_UT_2025,
  VT: US_VT_2025,
  VA: US_VA_2025,
  WA: US_WA_2025,
  WV: US_WV_2025,
  WI: US_WI_2025,
  WY: US_WY_2025,
  DC: US_DC_2025,
};

// 2026 state tables: reuse 2025 values as placeholder until states publish updates.
// Task 155 will validate and update these with official values.
export const US_PROVINCIAL_2026: Record<string, BracketTable> = { ...US_PROVINCIAL_2025 };

// ─── Internal lookup maps ─────────────────────────────────────────────────────

const US_FEDERAL_BY_YEAR: Record<number, BracketTable> = {
  2025: US_FEDERAL_2025,
  2026: US_FEDERAL_2026,
};

const US_CAPITAL_GAINS_BY_YEAR: Record<number, BracketTable> = {
  2025: US_CAPITAL_GAINS_2025,
  2026: US_CAPITAL_GAINS_2026,
};

const US_STATE_BY_YEAR: Record<number, Record<string, BracketTable>> = {
  2025: US_PROVINCIAL_2025,
  2026: US_PROVINCIAL_2026,
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Get US federal and state tax brackets.
 * @param state - Two-letter state code (e.g., "CA", "NY", "TX") or "DC"
 * @param year - Tax year (2025 or 2026; defaults to 2025)
 * @returns Federal and state bracket tables. States with no income tax return empty bracket arrays.
 * @throws If the state code is not recognized or year is unsupported
 */
export function getUSBrackets(
  state: string,
  year: number = 2025
): { federal: BracketTable; state: BracketTable } {
  const federal = US_FEDERAL_BY_YEAR[year];
  if (!federal) {
    throw new Error(`Tax year ${year} is not supported. Supported years: ${SUPPORTED_TAX_YEARS.join(", ")}`);
  }

  const code = state.toUpperCase();
  const stateTables = US_STATE_BY_YEAR[year] ?? US_PROVINCIAL_2025;
  const stateTable = stateTables[code];
  if (stateTable === undefined) {
    throw new Error(
      `Unknown US state code: "${state}". ` +
      `Valid codes: ${Object.keys(stateTables).join(", ")}`
    );
  }

  return { federal, state: stateTable };
}

/**
 * Get US long-term capital gains bracket table for a given tax year.
 */
export function getUSCapitalGainsBrackets(year: number = 2025): BracketTable {
  return US_CAPITAL_GAINS_BY_YEAR[year] ?? US_CAPITAL_GAINS_2025;
}
