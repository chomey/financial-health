/**
 * US government retirement income — Social Security plugin.
 *
 * Constants reflect 2025 published values (ssa.gov). The legacy
 * `src/lib/government-retirement.ts` re-exports these for
 * backward compatibility until the shim refactor.
 */
import type { GovernmentRetirementPlugin } from "@/lib/countries/types";

/** SS average monthly benefit for retired workers (2025). Source: ssa.gov */
export const SS_AVERAGE_MONTHLY = 1_976;
/** SS maximum monthly benefit at age 62 (2025). Source: ssa.gov */
export const SS_MAX_AT_62 = 2_710;
/** SS maximum monthly benefit at full retirement age 67 (2025). Source: ssa.gov */
export const SS_MAX_AT_67 = 3_822;
/** SS maximum monthly benefit at age 70 (2025). Source: ssa.gov */
export const SS_MAX_AT_70 = 4_873;

export type SsPreset = "none" | "average" | "max-62" | "max-67" | "max-70" | "custom";

export function getSsPresetAmount(preset: SsPreset, customAmount?: number): number {
  if (preset === "average") return SS_AVERAGE_MONTHLY;
  if (preset === "max-62") return SS_MAX_AT_62;
  if (preset === "max-67") return SS_MAX_AT_67;
  if (preset === "max-70") return SS_MAX_AT_70;
  if (preset === "custom") return customAmount ?? 0;
  return 0;
}

export const americanGovernmentRetirement: GovernmentRetirementPlugin = {
  programLabel: "Social Security",
  computeMonthly(income) {
    if (!income) return 0;
    return income.ssMonthly ?? 0;
  },
  presetsFor(field) {
    if (field === "ss") {
      return [
        { value: "none", label: "None", amount: 0 },
        { value: "average", label: "Average ($1,976/mo)", amount: SS_AVERAGE_MONTHLY },
        { value: "max-62", label: "Max @ 62 ($2,710/mo)", amount: SS_MAX_AT_62 },
        { value: "max-67", label: "Max @ 67 ($3,822/mo)", amount: SS_MAX_AT_67 },
        { value: "max-70", label: "Max @ 70 ($4,873/mo)", amount: SS_MAX_AT_70 },
        { value: "custom", label: "Custom", amount: 0 },
      ];
    }
    return [];
  },
};
