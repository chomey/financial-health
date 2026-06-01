/** Thin registry-backed shim for tax-credit catalogs. */
import { getCountry, type CountryCode } from "@/lib/countries";

export type {
  AUFilingStatus,
  CAFilingStatus,
  FilingStatus,
  IncomeLimitThresholds,
  TaxCredit,
  TaxCreditCategory,
  TaxCreditYearOverride,
  USFilingStatus,
} from "@/lib/tax-credit-types";
export { checkIncomeEligibility, getIncomeLimitDescription } from "@/lib/tax-credit-eligibility";
export { resolveCategoryForYear } from "@/lib/tax-credit-resolve";

import type { FilingStatus, TaxCreditCategory } from "@/lib/tax-credit-types";

export function getFilingStatuses(country: CountryCode): { value: FilingStatus; label: string }[] {
  return getCountry(country).filingStatuses;
}

export function getDefaultFilingStatus(country: CountryCode): FilingStatus {
  return getCountry(country).defaultFilingStatus;
}

export function getCreditCategories(country: CountryCode, year: number = 2025): TaxCreditCategory[] {
  return getCountry(country).taxCredits.getCategories(year);
}

export function getCreditCategoriesForFilingStatus(
  country: CountryCode,
  filingStatus: FilingStatus,
  year: number = 2025,
): TaxCreditCategory[] {
  return getCountry(country).taxCredits.getCategoriesForFilingStatus(filingStatus, year);
}

export function getAllCreditCategories(country: CountryCode, year: number = 2025): TaxCreditCategory[] {
  return getCountry(country).taxCredits.getAllCategories(year);
}

export function findCreditCategory(
  name: string,
  country: CountryCode,
  year: number = 2025,
): TaxCreditCategory | undefined {
  return getCountry(country).taxCredits.findCategory(name, year);
}
