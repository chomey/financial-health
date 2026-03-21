"use client";

import type { RetirementReadinessResult } from "@/lib/retirement-readiness";

interface Props {
  result: RetirementReadinessResult;
}

const TIER_COLORS: Record<string, string> = {
  "Retirement Ready": "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
  "Strong": "text-cyan-300 bg-cyan-500/10 border-cyan-500/20",
  "On Track": "text-violet-300 bg-violet-500/10 border-violet-500/20",
  "Building": "text-amber-300 bg-amber-500/10 border-amber-500/20",
  "Getting Started": "text-slate-300 bg-slate-500/10 border-slate-500/20",
};

const TIER_BAR_COLORS: Record<string, string> = {
  "Retirement Ready": "bg-emerald-400",
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
    <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 sm:p-5" data-testid="retirement-readiness-score">
      <h3 className="mb-1 text-sm font-semibold text-slate-200">Retirement Readiness</h3>
      <p className="mb-4 text-xs text-slate-500">How prepared you are for retirement</p>

      {/* Score and tier */}
      <div className="flex items-center gap-4 mb-4">
        <div className="text-3xl font-bold text-slate-100" data-testid="readiness-score-value">
          {result.score}
        </div>
        <div>
          <div className={`inline-block rounded-lg border px-2.5 py-1 text-sm font-semibold ${tierColor}`} data-testid="readiness-tier">
            {result.tier}
          </div>
          <div className="mt-1 text-xs text-slate-500">out of 100</div>
        </div>
      </div>

      {/* Overall bar */}
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800 mb-4">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-700`}
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
              <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${value >= 75 ? "bg-emerald-400" : value >= 50 ? "bg-cyan-400" : value >= 25 ? "bg-amber-400" : "bg-rose-400"}`}
                  style={{ width: `${value}%` }}
                />
              </div>
              <span className="text-xs text-slate-500 w-8 text-right">{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
