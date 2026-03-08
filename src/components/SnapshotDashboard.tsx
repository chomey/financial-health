"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { generateInsights, type FinancialData, type InsightType } from "@/lib/insights";
import { useOptionalDataFlow, type ActiveConnection, prioritizeConnections, type ActiveTargetMeta, type TaxExplainerDetails, type RunwayExplainerDetails, type IncomeReplacementExplainerDetails } from "@/components/DataFlowArrows";

interface MetricData {
  title: string;
  value: number;
  format: "currency" | "months" | "ratio" | "percent";
  icon: string;
  tooltip: string;
  positive: boolean;
  breakdown?: string;
  effectiveRate?: number;
  valueWithEquity?: number; // net worth including property equity
  ratioWithoutMortgage?: number; // debt-to-asset ratio excluding mortgage
  runwayWithGrowth?: number; // runway in months factoring in asset ROR
  runwayAfterTax?: number; // runway in months after withdrawal taxes
  taxDetails?: TaxExplainerDetails; // detailed tax breakdown for explainer
  runwayDetails?: RunwayExplainerDetails; // detailed runway breakdown for explainer
  investmentReturns?: import("@/lib/financial-state").MonthlyInvestmentReturn[]; // per-asset monthly ROI for surplus explainer
  incomeReplacementDetails?: IncomeReplacementExplainerDetails; // detailed income replacement breakdown for explainer
  taxCreditsApplied?: boolean; // whether tax credits are factored into the displayed tax
}

// Mock values based on existing entry component mock data
const MOCK_METRICS: MetricData[] = [
  {
    title: "Net Worth",
    value: -229500,
    format: "currency",
    icon: "💰",
    tooltip:
      "Your total assets minus total debts. This is a snapshot — it changes as you pay down debts and grow savings.",
    positive: false,
  },
  {
    title: "Monthly Cash Flow",
    value: 3350,
    format: "currency",
    icon: "📈",
    tooltip:
      "How much more you earn than you spend each month. A positive surplus means you're building wealth.",
    positive: true,
  },
  {
    title: "Financial Runway",
    value: 22.2,
    format: "months",
    icon: "🛡️",
    tooltip:
      "How many months your liquid assets could cover your expenses. 3–6 months is a solid emergency fund.",
    positive: true,
  },
  {
    title: "Debt-to-Asset Ratio",
    value: 4.5,
    format: "ratio",
    icon: "⚖️",
    tooltip:
      "Your total debts divided by your total assets. A lower ratio means stronger financial footing. Mortgages often push this higher — that's normal.",
    positive: false,
  },
];

function formatMetricValue(value: number, format: MetricData["format"], currencyCode?: string): string {
  switch (format) {
    case "currency": {
      const absValue = Math.abs(value);
      const num = absValue.toLocaleString("en-US", { maximumFractionDigits: 0 });
      const formatted = `$${num}`;
      return value < 0 ? `-${formatted}` : formatted;
    }
    case "months":
      return `${value.toFixed(1)} mo`;
    case "ratio":
      return `${value.toFixed(2)}`;
    case "percent":
      return `${Math.round(value)}%`;
  }
}

export interface DataFlowConnectionDef {
  sourceId: string;
  label?: string;
  value?: number;
  sign: "positive" | "negative";
  items?: { label: string; value: number }[];
}

export { formatMetricValue, MOCK_METRICS };
export type { MetricData };

// Map metric titles to insight types for matching
const METRIC_TO_INSIGHT_TYPES: Record<string, InsightType[]> = {
  "Net Worth": ["net-worth"],
  "Monthly Cash Flow": ["surplus", "savings-rate"],
  "Estimated Tax": ["tax"],
  "Financial Runway": ["runway", "withdrawal-tax"],
  "Debt-to-Asset Ratio": ["debt-interest", "debt-to-income"],
  "Income Replacement": ["income-replacement", "coast-fire"],
};

function useCountUp(target: number, duration: number = 1000): number {
  const [current, setCurrent] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(target * eased);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setCurrent(target);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [target, duration]);

  return current;
}

