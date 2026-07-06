"use client";

import { useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Asset } from "@/components/AssetEntry";
import type { Property } from "@/components/PropertyEntry";
import type { StockHolding } from "@/components/StockEntry";
import { getStockValue } from "@/components/StockEntry";
import { useCurrency } from "@/lib/CurrencyContext";
import { CHART_SERIES } from "@/lib/chart-theme";

export type AllocationView = "category" | "liquidity";

export interface AllocationSlice {
  name: string;
  value: number;
  percentage: number;
}

/** Map each asset category to a display group for the allocation chart.
 *  Every known category gets its own slice — only truly unknown custom
 *  categories fall into "Other". */
function getCategoryGroup(category: string): string {
  const trimmed = category.trim();

  // Registered / tax-advantaged accounts — show individually
  const registered = new Set([
    "TFSA", "RRSP", "RESP", "FHSA", "LIRA",
    "401k", "Roth 401k", "IRA", "Roth IRA", "529", "HSA",
  ]);
  if (registered.has(trimmed)) return trimmed;

  // Common cash-like categories
  const lower = trimmed.toLowerCase();
  if (lower === "savings" || lower === "savings account" || lower === "hisa") return "Savings";
  if (lower === "checking" || lower === "chequing") return "Checking";
  if (lower.includes("brokerage")) return "Brokerage";
  if (lower === "gic" || lower === "money market" || lower === "cd") return "Fixed Income";
  if (lower === "vehicle") return "Vehicle";
  if (lower === "crypto" || lower === "cryptocurrency" || lower === "bitcoin") return "Crypto";
  if (lower === "other") return "Other";

  // Anything custom the user typed — show it as-is rather than hiding it in "Other"
  return trimmed;
}

export function computeAllocationByCategory(
  assets: Asset[],
  properties: Property[],
  stocks: StockHolding[]
): AllocationSlice[] {
  const groups = new Map<string, number>();

  // Group assets by category type
  for (const asset of assets) {
    if (asset.amount <= 0) continue;
    // Skip computed property equity — properties are added separately below
    if (asset.id === "_computed_equity") continue;
    const group = getCategoryGroup(asset.category);
    groups.set(group, (groups.get(group) ?? 0) + asset.amount);
  }

  // Add property equity
  for (const prop of properties) {
    const equity = Math.max(0, prop.value - prop.mortgage);
    if (equity <= 0) continue;
    groups.set("Property Equity", (groups.get("Property Equity") ?? 0) + equity);
  }

  // Add stocks
  const totalStocks = stocks.reduce((sum, s) => sum + getStockValue(s), 0);
  if (totalStocks > 0) {
    groups.set("Stocks", (groups.get("Stocks") ?? 0) + totalStocks);
  }

  const total = Array.from(groups.values()).reduce((s, v) => s + v, 0);
  if (total === 0) return [];

  return Array.from(groups.entries())
    .map(([name, value]) => ({
      name,
      value,
      percentage: (value / total) * 100,
    }))
    .sort((a, b) => b.value - a.value);
}

export function computeAllocationByLiquidity(
  assets: Asset[],
  properties: Property[],
  stocks: StockHolding[]
): AllocationSlice[] {
  let liquid = 0;
  let illiquid = 0;

  for (const asset of assets) {
    if (asset.amount <= 0) continue;
    // Skip computed property equity — properties are added separately below
    if (asset.id === "_computed_equity") continue;
    if (asset.category === "Vehicle") {
      illiquid += asset.amount;
    } else {
      liquid += asset.amount;
    }
  }

  // Stocks are liquid
  liquid += stocks.reduce((sum, s) => sum + getStockValue(s), 0);

  // Property equity is illiquid
  for (const prop of properties) {
    const equity = Math.max(0, prop.value - prop.mortgage);
    illiquid += equity;
  }

  const total = liquid + illiquid;
  if (total === 0) return [];

  const slices: AllocationSlice[] = [];
  if (liquid > 0) slices.push({ name: "Liquid", value: liquid, percentage: (liquid / total) * 100 });
  if (illiquid > 0) slices.push({ name: "Illiquid", value: illiquid, percentage: (illiquid / total) * 100 });
  return slices;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: AllocationSlice }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  const fmt = useCurrency();
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-xs text-slate-200 shadow-md">
      <p className="text-sm font-medium text-slate-200">{item.name}</p>
      <p className="text-sm text-slate-300">{fmt.full(item.value)}</p>
      <p className="text-xs text-slate-400">{item.percentage.toFixed(1)}%</p>
    </div>
  );
}

interface AssetAllocationChartProps {
  assets: Asset[];
  properties: Property[];
  stocks: StockHolding[];
}

export default function AssetAllocationChart({
  assets,
  properties,
  stocks,
}: AssetAllocationChartProps) {
  const fmt = useCurrency();
  const [view, setView] = useState<AllocationView>("category");

  const data = useMemo(() => {
    if (view === "liquidity") {
      return computeAllocationByLiquidity(assets, properties, stocks);
    }
    return computeAllocationByCategory(assets, properties, stocks);
  }, [assets, properties, stocks, view]);

  if (data.length === 0) {
    return (
      <div
        className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-2)] p-5 text-center"
        data-testid="allocation-chart"
      >
        <p className="text-sm text-slate-400">
          Add assets to see your allocation breakdown
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-2)] p-5 shadow-sm"
      data-testid="allocation-chart"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-400">Asset Allocation</h3>
        <div className="flex rounded-lg border border-white/10 text-xs">
          <button
            onClick={() => setView("category")}
            className={`px-2.5 py-1 rounded-l-lg transition-colors duration-150 ${
              view === "category"
                ? "bg-cyan-400/20 text-cyan-300 font-medium"
                : "text-slate-400 hover:bg-white/5"
            }`}
            aria-pressed={view === "category"}
          >
            By Type
          </button>
          <button
            onClick={() => setView("liquidity")}
            className={`px-2.5 py-1 rounded-r-lg transition-colors duration-150 ${
              view === "liquidity"
                ? "bg-cyan-400/20 text-cyan-300 font-medium"
                : "text-slate-400 hover:bg-white/5"
            }`}
            aria-pressed={view === "liquidity"}
          >
            By Liquidity
          </button>
        </div>
      </div>

      <div className="h-44 sm:h-52">
        <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="45%"
              outerRadius="75%"
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              animationDuration={600}
              animationEasing="ease-out"
            >
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={CHART_SERIES[index % CHART_SERIES.length]}
                  stroke="#0f172a"
                  strokeWidth={2}
                  className="transition-opacity duration-150 hover:opacity-80 cursor-pointer"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Compact legend with values */}
      <div className="mt-2 space-y-1">
        {data.map((slice, i) => (
          <div
            key={slice.name}
            className="flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: CHART_SERIES[i % CHART_SERIES.length] }}
              />
              <span className="text-xs text-slate-400">{slice.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-100">
                {fmt.full(slice.value)}
              </span>
              <span className="w-10 text-right text-slate-500">
                {slice.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
