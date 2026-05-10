/**
 * Canadian Federal and Provincial/Territorial Tax Bracket Tables (2025/2026)
 *
 * Sources:
 * - Federal: https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/canadian-income-tax-rates-individuals-current-previous-years.html
 * - Provincial: Individual provincial tax acts and CRA references
 * - Capital gains inclusion rate: Budget 2024 — 50% on first $250k, 66.67% above (for individuals)
 */

import type { BracketTable } from "@/lib/bracket-math";
export type { BracketTable } from "@/lib/bracket-math";

/**
 * Capital gains inclusion rates for Canadian individuals (2024+).
 * First $250,000 of capital gains: 50% inclusion.
 * Above $250,000: 66.67% inclusion.
 */
export const CA_CAPITAL_GAINS = {
  firstTierLimit: 250_000,
  firstTierRate: 0.5,
  secondTierRate: 2 / 3,
};

// ─── Federal ──────────────────────────────────────────────────────────────────

/** 2025 Canadian Federal Tax Brackets */
export const CA_FEDERAL_2025: BracketTable = {
  brackets: [
    { min: 0, max: 57_375, rate: 0.15 },
    { min: 57_375, max: 114_750, rate: 0.205 },
    { min: 114_750, max: 158_468, rate: 0.26 },
    { min: 158_468, max: 220_000, rate: 0.29 },
    { min: 220_000, max: Infinity, rate: 0.33 },
  ],
  basicPersonalAmount: 16_129,
};

/**
 * 2026 Canadian Federal Tax Brackets (estimated via CRA indexation factor ~2.7%).
 * These will be validated/corrected in Task 154 when official CRA values are published.
 */
export const CA_FEDERAL_2026: BracketTable = {
  brackets: [
    { min: 0, max: 58_924, rate: 0.15 },
    { min: 58_924, max: 117_847, rate: 0.205 },
    { min: 117_847, max: 162_747, rate: 0.26 },
    { min: 162_747, max: 225_940, rate: 0.29 },
    { min: 225_940, max: Infinity, rate: 0.33 },
  ],
  basicPersonalAmount: 16_564,
};

// ─── Provincial / Territorial ─────────────────────────────────────────────────

/** 2025 Alberta */
export const CA_AB_2025: BracketTable = {
  brackets: [
    { min: 0, max: 148_269, rate: 0.10 },
    { min: 148_269, max: 177_922, rate: 0.12 },
    { min: 177_922, max: 237_230, rate: 0.13 },
    { min: 237_230, max: 355_845, rate: 0.14 },
    { min: 355_845, max: Infinity, rate: 0.15 },
  ],
  basicPersonalAmount: 21_003,
};

/** 2025 British Columbia */
export const CA_BC_2025: BracketTable = {
  brackets: [
    { min: 0, max: 47_937, rate: 0.0506 },
    { min: 47_937, max: 95_875, rate: 0.077 },
    { min: 95_875, max: 110_076, rate: 0.105 },
    { min: 110_076, max: 133_664, rate: 0.1229 },
    { min: 133_664, max: 181_232, rate: 0.147 },
    { min: 181_232, max: 252_752, rate: 0.168 },
    { min: 252_752, max: Infinity, rate: 0.205 },
  ],
  basicPersonalAmount: 12_580,
};

/** 2025 Manitoba */
export const CA_MB_2025: BracketTable = {
  brackets: [
    { min: 0, max: 47_000, rate: 0.108 },
    { min: 47_000, max: 100_000, rate: 0.1275 },
    { min: 100_000, max: Infinity, rate: 0.174 },
  ],
  basicPersonalAmount: 15_780,
};

/** 2025 New Brunswick */
export const CA_NB_2025: BracketTable = {
  brackets: [
    { min: 0, max: 49_958, rate: 0.094 },
    { min: 49_958, max: 99_916, rate: 0.14 },
    { min: 99_916, max: 185_064, rate: 0.16 },
    { min: 185_064, max: Infinity, rate: 0.195 },
  ],
  basicPersonalAmount: 13_044,
};

/** 2025 Newfoundland and Labrador */
export const CA_NL_2025: BracketTable = {
  brackets: [
    { min: 0, max: 43_198, rate: 0.087 },
    { min: 43_198, max: 86_395, rate: 0.145 },
    { min: 86_395, max: 154_244, rate: 0.158 },
    { min: 154_244, max: 215_943, rate: 0.178 },
    { min: 215_943, max: 275_870, rate: 0.198 },
    { min: 275_870, max: 551_739, rate: 0.208 },
    { min: 551_739, max: 1_103_478, rate: 0.213 },
    { min: 1_103_478, max: Infinity, rate: 0.218 },
  ],
  basicPersonalAmount: 10_818,
};

/** 2025 Northwest Territories */
export const CA_NT_2025: BracketTable = {
  brackets: [
    { min: 0, max: 50_597, rate: 0.059 },
    { min: 50_597, max: 101_198, rate: 0.086 },
    { min: 101_198, max: 164_525, rate: 0.122 },
    { min: 164_525, max: Infinity, rate: 0.1405 },
  ],
  basicPersonalAmount: 17_373,
};

/** 2025 Nova Scotia */
export const CA_NS_2025: BracketTable = {
  brackets: [
    { min: 0, max: 29_590, rate: 0.0879 },
    { min: 29_590, max: 59_180, rate: 0.1495 },
    { min: 59_180, max: 93_000, rate: 0.1667 },
    { min: 93_000, max: 150_000, rate: 0.175 },
    { min: 150_000, max: Infinity, rate: 0.21 },
  ],
  basicPersonalAmount: 8_481,
};

