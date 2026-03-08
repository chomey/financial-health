import type { FinancialState } from "@/lib/financial-state";
import { computeTotals } from "@/lib/financial-state";
import { getDefaultRoi, computeEmployerMatchMonthly } from "@/components/AssetEntry";
import { normalizeToMonthly } from "@/components/IncomeEntry";
import { getEffectivePayment, getDefaultAppreciation } from "@/components/PropertyEntry";
import { getHomeCurrency, getEffectiveFxRates, convertToHome, type SupportedCurrency } from "@/lib/currency";
import { getTaxTreatment, getWithdrawalTaxRate, type TaxTreatment } from "@/lib/withdrawal-tax";

export interface ProjectionPoint {
  month: number;
  year: number;
  netWorth: number;
  totalAssets: number;
  totalDebts: number;
  consumerDebts: number;
  mortgageDebts: number;
  totalPropertyEquity: number;
  withdrawalTaxDrag?: number; // cumulative tax paid on withdrawals during drawdown
}

export interface Milestone {
  label: string;
  month: number;
  value: number;
}

export type Scenario = "conservative" | "moderate" | "optimistic";

const SCENARIO_MULTIPLIERS: Record<Scenario, number> = {
  conservative: 0.7,
  moderate: 1.0,
  optimistic: 1.3,
};

export interface ProjectionResult {
  points: ProjectionPoint[];
  debtFreeMonth: number | null;
  consumerDebtFreeMonth: number | null; // debts only (excludes mortgages)
  mortgageFreeMonth: number | null; // mortgages only
  milestones: Milestone[];
}

