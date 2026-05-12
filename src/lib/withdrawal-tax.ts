/**
 * Withdrawal Tax Classification and Computation — thin shim.
 *
 * getWithdrawalTaxRate and getEarlyWithdrawalPenalties delegate to
 * getCountry(country).taxEngine. classifyTaxTreatment is kept as a
 * country-agnostic keyword matcher because callers don't always have country
 * context (e.g. getTaxTreatment in AssetEntry).
 */

import { getCountry, type CountryCode } from "@/lib/countries";

export type TaxTreatment = "tax-free" | "tax-deferred" | "taxable" | "super-accumulation" | "super-fhss";

export interface WithdrawalTaxResult {
  effectiveRate: number;
  taxFreeAmount: number;
  taxableAmount: number;
}

export interface EarlyWithdrawalPenalty {
  /** Account category that would incur a penalty */
  category: string;
  /** Penalty percentage (e.g., 10 for 10%) */
  penaltyPercent: number;
  /** Minimum age for penalty-free withdrawal */
  penaltyFreeAge: number;
  /** Country-specific rule description */
  rule: string;
}

const TAX_FREE_KEYWORDS = ["tfsa", "roth", "hsa", "fhsa", "tax-free", "tax free"];
const TAX_DEFERRED_KEYWORDS = ["rrsp", "401k", "ira", "lira", "resp", "529", "pension", "retirement"];

/**
 * Classify an account category by tax treatment using cross-country keyword
 * matching. Called without country context (e.g. from AssetEntry). For
 * country-specific classification, use getCountry(code).taxEngine.classifyTaxTreatment.
 */
export function classifyTaxTreatment(category: string): TaxTreatment {
  const lower = category.toLowerCase();

  if (lower.includes("super") && lower.includes("pension")) return "tax-free";
  if (lower.includes("first home super") || lower === "fhss") return "super-fhss";
  if (lower.includes("super") && lower.includes("accumulation")) return "super-accumulation";

  if (TAX_FREE_KEYWORDS.some((kw) => lower.includes(kw))) return "tax-free";
  if (TAX_DEFERRED_KEYWORDS.some((kw) => lower.includes(kw))) return "tax-deferred";

  return "taxable";
}

export function getTaxTreatment(category: string, override?: TaxTreatment): TaxTreatment {
  if (override) return override;
  return classifyTaxTreatment(category);
}

/** @deprecated Use getCountry(code).taxEngine.getEarlyWithdrawalPenalties */
export function getEarlyWithdrawalPenalties(
  categories: string[],
  age: number | undefined,
  country: CountryCode,
): EarlyWithdrawalPenalty[] {
  if (age === undefined || age <= 0) return [];
  return getCountry(country).taxEngine.getEarlyWithdrawalPenalties(categories, age);
}

/** @deprecated Use getCountry(code).taxEngine.getWithdrawalTaxRate */
export function getWithdrawalTaxRate(
  category: string,
  country: CountryCode,
  jurisdiction: string,
  annualWithdrawal: number,
  costBasisPercent: number = 100,
  roiTaxTreatment?: "capital-gains" | "income",
  year: number = 2025,
): WithdrawalTaxResult {
  if (annualWithdrawal <= 0) {
    return { effectiveRate: 0, taxFreeAmount: 0, taxableAmount: 0 };
  }
  return getCountry(country).taxEngine.getWithdrawalTaxRate({
    category,
    jurisdiction,
    annualWithdrawal,
    costBasisPercent,
    roiTaxTreatment,
    year,
  });
}
