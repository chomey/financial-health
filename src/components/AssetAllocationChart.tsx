"use client";

import { useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { Asset } from "@/components/AssetEntry";
import type { Property } from "@/components/PropertyEntry";
import type { StockHolding } from "@/components/StockEntry";
import { getStockValue } from "@/components/StockEntry";

// High-contrast color palette — each color is visually distinct
const COLORS = [
  "#059669", // emerald-600 (retirement)
  "#2563eb", // blue-600 (savings)
  "#d97706", // amber-600 (brokerage)
  "#7c3aed", // violet-600 (stocks)
  "#dc2626", // red-600 (property)
  "#0891b2", // cyan-600 (vehicle/other)
  "#db2777", // pink-600
  "#65a30d", // lime-600
];

export type AllocationView = "category" | "liquidity";

export interface AllocationSlice {
  name: string;
  value: number;
  percentage: number;
}

const RETIREMENT_CATEGORIES = new Set([
  "TFSA", "RRSP", "RESP", "FHSA", "LIRA",
  "401k", "IRA", "Roth IRA", "529", "HSA",
]);

function getCategoryGroup(category: string): string {
  if (RETIREMENT_CATEGORIES.has(category)) return "Retirement Accounts";
  const lower = category.toLowerCase();
  if (lower.includes("saving") || lower.includes("checking")) return "Savings & Checking";
  if (lower.includes("brokerage")) return "Brokerage";
  if (lower.includes("vehicle")) return "Vehicle";
  return "Other";
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

function formatCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${value.toFixed(0)}`;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: AllocationSlice }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-md">
      <p className="text-sm font-medium text-stone-800">{item.name}</p>
      <p className="text-sm text-stone-600">{formatCurrency(item.value)}</p>
      <p className="text-xs text-stone-400">{item.percentage.toFixed(1)}%</p>
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
        className="rounded-xl border border-stone-200 bg-white p-5 text-center"
        data-testid="allocation-chart"
      >
        <p className="text-sm text-stone-400">
          Add assets to see your allocation breakdown
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
      data-testid="allocation-chart"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-stone-500">Asset Allocation</h3>
        <div className="flex rounded-lg border border-stone-200 text-xs">
          <button
            onClick={() => setView("category")}
            className={`px-2.5 py-1 rounded-l-lg transition-colors duration-150 ${
              view === "category"
                ? "bg-emerald-50 text-emerald-700 font-medium"
                : "text-stone-500 hover:bg-stone-50"
            }`}
            aria-pressed={view === "category"}
          >
            By Type
          </button>
          <button
            onClick={() => setView("liquidity")}
            className={`px-2.5 py-1 rounded-r-lg transition-colors duration-150 ${
              view === "liquidity"
                ? "bg-emerald-50 text-emerald-700 font-medium"
                : "text-stone-500 hover:bg-stone-50"
            }`}
            aria-pressed={view === "liquidity"}
          >
            By Liquidity
          </button>
        </div>
      </div>

      <div className="h-52 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
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
                  fill={COLORS[index % COLORS.length]}
                  stroke="white"
                  strokeWidth={2}
                  className="transition-opacity duration-150 hover:opacity-80 cursor-pointer"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value: string) => (
                <span className="text-xs text-stone-600">{value}</span>
              )}
            />
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
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-stone-600">{slice.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-stone-800 font-medium">
                {formatCurrency(slice.value)}
              </span>
              <span className="text-stone-400 w-10 text-right">
                {slice.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
