import type { FinancialState } from "@/lib/financial-state";
import { projectFinances } from "@/lib/projections";
import type { ProjectionResult, Scenario } from "@/lib/projections";

export interface ScenarioModification {
  /** Debt IDs to exclude (paid off) */
  excludedDebtIds: string[];
  /** Override monthly contribution for specific asset IDs */
  contributionOverrides: Record<string, number>;
  /** Additional monthly income change (can be negative) */
  incomeAdjustment: number;
  /** One-time windfall amount added to first asset (or surplus target) */
  windfall: number;
}

export const EMPTY_MODIFICATION: ScenarioModification = {
  excludedDebtIds: [],
  contributionOverrides: {},
  incomeAdjustment: 0,
  windfall: 0,
};

export interface ScenarioComparison {
  baseline: ProjectionResult;
  scenario: ProjectionResult;
  /** Net worth difference at specific year milestones */
  netWorthDeltas: { year: number; baseline: number; scenario: number; delta: number }[];
  /** Debt-free date difference in months (negative = sooner) */
  debtFreeDeltaMonths: number | null;
  /** Consumer debt-free delta */
  consumerDebtFreeDeltaMonths: number | null;
}

/**
 * Apply scenario modifications to a financial state and compare projections
 */
export function compareScenarios(
  state: FinancialState,
  modification: ScenarioModification,
  years: number = 10,
  scenario: Scenario = "moderate"
): ScenarioComparison {
  const baseline = projectFinances(state, years, scenario);

  // Build modified state
  const modifiedState = applyModification(state, modification);
  const scenarioResult = projectFinances(modifiedState, years, scenario);

  // Compute deltas at milestone years
  const milestoneYears = [5, 10];
  if (years >= 20) milestoneYears.push(20);
  if (years >= 30) milestoneYears.push(30);

  const netWorthDeltas = milestoneYears
    .filter((y) => y <= years)
    .map((y) => {
      const month = y * 12;
      const basePoint = baseline.points.find((p) => p.month === month);
      const scenPoint = scenarioResult.points.find((p) => p.month === month);
      const baseNW = basePoint?.netWorth ?? 0;
      const scenNW = scenPoint?.netWorth ?? 0;
      return { year: y, baseline: baseNW, scenario: scenNW, delta: scenNW - baseNW };
    });

  // Debt-free delta
  const debtFreeDeltaMonths =
    baseline.debtFreeMonth !== null && scenarioResult.debtFreeMonth !== null
      ? scenarioResult.debtFreeMonth - baseline.debtFreeMonth
      : null;

  const consumerDebtFreeDeltaMonths =
    baseline.consumerDebtFreeMonth !== null && scenarioResult.consumerDebtFreeMonth !== null
      ? scenarioResult.consumerDebtFreeMonth - baseline.consumerDebtFreeMonth
      : null;

  return {
    baseline,
    scenario: scenarioResult,
    netWorthDeltas,
    debtFreeDeltaMonths,
    consumerDebtFreeDeltaMonths,
  };
}

/**
 * Apply modifications to produce a new FinancialState for scenario projection
 */
export function applyModification(
  state: FinancialState,
  mod: ScenarioModification
): FinancialState {
  // Filter out excluded debts
  const debts = state.debts.filter((d) => !mod.excludedDebtIds.includes(d.id));

  // Apply contribution overrides
  const assets = state.assets.map((a) => {
    if (mod.contributionOverrides[a.id] !== undefined) {
      return { ...a, monthlyContribution: mod.contributionOverrides[a.id] };
    }
    return a;
  });

  // Apply windfall: add to surplus target asset, or first asset
  if (mod.windfall > 0 && assets.length > 0) {
    const targetIdx = assets.findIndex((a) => a.surplusTarget);
    const idx = targetIdx >= 0 ? targetIdx : 0;
    const updatedAssets = [...assets];
    updatedAssets[idx] = { ...updatedAssets[idx], amount: updatedAssets[idx].amount + mod.windfall };
    return {
      ...state,
      debts,
      assets: updatedAssets,
      // Apply income adjustment by modifying first income item
      income: applyIncomeAdjustment(state.income, mod.incomeAdjustment),
    };
  }

  return {
    ...state,
    debts,
    assets,
    income: applyIncomeAdjustment(state.income, mod.incomeAdjustment),
  };
}

function applyIncomeAdjustment(
  income: FinancialState["income"],
  adjustment: number
): FinancialState["income"] {
  if (adjustment === 0 || income.length === 0) return income;
  // Apply adjustment to first income item
  const updated = [...income];
  updated[0] = { ...updated[0], amount: Math.max(0, updated[0].amount + adjustment) };
  return updated;
}
