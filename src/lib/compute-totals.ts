import type { FinancialState } from "@/lib/financial-types";
import { normalizeToMonthly } from "@/components/IncomeEntry";
import { getEffectivePayment } from "@/components/PropertyEntry";
import { getStockValue } from "@/components/StockEntry";
import { getDefaultRoi, getDefaultRoiTaxTreatment, getDefaultReinvest } from "@/components/AssetEntry";
import { getHomeCurrency, getEffectiveFxRates, convertToHome, formatCurrencyCompact } from "@/lib/currency";
import type { SupportedCurrency } from "@/lib/currency";
import { getTaxTreatment } from "@/lib/withdrawal-tax";
import { computeTax } from "@/lib/tax-engine";
import type { TaxExplainerDetails, TaxBracketSegment } from "@/components/DataFlowArrows";
import { getCanadianBrackets, getUSBrackets, getUSCapitalGainsBrackets, calculateCanadianCapitalGainsInclusion, type BracketTable } from "@/lib/tax-tables";
import { CA_PROVINCES, US_STATES } from "@/components/CountryJurisdictionSelector";

export interface InvestmentIncomeAccount {
  label: string;
  balance: number;
  roi: number;
  annualInterest: number;
}

export interface MonthlyInvestmentReturn {
  label: string;
  amount: number;
  balance: number;
  roi: number;
  reinvest: boolean;
}

/**
 * Compute estimated monthly investment returns for each asset with a non-zero ROI.
 * Returns per-asset breakdown: balance * (roi/100) / 12.
 */
export function computeMonthlyInvestmentReturns(assets: FinancialState["assets"]): MonthlyInvestmentReturn[] {
  const results: MonthlyInvestmentReturn[] = [];
  for (const asset of assets) {
    if (asset.amount <= 0) continue;
    const roi = asset.roi ?? getDefaultRoi(asset.category) ?? 0;
    if (roi <= 0) continue;
    const monthlyReturn = asset.amount * (roi / 100) / 12;
    const reinvest = asset.reinvestReturns ?? getDefaultReinvest(asset.category);
    results.push({
      label: asset.category,
      amount: monthlyReturn,
      balance: asset.amount,
      roi,
      reinvest,
    });
  }
  return results;
}

