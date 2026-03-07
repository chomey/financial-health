"use client";

import { useMemo } from "react";
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
import type { RunwayExplainerDetails } from "@/components/DataFlowArrows";
import { useCurrency } from "@/lib/CurrencyContext";

// fmt defined inside component via useCurrency()

function fmtDuration(months: number): string {
  if (months < 12) return `${Math.round(months)} mo`;
  const years = months / 12;
  return years % 1 === 0 ? `${years} yr` : `${years.toFixed(1)} yr`;
}

export function buildSummary(details: RunwayExplainerDetails): string {
  const baseMonths = details.runwayMonths;
  const growthMonths = details.runwayWithGrowthMonths;
  const taxMonths = details.runwayAfterTaxMonths;
  const growthExt = details.growthExtensionMonths;
  const taxDrag = details.taxDragMonths;

  let sentence = `Your savings could last ~${fmtDuration(baseMonths)}.`;

  if (growthExt && growthExt > 0 && taxDrag && taxDrag > 0) {
    sentence += ` Investment growth adds ~${fmtDuration(growthExt)}, but withdrawal taxes reduce it by ~${fmtDuration(taxDrag)}.`;
  } else if (growthExt && growthExt > 0) {
    sentence += ` Investment growth extends this by ~${fmtDuration(growthExt)}.`;
  } else if (taxDrag && taxDrag > 0 && growthMonths !== undefined) {
    sentence += ` Withdrawal taxes reduce it by ~${fmtDuration(taxDrag)}.`;
  }

  // Add the effective runway
  const effectiveMonths = taxMonths ?? growthMonths ?? baseMonths;
  if (effectiveMonths !== baseMonths) {
    sentence += ` Effective runway: ~${fmtDuration(effectiveMonths)}.`;
  }

  return sentence;
}

