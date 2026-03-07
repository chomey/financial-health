"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type RefObject,
  type ReactNode,
} from "react";
import { formatCurrency, type SupportedCurrency } from "@/lib/currency";

// --- Types ---

export interface SourceMetadataItem {
  label: string;
  value: number;
  currency?: import("@/lib/currency").SupportedCurrency;
}

export interface SourceMetadata {
  label: string;
  value: number;
  color?: string;
  items?: SourceMetadataItem[];
}

export interface ActiveConnection {
  sourceId: string;
  targetId: string;
  label?: string;
  value?: number;
  sign?: "positive" | "negative";
  /** "light" renders thinner, more transparent arrows (used by insight cards) */
  style?: "default" | "light";
}

interface RegisteredElement {
  ref: RefObject<HTMLElement | null>;
  metadata?: SourceMetadata;
}

export interface TaxBracketSegment {
  min: number;
  max: number;
  rate: number;
  amountInBracket: number;
  taxInBracket: number;
}

export interface TaxExplainerDetails {
  federalTax: number;
  provincialStateTax: number;
  jurisdictionLabel: string; // e.g. "Ontario" or "California"
  jurisdictionType: "Provincial" | "State"; // CA = Provincial, US = State
  effectiveRate: number;
  marginalRate: number;
  grossIncome: number;
  totalTax: number;
  afterTaxIncome: number;
  brackets: TaxBracketSegment[]; // federal bracket segments for the bar
  provincialBrackets?: TaxBracketSegment[]; // provincial/state bracket segments
  federalBasicPersonalAmount?: number;
  provincialBasicPersonalAmount?: number;
  hasCapitalGains: boolean;
  capitalGainsInfo?: {
    country: "CA" | "US";
    totalCapitalGains: number;
  };
  investmentIncomeTax?: {
    totalAnnualInterest: number;
    accounts: { label: string; balance: number; roi: number; annualInterest: number }[];
  };
}

export interface RunwayTimeSeriesPoint {
  month: number;
  balances: Record<string, number>;
  totalBalance: number;
}

export interface RunwayWithdrawalOrderEntry {
  category: string;
  taxTreatment: string;
  roiTaxTreatment?: "capital-gains" | "income";
  startingBalance: number;
  estimatedTaxCost: number;
}

export interface RunwayExplainerDetails {
  withGrowth: RunwayTimeSeriesPoint[];
  withoutGrowth: RunwayTimeSeriesPoint[];
  withTax: RunwayTimeSeriesPoint[];
  withdrawalOrder: RunwayWithdrawalOrderEntry[];
  monthlyExpenses: number;
  monthlyMortgage: number;
  monthlyTotal: number;
  runwayMonths: number;
  runwayWithGrowthMonths: number | undefined;
  runwayAfterTaxMonths: number | undefined;
  growthExtensionMonths: number | undefined;
  taxDragMonths: number | undefined;
  categories: string[];
}

export interface SurplusInvestmentReturn {
  label: string;
  amount: number;
  balance: number;
  roi: number;
}

export interface ActiveTargetMeta {
  label: string;
  formattedValue: string;
  metricType?: string;
  taxDetails?: TaxExplainerDetails;
  runwayDetails?: RunwayExplainerDetails;
  investmentReturns?: SurplusInvestmentReturn[];
}

interface DataFlowContextValue {
  registerSource: (
    id: string,
    ref: RefObject<HTMLElement | null>,
    metadata?: SourceMetadata
  ) => void;
  unregisterSource: (id: string) => void;
  registerTarget: (id: string, ref: RefObject<HTMLElement | null>) => void;
  unregisterTarget: (id: string) => void;
  setActiveTarget: (id: string | null) => void;
  activeTarget: string | null;
  activeConnections: ActiveConnection[];
  setActiveConnections: (connections: ActiveConnection[]) => void;
  activeTargetMeta: ActiveTargetMeta | null;
  setActiveTargetMeta: (meta: ActiveTargetMeta | null) => void;
  getSourceMetadata: (id: string) => SourceMetadata | undefined;
  homeCurrency: import("@/lib/currency").SupportedCurrency;
}

// --- Constants ---

/** Maximum simultaneous arrows to render (prioritize by absolute value) */
export const MAX_ARROWS = 8;

// --- Context ---

const DataFlowContext = createContext<DataFlowContextValue | null>(null);

export function useDataFlow(): DataFlowContextValue {
  const ctx = useContext(DataFlowContext);
  if (!ctx) {
    throw new Error("useDataFlow must be used within a DataFlowProvider");
  }
  return ctx;
}

/** Returns the data flow context or null if outside a provider. Safe for optional usage. */
export function useOptionalDataFlow(): DataFlowContextValue | null {
  return useContext(DataFlowContext);
}

/**
 * Prioritize connections by absolute value magnitude, returning at most MAX_ARROWS.
 */
export function prioritizeConnections(
  connections: ActiveConnection[],
  maxArrows: number = MAX_ARROWS
): ActiveConnection[] {
  if (connections.length <= maxArrows) return connections;
  return [...connections]
    .sort((a, b) => Math.abs(b.value ?? 0) - Math.abs(a.value ?? 0))
    .slice(0, maxArrows);
}

// --- Hand-drawn SVG utilities ---

