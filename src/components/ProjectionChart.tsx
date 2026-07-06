"use client";

import { useState, useMemo, useEffect, useRef } from "react";
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
import { getInflationFromURL, updateInflationURL, getOutlookYearsFromURL, updateOutlookYearsURL, OUTLOOK_YEAR_OPTIONS, type OutlookYears } from "@/lib/url-state";
import { CHART_AXIS_TICK, CHART_GRID, CHART_SEMANTIC, CHART_SERIES } from "@/lib/chart-theme";
import type { RunwayExplainerDetails } from "@/components/DataFlowArrows";
import { buildSummary } from "@/components/RunwayBurndownChart";
import {
  type ChartMode,
  type ProjectionChartProps,
  type ProjectionMilestone,
  SCENARIO_LABELS,
  SCENARIO_COLORS,
  SCENARIO_DESCRIPTIONS,
  computeTableMilestones,
  computeXTicks,
  fmtYears,
} from "@/components/projection/ProjectionUtils";
import {
  CustomTooltip,
  BurndownTooltip,
  MilestoneLabelContent,
} from "@/components/projection/ProjectionTooltips";
import HelpTip from "@/components/HelpTip";
import { useOptionalModeContext } from "@/lib/ModeContext";

export default function ProjectionChart({ state, runwayDetails, safeWithdrawalRate = 4, onOutlookChange, onMilestonesChange }: ProjectionChartProps) {
  const fmt = useCurrency();
  const formatCurrency = (v: number) => fmt.compact(v);
  const formatTableCurrency = (v: number) => fmt.full(v);
  const { mode: appMode } = useOptionalModeContext();
  const [scenario, setScenario] = useState<Scenario>("moderate");
  const [legendOpen, setLegendOpen] = useState(false);
  const [mode, setMode] = useState<ChartMode>("keep-earning");
  const currencyCode = getHomeCurrency(state.country ?? "CA");

  // In simple mode, lock scenario to "moderate"
  useEffect(() => {
    if (appMode === "simple") setScenario("moderate");
  }, [appMode]);

  // Outlook years state — read from URL on mount
  const [outlookYears, setOutlookYears] = useState<OutlookYears>(10);
  useState(() => {
    setOutlookYears(getOutlookYearsFromURL());
  });
  function handleOutlookChange(yrs: OutlookYears) {
    setOutlookYears(yrs);
    updateOutlookYearsURL(yrs);
    onOutlookChange?.(yrs);
  }

  // Inflation adjustment state — read from URL on mount
  const [inflationAdjusted, setInflationAdjusted] = useState(false);
  const [inflationRate, setInflationRate] = useState(2.5);
  const [inflationRateInput, setInflationRateInput] = useState("2.5");
  // Read URL params once on mount (useEffect to avoid SSR/client mismatch)
  useEffect(() => {
    const { adjusted, rate } = getInflationFromURL();
    setInflationAdjusted(adjusted);
    setInflationRate(rate);
    setInflationRateInput(String(rate));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const years = outlookYears;

  const projection = useMemo(
    () => projectFinances(state, years, scenario),
    [state, years, scenario]
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

  // Report milestones to parent for display in InsightsPanel
  // Build milestones as a stable memo, then report via ref to avoid infinite re-render loops
  const milestoneItems = useMemo(() => {
    const items: ProjectionMilestone[] = [];
    if (fireNumber > 0) {
      if (fireAlreadyReached) {
        items.push({ icon: "🎉", text: `FIRE number ${formatCurrency(fireNumber)} reached — financial independence achieved`, color: "amber" });
      } else if (fireYear !== null) {
        items.push({ icon: "🔥", text: `FIRE ${formatCurrency(fireNumber)} (${safeWithdrawalRate}% rule) — ~${fmtYears(fireYear)}`, color: "amber" });
      }
    }
    if (hasBothDebtTypes) {
      if (consumerDebtFreeYear !== null && consumerDebtFreeYear > 0)
        items.push({ icon: "🎉", text: `Consumer debt free in ~${consumerDebtFreeYear.toFixed(1)} years`, color: "emerald" });
      if (mortgageFreeYear !== null && mortgageFreeYear > 0)
        items.push({ icon: "🏠", text: `Mortgage free in ~${mortgageFreeYear.toFixed(1)} years`, color: "emerald" });
    } else if (debtFreeYear !== null && debtFreeYear > 0) {
      items.push({ icon: "🎉", text: `Debt free in ~${debtFreeYear.toFixed(1)} years`, color: "emerald" });
    }
    for (const m of projection.milestones) {
      if (m.month > 0) items.push({ icon: "⭐", text: `${m.label} net worth in ~${(m.month / 12).toFixed(1)} years`, color: "slate" });
    }
    return items;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fireNumber, fireAlreadyReached, fireYear, debtFreeYear, consumerDebtFreeYear, mortgageFreeYear, hasBothDebtTypes, projection.milestones, safeWithdrawalRate]);

  const prevMilestoneKey = useRef("");
  useEffect(() => {
    if (!onMilestonesChange) return;
    const key = milestoneItems.map((m) => m.text).join("|");
    if (key !== prevMilestoneKey.current) {
      prevMilestoneKey.current = key;
      onMilestonesChange(milestoneItems);
    }
  }, [milestoneItems, onMilestonesChange]);

  const milestoneYears = useMemo(() => computeTableMilestones(years), [years]);

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
    const expenses = totals.monthlyExpenses + totals.totalMortgagePayments + totals.totalDebtPayments;
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
    for (let yr = 0; yr <= years; yr++) {
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
  }, [runwayDetails, years]);

  return (
    <section
      className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-2)] p-5 backdrop-blur-sm"
      data-testid="projection-chart"
      aria-label="Financial projection"
    >
      <div className="mb-3 sm:mb-4 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
            Financial Projection
          </h3>
          <HelpTip text="Moderate scenario uses your entered ROI values as-is. Conservative is 30% lower, Optimistic 30% higher. Toggle inflation adjustment to see real (purchasing-power) values." />
        </div>
        {mode === "keep-earning" && appMode !== "simple" && (
          <div className="flex items-center gap-2">
            {(Object.keys(SCENARIO_LABELS) as Scenario[]).map((s) => (
              <button
                key={s}
                onClick={() => setScenario(s)}
                title={SCENARIO_DESCRIPTIONS[s]}
                className={`focus-ring rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150 ${
                  scenario === s
                    ? "text-slate-900 shadow-sm"
                    : "bg-[var(--surface-1)] text-slate-400 hover:bg-white/10"
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

      {/* Controls bar — compact single row on desktop, wrapping on mobile */}
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2" onClick={(e) => e.stopPropagation()}>
        {/* Mode tabs */}
        {runwayDetails && (
          <div className="flex gap-1" data-testid="chart-mode-tabs">
            <button
              onClick={(e) => { e.stopPropagation(); setMode("keep-earning"); }}
              className={`focus-ring rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150 ${
                mode === "keep-earning"
                  ? "border border-cyan-400/30 bg-cyan-400/20 text-cyan-300 shadow-sm"
                  : "bg-[var(--surface-1)] text-slate-400 hover:bg-white/10"
              }`}
              data-testid="mode-keep-earning"
            >
              Keep Earning
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setMode("income-stops"); }}
              className={`focus-ring rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150 ${
                mode === "income-stops"
                  ? "border border-cyan-400/30 bg-cyan-400/20 text-cyan-300 shadow-sm"
                  : "bg-[var(--surface-1)] text-slate-400 hover:bg-white/10"
              }`}
              data-testid="mode-income-stops"
            >
              Income Stops
            </button>
          </div>
        )}

        {/* Outlook years */}
        <div className="flex items-center gap-2" data-testid="outlook-controls">
          <span className="text-xs text-slate-500">Outlook</span>
          <div className="flex rounded-lg border border-white/10 text-xs">
            {OUTLOOK_YEAR_OPTIONS.map((opt, i) => (
              <button
                key={opt}
                onClick={() => handleOutlookChange(opt)}
                className={`focus-ring px-2 py-0.5 transition-colors duration-150 ${
                  i === 0 ? "rounded-l-lg" : i === OUTLOOK_YEAR_OPTIONS.length - 1 ? "rounded-r-lg" : ""
                } ${
                  outlookYears === opt
                    ? "bg-cyan-400/20 text-cyan-300 font-medium"
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                }`}
                data-testid={`outlook-${opt}yr`}
              >
                {opt}yr
              </button>
            ))}
          </div>
        </div>

        {/* Inflation toggle */}
        <div className="flex items-center gap-2" data-testid="inflation-controls">
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-500">
            <input
              type="checkbox"
              checked={inflationAdjusted}
              onChange={(e) => handleInflationToggle(e.target.checked)}
              className="focus-ring h-3 w-3 cursor-pointer accent-cyan-400"
              data-testid="inflation-toggle"
              aria-label="Adjust for inflation"
            />
            Inflation
          </label>
          {inflationAdjusted && (
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <input
                type="number"
                min="0"
                max="20"
                step="0.1"
                value={inflationRateInput}
                onChange={(e) => handleInflationRateChange(e.target.value)}
                className="focus-ring w-12 rounded border border-white/10 bg-slate-800 px-1 py-0.5 text-right text-xs text-slate-200 transition-colors duration-150 focus-visible:border-cyan-400/50"
                data-testid="inflation-rate-input"
                aria-label="Annual inflation rate"
              />
              <span>%/yr</span>
            </div>
          )}
        </div>

        {/* Surplus subtitle inline */}
        {mode === "keep-earning" && surplusInfo.income > 0 && (
          <p className="text-xs tabular-nums text-slate-500" data-testid="projection-surplus-subtitle">
            Income {formatCurrency(surplusInfo.income)} − Expenses {formatCurrency(surplusInfo.expenses)} = <span className={surplusInfo.surplus >= 0 ? "font-medium text-cyan-300" : "font-medium text-rose-400"}>{formatCurrency(surplusInfo.surplus)}</span>/mo
          </p>
        )}
      </div>

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
                <td className="py-1.5 px-2 text-right tabular-nums text-slate-400">{formatTableCurrency(summaryPoints.current.netWorth)}</td>
                {summaryPoints.milestones.map((p, i) => (
                  <td key={milestoneYears[i]} className={`py-1.5 ${i === milestoneYears.length - 1 ? "pl-2" : "px-2"} text-right font-medium tabular-nums text-cyan-400`}>
                    {formatTableCurrency(p.netWorth)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-1.5 pr-4 font-medium text-slate-300">Total Assets</td>
                <td className="py-1.5 px-2 text-right tabular-nums text-slate-400">{formatTableCurrency(summaryPoints.current.totalAssets)}</td>
                {summaryPoints.milestones.map((p, i) => (
                  <td key={milestoneYears[i]} className={`py-1.5 ${i === milestoneYears.length - 1 ? "pl-2" : "px-2"} text-right tabular-nums text-cyan-400`}>
                    {formatTableCurrency(p.totalAssets)}
                  </td>
                ))}
              </tr>
              {hasBothDebtTypes ? (
                <>
                  <tr>
                    <td className="py-1.5 pr-4 font-medium text-slate-300">Consumer Debt</td>
                    <td className="py-1.5 px-2 text-right tabular-nums text-slate-400">{formatTableCurrency(summaryPoints.current.consumerDebts)}</td>
                    {summaryPoints.milestones.map((p, i) => (
                      <td key={milestoneYears[i]} className={`py-1.5 ${i === milestoneYears.length - 1 ? "pl-2" : "px-2"} text-right tabular-nums text-rose-400`}>
                        {formatTableCurrency(p.consumerDebts)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 font-medium text-slate-300">Mortgage</td>
                    <td className="py-1.5 px-2 text-right tabular-nums text-slate-400">{formatTableCurrency(summaryPoints.current.mortgageDebts)}</td>
                    {summaryPoints.milestones.map((p, i) => (
                      <td key={milestoneYears[i]} className={`py-1.5 ${i === milestoneYears.length - 1 ? "pl-2" : "px-2"} text-right tabular-nums text-rose-400`}>
                        {formatTableCurrency(p.mortgageDebts)}
                      </td>
                    ))}
                  </tr>
                </>
              ) : (
                <tr>
                  <td className="py-1.5 pr-4 font-medium text-slate-300">Total Debts</td>
                  <td className="py-1.5 px-2 text-right tabular-nums text-slate-400">{formatTableCurrency(summaryPoints.current.totalDebts)}</td>
                  {summaryPoints.milestones.map((p, i) => (
                    <td key={milestoneYears[i]} className={`py-1.5 ${i === milestoneYears.length - 1 ? "pl-2" : "px-2"} text-right tabular-nums text-rose-400`}>
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
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
            <XAxis
              dataKey="year"
              type="number"
              domain={[0, years]}
              tick={CHART_AXIS_TICK}
              tickFormatter={(v) => `${v}y`}
              ticks={xTicks}
            />
            <YAxis
              tick={CHART_AXIS_TICK}
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
              stroke={CHART_SEMANTIC.assets}
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
              stroke={CHART_SEMANTIC.debt}
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
                stroke={CHART_SERIES[3]}
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
                    stroke={CHART_SEMANTIC.surplus}
                    strokeDasharray="6 3"
                    label={<MilestoneLabelContent value="Consumer Debt Free" fill={CHART_SEMANTIC.surplus} />}
                  />
                )}
                {mortgageFreeYear !== null && mortgageFreeYear <= years && mortgageFreeYear > 0 && (
                  <ReferenceLine
                    x={mortgageFreeYear}
                    stroke={CHART_SERIES[0]}
                    strokeDasharray="6 3"
                    label={<MilestoneLabelContent value="Mortgage Free" fill={CHART_SERIES[0]} offsetY={
                      consumerDebtFreeYear !== null && Math.abs(mortgageFreeYear - consumerDebtFreeYear) < years * 0.15 ? 20 : 0
                    } />}
                  />
                )}
              </>
            ) : (
              debtFreeYear !== null && debtFreeYear <= years && debtFreeYear > 0 && (
                <ReferenceLine
                  x={debtFreeYear}
                  stroke={CHART_SEMANTIC.surplus}
                  strokeDasharray="6 3"
                  label={<MilestoneLabelContent value="Debt Free" fill={CHART_SEMANTIC.surplus} />}
                />
              )
            )}

            {/* FIRE number reference line */}
            {fireNumber > 0 && (
              <ReferenceLine
                y={fireNumber}
                stroke={CHART_SEMANTIC.taxes}
                strokeDasharray="4 3"
                strokeWidth={1.5}
                label={{
                  value: `🔥 FIRE: ${formatCurrency(fireNumber)}`,
                  position: "right",
                  fill: CHART_SEMANTIC.taxes,
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
                  fill: CHART_AXIS_TICK.fill,
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
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: SCENARIO_COLORS[scenario] }}
          />
          Net Worth
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: CHART_SEMANTIC.assets }} />
          Assets
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: CHART_SEMANTIC.debt }} />
          Debts
        </span>
        {hasMortgage && (
          <span className="flex items-center gap-1" data-testid="mortgage-burndown-legend">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: CHART_SERIES[3] }} />
            Mortgage
          </span>
        )}
        {fireNumber > 0 && (
          <span className="flex items-center gap-1" data-testid="fire-legend">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: CHART_SEMANTIC.taxes }} />
            🔥 FIRE
            <HelpTip text={`Portfolio size where ${safeWithdrawalRate}% annual withdrawals cover all expenses. The 4% rule means saving ${Math.round(100 / safeWithdrawalRate)}× your annual expenses.`} />
          </span>
        )}
      </div>

      {/* Scenario legend */}
      <div className="mt-3 border-t border-white/10 pt-3" data-testid="scenario-legend">
        <button
          onClick={() => setLegendOpen(!legendOpen)}
          className="focus-ring flex w-full items-center gap-1.5 rounded text-xs font-medium text-slate-500 transition-colors duration-150 hover:text-slate-300"
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


      {/* Per-asset projections with dynamic milestones */}
      {assetProjections.length > 0 && (
        <div className="mt-4 border-t border-white/10 pt-4" data-testid="asset-projections-table">
          <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">Asset Growth Projections</h4>
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
                    <td className="py-1.5 px-2 text-right tabular-nums text-slate-400">{formatTableCurrency(ap.currentValue)}</td>
                    {ap.milestoneValues.map((val, i) => (
                      <td key={milestoneYears[i]} className={`py-1.5 ${i === milestoneYears.length - 1 ? "pl-2" : "px-2"} text-right tabular-nums text-cyan-400`}>
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
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: CHART_SEMANTIC.surplus }} />
              <span className="text-slate-400">With investment growth</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: CHART_SERIES[5] }} />
              <span className="text-slate-400">Without growth</span>
            </span>
            {burndownData.hasTaxDrag && (
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: CHART_SEMANTIC.taxes }} />
                <span className="text-slate-400">After withdrawal taxes</span>
              </span>
            )}
          </div>

          <div className="h-72 sm:h-80 w-full" data-testid="burndown-chart-container">
            <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
              <LineChart data={burndownData.data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                <XAxis
                  dataKey="year"
                  type="number"
                  domain={[0, years]}
                  tick={CHART_AXIS_TICK}
                  tickFormatter={(v) => `${v}y`}
                  ticks={xTicks}
                />
                <YAxis
                  tick={CHART_AXIS_TICK}
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
                    label={{ value: "6-mo emergency fund", position: "right", fontSize: 10, fill: CHART_AXIS_TICK.fill }}
                  />
                )}

                {/* Zero-crossing markers */}
                {burndownData.noGrowthZero !== null && (
                  <ReferenceLine x={burndownData.noGrowthZero} stroke={CHART_SERIES[5]} strokeDasharray="3 3" strokeWidth={1}
                    label={{ value: fmtYears(burndownData.noGrowthZero), position: "top", fontSize: 10, fill: CHART_AXIS_TICK.fill }} />
                )}
                {burndownData.growthZero !== null && burndownData.growthZero !== burndownData.noGrowthZero && (
                  <ReferenceLine x={burndownData.growthZero} stroke={CHART_SEMANTIC.surplus} strokeDasharray="3 3" strokeWidth={1}
                    label={{ value: fmtYears(burndownData.growthZero), position: "top", fontSize: 10, fill: CHART_SEMANTIC.surplus }} />
                )}
                {burndownData.taxZero !== null && burndownData.taxZero !== burndownData.growthZero && burndownData.taxZero !== burndownData.noGrowthZero && (
                  <ReferenceLine x={burndownData.taxZero} stroke={CHART_SEMANTIC.taxes} strokeDasharray="3 3" strokeWidth={1}
                    label={{ value: fmtYears(burndownData.taxZero), position: "top", fontSize: 10, fill: CHART_SEMANTIC.taxes }} />
                )}

                <Line type="monotone" dataKey="withGrowth" stroke={CHART_SEMANTIC.surplus} strokeWidth={2.5} dot={false} name="withGrowth"
                  style={{ filter: `drop-shadow(0 0 5px ${CHART_SEMANTIC.surplus})` }} />
                <Line type="monotone" dataKey="withoutGrowth" stroke={CHART_SERIES[5]} strokeWidth={2} strokeDasharray="6 3" dot={false} name="withoutGrowth" />
                {burndownData.hasTaxDrag && (
                  <Line type="monotone" dataKey="withTax" stroke={CHART_SEMANTIC.taxes} strokeWidth={2} dot={false} name="withTax" />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Starting balances */}
          {runwayDetails.withGrowth[0] && (
            <div className="mt-3 flex flex-wrap items-center gap-x-1 text-xs tabular-nums text-slate-500" data-testid="burndown-starting-balances">
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
              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">Suggested Withdrawal Order</p>
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
