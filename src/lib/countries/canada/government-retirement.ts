/**
 * Canadian government retirement income — CPP + OAS plugin.
 *
 * Constants reflect 2026 published values. The legacy
 * `src/lib/government-retirement.ts` re-exports these for
 * backward compatibility until the shim refactor.
 */
import type { GovernmentRetirementPlugin } from "@/lib/countries/types";

/** CPP maximum monthly benefit at age 65 (2026). Source: canada.ca */
export const CPP_MAX_MONTHLY = 1_507.65;
/** CPP average monthly benefit for new beneficiaries at age 65 (2026). Source: canada.ca */
export const CPP_AVERAGE_MONTHLY = 925.35;

/** OAS maximum monthly benefit ages 65-74 (Q1 2026). Source: canada.ca */
export const OAS_MAX_MONTHLY_65_74 = 742.31;
/** OAS maximum monthly benefit ages 75+ (Q1 2026). Source: canada.ca */
export const OAS_MAX_MONTHLY_75_PLUS = 816.54;

/** OAS clawback threshold — recovery tax begins above this net income (2025 tax year). */
export const OAS_CLAWBACK_THRESHOLD = 93_454;

export type CppPreset = "none" | "average" | "max" | "custom";
export type OasPreset = "none" | "full" | "custom";

export function getCppPresetAmount(preset: CppPreset, customAmount?: number): number {
  if (preset === "average") return CPP_AVERAGE_MONTHLY;
  if (preset === "max") return CPP_MAX_MONTHLY;
  if (preset === "custom") return customAmount ?? 0;
  return 0;
}

export function getOasPresetAmount(preset: OasPreset, customAmount?: number): number {
  if (preset === "full") return OAS_MAX_MONTHLY_65_74;
  if (preset === "custom") return customAmount ?? 0;
  return 0;
}

function monthlyLabelAmount(amount: number): string {
  return Math.round(amount).toLocaleString("en-US");
}

export const canadianGovernmentRetirement: GovernmentRetirementPlugin = {
  programLabel: "CPP + OAS",
  computeMonthly(income) {
    if (!income) return 0;
    return (income.cppMonthly ?? 0) + (income.oasMonthly ?? 0);
  },
  presetsFor(field) {
    if (field === "cpp") {
      return [
        { value: "none", label: "None", amount: 0 },
        { value: "average", label: `Average ($${monthlyLabelAmount(CPP_AVERAGE_MONTHLY)}/mo)`, amount: CPP_AVERAGE_MONTHLY },
        { value: "max", label: `Max ($${monthlyLabelAmount(CPP_MAX_MONTHLY)}/mo)`, amount: CPP_MAX_MONTHLY },
        { value: "custom", label: "Custom", amount: 0 },
      ];
    }
    if (field === "oas") {
      return [
        { value: "none", label: "None", amount: 0 },
        { value: "full", label: `Full ($${monthlyLabelAmount(OAS_MAX_MONTHLY_65_74)}/mo)`, amount: OAS_MAX_MONTHLY_65_74 },
        { value: "custom", label: "Custom", amount: 0 },
      ];
    }
    return [];
  },
};