export function projectFinances(
  state: FinancialState,
  years: number,
  scenario: Scenario = "moderate"
): ProjectionResult {
  const multiplier = SCENARIO_MULTIPLIERS[scenario];
  const totalMonths = years * 12;

  // Currency conversion setup
  const homeCurrency = getHomeCurrency(state.country ?? "CA");
  const fxRates = getEffectiveFxRates(homeCurrency, state.fxManualOverride, state.fxRates);
  const toHome = (amount: number, itemCurrency?: SupportedCurrency) =>
    convertToHome(amount, itemCurrency ?? homeCurrency, homeCurrency, fxRates);

  // Initial values — surplus uses after-tax income, excludes investment contributions and mortgage payments
  // (both are handled per-item in the projection loop to track individual balances).
  const { monthlyAfterTaxIncome, monthlyExpenses, totalMonthlyContributions, totalMortgagePayments, totalDebtPayments } = computeTotals(state);
  const baseSurplus = monthlyAfterTaxIncome - monthlyExpenses - totalMonthlyContributions - totalMortgagePayments - totalDebtPayments;
  // True drawdown: income can't meaningfully cover expenses + mortgage + debt payments (retirement/drawdown scenario).
  // Only trigger drawdown when there's a meaningful shortfall (> $50/mo threshold to
  // avoid triggering on small tax rounding when gross income ≈ expenses).
  const expenseShortfall = monthlyExpenses + totalMortgagePayments + totalDebtPayments - monthlyAfterTaxIncome;
  const DRAWDOWN_THRESHOLD = 50;
  const isDrawdown = expenseShortfall > DRAWDOWN_THRESHOLD;
  const monthlyDrawdown = isDrawdown ? expenseShortfall : 0;

  // Compute annual employment salary for employer match calculations
  const annualEmploymentSalary = state.income.reduce((sum, item) => {
    if ((item.incomeType ?? "employment") !== "employment") return sum;
    return sum + normalizeToMonthly(item.amount, item.frequency) * 12;
  }, 0);

  // Track each asset individually for ROI/contribution (converted to home currency)
  const assetBalances = state.assets.map((a) => {
    const baseMonthlyContrib = toHome(a.monthlyContribution ?? 0, a.currency);
    const employerMatch = (a.employerMatchPct && a.employerMatchCap && a.monthlyContribution)
      ? computeEmployerMatchMonthly(a.monthlyContribution, a.employerMatchPct, a.employerMatchCap, annualEmploymentSalary)
      : 0;
    return {
      balance: toHome(a.amount, a.currency),
      monthlyROI: ((a.roi ?? getDefaultRoi(a.category) ?? 0) * multiplier) / 100 / 12,
      monthlyContribution: (baseMonthlyContrib + employerMatch) * multiplier,
      taxTreatment: getTaxTreatment(a.category, a.taxTreatment),
      category: a.category,
      costBasisPercent: a.costBasisPercent ?? 100,
    };
  });

  // Withdrawal order priority: tax-free first, taxable second, tax-deferred last
  const withdrawalPriority: Record<TaxTreatment, number> = { "tax-free": 0, "super-fhss": 1, "super-accumulation": 1, "taxable": 1, "tax-deferred": 2 };
  const country = state.country ?? "CA";
  const jurisdiction = state.jurisdiction ?? "ON";
  let cumulativeWithdrawalTax = 0;

  // Track each debt individually for interest/payments (converted to home currency)
  const debtBalances = state.debts.map((d) => ({
    balance: toHome(d.amount, d.currency),
    monthlyRate: ((d.interestRate ?? 0) * multiplier) / 100 / 12,
    monthlyPayment: toHome(d.monthlyPayment ?? 0, d.currency),
  }));

  // Track stock holdings (static value — no growth projections for stocks)
  // Convert each stock's value using its detected price currency
  const stocksTotal = (state.stocks ?? []).reduce((sum, s) => {
    const price = s.lastFetchedPrice ?? 0;
    const value = s.shares * price;
    return sum + toHome(value, s.priceCurrency);
  }, 0);

  // Track each property mortgage for interest/payments and value appreciation/depreciation
  const propertyBalances = state.properties.map((p) => ({
    value: toHome(p.value, p.currency),
    mortgage: toHome(p.mortgage, p.currency),
    monthlyRate: ((p.interestRate ?? 0) * multiplier) / 100 / 12,
    monthlyPayment: toHome(getEffectivePayment(p), p.currency),
    monthlyAppreciation: ((p.appreciation ?? getDefaultAppreciation(p.name) ?? 0) * multiplier) / 100 / 12,
  }));

  const points: ProjectionPoint[] = [];
  const milestones: Milestone[] = [];
  const milestoneThresholds = [100_000, 250_000, 500_000, 1_000_000, 2_500_000, 5_000_000, 10_000_000];
  const passedMilestones = new Set<number>();
  let debtFreeMonth: number | null = null;
  let consumerDebtFreeMonth: number | null = null;
  let mortgageFreeMonth: number | null = null;

  for (let m = 0; m <= totalMonths; m++) {
    // Calculate current totals
    const totalAssetValue = assetBalances.reduce((s, a) => s + a.balance, 0);
    const totalDebtValue = debtBalances.reduce((s, d) => s + Math.max(0, d.balance), 0);
    const totalPropertyEquity = propertyBalances.reduce(
      (s, p) => s + Math.max(0, p.value - Math.max(0, p.mortgage)),
      0
    );
    const totalMortgage = propertyBalances.reduce((s, p) => s + Math.max(0, p.mortgage), 0);
    const netWorth = totalAssetValue + stocksTotal + totalPropertyEquity - totalDebtValue;

    points.push({
      month: m,
      year: parseFloat((m / 12).toFixed(1)),
      netWorth: Math.round(netWorth),
      totalAssets: Math.round(totalAssetValue + stocksTotal),
      totalDebts: Math.round(totalDebtValue + totalMortgage),
      consumerDebts: Math.round(totalDebtValue),
      mortgageDebts: Math.round(totalMortgage),
      totalPropertyEquity: Math.round(totalPropertyEquity),
      withdrawalTaxDrag: cumulativeWithdrawalTax > 0 ? Math.round(cumulativeWithdrawalTax) : undefined,
    });

    // Check milestones
    for (const threshold of milestoneThresholds) {
      if (netWorth >= threshold && !passedMilestones.has(threshold)) {
        passedMilestones.add(threshold);
        milestones.push({
          label: formatMilestoneLabel(threshold),
          month: m,
          value: threshold,
        });
      }
    }

    // Check debt-free (consumer debts vs mortgages separately)
    if (consumerDebtFreeMonth === null && totalDebtValue <= 0) {
      consumerDebtFreeMonth = m;
    }
    if (mortgageFreeMonth === null && totalMortgage <= 0) {
      mortgageFreeMonth = m;
    }
    if (debtFreeMonth === null && totalDebtValue <= 0 && totalMortgage <= 0) {
      debtFreeMonth = m;
    }

    // Advance one month (skip on last iteration)
    if (m < totalMonths) {
      // Grow assets by ROI and add contributions (skip contributions in drawdown — can't save when income < expenses)
      for (const a of assetBalances) {
        a.balance = a.balance * (1 + a.monthlyROI) + (isDrawdown ? 0 : a.monthlyContribution);
      }

      // Grow debts by interest, subtract payments
      for (const d of debtBalances) {
        if (d.balance > 0) {
          d.balance = d.balance * (1 + d.monthlyRate) - d.monthlyPayment;
          if (d.balance < 0) d.balance = 0;
        }
      }

      // Property: appreciate/depreciate value, grow mortgage by interest, subtract payments
      for (const p of propertyBalances) {
        // Apply appreciation/depreciation to property value
        p.value = p.value * (1 + p.monthlyAppreciation);
        if (p.value < 0) p.value = 0;

        if (p.mortgage > 0) {
          p.mortgage = p.mortgage * (1 + p.monthlyRate) - p.monthlyPayment;
          if (p.mortgage < 0) p.mortgage = 0;
        }
      }

      // Monthly surplus goes to the designated surplus target account, or first asset as fallback
      if (!isDrawdown && baseSurplus > 0 && assetBalances.length > 0) {
        const targetIdx = state.assets.findIndex((a) => a.surplusTarget);
        const idx = targetIdx >= 0 ? targetIdx : 0;
        assetBalances[idx].balance += baseSurplus * multiplier;
      } else if (isDrawdown && assetBalances.length > 0) {
        // Drawdown phase: income doesn't cover expenses + mortgage.
        // Withdraw from assets in tax-optimal order to cover the shortfall.
        let shortfall = monthlyDrawdown * multiplier;

        // Sort asset indices by withdrawal priority
        const sortedAssetIndices = assetBalances
          .map((_, i) => i)
          .filter((i) => assetBalances[i].balance > 0)
          .sort((a, b) => withdrawalPriority[assetBalances[a].taxTreatment] - withdrawalPriority[assetBalances[b].taxTreatment]);

        for (const idx of sortedAssetIndices) {
          if (shortfall <= 0) break;
          const bucket = assetBalances[idx];
          if (bucket.balance <= 0) continue;

          if (bucket.taxTreatment === "tax-free") {
            // No tax on withdrawal
            const withdrawal = Math.min(shortfall, bucket.balance);
            bucket.balance -= withdrawal;
            shortfall -= withdrawal;
          } else {
            // Compute gross-up for tax
            const annualizedShortfall = shortfall * 12;
            const taxResult = getWithdrawalTaxRate(
              bucket.category, country, jurisdiction,
              annualizedShortfall, bucket.costBasisPercent
            );
            const effectiveRate = taxResult.effectiveRate;
            const grossUpFactor = effectiveRate < 1 ? 1 / (1 - effectiveRate) : 10;
            const grossWithdrawal = Math.min(shortfall * grossUpFactor, bucket.balance);
            const afterTax = grossWithdrawal / grossUpFactor;
            const taxPaid = grossWithdrawal - afterTax;
            cumulativeWithdrawalTax += taxPaid;
            bucket.balance -= grossWithdrawal;
            shortfall -= afterTax;
          }

          if (bucket.balance < 0) bucket.balance = 0;
        }
      }

    }
  }

  return { points, debtFreeMonth, consumerDebtFreeMonth, mortgageFreeMonth, milestones };
}

