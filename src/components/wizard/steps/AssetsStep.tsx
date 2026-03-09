"use client";

import AssetEntry from "@/components/AssetEntry";
import type { Asset } from "@/components/AssetEntry";
import type { Property } from "@/components/PropertyEntry";
import type { FxRates, SupportedCurrency } from "@/lib/currency";

export default function AssetsStep({
  items,
  onChange,
  monthlySurplus,
  homeCurrency,
  fxRates,
  annualEmploymentSalary,
  properties,
  onPropertiesChange,
}: {
  items: Asset[];
  onChange: (items: Asset[]) => void;
  monthlySurplus: number;
  homeCurrency: SupportedCurrency;
  fxRates: FxRates;
  annualEmploymentSalary: number;
  properties?: Property[];
  onPropertiesChange?: (properties: Property[]) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Assets</h2>
        <p className="mt-1 text-sm text-slate-400">
          Savings accounts, investments, retirement accounts (TFSA, RRSP, 401k, etc.)
        </p>
      </div>
      <AssetEntry items={items} onChange={onChange} monthlySurplus={monthlySurplus} homeCurrency={homeCurrency} fxRates={fxRates} annualEmploymentSalary={annualEmploymentSalary} properties={properties} onPropertiesChange={onPropertiesChange} />
    </div>
  );
}