function MetricCard({ metric, insights, homeCurrency, connections }: { metric: MetricData; insights: string[]; homeCurrency?: string; connections?: DataFlowConnectionDef[] }) {
  const animatedValue = useCountUp(metric.value);
  const [showTooltip, setShowTooltip] = useState(false);
  const [ariaAnnouncement, setAriaAnnouncement] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);
  const ctx = useOptionalDataFlow();
  const targetId = `metric-${metric.title.toLowerCase().replace(/\s+/g, "-")}`;

  // Register as a data-flow target
  useEffect(() => {
    if (!ctx) return;
    ctx.registerTarget(targetId, cardRef);
    return () => ctx.unregisterTarget(targetId);
  }, [ctx, targetId]);

  const handleClick = useCallback(() => {
    if (!ctx || !connections || connections.length === 0) return;
    const isEstimatedTax = metric.title === "Estimated Tax";
    const filtered = connections.filter((c) => c.value === undefined || c.value > 0 || isEstimatedTax);
    const prioritized = prioritizeConnections(
      filtered.map((c) => ({
        sourceId: c.sourceId,
        targetId,
        label: c.label,
        value: c.value,
        sign: c.sign,
        items: c.items,
      }))
    );
    ctx.setActiveConnections(prioritized);
    ctx.setActiveTarget(targetId);
    const metricType = metric.title.toLowerCase().replace(/\s+/g, "-");
    ctx.setActiveTargetMeta({
      label: metric.title,
      formattedValue: formatMetricValue(metric.value, metric.format, homeCurrency),
      metricType,
      taxDetails: metricType === "estimated-tax" ? metric.taxDetails : undefined,
      runwayDetails: metricType === "financial-runway" ? metric.runwayDetails : undefined,
      investmentReturns: metricType === "monthly-surplus" ? metric.investmentReturns : undefined,
      incomeReplacementDetails: metricType === "income-replacement" ? metric.incomeReplacementDetails : undefined,
    });

    // Build aria-live announcement
    const parts = prioritized.map((c) => c.label || c.sourceId.replace("section-", ""));
    setAriaAnnouncement(`${metric.title} is calculated from: ${parts.join(", ")}`);
  }, [ctx, connections, targetId, metric.title, metric.value, metric.format, homeCurrency]);

  const valueColor = metric.positive
    ? "text-emerald-400"
    : metric.value < 0
      ? "text-red-400"
      : "text-slate-200";

  const hasConnections = connections && connections.length > 0;

  return (
    <div
      ref={cardRef}
      className={`relative rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-3 sm:p-5 shadow-sm ${
        hasConnections ? "cursor-pointer" : "cursor-default"
      }`}
      role="group"
      aria-label={metric.title}
      data-testid={`metric-card-${metric.title.toLowerCase().replace(/\s+/g, "-")}`}
      onClick={handleClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleClick(); } }}
      tabIndex={0}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-slate-400">{metric.title}</h3>
        <span className="text-lg" aria-hidden="true">
          {metric.icon}
        </span>
      </div>
      <p
        className={`mt-1.5 text-3xl font-bold ${valueColor}`}
        aria-label={`${metric.title}: ${formatMetricValue(metric.value, metric.format, homeCurrency)}`}
      >
        {formatMetricValue(animatedValue, metric.format, homeCurrency)}
      </p>
      {metric.valueWithEquity !== undefined && metric.valueWithEquity !== metric.value && (
        <p className="mt-0.5 text-sm text-slate-400" data-testid="net-worth-with-equity">
          ({formatMetricValue(metric.valueWithEquity, metric.format, homeCurrency)} with home equity)
        </p>
      )}
      {metric.ratioWithoutMortgage !== undefined && metric.ratioWithoutMortgage !== metric.value && (
        <p className="mt-0.5 text-sm text-slate-400" data-testid="ratio-without-mortgage">
          ({formatMetricValue(metric.ratioWithoutMortgage, metric.format, homeCurrency)} without mortgage)
        </p>
      )}
      {metric.format === "percent" && (
        <div className="mt-2" data-testid="income-replacement-progress">
          <div className="h-2 w-full rounded-full bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-emerald-500 to-emerald-400 transition-all duration-700"
              style={{ width: `${Math.min(100, animatedValue)}%` }}
              aria-hidden="true"
            />
          </div>
          {metric.breakdown && (
            <p className="mt-1 text-sm font-medium text-slate-400" data-testid="income-replacement-tier">
              {metric.breakdown}
            </p>
          )}
        </div>
      )}
      {metric.runwayWithGrowth !== undefined && (
        <p className="mt-0.5 text-sm text-slate-400" data-testid="runway-with-growth">
          ({metric.runwayWithGrowth === Infinity ? "∞" : formatMetricValue(metric.runwayWithGrowth, "months", homeCurrency)} with investment growth)
        </p>
      )}
      {metric.runwayAfterTax !== undefined && metric.runwayAfterTax !== metric.runwayWithGrowth && metric.runwayAfterTax !== metric.value && (
        <p className="mt-0.5 text-sm text-amber-400" data-testid="runway-after-tax">
          ({formatMetricValue(metric.runwayAfterTax, "months", homeCurrency)} after withdrawal taxes)
        </p>
      )}
      {/* Effective tax rate sub-line */}
      {metric.effectiveRate !== undefined && metric.effectiveRate > 0 && (
        <p className="mt-0.5 text-sm text-slate-400" data-testid="effective-tax-rate">
          {(metric.effectiveRate * 100).toFixed(1)}% effective rate
        </p>
      )}
      {/* Tax credits applied badge */}
      {metric.taxCreditsApplied && (
        <span className="mt-1 inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400" data-testid="tax-credits-applied-badge">
          Tax Credits Applied
        </span>
      )}
      {/* Contextual insights below value */}
      {insights.length > 0 && (
        <div className="mt-2 space-y-1">
          {insights.map((msg, i) => (
            <p key={i} className="text-sm font-medium text-emerald-400">{msg}</p>
          ))}
        </div>
      )}
      {/* Breakdown on hover — highlighted when data-flow arrows are active. Hidden for percent format (shown in progress bar section). */}
      {metric.breakdown && metric.format !== "percent" && (
        <p className={`mt-2 text-sm leading-relaxed transition-all duration-200 ${showTooltip ? `opacity-100 ${hasConnections ? "text-slate-300 font-medium" : "text-slate-500"}` : "opacity-0 h-0 overflow-hidden"}`} data-testid="metric-breakdown">
          {metric.breakdown}
        </p>
      )}
      <p className="mt-2 text-sm text-slate-500 leading-relaxed">
        {metric.tooltip}
      </p>
      {/* Click to explain hint */}
      {hasConnections && (
        <p className={`mt-2 flex items-center gap-1 text-sm text-slate-500 transition-opacity duration-200 ${showTooltip ? "opacity-100" : "opacity-0"}`} data-testid="click-to-explain-hint">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Click to explain
        </p>
      )}
      {/* Accessibility: announce data sources to screen readers */}
      <span className="sr-only" aria-live="polite" data-testid="dataflow-aria-live">
        {ariaAnnouncement}
      </span>
    </div>
  );
}

