"use client";

import IncomeEntry from "@/components/IncomeEntry";
import type { IncomeItem } from "@/components/IncomeEntry";
import type { MonthlyInvestmentReturn } from "@/lib/financial-state";
import type { FxRates, SupportedCurrency } from "@/lib/currency";

export default function IncomeStep({
  items,
  onChange,
  investmentReturns,
  homeCurrency,
  fxRates,
}: {
  items: IncomeItem[];
  onChange: (items: IncomeItem[]) => void;
  investmentReturns: MonthlyInvestmentReturn[];
  homeCurrency: SupportedCurrency;
  fxRates: FxRates;
}) {
  const totalReturns = investmentReturns.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Income</h2>
        <p className="mt-1 text-sm text-slate-400">
          Employment income, side hustles, pensions, rental income, and other sources.
        </p>
        {totalReturns > 0 && (
          <p className="mt-1.5 text-xs text-emerald-400/70">
            +${Math.round(totalReturns).toLocaleString()}/mo in investment returns auto-calculated from your assets.
          </p>
        )}
      </div>
      <IncomeEntry items={items} onChange={onChange} investmentReturns={investmentReturns} homeCurrency={homeCurrency} fxRates={fxRates} />
    </div>
  );
}
