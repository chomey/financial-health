"use client";

import type { RetirementReadinessResult } from "@/lib/retirement-readiness";

interface Props {
  result: RetirementReadinessResult;
}

const TIER_COLORS: Record<string, string> = {
  "Retirement Ready": "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
  "Strong": "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
  "On Track": "border-violet-400/20 bg-violet-400/10 text-violet-300",
  "Building": "border-amber-400/20 bg-amber-400/10 text-amber-300",
  "Getting Started": "border-slate-400/20 bg-slate-400/10 text-slate-300",
};

const TIER_BAR_COLORS: Record<string, string> = {
  "Retirement Ready": "bg-cyan-400",
  "Strong": "bg-cyan-400",
  "On Track": "bg-violet-400",
  "Building": "bg-amber-400",
  "Getting Started": "bg-slate-400",
};

const COMPONENT_LABELS: { key: keyof RetirementReadinessResult["components"]; label: string; icon: string }[] = [
  { key: "incomeReplacement", label: "Income Replacement", icon: "💰" },
  { key: "runway", label: "Emergency Runway", icon: "🛡️" },
  { key: "governmentBenefits", label: "Government Benefits", icon: "🏛️" },
  { key: "debtPosition", label: "Debt Position", icon: "⚖️" },
  { key: "taxDiversification", label: "Tax Diversification", icon: "🎯" },
];

export default function RetirementReadinessScore({ result }: Props) {
  const tierColor = TIER_COLORS[result.tier] ?? TIER_COLORS["Getting Started"];
  const barColor = TIER_BAR_COLORS[result.tier] ?? TIER_BAR_COLORS["Getting Started"];

  return (
    <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-2)] p-5" data-testid="retirement-readiness-score">
      <h3 className="mb-1 text-sm font-semibold text-slate-200">Retirement Readiness</h3>
      <p className="mb-4 text-xs text-slate-400">How prepared you are for retirement</p>

      {/* Score and tier */}
      <div className="flex items-center gap-4 mb-4">
        <div className="text-3xl font-bold text-slate-100" data-testid="readiness-score-value">
          {result.score}
        </div>
        <div>
          <div className={`inline-block rounded-full border px-2.5 py-1 text-sm font-semibold ${tierColor}`} data-testid="readiness-tier">
            {result.tier}
          </div>
          <div className="mt-1 text-xs text-slate-400">out of 100</div>
        </div>
      </div>

      {/* Overall bar */}
      <div className="mb-4 h-3 w-full overflow-hidden rounded-full bg-[var(--surface-1)]">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-[400ms] ease-out`}
          style={{ width: `${result.score}%` }}
        />
      </div>

      {/* Component breakdown */}
      <div className="space-y-2">
        {COMPONENT_LABELS.map(({ key, label, icon }) => {
          const value = result.components[key];
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs w-4 text-center" aria-hidden="true">{icon}</span>
              <span className="text-xs text-slate-400 w-32 truncate">{label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-1)]">
                <div
                  className={`h-full rounded-full transition-all duration-[400ms] ease-out ${value >= 50 ? "bg-cyan-400" : "bg-amber-400"}`}
                  style={{ width: `${value}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 w-8 text-right">{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