/** 2025 Nunavut */
export const CA_NU_2025: BracketTable = {
  brackets: [
    { min: 0, max: 53_268, rate: 0.04 },
    { min: 53_268, max: 106_537, rate: 0.07 },
    { min: 106_537, max: 173_205, rate: 0.09 },
    { min: 173_205, max: Infinity, rate: 0.115 },
  ],
  basicPersonalAmount: 18_767,
};

/** 2025 Ontario */
export const CA_ON_2025: BracketTable = {
  brackets: [
    { min: 0, max: 52_886, rate: 0.0505 },
    { min: 52_886, max: 105_775, rate: 0.0915 },
    { min: 105_775, max: 150_000, rate: 0.1116 },
    { min: 150_000, max: 220_000, rate: 0.1216 },
    { min: 220_000, max: Infinity, rate: 0.1316 },
  ],
  basicPersonalAmount: 11_865,
};

/** 2025 Prince Edward Island */
export const CA_PE_2025: BracketTable = {
  brackets: [
    { min: 0, max: 32_656, rate: 0.098 },
    { min: 32_656, max: 64_313, rate: 0.138 },
    { min: 64_313, max: 105_000, rate: 0.167 },
    { min: 105_000, max: 140_000, rate: 0.175 },
    { min: 140_000, max: Infinity, rate: 0.19 },
  ],
  basicPersonalAmount: 13_500,
};

/** 2025 Quebec */
export const CA_QC_2025: BracketTable = {
  brackets: [
    { min: 0, max: 53_255, rate: 0.14 },
    { min: 53_255, max: 106_495, rate: 0.19 },
    { min: 106_495, max: 129_590, rate: 0.24 },
    { min: 129_590, max: Infinity, rate: 0.2575 },
  ],
  basicPersonalAmount: 18_056,
};

/** 2025 Saskatchewan */
export const CA_SK_2025: BracketTable = {
  brackets: [
    { min: 0, max: 52_057, rate: 0.105 },
    { min: 52_057, max: 148_734, rate: 0.125 },
    { min: 148_734, max: Infinity, rate: 0.145 },
  ],
  basicPersonalAmount: 18_491,
};

/** 2025 Yukon */
export const CA_YT_2025: BracketTable = {
  brackets: [
    { min: 0, max: 57_375, rate: 0.064 },
    { min: 57_375, max: 114_750, rate: 0.09 },
    { min: 114_750, max: 158_468, rate: 0.109 },
    { min: 158_468, max: 500_000, rate: 0.128 },
    { min: 500_000, max: Infinity, rate: 0.15 },
  ],
  basicPersonalAmount: 16_129,
};

// ─── Canadian Lookup Tables ───────────────────────────────────────────────────

export const CA_PROVINCIAL_2025: Record<string, BracketTable> = {
  AB: CA_AB_2025,
  BC: CA_BC_2025,
  MB: CA_MB_2025,
  NB: CA_NB_2025,
  NL: CA_NL_2025,
  NT: CA_NT_2025,
  NS: CA_NS_2025,
  NU: CA_NU_2025,
  ON: CA_ON_2025,
  PE: CA_PE_2025,
  QC: CA_QC_2025,
  SK: CA_SK_2025,
  YT: CA_YT_2025,
};

// 2026 provincial tables: reuse 2025 values as placeholder until provinces publish updates.
// Task 154 will validate and update these with official values.
export const CA_PROVINCIAL_2026: Record<string, BracketTable> = { ...CA_PROVINCIAL_2025 };

const CA_FEDERAL_BY_YEAR: Record<number, BracketTable> = {
  2025: CA_FEDERAL_2025,
  2026: CA_FEDERAL_2026,
};

const CA_PROVINCIAL_BY_YEAR: Record<number, Record<string, BracketTable>> = {
  2025: CA_PROVINCIAL_2025,
  2026: CA_PROVINCIAL_2026,
};

/** Supported tax years */
export const SUPPORTED_TAX_YEARS = [2025, 2026] as const;
export type TaxYear = (typeof SUPPORTED_TAX_YEARS)[number];

/**
 * Get Canadian federal and provincial/territorial tax brackets.
 * @param province - Two-letter province/territory code (e.g., "ON", "BC", "AB")
 * @param year - Tax year (2025 or 2026; defaults to 2025)
 * @returns Federal and provincial bracket tables
 * @throws If the province code is not recognized or year is unsupported
 */
export function getCanadianBrackets(
  province: string,
  year: number = 2025
): { federal: BracketTable; provincial: BracketTable } {
  const federal = CA_FEDERAL_BY_YEAR[year];
  if (!federal) {
    throw new Error(`Tax year ${year} is not supported. Supported years: ${SUPPORTED_TAX_YEARS.join(", ")}`);
  }

  const code = province.toUpperCase();
  const provincialTables = CA_PROVINCIAL_BY_YEAR[year] ?? CA_PROVINCIAL_2025;
  const provincial = provincialTables[code];
  if (!provincial) {
    throw new Error(
      `Unknown Canadian province/territory code: "${province}". ` +
      `Valid codes: ${Object.keys(provincialTables).join(", ")}`
    );
  }

  return { federal, provincial };
}

/**
 * Calculate the taxable portion of capital gains for Canadian individuals.
 * First $250,000: 50% inclusion. Above $250,000: 66.67% inclusion.
 */
export function calculateCanadianCapitalGainsInclusion(capitalGains: number): number {
  if (capitalGains <= 0) return 0;

  const { firstTierLimit, firstTierRate, secondTierRate } = CA_CAPITAL_GAINS;
  if (capitalGains <= firstTierLimit) {
    return capitalGains * firstTierRate;
  }

  return firstTierLimit * firstTierRate + (capitalGains - firstTierLimit) * secondTierRate;
}
