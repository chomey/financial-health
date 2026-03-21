/**
 * Withdrawal Tax Classification and Computation
 *
 * Classifies account types by tax treatment for withdrawal modeling:
 * - "tax-free": Withdrawals are never taxed (TFSA, Roth IRA, HSA, Super Pension Phase after 60)
 * - "tax-deferred": Full withdrawal is taxed as income (RRSP, 401k, IRA, LIRA, RESP, 529)
 * - "taxable": Only gains portion is taxed at capital gains rates (Savings, Checking, Brokerage)
 * - "super-accumulation": Earnings taxed at flat 15% within the fund
 * - "super-fhss": Taxed at marginal rate minus 30% offset
 */

import { computeTax } from "./tax-engine";

export type TaxTreatment = "tax-free" | "tax-deferred" | "taxable" | "super-accumulation" | "super-fhss";

export interface WithdrawalTaxResult {
  effectiveRate: number;
  taxFreeAmount: number;
  taxableAmount: number;
}

/**
 * Keyword lists for auto-classifying account categories by tax treatment.
 * Matched case-insensitively against any substring of the category name.
 * AU super accounts are checked first, then tax-free, then tax-deferred.
 */
const TAX_FREE_KEYWORDS = ["tfsa", "roth", "hsa", "fhsa", "tax-free", "tax free"];
const TAX_DEFERRED_KEYWORDS = ["rrsp", "401k", "ira", "lira", "resp", "529", "pension", "retirement"];

/**
 * Classify an account category by tax treatment using keyword matching.
 * AU super accounts have special treatment checked first.
 * Tax-free keywords take priority over tax-deferred (e.g. "Roth 401k" → tax-free).
 * Unknown categories default to "taxable".
 */
export function classifyTaxTreatment(category: string): TaxTreatment {
  const lower = category.toLowerCase();

  // AU super accounts — check before generic keywords to avoid "pension" match
  if (lower.includes("super") && lower.includes("pension")) {
    return "tax-free"; // Tax-free after age 60 (we assume retirement-age withdrawals)
  }
  if (lower.includes("first home super") || lower === "fhss") {
    return "super-fhss";
  }
  if (lower.includes("super") && lower.includes("accumulation")) {
    return "super-accumulation";
  }

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

// ── Early Withdrawal Penalties ────────────────────────────────────────────────

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

/**
 * Check if withdrawing from an account would incur early withdrawal penalties
 * based on the user's current age and account type.
 *
 * Rules:
 * - CA: RRSP/LIRA — withholding tax always applies, but no age-based "penalty" per se.
 *       We flag RRSP withdrawals before retirement age as suboptimal (taxed as income).
 * - US: 401k/IRA — 10% penalty before age 59.5 (on top of income tax)
 *       Roth IRA — 10% penalty on earnings before 59.5 (contributions are always penalty-free)
 * - AU: Super — cannot access before preservation age 60 (effectively infinite penalty)
 */
export function getEarlyWithdrawalPenalties(
  categories: string[],
  age: number | undefined,
  country: "CA" | "US" | "AU",
): EarlyWithdrawalPenalty[] {
  if (age === undefined || age <= 0) return [];

  const penalties: EarlyWithdrawalPenalty[] = [];

  for (const cat of categories) {
    const lower = cat.toLowerCase();

    if (country === "US") {
      // 401k/Traditional IRA: 10% penalty before 59.5
      if (age < 59.5) {
        if (
          (lower.includes("401k") || lower.includes("ira") || lower.includes("403b") || lower.includes("457")) &&
          !lower.includes("roth")
        ) {
          penalties.push({
            category: cat,
            penaltyPercent: 10,
            penaltyFreeAge: 59.5,
            rule: "10% early withdrawal penalty before age 59½ (plus income tax)",
          });
        }
        // Roth IRA earnings penalty before 59.5
        if (lower.includes("roth") && lower.includes("ira")) {
          penalties.push({
            category: cat,
            penaltyPercent: 10,
            penaltyFreeAge: 59.5,
            rule: "10% penalty on earnings before age 59½ (contributions always penalty-free)",
          });
        }
      }
    }

    if (country === "CA") {
      // RRSP: withholding tax on early withdrawal (not exactly a penalty, but tax-inefficient)
      // We flag it as a warning since it's taxed as income and withholding applies
      if (age < 65 && (lower.includes("rrsp") || lower.includes("lira"))) {
        penalties.push({
          category: cat,
          penaltyPercent: 0, // No explicit penalty, but withholding tax 10-30%
          penaltyFreeAge: 65,
          rule: "Withdrawals taxed as income with 10-30% withholding. Consider waiting until lower income years.",
        });
      }
    }

    if (country === "AU") {
      // Super: cannot access before preservation age 60
      if (age < 60 && lower.includes("super") && !lower.includes("fhss") && !lower.includes("first home")) {
        penalties.push({
          category: cat,
          penaltyPercent: 0, // Not accessible at all, not a percentage penalty
          penaltyFreeAge: 60,
          rule: "Super cannot be accessed before preservation age 60 (limited exceptions apply)",
        });
      }
    }
  }

  return penalties;
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
  country: "CA" | "US" | "AU",
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
      // No tax on withdrawals (includes Super Pension Phase — tax-free after 60)
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

    case "super-accumulation": {
      // AU Super Accumulation: earnings taxed at flat 15% within the fund
      const taxAmount = annualWithdrawal * 0.15;
      return {
        effectiveRate: 0.15,
        taxFreeAmount: annualWithdrawal - taxAmount,
        taxableAmount: annualWithdrawal,
      };
    }

    case "super-fhss": {
      // AU First Home Super Saver: taxed at marginal rate minus 30% offset
      const marginalResult = computeTax(annualWithdrawal, "employment", country, jurisdiction, year);
      const offsetRate = Math.max(0, marginalResult.effectiveRate - 0.30);
      const taxAmount = annualWithdrawal * offsetRate;
      return {
        effectiveRate: offsetRate,
        taxFreeAmount: annualWithdrawal - taxAmount,
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
