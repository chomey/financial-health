"use client";

import { computeTotals, computeMonthlyInvestmentReturns, computeSurplus } from "@/lib/financial-state";
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
  const provincialLabel = country === "CA" ? "Provincial" : country === "AU" ? "State" : "State";

  // Investment returns
  const investmentReturns = computeMonthlyInvestmentReturns(state.assets);
  const totalMonthlyReturns = investmentReturns.reduce((sum, r) => sum + r.amount, 0);
  const payoutReturns = investmentReturns.filter((r) => !r.reinvest);
  const payoutTotal = payoutReturns.reduce((sum, r) => sum + r.amount, 0);

  // Surplus
  const surplus = computeSurplus(
    totals.monthlyAfterTaxIncome,
    payoutTotal,
    totals.monthlyExpenses,
    totals.totalMonthlyContributions,
    totals.totalMortgagePayments,
    totals.totalDebtPayments,
  );
  const surplusTarget = state.assets.filter(a => !a.computed).find(a => a.surplusTarget)?.category
    ?? state.assets.filter(a => !a.computed)[0]?.category;

  const hasCashFlow = totals.totalMonthlyContributions > 0 || totals.totalMortgagePayments > 0 || totals.totalDebtPayments > 0 || totalMonthlyReturns > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Financial Summary</h2>
        <p className="mt-1 text-sm text-slate-400">
          Everything calculated from what you&apos;ve entered — taxes, contributions, mortgage, investment returns, and surplus.
        </p>
      </div>

      {/* Tax Estimate */}
      {annualIncome > 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-5">
          <div className="text-center space-y-1">
            <p className="text-4xl font-bold text-white tabular-nums">{fmt(afterTaxMonthly)}<span className="text-lg text-slate-500">/mo</span></p>
            <p className="text-sm text-slate-400">after-tax income</p>
          </div>

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
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
          <p className="text-slate-500">Enter income in a previous step to see your tax estimate.</p>
        </div>
      )}

      {/* Cash Flow Breakdown */}
      {hasCashFlow && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300">Monthly Cash Flow</h3>

          {/* Investment returns */}
          {investmentReturns.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Investment Returns</p>
              {investmentReturns.map((r) => (
                <div key={r.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">{r.label}</span>
                    <span className={`text-[9px] font-medium uppercase px-1 rounded-full ${r.reinvest ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-700/40 text-slate-500"}`}>
                      {r.reinvest ? "reinvesting" : "payout"}
                    </span>
                  </div>
                  <span className="text-emerald-400 tabular-nums">{fmt(r.amount)}/mo</span>
                </div>
              ))}
            </div>
          )}

          {/* Outflows */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Outflows</p>
            {totals.monthlyExpenses > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Expenses</span>
                <span className="text-slate-300 tabular-nums">{fmt(totals.monthlyExpenses)}/mo</span>
              </div>
            )}
            {annualTotal > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Taxes (est.)</span>
                <span className="text-slate-300 tabular-nums">{fmt(annualTotal / 12)}/mo</span>
              </div>
            )}
            {totals.totalMonthlyContributions > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Investment Contributions</span>
                <span className="text-slate-300 tabular-nums">{fmt(totals.totalMonthlyContributions)}/mo</span>
              </div>
            )}
            {totals.totalMortgagePayments > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Mortgage Payments</span>
                <span className="text-slate-300 tabular-nums">{fmt(totals.totalMortgagePayments)}/mo</span>
              </div>
            )}
            {totals.totalDebtPayments > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Debt Payments</span>
                <span className="text-slate-300 tabular-nums">{fmt(totals.totalDebtPayments)}/mo</span>
              </div>
            )}
          </div>

          {/* Surplus */}
          <div className="border-t border-white/10 pt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-300">Monthly Surplus</span>
              {surplus > 0 && surplusTarget && (
                <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  → {surplusTarget}
                </span>
              )}
            </div>
            <span className={`text-lg font-bold tabular-nums ${surplus >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {surplus < 0 ? "-" : ""}{fmt(Math.abs(surplus))}<span className="text-sm text-slate-500">/mo</span>
            </span>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-600 leading-relaxed">
        Tax estimates are based on standard brackets and deductions for {state.jurisdiction ?? "your jurisdiction"}. Adjust tax credits in the Expenses step or override amounts on the dashboard.
      </p>
    </div>
  );
}
