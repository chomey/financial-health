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
import { useCurrency } from "@/lib/CurrencyContext";

export type DonutView = "breakdown" | "liquidity";

// Liquidity classification for assets
export function computeLiquidityData(
  assets: Asset[],
  properties: Property[],
  stocks: StockHolding[]
): { liquid: number; illiquid: number } {
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

  liquid += stocks.reduce((sum, s) => sum + getStockValue(s), 0);

  for (const prop of properties) {
    const equity = Math.max(0, prop.value - prop.mortgage);
    illiquid += equity;
  }

  return { liquid, illiquid };
}

const COLORS = [
  "#22d3ee", // cyan-400
  "#a78bfa", // violet-400
  "#34d399", // emerald-400
  "#f59e0b", // amber-400
  "#60a5fa", // blue-400
  "#f472b6", // pink-400
  "#4ade80", // green-400
  "#fb923c", // orange-400
  "#e879f9", // fuchsia-400
  "#facc15", // yellow-400
];

const DEBT_COLOR = "#f87171"; // red-400
const PROPERTY_PATTERN_COLOR = "#2dd4bf"; // teal-400 for property equity

export interface DonutSlice {
  name: string;
  value: number;
  type: "asset" | "debt";
  isProperty?: boolean;
}

/**
 * Two views, same net worth:
 *   Equity view (showMortgages=false): property equity as asset, no mortgage debt
 *   Gross view  (showMortgages=true):  full property value as asset, mortgage as debt
 */
