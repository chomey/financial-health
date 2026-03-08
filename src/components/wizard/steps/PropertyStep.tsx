"use client";

import PropertyEntry from "@/components/PropertyEntry";
import type { Property } from "@/components/PropertyEntry";
import type { FxRates, SupportedCurrency } from "@/lib/currency";

export default function PropertyStep({
  items,
  onChange,
  homeCurrency,
  fxRates,
}: {
  items: Property[];
  onChange: (items: Property[]) => void;
  homeCurrency: SupportedCurrency;
  fxRates: FxRates;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Properties</h2>
        <p className="mt-1 text-sm text-slate-400">
          Add any real estate you own. Equity and mortgage payments will auto-populate in later steps.
        </p>
      </div>
      <PropertyEntry items={items} onChange={onChange} homeCurrency={homeCurrency} fxRates={fxRates} />
      {items.length === 0 && (
        <p className="text-center text-sm text-slate-600 py-4">No properties? No problem — just continue to the next step.</p>
      )}
    </div>
  );
}
