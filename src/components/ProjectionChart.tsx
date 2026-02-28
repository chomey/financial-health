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
} from "recharts";
import { computeTotals, type FinancialState } from "@/lib/financial-state";
import {
  projectFinances,
  downsamplePoints,
  projectAssets,
} from "@/lib/projections";
import type { Scenario, Milestone } from "@/lib/projections";

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

const SCENARIO_DESCRIPTIONS: Record<Scenario, string> = {
  conservative: "30% below your entered returns — accounts for market downturns and lower growth",
  moderate: "Uses your entered ROI values as-is — expected returns based on your inputs",
  optimistic: "30% above your entered returns — best-case growth scenario",
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

const TIMELINE_OPTIONS = [10, 20, 30] as const;
const TABLE_MILESTONES = [10, 20, 30];

/** Compute X-axis tick values: every year */
function computeXTicks(years: number): number[] {
  const ticks: number[] = [];
  for (let y = 0; y <= years; y += 1) {
    ticks.push(y);
  }
  return ticks;
}

export default function ProjectionChart({ state }: ProjectionChartProps) {
  const [years, setYears] = useState<number>(10);
  const [scenario, setScenario] = useState<Scenario>("moderate");
  const [legendOpen, setLegendOpen] = useState(false);

  // Always project 30 years for the summary table; chart uses selected timeline
  const fullProjection = useMemo(
    () => projectFinances(state, 30, scenario),
    [state, scenario]
  );

  const projection = useMemo(
    () => years === 30 ? fullProjection : projectFinances(state, years, scenario),
    [state, years, scenario, fullProjection]
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

  const xTicks = useMemo(() => computeXTicks(years), [years]);

  const debtFreeYear = projection.debtFreeMonth !== null
    ? parseFloat((projection.debtFreeMonth / 12).toFixed(1))
    : null;

  const consumerDebtFreeYear = projection.consumerDebtFreeMonth !== null
    ? parseFloat((projection.consumerDebtFreeMonth / 12).toFixed(1))
    : null;

  const mortgageFreeYear = projection.mortgageFreeMonth !== null
    ? parseFloat((projection.mortgageFreeMonth / 12).toFixed(1))
    : null;

  // Has both consumer debt and mortgages?
  const hasConsumerDebt = state.debts.some((d) => d.amount > 0);
  const hasMortgage = state.properties.some((p) => p.mortgage > 0);
  const hasBothDebtTypes = hasConsumerDebt && hasMortgage;

  const milestoneMarkers = projection.milestones.filter((m) => m.month > 0);

  const milestoneYears = TABLE_MILESTONES;

  // Summary table: always 10/20/30 year points from full 30-year projection
  const summaryPoints = useMemo(() => {
    const allPoints = fullProjection.points;
    const getAtYear = (y: number) => {
      const month = y * 12;
      const p = allPoints.find((pt) => pt.month === month);
      return p ?? allPoints[allPoints.length - 1];
    };
    return {
      current: allPoints[0],
      milestones: milestoneYears.map((y) => getAtYear(y)),
    };
  }, [fullProjection, milestoneYears]);

  // Per-asset projections always at 10/20/30 years (includes surplus allocation)
  const assetProjections = useMemo(() => {
    const totals = computeTotals(state);
    const surplus = totals.monthlyAfterTaxIncome - totals.monthlyExpenses - totals.totalMonthlyContributions;
    return projectAssets(state.assets, scenario, milestoneYears, surplus);
  }, [state, scenario, milestoneYears]);

  return (
    <section
      className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6"
      data-testid="projection-chart"
      aria-label="Financial projection"
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
              title={SCENARIO_DESCRIPTIONS[s]}
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

      <div className="mb-4 flex items-center gap-2">
        <span className="text-xs text-stone-500">Timeline</span>
        {TIMELINE_OPTIONS.map((y) => (
          <button
            key={y}
            onClick={() => setYears(y)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 ${
              years === y
                ? "bg-stone-800 text-white shadow-sm"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
            data-testid={`timeline-${y}yr`}
            aria-label={`${y} year timeline`}
          >
            {y}yr
          </button>
        ))}
      </div>

      <div className="h-64 sm:h-80" data-testid="projection-chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: "#78716c" }}
              tickFormatter={(v) => `${v}y`}
              ticks={xTicks}
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

            {/* Debt-free reference lines — split consumer vs mortgage when both exist */}
            {hasBothDebtTypes ? (
              <>
                {consumerDebtFreeYear !== null && consumerDebtFreeYear <= years && consumerDebtFreeYear > 0 && (
                  <ReferenceLine
                    x={consumerDebtFreeYear}
                    stroke="#10b981"
                    strokeDasharray="6 3"
                    label={{
                      value: "Consumer Debt Free",
                      position: "top",
                      fill: "#10b981",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  />
                )}
                {mortgageFreeYear !== null && mortgageFreeYear <= years && mortgageFreeYear > 0 && (
                  <ReferenceLine
                    x={mortgageFreeYear}
                    stroke="#059669"
                    strokeDasharray="6 3"
                    label={{
                      value: "Mortgage Free",
                      position: "top",
                      fill: "#059669",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  />
                )}
              </>
            ) : (
              debtFreeYear !== null && debtFreeYear <= years && debtFreeYear > 0 && (
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
              )
            )}

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
      </div>

      {/* Scenario legend */}
      <div className="mt-3 border-t border-stone-100 pt-3" data-testid="scenario-legend">
        <button
          onClick={() => setLegendOpen(!legendOpen)}
          className="flex w-full items-center gap-1.5 text-xs font-medium text-stone-500 transition-colors duration-200 hover:text-stone-700"
          data-testid="scenario-legend-toggle"
          aria-expanded={legendOpen}
        >
          <svg
            className={`h-3 w-3 transition-transform duration-200 ${legendOpen ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          What do the scenarios mean?
        </button>
        {legendOpen && (
          <div className="mt-2 space-y-2" data-testid="scenario-legend-content">
            {(Object.keys(SCENARIO_LABELS) as Scenario[]).map((s) => (
              <div key={s} className="flex items-start gap-2">
                <span
                  className="mt-1.5 inline-block h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: SCENARIO_COLORS[s] }}
                />
                <p className="text-xs text-stone-600">
                  <span className="font-semibold">{SCENARIO_LABELS[s]}</span>
                  {" — "}
                  {SCENARIO_DESCRIPTIONS[s]}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Milestone details */}
      {(milestoneMarkers.length > 0 || debtFreeYear !== null) && (
        <div className="mt-3 space-y-1 border-t border-stone-100 pt-3">
          {hasBothDebtTypes ? (
            <>
              {consumerDebtFreeYear !== null && consumerDebtFreeYear > 0 && (
                <p className="text-xs text-emerald-600" data-testid="consumer-debt-free-label">
                  🎉 Consumer debt free in ~{consumerDebtFreeYear.toFixed(1)} years
                </p>
              )}
              {mortgageFreeYear !== null && mortgageFreeYear > 0 && (
                <p className="text-xs text-emerald-700" data-testid="mortgage-free-label">
                  🏠 Mortgage free in ~{mortgageFreeYear.toFixed(1)} years
                </p>
              )}
            </>
          ) : (
            debtFreeYear !== null && debtFreeYear > 0 && (
              <p className="text-xs text-emerald-600" data-testid="debt-free-label">
                🎉 Debt free in ~{debtFreeYear.toFixed(1)} years
              </p>
            )
          )}
          {milestoneMarkers.map((m: Milestone) => (
            <p key={m.label} className="text-xs text-stone-500" data-testid="milestone-label">
              ⭐ {m.label} net worth in ~{(m.month / 12).toFixed(1)} years
            </p>
          ))}
        </div>
      )}

      {/* Summary table: dynamic milestone year projections */}
      <div className="mt-4 border-t border-stone-100 pt-4" data-testid="projection-summary-table">
        <h4 className="mb-2 text-sm font-semibold text-stone-700">Projection Summary</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-stone-200">
                <th className="pb-1.5 pr-4 text-left font-medium text-stone-500">Metric</th>
                <th className="pb-1.5 px-2 text-right font-medium text-stone-500">Now</th>
                {milestoneYears.map((y, i) => (
                  <th key={y} className={`pb-1.5 ${i === milestoneYears.length - 1 ? "pl-2" : "px-2"} text-right font-medium text-stone-500`}>
                    {y}yr
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              <tr>
                <td className="py-1.5 pr-4 font-medium text-stone-700">Net Worth</td>
                <td className="py-1.5 px-2 text-right text-stone-600">{formatCurrency(summaryPoints.current.netWorth)}</td>
                {summaryPoints.milestones.map((p, i) => (
                  <td key={milestoneYears[i]} className={`py-1.5 ${i === milestoneYears.length - 1 ? "pl-2" : "px-2"} text-right text-green-600 font-medium`}>
                    {formatCurrency(p.netWorth)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-1.5 pr-4 font-medium text-stone-700">Total Assets</td>
                <td className="py-1.5 px-2 text-right text-stone-600">{formatCurrency(summaryPoints.current.totalAssets)}</td>
                {summaryPoints.milestones.map((p, i) => (
                  <td key={milestoneYears[i]} className={`py-1.5 ${i === milestoneYears.length - 1 ? "pl-2" : "px-2"} text-right text-indigo-600`}>
                    {formatCurrency(p.totalAssets)}
                  </td>
                ))}
              </tr>
              {/* Split debts: consumer vs mortgage when both exist */}
              {hasBothDebtTypes ? (
                <>
                  <tr>
                    <td className="py-1.5 pr-4 font-medium text-stone-700">Consumer Debt</td>
                    <td className="py-1.5 px-2 text-right text-stone-600">{formatCurrency(summaryPoints.current.consumerDebts)}</td>
                    {summaryPoints.milestones.map((p, i) => (
                      <td key={milestoneYears[i]} className={`py-1.5 ${i === milestoneYears.length - 1 ? "pl-2" : "px-2"} text-right text-red-500`}>
                        {formatCurrency(p.consumerDebts)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 font-medium text-stone-700">Mortgage</td>
                    <td className="py-1.5 px-2 text-right text-stone-600">{formatCurrency(summaryPoints.current.mortgageDebts)}</td>
                    {summaryPoints.milestones.map((p, i) => (
                      <td key={milestoneYears[i]} className={`py-1.5 ${i === milestoneYears.length - 1 ? "pl-2" : "px-2"} text-right text-red-500`}>
                        {formatCurrency(p.mortgageDebts)}
                      </td>
                    ))}
                  </tr>
                </>
              ) : (
                <tr>
                  <td className="py-1.5 pr-4 font-medium text-stone-700">Total Debts</td>
                  <td className="py-1.5 px-2 text-right text-stone-600">{formatCurrency(summaryPoints.current.totalDebts)}</td>
                  {summaryPoints.milestones.map((p, i) => (
                    <td key={milestoneYears[i]} className={`py-1.5 ${i === milestoneYears.length - 1 ? "pl-2" : "px-2"} text-right text-red-500`}>
                      {formatCurrency(p.totalDebts)}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-asset projections with dynamic milestones */}
      {assetProjections.length > 0 && (
        <div className="mt-4 border-t border-stone-100 pt-4" data-testid="asset-projections-table">
          <h4 className="mb-2 text-sm font-semibold text-stone-700">Asset Growth Projections</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="pb-1.5 pr-4 text-left font-medium text-stone-500">Account</th>
                  <th className="pb-1.5 px-2 text-right font-medium text-stone-500">Now</th>
                  {milestoneYears.map((y, i) => (
                    <th key={y} className={`pb-1.5 ${i === milestoneYears.length - 1 ? "pl-2" : "px-2"} text-right font-medium text-stone-500`}>
                      {y}yr
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {assetProjections.map((ap) => (
                  <tr key={ap.category}>
                    <td className="py-1.5 pr-4 font-medium text-stone-700 truncate max-w-[120px]">{ap.category}</td>
                    <td className="py-1.5 px-2 text-right text-stone-600">{formatCurrency(ap.currentValue)}</td>
                    {ap.milestoneValues.map((val, i) => (
                      <td key={milestoneYears[i]} className={`py-1.5 ${i === milestoneYears.length - 1 ? "pl-2" : "px-2"} text-right text-green-600`}>
                        {formatCurrency(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
