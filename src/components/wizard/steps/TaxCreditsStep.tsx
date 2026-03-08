"use client";

import TaxCreditEntry from "@/components/TaxCreditEntry";
import type { TaxCredit, FilingStatus } from "@/lib/tax-credits";

export default function TaxCreditsStep({
  items,
  onChange,
  country,
  filingStatus,
  annualIncome,
  taxYear,
}: {
  items: TaxCredit[];
  onChange: (items: TaxCredit[]) => void;
  country: "CA" | "US";
  filingStatus: FilingStatus;
  annualIncome: number;
  taxYear: number;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Tax Credits</h2>
        <p className="mt-1 text-sm text-slate-400">
          Add any tax credits you claim. These reduce your tax bill and improve your cash flow picture.
        </p>
        <p className="mt-1 text-xs text-slate-600">
          This step is optional — skip if you&apos;re not sure which credits apply to you.
        </p>
      </div>
      <TaxCreditEntry
        items={items}
        onChange={onChange}
        country={country}
        filingStatus={filingStatus}
        annualIncome={annualIncome}
        taxYear={taxYear}
      />
    </div>
  );
}