export function computeTotals(state: FinancialState) {
  const homeCurrency = getHomeCurrency(state.country ?? "CA");
  const fxRates = getEffectiveFxRates(homeCurrency, state.fxManualOverride, state.fxRates);
  const taxYear = state.taxYear ?? new Date().getFullYear();

  // Helper to convert an item amount to home currency
  const toHome = (amount: number, itemCurrency?: SupportedCurrency) =>
    convertToHome(amount, itemCurrency ?? homeCurrency, homeCurrency, fxRates);

  // Exclude computed (auto-synced) assets — their values come from stocks/properties already
  const realAssets = state.assets.filter((a) => !a.computed);
  const totalAssets = realAssets.reduce((sum, a) => sum + toHome(a.amount, a.currency), 0);
  const totalDebts = state.debts.reduce((sum, d) => sum + toHome(d.amount, d.currency), 0);
  const totalDebtPayments = state.debts.reduce((sum, d) => sum + toHome(d.monthlyPayment ?? 0, d.currency), 0);
  const monthlyIncome = state.income.reduce((sum, i) => sum + toHome(normalizeToMonthly(i.amount, i.frequency), i.currency), 0);
  const monthlyExpenses = state.expenses.reduce((sum, e) => sum + toHome(e.amount, e.currency), 0);
  // Total monthly contributions to investment accounts (comes from income, not double-counted in expenses)
  const totalMonthlyContributions = realAssets.reduce((sum, a) => sum + (a.monthlyContribution ?? 0), 0);
  // Properties: equity = value - mortgage. Counts toward net worth but NOT runway (illiquid).
  const properties = state.properties ?? [];
  const totalPropertyEquity = properties.reduce((sum, p) => sum + toHome(Math.max(0, p.value - p.mortgage), p.currency), 0);
  const totalPropertyValue = properties.reduce((sum, p) => sum + toHome(p.value, p.currency), 0);
  const totalPropertyMortgage = properties.reduce((sum, p) => sum + toHome(p.mortgage, p.currency), 0);
  const totalMortgagePayments = properties.reduce((sum, p) => sum + toHome(getEffectivePayment(p), p.currency), 0);
  // Stocks: total value of all holdings (liquid, counts toward net worth and runway)
  // Stock values are converted using the stock's priceCurrency if available
  const stocks = state.stocks ?? [];
  const totalStocks = stocks.reduce((sum, s) => sum + toHome(getStockValue(s), s.priceCurrency), 0);

  // Compute after-tax income: aggregate income by type, then compute tax on each total.
  // This ensures progressive brackets apply correctly across multiple income items.
  const country = state.country ?? "CA";
  const jurisdiction = state.jurisdiction ?? "ON";

  // Aggregate annual income by type
  const incomeByType: Record<string, number> = {};
  for (const item of state.income) {
    const monthlyAmt = normalizeToMonthly(item.amount, item.frequency);
    const annualAmt = monthlyAmt * 12;
    if (annualAmt <= 0) continue;
    const type = item.incomeType ?? "employment";
    incomeByType[type] = (incomeByType[type] ?? 0) + annualAmt;
  }

  // Add investment interest income from taxable accounts with income-type ROI.
  // Interest from savings/GIC/HISA in taxable accounts is taxed annually as ordinary income.
  // Capital-gains ROI and tax-free/tax-deferred accounts are excluded.
  const investmentIncomeAccounts: InvestmentIncomeAccount[] = [];
  for (const asset of state.assets) {
    if (asset.amount <= 0) continue;
    const roi = asset.roi ?? getDefaultRoi(asset.category) ?? 0;
    if (roi <= 0) continue;
    const taxTreatment = getTaxTreatment(asset.category, asset.taxTreatment);
    if (taxTreatment === "tax-free" || taxTreatment === "tax-deferred") continue;
    const roiTaxTreatment = asset.roiTaxTreatment ?? getDefaultRoiTaxTreatment(asset.category);
    if (roiTaxTreatment !== "income") continue;
    const annualInterest = asset.amount * (roi / 100);
    investmentIncomeAccounts.push({
      label: asset.category,
      balance: asset.amount,
      roi,
      annualInterest,
    });
  }
  const totalInvestmentInterest = investmentIncomeAccounts.reduce((sum, a) => sum + a.annualInterest, 0);
  if (totalInvestmentInterest > 0) {
    incomeByType["employment"] = (incomeByType["employment"] ?? 0) + totalInvestmentInterest;
  }

  // Apply deductions: reduce taxable income before bracket computation
  const taxCredits = state.taxCredits ?? [];
  const totalDeductions = taxCredits
    .filter((c) => c.type === "deduction")
    .reduce((s, c) => s + c.annualAmount, 0);

  // Distribute deductions proportionally across income types
  const totalPreDeductionIncome = Object.values(incomeByType).reduce((s, v) => s + v, 0);
  if (totalDeductions > 0 && totalPreDeductionIncome > 0) {
    const deductionRatio = Math.min(1, totalDeductions / totalPreDeductionIncome);
    for (const type of Object.keys(incomeByType)) {
      incomeByType[type] = Math.max(0, incomeByType[type] - incomeByType[type] * deductionRatio);
    }
  }

  let totalAnnualTax = 0;
  let totalFederalTax = 0;
  let totalProvincialStateTax = 0;
  let totalAfterTaxAnnual = 0;
  let weightedEffectiveRate = 0;

  for (const [type, annualAmt] of Object.entries(incomeByType)) {
    const taxResult = computeTax(annualAmt, type as "employment" | "capital-gains" | "other", country, jurisdiction, taxYear);
    totalAnnualTax += taxResult.totalTax;
    totalFederalTax += taxResult.federalTax;
    totalProvincialStateTax += taxResult.provincialStateTax;
    totalAfterTaxAnnual += taxResult.afterTaxIncome;
    weightedEffectiveRate += taxResult.effectiveRate * annualAmt;
  }

  // Apply non-refundable and refundable credits to reduce computed tax
  const totalNonRefundableCredits = taxCredits
    .filter((c) => c.type === "non-refundable")
    .reduce((s, c) => s + c.annualAmount, 0);
  const totalRefundableCredits = taxCredits
    .filter((c) => c.type === "refundable")
    .reduce((s, c) => s + c.annualAmount, 0);

  // Non-refundable credits reduce tax but can't go below 0
  const rawTotalTax = totalAnnualTax;
  const nonRefundableBenefit = Math.min(totalNonRefundableCredits, totalAnnualTax);
  // Refundable credits can reduce tax below 0 (generating a refund)
  const creditAdjustedTax = Math.max(0, totalAnnualTax - nonRefundableBenefit - totalRefundableCredits);

  // Apply credits proportionally to federal/provincial split
  const taxReductionRatio = totalAnnualTax > 0 ? creditAdjustedTax / totalAnnualTax : 0;
  totalFederalTax = totalAnnualTax > 0 ? totalFederalTax * taxReductionRatio : 0;
  totalProvincialStateTax = totalAnnualTax > 0 ? totalProvincialStateTax * taxReductionRatio : 0;
  totalAnnualTax = creditAdjustedTax;

  // Apply user overrides if present (annual amounts) — overrides replace credit-adjusted values
  const finalFederalTax = state.federalTaxOverride ?? totalFederalTax;
  const finalProvincialStateTax = state.provincialTaxOverride ?? totalProvincialStateTax;
  const finalAnnualTax = finalFederalTax + finalProvincialStateTax;
  const totalAnnualIncome = monthlyIncome * 12;
  // Effective tax rate uses total taxable income base (earned income + investment interest)
  const totalTaxableBase = totalAnnualIncome + totalInvestmentInterest;
  const finalAfterTaxAnnual = totalAnnualIncome - finalAnnualTax;
  const effectiveTaxRate = totalTaxableBase > 0 ? finalAnnualTax / totalTaxableBase : 0;
  const monthlyAfterTaxIncome = finalAfterTaxAnnual / 12;
  const totalTaxEstimate = finalAnnualTax;
  // Pre-credit tax for explainer/breakdown display
  const rawTaxEstimate = rawTotalTax;
  const totalCreditBenefit = nonRefundableBenefit + Math.min(totalRefundableCredits, Math.max(0, rawTotalTax - nonRefundableBenefit));

  // Also export the computed (non-overridden) values so the UI can show defaults
  return { totalAssets, totalDebts, totalDebtPayments, monthlyIncome, monthlyExpenses, totalMonthlyContributions, totalPropertyEquity, totalPropertyValue, totalPropertyMortgage, totalMortgagePayments, totalStocks, monthlyAfterTaxIncome, totalTaxEstimate, totalFederalTax: finalFederalTax, totalProvincialStateTax: finalProvincialStateTax, effectiveTaxRate, computedFederalTax: totalFederalTax, computedProvincialStateTax: totalProvincialStateTax, homeCurrency, investmentIncomeAccounts, totalInvestmentInterest, totalTaxableBase, rawTaxEstimate, totalCreditBenefit, totalDeductions };
}

