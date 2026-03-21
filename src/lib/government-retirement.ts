/**
 * Government retirement income presets and helpers.
 * Ballpark estimates for CPP/OAS (CA), Social Security (US), Age Pension (AU).
 * These are approximate 2025 values — good enough for snapshot-level planning.
 */

// ── Canadian CPP & OAS ──────────────────────────────────────────────────────

/** CPP maximum monthly benefit at age 65 (2025). Source: canada.ca */
export const CPP_MAX_MONTHLY = 1_364.60;
/** CPP average monthly benefit (2025). Source: canada.ca */
export const CPP_AVERAGE_MONTHLY = 816.52;

/** OAS maximum monthly benefit ages 65-74 (Q1 2025). Source: canada.ca */
export const OAS_MAX_MONTHLY_65_74 = 727.67;
/** OAS maximum monthly benefit ages 75+ (Q1 2025). Source: canada.ca */
export const OAS_MAX_MONTHLY_75_PLUS = 800.44;

/** OAS clawback threshold — recovery tax begins above this net income (2024 tax year). */
export const OAS_CLAWBACK_THRESHOLD = 90_997;

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
