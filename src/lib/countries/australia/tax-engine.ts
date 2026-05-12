/**
 * Australian TaxEngine implementation.
 *
 * Federal income tax + Medicare Levy, 50% CGT discount on long-term capital
 * gains, super-aware account classification, and the AU branches of withdrawal
 * tax & early-withdrawal penalty rules.
 *
 * Mirrors the legacy free functions in `src/lib/tax-engine.ts` and
 * `src/lib/withdrawal-tax.ts`. Those become thin shims (Ralph tasks 222/223)
 * that delegate here via `getCountry("AU").taxEngine.*`.
 *
 * AU specifics that differ from CA/US:
 * - No state/territory income tax — breakdown omits any `sub-federal` line.
 * - Tax-free threshold is handled via a 0% first bracket, not a BPA credit.
 * - Medicare Levy is a separate 2% surcharge above income thresholds, with a
 *   phase-in zone. Surfaced as its own `kind: "social"` breakdown line.
 * - 50% CGT discount: capital gains are taxed on 50% of the gain (assumes
 *   the asset was held > 12 months — the typical long-term case).
 * - Super accounts have unique tax treatments: pension phase is tax-free
 *   after 60, accumulation phase is taxed at a flat 15% on earnings, and
 *   FHSS withdrawals are taxed at marginal rate minus a 30% offset.
 */

import { buildBracketSegments } from "@/lib/bracket-math";
import type { BracketSegmentArgs, BracketSegmentResult, TaxEngine, WithdrawalTaxArgs } from "@/lib/countries/types";
import type { IncomeType, TaxResult } from "@/lib/tax-engine";
import type {
  EarlyWithdrawalPenalty,
  TaxTreatment,
  WithdrawalTaxResult,
} from "@/lib/withdrawal-tax";
import {
  AU_MEDICARE_LEVY,
  calculateMedicareLevy,
  getAUBrackets,
} from "./tax-tables";

function classifyAustralianTaxTreatment(category: string): TaxTreatment {
  const lower = category.toLowerCase();
  // Super pension phase must beat the generic "pension" fallback below.
  if (lower.includes("super") && lower.includes("pension")) return "tax-free";
  if (lower.includes("first home super") || lower === "fhss") return "super-fhss";
  if (lower.includes("super") && lower.includes("accumulation")) return "super-accumulation";
  return "taxable";
}

function computeAustralianTax(
  annualIncome: number,
  type: IncomeType,
  jurisdiction: string,
  year: number
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

  const { federal } = getAUBrackets(jurisdiction, year);
  const taxableIncome = type === "capital-gains" ? annualIncome * 0.5 : annualIncome;

  // AU uses a 0% first bracket, so the BPA-style credit in
  // `calculateProgressiveTax` would subtract 0 anyway — but we walk the
  // brackets directly to keep the math identical to the legacy implementation.
  let federalTax = 0;
  for (const bracket of federal.brackets) {
    if (taxableIncome <= bracket.min) break;
    const taxableInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
    federalTax += taxableInBracket * bracket.rate;
  }
  federalTax = Math.max(0, federalTax);

  // Medicare Levy applies to the (possibly CGT-discounted) taxable income.
  const medicareLevy = calculateMedicareLevy(taxableIncome, year);
  const totalTax = federalTax + medicareLevy;

  let marginalRate = 0;
  for (const bracket of federal.brackets) {
    if (taxableIncome <= bracket.max) {
      marginalRate = bracket.rate;
      break;
    }
  }
  const threshold = year >= 2026 ? AU_MEDICARE_LEVY.singleThreshold2026 : AU_MEDICARE_LEVY.singleThreshold2025;
  const shadeOut = year >= 2026 ? AU_MEDICARE_LEVY.singleShadeOut2026 : AU_MEDICARE_LEVY.singleShadeOut2025;
  if (taxableIncome > shadeOut) {
    marginalRate += AU_MEDICARE_LEVY.rate;
  } else if (taxableIncome > threshold) {
    marginalRate += AU_MEDICARE_LEVY.phaseInRate;
  }
  if (type === "capital-gains") {
    // 50% discount halves the effective marginal rate on the next dollar.
    marginalRate *= 0.5;
  }

  return {
    totalTax,
    effectiveRate: annualIncome > 0 ? totalTax / annualIncome : 0,
    afterTaxIncome: annualIncome - totalTax,
    marginalRate,
    breakdown: [
      { label: "Income Tax", amount: federalTax, kind: "income-tax" },
      { label: "Medicare Levy", amount: medicareLevy, kind: "social" },
    ],
  };
}

