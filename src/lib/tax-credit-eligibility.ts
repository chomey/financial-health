import type { FilingStatus, TaxCreditCategory } from "@/lib/tax-credit-types";

export function checkIncomeEligibility(
  category: TaxCreditCategory,
  annualIncome: number,
  filingStatus: FilingStatus,
): "eligible" | "reduced" | "ineligible" {
  const limits = category.incomeLimits[filingStatus];
  if (!limits) return "eligible";
  if (limits.ineligible) return "ineligible";
  if (limits.hardCap !== undefined && annualIncome > limits.hardCap) return "ineligible";
  if (limits.phaseOutEnd !== undefined && annualIncome > limits.phaseOutEnd) return "ineligible";
  if (limits.phaseOutStart !== undefined && annualIncome > limits.phaseOutStart) return "reduced";
  return "eligible";
}

export function getIncomeLimitDescription(category: TaxCreditCategory, filingStatus: FilingStatus): string | null {
  const limits = category.incomeLimits[filingStatus];
  if (!limits) return null;
  if (limits.ineligible) {
    const statusLabel = filingStatus === "married-separately" ? "Married Filing Separately"
      : filingStatus === "married-jointly" ? "Married Filing Jointly"
      : filingStatus === "head-of-household" ? "Head of Household"
      : filingStatus === "married-common-law" ? "Married/Common-Law"
      : filingStatus === "married-de-facto" ? "Married/De Facto"
      : "Single";
    return `Not available for ${statusLabel}`;
  }
  if (limits.hardCap !== undefined) return `Income must be below $${limits.hardCap.toLocaleString()}`;
  if (limits.phaseOutStart !== undefined && limits.phaseOutEnd !== undefined) {
    return `Phases out between $${limits.phaseOutStart.toLocaleString()} and $${limits.phaseOutEnd.toLocaleString()}`;
  }
  if (limits.phaseOutStart !== undefined) return `Begins to phase out above $${limits.phaseOutStart.toLocaleString()}`;
  return null;
}
