/**
 * Australian government retirement income — Age Pension plugin.
 *
 * Constants reflect rates from 20 March 2026 (servicesaustralia.gov.au).
 * Pension is paid fortnightly; computeMonthly converts via × 26 / 12.
 *
 * The legacy `src/lib/government-retirement.ts` re-exports these for
 * backward compatibility until the shim refactor (Ralph task 224).
 */
import type { GovernmentRetirementPlugin } from "@/lib/countries/types";

/** Age Pension maximum fortnightly rate — single (from 20 March 2026). Source: servicesaustralia.gov.au */
export const AU_PENSION_SINGLE_FORTNIGHTLY = 1_200.90;
/** Age Pension maximum fortnightly rate — each member of a couple (from 20 March 2026). Source: servicesaustralia.gov.au */
export const AU_PENSION_COUPLE_EACH_FORTNIGHTLY = 905.20;
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

function fortnightlyLabelAmount(amount: number): string {
  return Math.round(amount).toLocaleString("en-US");
}

export const australianGovernmentRetirement: GovernmentRetirementPlugin = {
  programLabel: "Age Pension",
  computeMonthly(income) {
    if (!income) return 0;
    return fortnightlyToMonthly(income.agePensionFortnightly ?? 0);
  },
  presetsFor(field) {
    if (field === "agePension") {
      return [
        { value: "none", label: "None", amount: 0 },
        { value: "full-single", label: `Full single ($${fortnightlyLabelAmount(AU_PENSION_SINGLE_FORTNIGHTLY)}/fn)`, amount: AU_PENSION_SINGLE_FORTNIGHTLY },
        { value: "full-couple", label: `Full couple ($${fortnightlyLabelAmount(AU_PENSION_COUPLE_EACH_FORTNIGHTLY)}/fn ea)`, amount: AU_PENSION_COUPLE_EACH_FORTNIGHTLY },
        { value: "custom", label: "Custom", amount: 0 },
      ];
    }
    return [];
  },
};
