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
// AU constants/helpers live in src/lib/countries/australia/government-retirement.ts.
// Re-exported here for backward compatibility until the shim refactor (Ralph task 224).

export {
  AU_PENSION_SINGLE_FORTNIGHTLY,
  AU_PENSION_COUPLE_EACH_FORTNIGHTLY,
  AU_PENSION_AGE,
  AU_SUPER_PRESERVATION_AGE,
  getAuPensionPresetAmount,
  fortnightlyToMonthly,
  type AuPensionPreset,
} from "@/lib/countries/australia/government-retirement";

// ── GovernmentRetirementIncome type ──────────────────────────────────────────
export type { GovernmentRetirementIncome } from "@/lib/financial-types";

import type { GovernmentRetirementIncome } from "@/lib/financial-types";
import { getCountry } from "@/lib/countries";

/**
 * Compute total monthly government retirement income for a given country.
 * Returns 0 if no government income is configured.
 */
export function computeMonthlyGovernmentIncome(
  country: "CA" | "US" | "AU",
  gri?: GovernmentRetirementIncome,
): number {
  return getCountry(country).governmentRetirement.computeMonthly(gri);
}
