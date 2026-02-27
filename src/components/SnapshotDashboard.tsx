"use client";

import { useState, useEffect, useRef } from "react";

interface MetricData {
  title: string;
  value: number;
  format: "currency" | "months" | "ratio";
  icon: string;
  tooltip: string;
  positive: boolean;
}

// Mock values based on existing entry component mock data
// Assets: $12,000 + $35,000 + $18,500 = $65,500
// Debts: $280,000 + $15,000 = $295,000
// Income: $5,500 + $800 = $6,300
// Expenses: $2,200 + $600 + $150 = $2,950
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

function MetricCard({ metric }: { metric: MetricData }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const animatedValue = useCountUp(metric.value);

  const valueColor = metric.positive
    ? "text-green-600"
    : metric.value < 0
      ? "text-rose-600"
      : "text-stone-700";

  return (
    <div
      className="relative rounded-xl border border-stone-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-default"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      role="group"
      aria-label={metric.title}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-stone-500">{metric.title}</h3>
        <span className="text-lg" aria-hidden="true">
          {metric.icon}
        </span>
      </div>
      <p
        className={`mt-2 text-3xl font-bold ${valueColor}`}
        aria-label={`${metric.title}: ${formatMetricValue(metric.value, metric.format)}`}
      >
        {formatMetricValue(animatedValue, metric.format)}
      </p>

      {showTooltip && (
        <div
          className="absolute left-0 right-0 top-full z-10 mt-2 rounded-lg border border-stone-200 bg-white p-3 text-xs text-stone-600 shadow-lg"
          role="tooltip"
        >
          {metric.tooltip}
        </div>
      )}
    </div>
  );
}

export default function SnapshotDashboard() {
  return (
    <div className="space-y-6" data-testid="snapshot-dashboard">
      {MOCK_METRICS.map((metric) => (
        <MetricCard key={metric.title} metric={metric} />
      ))}
    </div>
  );
}
