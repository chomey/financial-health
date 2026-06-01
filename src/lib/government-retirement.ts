/** Thin registry-backed shim for government retirement income. */
import { getCountry, type CountryCode } from "@/lib/countries";
import type { GovernmentRetirementIncome } from "@/lib/financial-types";

export type { GovernmentRetirementIncome } from "@/lib/financial-types";

export function computeMonthlyGovernmentIncome(
  country: CountryCode,
  income?: GovernmentRetirementIncome,
): number {
  return getCountry(country).governmentRetirement.computeMonthly(income);
}
