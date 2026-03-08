"use client";

import DebtEntry from "@/components/DebtEntry";
import type { Debt } from "@/components/DebtEntry";
import type { FxRates, SupportedCurrency } from "@/lib/currency";

export default function DebtsStep({
  items,
  onChange,
  homeCurrency,
  fxRates,
}: {
  items: Debt[];
  onChange: (items: Debt[]) => void;
  homeCurrency: SupportedCurrency;
  fxRates: FxRates;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Debts</h2>
        <p className="mt-1 text-sm text-slate-400">
          Credit cards, student loans, car loans, lines of credit. Mortgage debt is tracked separately under properties.
        </p>
      </div>
      <DebtEntry items={items} onChange={onChange} homeCurrency={homeCurrency} fxRates={fxRates} />
      {items.length === 0 && (
        <p className="text-center text-sm text-slate-600 py-4">Debt-free? Great — keep going.</p>
      )}
    </div>
  );
}
