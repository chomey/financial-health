/**
 * American TaxEngine implementation.
 *
 * Federal + state income tax, long-term capital gains, keyword-based account
 * classification, and the US branches of withdrawal tax & early-withdrawal
 * penalty rules.
 *
 * Mirrors the legacy free functions in `src/lib/tax-engine.ts` and
 * `src/lib/withdrawal-tax.ts`. Those become thin shims (Ralph tasks 222/223)
 * that delegate here via `getCountry("US").taxEngine.*`.
 *
 * US specifics that differ from Canada:
 * - Standard deduction is subtracted from gross income (not a credit at the
 *   lowest-rate). Implemented in `calculateUSFederalTax` below.
 * - Long-term capital gains use their own bracket table (0/15/20%).
 * - States with no income tax have empty bracket arrays — handled by treating
 *   their stateTax as 0 and their marginal rate as 0.
 */

import { buildBracketSegments, calculateProgressiveTax, getMarginalRate, type BracketTable } from "@/lib/bracket-math";
import type { BracketSegmentArgs, BracketSegmentResult, TaxEngine, WithdrawalTaxArgs } from "@/lib/countries/types";
import type { IncomeType, TaxResult } from "@/lib/tax-engine";
import type {
  EarlyWithdrawalPenalty,
  TaxTreatment,
  WithdrawalTaxResult,
} from "@/lib/withdrawal-tax";
import { getUSBrackets, getUSCapitalGainsBrackets } from "./tax-tables";

const TAX_FREE_KEYWORDS = ["roth", "hsa", "tax-free", "tax free"];
const TAX_DEFERRED_KEYWORDS = ["401k", "403b", "457", "ira", "529", "pension", "retirement"];

function classifyAmericanTaxTreatment(category: string): TaxTreatment {
  const lower = category.toLowerCase();
  if (TAX_FREE_KEYWORDS.some((kw) => lower.includes(kw))) return "tax-free";
  if (TAX_DEFERRED_KEYWORDS.some((kw) => lower.includes(kw))) return "tax-deferred";
  return "taxable";
}

/**
 * US federal tax: standard deduction is subtracted from gross income before
 * applying brackets (NOT applied as a BPA-style credit at the lowest rate).
 */
function calculateUSFederalTax(grossIncome: number, table: BracketTable): number {
  const taxableIncome = Math.max(0, grossIncome - table.basicPersonalAmount);
  if (taxableIncome <= 0) return 0;

  let tax = 0;
  for (const bracket of table.brackets) {
    if (taxableIncome <= bracket.min) break;
    const taxableInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
    tax += taxableInBracket * bracket.rate;
  }
  return Math.max(0, tax);
}

function getUSFederalMarginalRate(grossIncome: number, table: BracketTable): number {
  const taxableIncome = Math.max(0, grossIncome - table.basicPersonalAmount);
  return getMarginalRate(taxableIncome, table);
}

function computeAmericanTax(
  annualIncome: number,
  type: IncomeType,
  state: string,
  year: number,
  ordinaryIncomeContext: number = 0
): TaxResult {
  if (annualIncome <= 0) {
    return {
      totalTax: 0,
      effectiveRate: 0,
      afterTaxIncome: 0,
      marginalRate: 0,
      breakdown: [],
    };
  }

  const { federal, state: stateTable } = getUSBrackets(state, year);

  let federalTax: number;
  let federalMarginal: number;

  if (type === "capital-gains") {
    const capGainsBrackets = getUSCapitalGainsBrackets(year);
    const ordinaryTaxableIncome = Math.max(0, ordinaryIncomeContext - federal.basicPersonalAmount);
    if (ordinaryTaxableIncome > 0) {
      federalTax =
        calculateProgressiveTax(ordinaryTaxableIncome + annualIncome, capGainsBrackets) -
        calculateProgressiveTax(ordinaryTaxableIncome, capGainsBrackets);
      federalMarginal = getMarginalRate(ordinaryTaxableIncome + annualIncome, capGainsBrackets);
    } else {
      federalTax = calculateProgressiveTax(annualIncome, capGainsBrackets);
      federalMarginal = getMarginalRate(annualIncome, capGainsBrackets);
    }
  } else {
    federalTax = calculateUSFederalTax(annualIncome, federal);
    federalMarginal = getUSFederalMarginalRate(annualIncome, federal);
  }

  // Most states tax capital gains as ordinary income. States with no income
  // tax (empty bracket arrays) produce 0 stateTax and 0 marginal rate.
  const hasStateBrackets = stateTable.brackets.length > 0;
  const stateTax = hasStateBrackets ? calculateProgressiveTax(annualIncome, stateTable) : 0;
  const stateMarginal = hasStateBrackets ? getMarginalRate(annualIncome, stateTable) : 0;

  const totalTax = federalTax + stateTax;
  const marginalRate = federalMarginal + stateMarginal;

  return {
    totalTax,
    effectiveRate: annualIncome > 0 ? totalTax / annualIncome : 0,
    afterTaxIncome: annualIncome - totalTax,
    marginalRate,
    breakdown: [
      { label: "Federal Tax", amount: federalTax, kind: "income-tax" },
      { label: "State Tax", amount: stateTax, kind: "sub-federal" },
    ],
  };
}

