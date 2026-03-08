import type { Asset } from "@/components/AssetEntry";
import type { Debt } from "@/components/DebtEntry";
import type { IncomeItem } from "@/components/IncomeEntry";
import { normalizeToMonthly } from "@/components/IncomeEntry";
import type { ExpenseItem } from "@/components/ExpenseEntry";
import type { Property } from "@/components/PropertyEntry";
import { getEffectivePayment } from "@/components/PropertyEntry";
import type { StockHolding } from "@/components/StockEntry";
import { getStockValue } from "@/components/StockEntry";
import { getDefaultRoi, getDefaultRoiTaxTreatment, computeEmployerMatchMonthly } from "@/components/AssetEntry";
import { getHomeCurrency, getEffectiveFxRates, convertToHome, formatCurrencyCompact } from "@/lib/currency";
import type { SupportedCurrency, FxRates } from "@/lib/currency";
import { getTaxTreatment, getWithdrawalTaxRate, type TaxTreatment } from "@/lib/withdrawal-tax";

/**
 * Simulate how many months a set of accounts last when drawing down a fixed monthly amount.
 * Each account earns its own monthly return. Withdrawals are taken proportionally from each
 * account based on current balances each month. Returns months until total balance hits 0.
 * Caps at 1200 months (100 years) to avoid infinite loops.
 */
function simulateRunwayWithGrowth(
  buckets: { balance: number; monthlyRate: number }[],
  monthlyWithdrawal: number,
): number {
  if (monthlyWithdrawal <= 0) return 0;
  const balances = buckets.map((b) => b.balance);
  const rates = buckets.map((b) => b.monthlyRate);
  const MAX_MONTHS = 1200;

  for (let month = 0; month < MAX_MONTHS; month++) {
    let total = 0;
    for (let i = 0; i < balances.length; i++) total += balances[i];
    if (total <= 0) return month;

    // Withdraw proportionally, then apply growth to remaining balance
    for (let i = 0; i < balances.length; i++) {
      const share = balances[i] / total;
      balances[i] -= monthlyWithdrawal * share;
      if (balances[i] < 0) balances[i] = 0;
      balances[i] *= 1 + rates[i];
    }
  }
  return MAX_MONTHS;
}
/**
 * Simulate runway with tax-aware withdrawal ordering.
 * Withdraws from accounts in tax-optimal order: taxable first, tax-free second (preserve shelter), tax-deferred last.
 * Grosses up withdrawals from taxed accounts so after-tax amount covers the monthly obligation.
 */
function simulateRunwayWithTax(
  buckets: { balance: number; monthlyRate: number; taxTreatment: TaxTreatment; category: string; costBasisPercent: number; roiTaxTreatment?: "capital-gains" | "income" }[],
  monthlyWithdrawal: number,
  country: "CA" | "US",
  jurisdiction: string,
): number {
  if (monthlyWithdrawal <= 0) return 0;
  const balances = buckets.map((b) => b.balance);
  const rates = buckets.map((b) => b.monthlyRate);
  const MAX_MONTHS = 1200;

  // Priority order: tax-free (0), taxable (1), tax-deferred (2)
  const priorityMap: Record<TaxTreatment, number> = { "taxable": 0, "tax-free": 1, "tax-deferred": 2 };
  const sortedIndices = buckets
    .map((_, i) => i)
    .sort((a, b) => priorityMap[buckets[a].taxTreatment] - priorityMap[buckets[b].taxTreatment]);

  for (let month = 0; month < MAX_MONTHS; month++) {
    let total = 0;
    for (let i = 0; i < balances.length; i++) total += balances[i];
    if (total <= 0) return month;

    // Withdraw in priority order, grossing up for taxes
    let remaining = monthlyWithdrawal;
    for (const idx of sortedIndices) {
      if (remaining <= 0) break;
      if (balances[idx] <= 0) continue;

      const treatment = buckets[idx].taxTreatment;
      let grossWithdrawal: number;

      if (treatment === "tax-free") {
        grossWithdrawal = Math.min(remaining, balances[idx]);
        remaining -= grossWithdrawal;
      } else {
        // Compute effective tax rate for this account type at annualized withdrawal rate
        const annualizedWithdrawal = remaining * 12;
        const taxResult = getWithdrawalTaxRate(
          buckets[idx].category, country, jurisdiction,
          annualizedWithdrawal, buckets[idx].costBasisPercent,
          buckets[idx].roiTaxTreatment
        );
        const effectiveRate = taxResult.effectiveRate;
        // Gross up: need to withdraw more to cover tax so after-tax = remaining
        const grossUpFactor = effectiveRate < 1 ? 1 / (1 - effectiveRate) : 10;
        grossWithdrawal = Math.min(remaining * grossUpFactor, balances[idx]);
        // After-tax value of what we withdrew
        const afterTax = grossWithdrawal / grossUpFactor;
        remaining -= afterTax;
      }

      balances[idx] -= grossWithdrawal;
      if (balances[idx] < 0) balances[idx] = 0;
    }

    // Apply growth to remaining balances
    for (let i = 0; i < balances.length; i++) {
      balances[i] *= 1 + rates[i];
    }
  }
  return MAX_MONTHS;
}

