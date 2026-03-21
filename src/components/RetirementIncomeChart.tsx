"use client";

import { formatCurrencyCompact, type SupportedCurrency } from "@/lib/currency";

interface RetirementIncomeSource {
  label: string;
  monthlyAmount: number;
  color: string;
}

interface Props {
  monthlyGovernmentIncome: number;
  monthlyPortfolioWithdrawal: number;
  monthlyExpenses: number;
  country: "CA" | "US" | "AU";
  homeCurrency: SupportedCurrency;
}

function getGovernmentLabel(country: "CA" | "US" | "AU"): string {
  switch (country) {
    case "CA": return "CPP + OAS";
    case "US": return "Social Security";
    case "AU": return "Age Pension";
  }
}

export default function RetirementIncomeChart({
  monthlyGovernmentIncome,
  monthlyPortfolioWithdrawal,
  monthlyExpenses,
  country,
  homeCurrency,
}: Props) {
  const fc = (v: number) => formatCurrencyCompact(v, homeCurrency, homeCurrency);

  // Build income sources
  const sources: RetirementIncomeSource[] = [];

  if (monthlyGovernmentIncome > 0) {
    sources.push({
      label: getGovernmentLabel(country),
      monthlyAmount: monthlyGovernmentIncome,
      color: "#22d3ee", // cyan
    });
  }

  if (monthlyPortfolioWithdrawal > 0) {
    sources.push({
      label: "Portfolio (4% rule)",
      monthlyAmount: monthlyPortfolioWithdrawal,
      color: "#a78bfa", // violet
    });
  }

  const totalIncome = sources.reduce((sum, s) => sum + s.monthlyAmount, 0);
  const gap = Math.max(0, monthlyExpenses - totalIncome);
  const coveragePercent = monthlyExpenses > 0 ? Math.min(100, Math.round((totalIncome / monthlyExpenses) * 100)) : 0;

  // Nothing to show if no retirement income sources
  if (sources.length === 0 || monthlyExpenses <= 0) return null;

  // Calculate bar widths relative to expenses (cap at 100% for the bar)
  const barMax = Math.max(totalIncome, monthlyExpenses);

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 sm:p-5" data-testid="retirement-income-chart">
      <h3 className="mb-1 text-sm font-semibold text-slate-200">Retirement Income vs Expenses</h3>
      <p className="mb-4 text-xs text-slate-500">
        How your projected retirement income covers monthly expenses
      </p>

      {/* Stacked income bar */}
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
          <span>Retirement Income</span>
          <span className="font-medium text-slate-300">{fc(totalIncome)}/mo</span>
        </div>
        <div className="h-8 w-full overflow-hidden rounded-lg bg-slate-800" data-testid="income-bar">
          <div className="flex h-full">
            {sources.map((source) => {
              const widthPct = (source.monthlyAmount / barMax) * 100;
              return (
                <div
                  key={source.label}
                  className="h-full transition-all duration-500"
                  style={{ width: `${widthPct}%`, backgroundColor: source.color }}
                  title={`${source.label}: ${fc(source.monthlyAmount)}/mo`}
                  data-testid={`income-segment-${source.label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Expenses bar */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
          <span>Monthly Expenses</span>
          <span className="font-medium text-slate-300">{fc(monthlyExpenses)}/mo</span>
        </div>
        <div className="h-8 w-full overflow-hidden rounded-lg bg-slate-800" data-testid="expenses-bar">
          <div
            className="h-full rounded-lg bg-rose-500/60 transition-all duration-500"
            style={{ width: `${(monthlyExpenses / barMax) * 100}%` }}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-3">
        {sources.map((source) => (
          <div key={source.label} className="flex items-center gap-1.5 text-xs text-slate-400">
            <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: source.color }} />
            <span>{source.label}: {fc(source.monthlyAmount)}/mo</span>
          </div>
        ))}
        {gap > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-amber-400/80">
            <div className="h-2.5 w-2.5 rounded-sm bg-amber-400/40" />
            <span>Gap: {fc(gap)}/mo</span>
          </div>
        )}
      </div>

      {/* Coverage summary */}
      <div
        className={`rounded-lg px-3 py-2 text-sm ${
          coveragePercent >= 100
            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
            : coveragePercent >= 75
            ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-300"
            : "bg-amber-500/10 border border-amber-500/20 text-amber-300"
        }`}
        data-testid="coverage-summary"
      >
        {coveragePercent >= 100
          ? `Your retirement income fully covers your expenses (${coveragePercent}%).`
          : `Your retirement income covers ${coveragePercent}% of expenses. Gap: ${fc(gap)}/mo from other sources.`}
      </div>
    </div>
  );
}
