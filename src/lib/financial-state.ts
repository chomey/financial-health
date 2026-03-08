/**
 * Barrel module — re-exports from split modules for backwards compatibility.
 * New code should import directly from the specific module.
 */

// Types
export type { FinancialState } from "@/lib/financial-types";
export { INITIAL_STATE } from "@/lib/financial-types";

// Totals & investment returns
export type { InvestmentIncomeAccount, MonthlyInvestmentReturn } from "@/lib/compute-totals";
export { computeTotals, computeMonthlyInvestmentReturns } from "@/lib/compute-totals";

// Metrics
export { computeMetrics, computeIncomeReplacementDetails } from "@/lib/compute-metrics";

// Runway simulation
export { simulateRunwayTimeSeries } from "@/lib/runway-simulation";

// --- Functions that remain here (not worth splitting further) ---

import type { FinancialState } from "@/lib/financial-types";
import type { FinancialData } from "@/lib/insights";
import { normalizeToMonthly } from "@/components/IncomeEntry";
import { getEffectivePayment } from "@/components/PropertyEntry";
import { getStockValue } from "@/components/StockEntry";
import { getDefaultRoi, computeEmployerMatchMonthly } from "@/components/AssetEntry";
import { getHomeCurrency, getEffectiveFxRates, convertToHome } from "@/lib/currency";
import type { SupportedCurrency } from "@/lib/currency";
import { getTaxTreatment } from "@/lib/withdrawal-tax";
import { getMarginalRateForIncome } from "@/lib/tax-engine";
import { computeTotals, computeMonthlyInvestmentReturns } from "@/lib/compute-totals";
import { simulateRunwayWithGrowth, simulateRunwayWithTax } from "@/lib/runway-simulation";
import type { Asset } from "@/components/AssetEntry";

