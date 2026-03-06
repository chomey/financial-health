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
 * Auto-classification of known account categories by tax treatment.
 * Unknown categories default to "taxable".
 */
const TAX_TREATMENT_MAP: Record<string, TaxTreatment> = {
  // Tax-free accounts — withdrawals are never taxed
  "TFSA": "tax-free",
  "Roth IRA": "tax-free",
  "Roth 401k": "tax-free",
  "HSA": "tax-free",

  // Tax-deferred accounts — full withdrawal taxed as income
  "RRSP": "tax-deferred",
  "401k": "tax-deferred",
  "IRA": "tax-deferred",
  "LIRA": "tax-deferred",
  "RESP": "tax-deferred",
  "FHSA": "tax-deferred",
  "529": "tax-deferred",

  // Taxable accounts — only gains portion is taxed
  "Savings": "taxable",
  "Savings Account": "taxable",
  "Checking": "taxable",
  "Brokerage": "taxable",
  "Vehicle": "taxable",
  "Other": "taxable",
};

/**
 * Get the tax treatment for a given account category.
 * Returns the classified treatment, or "taxable" for unknown categories.
 */
export function getTaxTreatment(category: string): TaxTreatment {
  return TAX_TREATMENT_MAP[category] ?? "taxable";
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
      const taxResult = computeTax(annualWithdrawal, "employment", country, jurisdiction);
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
      const taxResult = computeTax(gainsAmount, incomeType, country, jurisdiction);
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
