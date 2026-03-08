import type { TaxTreatment } from "@/lib/withdrawal-tax";
import { getWithdrawalTaxRate } from "@/lib/withdrawal-tax";
import type { RunwayExplainerDetails, RunwayTimeSeriesPoint, RunwayWithdrawalOrderEntry } from "@/components/DataFlowArrows";

/**
 * Simulate how many months a set of accounts last when drawing down a fixed monthly amount.
 * Each account earns its own monthly return. Withdrawals are taken proportionally from each
 * account based on current balances each month. Returns months until total balance hits 0.
 * Caps at 1200 months (100 years) to avoid infinite loops.
 */
export function simulateRunwayWithGrowth(
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
export function simulateRunwayWithTax(
  buckets: { balance: number; monthlyRate: number; taxTreatment: TaxTreatment; category: string; costBasisPercent: number; roiTaxTreatment?: "capital-gains" | "income" }[],
  monthlyWithdrawal: number,
  country: "CA" | "US" | "AU",
  jurisdiction: string,
): number {
  if (monthlyWithdrawal <= 0) return 0;
  const balances = buckets.map((b) => b.balance);
  const rates = buckets.map((b) => b.monthlyRate);
  const MAX_MONTHS = 1200;

  // Priority order: tax-free (0), taxable (1), tax-deferred (2)
  const priorityMap: Record<TaxTreatment, number> = { "taxable": 0, "super-accumulation": 0, "super-fhss": 1, "tax-free": 1, "tax-deferred": 2 };
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
        const annualizedWithdrawal = remaining * 12;
        const taxResult = getWithdrawalTaxRate(
          buckets[idx].category, country, jurisdiction,
          annualizedWithdrawal, buckets[idx].costBasisPercent,
          buckets[idx].roiTaxTreatment
        );
        const effectiveRate = taxResult.effectiveRate;
        const grossUpFactor = effectiveRate < 1 ? 1 / (1 - effectiveRate) : 10;
        grossWithdrawal = Math.min(remaining * grossUpFactor, balances[idx]);
        const afterTax = grossWithdrawal / grossUpFactor;
        remaining -= afterTax;
      }
      balances[idx] -= grossWithdrawal;
      if (balances[idx] < 0) balances[idx] = 0;
    }

    // Apply growth
    for (let i = 0; i < balances.length; i++) {
      balances[i] *= 1 + rates[i];
    }
  }
  return MAX_MONTHS;
}

export function simulateRunwayTimeSeries(
  buckets: { balance: number; monthlyRate: number; taxTreatment: TaxTreatment; category: string; costBasisPercent: number; roiTaxTreatment?: "capital-gains" | "income" }[],
  monthlyWithdrawal: number,
  country: "CA" | "US" | "AU",
  jurisdiction: string,
): { withGrowth: RunwayTimeSeriesPoint[]; withoutGrowth: RunwayTimeSeriesPoint[]; withTax: RunwayTimeSeriesPoint[] } {
  if (monthlyWithdrawal <= 0 || buckets.length === 0) {
    return { withGrowth: [], withoutGrowth: [], withTax: [] };
  }

  const MAX_MONTHS = 600; // Cap at 50 years for charting
  const categories = buckets.map((b) => b.category);

  // Priority order: tax-free (0), taxable (1), tax-deferred (2)
  const priorityMap: Record<TaxTreatment, number> = { "taxable": 0, "super-accumulation": 0, "super-fhss": 1, "tax-free": 1, "tax-deferred": 2 };
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

export type DetailedBucket = { balance: number; ror: number; category: string; taxTreatment: TaxTreatment; costBasisPercent: number; roiTaxTreatment?: "capital-gains" | "income" };

export function buildRunwayExplainerDetails(
  detailedBuckets: DetailedBucket[],
  monthlyObligations: number,
  monthlyExpenses: number,
  totalMortgagePayments: number,
  runway: number,
  runwayWithGrowth: number | undefined,
  runwayAfterTax: number | undefined,
  country: "CA" | "US" | "AU",
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
  const priorityMap: Record<TaxTreatment, number> = { "taxable": 0, "super-accumulation": 0, "super-fhss": 1, "tax-free": 1, "tax-deferred": 2 };
  const sortedBuckets = [...detailedBuckets].sort((a, b) => priorityMap[a.taxTreatment] - priorityMap[b.taxTreatment]);

  const withdrawalOrder: RunwayWithdrawalOrderEntry[] = sortedBuckets.map((b) => {
    // Estimate tax cost: for tax-free it's 0, for others rough estimate
    let estimatedTaxCost = 0;
    if (b.taxTreatment === "tax-deferred") {
      // Rough: assume ~25% effective rate on full balance
      estimatedTaxCost = b.balance * 0.25;
    } else if (b.taxTreatment === "super-accumulation") {
      // AU super accumulation: flat 15% on earnings
      estimatedTaxCost = b.balance * 0.15;
    } else if (b.taxTreatment === "super-fhss") {
      // AU FHSS: marginal rate minus 30% offset, rough ~10%
      estimatedTaxCost = b.balance * 0.10;
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
