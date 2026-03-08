"use client";

import AssetEntry from "@/components/AssetEntry";
import type { Asset } from "@/components/AssetEntry";
import type { FxRates, SupportedCurrency } from "@/lib/currency";

export default function AssetsStep({
  items,
  onChange,
  monthlySurplus,
  homeCurrency,
  fxRates,
  annualEmploymentSalary,
}: {
  items: Asset[];
  onChange: (items: Asset[]) => void;
  monthlySurplus: number;
  homeCurrency: SupportedCurrency;
  fxRates: FxRates;
  annualEmploymentSalary: number;
}) {
  const computedCount = items.filter(a => a.computed).length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Assets</h2>
        <p className="mt-1 text-sm text-slate-400">
          Savings accounts, investments, retirement accounts (TFSA, RRSP, 401k, etc.)
        </p>
        {computedCount > 0 && (
          <p className="mt-1.5 text-xs text-emerald-400/70">
            {computedCount} auto-calculated from your properties and stocks.
          </p>
        )}
      </div>
      <AssetEntry items={items} onChange={onChange} monthlySurplus={monthlySurplus} homeCurrency={homeCurrency} fxRates={fxRates} annualEmploymentSalary={annualEmploymentSalary} />
    </div>
  );
}