function getAustralianWithdrawalTaxRate(args: WithdrawalTaxArgs): WithdrawalTaxResult {
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

  const treatment = classifyAustralianTaxTreatment(category);

  switch (treatment) {
    case "tax-free":
      return {
        effectiveRate: 0,
        taxFreeAmount: annualWithdrawal,
        taxableAmount: 0,
      };

    case "super-accumulation": {
      // Earnings inside the fund are taxed at a flat 15%.
      const taxAmount = annualWithdrawal * 0.15;
      return {
        effectiveRate: 0.15,
        taxFreeAmount: annualWithdrawal - taxAmount,
        taxableAmount: annualWithdrawal,
      };
    }

    case "super-fhss": {
      // FHSS withdrawals: taxed at marginal rate minus 30% tax offset.
      const marginalResult = computeAustralianTax(annualWithdrawal, "employment", jurisdiction, year);
      const offsetRate = Math.max(0, marginalResult.effectiveRate - 0.30);
      const taxAmount = annualWithdrawal * offsetRate;
      return {
        effectiveRate: offsetRate,
        taxFreeAmount: annualWithdrawal - taxAmount,
        taxableAmount: annualWithdrawal,
      };
    }

    case "tax-deferred": {
      // Not produced by the AU classifier today, but keep the arm so the
      // engine handles every TaxTreatment value defensively.
      const taxResult = computeAustralianTax(annualWithdrawal, "employment", jurisdiction, year);
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
      const taxResult = computeAustralianTax(gainsAmount, incomeType, jurisdiction, year);
      return {
        effectiveRate: annualWithdrawal > 0 ? taxResult.totalTax / annualWithdrawal : 0,
        taxFreeAmount: costBasisAmount,
        taxableAmount: gainsAmount,
      };
    }
  }
}

function getAustralianEarlyWithdrawalPenalties(
  categories: string[],
  age: number
): EarlyWithdrawalPenalty[] {
  if (age === undefined || age <= 0 || age >= 60) return [];

  const penalties: EarlyWithdrawalPenalty[] = [];
  for (const cat of categories) {
    const lower = cat.toLowerCase();
    if (lower.includes("super") && !lower.includes("fhss") && !lower.includes("first home")) {
      penalties.push({
        category: cat,
        penaltyPercent: 0,
        penaltyFreeAge: 60,
        rule: "Super cannot be accessed before preservation age 60 (limited exceptions apply)",
      });
    }
  }
  return penalties;
}

function computeAustralianBracketSegments(args: BracketSegmentArgs): BracketSegmentResult {
  const { jurisdiction, year, grossAnnualIncome } = args;
  const { federal, state: stateTable } = getAUBrackets(jurisdiction, year);
  return {
    federalBrackets: buildBracketSegments(Math.max(0, grossAnnualIncome), federal),
    // AU has no state income tax — always render the state table with zero amounts.
    regionalBrackets: buildBracketSegments(0, stateTable),
    federalBPA: federal.basicPersonalAmount,
    regionalBPA: stateTable.basicPersonalAmount,
  };
}

export const australianTaxEngine: TaxEngine = {
  computeTax: computeAustralianTax,
  getMarginalRate(annualIncome, jurisdiction, year) {
    if (annualIncome <= 0) return 0;
    return computeAustralianTax(annualIncome, "employment", jurisdiction, year).marginalRate;
  },
  classifyTaxTreatment: classifyAustralianTaxTreatment,
  getWithdrawalTaxRate: getAustralianWithdrawalTaxRate,
  getEarlyWithdrawalPenalties: getAustralianEarlyWithdrawalPenalties,
  computeBracketSegments: computeAustralianBracketSegments,
};