export default function RunwayBurndownChart({ details }: { details: RunwayExplainerDetails }) {
  const cfmt = useCurrency();
  const fmt = (n: number) => cfmt.full(Math.abs(n));
  const hasTaxData = details.runwayAfterTaxMonths !== undefined;
  const hasTaxDrag = (details.taxDragMonths ?? 0) > 0;

  const chartData = useMemo(() => {
    const maxLen = Math.max(details.withGrowth.length, details.withoutGrowth.length, details.withTax.length);
    const step = maxLen > 300 ? Math.ceil(maxLen / 300) : 1;
    const data: { month: number; withGrowth: number; withoutGrowth: number; withTax: number }[] = [];

    for (let i = 0; i < maxLen; i += step) {
      const gPt = details.withGrowth[Math.min(i, details.withGrowth.length - 1)];
      const nPt = details.withoutGrowth[Math.min(i, details.withoutGrowth.length - 1)];
      const tPt = details.withTax[Math.min(i, details.withTax.length - 1)];

      data.push({
        month: gPt?.month ?? i,
        withGrowth: Math.round(gPt?.totalBalance ?? 0),
        withoutGrowth: Math.round(nPt?.totalBalance ?? 0),
        withTax: Math.round(tPt?.totalBalance ?? 0),
      });
    }
    return data;
  }, [details]);

  // Find zero-crossing months for milestone markers
  const growthZeroMonth = useMemo(() => {
    for (const pt of chartData) {
      if (pt.withGrowth <= 0) return pt.month;
    }
    return null;
  }, [chartData]);

  const noGrowthZeroMonth = useMemo(() => {
    for (const pt of chartData) {
      if (pt.withoutGrowth <= 0) return pt.month;
    }
    return null;
  }, [chartData]);

  const taxZeroMonth = useMemo(() => {
    if (!hasTaxData) return null;
    for (const pt of chartData) {
      if (pt.withTax <= 0) return pt.month;
    }
    return null;
  }, [chartData, hasTaxData]);

  // 6-month emergency fund threshold
  const emergencyFundThreshold = details.monthlyTotal * 6;

  // Starting balances per category
  const startingBalances = useMemo(() => {
    const first = details.withGrowth[0];
    if (!first) return [];
    return details.categories
      .map(cat => ({ category: cat, balance: first.balances[cat] ?? 0 }))
      .filter(b => b.balance > 0);
  }, [details]);

  const summary = useMemo(() => buildSummary(details), [details]);

  if (chartData.length <= 1) return null;

  return (
    <div data-testid="runway-burndown-main" className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-6">
      <div className="mb-1">
        <h3 className="text-sm font-semibold text-stone-700">Runway Burndown</h3>
      </div>

      {/* Plain-English summary */}
      <p className="mb-4 text-sm text-stone-600" data-testid="burndown-summary">{summary}</p>

      {/* Clean legend */}
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" data-testid="burndown-legend">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded bg-emerald-500" style={{ height: 2 }} />
          <span className="text-stone-600">With investment growth</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded bg-stone-400" style={{ height: 2, borderTop: "2px dashed #9ca3af", background: "none" }} />
          <span className="text-stone-600">Without growth</span>
        </span>
        {hasTaxData && hasTaxDrag && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 rounded bg-amber-500" style={{ height: 2 }} />
            <span className="text-stone-600">After withdrawal taxes</span>
          </span>
        )}
      </div>

      <div className="h-72 sm:h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#78716c" }}
              label={{ value: "Months", position: "insideBottom", offset: -2, fontSize: 11, fill: "#78716c" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#78716c" }}
              tickFormatter={(v: number) => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`}
            />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => {
                const v = Number(value) || 0;
                const n = String(name ?? "");
                if (n === "withGrowth") return [fmt(v), "With growth"];
                if (n === "withoutGrowth") return [fmt(v), "Without growth"];
                if (n === "withTax") return [fmt(v), "After taxes"];
                return [fmt(v), n];
              }}
              labelFormatter={(label: unknown) => `Month ${label}`}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />

            {/* 6-month emergency fund threshold */}
            {emergencyFundThreshold > 0 && (
              <ReferenceLine
                y={emergencyFundThreshold}
                stroke="#d6d3d1"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{ value: "6-mo emergency fund", position: "right", fontSize: 10, fill: "#a8a29e" }}
              />
            )}

            {/* Zero-crossing milestone markers */}
            {noGrowthZeroMonth !== null && (
              <ReferenceLine
                x={noGrowthZeroMonth}
                stroke="#9ca3af"
                strokeDasharray="3 3"
                strokeWidth={1}
                label={{ value: fmtDuration(noGrowthZeroMonth), position: "top", fontSize: 10, fill: "#78716c" }}
              />
            )}
            {growthZeroMonth !== null && growthZeroMonth !== noGrowthZeroMonth && (
              <ReferenceLine
                x={growthZeroMonth}
                stroke="#10b981"
                strokeDasharray="3 3"
                strokeWidth={1}
                label={{ value: fmtDuration(growthZeroMonth), position: "top", fontSize: 10, fill: "#059669" }}
              />
            )}
            {taxZeroMonth !== null && taxZeroMonth !== growthZeroMonth && taxZeroMonth !== noGrowthZeroMonth && (
              <ReferenceLine
                x={taxZeroMonth}
                stroke="#f59e0b"
                strokeDasharray="3 3"
                strokeWidth={1}
                label={{ value: fmtDuration(taxZeroMonth), position: "top", fontSize: 10, fill: "#d97706" }}
              />
            )}

            {/* Main lines */}
            <Line
              type="monotone"
              dataKey="withGrowth"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={false}
              name="withGrowth"
            />
            <Line
              type="monotone"
              dataKey="withoutGrowth"
              stroke="#9ca3af"
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
              name="withoutGrowth"
            />
            {hasTaxData && hasTaxDrag && (
              <Line
                type="monotone"
                dataKey="withTax"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                name="withTax"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Starting balances */}
      {startingBalances.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-x-1 text-xs text-stone-500" data-testid="burndown-starting-balances">
          <span className="font-medium text-stone-600">Starting:</span>
          {startingBalances.map((b, i) => (
            <span key={b.category}>
              {b.category} {fmt(b.balance)}{i < startingBalances.length - 1 ? " ·" : ""}
            </span>
          ))}
        </div>
      )}

      {/* Withdrawal order */}
      {details.withdrawalOrder.length > 0 && (
        <div className="mt-4" data-testid="burndown-withdrawal-order">
          <p className="mb-2 text-xs font-medium text-stone-500 uppercase tracking-wide">Suggested Withdrawal Order</p>
          <div className="flex flex-wrap gap-2">
            {details.withdrawalOrder.map((entry, i) => {
              const treatmentLabel = entry.taxTreatment === "tax-free" ? "tax-free"
                : entry.taxTreatment === "tax-deferred" ? "taxed as income"
                : "capital gains";
              return (
                <span key={i} className="inline-flex items-center gap-1.5 rounded-lg bg-stone-50 px-2.5 py-1.5 text-xs" data-testid={`burndown-withdrawal-${i}`}>
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-stone-200 text-[10px] font-bold text-stone-600">{i + 1}</span>
                  <span className="max-w-[150px] truncate text-stone-700 font-medium">{entry.category}</span>
                  <span className="text-stone-400">({treatmentLabel})</span>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
