import type { Asset } from "@/components/AssetEntry";
import type { Debt } from "@/components/DebtEntry";
import type { IncomeItem } from "@/components/IncomeEntry";
import { normalizeToMonthly } from "@/components/IncomeEntry";
import type { ExpenseItem } from "@/components/ExpenseEntry";
import type { Property } from "@/components/PropertyEntry";
import { getEffectivePayment } from "@/components/PropertyEntry";
import type { StockHolding } from "@/components/StockEntry";
import { getStockValue } from "@/components/StockEntry";
import { getDefaultRoi, getDefaultRoiTaxTreatment } from "@/components/AssetEntry";
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
 * Withdraws from accounts in tax-optimal order: tax-free first, taxable second, tax-deferred last.
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
  const priorityMap: Record<TaxTreatment, number> = { "tax-free": 0, "taxable": 1, "tax-deferred": 2 };
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
 * Uses tax-aware withdrawal ordering (tax-free → taxable → tax-deferred).
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
  const priorityMap: Record<TaxTreatment, number> = { "tax-free": 0, "taxable": 1, "tax-deferred": 2 };
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
import { computeTax } from "@/lib/tax-engine";
import type { TaxExplainerDetails, TaxBracketSegment, RunwayExplainerDetails, RunwayTimeSeriesPoint, RunwayWithdrawalOrderEntry } from "@/components/DataFlowArrows";
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
  const segments: TaxBracketSegment[] = [];
  for (const bracket of table.brackets) {
    if (taxableIncome <= bracket.min) break;
    const amountInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
    segments.push({
      min: bracket.min,
      max: bracket.max,
      rate: bracket.rate,
      amountInBracket,
      taxInBracket: amountInBracket * bracket.rate,
    });
  }
  return segments;
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
  const priorityMap: Record<TaxTreatment, number> = { "tax-free": 0, "taxable": 1, "tax-deferred": 2 };
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
  const monthlyIncome = state.income.reduce((sum, i) => sum + normalizeToMonthly(i.amount, i.frequency), 0);
  const monthlyExpenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);
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
  return { totalAssets, totalDebts, monthlyIncome, monthlyExpenses, totalMonthlyContributions, totalPropertyEquity, totalPropertyValue, totalPropertyMortgage, totalMortgagePayments, totalStocks, monthlyAfterTaxIncome, totalTaxEstimate, totalFederalTax: finalFederalTax, totalProvincialStateTax: finalProvincialStateTax, effectiveTaxRate, computedFederalTax: totalFederalTax, computedProvincialStateTax: totalProvincialStateTax, homeCurrency, investmentIncomeAccounts, totalInvestmentInterest };
}