/**
 * Generate a smooth hand-drawn SVG oval path.
 * Uses 4 cubic bezier curves (one per quadrant) with gentle sinusoidal
 * undulations — like a confident teacher circling something with a single
 * fluid pen stroke.
 */
export function handDrawnOval(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  seed: number = 0
): string {
  // Scale jitter with oval size: small ovals 1-2px, large ovals 2-3px
  const minR = Math.min(rx, ry);
  const jitterAmp = minR < 20 ? Math.min(minR * 0.06, 2) : Math.min(minR * 0.04, 3);

  // Kappa for cubic bezier circle approximation (~0.5523)
  const k = 0.5523;

  // 4 cardinal anchor points with gentle jitter
  const jx = (i: number) => jitterAmp * Math.sin(seed * 1.7 + i * 2.3);
  const jy = (i: number) => jitterAmp * Math.cos(seed * 2.3 + i * 1.7);

  const right: [number, number] = [cx + rx + jx(0), cy + jy(0)];
  const bottom: [number, number] = [cx + jx(1), cy + ry + jy(1)];
  const left: [number, number] = [cx - rx + jx(2), cy + jy(2)];
  const top: [number, number] = [cx + jx(3), cy - ry + jy(3)];

  // Control point jitter — gentle undulations along the curve
  const cj = (i: number) => jitterAmp * Math.sin(seed * 3.1 + i * 1.9);

  // Build 4 cubic bezier curves (right→bottom→left→top→close)
  const d = [
    `M ${right[0].toFixed(1)} ${right[1].toFixed(1)}`,
    // Q1: right → bottom
    `C ${(cx + rx * 1).toFixed(1)} ${(cy + ry * k + cj(0)).toFixed(1)} ${(cx + rx * k + cj(1)).toFixed(1)} ${(cy + ry * 1).toFixed(1)} ${bottom[0].toFixed(1)} ${bottom[1].toFixed(1)}`,
    // Q2: bottom → left
    `C ${(cx - rx * k + cj(2)).toFixed(1)} ${(cy + ry * 1).toFixed(1)} ${(cx - rx * 1).toFixed(1)} ${(cy + ry * k + cj(3)).toFixed(1)} ${left[0].toFixed(1)} ${left[1].toFixed(1)}`,
    // Q3: left → top
    `C ${(cx - rx * 1).toFixed(1)} ${(cy - ry * k + cj(4)).toFixed(1)} ${(cx - rx * k + cj(5)).toFixed(1)} ${(cy - ry * 1).toFixed(1)} ${top[0].toFixed(1)} ${top[1].toFixed(1)}`,
    // Q4: top → right (close)
    `C ${(cx + rx * k + cj(6)).toFixed(1)} ${(cy - ry * 1).toFixed(1)} ${(cx + rx * 1).toFixed(1)} ${(cy - ry * k + cj(7)).toFixed(1)} ${right[0].toFixed(1)} ${right[1].toFixed(1)}`,
    "Z",
  ].join(" ");

  return d;
}

/**
 * Generate a smooth hand-drawn line path with 1-2 gentle bends.
 * Uses a single cubic bezier with subtle perpendicular offset.
 */