export function computeDonutData(
  assets: Asset[],
  debts: Debt[],
  properties: Property[],
  stocks: StockHolding[],
  showMortgages = false,
): { slices: DonutSlice[]; netWorth: number; totalAssets: number; totalDebts: number } {
  const slices: DonutSlice[] = [];

  // Group assets by category
  const assetGroups = new Map<string, number>();
  for (const asset of assets) {
    if (asset.amount <= 0) continue;
    // Skip computed property equity — properties are added separately below
    if (asset.id === "_computed_equity") continue;
    assetGroups.set(asset.category, (assetGroups.get(asset.category) ?? 0) + asset.amount);
  }

  // Add stock holdings
  const totalStocks = stocks.reduce((sum, s) => sum + getStockValue(s), 0);
  if (totalStocks > 0) {
    assetGroups.set("Stocks", (assetGroups.get("Stocks") ?? 0) + totalStocks);
  }

  // Add property: equity-only or full value depending on mode
  for (const prop of properties) {
    if (showMortgages) {
      // Gross view: full property value as asset
      if (prop.value > 0) {
        const label = prop.name || "Property";
        slices.push({ name: label, value: prop.value, type: "asset", isProperty: true });
      }
    } else {
      // Equity view: only net equity as asset
      const equity = Math.max(0, prop.value - prop.mortgage);
      if (equity > 0) {
        const label = prop.name ? `${prop.name} Equity` : "Property Equity";
        slices.push({ name: label, value: equity, type: "asset", isProperty: true });
      }
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

  // Mortgages only included in gross view
  if (showMortgages) {
    for (const prop of properties) {
      if (prop.mortgage > 0) {
        const label = prop.name ? `${prop.name} Mortgage` : "Mortgage";
        debtGroups.set(label, (debtGroups.get(label) ?? 0) + prop.mortgage);
      }
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

// formatCurrency and formatFullCurrency defined inside components via useCurrency()

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
  const fmt = useCurrency();
  if (!active || !payload?.length) return null;
  const slice = payload[0].payload;

  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/90 px-3 py-2 shadow-md backdrop-blur-sm">
      <p className="text-sm font-medium text-slate-200">{slice.name}</p>
      <p
        className={`text-sm font-medium ${
          slice.type === "debt" ? "text-red-400" : "text-emerald-400"
        }`}
      >
        {fmt.full(slice.value)}
      </p>
      <p className="text-xs text-slate-500">
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
  const fmt = useCurrency();
  const formatCurrency = (v: number) => fmt.compact(v);
  const formatFullCurrency = (v: number) => fmt.full(v);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [view, setView] = useState<DonutView>("breakdown");
  const [showMortgages, setShowMortgages] = useState(false);

  const { slices, netWorth, totalAssets, totalDebts } = useMemo(
    () => computeDonutData(assets, debts, properties, stocks, showMortgages),
    [assets, debts, properties, stocks, showMortgages]
  );

  const liquidity = useMemo(
    () => computeLiquidityData(assets, properties, stocks),
    [assets, properties, stocks]
  );

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
        className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-3 sm:p-5 text-center"
        data-testid="donut-chart"
      >
        <p className="text-sm text-slate-400">
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
      className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-3 sm:p-5"
      data-testid="donut-chart"
    >
      <div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-medium text-slate-400">Net Worth Breakdown</h3>
        <div className="flex items-center gap-3">
        <div className="flex rounded-lg border border-white/10 text-xs">
          <button
            onClick={() => setView("breakdown")}
            className={`px-2.5 py-1 rounded-l-lg transition-colors duration-150 ${
              view === "breakdown"
                ? "bg-cyan-500/20 text-cyan-400 font-medium"
                : "text-slate-400 hover:bg-white/5"
            }`}
            aria-pressed={view === "breakdown"}
          >
            By Type
          </button>
          <button
            onClick={() => setView("liquidity")}
            className={`px-2.5 py-1 rounded-r-lg transition-colors duration-150 ${
              view === "liquidity"
                ? "bg-cyan-500/20 text-cyan-400 font-medium"
                : "text-slate-400 hover:bg-white/5"
            }`}
            aria-pressed={view === "liquidity"}
          >
            By Liquidity
          </button>
        </div>
          {properties.some(p => p.mortgage > 0) && view === "breakdown" && (
            <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showMortgages}
                onChange={(e) => setShowMortgages(e.target.checked)}
                className="rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-400/30 h-3.5 w-3.5"
              />
              Mortgages
            </label>
          )}
        </div>
      </div>

      {view === "breakdown" ? (
        <>
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
                        stroke="#0f172a"
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
                        stroke="#0f172a"
                        strokeWidth={2}
                        opacity={0.8 - index * 0.1}
                        className="cursor-pointer"
                      />
                    ))}
                  </Pie>
                )}

                <Tooltip content={<DonutTooltip />} wrapperStyle={{ pointerEvents: "none" }} position={{ x: 0, y: 0 }} />
              </PieChart>
            </ResponsiveContainer>

            {/* Center label */}
            <div
              className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
              data-testid="donut-center-label"
            >
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Net Worth
              </span>
              <span
                className={`text-sm font-bold ${
                  netWorth >= 0 ? "text-cyan-400" : "text-red-400"
                }`}
              >
                {formatFullCurrency(netWorth)}
              </span>
            </div>
          </div>

          {/* Composition table */}
          <div className="mt-3 overflow-x-auto" data-testid="donut-composition-table">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10 text-left text-slate-500">
                  <th className="pb-1 pr-2 font-medium">Name</th>
                  <th className="pb-1 px-2 font-medium text-right">Amount</th>
                  <th className="pb-1 pl-2 font-medium text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let tableAssetIdx = 0;
                  return slicesWithPct.map((slice, i) => {
                    let color: string;
                    if (slice.type === "debt") {
                      color = DEBT_COLOR;
                    } else if (slice.isProperty) {
                      color = PROPERTY_PATTERN_COLOR;
                    } else {
                      color = COLORS[tableAssetIdx % COLORS.length];
                      tableAssetIdx++;
                    }
                    const total = slice.type === "asset" ? totalAssets : totalDebts;
                    const pct = total > 0 ? (slice.value / total) * 100 : 0;
                    return (
                      <tr key={i} className="border-b border-white/5">
                        <td className="py-1 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-sm shrink-0"
                              style={{
                                backgroundColor: color,
                                ...(slice.isProperty
                                  ? {
                                      backgroundImage:
                                        "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.3) 2px, rgba(255,255,255,0.3) 4px)",
                                    }
                                  : {}),
                              }}
                            />
                            <span className="text-slate-300">{slice.name}</span>
                          </div>
                        </td>
                        <td className={`py-1 px-2 text-right font-medium whitespace-nowrap ${slice.type === "debt" ? "text-red-400" : "text-slate-100"}`}>
                          {slice.type === "debt" ? "-" : ""}{formatFullCurrency(slice.value)}
                        </td>
                        <td className="py-1 pl-2 text-right text-slate-500 whitespace-nowrap">
                          {pct.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          {/* Liquidity view */}
          {(() => {
            const { liquid, illiquid } = liquidity;
            const total = liquid + illiquid;
            const liquidPct = total > 0 ? (liquid / total) * 100 : 0;
            const illiquidPct = total > 0 ? (illiquid / total) * 100 : 0;
            const liqData = [
              ...(liquid > 0 ? [{ name: "Liquid", value: liquid, pct: liquidPct }] : []),
              ...(illiquid > 0 ? [{ name: "Illiquid", value: illiquid, pct: illiquidPct }] : []),
            ];
            const liqColors = ["#22d3ee", "#475569"]; // cyan for liquid, slate for illiquid
            return (
              <>
                <div className="relative" style={{ height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                    <PieChart>
                      <Pie
                        data={liqData}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={65}
                        paddingAngle={2}
                        animationDuration={600}
                        animationEasing="ease-out"
                      >
                        {liqData.map((_, index) => (
                          <Cell
                            key={index}
                            fill={liqColors[index % liqColors.length]}
                            stroke="#0f172a"
                            strokeWidth={2}
                            className="cursor-pointer"
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                      Liquid
                    </span>
                    <span className="text-sm font-bold text-cyan-400">
                      {liquidPct.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  {liqData.map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: liqColors[i] }}
                        />
                        <span className="text-slate-300">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-100 font-medium">{formatFullCurrency(item.value)}</span>
                        <span className="text-slate-500 w-10 text-right">{item.pct.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </>
      )}
    </div>
  );
}
