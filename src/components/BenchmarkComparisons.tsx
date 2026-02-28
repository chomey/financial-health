"use client";

import { useState } from "react";
import {
  computeBenchmarkComparisons,
  DATA_SOURCES,
  type BenchmarkComparison,
} from "@/lib/benchmarks";

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

function formatBarValue(value: number, format: BenchmarkComparison["format"]): string {
  switch (format) {
    case "currency": {
      const abs = Math.abs(value);
      if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
      if (abs >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
      return `$${value.toFixed(0)}`;
    }
    case "percent":
      return `${(value * 100).toFixed(0)}%`;
    case "months":
      return `${value.toFixed(1)} mo`;
    case "ratio":
      return value.toFixed(2);
  }
}

function ComparisonBar({ comparison }: { comparison: BenchmarkComparison }) {
  const { metric, userValue, benchmarkValue, nationalAverage, format, message, aboveBenchmark } = comparison;

  // For debt-to-income, lower is better, so we invert the visual logic
  const isDebtMetric = metric === "Debt-to-Income";

  // Calculate bar widths as percentage of max(user, benchmark, nationalAverage)
  const maxVal = Math.max(Math.abs(userValue), Math.abs(benchmarkValue), Math.abs(nationalAverage), 0.01);
  const userWidth = Math.max((Math.abs(userValue) / maxVal) * 100, 2);
  const benchmarkWidth = Math.max((Math.abs(benchmarkValue) / maxVal) * 100, 2);
  const nationalWidth = Math.max((Math.abs(nationalAverage) / maxVal) * 100, 2);

  const userColor = aboveBenchmark ? "bg-emerald-500" : "bg-blue-400";
  const benchmarkColor = "bg-stone-300";
  const nationalColor = "bg-amber-300";

  return (
    <div className="space-y-2" data-testid={`benchmark-${metric.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-stone-700">{metric}</h4>
        {aboveBenchmark && (
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            {isDebtMetric ? "Below median" : "Above median"}
          </span>
        )}
      </div>

      {/* User bar */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500 w-14 shrink-0">You</span>
          <div className="flex-1 h-5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${userColor}`}
              style={{ width: `${userWidth}%` }}
            />
          </div>
          <span className="text-xs font-medium text-stone-700 w-16 text-right shrink-0">
            {formatBarValue(userValue, format)}
          </span>
        </div>

        {/* Benchmark bar */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500 w-14 shrink-0">Median</span>
          <div className="flex-1 h-5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${benchmarkColor}`}
              style={{ width: `${benchmarkWidth}%` }}
            />
          </div>
          <span className="text-xs font-medium text-stone-500 w-16 text-right shrink-0">
            {formatBarValue(benchmarkValue, format)}
          </span>
        </div>

        {/* National average bar */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500 w-14 shrink-0">Nat&apos;l Avg</span>
          <div className="flex-1 h-5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${nationalColor}`}
              style={{ width: `${nationalWidth}%` }}
            />
          </div>
          <span className="text-xs font-medium text-amber-600 w-16 text-right shrink-0">
            {formatBarValue(nationalAverage, format)}
          </span>
        </div>
      </div>

      <p className="text-xs text-stone-500 leading-relaxed">{message}</p>
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
      className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
      data-testid="benchmark-comparisons"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">📊</span>
          <h3 className="text-base font-semibold text-stone-800">How You Compare</h3>
        </div>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="text-stone-400 hover:text-stone-600 transition-colors duration-150 p-1 rounded-md hover:bg-stone-100"
          aria-label="Data sources information"
          data-testid="benchmark-info-button"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {showInfo && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700 leading-relaxed" data-testid="benchmark-sources">
          <p className="font-medium mb-1">Data Sources</p>
          <p>{DATA_SOURCES[country]}</p>
          <p className="mt-1 text-blue-500">
            Benchmarks are approximate medians for illustration. Individual circumstances vary widely.
          </p>
        </div>
      )}

      {/* Age input */}
      <div className="mb-4">
        {!age && !editingAge ? (
          <button
            onClick={() => setEditingAge(true)}
            className="w-full text-center py-3 px-4 border-2 border-dashed border-stone-200 rounded-lg text-sm text-stone-500 hover:border-stone-300 hover:text-stone-600 hover:bg-stone-50 transition-all duration-200"
            data-testid="add-age-button"
          >
            Enter your age to see personalized benchmarks
          </button>
        ) : editingAge ? (
          <div className="flex items-center gap-2" data-testid="age-input-form">
            <label className="text-sm text-stone-600">Age:</label>
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
              className="w-20 rounded-md border border-stone-300 px-2 py-1.5 text-sm text-stone-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all duration-150"
              placeholder="e.g. 30"
              data-testid="age-input"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-stone-600">Age:</span>
            <button
              onClick={() => { setAgeInput(age?.toString() ?? ""); setEditingAge(true); }}
              className="text-sm font-medium text-stone-800 hover:text-blue-600 transition-colors duration-150 underline decoration-stone-300 hover:decoration-blue-400"
              data-testid="age-display"
            >
              {age}
            </button>
            <button
              onClick={() => { onAgeChange(undefined); setAgeInput(""); }}
              className="text-xs text-stone-400 hover:text-stone-600 transition-colors duration-150"
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
        <p className="text-sm text-stone-400 text-center py-2">
          Add your age above to unlock benchmark comparisons
        </p>
      ) : null}
    </div>
  );
}
