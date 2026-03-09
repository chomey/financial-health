"use client";

import IncomeEntry from "@/components/IncomeEntry";
import type { IncomeItem } from "@/components/IncomeEntry";
import type { FxRates, SupportedCurrency } from "@/lib/currency";

export default function IncomeStep({
  items,
  onChange,
  homeCurrency,
  fxRates,
}: {
  items: IncomeItem[];
  onChange: (items: IncomeItem[]) => void;
  homeCurrency: SupportedCurrency;
  fxRates: FxRates;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Income</h2>
        <p className="mt-1 text-sm text-slate-400">
          Employment income, side hustles, pensions, rental income, and other sources.
        </p>
      </div>
      <IncomeEntry items={items} onChange={onChange} homeCurrency={homeCurrency} fxRates={fxRates} />
    </div>
  );
}
