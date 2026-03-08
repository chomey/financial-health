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
import { getHomeCurrency, getEffectiveFxRates } from "@/lib/currency";
import { useCurrency } from "@/lib/CurrencyContext";
import {
  projectFinances,
  downsamplePoints,
  projectAssets,
  deflateProjectionPoints,
  computeFireNumber,
  findMonthAtTarget,
} from "@/lib/projections";
import type { Scenario, Milestone } from "@/lib/projections";
import { getInflationFromURL, updateInflationURL } from "@/lib/url-state";
import type { RunwayExplainerDetails } from "@/components/DataFlowArrows";
import { buildSummary } from "@/components/RunwayBurndownChart";

type ChartMode = "keep-earning" | "income-stops";

interface ProjectionChartProps {
  state: FinancialState;
  runwayDetails?: RunwayExplainerDetails;
  safeWithdrawalRate?: number;
}

// formatCurrency and formatFullCurrency defined inside components via useCurrency()

const SCENARIO_LABELS: Record<Scenario, string> = {
  conservative: "Conservative",
  moderate: "Moderate",
  optimistic: "Optimistic",
};

const SCENARIO_COLORS: Record<Scenario, string> = {
  conservative: "#f59e0b", // amber-400
  moderate: "#34d399",    // emerald-400
  optimistic: "#60a5fa",  // blue-400
};

const SCENARIO_DESCRIPTIONS: Record<Scenario, string> = {
  conservative: "30% below your entered returns — accounts for market downturns and lower growth",
  moderate: "Uses your entered ROI values as-is — expected returns based on your inputs",
  optimistic: "30% above your entered returns — best-case growth scenario",
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string; payload?: Record<string, unknown> }>;
  label?: number;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  const fmt = useCurrency();
  if (!active || !payload?.length) return null;

  const years = label ?? 0;
  const yearLabel = years === 1 ? "1 year" : `${years} years`;

  // Extract withdrawal tax drag from the data point (available via the first payload entry)
  const dataPoint = payload[0]?.payload;
  const withdrawalTaxDrag = typeof dataPoint?.withdrawalTaxDrag === "number" ? dataPoint.withdrawalTaxDrag : 0;

  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/90 p-3 shadow-lg backdrop-blur-sm">
      <p className="mb-1 text-xs font-medium text-slate-400">{yearLabel} from now</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {fmt.full(entry.value)}
        </p>
      ))}
      {withdrawalTaxDrag > 0 && (
        <p className="mt-1 text-xs text-amber-400" data-testid="tooltip-tax-drag">
          Withdrawal tax paid: {fmt.full(withdrawalTaxDrag)}
        </p>
      )}
    </div>
  );
}

const TABLE_MILESTONES = [10, 20, 30, 40, 50];

/** Compute X-axis tick values: every 5 years */
function computeXTicks(years: number): number[] {
  const ticks: number[] = [];
  for (let y = 0; y <= years; y += 5) {
    ticks.push(y);
  }
  return ticks;
}

function fmtDuration(months: number): string {
  if (months < 12) return `${Math.round(months)} mo`;
  const years = months / 12;
  return years % 1 === 0 ? `${years} yr` : `${years.toFixed(1)} yr`;
}

function fmtYears(years: number): string {
  if (years < 1) return `${Math.round(years * 12)} mo`;
  return years % 1 === 0 ? `${years} yr` : `${years.toFixed(1)} yr`;
}

function BurndownTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const yearVal = label ?? 0;
  const yearLabel = yearVal < 1 ? `${Math.round(yearVal * 12)} months` : yearVal === 1 ? "1 year" : `${Number(yearVal.toFixed(1))} years`;
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/90 p-3 shadow-lg backdrop-blur-sm">
      <p className="mb-1 text-xs font-medium text-slate-400">{yearLabel}</p>
      {payload.map((entry, i) => {
        const n = String(entry.name ?? "");
        const displayName = n === "withGrowth" ? "With growth" : n === "withoutGrowth" ? "Without growth" : n === "withTax" ? "After taxes" : n;
        return (
          <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
            {displayName}: ${Math.abs(entry.value).toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </p>
        );
      })}
    </div>
  );
}