/**
 * Compute the FIRE (Financial Independence, Retire Early) number.
 * FIRE number = annual expenses / safe withdrawal rate.
 * @param monthlyExpenses - Monthly living expenses (raw, excluding contributions/mortgage)
 * @param safeWithdrawalRate - Safe withdrawal rate as a percentage (e.g. 4 for 4%)
 */
export function computeFireNumber(monthlyExpenses: number, safeWithdrawalRate: number): number {
  if (safeWithdrawalRate <= 0 || monthlyExpenses <= 0) return 0;
  return (monthlyExpenses * 12) / (safeWithdrawalRate / 100);
}

/**
 * Find the month when net worth first reaches or exceeds a target value.
 * Returns null if the target is not reached within the projection.
 */
export function findMonthAtTarget(points: ProjectionPoint[], target: number): number | null {
  if (target <= 0) return null;
  for (const p of points) {
    if (p.netWorth >= target) return p.month;
  }
  return null;
}

function formatMilestoneLabel(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  return `$${(value / 1_000).toFixed(0)}k`;
}

/** Project a single asset's value at specific year milestones */
export interface AssetProjection {
  category: string;
  currentValue: number;
  milestoneValues: number[]; // values at each milestone year
}

export function projectAssets(
  assets: FinancialState["assets"],
  scenario: Scenario = "moderate",
  milestoneYears: number[] = [10, 20, 30, 40, 50],
  monthlySurplus: number = 0,
  homeCurrency?: SupportedCurrency,
  fxRates?: import("@/lib/currency").FxRates,
): AssetProjection[] {
  const multiplier = SCENARIO_MULTIPLIERS[scenario];
  const maxMonth = Math.max(...milestoneYears) * 12;
  const milestoneMonths = new Set(milestoneYears.map((y) => y * 12));

  const toHome = homeCurrency && fxRates
    ? (amount: number, itemCurrency?: SupportedCurrency) =>
        convertToHome(amount, itemCurrency ?? homeCurrency, homeCurrency, fxRates)
    : (amount: number) => amount;

  return assets.map((a) => {
    const monthlyROI = ((a.roi ?? getDefaultRoi(a.category) ?? 0) * multiplier) / 100 / 12;
    const surplusContrib = a.surplusTarget && monthlySurplus > 0 ? monthlySurplus : 0;
    const monthlyContribution = (toHome(a.monthlyContribution ?? 0, a.currency) + surplusContrib) * multiplier;
    let balance = toHome(a.amount, a.currency);
    const snapshots: Map<number, number> = new Map();
    for (let m = 1; m <= maxMonth; m++) {
      balance = balance * (1 + monthlyROI) + monthlyContribution;
      if (milestoneMonths.has(m)) {
        snapshots.set(m, Math.round(balance));
      }
    }
    return {
      category: a.category,
      currentValue: toHome(a.amount, a.currency),
      milestoneValues: milestoneYears.map((y) => snapshots.get(y * 12) ?? Math.round(balance)),
    };
  });
}

