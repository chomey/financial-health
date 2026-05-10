/**
 * Government retirement income presets and helpers.
 * Ballpark estimates for CPP/OAS (CA), Social Security (US), Age Pension (AU).
 * These are approximate 2025 values — good enough for snapshot-level planning.
 */

// ── Canadian CPP & OAS ──────────────────────────────────────────────────────
// CA constants live in src/lib/countries/canada/government-retirement.ts.
// Re-exported here for backward compatibility until the shim refactor (Ralph task 224).

export {
  CPP_MAX_MONTHLY,
  CPP_AVERAGE_MONTHLY,
  OAS_MAX_MONTHLY_65_74,
  OAS_MAX_MONTHLY_75_PLUS,
  OAS_CLAWBACK_THRESHOLD,
} from "@/lib/countries/canada/government-retirement";

import {
  CPP_MAX_MONTHLY,
  CPP_AVERAGE_MONTHLY,
  OAS_MAX_MONTHLY_65_74,
} from "@/lib/countries/canada/government-retirement";

export type CppPreset = "none" | "average" | "max" | "custom";
export type OasPreset = "none" | "full" | "custom";

export function getCppPresetAmount(preset: CppPreset, customAmount?: number): number {
  switch (preset) {
    case "none": return 0;
    case "average": return CPP_AVERAGE_MONTHLY;
    case "max": return CPP_MAX_MONTHLY;
    case "custom": return customAmount ?? 0;
  }
}

export function getOasPresetAmount(preset: OasPreset, customAmount?: number): number {
  switch (preset) {
    case "none": return 0;
    case "full": return OAS_MAX_MONTHLY_65_74;
    case "custom": return customAmount ?? 0;
  }
}

// ── US Social Security ───────────────────────────────────────────────────────
// US constants live in src/lib/countries/usa/government-retirement.ts.
// Re-exported here for backward compatibility until the shim refactor (Ralph task 224).

export {
  SS_AVERAGE_MONTHLY,
  SS_MAX_AT_62,
  SS_MAX_AT_67,
  SS_MAX_AT_70,
} from "@/lib/countries/usa/government-retirement";

import {
  SS_AVERAGE_MONTHLY,
  SS_MAX_AT_62,
  SS_MAX_AT_67,
  SS_MAX_AT_70,
} from "@/lib/countries/usa/government-retirement";

export type SsPreset = "none" | "average" | "max-62" | "max-67" | "max-70" | "custom";

export function getSsPresetAmount(preset: SsPreset, customAmount?: number): number {
  switch (preset) {
    case "none": return 0;
    case "average": return SS_AVERAGE_MONTHLY;
    case "max-62": return SS_MAX_AT_62;
    case "max-67": return SS_MAX_AT_67;
    case "max-70": return SS_MAX_AT_70;
    case "custom": return customAmount ?? 0;
  }
}

// ── Australian Age Pension ────────────────────────────────────────────────────

/** Age Pension maximum fortnightly rate — single (Sep 2024). Source: services.gov.au */
export const AU_PENSION_SINGLE_FORTNIGHTLY = 1_116.30;
/** Age Pension maximum fortnightly rate — each member of a couple (Sep 2024). Source: services.gov.au */
export const AU_PENSION_COUPLE_EACH_FORTNIGHTLY = 841.40;
/** Age Pension eligibility age. */
export const AU_PENSION_AGE = 67;
/** Super preservation age (born after 1 July 1964). */
export const AU_SUPER_PRESERVATION_AGE = 60;

export type AuPensionPreset = "none" | "full-single" | "full-couple" | "custom";

export function getAuPensionPresetAmount(preset: AuPensionPreset, customAmount?: number): number {
  switch (preset) {
    case "none": return 0;
    case "full-single": return AU_PENSION_SINGLE_FORTNIGHTLY;
    case "full-couple": return AU_PENSION_COUPLE_EACH_FORTNIGHTLY;
    case "custom": return customAmount ?? 0;
  }
}

/** Convert fortnightly amount to monthly: fortnightly × 26 / 12 */
export function fortnightlyToMonthly(fortnightly: number): number {
  return fortnightly * 26 / 12;
}

/**
 * Compute total monthly government retirement income for a given country.
 * Returns 0 if no government income is configured.
 */
export function computeMonthlyGovernmentIncome(
  country: "CA" | "US" | "AU",
  gri?: { cppMonthly?: number; oasMonthly?: number; ssMonthly?: number; agePensionFortnightly?: number },
): number {
  if (!gri) return 0;
  switch (country) {
    case "CA":
      return (gri.cppMonthly ?? 0) + (gri.oasMonthly ?? 0);
    case "US":
      return gri.ssMonthly ?? 0;
    case "AU":
      // Convert fortnightly to monthly: fortnightly × 26 / 12
      return (gri.agePensionFortnightly ?? 0) * 26 / 12;
    default:
      return 0;
  }
}
