/**
 * Canadian government retirement income — CPP + OAS plugin.
 *
 * Constants reflect 2025 published values. The legacy
 * `src/lib/government-retirement.ts` re-exports these for
 * backward compatibility until the shim refactor.
 */
import type { GovernmentRetirementPlugin } from "@/lib/countries/types";

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
        { value: "average", label: "Average ($816/mo)", amount: CPP_AVERAGE_MONTHLY },
        { value: "max", label: "Max ($1,365/mo)", amount: CPP_MAX_MONTHLY },
        { value: "custom", label: "Custom", amount: 0 },
      ];
    }
    if (field === "oas") {
      return [
        { value: "none", label: "None", amount: 0 },
        { value: "full", label: "Full ($728/mo)", amount: OAS_MAX_MONTHLY_65_74 },
        { value: "custom", label: "Custom", amount: 0 },
      ];
    }
    return [];
  },
};