interface SnapshotDashboardProps {
  metrics?: MetricData[];
  financialData?: FinancialData;
  homeCurrency?: string;
  dataFlowConnections?: Record<string, DataFlowConnectionDef[]>;
}

export default function SnapshotDashboard({ metrics, financialData, homeCurrency, dataFlowConnections }: SnapshotDashboardProps = {}) {
  const displayMetrics = metrics ?? MOCK_METRICS;

  // Generate insights and map to metric cards
  const insightsByMetric = new Map<string, string[]>();
  if (financialData) {
    const allInsights = generateInsights(financialData);
    for (const metric of displayMetrics) {
      const types = METRIC_TO_INSIGHT_TYPES[metric.title] ?? [];
      const matched = allInsights
        .filter((ins) => types.includes(ins.type))
        .map((ins) => ins.message);
      insightsByMetric.set(metric.title, matched);
    }
  }

  return (
    <div className="space-y-3 sm:space-y-4" data-testid="snapshot-dashboard">
      {displayMetrics.map((metric) => (
        <MetricCard
          key={metric.title}
          metric={metric}
          insights={insightsByMetric.get(metric.title) ?? []}
          homeCurrency={homeCurrency}
          connections={dataFlowConnections?.[metric.title]}
        />
      ))}
    </div>
  );
}
