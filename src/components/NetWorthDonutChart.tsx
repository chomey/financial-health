"use client";

import { useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Asset } from "@/components/AssetEntry";
import type { Debt } from "@/components/DebtEntry";
import type { Property } from "@/components/PropertyEntry";
import type { StockHolding } from "@/components/StockEntry";
import { getStockValue } from "@/components/StockEntry";

// Color palette matching AssetAllocationChart
const COLORS = [
  "#059669", // emerald-600
  "#2563eb", // blue-600
  "#d97706", // amber-600
  "#7c3aed", // violet-600
  "#0891b2", // cyan-600
  "#db2777", // pink-600
  "#65a30d", // lime-600
  "#ea580c", // orange-600
];

const DEBT_COLOR = "#dc2626"; // red-600
const PROPERTY_PATTERN_COLOR = "#9ca3af"; // gray-400 for property equity hatching

export interface DonutSlice {
  name: string;
  value: number;
  type: "asset" | "debt";
  isProperty?: boolean;
}

export function computeDonutData(
  assets: Asset[],
  debts: Debt[],
  properties: Property[],
  stocks: StockHolding[]
): { slices: DonutSlice[]; netWorth: number; totalAssets: number; totalDebts: number } {
  const slices: DonutSlice[] = [];

  // Group assets by category
  const assetGroups = new Map<string, number>();
  for (const asset of assets) {
    if (asset.amount <= 0) continue;
    assetGroups.set(asset.category, (assetGroups.get(asset.category) ?? 0) + asset.amount);
  }

  // Add stock holdings
  const totalStocks = stocks.reduce((sum, s) => sum + getStockValue(s), 0);
  if (totalStocks > 0) {
    assetGroups.set("Stocks", (assetGroups.get("Stocks") ?? 0) + totalStocks);
  }

  // Add property equity
  for (const prop of properties) {
    const equity = Math.max(0, prop.value - prop.mortgage);
    if (equity > 0) {
      const label = prop.name ? `${prop.name} Equity` : "Property Equity";
      slices.push({ name: label, value: equity, type: "asset", isProperty: true });
    }
  }

  // Sort assets by value descending
  const sortedAssets = Array.from(assetGroups.entries()).sort((a, b) => b[1] - a[1]);
  for (const [name, value] of sortedAssets) {
    slices.push({ name, value, type: "asset" });
  }

  // Group debts
  const debtGroups = new Map<string, number>();
  for (const debt of debts) {
    if (debt.amount <= 0) continue;
    debtGroups.set(debt.category, (debtGroups.get(debt.category) ?? 0) + debt.amount);
  }

  // Add mortgage debts from properties
  for (const prop of properties) {
    if (prop.mortgage > 0) {
      const label = prop.name ? `${prop.name} Mortgage` : "Mortgage";
      debtGroups.set(label, (debtGroups.get(label) ?? 0) + prop.mortgage);
    }
  }

  const sortedDebts = Array.from(debtGroups.entries()).sort((a, b) => b[1] - a[1]);
  for (const [name, value] of sortedDebts) {
    slices.push({ name, value, type: "debt" });
  }

  const totalAssets = slices.filter(s => s.type === "asset").reduce((sum, s) => sum + s.value, 0);
  const totalDebts = slices.filter(s => s.type === "debt").reduce((sum, s) => sum + s.value, 0);
  const netWorth = totalAssets - totalDebts;

  return { slices, netWorth, totalAssets, totalDebts };
}

function formatCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value.toFixed(0)}`;
}

function formatFullCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getSliceColor(slice: DonutSlice, index: number, assetIndex: number): string {
  if (slice.type === "debt") return DEBT_COLOR;
  if (slice.isProperty) return PROPERTY_PATTERN_COLOR;
  return COLORS[assetIndex % COLORS.length];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: DonutSlice & { percentage: number } }>;
}

function DonutTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const slice = payload[0].payload;

  return (
    <div className="rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-md">
      <p className="text-sm font-medium text-stone-800">{slice.name}</p>
      <p
        className={`text-sm font-medium ${
          slice.type === "debt" ? "text-red-600" : "text-emerald-600"
        }`}
      >
        {formatFullCurrency(slice.value)}
      </p>
      <p className="text-xs text-stone-400">
        {slice.percentage.toFixed(1)}% of {slice.type === "debt" ? "total debts" : "total assets"}
      </p>
    </div>
  );
}

interface NetWorthDonutChartProps {
  assets: Asset[];
  debts: Debt[];
  properties: Property[];
  stocks: StockHolding[];
}

export default function NetWorthDonutChart({
  assets,
  debts,
  properties,
  stocks,
}: NetWorthDonutChartProps) {
  const { slices, netWorth, totalAssets, totalDebts } = useMemo(
    () => computeDonutData(assets, debts, properties, stocks),
    [assets, debts, properties, stocks]
  );

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Add percentage to slices for tooltip
  const slicesWithPct = useMemo(() => {
    return slices.map(s => ({
      ...s,
      percentage:
        s.type === "asset"
          ? totalAssets > 0 ? (s.value / totalAssets) * 100 : 0
          : totalDebts > 0 ? (s.value / totalDebts) * 100 : 0,
    }));
  }, [slices, totalAssets, totalDebts]);

  const assetSlices = slicesWithPct.filter(s => s.type === "asset");
  const debtSlices = slicesWithPct.filter(s => s.type === "debt");

  if (slices.length === 0) {
    return (
      <div
        className="rounded-xl border border-stone-200 bg-white p-5 text-center"
        data-testid="donut-chart"
      >
        <p className="text-sm text-stone-400">
          Add assets and debts to see your net worth breakdown
        </p>
      </div>
    );
  }

  // Track asset color index separately (skipping property slices which use gray)
  let assetColorIdx = 0;
  const colorMap = slicesWithPct.map((slice, i) => {
    if (slice.type === "debt") return DEBT_COLOR;
    if (slice.isProperty) return PROPERTY_PATTERN_COLOR;
    const color = COLORS[assetColorIdx % COLORS.length];
    assetColorIdx++;
    return color;
  });

  return (
    <div
      className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
      data-testid="donut-chart"
    >
      <h3 className="mb-3 text-sm font-medium text-stone-500">
        Net Worth Breakdown
      </h3>

      <div className="relative" style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
          <PieChart>
            {/* Outer ring: assets */}
            <Pie
              data={assetSlices}
              dataKey="value"
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={65}
              paddingAngle={1}
              animationDuration={600}
              animationEasing="ease-out"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {assetSlices.map((slice, index) => {
                let colorIdx = 0;
                // Find this slice's color from the full colorMap
                let found = 0;
                for (let i = 0; i < slicesWithPct.length; i++) {
                  if (slicesWithPct[i].type === "asset") {
                    if (found === index) {
                      colorIdx = i;
                      break;
                    }
                    found++;
                  }
                }
                return (
                  <Cell
                    key={`asset-${index}`}
                    fill={colorMap[colorIdx]}
                    stroke="white"
                    strokeWidth={2}
                    className="transition-opacity duration-150 cursor-pointer"
                    opacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
                  />
                );
              })}
            </Pie>

            {/* Inner ring: debts (if any) */}
            {debtSlices.length > 0 && (
              <Pie
                data={debtSlices}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={60}
                innerRadius={40}
                paddingAngle={1}
                animationDuration={600}
                animationEasing="ease-out"
              >
                {debtSlices.map((_, index) => (
                  <Cell
                    key={`debt-${index}`}
                    fill={DEBT_COLOR}
                    stroke="white"
                    strokeWidth={2}
                    opacity={0.8 - index * 0.1}
                    className="cursor-pointer"
                  />
                ))}
              </Pie>
            )}

            <Tooltip content={<DonutTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
          data-testid="donut-center-label"
        >
          <span className="text-[10px] font-medium uppercase tracking-wider text-stone-400">
            Net Worth
          </span>
          <span
            className={`text-lg font-bold ${
              netWorth >= 0 ? "text-blue-600" : "text-red-600"
            }`}
          >
            {formatCurrency(netWorth)}
          </span>
        </div>
      </div>

      {/* Compact legend */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-stone-600" data-testid="donut-legend">
        {(() => {
          let legendAssetIdx = 0;
          return slices.map((slice, i) => {
            let color: string;
            if (slice.type === "debt") {
              color = DEBT_COLOR;
            } else if (slice.isProperty) {
              color = PROPERTY_PATTERN_COLOR;
            } else {
              color = COLORS[legendAssetIdx % COLORS.length];
              legendAssetIdx++;
            }
            return (
              <div key={i} className="flex items-center gap-1">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-sm shrink-0"
                  style={{
                    backgroundColor: color,
                    ...(slice.isProperty
                      ? {
                          backgroundImage:
                            "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 4px)",
                        }
                      : {}),
                  }}
                />
                <span className="truncate max-w-[100px]">
                  {slice.name}
                  {slice.type === "debt" ? ` (-${formatCurrency(slice.value)})` : ""}
                </span>
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}
