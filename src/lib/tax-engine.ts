import { getCountry, type CountryCode } from "@/lib/countries";

export type IncomeType = "employment" | "capital-gains" | "other";

export interface TaxResult {
  totalTax: number;
  effectiveRate: number;
  marginalRate: number;
  afterTaxIncome: number;
  breakdown: { label: string; amount: number; kind: "income-tax" | "social" | "sub-federal" }[];
}

/** @deprecated Use getCountry(code).taxEngine.computeTax */
export function computeTax(
  annualIncome: number,
  type: IncomeType,
  country: CountryCode,
  jurisdiction: string,
  year: number = new Date().getFullYear(),
): TaxResult {
  return getCountry(country).taxEngine.computeTax(annualIncome, type, jurisdiction, year);
}

/** @deprecated Use getCountry(code).taxEngine.getMarginalRate */
export function getMarginalRateForIncome(
  annualIncome: number,
  country: CountryCode,
  jurisdiction: string,
  year: number = new Date().getFullYear(),
): number {
  return getCountry(country).taxEngine.getMarginalRate(annualIncome, jurisdiction, year);
}