// --- Tax explainer helpers ---

function computeBracketSegments(taxableIncome: number, table: BracketTable): TaxBracketSegment[] {
  return table.brackets.map((bracket) => {
    if (taxableIncome <= bracket.min) {
      return { min: bracket.min, max: bracket.max, rate: bracket.rate, amountInBracket: 0, taxInBracket: 0 };
    }
    const amountInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
    return {
      min: bracket.min,
      max: bracket.max,
      rate: bracket.rate,
      amountInBracket,
      taxInBracket: amountInBracket * bracket.rate,
    };
  });
}

export function buildTaxExplainerDetails(state: FinancialState, grossAnnualIncome: number, federalTax: number, provincialStateTax: number, effectiveTaxRate: number, totalTax: number, investmentIncomeAccounts?: InvestmentIncomeAccount[]): TaxExplainerDetails | undefined {
  const country = state.country ?? "CA";
  const jurisdiction = state.jurisdiction ?? "ON";
  const taxYear = state.taxYear ?? new Date().getFullYear();
  const hasCapitalGains = state.income.some((i) => i.incomeType === "capital-gains");

  // Get jurisdiction label
  const jurisdictions = country === "CA" ? CA_PROVINCES : US_STATES;
  const jurisdictionLabel = jurisdictions.find((j) => j.code === jurisdiction)?.name ?? jurisdiction;
  const jurisdictionType = country === "CA" ? "Provincial" as const : "State" as const;

  // Zero income: return details with empty bracket amounts so the explainer
  // can still show the jurisdiction's tax bracket structure for reference
  if (grossAnnualIncome <= 0) {
    let referenceBrackets: TaxBracketSegment[];
    let provincialReferenceBrackets: TaxBracketSegment[];
    let federalBPA: number;
    let provincialBPA: number;
    if (country === "CA") {
      const { federal, provincial } = getCanadianBrackets(jurisdiction, taxYear);
      referenceBrackets = federal.brackets.map((b) => ({
        min: b.min, max: b.max, rate: b.rate, amountInBracket: 0, taxInBracket: 0,
      }));
      provincialReferenceBrackets = provincial.brackets.map((b) => ({
        min: b.min, max: b.max, rate: b.rate, amountInBracket: 0, taxInBracket: 0,
      }));
      federalBPA = federal.basicPersonalAmount;
      provincialBPA = provincial.basicPersonalAmount;
    } else {
      const { federal, state: stateTable } = getUSBrackets(jurisdiction, taxYear);
      referenceBrackets = federal.brackets.map((b) => ({
        min: b.min, max: b.max, rate: b.rate, amountInBracket: 0, taxInBracket: 0,
      }));
      provincialReferenceBrackets = stateTable.brackets.map((b) => ({
        min: b.min, max: b.max, rate: b.rate, amountInBracket: 0, taxInBracket: 0,
      }));
      federalBPA = federal.basicPersonalAmount;
      provincialBPA = stateTable.basicPersonalAmount;
    }
    return {
      federalTax: 0,
      provincialStateTax: 0,
      jurisdictionLabel,
      jurisdictionType,
      effectiveRate: 0,
      marginalRate: 0,
      grossIncome: 0,
      totalTax: 0,
      afterTaxIncome: 0,
      brackets: referenceBrackets,
      provincialBrackets: provincialReferenceBrackets,
      federalBasicPersonalAmount: federalBPA,
      provincialBasicPersonalAmount: provincialBPA,
      hasCapitalGains: false,
    };
  }

  // Compute bracket segments for the bar visualization (using federal brackets)
  let brackets: TaxBracketSegment[];
  let provincialBrackets: TaxBracketSegment[];
  let federalBPA: number;
  let provincialBPA: number;

  const capGainsTotal = state.income
    .filter((i) => i.incomeType === "capital-gains")
    .reduce((sum, i) => sum + normalizeToMonthly(i.amount, i.frequency) * 12, 0);

  if (country === "CA") {
    const { federal, provincial } = getCanadianBrackets(jurisdiction, taxYear);
    const otherIncome = grossAnnualIncome - capGainsTotal;
    const taxableIncome = otherIncome + (capGainsTotal > 0 ? calculateCanadianCapitalGainsInclusion(capGainsTotal) : 0);
    brackets = computeBracketSegments(taxableIncome, federal);
    provincialBrackets = computeBracketSegments(taxableIncome, provincial);
    federalBPA = federal.basicPersonalAmount;
    provincialBPA = provincial.basicPersonalAmount;
  } else {
    const { federal, state: stateTable } = getUSBrackets(jurisdiction, taxYear);
    if (capGainsTotal > 0 && capGainsTotal >= grossAnnualIncome * 0.99) {
      // Show capital gains brackets
      brackets = computeBracketSegments(grossAnnualIncome, getUSCapitalGainsBrackets(taxYear));
      provincialBrackets = computeBracketSegments(Math.max(0, grossAnnualIncome - stateTable.basicPersonalAmount), stateTable);
    } else {
      // Show federal brackets (after standard deduction)
      const taxableIncome = Math.max(0, grossAnnualIncome - federal.basicPersonalAmount);
      brackets = computeBracketSegments(taxableIncome, federal);
      provincialBrackets = computeBracketSegments(Math.max(0, grossAnnualIncome - stateTable.basicPersonalAmount), stateTable);
    }
    federalBPA = federal.basicPersonalAmount;
    provincialBPA = stateTable.basicPersonalAmount;
  }

  // Compute marginal rate
  const taxResult = computeTax(grossAnnualIncome, hasCapitalGains ? "capital-gains" : "employment", country, jurisdiction, taxYear);

  return {
    federalTax,
    provincialStateTax,
    jurisdictionLabel,
    jurisdictionType,
    effectiveRate: effectiveTaxRate,
    marginalRate: taxResult.marginalRate,
    grossIncome: grossAnnualIncome,
    totalTax,
    afterTaxIncome: grossAnnualIncome - totalTax,
    brackets,
    provincialBrackets,
    federalBasicPersonalAmount: federalBPA,
    provincialBasicPersonalAmount: provincialBPA,
    hasCapitalGains,
    capitalGainsInfo: hasCapitalGains ? {
      country,
      totalCapitalGains: capGainsTotal,
    } : undefined,
    investmentIncomeTax: investmentIncomeAccounts && investmentIncomeAccounts.length > 0 ? {
      totalAnnualInterest: investmentIncomeAccounts.reduce((s, a) => s + a.annualInterest, 0),
      accounts: investmentIncomeAccounts,
    } : undefined,
    taxCreditSummary: (() => {
      const credits = state.taxCredits ?? [];
      if (credits.length === 0) return undefined;
      const deductions = credits.filter((c) => c.type === "deduction").reduce((s, c) => s + c.annualAmount, 0);
      const nonRefundable = credits.filter((c) => c.type === "non-refundable").reduce((s, c) => s + c.annualAmount, 0);
      const refundable = credits.filter((c) => c.type === "refundable").reduce((s, c) => s + c.annualAmount, 0);
      const totalBenefit = Math.min(nonRefundable, taxResult.totalTax) + Math.min(refundable, Math.max(0, taxResult.totalTax - nonRefundable));
      if (totalBenefit <= 0 && deductions <= 0) return undefined;
      return {
        totalBenefit,
        deductions,
        rawTax: taxResult.totalTax,
        credits: credits.map((c) => ({ name: c.category, amount: c.annualAmount, type: c.type })),
      };
    })(),
  };
}

