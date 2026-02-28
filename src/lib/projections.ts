import type { FinancialState } from "@/lib/financial-state";
import { computeTotals } from "@/lib/financial-state";

export interface ProjectionPoint {
  month: number;
  year: number;
  netWorth: number;
  totalAssets: number;
  totalDebts: number;
  consumerDebts: number;
  mortgageDebts: number;
  totalPropertyEquity: number;
}

export interface GoalMilestone {
  goalName: string;
  monthReached: number | null; // null if never reached in projection
  targetAmount: number;
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
  goalMilestones: GoalMilestone[];
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

  // Initial values — surplus excludes investment contributions (handled per-asset)
  const { monthlyIncome, monthlyExpenses, totalMonthlyContributions } = computeTotals(state);
  const baseSurplus = monthlyIncome - monthlyExpenses - totalMonthlyContributions;

  // Track each asset individually for ROI/contribution
  const assetBalances = state.assets.map((a) => ({
    balance: a.amount,
    monthlyROI: ((a.roi ?? 0) * multiplier) / 100 / 12,
    monthlyContribution: (a.monthlyContribution ?? 0) * multiplier,
  }));

  // Track each debt individually for interest/payments
  const debtBalances = state.debts.map((d) => ({
    balance: d.amount,
    monthlyRate: ((d.interestRate ?? 0) * multiplier) / 100 / 12,
    monthlyPayment: d.monthlyPayment ?? 0,
  }));

  // Track stock holdings (static value — no growth projections for stocks)
  const stocksTotal = (state.stocks ?? []).reduce((sum, s) => {
    const price = s.lastFetchedPrice ?? 0;
    return sum + s.shares * price;
  }, 0);

  // Track each property mortgage for interest/payments
  const propertyBalances = state.properties.map((p) => ({
    value: p.value,
    mortgage: p.mortgage,
    monthlyRate: ((p.interestRate ?? 0) * multiplier) / 100 / 12,
    monthlyPayment: p.monthlyPayment ?? 0,
  }));

  // Goal tracking — current amounts grow with surplus allocation
  const goalProgress = state.goals.map((g) => ({
    name: g.name,
    current: g.currentAmount,
    target: g.targetAmount,
    reached: g.currentAmount >= g.targetAmount ? 0 : null as number | null,
  }));

  const points: ProjectionPoint[] = [];
  const milestones: Milestone[] = [];
  const milestoneThresholds = [100_000, 250_000, 500_000, 1_000_000, 2_500_000, 5_000_000];
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

    // Check goals
    for (const goal of goalProgress) {
      if (goal.reached === null && goal.current >= goal.target) {
        goal.reached = m;
      }
    }

    // Advance one month (skip on last iteration)
    if (m < totalMonths) {
      // Grow assets by ROI and add contributions
      for (const a of assetBalances) {
        a.balance = a.balance * (1 + a.monthlyROI) + a.monthlyContribution;
      }

      // Grow debts by interest, subtract payments
      for (const d of debtBalances) {
        if (d.balance > 0) {
          d.balance = d.balance * (1 + d.monthlyRate) - d.monthlyPayment;
          if (d.balance < 0) d.balance = 0;
        }
      }

      // Property mortgages: grow by interest, subtract payments
      for (const p of propertyBalances) {
        if (p.mortgage > 0) {
          p.mortgage = p.mortgage * (1 + p.monthlyRate) - p.monthlyPayment;
          if (p.mortgage < 0) p.mortgage = 0;
        }
      }

      // Monthly surplus goes to the designated surplus target account, or first asset as fallback
      if (baseSurplus > 0 && assetBalances.length > 0) {
        const targetIdx = state.assets.findIndex((a) => a.surplusTarget);
        const idx = targetIdx >= 0 ? targetIdx : 0;
        assetBalances[idx].balance += baseSurplus * multiplier;
      }

      // Goal progress: assume surplus contributes proportionally to goals
      const unmetGoals = goalProgress.filter((g) => g.reached === null);
      if (baseSurplus > 0 && unmetGoals.length > 0) {
        const perGoal = (baseSurplus * multiplier) / unmetGoals.length;
        for (const g of unmetGoals) {
          g.current += perGoal;
        }
      }
    }
  }

  const goalMilestones: GoalMilestone[] = goalProgress.map((g) => ({
    goalName: g.name,
    monthReached: g.reached,
    targetAmount: g.target,
  }));

  return { points, goalMilestones, debtFreeMonth, consumerDebtFreeMonth, mortgageFreeMonth, milestones };
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
  milestoneYears: number[] = [10, 20, 30]
): AssetProjection[] {
  const multiplier = SCENARIO_MULTIPLIERS[scenario];
  const maxMonth = Math.max(...milestoneYears) * 12;
  const milestoneMonths = new Set(milestoneYears.map((y) => y * 12));

  return assets.map((a) => {
    const monthlyROI = ((a.roi ?? 0) * multiplier) / 100 / 12;
    const monthlyContribution = (a.monthlyContribution ?? 0) * multiplier;
    let balance = a.amount;
    const snapshots: Map<number, number> = new Map();
    for (let m = 1; m <= maxMonth; m++) {
      balance = balance * (1 + monthlyROI) + monthlyContribution;
      if (milestoneMonths.has(m)) {
        snapshots.set(m, Math.round(balance));
      }
    }
    return {
      category: a.category,
      currentValue: a.amount,
      milestoneValues: milestoneYears.map((y) => snapshots.get(y * 12) ?? Math.round(balance)),
    };
  });
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