/**
 * Simulate runway month-by-month, returning a time series for charting.
 * Captures per-account balances each month with both growth-aware and no-growth scenarios.
 * Uses tax-aware withdrawal ordering (taxable → tax-free → tax-deferred).
 */
export function simulateRunwayTimeSeries(
  buckets: { balance: number; monthlyRate: number; taxTreatment: TaxTreatment; category: string; costBasisPercent: number; roiTaxTreatment?: "capital-gains" | "income" }[],
  monthlyWithdrawal: number,
  country: "CA" | "US",
  jurisdiction: string,
): { withGrowth: RunwayTimeSeriesPoint[]; withoutGrowth: RunwayTimeSeriesPoint[]; withTax: RunwayTimeSeriesPoint[] } {
  if (monthlyWithdrawal <= 0 || buckets.length === 0) {
    return { withGrowth: [], withoutGrowth: [], withTax: [] };
  }

  const MAX_MONTHS = 600; // Cap at 50 years for charting
  const categories = buckets.map((b) => b.category);

  // Priority order: tax-free (0), taxable (1), tax-deferred (2)
  const priorityMap: Record<TaxTreatment, number> = { "taxable": 0, "tax-free": 1, "tax-deferred": 2 };
  const sortedIndices = buckets
    .map((_, i) => i)
    .sort((a, b) => priorityMap[buckets[a].taxTreatment] - priorityMap[buckets[b].taxTreatment]);

  // Scenario 1: With growth, proportional withdrawal (no tax)
  const growthBalances = buckets.map((b) => b.balance);
  const withGrowth: RunwayTimeSeriesPoint[] = [];

  // Scenario 2: Without growth, proportional withdrawal (no tax)
  const noGrowthBalances = buckets.map((b) => b.balance);
  const withoutGrowth: RunwayTimeSeriesPoint[] = [];

  // Scenario 3: With growth + tax-aware withdrawal ordering
  const taxBalances = buckets.map((b) => b.balance);
  const withTax: RunwayTimeSeriesPoint[] = [];

  const snapshot = (bals: number[]): RunwayTimeSeriesPoint => {
    const balancesByCategory: Record<string, number> = {};
    let total = 0;
    for (let i = 0; i < bals.length; i++) {
      balancesByCategory[categories[i]] = (balancesByCategory[categories[i]] ?? 0) + bals[i];
      total += bals[i];
    }
    return { month: 0, balances: balancesByCategory, totalBalance: total };
  };

  // Record initial state
  const g0 = snapshot(growthBalances); g0.month = 0;
  withGrowth.push(g0);
  const n0 = snapshot(noGrowthBalances); n0.month = 0;
  withoutGrowth.push(n0);
  const t0 = snapshot(taxBalances); t0.month = 0;
  withTax.push(t0);

  let growthDone = false, noGrowthDone = false, taxDone = false;

  for (let month = 1; month <= MAX_MONTHS; month++) {
    if (growthDone && noGrowthDone && taxDone) break;

    // --- With growth (proportional withdrawal) ---
    if (!growthDone) {
      let total = 0;
      for (let i = 0; i < growthBalances.length; i++) total += growthBalances[i];
      if (total <= 0) { growthDone = true; } else {
        for (let i = 0; i < growthBalances.length; i++) {
          const share = growthBalances[i] / total;
          growthBalances[i] -= monthlyWithdrawal * share;
          if (growthBalances[i] < 0) growthBalances[i] = 0;
          growthBalances[i] *= 1 + buckets[i].monthlyRate;
        }
        const pt = snapshot(growthBalances);
        pt.month = month;
        withGrowth.push(pt);
        if (pt.totalBalance <= 0) growthDone = true;
      }
    }

    // --- Without growth (proportional withdrawal) ---
    if (!noGrowthDone) {
      let total = 0;
      for (let i = 0; i < noGrowthBalances.length; i++) total += noGrowthBalances[i];
      if (total <= 0) { noGrowthDone = true; } else {
        for (let i = 0; i < noGrowthBalances.length; i++) {
          const share = noGrowthBalances[i] / total;
          noGrowthBalances[i] -= monthlyWithdrawal * share;
          if (noGrowthBalances[i] < 0) noGrowthBalances[i] = 0;
          // No growth applied
        }
        const pt = snapshot(noGrowthBalances);
        pt.month = month;
        withoutGrowth.push(pt);
        if (pt.totalBalance <= 0) noGrowthDone = true;
      }
    }

    // --- With tax (priority withdrawal + tax gross-up + growth) ---
    if (!taxDone) {
      let total = 0;
      for (let i = 0; i < taxBalances.length; i++) total += taxBalances[i];
      if (total <= 0) { taxDone = true; } else {
        let remaining = monthlyWithdrawal;
        for (const idx of sortedIndices) {
          if (remaining <= 0) break;
          if (taxBalances[idx] <= 0) continue;
          const treatment = buckets[idx].taxTreatment;
          let grossWithdrawal: number;
          if (treatment === "tax-free") {
            grossWithdrawal = Math.min(remaining, taxBalances[idx]);
            remaining -= grossWithdrawal;
          } else {
            const annualizedWithdrawal = remaining * 12;
            const taxResult = getWithdrawalTaxRate(
              buckets[idx].category, country, jurisdiction,
              annualizedWithdrawal, buckets[idx].costBasisPercent,
              buckets[idx].roiTaxTreatment
            );
            const effectiveRate = taxResult.effectiveRate;
            const grossUpFactor = effectiveRate < 1 ? 1 / (1 - effectiveRate) : 10;
            grossWithdrawal = Math.min(remaining * grossUpFactor, taxBalances[idx]);
            const afterTax = grossWithdrawal / grossUpFactor;
            remaining -= afterTax;
          }
          taxBalances[idx] -= grossWithdrawal;
          if (taxBalances[idx] < 0) taxBalances[idx] = 0;
        }
        // Apply growth
        for (let i = 0; i < taxBalances.length; i++) {
          taxBalances[i] *= 1 + buckets[i].monthlyRate;
        }
        const pt = snapshot(taxBalances);
        pt.month = month;
        withTax.push(pt);
        if (pt.totalBalance <= 0) taxDone = true;
      }
    }
  }

  return { withGrowth, withoutGrowth, withTax };
}

