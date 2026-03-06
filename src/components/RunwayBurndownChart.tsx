"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { RunwayExplainerDetails } from "@/components/DataFlowArrows";

const CATEGORY_COLORS = [
  "#10b981", "#06b6d4", "#8b5cf6", "#f59e0b", "#ec4899", "#6366f1", "#14b8a6", "#f97316",
];

function fmt(n: number) {
  return `$${Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export default function RunwayBurndownChart({ details }: { details: RunwayExplainerDetails }) {
  const chartData = useMemo(() => {
    const maxLen = Math.max(details.withGrowth.length, details.withoutGrowth.length, details.withTax.length);
    const step = maxLen > 300 ? Math.ceil(maxLen / 300) : 1;
    const data: Record<string, number | string>[] = [];

    for (let i = 0; i < maxLen; i += step) {
      const gPt = details.withGrowth[Math.min(i, details.withGrowth.length - 1)];
      const nPt = details.withoutGrowth[Math.min(i, details.withoutGrowth.length - 1)];
      const tPt = details.withTax[Math.min(i, details.withTax.length - 1)];

      const point: Record<string, number | string> = { month: gPt?.month ?? i };
      if (gPt) {
        for (const cat of details.categories) {
          point[cat] = Math.round(gPt.balances[cat] ?? 0);
        }
      }
      point["_withoutGrowth"] = Math.round(nPt?.totalBalance ?? 0);
      point["_withTax"] = Math.round(tPt?.totalBalance ?? 0);
      data.push(point);
    }
    return data;
  }, [details]);

  const hasGrowthData = details.runwayWithGrowthMonths !== undefined;
  const hasTaxData = details.runwayAfterTaxMonths !== undefined;

  if (chartData.length <= 1) return null;

  return (
    <div data-testid="runway-burndown-main" className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-700">Runway Burndown</h3>
        <div className="flex flex-wrap gap-3">
          {details.growthExtensionMonths !== undefined && details.growthExtensionMonths > 0 && (
            <p className="text-xs text-green-600 font-medium" data-testid="burndown-growth-extension">
              +{details.growthExtensionMonths.toFixed(0)} months from growth
            </p>
          )}
          {details.taxDragMonths !== undefined && details.taxDragMonths > 0 && (
            <p className="text-xs text-amber-600 font-medium" data-testid="burndown-tax-drag">
              -{details.taxDragMonths.toFixed(0)} months tax drag
            </p>
          )}
        </div>
      </div>

      <div className="h-72 sm:h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
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
                if (n === "_withoutGrowth") return [fmt(v), "Without growth"];
                if (n === "_withTax") return [fmt(v), "After tax"];
                return [fmt(v), n];
              }}
              labelFormatter={(label: unknown) => `Month ${label}`}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            {details.categories.map((cat, i) => (
              <Area
                key={cat}
                type="monotone"
                dataKey={cat}
                stackId="accounts"
                fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                stroke={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                fillOpacity={0.6}
                strokeWidth={1}
              />
            ))}
            {hasGrowthData && (
              <Area
                type="monotone"
                dataKey="_withoutGrowth"
                fill="none"
                stroke="#9ca3af"
                strokeWidth={2}
                strokeDasharray="6 3"
                fillOpacity={0}
                name="_withoutGrowth"
              />
            )}
            {hasTaxData && (
              <Area
                type="monotone"
                dataKey="_withTax"
                fill="#fef3c7"
                stroke="#f59e0b"
                strokeWidth={2}
                fillOpacity={0.2}
                name="_withTax"
              />
            )}
            <Legend
              formatter={(value: string) => {
                if (value === "_withoutGrowth") return "Without growth";
                if (value === "_withTax") return "After tax drag";
                return value;
              }}
              wrapperStyle={{ fontSize: 11 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

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
                  <span className="text-stone-700 font-medium">{entry.category}</span>
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
