"use client";

import { computeTotals } from "@/lib/financial-state";
import type { FinancialState } from "@/lib/financial-types";

function fmt(n: number): string {
  return "$" + Math.round(Math.abs(n)).toLocaleString();
}

export default function TaxSummaryStep({ state }: { state: FinancialState }) {
  const totals = computeTotals(state);
  const annualIncome = totals.monthlyIncome * 12;
  const annualFederal = totals.totalFederalTax;
  const annualProvincial = totals.totalProvincialStateTax;
  const annualTotal = annualFederal + annualProvincial;
  const effectiveRate = annualIncome > 0 ? (annualTotal / annualIncome) * 100 : 0;
  const afterTaxAnnual = annualIncome - annualTotal;
  const afterTaxMonthly = afterTaxAnnual / 12;
  const country = state.country ?? "CA";
  const federalLabel = "Federal";
  const provincialLabel = country === "CA" ? "Provincial" : "State";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Your Tax Estimate</h2>
        <p className="mt-1 text-sm text-slate-400">
          Based on your {fmt(annualIncome)}/yr income in {state.jurisdiction ?? "—"}, here&apos;s your estimated tax picture.
        </p>
      </div>

      {annualIncome > 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-5">
          {/* Big numbers */}
          <div className="text-center space-y-1">
            <p className="text-4xl font-bold text-white tabular-nums">{fmt(afterTaxMonthly)}<span className="text-lg text-slate-500">/mo</span></p>
            <p className="text-sm text-slate-400">after-tax income</p>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white/[0.03] border border-white/5 p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">Gross Income</p>
              <p className="text-lg font-semibold text-white tabular-nums">{fmt(annualIncome)}<span className="text-xs text-slate-500">/yr</span></p>
            </div>
            <div className="rounded-lg bg-white/[0.03] border border-white/5 p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">Total Tax</p>
              <p className="text-lg font-semibold text-amber-400 tabular-nums">{fmt(annualTotal)}<span className="text-xs text-slate-500">/yr</span></p>
            </div>
          </div>

          {/* Tax split */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">{federalLabel}</span>
              <span className="text-slate-300 tabular-nums">{fmt(annualFederal)}/yr</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">{provincialLabel}</span>
              <span className="text-slate-300 tabular-nums">{fmt(annualProvincial)}/yr</span>
            </div>
            <div className="border-t border-white/10 pt-2 flex items-center justify-between text-sm">
              <span className="text-slate-400">Effective rate</span>
              <span className="font-medium text-amber-400 tabular-nums">{effectiveRate.toFixed(1)}%</span>
            </div>
          </div>

          {/* Visual bar */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Take-home</span>
              <span>Tax</span>
            </div>
            <div className="h-3 rounded-full bg-amber-500/20 overflow-hidden flex">
              <div
                className="h-full bg-emerald-500 rounded-l-full transition-all duration-500"
                style={{ width: `${Math.max(0, 100 - effectiveRate)}%` }}
              />
              <div
                className="h-full bg-amber-500 rounded-r-full transition-all duration-500"
                style={{ width: `${effectiveRate}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            This is an estimate based on standard tax brackets and deductions. You can adjust tax overrides and add credits in the next steps.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
          <p className="text-slate-500">Enter income in the previous step to see your tax estimate.</p>
        </div>
      )}
    </div>
  );
}