import type { FinancialData } from "@/lib/insights";
import type { MetricData } from "@/components/SnapshotDashboard";
import { computeTax, getMarginalRateForIncome } from "@/lib/tax-engine";
import type { TaxExplainerDetails, TaxBracketSegment, RunwayExplainerDetails, RunwayTimeSeriesPoint, RunwayWithdrawalOrderEntry, IncomeReplacementExplainerDetails } from "@/components/DataFlowArrows";
import { getCanadianBrackets, getUSBrackets, calculateCanadianCapitalGainsInclusion, US_CAPITAL_GAINS_2025, type BracketTable } from "@/lib/tax-tables";
import { CA_PROVINCES, US_STATES } from "@/components/CountryJurisdictionSelector";

export interface FinancialState {
  assets: Asset[];
  debts: Debt[];
  income: IncomeItem[];
  expenses: ExpenseItem[];
  properties: Property[];
  stocks: StockHolding[];
  country?: "CA" | "US";
  jurisdiction?: string;
  age?: number;
  federalTaxOverride?: number; // annual override; undefined = use computed
  provincialTaxOverride?: number; // annual override; undefined = use computed
  surplusTargetComputedId?: string; // set when surplus target is a computed asset (e.g. "_computed_stocks")
  fxRates?: import("@/lib/currency").FxRates; // live FX rates (transient, not URL-persisted)
  fxManualOverride?: number; // manual FX override: 1 foreign = X home (persisted in URL)
  taxCredits?: import("@/lib/tax-credits").TaxCredit[]; // tax credits and deductions
  filingStatus?: import("@/lib/tax-credits").FilingStatus; // filing status for income limit checks
}

export const INITIAL_STATE: FinancialState = {
  assets: [
    { id: "a1", category: "Savings Account", amount: 5000, surplusTarget: true },
    { id: "a2", category: "TFSA", amount: 22000 },
    { id: "a3", category: "RRSP", amount: 28000 },
  ],
  debts: [
    { id: "d1", category: "Car Loan", amount: 5000 },
  ],
  income: [
    { id: "i1", category: "Salary", amount: 4500 },
  ],
  expenses: [
    { id: "e1", category: "Rent/Mortgage Payment", amount: 1800 },
    { id: "e2", category: "Groceries", amount: 500 },
    { id: "e3", category: "Subscriptions", amount: 50 },
  ],
  properties: [],
  stocks: [],
  country: "CA",
  jurisdiction: "ON",
};

/**
 * Compute how income is distributed across tax brackets.
 * Returns one segment per bracket with amountInBracket and taxInBracket.
 */
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

/**
 * Build TaxExplainerDetails from the current financial state.
 */
function buildTaxExplainerDetails(state: FinancialState, grossAnnualIncome: number, federalTax: number, provincialStateTax: number, effectiveTaxRate: number, totalTax: number, investmentIncomeAccounts?: InvestmentIncomeAccount[]): TaxExplainerDetails | undefined {
  const country = state.country ?? "CA";
  const jurisdiction = state.jurisdiction ?? "ON";
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
      const { federal, provincial } = getCanadianBrackets(jurisdiction);
      referenceBrackets = federal.brackets.map((b) => ({
        min: b.min, max: b.max, rate: b.rate, amountInBracket: 0, taxInBracket: 0,
      }));
      provincialReferenceBrackets = provincial.brackets.map((b) => ({
        min: b.min, max: b.max, rate: b.rate, amountInBracket: 0, taxInBracket: 0,
      }));
      federalBPA = federal.basicPersonalAmount;
      provincialBPA = provincial.basicPersonalAmount;
    } else {
      const { federal, state: stateTable } = getUSBrackets(jurisdiction);
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
    const { federal, provincial } = getCanadianBrackets(jurisdiction);
    const otherIncome = grossAnnualIncome - capGainsTotal;
    const taxableIncome = otherIncome + (capGainsTotal > 0 ? calculateCanadianCapitalGainsInclusion(capGainsTotal) : 0);
    brackets = computeBracketSegments(taxableIncome, federal);
    provincialBrackets = computeBracketSegments(taxableIncome, provincial);
    federalBPA = federal.basicPersonalAmount;
    provincialBPA = provincial.basicPersonalAmount;
  } else {
    const { federal, state: stateTable } = getUSBrackets(jurisdiction);
    if (capGainsTotal > 0 && capGainsTotal >= grossAnnualIncome * 0.99) {
      // Show capital gains brackets
      brackets = computeBracketSegments(grossAnnualIncome, US_CAPITAL_GAINS_2025);
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
  const taxResult = computeTax(grossAnnualIncome, hasCapitalGains ? "capital-gains" : "employment", country, jurisdiction);

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
  };
}

