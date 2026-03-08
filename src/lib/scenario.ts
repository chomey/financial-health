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
  /** Zero all income (retire today scenario) */
  retireToday: boolean;
  /** Max out tax-sheltered account contributions */
  maxTaxSheltered: boolean;
  /** Housing downsize percentage (0-100) — reduces property value and mortgage */
  housingDownsizePercent: number;
  /** Global ROI adjustment in percentage points (e.g., -3 to +3) */
  roiAdjustment: number;
}

export const EMPTY_MODIFICATION: ScenarioModification = {
  excludedDebtIds: [],
  contributionOverrides: {},
  incomeAdjustment: 0,
  windfall: 0,
  retireToday: false,
  maxTaxSheltered: false,
  housingDownsizePercent: 0,
  roiAdjustment: 0,
};

/** Annual contribution limits for tax-sheltered accounts (2024/2025 values) */
export const TAX_SHELTERED_LIMITS: Record<string, { annual: number; country: "CA" | "US" | "AU" }> = {
  TFSA: { annual: 7000, country: "CA" },
  RRSP: { annual: 31560, country: "CA" },
  RESP: { annual: 2500, country: "CA" },
  FHSA: { annual: 8000, country: "CA" },
  "401k": { annual: 23500, country: "US" },
  "Roth 401k": { annual: 23500, country: "US" },
  IRA: { annual: 7000, country: "US" },
  "Roth IRA": { annual: 7000, country: "US" },
  "529": { annual: 18000, country: "US" },
  HSA: { annual: 4300, country: "US" },
  "Super (Accumulation)": { annual: 30000, country: "AU" },
  "Super (Pension Phase)": { annual: 120000, country: "AU" },
  "First Home Super Saver": { annual: 15000, country: "AU" },
};

/** Check if an asset category is a tax-sheltered account */
export function isTaxSheltered(category: string): boolean {
  const normalized = category.trim();
  return normalized in TAX_SHELTERED_LIMITS;
}

/** Get the monthly contribution limit for a tax-sheltered account */
export function getMonthlyLimit(category: string): number {
  const limit = TAX_SHELTERED_LIMITS[category.trim()];
  if (!limit) return 0;
  return Math.round((limit.annual / 12) * 100) / 100;
}

/** Preset scenario configurations */
export type ScenarioPreset = "conservative" | "aggressive-saver" | "early-retirement";

export function applyPreset(
  preset: ScenarioPreset,
  state: FinancialState
): ScenarioModification {
  switch (preset) {
    case "conservative":
      return { ...EMPTY_MODIFICATION, roiAdjustment: -2 };
    case "aggressive-saver":
      return { ...EMPTY_MODIFICATION, maxTaxSheltered: true };
    case "early-retirement":
      return { ...EMPTY_MODIFICATION, retireToday: true };
  }
}

export interface ScenarioComparison {
  baseline: ProjectionResult;
  scenario: ProjectionResult;
  /** Net worth difference at specific year milestones */
  netWorthDeltas: { year: number; baseline: number; scenario: number; delta: number }[];
  /** Debt-free date difference in months (negative = sooner) */
  debtFreeDeltaMonths: number | null;
  /** Consumer debt-free delta */
  consumerDebtFreeDeltaMonths: number | null;
  /** Runway in months for scenario (how long savings last with no income) */
  scenarioRunwayMonths: number | null;
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

  // Compute runway for retire-today scenario
  let scenarioRunwayMonths: number | null = null;
  if (modification.retireToday) {
    // Find the month where net worth crosses zero (or stays positive)
    const points = scenarioResult.points;
    const crossingPoint = points.find((p) => p.netWorth <= 0 && p.month > 0);
    scenarioRunwayMonths = crossingPoint ? crossingPoint.month : years * 12;
  }

  return {
    baseline,
    scenario: scenarioResult,
    netWorthDeltas,
    debtFreeDeltaMonths,
    consumerDebtFreeDeltaMonths,
    scenarioRunwayMonths,
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

  // Apply contribution overrides and max tax-sheltered
  let assets = state.assets.map((a) => {
    let asset = a;

    // Apply explicit contribution overrides first
    if (mod.contributionOverrides[a.id] !== undefined) {
      asset = { ...asset, monthlyContribution: mod.contributionOverrides[a.id] };
    }

    // Max tax-sheltered: override monthly contribution to max limit
    if (mod.maxTaxSheltered && isTaxSheltered(asset.category)) {
      const monthlyLimit = getMonthlyLimit(asset.category);
      const currentContrib = asset.monthlyContribution ?? 0;
      if (monthlyLimit > currentContrib) {
        asset = { ...asset, monthlyContribution: monthlyLimit };
      }
    }

    // Apply ROI adjustment
    if (mod.roiAdjustment !== 0 && asset.roi !== undefined) {
      asset = { ...asset, roi: Math.max(0, asset.roi + mod.roiAdjustment) };
    }

    return asset;
  });

  // Apply windfall: add to surplus target asset, or first asset
  if (mod.windfall > 0 && assets.length > 0) {
    const targetIdx = assets.findIndex((a) => a.surplusTarget);
    const idx = targetIdx >= 0 ? targetIdx : 0;
    assets = [...assets];
    assets[idx] = { ...assets[idx], amount: assets[idx].amount + mod.windfall };
  }

  // Apply housing downsize
  let properties = state.properties;
  if (mod.housingDownsizePercent > 0 && properties.length > 0) {
    const factor = 1 - mod.housingDownsizePercent / 100;
    let equityReleased = 0;
    properties = properties.map((p) => {
      const newValue = p.value * factor;
      const newMortgage = p.mortgage * factor;
      equityReleased += (p.value - p.mortgage) - (newValue - newMortgage);
      return {
        ...p,
        value: newValue,
        mortgage: newMortgage,
        monthlyPayment: p.monthlyPayment ? p.monthlyPayment * factor : undefined,
      };
    });

    // Add released equity to surplus target or first asset
    if (equityReleased > 0 && assets.length > 0) {
      const targetIdx = assets.findIndex((a) => a.surplusTarget);
      const idx = targetIdx >= 0 ? targetIdx : 0;
      assets = [...assets];
      assets[idx] = { ...assets[idx], amount: assets[idx].amount + equityReleased };
    }
  }

  // Determine income
  let income = state.income;
  if (mod.retireToday) {
    // Zero all income
    income = income.map((i) => ({ ...i, amount: 0 }));
  } else if (mod.incomeAdjustment !== 0) {
    income = applyIncomeAdjustment(income, mod.incomeAdjustment);
  }

  return {
    ...state,
    debts,
    assets,
    properties,
    income,
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
