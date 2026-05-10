/**
 * Canadian TaxEngine implementation.
 *
 * Federal + provincial/territorial income tax, capital gains inclusion,
 * keyword-based account classification, and the CA branches of withdrawal
 * tax & early-withdrawal penalty rules.
 *
 * Mirrors the legacy free functions in `src/lib/tax-engine.ts` and
 * `src/lib/withdrawal-tax.ts`. Those will become thin shims (Ralph tasks
 * 222/223) that delegate here via `getCountry("CA").taxEngine.*`.
 */

import { calculateProgressiveTax, getMarginalRate } from "@/lib/bracket-math";
import type { TaxEngine, WithdrawalTaxArgs } from "@/lib/countries/types";
import type { IncomeType, TaxResult } from "@/lib/tax-engine";
import type {
  EarlyWithdrawalPenalty,
  TaxTreatment,
  WithdrawalTaxResult,
} from "@/lib/withdrawal-tax";
import {
  CA_CAPITAL_GAINS,
  calculateCanadianCapitalGainsInclusion,
  getCanadianBrackets,
} from "./tax-tables";

const TAX_FREE_KEYWORDS = ["tfsa", "fhsa", "tax-free", "tax free"];
const TAX_DEFERRED_KEYWORDS = ["rrsp", "resp", "lira", "pension"];

function classifyCanadianTaxTreatment(category: string): TaxTreatment {
  const lower = category.toLowerCase();
  if (TAX_FREE_KEYWORDS.some((kw) => lower.includes(kw))) return "tax-free";
  if (TAX_DEFERRED_KEYWORDS.some((kw) => lower.includes(kw))) return "tax-deferred";
  return "taxable";
}

function computeCanadianTax(
  annualIncome: number,
  type: IncomeType,
  province: string,
  year: number
): TaxResult {
  if (annualIncome <= 0) {
    return {
      federalTax: 0,
      provincialStateTax: 0,
      totalTax: 0,
      effectiveRate: 0,
      afterTaxIncome: 0,
      marginalRate: 0,
      breakdown: [],
    };
  }

  const { federal, provincial } = getCanadianBrackets(province, year);
  const taxableIncome =
    type === "capital-gains"
      ? calculateCanadianCapitalGainsInclusion(annualIncome)
      : annualIncome;

  const federalTax = calculateProgressiveTax(taxableIncome, federal);
  const provincialTax = calculateProgressiveTax(taxableIncome, provincial);
  const totalTax = federalTax + provincialTax;

  let marginalRate =
    getMarginalRate(taxableIncome, federal) + getMarginalRate(taxableIncome, provincial);

  if (type === "capital-gains") {
    const inclusionRate =
      annualIncome <= CA_CAPITAL_GAINS.firstTierLimit
        ? CA_CAPITAL_GAINS.firstTierRate
        : CA_CAPITAL_GAINS.secondTierRate;
    marginalRate *= inclusionRate;
  }

  return {
    federalTax,
    provincialStateTax: provincialTax,
    totalTax,
    effectiveRate: annualIncome > 0 ? totalTax / annualIncome : 0,
    afterTaxIncome: annualIncome - totalTax,
    marginalRate,
    breakdown: [
      { label: "Federal Tax", amount: federalTax, kind: "income-tax" },
      { label: "Provincial Tax", amount: provincialTax, kind: "sub-federal" },
    ],
  };
}

function getCanadianWithdrawalTaxRate(args: WithdrawalTaxArgs): WithdrawalTaxResult {
  const {
    category,
    jurisdiction,
    annualWithdrawal,
    costBasisPercent = 100,
    roiTaxTreatment,
    year = 2025,
  } = args;

  if (annualWithdrawal <= 0) {
    return { effectiveRate: 0, taxFreeAmount: 0, taxableAmount: 0 };
  }

  const treatment = classifyCanadianTaxTreatment(category);

  switch (treatment) {
    case "tax-free":
      return {
        effectiveRate: 0,
        taxFreeAmount: annualWithdrawal,
        taxableAmount: 0,
      };

    case "tax-deferred": {
      const taxResult = computeCanadianTax(annualWithdrawal, "employment", jurisdiction, year);
      return {
        effectiveRate: taxResult.effectiveRate,
        taxFreeAmount: 0,
        taxableAmount: annualWithdrawal,
      };
    }

    case "taxable": {
      const clampedBasis = Math.max(0, Math.min(100, costBasisPercent));
      const gainsPercent = (100 - clampedBasis) / 100;
      const gainsAmount = annualWithdrawal * gainsPercent;
      const costBasisAmount = annualWithdrawal - gainsAmount;

      if (gainsAmount <= 0) {
        return {
          effectiveRate: 0,
          taxFreeAmount: annualWithdrawal,
          taxableAmount: 0,
        };
      }

      const incomeType: IncomeType = roiTaxTreatment === "income" ? "employment" : "capital-gains";
      const taxResult = computeCanadianTax(gainsAmount, incomeType, jurisdiction, year);
      return {
        effectiveRate: annualWithdrawal > 0 ? taxResult.totalTax / annualWithdrawal : 0,
        taxFreeAmount: costBasisAmount,
        taxableAmount: gainsAmount,
      };
    }

    default:
      // super-accumulation / super-fhss never produced by Canadian classifier
      return { effectiveRate: 0, taxFreeAmount: annualWithdrawal, taxableAmount: 0 };
  }
}

function getCanadianEarlyWithdrawalPenalties(
  categories: string[],
  age: number
): EarlyWithdrawalPenalty[] {
  if (age === undefined || age <= 0) return [];

  const penalties: EarlyWithdrawalPenalty[] = [];
  for (const cat of categories) {
    const lower = cat.toLowerCase();
    if (age < 65 && (lower.includes("rrsp") || lower.includes("lira"))) {
      penalties.push({
        category: cat,
        penaltyPercent: 0,
        penaltyFreeAge: 65,
        rule:
          "Withdrawals taxed as income with 10-30% withholding. Consider waiting until lower income years.",
      });
    }
  }
  return penalties;
}

export const canadianTaxEngine: TaxEngine = {
  computeTax: computeCanadianTax,
  getMarginalRate(annualIncome, jurisdiction, year) {
    if (annualIncome <= 0) return 0;
    return computeCanadianTax(annualIncome, "employment", jurisdiction, year).marginalRate;
  },
  classifyTaxTreatment: classifyCanadianTaxTreatment,
  getWithdrawalTaxRate: getCanadianWithdrawalTaxRate,
  getEarlyWithdrawalPenalties: getCanadianEarlyWithdrawalPenalties,
};