/**
 * Build RunwayExplainerDetails for the burndown chart in the Financial Runway explainer.
 */
type DetailedBucket = { balance: number; ror: number; category: string; taxTreatment: TaxTreatment; costBasisPercent: number; roiTaxTreatment?: "capital-gains" | "income" };
function buildRunwayExplainerDetails(
  detailedBuckets: DetailedBucket[],
  monthlyObligations: number,
  monthlyExpenses: number,
  totalMortgagePayments: number,
  runway: number,
  runwayWithGrowth: number | undefined,
  runwayAfterTax: number | undefined,
  country: "CA" | "US",
  jurisdiction: string,
): RunwayExplainerDetails | undefined {
  if (detailedBuckets.length === 0 || monthlyObligations <= 0) return undefined;

  const taxBuckets = detailedBuckets.map((b) => ({
    balance: b.balance,
    monthlyRate: b.ror / 100 / 12,
    taxTreatment: b.taxTreatment,
    category: b.category,
    costBasisPercent: b.costBasisPercent,
    roiTaxTreatment: b.roiTaxTreatment,
  }));

  const timeSeries = simulateRunwayTimeSeries(taxBuckets, monthlyObligations, country, jurisdiction);

  // Deduplicated category list preserving order
  const categories = [...new Set(detailedBuckets.map((b) => b.category))];

  // Withdrawal order sorted by tax priority
  const priorityMap: Record<TaxTreatment, number> = { "taxable": 0, "tax-free": 1, "tax-deferred": 2 };
  const sortedBuckets = [...detailedBuckets].sort((a, b) => priorityMap[a.taxTreatment] - priorityMap[b.taxTreatment]);

  const withdrawalOrder: RunwayWithdrawalOrderEntry[] = sortedBuckets.map((b) => {
    // Estimate tax cost: for tax-free it's 0, for others rough estimate
    let estimatedTaxCost = 0;
    if (b.taxTreatment === "tax-deferred") {
      // Rough: assume ~25% effective rate on full balance
      estimatedTaxCost = b.balance * 0.25;
    } else if (b.taxTreatment === "taxable") {
      // Rough: gains portion at ~15% rate
      const gainsPercent = (100 - b.costBasisPercent) / 100;
      estimatedTaxCost = b.balance * gainsPercent * 0.15;
    }
    return {
      category: b.category,
      taxTreatment: b.taxTreatment,
      roiTaxTreatment: b.roiTaxTreatment,
      startingBalance: b.balance,
      estimatedTaxCost: Math.round(estimatedTaxCost),
    };
  });

  // Growth extension
  const growthExtensionMonths = runwayWithGrowth !== undefined && runwayWithGrowth !== Infinity
    ? runwayWithGrowth - runway
    : undefined;

  // Tax drag
  const baselineRunway = runwayWithGrowth ?? runway;
  const taxDragMonths = runwayAfterTax !== undefined && baselineRunway !== Infinity
    ? baselineRunway - runwayAfterTax
    : undefined;

  return {
    withGrowth: timeSeries.withGrowth,
    withoutGrowth: timeSeries.withoutGrowth,
    withTax: timeSeries.withTax,
    withdrawalOrder,
    monthlyExpenses,
    monthlyMortgage: totalMortgagePayments,
    monthlyTotal: monthlyObligations,
    runwayMonths: runway,
    runwayWithGrowthMonths: runwayWithGrowth,
    runwayAfterTaxMonths: runwayAfterTax,
    growthExtensionMonths,
    taxDragMonths,
    categories,
  };
}

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
}

/**
 * Compute estimated monthly investment returns for each asset with a non-zero ROI.
 * Returns per-asset breakdown: balance * (roi/100) / 12.
 */
export function computeMonthlyInvestmentReturns(assets: Asset[]): MonthlyInvestmentReturn[] {
  const results: MonthlyInvestmentReturn[] = [];
  for (const asset of assets) {
    if (asset.amount <= 0) continue;
    const roi = asset.roi ?? getDefaultRoi(asset.category) ?? 0;
    if (roi <= 0) continue;
    const monthlyReturn = asset.amount * (roi / 100) / 12;
    results.push({
      label: asset.category,
      amount: monthlyReturn,
      balance: asset.amount,
      roi,
    });
  }
  return results;
}