export function toFinancialData(state: FinancialState): FinancialData {
  const { totalAssets, totalDebts, totalDebtPayments, monthlyIncome, monthlyExpenses, totalMonthlyContributions, totalPropertyValue, totalPropertyMortgage, totalMortgagePayments, totalStocks, monthlyAfterTaxIncome, totalTaxEstimate, effectiveTaxRate, homeCurrency } = computeTotals(state);
  const hasCapitalGains = state.income.some((i) => i.incomeType === "capital-gains");
  // Investment returns for surplus alignment with metric card
  const investmentReturns = computeMonthlyInvestmentReturns(state.assets);
  const totalMonthlyInvestmentReturns = investmentReturns.reduce((sum, r) => sum + r.amount, 0);
  const country = state.country ?? "CA";
  const jurisdiction = state.jurisdiction ?? "ON";

  // Compute annual employer match across all eligible assets
  const annualEmploymentSalary = state.income.reduce((sum, item) => {
    if ((item.incomeType ?? "employment") !== "employment") return sum;
    return sum + normalizeToMonthly(item.amount, item.frequency) * 12;
  }, 0);
  const employerMatchAnnual = state.assets
    .filter((a) => !a.computed)
    .reduce((sum, a) => {
      if (!a.employerMatchPct || !a.employerMatchCap || !a.monthlyContribution) return sum;
      return sum + computeEmployerMatchMonthly(a.monthlyContribution, a.employerMatchPct, a.employerMatchCap, annualEmploymentSalary) * 12;
    }, 0);

  // FIRE number: annual living expenses / 4% SWR — use raw monthly expenses (excludes contributions/mortgage)
  const fireNumber = monthlyExpenses > 0 ? (monthlyExpenses * 12) / 0.04 : undefined;

  // Monthly debt payments: sum of minimum debt payments + mortgage payments
  const monthlyDebtPayments = state.debts.reduce((sum, d) => sum + (d.monthlyPayment ?? 0), 0) + totalMortgagePayments;

  // Monthly housing cost: mortgage payment (from PropertyEntry) OR rent expense (from expenses)
  const fxRatesForHousing = getEffectiveFxRates(homeCurrency, state.fxManualOverride, state.fxRates);
  const rentExpense = state.expenses
    .filter((e) => e.category.toLowerCase().includes("rent"))
    .reduce((sum, e) => sum + convertToHome(e.amount, e.currency ?? homeCurrency, homeCurrency, fxRatesForHousing), 0);
  const monthlyHousingCost = totalMortgagePayments > 0 ? totalMortgagePayments : rentExpense;

  // Income replacement ratio: % of monthly after-tax income sustainable by portfolio via 4% rule
  const liquidInvestedAssets = totalAssets + totalStocks;
  const incomeReplacementRatio = monthlyAfterTaxIncome > 0
    ? parseFloat((liquidInvestedAssets * 0.04 / 12 / monthlyAfterTaxIncome * 100).toFixed(1))
    : undefined;

  // Marginal rate for tax optimization suggestions — use employment income
  const marginalRate = annualEmploymentSalary > 0
    ? getMarginalRateForIncome(annualEmploymentSalary, country, jurisdiction)
    : undefined;

  // Use property value + mortgage so that netWorth = totalAssets - totalDebts matches computeMetrics
  return {
    totalAssets: totalAssets + totalStocks + totalPropertyValue,
    totalDebts: totalDebts + totalPropertyMortgage,
    liquidAssets: totalAssets + totalStocks,
    monthlyIncome: monthlyAfterTaxIncome,
    monthlyExpenses: monthlyExpenses + totalMonthlyContributions + totalMortgagePayments + totalDebtPayments,
    rawMonthlyExpenses: monthlyExpenses,
    monthlyMortgagePayments: totalMortgagePayments,
    debts: state.debts.map((d) => ({
      category: d.category,
      amount: d.amount,
      interestRate: d.interestRate,
      monthlyPayment: d.monthlyPayment,
    })),
    effectiveTaxRate: effectiveTaxRate,
    annualTax: totalTaxEstimate,
    hasCapitalGains,
    homeCurrency,
    withdrawalTax: computeWithdrawalTaxSummary(state, totalAssets, totalStocks),
    employerMatchAnnual: employerMatchAnnual > 0 ? employerMatchAnnual : undefined,
    fireNumber,
    marginalRate,
    country,
    annualEmploymentIncome: annualEmploymentSalary > 0 ? annualEmploymentSalary : undefined,
    incomeReplacementRatio,
    monthlyDebtPayments: monthlyDebtPayments > 0 ? monthlyDebtPayments : 0,
    monthlyGrossIncome: monthlyIncome > 0 ? monthlyIncome : undefined,
    monthlyHousingCost: monthlyHousingCost > 0 ? monthlyHousingCost : undefined,
    currentAge: state.age,
    monthlySavings: totalMonthlyContributions > 0 ? totalMonthlyContributions : undefined,
    taxCredits: state.taxCredits,
    filingStatus: state.filingStatus,
    isHomeowner: state.properties.length > 0,
    hasStudentLoans: state.debts.some((d) => d.category.toLowerCase().includes("student")),
    hasChildCareExpenses: state.expenses.some((e) =>
      ["child", "daycare", "babysit"].some((k) => e.category.toLowerCase().includes(k)),
    ),
    monthlyInvestmentReturns: totalMonthlyInvestmentReturns > 0 ? totalMonthlyInvestmentReturns : undefined,
  };
}

/**
 * Compute the Coast FIRE age — the age at which your portfolio, growing at
 * an assumed real return rate, will compound to cover retirement expenses by
 * targetAge without any additional contributions from that point on.
 */
export function computeCoastFireAge(
  currentAge: number,
  currentInvested: number,
  annualExpenses: number,
  targetAge: number = 65,
  realReturn: number = 0.05,
  monthlySavings: number = 0,
): number | null {
  if (currentAge >= targetAge || annualExpenses <= 0 || currentInvested <= 0) return null;

  // FIRE number: annual expenses / 4% SWR
  const fireNumber = annualExpenses / 0.04;
  const monthlyReturn = Math.pow(1 + realReturn, 1 / 12) - 1;

  // Simulate year by year: grow portfolio with contributions, check if coasting
  let portfolio = currentInvested;
  for (let age = currentAge; age < targetAge; age++) {
    // Check: from this age, does portfolio grow to fireNumber by targetAge with no more contributions?
    const yearsLeft = targetAge - age;
    const futureValue = portfolio * Math.pow(1 + realReturn, yearsLeft);
    if (futureValue >= fireNumber) return age;

    // Grow portfolio for one year with monthly contributions
    for (let m = 0; m < 12; m++) {
      portfolio = portfolio * (1 + monthlyReturn) + monthlySavings;
    }
  }

  return null;
}

/**
 * Compute withdrawal tax summary data for insights and dashboard.
 * Groups assets by tax treatment and computes tax drag on runway.
 */
