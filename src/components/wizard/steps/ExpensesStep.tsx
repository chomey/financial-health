"use client";

import ExpenseEntry from "@/components/ExpenseEntry";
import type { ExpenseItem } from "@/components/ExpenseEntry";
import { computeTotals } from "@/lib/financial-state";
import type { FinancialState } from "@/lib/financial-types";
import type { FxRates, SupportedCurrency } from "@/lib/currency";

export default function ExpensesStep({
  items,
  onChange,
  investmentContributions,
  mortgagePayments,
  surplus,
  surplusTargetName,
  state,
  homeCurrency,
  fxRates,
}: {
  items: ExpenseItem[];
  onChange: (items: ExpenseItem[]) => void;
  investmentContributions: number;
  mortgagePayments: number;
  surplus: number;
  surplusTargetName: string | undefined;
  state: FinancialState;
  homeCurrency: SupportedCurrency;
  fxRates: FxRates;
}) {
  const totals = computeTotals(state);
  const country = state.country ?? "CA";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Expenses</h2>
        <p className="mt-1 text-sm text-slate-400">
          Monthly living expenses — rent, groceries, subscriptions, etc. Taxes and mortgage are calculated automatically.
        </p>
      </div>
      <ExpenseEntry
        items={items}
        onChange={onChange}
        investmentContributions={investmentContributions}
        mortgagePayments={mortgagePayments}
        surplus={surplus}
        surplusTargetName={surplusTargetName}
        federalTax={totals.totalFederalTax / 12}
        provincialStateTax={totals.totalProvincialStateTax / 12}
        computedFederalTax={totals.computedFederalTax / 12}
        computedProvincialStateTax={totals.computedProvincialStateTax / 12}
        federalTaxOverride={state.federalTaxOverride !== undefined ? state.federalTaxOverride / 12 : undefined}
        provincialTaxOverride={state.provincialTaxOverride !== undefined ? state.provincialTaxOverride / 12 : undefined}
        onFederalTaxOverride={() => {}}
        onProvincialTaxOverride={() => {}}
        country={country}
        isUnderwater={surplus < 0}
        homeCurrency={homeCurrency}
        fxRates={fxRates}
      />
    </div>
  );
}
