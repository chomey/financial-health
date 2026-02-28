"use client";

import { useEffect, useRef, useState } from "react";
import { generateInsights, type FinancialData, type InsightType } from "@/lib/insights";

interface MetricData {
  title: string;
  value: number;
  format: "currency" | "months" | "ratio";
  icon: string;
  tooltip: string;
  positive: boolean;
  breakdown?: string;
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
    title: "Monthly Surplus",
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

function formatMetricValue(value: number, format: MetricData["format"]): string {
  switch (format) {
    case "currency": {
      const absValue = Math.abs(value);
      const formatted = absValue.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      });
      return value < 0 ? `-${formatted}` : formatted;
    }
    case "months":
      return `${value.toFixed(1)} mo`;
    case "ratio":
      return `${value.toFixed(2)}`;
  }
}

export { formatMetricValue, MOCK_METRICS };
export type { MetricData };

// Map metric titles to insight types for matching
const METRIC_TO_INSIGHT_TYPES: Record<string, InsightType[]> = {
  "Net Worth": ["net-worth"],
  "Monthly Surplus": ["surplus", "savings-rate"],
  "Financial Runway": ["runway"],
  "Debt-to-Asset Ratio": ["debt-interest"],
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

function MetricCard({ metric, insights }: { metric: MetricData; insights: string[] }) {
  const animatedValue = useCountUp(metric.value);
  const [showTooltip, setShowTooltip] = useState(false);

  const valueColor = metric.positive
    ? "text-green-600"
    : metric.value < 0
      ? "text-rose-600"
      : "text-stone-700";

  // Celebratory glow for Financial Runway > 12 months
  const isRunwayCelebration =
    metric.title === "Financial Runway" &&
    metric.format === "months" &&
    metric.value > 12;

  return (
    <div
      className={`relative rounded-xl border bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-default ${
        isRunwayCelebration
          ? "border-green-300 ring-1 ring-green-200 animate-glow-pulse"
          : "border-stone-200"
      }`}
      role="group"
      aria-label={metric.title}
      data-runway-celebration={isRunwayCelebration || undefined}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
      tabIndex={0}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-stone-500">{metric.title}</h3>
        <span className="text-lg" aria-hidden="true">
          {metric.icon}
        </span>
      </div>
      <p
        className={`mt-1.5 text-3xl font-bold ${valueColor}`}
        aria-label={`${metric.title}: ${formatMetricValue(metric.value, metric.format)}`}
      >
        {formatMetricValue(animatedValue, metric.format)}
      </p>
      {/* Contextual insights below value */}
      {insights.length > 0 && (
        <div className="mt-1.5 space-y-0.5">
          {insights.map((msg, i) => (
            <p key={i} className="text-xs font-medium text-green-600">{msg}</p>
          ))}
        </div>
      )}
      {isRunwayCelebration && insights.length === 0 && (
        <p className="mt-1 text-xs font-medium text-green-600" data-testid="runway-celebration-text">
          Excellent safety net!
        </p>
      )}
      {/* Breakdown on hover */}
      {metric.breakdown && (
        <p className={`mt-1.5 text-xs text-stone-400 leading-relaxed transition-opacity duration-200 ${showTooltip ? "opacity-100" : "opacity-0 h-0 overflow-hidden"}`}>
          {metric.breakdown}
        </p>
      )}
      <p className="mt-1.5 text-xs text-stone-400 leading-relaxed">
        {metric.tooltip}
      </p>
    </div>
  );
}

interface SnapshotDashboardProps {
  metrics?: MetricData[];
  financialData?: FinancialData;
}

export default function SnapshotDashboard({ metrics, financialData }: SnapshotDashboardProps = {}) {
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
    // Goal insights go under the last card or first card
    const goalInsights = allInsights.filter((ins) => ins.type === "goal").map((ins) => ins.message);
    if (goalInsights.length > 0) {
      const existing = insightsByMetric.get("Net Worth") ?? [];
      insightsByMetric.set("Net Worth", [...existing, ...goalInsights]);
    }
  }

  return (
    <div className="space-y-4" data-testid="snapshot-dashboard">
      {displayMetrics.map((metric) => (
        <MetricCard
          key={metric.title}
          metric={metric}
          insights={insightsByMetric.get(metric.title) ?? []}
        />
      ))}
    </div>
  );
}
