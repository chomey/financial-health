/**
 * Australian government retirement income — Age Pension plugin.
 *
 * Constants reflect Sep 2024 published values (services.gov.au).
 * Pension is paid fortnightly; computeMonthly converts via × 26 / 12.
 *
 * The legacy `src/lib/government-retirement.ts` re-exports these for
 * backward compatibility until the shim refactor (Ralph task 224).
 */
import type { GovernmentRetirementPlugin } from "@/lib/countries/types";

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

export const australianGovernmentRetirement: GovernmentRetirementPlugin = {
  computeMonthly(income) {
    if (!income) return 0;
    return fortnightlyToMonthly(income.agePensionFortnightly ?? 0);
  },
  presetsFor(field) {
    if (field === "agePension") {
      return [
        { value: "none", label: "None", amount: 0 },
        { value: "full-single", label: "Full single ($1,116/fn)", amount: AU_PENSION_SINGLE_FORTNIGHTLY },
        { value: "full-couple", label: "Full couple ($841/fn ea)", amount: AU_PENSION_COUPLE_EACH_FORTNIGHTLY },
        { value: "custom", label: "Custom", amount: 0 },
      ];
    }
    return [];
  },
};
