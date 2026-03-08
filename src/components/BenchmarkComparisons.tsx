"use client";

import { useState } from "react";
import {
  computeBenchmarkComparisons,
  DATA_SOURCES,
  type BenchmarkComparison,
} from "@/lib/benchmarks";
import { useCurrency } from "@/lib/CurrencyContext";

interface BenchmarkComparisonsProps {
  age?: number;
  country: "CA" | "US";
  netWorth: number;
  savingsRate: number;
  emergencyMonths: number;
  debtToIncomeRatio: number;
  annualIncome?: number;
  onAgeChange: (age: number | undefined) => void;
}

function formatBarValue(value: number, format: BenchmarkComparison["format"], compactCurrency: (n: number) => string): string {
  switch (format) {
    case "currency":
      return compactCurrency(value);
    case "percent":
      return `${(value * 100).toFixed(0)}%`;
    case "months":
      return `${value.toFixed(1)} mo`;
    case "ratio":
      return value.toFixed(2);
  }
}

function ComparisonBar({ comparison }: { comparison: BenchmarkComparison }) {
  const fmt = useCurrency();
  const { metric, userValue, benchmarkValue, nationalAverage, format, message, aboveBenchmark, percentile, ageGroupLabel } = comparison;

  // For debt-to-income, lower is better, so we invert the visual logic
  const isDebtMetric = metric === "Debt-to-Income";

  // Calculate bar widths as percentage of max(user, benchmark, nationalAverage)
  const maxVal = Math.max(Math.abs(userValue), Math.abs(benchmarkValue), Math.abs(nationalAverage), 0.01);
  const userWidth = Math.max((Math.abs(userValue) / maxVal) * 100, 2);
  const benchmarkWidth = Math.max((Math.abs(benchmarkValue) / maxVal) * 100, 2);
  const nationalWidth = Math.max((Math.abs(nationalAverage) / maxVal) * 100, 2);

  const userColor = aboveBenchmark ? "bg-emerald-400" : "bg-violet-400";
  const benchmarkColor = "bg-slate-600";
  const nationalColor = "bg-amber-400";

  return (
    <div className="space-y-2" data-testid={`benchmark-${metric.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-slate-300">{metric}</h4>
        <div className="flex items-center gap-1.5">
          {percentile !== undefined && ageGroupLabel && (
            <span
              className="text-xs text-slate-500"
              title={`Estimated percentile within the ${ageGroupLabel} age group`}
              data-testid={`benchmark-${metric.toLowerCase().replace(/\s+/g, "-")}-percentile`}
            >
              ~{percentile}th pctile
            </span>
          )}
          {aboveBenchmark && (
            <span className="text-xs font-medium text-emerald-300 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
              {isDebtMetric ? "Below median" : "Above median"}
            </span>
          )}
        </div>
      </div>

      {/* User bar */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 w-14 shrink-0">You</span>
          <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${userColor}`}
              style={{ width: `${userWidth}%` }}
            />
          </div>
          <span className="text-xs font-medium text-slate-300 w-16 text-right shrink-0">
            {formatBarValue(userValue, format, fmt.compact.bind(fmt))}
          </span>
        </div>

        {/* Benchmark bar */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 w-14 shrink-0">Median</span>
          <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${benchmarkColor}`}
              style={{ width: `${benchmarkWidth}%` }}
            />
          </div>
          <span className="text-xs font-medium text-slate-400 w-16 text-right shrink-0">
            {formatBarValue(benchmarkValue, format, fmt.compact.bind(fmt))}
          </span>
        </div>

        {/* National average bar */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 w-14 shrink-0">Nat&apos;l Avg</span>
          <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${nationalColor}`}
              style={{ width: `${nationalWidth}%` }}
            />
          </div>
          <span className="text-xs font-medium text-amber-400 w-16 text-right shrink-0">
            {formatBarValue(nationalAverage, format, fmt.compact.bind(fmt))}
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">{message}</p>
    </div>
  );
}