function fmtShort(n: number, currency?: SupportedCurrency): string {
  if (currency) return formatCurrencyCompact(n, currency);
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toFixed(0)}`;
}

export function computeMetrics(state: FinancialState): MetricData[] {
  const { totalAssets, totalDebts, monthlyIncome, monthlyExpenses, totalMonthlyContributions, totalPropertyEquity, totalPropertyValue, totalPropertyMortgage, totalMortgagePayments, totalStocks, monthlyAfterTaxIncome, totalTaxEstimate, effectiveTaxRate, totalFederalTax, totalProvincialStateTax, investmentIncomeAccounts, totalInvestmentInterest } = computeTotals(state);

  // Net worth: show without property equity as primary, with equity as secondary
  const netWorthWithoutEquity = totalAssets + totalStocks - totalDebts;
  const netWorth = netWorthWithoutEquity;
  const netWorthWithEquity = totalAssets + totalStocks + totalPropertyEquity - totalDebts;
  // Compute estimated monthly investment returns from all assets (real + computed)
  const investmentReturns = computeMonthlyInvestmentReturns(state.assets);
  const totalMonthlyInvestmentReturns = investmentReturns.reduce((sum, r) => sum + r.amount, 0);
  // Surplus uses after-tax income + investment returns, subtracts expenses, contributions, and mortgage payments
  const surplus = monthlyAfterTaxIncome + totalMonthlyInvestmentReturns - monthlyExpenses - totalMonthlyContributions - totalMortgagePayments;
  // Runway uses liquid assets + stocks (NOT property), divided by total monthly obligations
  const liquidTotal = totalAssets + totalStocks;
  const monthlyObligations = monthlyExpenses + totalMortgagePayments;
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
      if (asset.amount > 0) {
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
  if (totalAssets > 0) nwParts.push(`${fmtShort(totalAssets)} savings`);
  if (totalStocks > 0) nwParts.push(`${fmtShort(totalStocks)} stocks`);
  if (totalPropertyEquity > 0) nwParts.push(`${fmtShort(totalPropertyEquity)} equity`);
  if (totalDebts > 0) nwParts.push(`- ${fmtShort(totalDebts)} debts`);
  const netWorthBreakdown = nwParts.length > 0 ? nwParts.join(" + ").replace("+ -", "- ") : undefined;

  const surplusTargetName = state.assets.find((a) => a.surplusTarget)?.category ?? state.assets[0]?.category;

  const surplusParts = [`${fmtShort(monthlyAfterTaxIncome)} after-tax income`];
  if (totalMonthlyInvestmentReturns > 0) surplusParts.push(`${fmtShort(totalMonthlyInvestmentReturns)} investment returns`);
  if (monthlyExpenses > 0) surplusParts.push(`${fmtShort(monthlyExpenses)} expenses`);
  if (totalMonthlyContributions > 0) surplusParts.push(`${fmtShort(totalMonthlyContributions)} contributions`);
  if (totalMortgagePayments > 0) surplusParts.push(`${fmtShort(totalMortgagePayments)} mortgage`);
  const surplusBreakdown = surplus > 0 && surplusTargetName
    ? `${surplusParts.join(" - ")} → ${fmtShort(surplus)}/mo to ${surplusTargetName}`
    : surplusParts.join(" - ");

  const runwayBreakdown = monthlyObligations > 0
    ? `${fmtShort(liquidTotal)} liquid / ${fmtShort(monthlyObligations)}/mo obligations${totalMortgagePayments > 0 ? ` (${fmtShort(monthlyExpenses)} expenses + ${fmtShort(totalMortgagePayments)} mortgage)` : ""}`
    : undefined;

  const ratioBreakdown = totalAllAssets > 0
    ? `${fmtShort(totalAllDebts)} debts / ${fmtShort(totalAllAssets)} assets`
    : undefined;

  const taxBreakdown = totalTaxEstimate > 0
    ? `${fmtShort(monthlyIncome)} gross${totalInvestmentInterest > 0 ? ` + ${fmtShort(totalInvestmentInterest / 12)} inv. interest` : ""} - ${fmtShort(monthlyIncome - monthlyAfterTaxIncome)} tax = ${fmtShort(monthlyAfterTaxIncome)}/mo`
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
      title: "Monthly Surplus",
      value: surplus,
      format: "currency",
      icon: "📈",
      tooltip:
        "How much more you earn than you spend each month, after estimated taxes and estimated investment returns. A positive surplus means you're building wealth.",
      positive: surplus > 0,
      breakdown: surplusBreakdown,
      investmentReturns: investmentReturns.length > 0 ? investmentReturns : undefined,
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
      taxDetails: buildTaxExplainerDetails(state, monthlyIncome * 12, totalFederalTax, totalProvincialStateTax, effectiveTaxRate, totalTaxEstimate, investmentIncomeAccounts),
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
  ];
}

export function toFinancialData(state: FinancialState): FinancialData {
  const { totalAssets, totalDebts, monthlyIncome, monthlyExpenses, totalMonthlyContributions, totalPropertyValue, totalPropertyMortgage, totalMortgagePayments, totalStocks, monthlyAfterTaxIncome, totalTaxEstimate, effectiveTaxRate, homeCurrency } = computeTotals(state);
  const hasCapitalGains = state.income.some((i) => i.incomeType === "capital-gains");
  // Use property value + mortgage so that netWorth = totalAssets - totalDebts matches computeMetrics
  return {
    totalAssets: totalAssets + totalStocks + totalPropertyValue,
    totalDebts: totalDebts + totalPropertyMortgage,
    liquidAssets: totalAssets + totalStocks,
    monthlyIncome: monthlyAfterTaxIncome,
    monthlyExpenses: monthlyExpenses + totalMonthlyContributions + totalMortgagePayments,
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
  };
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
    const treatment = getTaxTreatment(asset.category, asset.taxTreatment);
    const bucket = treatment === "tax-free" ? taxFree : treatment === "tax-deferred" ? taxDeferred : taxable;
    bucket.total += asset.amount;
    if (!bucket.categories.includes(asset.category)) {
      bucket.categories.push(asset.category);
    }
  }

  const totalLiquid = taxFree.total + taxDeferred.total + taxable.total;
  if (totalLiquid <= 0) return undefined;

  // Build withdrawal order (tax-free first, taxable second, tax-deferred last)
  const withdrawalOrder: string[] = [];
  if (taxFree.categories.length > 0) withdrawalOrder.push(...taxFree.categories);
  if (taxable.categories.length > 0) withdrawalOrder.push(...taxable.categories);
  if (taxDeferred.categories.length > 0) withdrawalOrder.push(...taxDeferred.categories);

  // Compute tax drag: difference between base runway and tax-adjusted runway
  const monthlyObligations = state.expenses.reduce((sum, e) => sum + e.amount, 0) +
    (state.properties ?? []).reduce((sum, p) => sum + getEffectivePayment(p), 0);

  let taxDragMonths = 0;
  if (monthlyObligations > 0 && totalLiquid > 0) {
    const baseRunway = totalLiquid / monthlyObligations;

    // Build tax-aware buckets for simulation
    const taxBuckets = allAssets
      .filter((a) => a.amount > 0)
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