export function computeWithdrawalTaxSummary(
  state: FinancialState,
  totalAssets: number,
  totalStocks: number,
): FinancialData["withdrawalTax"] {
  const realAssets = state.assets.filter((a) => !a.computed);
  const computedAssets = state.assets.filter((a) => a.computed);
  const hasComputedStocks = computedAssets.some((a) => a.id === "_computed_stocks");

  // Group accounts by tax treatment
  const taxFree: { categories: string[]; total: number } = { categories: [], total: 0 };
  const taxDeferred: { categories: string[]; total: number } = { categories: [], total: 0 };
  const taxable: { categories: string[]; total: number } = { categories: [], total: 0 };

  const allAssets = [...realAssets, ...computedAssets];
  // Add standalone stock bucket if no computed stocks entry
  if (!hasComputedStocks && totalStocks > 0) {
    allAssets.push({ id: "_stocks_fallback", category: "Brokerage", amount: totalStocks, computed: false } as Asset);
  }

  for (const asset of allAssets) {
    if (asset.amount <= 0) continue;
    // Exclude property equity — it's not a liquid, withdrawable account
    if (asset.id === "_computed_equity") continue;
    const treatment = getTaxTreatment(asset.category, asset.taxTreatment);
    const bucket = treatment === "tax-free" ? taxFree : treatment === "tax-deferred" ? taxDeferred : taxable;
    bucket.total += asset.amount;
    if (!bucket.categories.includes(asset.category)) {
      bucket.categories.push(asset.category);
    }
  }

  const totalLiquid = taxFree.total + taxDeferred.total + taxable.total;
  if (totalLiquid <= 0) return undefined;

  // Build withdrawal order (taxable first, tax-free second to preserve shelter, tax-deferred last)
  const withdrawalOrder: string[] = [];
  if (taxable.categories.length > 0) withdrawalOrder.push(...taxable.categories);
  if (taxFree.categories.length > 0) withdrawalOrder.push(...taxFree.categories);
  if (taxDeferred.categories.length > 0) withdrawalOrder.push(...taxDeferred.categories);

  // Compute tax drag: difference between base runway and tax-adjusted runway
  const monthlyObligations = state.expenses.reduce((sum, e) => sum + e.amount, 0) +
    (state.properties ?? []).reduce((sum, p) => sum + getEffectivePayment(p), 0) +
    state.debts.reduce((sum, d) => sum + (d.monthlyPayment ?? 0), 0);

  let taxDragMonths = 0;
  if (monthlyObligations > 0 && totalLiquid > 0) {
    const baseRunway = totalLiquid / monthlyObligations;

    // Build tax-aware buckets for simulation
    const taxBuckets = allAssets
      .filter((a) => a.amount > 0 && a.id !== "_computed_equity")
      .map((a) => ({
        balance: a.amount,
        monthlyRate: (a.roi ?? getDefaultRoi(a.category) ?? 0) / 100 / 12,
        taxTreatment: getTaxTreatment(a.category, a.taxTreatment),
        category: a.category,
        costBasisPercent: a.costBasisPercent ?? 100,
        roiTaxTreatment: a.roiTaxTreatment,
      }));

    const hasTaxedAccounts = taxBuckets.some((b) => b.taxTreatment !== "tax-free");
    if (hasTaxedAccounts) {
      const country = state.country ?? "CA";
      const jurisdiction = state.jurisdiction ?? "ON";

      // Simple runway with growth for baseline
      const growthBuckets = taxBuckets.map((b) => ({ balance: b.balance, monthlyRate: b.monthlyRate }));
      const hasGrowth = growthBuckets.some((b) => b.monthlyRate > 0);
      const growthRunway = hasGrowth
        ? simulateRunwayWithGrowth(growthBuckets, monthlyObligations)
        : baseRunway;
      const baseline = growthRunway >= 1200 ? 1200 : growthRunway;

      const taxRunway = simulateRunwayWithTax(taxBuckets, monthlyObligations, country, jurisdiction);
      const taxAdjusted = taxRunway >= 1200 ? 1200 : taxRunway;

      taxDragMonths = Math.max(0, baseline - taxAdjusted);
    }
  }

  return {
    taxDragMonths,
    withdrawalOrder,
    accountsByTreatment: { taxFree, taxDeferred, taxable },
  };
}