function getAmericanWithdrawalTaxRate(args: WithdrawalTaxArgs): WithdrawalTaxResult {
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

  const treatment = classifyAmericanTaxTreatment(category);

  switch (treatment) {
    case "tax-free":
      return {
        effectiveRate: 0,
        taxFreeAmount: annualWithdrawal,
        taxableAmount: 0,
      };

    case "tax-deferred": {
      const taxResult = computeAmericanTax(annualWithdrawal, "employment", jurisdiction, year);
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
      const taxResult = computeAmericanTax(gainsAmount, incomeType, jurisdiction, year);
      return {
        effectiveRate: annualWithdrawal > 0 ? taxResult.totalTax / annualWithdrawal : 0,
        taxFreeAmount: costBasisAmount,
        taxableAmount: gainsAmount,
      };
    }

    default:
      // super-accumulation / super-fhss never produced by US classifier
      return { effectiveRate: 0, taxFreeAmount: annualWithdrawal, taxableAmount: 0 };
  }
}

function getAmericanEarlyWithdrawalPenalties(
  categories: string[],
  age: number
): EarlyWithdrawalPenalty[] {
  if (age === undefined || age <= 0 || age >= 59.5) return [];

  const penalties: EarlyWithdrawalPenalty[] = [];
  for (const cat of categories) {
    const lower = cat.toLowerCase();

    if (lower.includes("457")) {
      penalties.push({
        category: cat,
        penaltyPercent: 0,
        penaltyFreeAge: 59.5,
        rule:
          "No 10% early-withdrawal penalty — 457(b) withdrawals after leaving your employer are taxed as ordinary income only.",
      });
      continue;
    }

    if (
      (lower.includes("401k") || lower.includes("ira") || lower.includes("403b")) &&
      !lower.includes("roth")
    ) {
      penalties.push({
        category: cat,
        penaltyPercent: 10,
        penaltyFreeAge: 59.5,
        rule: "10% early withdrawal penalty before age 59½ (plus income tax)",
      });
    }

    if (lower.includes("roth") && lower.includes("ira")) {
      penalties.push({
        category: cat,
        penaltyPercent: 10,
        penaltyFreeAge: 59.5,
        rule: "10% penalty on earnings before age 59½ (contributions always penalty-free)",
      });
    }
  }
  return penalties;
}

function computeAmericanBracketSegments(args: BracketSegmentArgs): BracketSegmentResult {
  const { jurisdiction, year, grossAnnualIncome, capGainsTotal } = args;
  const { federal, state: stateTable } = getUSBrackets(jurisdiction, year);

  let federalSegments: BracketSegmentResult["federalBrackets"];
  if (grossAnnualIncome <= 0) {
    federalSegments = buildBracketSegments(0, federal);
  } else if (capGainsTotal > 0 && capGainsTotal >= grossAnnualIncome * 0.99) {
    federalSegments = buildBracketSegments(grossAnnualIncome, getUSCapitalGainsBrackets(year));
  } else {
    const taxableIncome = Math.max(0, grossAnnualIncome - federal.basicPersonalAmount);
    federalSegments = buildBracketSegments(taxableIncome, federal);
  }

  const regionalSegments = buildBracketSegments(
    grossAnnualIncome > 0 ? Math.max(0, grossAnnualIncome - stateTable.basicPersonalAmount) : 0,
    stateTable,
  );

  return {
    federalBrackets: federalSegments,
    regionalBrackets: regionalSegments,
    federalBPA: federal.basicPersonalAmount,
    regionalBPA: stateTable.basicPersonalAmount,
  };
}

export const americanTaxEngine: TaxEngine = {
  computeTax: computeAmericanTax,
  getMarginalRate(annualIncome, jurisdiction, year) {
    if (annualIncome <= 0) return 0;
    return computeAmericanTax(annualIncome, "employment", jurisdiction, year).marginalRate;
  },
  classifyTaxTreatment: classifyAmericanTaxTreatment,
  getWithdrawalTaxRate: getAmericanWithdrawalTaxRate,
  getEarlyWithdrawalPenalties: getAmericanEarlyWithdrawalPenalties,
  computeBracketSegments: computeAmericanBracketSegments,
};
