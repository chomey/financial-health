"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { Asset } from "@/components/AssetEntry";
import type { Debt } from "@/components/DebtEntry";
import type { Property } from "@/components/PropertyEntry";
import type { StockHolding } from "@/components/StockEntry";
import { getStockValue } from "@/components/StockEntry";

export interface WaterfallSegment {
  name: string;
  value: number;
  base: number; // invisible base for waterfall positioning
  visible: number; // absolute visible bar height
  cumulative: number; // running total after this segment
  type: "asset" | "debt" | "total";
}

const ASSET_COLOR = "#059669"; // emerald-600
const DEBT_COLOR = "#dc2626"; // red-600
const TOTAL_COLOR = "#2563eb"; // blue-600
const TOTAL_NEGATIVE_COLOR = "#dc2626"; // red-600 for negative net worth

export function computeWaterfallData(
  assets: Asset[],
  debts: Debt[],
  properties: Property[],
  stocks: StockHolding[]
): WaterfallSegment[] {
  const segments: WaterfallSegment[] = [];
  let cumulative = 0;

  // Group assets by category for cleaner display
  const assetGroups = new Map<string, number>();
  for (const asset of assets) {
    if (asset.amount <= 0) continue;
    assetGroups.set(asset.category, (assetGroups.get(asset.category) ?? 0) + asset.amount);
  }

  // Add stock holdings as a group
  const totalStocks = stocks.reduce((sum, s) => sum + getStockValue(s), 0);
  if (totalStocks > 0) {
    assetGroups.set("Stocks", (assetGroups.get("Stocks") ?? 0) + totalStocks);
  }

  // Add property equity
  for (const prop of properties) {
    const equity = Math.max(0, prop.value - prop.mortgage);
    if (equity > 0) {
      const label = prop.name ? `${prop.name} Equity` : "Property Equity";
      assetGroups.set(label, (assetGroups.get(label) ?? 0) + equity);
    }
  }

  // Sort assets by value descending for visual impact
  const sortedAssets = Array.from(assetGroups.entries()).sort((a, b) => b[1] - a[1]);

  // Add asset segments (positive, stacking up)
  for (const [name, value] of sortedAssets) {
    segments.push({
      name,
      value,
      base: cumulative,
      visible: value,
      cumulative: cumulative + value,
      type: "asset",
    });
    cumulative += value;
  }

  // Group debts by category
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

  // Sort debts by value descending
  const sortedDebts = Array.from(debtGroups.entries()).sort((a, b) => b[1] - a[1]);

  // Add debt segments (negative, pulling down)
  for (const [name, value] of sortedDebts) {
    cumulative -= value;
    segments.push({
      name,
      value: -value,
      base: cumulative,
      visible: value,
      cumulative,
      type: "debt",
    });
  }

  // Add net worth total bar
  const netWorth = cumulative;
  segments.push({
    name: "Net Worth",
    value: netWorth,
    base: netWorth >= 0 ? 0 : netWorth,
    visible: Math.abs(netWorth),
    cumulative: netWorth,
    type: "total",
  });

  return segments;
}

function formatCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${value.toFixed(0)}`;
}

function getBarColor(segment: WaterfallSegment): string {
  if (segment.type === "total") return segment.value >= 0 ? TOTAL_COLOR : TOTAL_NEGATIVE_COLOR;
  if (segment.type === "debt") return DEBT_COLOR;
  return ASSET_COLOR;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: WaterfallSegment }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const segment = payload[0].payload;

  return (
    <div className="rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-md">
      <p className="text-sm font-medium text-stone-800">{segment.name}</p>
      <p
        className={`text-sm font-medium ${
          segment.type === "debt"
            ? "text-red-600"
            : segment.type === "total"
            ? segment.value >= 0
              ? "text-blue-600"
              : "text-red-600"
            : "text-emerald-600"
        }`}
      >
        {segment.type === "debt" ? "-" : ""}
        {formatCurrency(Math.abs(segment.value))}
      </p>
      {segment.type !== "total" && (
        <p className="text-xs text-stone-400">
          Running total: {formatCurrency(segment.cumulative)}
        </p>
      )}
    </div>
  );
}

interface NetWorthWaterfallChartProps {
  assets: Asset[];
  debts: Debt[];
  properties: Property[];
  stocks: StockHolding[];
}

export default function NetWorthWaterfallChart({
  assets,
  debts,
  properties,
  stocks,
}: NetWorthWaterfallChartProps) {
  const data = useMemo(
    () => computeWaterfallData(assets, debts, properties, stocks),
    [assets, debts, properties, stocks]
  );

  if (data.length <= 1) {
    return (
      <div
        className="rounded-xl border border-stone-200 bg-white p-5 text-center"
        data-testid="waterfall-chart"
      >
        <p className="text-sm text-stone-400">
          Add assets and debts to see your net worth breakdown
        </p>
      </div>
    );
  }

  // Calculate dynamic height based on number of segments
  const barHeight = Math.max(data.length * 36 + 40, 160);

  return (
    <div
      className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
      data-testid="waterfall-chart"
    >
      <h3 className="mb-3 text-sm font-medium text-stone-500">
        Net Worth Breakdown
      </h3>

      <div style={{ height: barHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            barSize={20}
          >
            <XAxis
              type="number"
              tickFormatter={(v: number) => formatCurrency(v)}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#78716c" }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#57534e" }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
            <ReferenceLine x={0} stroke="#d6d3d1" strokeWidth={1} />
            {/* Invisible base bar */}
            <Bar dataKey="base" stackId="waterfall" fill="transparent" isAnimationActive={false} />
            {/* Visible value bar */}
            <Bar
              dataKey="visible"
              stackId="waterfall"
              animationDuration={600}
              animationEasing="ease-out"
              radius={[0, 3, 3, 0]}
            >
              {data.map((segment, index) => (
                <Cell
                  key={index}
                  fill={getBarColor(segment)}
                  className="transition-opacity duration-150 hover:opacity-80 cursor-pointer"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Compact legend */}
      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-stone-500">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: ASSET_COLOR }} />
          <span>Assets</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: DEBT_COLOR }} />
          <span>Debts</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: TOTAL_COLOR }} />
          <span>Net Worth</span>
        </div>
      </div>
    </div>
  );
}