/** Custom SVG label for vertical ReferenceLine — renders a pill below the top edge to prevent clipping */
function MilestoneLabelContent({
  viewBox,
  value,
  fill = "#10b981",
}: {
  viewBox?: { x: number; y: number; width: number; height: number };
  value?: string;
  fill?: string;
}) {
  if (!viewBox || !value) return null;
  const { x, y } = viewBox;
  const textWidth = value.length * 5.8 + 10;
  return (
    <g>
      <rect
        x={x + 3}
        y={y + 6}
        width={textWidth}
        height={15}
        rx={3}
        fill="#0f172a"
        fillOpacity={0.9}
        stroke={fill}
        strokeWidth={0.5}
        strokeOpacity={0.7}
      />
      <text x={x + 7} y={y + 17} fontSize={10} fill={fill} fontWeight={600}>
        {value}
      </text>
    </g>
  );
}

export default function ProjectionChart({ state, runwayDetails, safeWithdrawalRate = 4 }: ProjectionChartProps) {
  const fmt = useCurrency();
  const formatCurrency = (v: number) => fmt.compact(v);
  const formatTableCurrency = (v: number) => fmt.full(v);
  const [scenario, setScenario] = useState<Scenario>("moderate");
  const [legendOpen, setLegendOpen] = useState(false);
  const [mode, setMode] = useState<ChartMode>("keep-earning");
  const currencyCode = getHomeCurrency(state.country ?? "CA");

  // Inflation adjustment state — read from URL on mount
  const [inflationAdjusted, setInflationAdjusted] = useState(false);
  const [inflationRate, setInflationRate] = useState(2.5);
  const [inflationRateInput, setInflationRateInput] = useState("2.5");
  // Read URL params once on mount
  useState(() => {
    const { adjusted, rate } = getInflationFromURL();
    setInflationAdjusted(adjusted);
    setInflationRate(rate);
    setInflationRateInput(String(rate));
  });

  function handleInflationToggle(enabled: boolean) {
    setInflationAdjusted(enabled);
    updateInflationURL(enabled, inflationRate);
  }

  function handleInflationRateChange(val: string) {
    setInflationRateInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 20) {
      setInflationRate(parsed);
      updateInflationURL(inflationAdjusted, parsed);
    }
  }

  const years = 50;

  const projection = useMemo(
    () => projectFinances(state, 50, scenario),
    [state, scenario]
  );

  const displayPoints = useMemo(() => {
    if (!inflationAdjusted) return projection.points;
    return deflateProjectionPoints(projection.points, inflationRate / 100);
  }, [projection, inflationAdjusted, inflationRate]);

  const chartData = useMemo(() => {
    // Sample at whole-year intervals so tooltip snaps to integer years
    return displayPoints
      .filter((p) => p.month % 12 === 0)
      .map((p) => ({
        year: Math.round(p.month / 12),
        netWorth: p.netWorth,
        assets: p.totalAssets,
        debts: -p.totalDebts, // show as negative for visual clarity
        mortgage: -p.mortgageDebts, // show as negative like debts
        withdrawalTaxDrag: p.withdrawalTaxDrag ?? 0,
      }));
  }, [displayPoints]);

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

  // FIRE (Financial Independence, Retire Early) milestone
  const { monthlyExpenses: rawExpenses } = computeTotals(state);
  const fireNumber = computeFireNumber(rawExpenses, safeWithdrawalRate);
  const fireMonth = fireNumber > 0 ? findMonthAtTarget(projection.points, fireNumber) : null;
  const fireYear = fireMonth !== null ? parseFloat((fireMonth / 12).toFixed(1)) : null;
  const currentNetWorth = projection.points[0]?.netWorth ?? 0;
  const fireAlreadyReached = fireNumber > 0 && currentNetWorth >= fireNumber;

  const milestoneYears = TABLE_MILESTONES;

  // Summary table: milestone year points from 50-year projection (deflated if inflation enabled)
  const summaryPoints = useMemo(() => {
    const allPoints = displayPoints;
    const getAtYear = (y: number) => {
      const month = y * 12;
      const p = allPoints.find((pt) => pt.month === month);
      return p ?? allPoints[allPoints.length - 1];
    };
    return {
      current: allPoints[0],
      milestones: milestoneYears.map((y) => getAtYear(y)),
    };
  }, [displayPoints, milestoneYears]);

  // Per-asset projections always at 10/20/30 years (includes surplus allocation)
  const assetProjections = useMemo(() => {
    const totals = computeTotals(state);
    const surplus = totals.monthlyAfterTaxIncome - totals.monthlyExpenses - totals.totalMonthlyContributions;
    const homeCurrency = getHomeCurrency(state.country ?? "CA");
    const fxRates = getEffectiveFxRates(homeCurrency, state.fxManualOverride, state.fxRates);
    return projectAssets(state.assets, scenario, milestoneYears, surplus, homeCurrency, fxRates);
  }, [state, scenario, milestoneYears]);

  // Surplus subtitle
  const surplusInfo = useMemo(() => {
    const totals = computeTotals(state);
    const income = totals.monthlyAfterTaxIncome;
    const expenses = totals.monthlyExpenses;
    const contributions = totals.totalMonthlyContributions;
    const surplus = income - expenses - contributions;
    return { income, expenses, contributions, surplus };
  }, [state]);

  // Burndown chart data (only if runwayDetails is provided) — X-axis in years
  const burndownData = useMemo(() => {
    if (!runwayDetails) return null;
    const hasTaxDrag = (runwayDetails.taxDragMonths ?? 0) > 0;
    // Sample at whole-year intervals (every 12 months) so tooltip snaps to integer years
    const data: { year: number; withGrowth: number; withoutGrowth: number; withTax: number }[] = [];
    for (let yr = 0; yr <= 50; yr++) {
      const i = yr * 12;
      const gBal = i < runwayDetails.withGrowth.length ? Math.round(runwayDetails.withGrowth[i]?.totalBalance ?? 0) : 0;
      const nBal = i < runwayDetails.withoutGrowth.length ? Math.round(runwayDetails.withoutGrowth[i]?.totalBalance ?? 0) : 0;
      const tBal = i < runwayDetails.withTax.length ? Math.round(runwayDetails.withTax[i]?.totalBalance ?? 0) : 0;
      data.push({
        year: yr,
        withGrowth: gBal,
        withoutGrowth: nBal,
        withTax: tBal,
      });
    }

    // Zero-crossing years
    let growthZero: number | null = null;
    let noGrowthZero: number | null = null;
    let taxZero: number | null = null;
    for (const pt of data) {
      if (growthZero === null && pt.withGrowth <= 0) growthZero = pt.year;
      if (noGrowthZero === null && pt.withoutGrowth <= 0) noGrowthZero = pt.year;
      if (taxZero === null && pt.withTax <= 0) taxZero = pt.year;
    }

    const emergencyFund = runwayDetails.monthlyTotal * 6;

    return { data, growthZero, noGrowthZero, taxZero, emergencyFund, hasTaxDrag };
  }, [runwayDetails]);

  return (
    <section
      className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-3 sm:p-6"
      data-testid="projection-chart"
      aria-label="Financial projection"
    >
      <div className="mb-3 sm:mb-4 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <h3 className="text-lg font-semibold text-slate-200">
          Financial Projection
        </h3>
        {mode === "keep-earning" && (
          <div className="flex items-center gap-2">
            {(Object.keys(SCENARIO_LABELS) as Scenario[]).map((s) => (
              <button
                key={s}
                onClick={() => setScenario(s)}
                title={SCENARIO_DESCRIPTIONS[s]}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 ${
                  scenario === s
                    ? "text-slate-900 shadow-sm"
                    : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"
                }`}
                style={scenario === s ? { backgroundColor: SCENARIO_COLORS[s] } : undefined}
                data-testid={`scenario-${s}`}
              >
                {SCENARIO_LABELS[s]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mode tabs */}
      {runwayDetails && (
        <div className="mb-3 sm:mb-4 flex gap-1" data-testid="chart-mode-tabs">
          <button
            onClick={(e) => { e.stopPropagation(); setMode("keep-earning"); }}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
              mode === "keep-earning"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm"
                : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"
            }`}
            data-testid="mode-keep-earning"
          >
            Keep Earning
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setMode("income-stops"); }}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
              mode === "income-stops"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm"
                : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"
            }`}
            data-testid="mode-income-stops"
          >
            Income Stops
          </button>
        </div>
      )}

      {/* Inflation adjustment toggle — stopPropagation prevents ZoomableCard from opening */}
      <div className="mb-3 flex flex-wrap items-center gap-3" data-testid="inflation-controls" onClick={(e) => e.stopPropagation()}>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={inflationAdjusted}
            onChange={(e) => handleInflationToggle(e.target.checked)}
            className="h-3.5 w-3.5 cursor-pointer accent-emerald-400"
            data-testid="inflation-toggle"
            aria-label="Adjust for inflation"
          />
          Adjust for inflation
        </label>
        {inflationAdjusted && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <input
              type="number"
              min="0"
              max="20"
              step="0.1"
              value={inflationRateInput}
              onChange={(e) => handleInflationRateChange(e.target.value)}
              className="w-14 rounded border border-white/10 bg-slate-800 px-1.5 py-0.5 text-right text-xs text-slate-200 transition-colors focus:border-emerald-500/50 focus:outline-none"
              data-testid="inflation-rate-input"
              aria-label="Annual inflation rate"
            />
            <span>% / yr</span>
            <span
              className="ml-1 cursor-help text-slate-500"
              title={`Values shown in today's dollars, deflated by ${inflationRate}% per year`}
              data-testid="inflation-tooltip"
              aria-label={`In today's dollars, adjusted for ${inflationRate}% annual inflation`}
            >
              ⓘ
            </span>
            <span className="text-xs text-slate-500">
              (today&apos;s dollars)
            </span>
          </div>
        )}
      </div>

      {/* Surplus subtitle for Keep Earning mode */}
      {mode === "keep-earning" && surplusInfo.income > 0 && (
        <p className="mb-3 text-xs text-slate-500" data-testid="projection-surplus-subtitle">
          Income {formatCurrency(surplusInfo.income)} − Expenses {formatCurrency(surplusInfo.expenses)}{surplusInfo.contributions > 0 ? ` − Contributions ${formatCurrency(surplusInfo.contributions)}` : ""} = <span className={surplusInfo.surplus >= 0 ? "font-medium text-emerald-400" : "font-medium text-red-400"}>{formatCurrency(surplusInfo.surplus)}</span> surplus/mo
        </p>
      )}

      {mode === "keep-earning" && (<>
      {/* Summary table: dynamic milestone year projections */}
      <div className="mb-3 sm:mb-4" data-testid="projection-summary-table">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10">
                <th className="pb-1.5 pr-4 text-left font-medium text-slate-500">Metric</th>
                <th className="pb-1.5 px-2 text-right font-medium text-slate-500">Now</th>
                {milestoneYears.map((y, i) => (
                  <th key={y} className={`pb-1.5 ${i === milestoneYears.length - 1 ? "pl-2" : "px-2"} text-right font-medium text-slate-500`}>
                    {y}yr
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr>
                <td className="py-1.5 pr-4 font-medium text-slate-300">Net Worth</td>
                <td className="py-1.5 px-2 text-right text-slate-400">{formatTableCurrency(summaryPoints.current.netWorth)}</td>
                {summaryPoints.milestones.map((p, i) => (
                  <td key={milestoneYears[i]} className={`py-1.5 ${i === milestoneYears.length - 1 ? "pl-2" : "px-2"} text-right text-emerald-400 font-medium`}>
                    {formatTableCurrency(p.netWorth)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-1.5 pr-4 font-medium text-slate-300">Total Assets</td>
                <td className="py-1.5 px-2 text-right text-slate-400">{formatTableCurrency(summaryPoints.current.totalAssets)}</td>
                {summaryPoints.milestones.map((p, i) => (
                  <td key={milestoneYears[i]} className={`py-1.5 ${i === milestoneYears.length - 1 ? "pl-2" : "px-2"} text-right text-blue-400`}>
                    {formatTableCurrency(p.totalAssets)}
                  </td>
                ))}
              </tr>
              {hasBothDebtTypes ? (
                <>
                  <tr>
                    <td className="py-1.5 pr-4 font-medium text-slate-300">Consumer Debt</td>
                    <td className="py-1.5 px-2 text-right text-slate-400">{formatTableCurrency(summaryPoints.current.consumerDebts)}</td>
                    {summaryPoints.milestones.map((p, i) => (
                      <td key={milestoneYears[i]} className={`py-1.5 ${i === milestoneYears.length - 1 ? "pl-2" : "px-2"} text-right text-red-400`}>
                        {formatTableCurrency(p.consumerDebts)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 font-medium text-slate-300">Mortgage</td>
                    <td className="py-1.5 px-2 text-right text-slate-400">{formatTableCurrency(summaryPoints.current.mortgageDebts)}</td>
                    {summaryPoints.milestones.map((p, i) => (
                      <td key={milestoneYears[i]} className={`py-1.5 ${i === milestoneYears.length - 1 ? "pl-2" : "px-2"} text-right text-red-400`}>
                        {formatTableCurrency(p.mortgageDebts)}
                      </td>
                    ))}
                  </tr>
                </>
              ) : (
                <tr>
                  <td className="py-1.5 pr-4 font-medium text-slate-300">Total Debts</td>
                  <td className="py-1.5 px-2 text-right text-slate-400">{formatTableCurrency(summaryPoints.current.totalDebts)}</td>
                  {summaryPoints.milestones.map((p, i) => (
                    <td key={milestoneYears[i]} className={`py-1.5 ${i === milestoneYears.length - 1 ? "pl-2" : "px-2"} text-right text-red-400`}>
                      {formatTableCurrency(p.totalDebts)}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="h-64 sm:h-80" data-testid="projection-chart-container">
        <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="year"
              type="number"
              domain={[0, 50]}
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickFormatter={(v) => `${v}y`}
              ticks={xTicks}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickFormatter={formatCurrency}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Net Worth line — glowing */}
            <Line
              type="monotone"
              dataKey="netWorth"
              name="Net Worth"
              stroke={SCENARIO_COLORS[scenario]}
              strokeWidth={2.5}
              dot={false}
              animationDuration={500}
              style={{ filter: `drop-shadow(0 0 6px ${SCENARIO_COLORS[scenario]})` }}
            />

            {/* Assets line */}
            <Line
              type="monotone"
              dataKey="assets"
              name="Assets"
              stroke="#818cf8"
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
              stroke="#f87171"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              animationDuration={500}
            />

            {/* Mortgage burndown line (negative, dashed orange) */}
            {hasMortgage && (
              <Line
                type="monotone"
                dataKey="mortgage"
                name="Mortgage"
                stroke="#fb923c"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                dot={false}
                animationDuration={500}
              />
            )}

            {/* Debt-free reference lines — split consumer vs mortgage when both exist */}
            {hasBothDebtTypes ? (
              <>
                {consumerDebtFreeYear !== null && consumerDebtFreeYear <= years && consumerDebtFreeYear > 0 && (
                  <ReferenceLine
                    x={consumerDebtFreeYear}
                    stroke="#10b981"
                    strokeDasharray="6 3"
                    label={<MilestoneLabelContent value="Consumer Debt Free" fill="#10b981" />}
                  />
                )}
                {mortgageFreeYear !== null && mortgageFreeYear <= years && mortgageFreeYear > 0 && (
                  <ReferenceLine
                    x={mortgageFreeYear}
                    stroke="#059669"
                    strokeDasharray="6 3"
                    label={<MilestoneLabelContent value="Mortgage Free" fill="#059669" />}
                  />
                )}
              </>
            ) : (
              debtFreeYear !== null && debtFreeYear <= years && debtFreeYear > 0 && (
                <ReferenceLine
                  x={debtFreeYear}
                  stroke="#10b981"
                  strokeDasharray="6 3"
                  label={<MilestoneLabelContent value="Debt Free" fill="#10b981" />}
                />
              )
            )}

            {/* FIRE number reference line */}
            {fireNumber > 0 && (
              <ReferenceLine
                y={fireNumber}
                stroke="#f59e0b"
                strokeDasharray="4 3"
                strokeWidth={1.5}
                label={{
                  value: `🔥 FIRE: ${formatCurrency(fireNumber)}`,
                  position: "right",
                  fill: "#f59e0b",
                  fontSize: 10,
                }}
              />
            )}

            {/* Milestone markers */}
            {milestoneMarkers.map((m: Milestone) => (
              <ReferenceLine
                key={m.label}
                y={m.value}
                stroke="rgba(255,255,255,0.15)"
                strokeDasharray="3 3"
                label={{
                  value: m.label,
                  position: "right",
                  fill: "#64748b",
                  fontSize: 10,
                }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & milestones summary */}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <span
            className="inline-block h-0.5 w-4 rounded"
            style={{ backgroundColor: SCENARIO_COLORS[scenario] }}
          />
          Net Worth
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-4 rounded border-t-2 border-dashed border-indigo-400" />
          Assets
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-4 rounded border-t-2 border-dashed border-red-400" />
          Debts
        </span>
        {hasMortgage && (
          <span className="flex items-center gap-1" data-testid="mortgage-burndown-legend">
            <span className="inline-block h-0.5 w-4 rounded border-t-2 border-dashed border-orange-400" />
            Mortgage
          </span>
        )}
      </div>

      {/* Scenario legend */}
      <div className="mt-3 border-t border-white/10 pt-3" data-testid="scenario-legend">
        <button
          onClick={() => setLegendOpen(!legendOpen)}
          className="flex w-full items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors duration-200 hover:text-slate-300"
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
                <p className="text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">{SCENARIO_LABELS[s]}</span>
                  {" — "}
                  {SCENARIO_DESCRIPTIONS[s]}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FIRE milestone callout */}
      {fireNumber > 0 && (
        <div className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2" data-testid="fire-milestone">
          {fireAlreadyReached ? (
            <p className="text-xs font-medium text-amber-400">
              🎉 You&apos;ve already reached your FIRE number of {fmt.compact(fireNumber)}! Financial independence achieved.
            </p>
          ) : fireYear !== null ? (
            <p className="text-xs font-medium text-amber-400" data-testid="fire-year">
              🔥 FIRE number: {fmt.compact(fireNumber)} ({safeWithdrawalRate}% rule) — projected in ~{fmtYears(fireYear)}
            </p>
          ) : (
            <p className="text-xs font-medium text-amber-400">
              🔥 FIRE number: {fmt.compact(fireNumber)} ({safeWithdrawalRate}% rule) — not reached within 50 years at current rate
            </p>
          )}
        </div>
      )}

      {/* Milestone details */}
      {(milestoneMarkers.length > 0 || debtFreeYear !== null) && (
        <div className="mt-3 space-y-1 border-t border-white/10 pt-3">
          {hasBothDebtTypes ? (
            <>
              {consumerDebtFreeYear !== null && consumerDebtFreeYear > 0 && (
                <p className="text-xs text-emerald-400" data-testid="consumer-debt-free-label">
                  🎉 Consumer debt free in ~{consumerDebtFreeYear.toFixed(1)} years
                </p>
              )}
              {mortgageFreeYear !== null && mortgageFreeYear > 0 && (
                <p className="text-xs text-emerald-400" data-testid="mortgage-free-label">
                  🏠 Mortgage free in ~{mortgageFreeYear.toFixed(1)} years
                </p>
              )}
            </>
          ) : (
            debtFreeYear !== null && debtFreeYear > 0 && (
              <p className="text-xs text-emerald-400" data-testid="debt-free-label">
                🎉 Debt free in ~{debtFreeYear.toFixed(1)} years
              </p>
            )
          )}
          {milestoneMarkers.map((m: Milestone) => (
            <p key={m.label} className="text-xs text-slate-500" data-testid="milestone-label">
              ⭐ {m.label} net worth in ~{(m.month / 12).toFixed(1)} years
            </p>
          ))}
        </div>
      )}

      {/* Per-asset projections with dynamic milestones */}
      {assetProjections.length > 0 && (
        <div className="mt-4 border-t border-white/10 pt-4" data-testid="asset-projections-table">
          <h4 className="mb-2 text-sm font-semibold text-slate-300">Asset Growth Projections</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="pb-1.5 pr-4 text-left font-medium text-slate-500">Account</th>
                  <th className="pb-1.5 px-2 text-right font-medium text-slate-500">Now</th>
                  {milestoneYears.map((y, i) => (
                    <th key={y} className={`pb-1.5 ${i === milestoneYears.length - 1 ? "pl-2" : "px-2"} text-right font-medium text-slate-500`}>
                      {y}yr
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {assetProjections.map((ap) => (
                  <tr key={ap.category}>
                    <td className="py-1.5 pr-4 font-medium text-slate-300 truncate max-w-[120px]">{ap.category}</td>
                    <td className="py-1.5 px-2 text-right text-slate-400">{formatTableCurrency(ap.currentValue)}</td>
                    {ap.milestoneValues.map((val, i) => (
                      <td key={milestoneYears[i]} className={`py-1.5 ${i === milestoneYears.length - 1 ? "pl-2" : "px-2"} text-right text-emerald-400`}>
                        {formatTableCurrency(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </>)}

      {/* Income Stops (Burndown) mode */}
      {mode === "income-stops" && runwayDetails && burndownData && burndownData.data.length > 1 && (
        <>
          {/* Plain-English summary */}
          <p className="mb-4 text-sm text-slate-400" data-testid="burndown-summary">{buildSummary(runwayDetails)}</p>

          {/* Legend */}
          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" data-testid="burndown-legend">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-4 rounded bg-emerald-400" style={{ height: 2 }} />
              <span className="text-slate-400">With investment growth</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-4 rounded" style={{ height: 2, borderTop: "2px dashed #64748b", background: "none" }} />
              <span className="text-slate-400">Without growth</span>
            </span>
            {burndownData.hasTaxDrag && (
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-4 rounded bg-amber-400" style={{ height: 2 }} />
                <span className="text-slate-400">After withdrawal taxes</span>
              </span>
            )}
          </div>

          <div className="h-72 sm:h-80 w-full" data-testid="burndown-chart-container">
            <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
              <LineChart data={burndownData.data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="year"
                  type="number"
                  domain={[0, 50]}
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickFormatter={(v) => `${v}y`}
                  ticks={xTicks}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickFormatter={formatCurrency}
                  width={55}
                />
                <Tooltip content={<BurndownTooltip />} />

                {/* 6-month emergency fund */}
                {burndownData.emergencyFund > 0 && (
                  <ReferenceLine
                    y={burndownData.emergencyFund}
                    stroke="rgba(255,255,255,0.15)"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                    label={{ value: "6-mo emergency fund", position: "right", fontSize: 10, fill: "#64748b" }}
                  />
                )}

                {/* Zero-crossing markers */}
                {burndownData.noGrowthZero !== null && (
                  <ReferenceLine x={burndownData.noGrowthZero} stroke="#64748b" strokeDasharray="3 3" strokeWidth={1}
                    label={{ value: fmtYears(burndownData.noGrowthZero), position: "top", fontSize: 10, fill: "#94a3b8" }} />
                )}
                {burndownData.growthZero !== null && burndownData.growthZero !== burndownData.noGrowthZero && (
                  <ReferenceLine x={burndownData.growthZero} stroke="#34d399" strokeDasharray="3 3" strokeWidth={1}
                    label={{ value: fmtYears(burndownData.growthZero), position: "top", fontSize: 10, fill: "#34d399" }} />
                )}
                {burndownData.taxZero !== null && burndownData.taxZero !== burndownData.growthZero && burndownData.taxZero !== burndownData.noGrowthZero && (
                  <ReferenceLine x={burndownData.taxZero} stroke="#f59e0b" strokeDasharray="3 3" strokeWidth={1}
                    label={{ value: fmtYears(burndownData.taxZero), position: "top", fontSize: 10, fill: "#f59e0b" }} />
                )}

                <Line type="monotone" dataKey="withGrowth" stroke="#34d399" strokeWidth={2.5} dot={false} name="withGrowth"
                  style={{ filter: "drop-shadow(0 0 5px #34d399)" }} />
                <Line type="monotone" dataKey="withoutGrowth" stroke="#64748b" strokeWidth={2} strokeDasharray="6 3" dot={false} name="withoutGrowth" />
                {burndownData.hasTaxDrag && (
                  <Line type="monotone" dataKey="withTax" stroke="#f59e0b" strokeWidth={2} dot={false} name="withTax" />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Starting balances */}
          {runwayDetails.withGrowth[0] && (
            <div className="mt-3 flex flex-wrap items-center gap-x-1 text-xs text-slate-500" data-testid="burndown-starting-balances">
              <span className="font-medium text-slate-400">Starting:</span>
              {runwayDetails.categories
                .map(cat => ({ category: cat, balance: runwayDetails.withGrowth[0]?.balances[cat] ?? 0 }))
                .filter(b => b.balance > 0)
                .map((b, i, arr) => (
                  <span key={b.category}>
                    {b.category} ${Math.abs(b.balance).toLocaleString("en-US", { maximumFractionDigits: 0 })}{i < arr.length - 1 ? " ·" : ""}
                  </span>
                ))}
            </div>
          )}

          {/* Withdrawal order */}
          {runwayDetails.withdrawalOrder.length > 0 && (
            <div className="mt-4" data-testid="burndown-withdrawal-order">
              <p className="mb-2 text-xs font-medium text-slate-500 uppercase tracking-wide">Suggested Withdrawal Order</p>
              <div className="flex flex-wrap gap-2">
                {runwayDetails.withdrawalOrder.map((entry, i) => {
                  const treatmentLabel = entry.taxTreatment === "tax-free" ? "tax-free"
                    : entry.taxTreatment === "tax-deferred" ? "taxed as income"
                    : "capital gains";
                  return (
                    <span key={i} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-700/40 border border-white/5 px-2.5 py-1.5 text-xs" data-testid={`burndown-withdrawal-${i}`}>
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-600 text-[10px] font-bold text-slate-200">{i + 1}</span>
                      <span className="max-w-[150px] truncate text-slate-200 font-medium">{entry.category}</span>
                      <span className="text-slate-500">({treatmentLabel})</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