/**
 * Deflate projection points from nominal to real (today's dollars).
 * Each point at year Y is divided by (1 + inflationRate)^Y.
 * @param points - Array of ProjectionPoint (nominal values)
 * @param inflationRate - Annual inflation rate as a decimal (e.g., 0.025 for 2.5%)
 */
export function deflateProjectionPoints(
  points: ProjectionPoint[],
  inflationRate: number
): ProjectionPoint[] {
  return points.map((p) => {
    const years = p.month / 12;
    const deflator = Math.pow(1 + inflationRate, years);
    return {
      ...p,
      netWorth: Math.round(p.netWorth / deflator),
      totalAssets: Math.round(p.totalAssets / deflator),
      totalDebts: Math.round(p.totalDebts / deflator),
      consumerDebts: Math.round(p.consumerDebts / deflator),
      mortgageDebts: Math.round(p.mortgageDebts / deflator),
      totalPropertyEquity: Math.round(p.totalPropertyEquity / deflator),
      withdrawalTaxDrag:
        p.withdrawalTaxDrag !== undefined
          ? Math.round(p.withdrawalTaxDrag / deflator)
          : undefined,
    };
  });
}

/**
 * Compute the monthly remaining balance for a single mortgage over time.
 * Returns an array of length (months + 1) where index 0 is the initial balance.
 */
export function computeMortgageAmortization(
  principal: number,
  annualRate: number,
  monthlyPayment: number,
  months: number
): number[] {
  const monthlyRate = annualRate / 100 / 12;
  const balances: number[] = [];
  let balance = principal;
  for (let m = 0; m <= months; m++) {
    balances.push(Math.max(0, Math.round(balance)));
    if (m < months) {
      if (balance > 0) {
        balance = balance * (1 + monthlyRate) - monthlyPayment;
        if (balance < 0) balance = 0;
      }
    }
  }
  return balances;
}

/** Downsample projection points for chart rendering — keep start, end, and evenly-spaced points */
export function downsamplePoints(points: ProjectionPoint[], maxPoints: number = 120): ProjectionPoint[] {
  if (points.length <= maxPoints) return points;
  const step = (points.length - 1) / (maxPoints - 1);
  const result: ProjectionPoint[] = [];
  for (let i = 0; i < maxPoints; i++) {
    result.push(points[Math.round(i * step)]);
  }
  return result;
}
