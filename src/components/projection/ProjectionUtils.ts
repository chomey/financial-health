import type { Scenario } from "@/lib/projections";
import type { FinancialState } from "@/lib/financial-state";
import type { RunwayExplainerDetails } from "@/components/DataFlowArrows";
import type { OutlookYears } from "@/lib/url-state";

export type ChartMode = "keep-earning" | "income-stops";

export interface ProjectionMilestone {
  icon: string;
  text: string;
  color: "emerald" | "amber" | "slate";
}

export interface ProjectionChartProps {
  state: FinancialState;
  runwayDetails?: RunwayExplainerDetails;
  safeWithdrawalRate?: number;
  onOutlookChange?: (years: OutlookYears) => void;
  onMilestonesChange?: (milestones: ProjectionMilestone[]) => void;
}

export interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string; payload?: Record<string, unknown> }>;
  label?: number;
}

export const SCENARIO_LABELS: Record<Scenario, string> = {
  conservative: "Conservative",
  moderate: "Moderate",
  optimistic: "Optimistic",
};

export const SCENARIO_COLORS: Record<Scenario, string> = {
  conservative: "#f59e0b", // amber-400
  moderate: "#34d399",    // emerald-400
  optimistic: "#60a5fa",  // blue-400
};

export const SCENARIO_DESCRIPTIONS: Record<Scenario, string> = {
  conservative: "30% below your entered returns — accounts for market downturns and lower growth",
  moderate: "Uses your entered ROI values as-is — expected returns based on your inputs",
  optimistic: "30% above your entered returns — best-case growth scenario",
};

export function computeTableMilestones(years: number): number[] {
  if (years <= 20) return [5, 10, 15, 20];
  if (years <= 30) return [5, 10, 20, 30];
  if (years <= 40) return [10, 20, 30, 40];
  return [10, 20, 30, 40, 50];
}

/** Compute X-axis tick values: every 5 years */
export function computeXTicks(years: number): number[] {
  const ticks: number[] = [];
  for (let y = 0; y <= years; y += 5) {
    ticks.push(y);
  }
  return ticks;
}

export function fmtDuration(months: number): string {
  if (months < 12) return `${Math.round(months)} mo`;
  const years = months / 12;
  return years % 1 === 0 ? `${years} yr` : `${years.toFixed(1)} yr`;
}

export function fmtYears(years: number): string {
  if (years < 1) return `${Math.round(years * 12)} mo`;
  return years % 1 === 0 ? `${years} yr` : `${years.toFixed(1)} yr`;
}
