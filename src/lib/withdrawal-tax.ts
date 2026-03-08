/**
 * Withdrawal Tax Classification and Computation
 *
 * Classifies account types by tax treatment for withdrawal modeling:
 * - "tax-free": Withdrawals are never taxed (TFSA, Roth IRA, HSA)
 * - "tax-deferred": Full withdrawal is taxed as income (RRSP, 401k, IRA, LIRA, RESP, 529)
 * - "taxable": Only gains portion is taxed at capital gains rates (Savings, Checking, Brokerage)
 */

import { computeTax } from "./tax-engine";

export type TaxTreatment = "tax-free" | "tax-deferred" | "taxable";

export interface WithdrawalTaxResult {
  effectiveRate: number;
  taxFreeAmount: number;
  taxableAmount: number;
}

/**
 * Keyword lists for auto-classifying account categories by tax treatment.
 * Matched case-insensitively against any substring of the category name.
 * Tax-free keywords are checked first so "Roth 401k" → tax-free, not tax-deferred.
 */
const TAX_FREE_KEYWORDS = ["tfsa", "roth", "hsa", "fhsa", "tax-free", "tax free"];
const TAX_DEFERRED_KEYWORDS = ["rrsp", "401k", "ira", "lira", "resp", "529", "pension", "retirement"];

/**
 * Classify an account category by tax treatment using keyword matching.
 * Tax-free keywords take priority over tax-deferred (e.g. "Roth 401k" → tax-free).
 * Unknown categories default to "taxable".
 */
export function classifyTaxTreatment(category: string): TaxTreatment {
  const lower = category.toLowerCase();

  // Tax-free keywords take priority (so "Roth 401k" matches "roth" → tax-free)
  if (TAX_FREE_KEYWORDS.some((kw) => lower.includes(kw))) {
    return "tax-free";
  }

  // Tax-deferred keywords
  if (TAX_DEFERRED_KEYWORDS.some((kw) => lower.includes(kw))) {
    return "tax-deferred";
  }

  // Everything else is taxable
  return "taxable";
}

/**
 * Get the tax treatment for a given account category.
 * If an override is provided, it takes priority over keyword matching.
 * Otherwise, uses keyword-based auto-classification.
 */
export function getTaxTreatment(category: string, override?: TaxTreatment): TaxTreatment {
  if (override) return override;
  return classifyTaxTreatment(category);
}

/**
 * Compute the tax impact of withdrawing from a given account type.
 *
 * @param category - Account category name (e.g., "TFSA", "RRSP", "Brokerage")
 * @param country - "CA" or "US"
 * @param jurisdiction - Province/state code (e.g., "ON", "CA")
 * @param annualWithdrawal - Amount being withdrawn annually
 * @param costBasisPercent - For taxable accounts, the percentage of the balance that is
 *   original contributions (0-100, default 100). Only gains (above cost basis) are taxed.
 * @returns WithdrawalTaxResult with effective rate, tax-free amount, and taxable amount
 */
export function getWithdrawalTaxRate(
  category: string,
  country: "CA" | "US",
  jurisdiction: string,
  annualWithdrawal: number,
  costBasisPercent: number = 100,
  roiTaxTreatment?: "capital-gains" | "income",
  year: number = 2025,
): WithdrawalTaxResult {
  if (annualWithdrawal <= 0) {
    return { effectiveRate: 0, taxFreeAmount: 0, taxableAmount: 0 };
  }

  const treatment = getTaxTreatment(category);

  switch (treatment) {
    case "tax-free": {
      // No tax on withdrawals
      return {
        effectiveRate: 0,
        taxFreeAmount: annualWithdrawal,
        taxableAmount: 0,
      };
    }

    case "tax-deferred": {
      // Full withdrawal is taxed as employment/ordinary income
      const taxResult = computeTax(annualWithdrawal, "employment", country, jurisdiction, year);
      return {
        effectiveRate: taxResult.effectiveRate,
        taxFreeAmount: 0,
        taxableAmount: annualWithdrawal,
      };
    }

    case "taxable": {
      // Only the gains portion is taxed at capital gains rates
      const clampedBasis = Math.max(0, Math.min(100, costBasisPercent));
      const gainsPercent = (100 - clampedBasis) / 100;
      const gainsAmount = annualWithdrawal * gainsPercent;
      const costBasisAmount = annualWithdrawal - gainsAmount;

      if (gainsAmount <= 0) {
        // All cost basis, no gains to tax
        return {
          effectiveRate: 0,
          taxFreeAmount: annualWithdrawal,
          taxableAmount: 0,
        };
      }

      const incomeType = roiTaxTreatment === "income" ? "employment" : "capital-gains";
      const taxResult = computeTax(gainsAmount, incomeType, country, jurisdiction, year);
      // Effective rate is relative to the total withdrawal, not just the gains
      const effectiveRate = annualWithdrawal > 0 ? (taxResult.totalTax / annualWithdrawal) : 0;

      return {
        effectiveRate,
        taxFreeAmount: costBasisAmount,
        taxableAmount: gainsAmount,
      };
    }
  }
}