export function handDrawnLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  seed: number = 0
): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const jitter = Math.min(len * 0.025, 2.5); // Gentler: max 2.5px jitter
  // Perpendicular offset for a single gentle bend
  const nx = -dy / len;
  const ny = dx / len;
  const cp1x = x1 + dx * 0.33 + nx * jitter * Math.sin(seed * 1.3);
  const cp1y = y1 + dy * 0.33 + ny * jitter * Math.cos(seed * 2.1);
  const cp2x = x1 + dx * 0.66 + nx * jitter * Math.sin(seed * 3.7);
  const cp2y = y1 + dy * 0.66 + ny * jitter * Math.cos(seed * 1.9);

  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)} ${cp2x.toFixed(1)} ${cp2y.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

// --- DataFlowSourceItem (wrapper for sub-source registration) ---

export function DataFlowSourceItem({
  id,
  label,
  value,
  children,
}: {
  id: string;
  label: string;
  value: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const ctx = useOptionalDataFlow();

  useEffect(() => {
    if (!ctx) return;
    ctx.registerSource(id, ref, { label, value });
    return () => ctx.unregisterSource(id);
  }, [id, label, value, ctx]);

  return <div ref={ref} data-dataflow-source={id}>{children}</div>;
}

// --- Section icon mapping ---

const SECTION_ICONS: Record<string, string> = {
  "section-assets": "💰",
  "section-debts": "💳",
  "section-income": "💵",
  "section-expenses": "🧾",
  "section-property": "🏠",
  "section-stocks": "📊",
};

// --- SourceSummaryCard ---

export function SourceSummaryCard({
  sourceId,
  sectionName,
  items,
  total,
  isPositive,
  ovalSeed,
  homeCurrency,
}: {
  sourceId: string;
  sectionName: string;
  items?: SourceMetadataItem[];
  total: string;
  isPositive: boolean;
  ovalSeed: number;
  homeCurrency?: SupportedCurrency;
}) {
  const icon = SECTION_ICONS[sourceId] || "";
  const cur = homeCurrency ?? "USD";

  return (
    <div
      className={`relative flex flex-col rounded-xl border-l-4 bg-white p-5 shadow-sm ${
        isPositive ? "border-l-green-500" : "border-l-rose-500"
      }`}
      data-testid={`source-summary-${sourceId}`}
    >
      {/* Header: icon + title */}
      <div className="mb-2 flex items-center gap-2">
        {icon && <span aria-hidden="true" className="text-base">{icon}</span>}
        <span className="text-sm font-semibold text-stone-700" data-testid={`source-summary-title-${sourceId}`}>{sectionName}</span>
      </div>

      {/* Scrollable item list */}
      {items && items.length > 0 && (
        <div className="max-h-[200px] overflow-y-auto mb-3 scrollbar-thin" data-testid={`source-summary-items-${sourceId}`}>
          <ul className="space-y-1">
            {items.map((item, i) => {
              const itemCur = item.currency ?? cur;
              const showCurrencyCode = item.currency && item.currency !== cur;
              return (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="text-stone-500 truncate mr-2">{item.label}</span>
                  <span className="font-medium text-stone-700 whitespace-nowrap">
                    {formatCurrency(Math.abs(item.value), itemCur)}
                    {showCurrencyCode && <span className="ml-1 text-xs text-stone-400">{itemCur}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Total with hand-drawn oval — sticky at bottom */}
      <div className="sticky bottom-0 flex items-center justify-between border-t border-stone-100 pt-2 bg-white shadow-[0_-2px_4px_rgba(0,0,0,0.05)]" data-testid={`source-summary-total-row-${sourceId}`}>
        <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">Total</span>
        <div className="relative">
          <span
            className={`text-xl font-bold ${isPositive ? "text-green-600" : "text-rose-600"}`}
            data-testid={`source-summary-total-${sourceId}`}
          >
            {total}
          </span>
          {/* Hand-drawn oval annotation */}
          <svg
            className="pointer-events-none absolute -inset-2 h-[calc(100%+16px)] w-[calc(100%+16px)]"
            viewBox="0 0 100 40"
            preserveAspectRatio="none"
            aria-hidden="true"
            data-testid={`source-summary-oval-${sourceId}`}
          >
            <path
              d={handDrawnOval(50, 20, 45, 16, ovalSeed)}
              fill="none"
              stroke={isPositive ? "#059669" : "#e11d48"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.7"
              className="animate-draw-oval"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

// --- ConnectorLine: hand-drawn line with arrowhead ---

function ConnectorLine({
  isPositive,
  seed,
  index,
}: {
  isPositive: boolean;
  seed: number;
  index: number;
}) {
  const color = isPositive ? "#059669" : "#e11d48";
  const delayMs = 400 + index * 50; // Stagger connector draws
  return (
    <svg
      className="mx-auto h-6 w-12"
      viewBox="0 0 48 24"
      aria-hidden="true"
      data-testid={`explainer-connector-${index}`}
    >
      {/* Arrow marker definition */}
      <defs>
        <marker
          id={`arrowhead-${index}`}
          markerWidth="8"
          markerHeight="6"
          refX="8"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" fill={color} opacity="0.7" />
        </marker>
      </defs>
      <path
        d={handDrawnLine(24, 2, 24, 18, seed)}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
        markerEnd={`url(#arrowhead-${index})`}
        className="animate-draw-connector"
        style={{ animationDelay: `${delayMs}ms` }}
      />
    </svg>
  );
}

// --- CountUpValue: animated count-up for result ---

function CountUpValue({ formattedValue }: { formattedValue: string }) {
  const [displayed, setDisplayed] = useState(formattedValue);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    // Parse numeric value from formatted string like "$30,000" or "-$230,000"
    const numMatch = formattedValue.replace(/[^0-9.-]/g, "");
    const target = parseFloat(numMatch) || 0;
    if (target === 0) {
      setDisplayed(formattedValue);
      return;
    }

    const prefix = formattedValue.match(/^[^0-9]*/)?.[0] || "";
    const suffix = formattedValue.match(/[^0-9]*$/)?.[0] || "";
    const isNegative = formattedValue.includes("-");
    const absTarget = Math.abs(target);

    const startTime = performance.now();
    const startDelay = 1000; // Wait for earlier animations
    const duration = 200; // Count up duration

    const animate = (now: number) => {
      const elapsed = now - startTime;
      if (elapsed < startDelay) {
        setDisplayed(isNegative ? `${prefix}0${suffix}` : `${prefix}0${suffix}`);
        rafRef.current = requestAnimationFrame(animate);
        return;
      }
      const t = Math.min((elapsed - startDelay) / duration, 1);
      // Ease out quad
      const eased = 1 - (1 - t) * (1 - t);
      const current = Math.round(absTarget * eased);
      const formatted = current.toLocaleString();
      setDisplayed(
        isNegative ? `-${prefix.replace("-", "")}${formatted}${suffix}` : `${prefix}${formatted}${suffix}`
      );
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayed(formattedValue);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [formattedValue]);

  return <>{displayed}</>;
}

// --- TaxExplainerContent ---

// Color palette for bracket tiers: lighter green for low rates, deeper teal for higher
const BRACKET_COLORS = [
  "#d1fae5", "#a7f3d0", "#6ee7b7", "#34d399", "#10b981", "#059669", "#047857", "#065f46",
];

function TieredBracketBars({
  title,
  brackets,
  isZeroIncome,
  subtotal,
  testIdPrefix,
  homeCurrency,
}: {
  title: string;
  brackets: TaxBracketSegment[];
  isZeroIncome: boolean;
  subtotal: number;
  testIdPrefix: string;
  homeCurrency?: SupportedCurrency;
}) {
  const fmt = (n: number) => formatCurrency(Math.abs(n), homeCurrency ?? "USD");
  const fmtRange = (min: number, max: number) => {
    if (max >= Infinity || max >= 1e12) return `${fmt(min)}+`;
    return `${fmt(min)} – ${fmt(max)}`;
  };

  if (brackets.length === 0) return null;

  // For fill percentage, we need the bracket capacity
  const getBracketCapacity = (seg: TaxBracketSegment) => {
    if (seg.max >= Infinity || seg.max >= 1e12) {
      // Unbounded top bracket — use amountInBracket as capacity (fills 100% if any income)
      return seg.amountInBracket > 0 ? seg.amountInBracket : 1;
    }
    return seg.max - seg.min;
  };

  return (
    <div data-testid={`${testIdPrefix}-table`}>
      <p className="mb-2 text-xs font-medium text-stone-500 uppercase tracking-wide">{title}</p>
      <div className="flex flex-col-reverse gap-1.5">
        {brackets.map((seg, i) => {
          const capacity = getBracketCapacity(seg);
          const fillPct = isZeroIncome ? 0 : Math.min((seg.amountInBracket / capacity) * 100, 100);
          const isFilled = seg.amountInBracket > 0 && !isZeroIncome;
          const color = BRACKET_COLORS[Math.min(i, BRACKET_COLORS.length - 1)];

          return (
            <div
              key={i}
              className="relative"
              data-testid={`${testIdPrefix}-row-${i}`}
            >
              {/* Bar container */}
              <div
                className={`relative h-9 w-full rounded-lg overflow-hidden border transition-colors ${
                  isFilled ? "border-stone-200" : "border-stone-200 border-dashed"
                }`}
                style={{ backgroundColor: isFilled ? "#f5f5f4" : "#fafaf9" }}
              >
                {/* Fill bar */}
                {isFilled && (
                  <div
                    className="absolute inset-y-0 left-0 rounded-lg transition-all duration-300"
                    style={{ width: `${fillPct}%`, backgroundColor: color }}
                    data-testid={`${testIdPrefix}-fill-${i}`}
                  />
                )}
                {/* Content overlay */}
                <div className="absolute inset-0 flex items-center justify-between px-3">
                  <span className="text-xs text-stone-500 truncate mr-2">
                    {fmtRange(seg.min, seg.max)}
                  </span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs font-bold ${
                        isFilled
                          ? i >= 4 ? "text-white" : "text-emerald-800"
                          : "text-stone-400"
                      }`}
                      style={isFilled && fillPct > 40 ? { textShadow: i >= 4 ? "0 1px 2px rgba(0,0,0,0.2)" : undefined } : undefined}
                    >
                      {(seg.rate * 100).toFixed(1)}%
                    </span>
                    <span className={`text-xs ${isFilled ? "font-semibold text-stone-700" : "text-stone-400"}`}>
                      {isZeroIncome ? "—" : isFilled ? fmt(seg.taxInBracket) : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {!isZeroIncome && (
        <div className="mt-1.5 flex justify-end">
          <span className="text-xs font-semibold text-stone-700" data-testid={`${testIdPrefix}-subtotal`}>
            {title.split(" ")[0]} total: {fmt(subtotal)}
          </span>
        </div>
      )}
    </div>
  );
}

function TaxExplainerContent({ details, homeCurrency }: { details: TaxExplainerDetails; homeCurrency?: SupportedCurrency }) {
  const cur = homeCurrency ?? "USD";
  const fmt = (n: number) => formatCurrency(Math.abs(n), cur);

  const isZeroIncome = details.grossIncome <= 0;

  const federalSubtotal = details.brackets.reduce((s, b) => s + b.taxInBracket, 0);
  const provincialSubtotal = (details.provincialBrackets ?? []).reduce((s, b) => s + b.taxInBracket, 0);

  const provincialTableTitle = `${details.jurisdictionType}: ${details.jurisdictionLabel} Tax Brackets`;

  return (
    <div className="space-y-5" data-testid="tax-explainer">
      {/* Zero income message */}
      {isZeroIncome && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4" data-testid="tax-zero-income-message">
          <p className="text-sm text-stone-600">
            No income entered — add income to see your estimated tax breakdown.
          </p>
          <p className="mt-1 text-sm text-stone-500">
            Here are the <span className="font-semibold">{details.jurisdictionLabel}</span> tax brackets for reference:
          </p>
        </div>
      )}

      {/* Federal tiered bracket bars */}
      <TieredBracketBars
        title="Federal Tax Brackets"
        brackets={details.brackets}
        isZeroIncome={isZeroIncome}
        subtotal={federalSubtotal}
        testIdPrefix="tax-federal-brackets"
        homeCurrency={cur}
      />

      {/* Provincial/State tiered bracket bars */}
      {details.provincialBrackets && details.provincialBrackets.length > 0 && (
        <TieredBracketBars
          title={provincialTableTitle}
          brackets={details.provincialBrackets}
          isZeroIncome={isZeroIncome}
          subtotal={provincialSubtotal}
          testIdPrefix="tax-provincial-brackets"
          homeCurrency={cur}
        />
      )}

      {/* Federal & Provincial/State totals */}
      <div className="space-y-1.5" data-testid="tax-breakdown">
        <div className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2">
          <span className="text-sm text-stone-600">Federal</span>
          <span className="text-sm font-semibold text-stone-800" data-testid="tax-federal-amount">{fmt(details.federalTax)}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2">
          <span className="text-sm text-stone-600">{details.jurisdictionType}: {details.jurisdictionLabel}</span>
          <span className="text-sm font-semibold text-stone-800" data-testid="tax-provincial-amount">{fmt(details.provincialStateTax)}</span>
        </div>
      </div>

      {/* Effective vs marginal rate */}
      <div className="rounded-xl border border-stone-200 p-4" data-testid="tax-rates">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-stone-800" data-testid="tax-effective-rate">
              {(details.effectiveRate * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-stone-500">Effective rate</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-stone-500" data-testid="tax-marginal-rate">
              {(details.marginalRate * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-stone-400">Marginal rate</p>
          </div>
        </div>
        {details.marginalRate > details.effectiveRate && (
          <p className="mt-2 text-xs text-stone-400">
            Your effective rate is lower because only income above each bracket threshold is taxed at the higher rate.
          </p>
        )}
      </div>

      {/* Capital gains section */}
      {details.hasCapitalGains && details.capitalGainsInfo && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4" data-testid="tax-capital-gains">
          <p className="text-sm font-semibold text-stone-700 mb-1">Capital Gains</p>
          {details.capitalGainsInfo.country === "CA" ? (
            <div className="text-xs text-stone-600 space-y-1">
              <p>Canada taxes capital gains at a reduced inclusion rate:</p>
              <p className="font-medium">First $250,000: 50% included in income</p>
              {details.capitalGainsInfo.totalCapitalGains > 250000 && (
                <p className="font-medium">Above $250,000: 66.67% included</p>
              )}
            </div>
          ) : (
            <div className="text-xs text-stone-600 space-y-1">
              <p>US long-term capital gains have their own bracket rates:</p>
              <p className="font-medium">0% up to $48,350 · 15% up to $533,400 · 20% above</p>
            </div>
          )}
        </div>
      )}

      {/* Investment income tax section */}
      {details.investmentIncomeTax && details.investmentIncomeTax.accounts.length > 0 && (
        <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4" data-testid="tax-investment-income">
          <p className="text-sm font-semibold text-stone-700 mb-2">Investment Interest Income</p>
          <div className="space-y-1 mb-3">
            {details.investmentIncomeTax.accounts.map((acct, i) => (
              <div key={i} className="flex items-center justify-between text-xs text-stone-600" data-testid={`tax-investment-account-${i}`}>
                <span>{acct.label} ({fmt(acct.balance)} × {acct.roi.toFixed(1)}%)</span>
                <span className="font-semibold">{fmt(acct.annualInterest)}/yr</span>
              </div>
            ))}
            {details.investmentIncomeTax.accounts.length > 1 && (
              <div className="flex items-center justify-between text-xs font-semibold text-stone-700 border-t border-amber-200 pt-1 mt-1">
                <span>Total investment interest</span>
                <span>{fmt(details.investmentIncomeTax.totalAnnualInterest)}/yr</span>
              </div>
            )}
          </div>
          <p className="text-xs text-stone-500">
            Interest income is taxed annually as ordinary income. Capital gains and tax-deferred withdrawals are taxed only when realized.
          </p>
        </div>
      )}

      {/* After-tax income flow (only when there's income) */}
      {!isZeroIncome && (
        <div className="flex items-center justify-between rounded-xl bg-stone-50 px-4 py-3" data-testid="tax-after-tax-flow">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-stone-500">Gross</span>
            <span className="font-semibold text-stone-800">{fmt(details.grossIncome)}</span>
            <span className="text-stone-400">→</span>
            <span className="text-stone-500">Tax</span>
            <span className="font-semibold text-rose-600">{fmt(details.totalTax)}</span>
            <span className="text-stone-400">→</span>
            <span className="text-stone-500">After-tax</span>
            <span className="font-semibold text-green-600">{fmt(details.afterTaxIncome)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// --- RunwayExplainerContent ---

function RunwayExplainerContent({ details, homeCurrency }: { details: RunwayExplainerDetails; homeCurrency?: SupportedCurrency }) {
  const fmt = (n: number) => formatCurrency(Math.abs(n), homeCurrency ?? "USD");

  return (
    <div className="space-y-5" data-testid="runway-explainer">
      {/* Note pointing to unified chart */}
      <p className="text-xs text-stone-500 italic" data-testid="runway-chart-note">
        Switch to &quot;Income Stops&quot; mode on the projection chart above for the full burndown visualization.
      </p>

      {/* Monthly obligation breakdown */}
      <div className="rounded-xl border border-stone-200 p-4" data-testid="runway-monthly-obligations">
        <p className="mb-2 text-xs font-medium text-stone-500 uppercase tracking-wide">Monthly Obligations</p>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-stone-600">{fmt(details.monthlyExpenses)} expenses</span>
          {details.monthlyMortgage > 0 && (
            <>
              <span className="text-stone-400">+</span>
              <span className="text-stone-600">{fmt(details.monthlyMortgage)} mortgage</span>
            </>
          )}
          <span className="text-stone-400">=</span>
          <span className="font-semibold text-stone-800">{fmt(details.monthlyTotal)}/mo</span>
        </div>
      </div>

      {/* Withdrawal Tax Impact */}
      {details.withdrawalOrder.length > 0 && (() => {
        const totalLiquid = details.withdrawalOrder.reduce((sum, e) => sum + e.startingBalance, 0);
        // Group by treatment
        const grouped: Record<string, { categories: string[]; total: number }> = {
          "tax-free": { categories: [], total: 0 },
          "taxable-income": { categories: [], total: 0 },
          "taxable-capgains": { categories: [], total: 0 },
          "tax-deferred": { categories: [], total: 0 },
        };
        for (const entry of details.withdrawalOrder) {
          if (entry.taxTreatment === "taxable") {
            const key = entry.roiTaxTreatment === "income" ? "taxable-income" : "taxable-capgains";
            grouped[key].categories.push(entry.category);
            grouped[key].total += entry.startingBalance;
          } else {
            const g = grouped[entry.taxTreatment];
            if (g) {
              g.categories.push(entry.category);
              g.total += entry.startingBalance;
            }
          }
        }
        const treatments = [
          { label: "Tax-free", sublabel: "No tax on withdrawal", color: "bg-green-100 text-green-700 border-green-200", barColor: "bg-green-400", data: grouped["tax-free"] },
          { label: "Taxable (Interest)", sublabel: "Returns taxed annually as income", color: "bg-orange-50 text-orange-700 border-orange-200", barColor: "bg-orange-400", data: grouped["taxable-income"] },
          { label: "Taxable (Capital Gains)", sublabel: "Gains taxed only on withdrawal", color: "bg-amber-50 text-amber-700 border-amber-200", barColor: "bg-amber-400", data: grouped["taxable-capgains"] },
          { label: "Tax-deferred", sublabel: "Full withdrawal taxed as income", color: "bg-rose-50 text-rose-700 border-rose-200", barColor: "bg-rose-400", data: grouped["tax-deferred"] },
        ];

        return (
          <div data-testid="runway-withdrawal-tax">
            <p className="mb-2 text-xs font-medium text-stone-500 uppercase tracking-wide">Withdrawal Tax Impact</p>

            {/* Tax drag summary */}
            {details.taxDragMonths !== undefined && details.taxDragMonths > 0.5 && (
              <p className="mb-3 text-sm text-amber-600" data-testid="runway-tax-drag-summary">
                Withdrawal taxes reduce your runway by ~{details.taxDragMonths.toFixed(1)} months
              </p>
            )}
            {details.taxDragMonths !== undefined && details.taxDragMonths <= 0.5 && (
              <p className="mb-3 text-sm text-green-600" data-testid="runway-tax-drag-summary">
                Minimal withdrawal tax impact on your runway
              </p>
            )}

            {/* Tax treatment breakdown bar */}
            {totalLiquid > 0 && (
              <div className="mb-3">
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-stone-100" data-testid="runway-tax-treatment-bar">
                  {treatments.map((t) => {
                    const pct = (t.data.total / totalLiquid) * 100;
                    if (pct <= 0) return null;
                    return (
                      <div
                        key={t.label}
                        className={`${t.barColor} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                        title={`${t.label}: ${fmt(t.data.total)} (${Math.round(pct)}%)`}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Account groupings by treatment */}
            <div className="mb-3 space-y-2" data-testid="runway-tax-account-groups">
              {treatments.map((t) => {
                if (t.data.total <= 0) return null;
                const pct = totalLiquid > 0 ? Math.round((t.data.total / totalLiquid) * 100) : 0;
                return (
                  <div key={t.label} className={`rounded-lg border px-3 py-2 ${t.color}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">{t.label}</span>
                      <span className="text-xs font-medium">{fmt(t.data.total)} ({pct}%)</span>
                    </div>
                    <p className="mt-0.5 text-xs opacity-75">{t.sublabel}</p>
                    <p className="mt-0.5 text-xs opacity-60">{t.data.categories.join(", ")}</p>
                  </div>
                );
              })}
            </div>

            {/* Suggested withdrawal order */}
            <p className="mb-2 text-xs font-medium text-stone-500 uppercase tracking-wide">Suggested Withdrawal Order</p>
            <ol className="space-y-1.5">
              {details.withdrawalOrder.map((entry, i) => {
                const treatmentLabel = entry.taxTreatment === "tax-free" ? "tax-free"
                  : entry.taxTreatment === "tax-deferred" ? "taxed as income"
                  : "capital gains";
                return (
                  <li key={i} className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2" data-testid={`withdrawal-order-${i}`}>
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-stone-200 text-xs font-bold text-stone-600">{i + 1}</span>
                      <span className="text-sm text-stone-700">{entry.category}</span>
                      <span className="text-xs text-stone-400">({treatmentLabel})</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-stone-800">{fmt(entry.startingBalance)}</span>
                      {entry.estimatedTaxCost > 0 && (
                        <span className="ml-1.5 text-xs text-amber-600">~{fmt(entry.estimatedTaxCost)} tax</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
            <p className="mt-1.5 text-xs text-stone-400 italic" data-testid="withdrawal-order-disclaimer">
              We don&apos;t have full visibility into each account&apos;s tax implications — this is a rough suggestion. Consult a tax professional for personalized advice.
            </p>
          </div>
        );
      })()}
    </div>
  );
}

// --- InvestmentReturnsSummary ---

function InvestmentReturnsSummary({ returns, homeCurrency }: { returns: SurplusInvestmentReturn[]; homeCurrency?: SupportedCurrency }) {
  const cur = homeCurrency ?? "USD";
  const fmt = (n: number) => formatCurrency(Math.abs(n), cur);
  const fmtBalance = (n: number) => {
    const symbol = cur === "CAD" ? "CA$" : "$";
    if (n >= 1000) return `${symbol}${(n / 1000).toFixed(0)}k`;
    return `${symbol}${n.toFixed(0)}`;
  };
  const totalReturns = returns.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div
      className="my-3 rounded-xl border-2 border-dashed border-green-300 bg-green-50/50 p-4"
      data-testid="investment-returns-section"
    >
      <div className="mb-2 flex items-center gap-2">
        <span aria-hidden="true" className="text-base">📊</span>
        <span className="text-sm font-semibold text-stone-700">Investment Returns</span>
        <span className="text-xs text-stone-400 italic">(estimated)</span>
      </div>
      <ul className="space-y-1.5" data-testid="investment-returns-list">
        {returns.map((r, i) => (
          <li key={i} className="flex items-center justify-between text-sm">
            <span className="text-stone-500 truncate mr-2">
              {r.label} ({fmtBalance(r.balance)} @ {r.roi}%)
            </span>
            <span className="font-medium text-green-600 whitespace-nowrap">
              +{fmt(r.amount)}/mo
            </span>
          </li>
        ))}
      </ul>
      {returns.length > 1 && (
        <div className="mt-2 flex items-center justify-between border-t border-green-200 pt-2">
          <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">Total Returns</span>
          <span className="text-sm font-bold text-green-600" data-testid="investment-returns-total">
            +{fmt(totalReturns)}/mo
          </span>
        </div>
      )}
    </div>
  );
}

// --- ExplainerModal ---

function ExplainerModal({
  connections,
  targetMeta,
  onClose,
  getSourceMetadata,
  homeCurrency: homeCurrencyProp = "USD" as SupportedCurrency,
}: {
  connections: ActiveConnection[];
  targetMeta: ActiveTargetMeta;
  onClose: () => void;
  getSourceMetadata: (id: string) => SourceMetadata | undefined;
  homeCurrency?: SupportedCurrency;
}) {
  const [closing, setClosing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 200);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleClose]);

  // Trap focus within modal
  useEffect(() => {
    const el = modalRef.current;
    if (el) {
      const focusable = el.querySelector<HTMLElement>("button, [tabindex]");
      focusable?.focus();
    }
  }, []);

  // Group connections by sign for arithmetic display
  const positiveConns = connections.filter((c) => c.sign !== "negative");
  const negativeConns = connections.filter((c) => c.sign === "negative");

  return (
    <div
      data-testid="explainer-backdrop"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 ${closing ? "animate-modal-out" : "animate-modal-in"}`}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      aria-modal="true"
      role="dialog"
      aria-label={`How ${targetMeta.label} is calculated`}
    >
      <div
        ref={modalRef}
        data-testid="explainer-modal"
        className={`relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8 ${closing ? "animate-modal-content-out" : "animate-modal-content-in"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-3 top-3 rounded-full p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label="Close explainer"
          data-testid="explainer-close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Metric title & value */}
        <div className="mb-6 text-center">
          <h2 className="text-lg font-semibold text-stone-700" data-testid="explainer-title">{targetMeta.label}</h2>
          <p className="mt-1 text-3xl font-bold text-stone-900" data-testid="explainer-value">{targetMeta.formattedValue}</p>
        </div>

        {/* Metric-specific content or generic source cards */}
        {targetMeta.metricType === "estimated-tax" && targetMeta.taxDetails ? (
          <TaxExplainerContent details={targetMeta.taxDetails} homeCurrency={homeCurrencyProp} />
        ) : targetMeta.metricType === "financial-runway" && targetMeta.runwayDetails ? (
          <RunwayExplainerContent details={targetMeta.runwayDetails} homeCurrency={homeCurrencyProp} />
        ) : (
          <>
            {/* Source summary cards with connectors */}
            <div className="space-y-1" data-testid="explainer-sources">
              {connections.map((conn, i) => {
                const meta = getSourceMetadata(conn.sourceId);
                const isPositive = conn.sign !== "negative";
                const showOperator = i > 0;
                const sectionName = meta?.label || conn.label || conn.sourceId.replace("section-", "");
                const displayValue = formatCurrency(conn.value ?? 0, homeCurrencyProp);
                const cardDelay = i * 50; // Stagger card fade-ins

                return (
                  <div key={conn.sourceId + i} data-testid={`explainer-source-${conn.sourceId}`}>
                    {showOperator && (
                      <div className="flex justify-center py-1">
                        <span
                          className={`text-2xl font-bold animate-operator-in ${isPositive ? "text-green-600" : "text-rose-600"}`}
                          data-testid={`explainer-operator-${i}`}
                          style={{ animationDelay: `${600 + i * 50}ms` }}
                        >
                          {isPositive ? "+" : "\u2212"}
                        </span>
                      </div>
                    )}
                    <div
                      className="animate-source-card-in"
                      style={{ animationDelay: `${cardDelay}ms` }}
                    >
                      <SourceSummaryCard
                        sourceId={conn.sourceId}
                        sectionName={sectionName}
                        items={meta && Math.abs(meta.value - (conn.value ?? 0)) < 1 ? meta.items : undefined}
                        total={displayValue}
                        isPositive={isPositive}
                        ovalSeed={i + 1}
                        homeCurrency={homeCurrencyProp}
                      />
                    </div>
                    {/* Connector line from this card toward the result */}
                    <ConnectorLine
                      isPositive={isPositive}
                      seed={i + 10}
                      index={i}
                    />
                  </div>
                );
              })}
            </div>

            {/* Sum bar and result */}
            <div className="mt-2" data-testid="explainer-result-section">
              {/* Hand-drawn horizontal sum bar */}
              <svg className="h-3 w-full" viewBox="0 0 400 12" preserveAspectRatio="none" aria-hidden="true" data-testid="explainer-sum-bar">
                <path
                  d={handDrawnLine(10, 6, 390, 6, 42)}
                  fill="none"
                  stroke="#78716c"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.7"
                  className="animate-draw-sum-bar"
                />
              </svg>
              <div className="mt-3 flex items-center justify-center gap-2 animate-result-in" data-testid="explainer-result-area">
                <span className="text-xl font-bold text-stone-500">=</span>
                <span className="text-2xl font-bold text-stone-900" data-testid="explainer-result-value">
                  <CountUpValue formattedValue={targetMeta.formattedValue} />
                </span>
              </div>
              {/* Summary: positive vs negative */}
              {positiveConns.length > 0 && negativeConns.length > 0 && (
                <p className="mt-2 text-center text-xs text-stone-400 animate-result-in" data-testid="explainer-summary" style={{ animationDelay: "1100ms" }}>
                  {positiveConns.map((c) => c.label || getSourceMetadata(c.sourceId)?.label || c.sourceId).join(" + ")}
                  {" \u2212 "}
                  {negativeConns.map((c) => c.label || getSourceMetadata(c.sourceId)?.label || c.sourceId).join(" \u2212 ")}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export { ExplainerModal, ConnectorLine, CountUpValue, TaxExplainerContent, RunwayExplainerContent, InvestmentReturnsSummary };

// --- Provider ---

export function DataFlowProvider({ children, homeCurrency = "USD" as import("@/lib/currency").SupportedCurrency }: { children: ReactNode; homeCurrency?: import("@/lib/currency").SupportedCurrency }) {
  const sourcesRef = useRef<Map<string, RegisteredElement>>(new Map());
  const targetsRef = useRef<Map<string, RegisteredElement>>(new Map());
  const [activeTarget, setActiveTarget] = useState<string | null>(null);
  const [activeConnections, setActiveConnections] = useState<
    ActiveConnection[]
  >([]);
  const [activeTargetMeta, setActiveTargetMeta] =
    useState<ActiveTargetMeta | null>(null);

  const registerSource = useCallback(
    (
      id: string,
      ref: RefObject<HTMLElement | null>,
      metadata?: SourceMetadata
    ) => {
      sourcesRef.current.set(id, { ref, metadata });
    },
    []
  );

  const unregisterSource = useCallback((id: string) => {
    sourcesRef.current.delete(id);
  }, []);

  const registerTarget = useCallback(
    (id: string, ref: RefObject<HTMLElement | null>) => {
      targetsRef.current.set(id, { ref });
    },
    []
  );

  const unregisterTarget = useCallback((id: string) => {
    targetsRef.current.delete(id);
  }, []);

  const getSourceMetadata = useCallback((id: string) => {
    return sourcesRef.current.get(id)?.metadata;
  }, []);

  const handleClose = useCallback(() => {
    setActiveConnections([]);
    setActiveTarget(null);
    setActiveTargetMeta(null);
  }, []);

  const value: DataFlowContextValue = {
    registerSource,
    unregisterSource,
    registerTarget,
    unregisterTarget,
    setActiveTarget,
    activeTarget,
    activeConnections,
    setActiveConnections,
    activeTargetMeta,
    setActiveTargetMeta,
    getSourceMetadata,
    homeCurrency,
  };

  return (
    <DataFlowContext.Provider value={value}>
      {children}
      {activeTarget && activeTargetMeta && activeConnections.length > 0 && (
        <ExplainerModal
          connections={activeConnections}
          targetMeta={activeTargetMeta}
          onClose={handleClose}
          getSourceMetadata={getSourceMetadata}
          homeCurrency={homeCurrency}
        />
      )}
    </DataFlowContext.Provider>
  );
}
