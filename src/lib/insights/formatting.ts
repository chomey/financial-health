import type { FilingStatus } from "@/lib/tax-credits";
import { formatCurrency as canonicalFormatCurrency, formatCurrencyCompact } from "@/lib/currency";
import type { SupportedCurrency } from "@/lib/currency";

// Module-level currency code, set per generateInsights call
export let _insightCurrency: SupportedCurrency = "USD";

export function setInsightCurrency(currency: string) {
  _insightCurrency = currency as SupportedCurrency;
}

export function formatCurrency(amount: number): string {
  return canonicalFormatCurrency(Math.abs(amount), _insightCurrency, { homeCurrency: _insightCurrency });
}

export function formatCompact(amount: number): string {
  return formatCurrencyCompact(Math.abs(amount), _insightCurrency, _insightCurrency);
}

/** Returns a human-readable label for a filing status. */
export function _filingStatusLabel(status: FilingStatus): string {
  switch (status) {
    case "single": return "single filers";
    case "married-jointly": return "Married Filing Jointly";
    case "married-separately": return "Married Filing Separately";
    case "head-of-household": return "Head of Household";
    case "married-common-law": return "Married/Common-Law";
    case "married-de-facto": return "Married/De Facto";
    default: return status;
  }
}
