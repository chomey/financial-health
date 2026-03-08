import type { FilingStatus } from "@/lib/tax-credits";

// Module-level currency code, set per generateInsights call
export let _insightCurrency = "USD";

export function setInsightCurrency(currency: string) {
  _insightCurrency = currency;
}

export function formatCurrency(amount: number): string {
  const abs = Math.abs(amount);
  return "$" + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(abs);
}

export function formatCompact(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(abs / 1_000).toFixed(0)}k`;
  return formatCurrency(amount);
}

/** Returns a human-readable label for a filing status. */
export function _filingStatusLabel(status: FilingStatus): string {
  switch (status) {
    case "single": return "single filers";
    case "married-jointly": return "Married Filing Jointly";
    case "married-separately": return "Married Filing Separately";
    case "head-of-household": return "Head of Household";
    case "married-common-law": return "Married/Common-Law";
    default: return status;
  }
}
