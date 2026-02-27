"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from "recharts";
import type { FinancialState } from "@/lib/financial-state";
import {
  projectFinances,
  downsamplePoints,
} from "@/lib/projections";
import type { Scenario, Milestone, GoalMilestone } from "@/lib/projections";

interface ProjectionChartProps {
  state: FinancialState;
}

function formatCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value.toFixed(0)}`;
}

function formatFullCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

const SCENARIO_LABELS: Record<Scenario, string> = {
  conservative: "Conservative",
  moderate: "Moderate",
  optimistic: "Optimistic",
};

const SCENARIO_COLORS: Record<Scenario, string> = {
  conservative: "#f59e0b",
  moderate: "#10b981",
  optimistic: "#3b82f6",
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: number;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const years = label ?? 0;
  const yearLabel = years === 1 ? "1 year" : `${years} years`;

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-3 shadow-lg">
      <p className="mb-1 text-xs font-medium text-stone-500">{yearLabel} from now</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {formatFullCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

export default function ProjectionChart({ state }: ProjectionChartProps) {
  const [years, setYears] = useState(10);
  const [scenario, setScenario] = useState<Scenario>("moderate");

  const projection = useMemo(
    () => projectFinances(state, years, scenario),
    [state, years, scenario]
  );

  const chartData = useMemo(() => {
    const sampled = downsamplePoints(projection.points);
    return sampled.map((p) => ({
      year: p.year,
      netWorth: p.netWorth,
      assets: p.totalAssets,
      debts: -p.totalDebts, // show as negative for visual clarity
    }));
  }, [projection]);

  const debtFreeYear = projection.debtFreeMonth !== null
    ? parseFloat((projection.debtFreeMonth / 12).toFixed(1))
    : null;

  const goalMarkers = projection.goalMilestones
    .filter((g): g is GoalMilestone & { monthReached: number } => g.monthReached !== null)
    .map((g) => ({
      name: g.goalName,
      year: parseFloat((g.monthReached / 12).toFixed(1)),
    }));

  const milestoneMarkers = projection.milestones.filter((m) => m.month > 0);

  // Find the net worth value at a given year for ReferenceDot
  function netWorthAtYear(targetYear: number): number {
    const closest = chartData.reduce((prev, curr) =>
      Math.abs(curr.year - targetYear) < Math.abs(prev.year - targetYear) ? curr : prev
    );
    return closest.netWorth;
  }

  return (
    <div
      className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6"
      data-testid="projection-chart"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-stone-800">
          Financial Projection
        </h3>
        <div className="flex items-center gap-2">
          {(Object.keys(SCENARIO_LABELS) as Scenario[]).map((s) => (
            <button
              key={s}
              onClick={() => setScenario(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 ${
                scenario === s
                  ? "text-white shadow-sm"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
              style={scenario === s ? { backgroundColor: SCENARIO_COLORS[s] } : undefined}
              data-testid={`scenario-${s}`}
            >
              {SCENARIO_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="mb-1 flex items-center justify-between text-xs text-stone-500">
          <span>Timeline</span>
          <span className="font-medium text-stone-700">
            {years} {years === 1 ? "year" : "years"}
          </span>
        </label>
        <input
          type="range"
          min={1}
          max={30}
          value={years}
          onChange={(e) => setYears(Number(e.target.value))}
          className="w-full cursor-pointer accent-emerald-500"
          data-testid="timeline-slider"
          aria-label="Projection timeline in years"
        />
        <div className="flex justify-between text-[10px] text-stone-400">
          <span>1yr</span>
          <span>10yr</span>
          <span>20yr</span>
          <span>30yr</span>
        </div>
      </div>

      <div className="h-64 sm:h-80" data-testid="projection-chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: "#78716c" }}
              tickFormatter={(v) => `${v}y`}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#78716c" }}
              tickFormatter={formatCurrency}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Net Worth line */}
            <Line
              type="monotone"
              dataKey="netWorth"
              name="Net Worth"
              stroke={SCENARIO_COLORS[scenario]}
              strokeWidth={2.5}
              dot={false}
              animationDuration={500}
            />

            {/* Assets line */}
            <Line
              type="monotone"
              dataKey="assets"
              name="Assets"
              stroke="#6366f1"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              animationDuration={500}
            />

            {/* Debts line (negative) */}
            <Line
              type="monotone"
              dataKey="debts"
              name="Debts"
              stroke="#ef4444"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              animationDuration={500}
            />

            {/* Debt-free reference line */}
            {debtFreeYear !== null && debtFreeYear <= years && (
              <ReferenceLine
                x={debtFreeYear}
                stroke="#10b981"
                strokeDasharray="6 3"
                label={{
                  value: "Debt Free",
                  position: "top",
                  fill: "#10b981",
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />
            )}

            {/* Goal markers */}
            {goalMarkers.map((g) => (
              <ReferenceDot
                key={g.name}
                x={g.year}
                y={netWorthAtYear(g.year)}
                r={5}
                fill="#f59e0b"
                stroke="#fff"
                strokeWidth={2}
              />
            ))}

            {/* Milestone markers */}
            {milestoneMarkers.map((m: Milestone) => (
              <ReferenceLine
                key={m.label}
                y={m.value}
                stroke="#d4d4d4"
                strokeDasharray="3 3"
                label={{
                  value: m.label,
                  position: "right",
                  fill: "#a8a29e",
                  fontSize: 10,
                }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & milestones summary */}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
        <span className="flex items-center gap-1">
          <span
            className="inline-block h-0.5 w-4 rounded"
            style={{ backgroundColor: SCENARIO_COLORS[scenario] }}
          />
          Net Worth
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-4 rounded border-t-2 border-dashed border-indigo-500" />
          Assets
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-4 rounded border-t-2 border-dashed border-red-500" />
          Debts
        </span>
        {goalMarkers.length > 0 && (
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
            Goal reached
          </span>
        )}
      </div>

      {/* Goal & milestone details */}
      {(goalMarkers.length > 0 || milestoneMarkers.length > 0 || debtFreeYear !== null) && (
        <div className="mt-3 space-y-1 border-t border-stone-100 pt-3">
          {debtFreeYear !== null && (
            <p className="text-xs text-emerald-600" data-testid="debt-free-label">
              🎉 Debt free in ~{debtFreeYear.toFixed(1)} years
            </p>
          )}
          {goalMarkers.map((g) => (
            <p key={g.name} className="text-xs text-amber-600" data-testid="goal-reached-label">
              🎯 &ldquo;{g.name}&rdquo; reached in ~{g.year.toFixed(1)} years
            </p>
          ))}
          {milestoneMarkers.map((m: Milestone) => (
            <p key={m.label} className="text-xs text-stone-500" data-testid="milestone-label">
              ⭐ {m.label} net worth in ~{(m.month / 12).toFixed(1)} years
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