export function fmtShort(n: number, currency: SupportedCurrency): string {
  return formatCurrencyCompact(n, currency, currency);
}

// --- Consolidated computation helpers ---

/**
 * FIRE number: annual living expenses / 4% safe withdrawal rate.
 * Single source of truth used by toFinancialData and computeCoastFireAge.
 */
export function computeFireNumber(monthlyExpenses: number): number | undefined {
  return monthlyExpenses > 0 ? (monthlyExpenses * 12) / 0.04 : undefined;
}

/**
 * Monthly obligations: expenses + mortgage payments + debt payments.
 * Used for runway calculations across compute-metrics, insights, and withdrawal tax.
 */
export function computeMonthlyObligations(
  monthlyExpenses: number,
  totalMortgagePayments: number,
  totalDebtPayments: number,
): number {
  return monthlyExpenses + totalMortgagePayments + totalDebtPayments;
}

/**
 * Monthly surplus: after-tax income + investment returns - all outflows.
 * Single source of truth for surplus calculations.
 */
export function computeSurplus(
  monthlyAfterTaxIncome: number,
  totalMonthlyInvestmentReturns: number,
  monthlyExpenses: number,
  totalMonthlyContributions: number,
  totalMortgagePayments: number,
  totalDebtPayments: number,
): number {
  return monthlyAfterTaxIncome + totalMonthlyInvestmentReturns - monthlyExpenses - totalMonthlyContributions - totalMortgagePayments - totalDebtPayments;
}