export function computeTotals(state: FinancialState) {
  const homeCurrency = getHomeCurrency(state.country ?? "CA");
  const fxRates = getEffectiveFxRates(homeCurrency, state.fxManualOverride, state.fxRates);

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

  let totalAnnualTax = 0;
  let totalFederalTax = 0;
  let totalProvincialStateTax = 0;
  let totalAfterTaxAnnual = 0;
  let weightedEffectiveRate = 0;

  for (const [type, annualAmt] of Object.entries(incomeByType)) {
    const taxResult = computeTax(annualAmt, type as "employment" | "capital-gains" | "other", country, jurisdiction);
    totalAnnualTax += taxResult.totalTax;
    totalFederalTax += taxResult.federalTax;
    totalProvincialStateTax += taxResult.provincialStateTax;
    totalAfterTaxAnnual += taxResult.afterTaxIncome;
    weightedEffectiveRate += taxResult.effectiveRate * annualAmt;
  }

  // Apply user overrides if present (annual amounts)
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

  // Also export the computed (non-overridden) values so the UI can show defaults
  return { totalAssets, totalDebts, totalDebtPayments, monthlyIncome, monthlyExpenses, totalMonthlyContributions, totalPropertyEquity, totalPropertyValue, totalPropertyMortgage, totalMortgagePayments, totalStocks, monthlyAfterTaxIncome, totalTaxEstimate, totalFederalTax: finalFederalTax, totalProvincialStateTax: finalProvincialStateTax, effectiveTaxRate, computedFederalTax: totalFederalTax, computedProvincialStateTax: totalProvincialStateTax, homeCurrency, investmentIncomeAccounts, totalInvestmentInterest, totalTaxableBase };
}

function fmtShort(n: number, currency: SupportedCurrency): string {
  return formatCurrencyCompact(n, currency, currency);
}

const INCOME_REPLACEMENT_TIERS = [
  { label: "Early stage", threshold: 0 },
  { label: "Building momentum", threshold: 25 },
  { label: "Strong position", threshold: 50 },
  { label: "Nearly independent", threshold: 75 },
  { label: "Financially independent", threshold: 100 },
];

export function computeIncomeReplacementDetails(
  state: FinancialState,
  totalInvestedAssets: number,
  monthlyAfterTaxIncome: number,
): IncomeReplacementExplainerDetails {
  const homeCurrency = getHomeCurrency(state.country ?? "CA");
  const fxRates = getEffectiveFxRates(homeCurrency, state.fxManualOverride, state.fxRates);
  const toHome = (amount: number, itemCurrency?: SupportedCurrency) =>
    convertToHome(amount, itemCurrency ?? homeCurrency, homeCurrency, fxRates);

  const monthlyWithdrawal4pct = totalInvestedAssets * 0.04 / 12;
  const incomeReplacementPct = monthlyAfterTaxIncome > 0
    ? parseFloat((monthlyWithdrawal4pct / monthlyAfterTaxIncome * 100).toFixed(1))
    : 0;

  // Determine current tier and next tier
  let tierIndex = 0;
  for (let i = INCOME_REPLACEMENT_TIERS.length - 1; i >= 0; i--) {
    if (incomeReplacementPct >= INCOME_REPLACEMENT_TIERS[i].threshold) {
      tierIndex = i;
      break;
    }
  }
  const currentTierLabel = INCOME_REPLACEMENT_TIERS[tierIndex].label;
  const nextTier = tierIndex < INCOME_REPLACEMENT_TIERS.length - 1 ? INCOME_REPLACEMENT_TIERS[tierIndex + 1] : null;
  const nextTierLabel = nextTier?.label ?? null;
  const amountNeededForNextTier = nextTier && monthlyAfterTaxIncome > 0
    ? Math.max(0, Math.ceil((nextTier.threshold / 100 * monthlyAfterTaxIncome * 12) / 0.04) - totalInvestedAssets)
    : null;

  // Per-asset breakdown
  const assetBreakdown: { label: string; balance: number; monthlyWithdrawal: number }[] = [];
  for (const asset of state.assets.filter((a) => !a.computed)) {
    if (asset.amount > 0) {
      const balance = toHome(asset.amount, asset.currency);
      assetBreakdown.push({
        label: asset.category,
        balance,
        monthlyWithdrawal: Math.round(balance * 0.04 / 12),
      });
    }
  }
  for (const stock of (state.stocks ?? [])) {
    const val = getStockValue(stock);
    if (val > 0) {
      const balance = toHome(val, stock.priceCurrency);
      assetBreakdown.push({
        label: stock.ticker,
        balance,
        monthlyWithdrawal: Math.round(balance * 0.04 / 12),
      });
    }
  }

  return {
    totalInvestedAssets,
    monthlyWithdrawal4pct,
    monthlyAfterTaxIncome,
    incomeReplacementPct,
    currentTierLabel,
    nextTierLabel,
    amountNeededForNextTier,
    assetBreakdown,
  };
}

