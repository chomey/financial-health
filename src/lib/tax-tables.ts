/**
 * Tax bracket tables for all supported countries.
 *
 * Canadian data has been extracted to @/lib/countries/canada/tax-tables.ts.
 * US data has been extracted to @/lib/countries/usa/tax-tables.ts.
 * AU data has been extracted to @/lib/countries/australia/tax-tables.ts.
 * Shared bracket types and calculateProgressiveTax live in @/lib/bracket-math.ts.
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

export {
  AU_FEDERAL_2025,
  AU_FEDERAL_2026,
  AU_FEDERAL_BY_YEAR,
  AU_MEDICARE_LEVY,
  getAUBrackets,
  calculateMedicareLevy,
} from "@/lib/countries/australia/tax-tables";