export default function BenchmarkComparisons({
  age,
  country,
  netWorth,
  savingsRate,
  emergencyMonths,
  debtToIncomeRatio,
  annualIncome,
  onAgeChange,
}: BenchmarkComparisonsProps) {
  const [showInfo, setShowInfo] = useState(false);
  const [editingAge, setEditingAge] = useState(false);
  const [ageInput, setAgeInput] = useState(age?.toString() ?? "");

  const comparisons = age
    ? computeBenchmarkComparisons(age, country, netWorth, savingsRate, emergencyMonths, debtToIncomeRatio, annualIncome)
    : [];

  const handleAgeSubmit = () => {
    const parsed = parseInt(ageInput, 10);
    if (parsed >= 18 && parsed <= 120) {
      onAgeChange(parsed);
    } else if (ageInput === "") {
      onAgeChange(undefined);
    }
    setEditingAge(false);
  };

  return (
    <div
      className="rounded-xl border border-white/10 bg-white/5 p-3 sm:p-5 shadow-sm"
      data-testid="benchmark-comparisons"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">📊</span>
          <h3 className="text-base font-semibold text-slate-200">How You Compare</h3>
        </div>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="text-slate-500 hover:text-slate-300 transition-colors duration-150 p-1 rounded-md hover:bg-white/10"
          aria-label="Data sources information"
          data-testid="benchmark-info-button"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {showInfo && (
        <div className="mb-4 p-3 bg-violet-400/10 border border-violet-400/20 rounded-lg text-xs text-violet-300 leading-relaxed" data-testid="benchmark-sources">
          <p className="font-medium mb-1">Data Sources</p>
          <p>{DATA_SOURCES[country]}</p>
          <p className="mt-1 text-violet-400/70">
            Benchmarks are approximate medians for illustration. Individual circumstances vary widely.
          </p>
        </div>
      )}

      {/* Age input */}
      <div className="mb-4">
        {!age && !editingAge ? (
          <button
            onClick={() => setEditingAge(true)}
            className="w-full text-center py-3 px-4 border-2 border-dashed border-white/10 rounded-lg text-sm text-slate-500 hover:border-white/20 hover:text-slate-300 hover:bg-white/5 transition-all duration-200"
            data-testid="add-age-button"
          >
            Enter your age to see personalized benchmarks
          </button>
        ) : editingAge ? (
          <div className="flex items-center gap-2" data-testid="age-input-form">
            <label className="text-sm text-slate-400">Age:</label>
            <input
              type="number"
              min={18}
              max={120}
              value={ageInput}
              onChange={(e) => setAgeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAgeSubmit();
                if (e.key === "Escape") setEditingAge(false);
              }}
              onBlur={handleAgeSubmit}
              autoFocus
              className="w-20 rounded-md border border-white/10 bg-slate-800 px-2 py-1.5 text-sm text-slate-200 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20 transition-all duration-150"
              placeholder="e.g. 30"
              data-testid="age-input"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Age:</span>
            <button
              onClick={() => { setAgeInput(age?.toString() ?? ""); setEditingAge(true); }}
              className="text-sm font-medium text-slate-300 hover:text-violet-400 transition-colors duration-150 underline decoration-slate-600 hover:decoration-violet-400"
              data-testid="age-display"
            >
              {age}
            </button>
            <button
              onClick={() => { onAgeChange(undefined); setAgeInput(""); }}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors duration-150"
              aria-label="Remove age"
              data-testid="remove-age-button"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Comparisons */}
      {comparisons.length > 0 ? (
        <div className="space-y-5">
          {comparisons.map((comparison) => (
            <ComparisonBar key={comparison.metric} comparison={comparison} />
          ))}
        </div>
      ) : !age ? (
        <p className="text-sm text-slate-500 text-center py-2">
          Add your age above to unlock benchmark comparisons
        </p>
      ) : null}
    </div>
  );
}