export function computeMetrics(state: FinancialState): MetricData[] {
  const { totalAssets, totalDebts, totalDebtPayments, monthlyIncome, monthlyExpenses, totalMonthlyContributions, totalPropertyEquity, totalPropertyValue, totalPropertyMortgage, totalMortgagePayments, totalStocks, monthlyAfterTaxIncome, totalTaxEstimate, effectiveTaxRate, totalFederalTax, totalProvincialStateTax, investmentIncomeAccounts, totalInvestmentInterest, totalTaxableBase } = computeTotals(state);
  const hc = getHomeCurrency(state.country ?? "CA");
  const $ = (n: number) => fmtShort(n, hc);

  // Net worth: show without property equity as primary, with equity as secondary
  const netWorthWithoutEquity = totalAssets + totalStocks - totalDebts;
  const netWorth = netWorthWithoutEquity;
  const netWorthWithEquity = totalAssets + totalStocks + totalPropertyEquity - totalDebts;
  // Compute estimated monthly investment returns from all assets (real + computed)
  const investmentReturns = computeMonthlyInvestmentReturns(state.assets);
  const totalMonthlyInvestmentReturns = investmentReturns.reduce((sum, r) => sum + r.amount, 0);
  // Surplus uses after-tax income + investment returns, subtracts expenses, contributions, mortgage payments, AND debt payments
  const surplus = monthlyAfterTaxIncome + totalMonthlyInvestmentReturns - monthlyExpenses - totalMonthlyContributions - totalMortgagePayments - totalDebtPayments;
  // Runway uses liquid assets + stocks (NOT property), divided by total monthly obligations (including debt payments)
  const liquidTotal = totalAssets + totalStocks;
  const monthlyObligations = monthlyExpenses + totalMortgagePayments + totalDebtPayments;
  const runway = monthlyObligations > 0 ? liquidTotal / monthlyObligations : 0;

  // Runway with investment growth: each asset account draws down proportionally, earning its own ROR.
  // Computed assets (stocks, equity) use their user-set ROI; real assets use their own ROI.
  let runwayWithGrowth: number | undefined;
  let runwayAfterTax: number | undefined;
  const country = state.country ?? "CA";
  const jurisdiction = state.jurisdiction ?? "ON";

  // Build detailed buckets with tax treatment info for both growth and tax-adjusted simulations
  type DetailedBucket = { balance: number; ror: number; category: string; taxTreatment: TaxTreatment; costBasisPercent: number; roiTaxTreatment?: "capital-gains" | "income" };
  const detailedBuckets: DetailedBucket[] = [];

  if (monthlyObligations > 0 && liquidTotal > 0) {
    const computedAssets = state.assets.filter((a) => a.computed);
    const hasComputedStocks = computedAssets.some((a) => a.id === "_computed_stocks");

    // Real assets
    for (const asset of state.assets.filter((a) => !a.computed)) {
      if (asset.amount > 0) {
        detailedBuckets.push({
          balance: asset.amount,
          ror: asset.roi ?? getDefaultRoi(asset.category) ?? 0,
          category: asset.category,
          taxTreatment: getTaxTreatment(asset.category, asset.taxTreatment),
          costBasisPercent: asset.costBasisPercent ?? 100,
          roiTaxTreatment: asset.roiTaxTreatment,
        });
      }
    }
    // Computed assets (stocks, equity) — use their user-set ROI
    for (const asset of computedAssets) {
      if (asset.amount > 0 && asset.id !== "_computed_equity") {
        detailedBuckets.push({
          balance: asset.amount,
          ror: asset.roi ?? 0,
          category: asset.category,
          taxTreatment: getTaxTreatment(asset.category, asset.taxTreatment),
          costBasisPercent: asset.costBasisPercent ?? 100,
          roiTaxTreatment: asset.roiTaxTreatment,
        });
      }
    }
    // Stocks without a computed asset entry: fall back to 0% growth, taxable
    if (!hasComputedStocks && totalStocks > 0) {
      detailedBuckets.push({ balance: totalStocks, ror: 0, category: "Brokerage", taxTreatment: "taxable", costBasisPercent: 100 });
    }

    // Runway with growth (existing, no tax)
    const hasGrowth = detailedBuckets.some((b) => b.ror > 0);
    if (hasGrowth) {
      const simBuckets = detailedBuckets.map((b) => ({ balance: b.balance, monthlyRate: b.ror / 100 / 12 }));
      const months = simulateRunwayWithGrowth(simBuckets, monthlyObligations);
      if (months - runway > 0.5) {
        runwayWithGrowth = months >= 1200 ? Infinity : parseFloat(months.toFixed(1));
      }
    }

    // Tax-adjusted runway: uses smart withdrawal order and grosses up for taxes
    const hasTaxedAccounts = detailedBuckets.some((b) => b.taxTreatment !== "tax-free");
    if (hasTaxedAccounts) {
      const taxBuckets = detailedBuckets.map((b) => ({
        balance: b.balance,
        monthlyRate: b.ror / 100 / 12,
        taxTreatment: b.taxTreatment,
        category: b.category,
        costBasisPercent: b.costBasisPercent,
        roiTaxTreatment: b.roiTaxTreatment,
      }));
      const taxMonths = simulateRunwayWithTax(taxBuckets, monthlyObligations, country, jurisdiction);
      const taxRunway = taxMonths >= 1200 ? Infinity : parseFloat(taxMonths.toFixed(1));
      // Compare against the growth-aware baseline (or simple runway if no growth)
      const baselineRunway = runwayWithGrowth ?? runway;
      const diff = baselineRunway === Infinity ? 0 : baselineRunway - taxRunway;
      if (diff > 0.3) {
        runwayAfterTax = taxRunway;
      }
    }
  }
  // Tax credit impact on metrics
  const taxCredits = state.taxCredits ?? [];
  const totalRefundableCredits = taxCredits.filter((c) => c.type === "refundable").reduce((s, c) => s + c.annualAmount, 0);
  const totalNonRefundableCredits = taxCredits.filter((c) => c.type === "non-refundable").reduce((s, c) => s + c.annualAmount, 0);
  // Non-refundable credits are capped at the total tax estimate (can't reduce tax below 0)
  const nonRefundableBenefit = Math.min(totalNonRefundableCredits, totalTaxEstimate);
  const creditAdjustedAnnualTax = Math.max(0, totalTaxEstimate - nonRefundableBenefit - totalRefundableCredits);
  const taxCreditAdjustedRate = taxCredits.length > 0 && totalTaxableBase > 0
    ? creditAdjustedAnnualTax / totalTaxableBase
    : undefined;
  // Monthly benefit from refundable credits (direct cash / income supplement)
  const monthlyRefundableCredits = totalRefundableCredits / 12;
  // Monthly benefit from non-refundable credits (reduced tax burden = more take-home)
  const monthlyNonRefundableBenefit = nonRefundableBenefit / 12;
  const totalMonthlyCreditBenefit = monthlyRefundableCredits + monthlyNonRefundableBenefit;
  // Credit-adjusted runway: credits reduce effective monthly obligations
  const creditAdjMonthlyObligations = Math.max(0.01, monthlyObligations - totalMonthlyCreditBenefit);
  const taxCreditAdjustedRunway = taxCredits.length > 0 && monthlyObligations > 0
    ? parseFloat((liquidTotal / creditAdjMonthlyObligations).toFixed(1))
    : undefined;

  // Debt-to-asset ratio includes property: (debts + mortgages) / (liquid assets + stocks + property values)
  // Use property VALUE (not equity) on asset side — equity already nets out the mortgage,
  // so using equity + mortgage as debt would double-count the mortgage.
  const totalAllAssets = totalAssets + totalStocks + totalPropertyValue;
  const totalAllDebts = totalDebts + totalPropertyMortgage;
  const debtToAssetRatio = totalAllAssets > 0 ? totalAllDebts / totalAllAssets : 0;
  // Ratio excluding mortgage — just consumer debts vs liquid assets + stocks
  const assetsWithoutProperty = totalAssets + totalStocks;
  const debtToAssetWithoutMortgage = assetsWithoutProperty > 0 ? totalDebts / assetsWithoutProperty : 0;

  // Build breakdown strings
  const nwParts: string[] = [];
  if (totalAssets > 0) nwParts.push(`${$(totalAssets)} savings`);
  if (totalStocks > 0) nwParts.push(`${$(totalStocks)} stocks`);
  if (totalPropertyEquity > 0) nwParts.push(`${$(totalPropertyEquity)} equity`);
  if (totalDebts > 0) nwParts.push(`- ${$(totalDebts)} debts`);
  const netWorthBreakdown = nwParts.length > 0 ? nwParts.join(" + ").replace("+ -", "- ") : undefined;

  const surplusTargetName = state.assets.find((a) => a.surplusTarget)?.category ?? state.assets[0]?.category;

  // Build surplus formula: income sources (added) then outflows (subtracted)
  const surplusIncome: string[] = [];
  const surplusOutflow: string[] = [];
  const monthlyTaxes = monthlyIncome - monthlyAfterTaxIncome;
  // List income sources largest-first (use gross income, taxes shown as outflow)
  if (totalMonthlyInvestmentReturns > monthlyIncome) {
    if (totalMonthlyInvestmentReturns > 0) surplusIncome.push(`${$(totalMonthlyInvestmentReturns)} investment returns`);
    if (monthlyIncome > 0) surplusIncome.push(`${$(monthlyIncome)} gross income`);
  } else {
    if (monthlyIncome > 0) surplusIncome.push(`${$(monthlyIncome)} gross income`);
    if (totalMonthlyInvestmentReturns > 0) surplusIncome.push(`${$(totalMonthlyInvestmentReturns)} investment returns`);
  }
  if (monthlyTaxes > 0) surplusOutflow.push(`${$(monthlyTaxes)} taxes`);
  if (monthlyExpenses > 0) surplusOutflow.push(`${$(monthlyExpenses)} expenses`);
  if (totalMonthlyContributions > 0) surplusOutflow.push(`${$(totalMonthlyContributions)} contributions`);
  if (totalMortgagePayments > 0) surplusOutflow.push(`${$(totalMortgagePayments)} mortgage`);
  if (totalDebtPayments > 0) surplusOutflow.push(`${$(totalDebtPayments)} debt payments`);
  const surplusFormula = [...surplusIncome.length > 0 ? [surplusIncome.join(" + ")] : [], ...surplusOutflow].join(" - ");
  const surplusBreakdown = surplus > 0 && surplusTargetName
    ? `${surplusFormula} → ${$(surplus)}/mo to ${surplusTargetName}`
    : surplusFormula;

  const obligationParts: string[] = [];
  if (monthlyExpenses > 0) obligationParts.push(`${$(monthlyExpenses)} expenses`);
  if (totalMortgagePayments > 0) obligationParts.push(`${$(totalMortgagePayments)} mortgage`);
  if (totalDebtPayments > 0) obligationParts.push(`${$(totalDebtPayments)} debt payments`);
  const runwayBreakdown = monthlyObligations > 0
    ? `${$(liquidTotal)} liquid / ${$(monthlyObligations)}/mo obligations${obligationParts.length > 1 ? ` (${obligationParts.join(" + ")})` : ""}`
    : undefined;

  const ratioBreakdown = totalAllAssets > 0
    ? `${$(totalAllDebts)} debts / ${$(totalAllAssets)} assets`
    : undefined;

  const taxBreakdown = totalTaxEstimate > 0
    ? `${$(monthlyIncome)} gross${totalInvestmentInterest > 0 ? ` + ${$(totalInvestmentInterest / 12)} inv. interest` : ""} - ${$(monthlyIncome - monthlyAfterTaxIncome)} tax = ${$(monthlyAfterTaxIncome)}/mo`
    : undefined;

  return [
    {
      title: "Net Worth",
      value: netWorth,
      format: "currency",
      icon: "💰",
      tooltip:
        "Your total assets minus total debts. This is a snapshot — it changes as you pay down debts and grow savings.",
      positive: netWorth >= 0,
      breakdown: netWorthBreakdown,
      valueWithEquity: totalPropertyEquity > 0 ? netWorthWithEquity : undefined,
    },
    {
      title: "Monthly Cash Flow",
      value: surplus,
      format: "currency",
      icon: "📈",
      tooltip:
        "How much more you earn than you spend each month, after estimated taxes and estimated investment returns. A positive surplus means you're building wealth.",
      positive: surplus > 0,
      breakdown: surplusBreakdown,
      investmentReturns: investmentReturns.length > 0 ? investmentReturns : undefined,
      taxCreditMonthlyBoost: monthlyRefundableCredits > 0 ? parseFloat(monthlyRefundableCredits.toFixed(2)) : undefined,
    },
    {
      title: "Estimated Tax",
      value: totalTaxEstimate,
      format: "currency",
      icon: "🏛️",
      tooltip:
        "Estimated annual income tax based on your income, income types, and selected country/jurisdiction. This is a rough estimate — consult a tax professional for accuracy.",
      positive: true,
      breakdown: taxBreakdown,
      effectiveRate: effectiveTaxRate,
      taxDetails: buildTaxExplainerDetails(state, totalTaxableBase, totalFederalTax, totalProvincialStateTax, effectiveTaxRate, totalTaxEstimate, investmentIncomeAccounts),
      taxCreditAdjustedRate,
    },
    {
      title: "Financial Runway",
      value: parseFloat(runway.toFixed(1)),
      format: "months",
      icon: "🛡️",
      tooltip:
        "How many months your liquid assets could cover your expenses and mortgage payments. 3–6 months is a solid emergency fund.",
      positive: runway >= 3,
      breakdown: runwayBreakdown,
      runwayWithGrowth,
      runwayAfterTax,
      runwayDetails: buildRunwayExplainerDetails(detailedBuckets, monthlyObligations, monthlyExpenses, totalMortgagePayments, runway, runwayWithGrowth, runwayAfterTax, country, jurisdiction),
      taxCreditAdjustedRunway: taxCreditAdjustedRunway !== undefined && taxCreditAdjustedRunway > runway + 0.1 ? taxCreditAdjustedRunway : undefined,
    },
    {
      title: "Debt-to-Asset Ratio",
      value: parseFloat(debtToAssetRatio.toFixed(2)),
      format: "ratio",
      icon: "⚖️",
      tooltip:
        "Your total debts divided by your total assets. A lower ratio means stronger financial footing. Mortgages often push this higher — that's normal.",
      positive: debtToAssetRatio <= 1,
      breakdown: ratioBreakdown,
      ratioWithoutMortgage: totalPropertyMortgage > 0 ? parseFloat(debtToAssetWithoutMortgage.toFixed(2)) : undefined,
    },
    ...(monthlyAfterTaxIncome > 0 ? [(() => {
      const liquidInvested = totalAssets + totalStocks;
      const incomeReplacementDetails = computeIncomeReplacementDetails(state, liquidInvested, monthlyAfterTaxIncome);
      return {
        title: "Income Replacement",
        value: incomeReplacementDetails.incomeReplacementPct,
        format: "percent" as const,
        icon: "🎯",
        tooltip:
          "What percentage of your monthly income your investment portfolio could sustainably replace using the 4% rule. 100% means financial independence.",
        positive: incomeReplacementDetails.incomeReplacementPct >= 100,
        breakdown: incomeReplacementDetails.currentTierLabel,
        incomeReplacementDetails,
      };
    })()] : []),
  ];
}

export function toFinancialData(state: FinancialState): FinancialData {
  const { totalAssets, totalDebts, totalDebtPayments, monthlyIncome, monthlyExpenses, totalMonthlyContributions, totalPropertyValue, totalPropertyMortgage, totalMortgagePayments, totalStocks, monthlyAfterTaxIncome, totalTaxEstimate, effectiveTaxRate, homeCurrency } = computeTotals(state);
  const hasCapitalGains = state.income.some((i) => i.incomeType === "capital-gains");
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
  // Prefer mortgage payments from PropertyEntry; fall back to expenses with rent-like category
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
  };
}

/**
 * Compute withdrawal tax summary data for insights and dashboard.
 * Groups assets by tax treatment and computes tax drag on runway.
 */
/**
 * Compute the Coast FIRE age — the age at which your portfolio, growing at
 * an assumed real return rate, will compound to cover retirement expenses by
 * targetAge without any additional contributions from that point on.
 *
 * If monthlySavings > 0, projects continued contributions until the coast age.
 * Returns the coast age (integer), or null if unreachable before targetAge.
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
