"use client";

import ExpenseEntry from "@/components/ExpenseEntry";
import type { ExpenseItem } from "@/components/ExpenseEntry";
import TaxCreditEntry from "@/components/TaxCreditEntry";
import type { TaxCredit, FilingStatus } from "@/lib/tax-credits";
import type { FxRates, SupportedCurrency } from "@/lib/currency";
import type { Debt } from "@/components/DebtEntry";

export default function ExpensesStep({
  items,
  onChange,
  homeCurrency,
  fxRates,
  taxCredits,
  onTaxCreditsChange,
  country,
  filingStatus,
  annualIncome,
  taxYear,
  debts,
  onDebtsChange,
}: {
  items: ExpenseItem[];
  onChange: (items: ExpenseItem[]) => void;
  homeCurrency: SupportedCurrency;
  fxRates: FxRates;
  taxCredits: TaxCredit[];
  onTaxCreditsChange: (items: TaxCredit[]) => void;
  country: "CA" | "US" | "AU";
  filingStatus: FilingStatus;
  annualIncome: number;
  taxYear: number;
  debts?: Debt[];
  onDebtsChange?: (debts: Debt[]) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Expenses & Tax Credits</h2>
        <p className="mt-1 text-sm text-slate-400">
          Monthly living expenses — rent, groceries, subscriptions, etc.
        </p>
      </div>
      <ExpenseEntry
        items={items}
        onChange={onChange}
        homeCurrency={homeCurrency}
        fxRates={fxRates}
        debts={debts}
        onDebtsChange={onDebtsChange}
      />
      <TaxCreditEntry
        items={taxCredits}
        onChange={onTaxCreditsChange}
        country={country}
        filingStatus={filingStatus}
        annualIncome={annualIncome}
        taxYear={taxYear}
      />
    </div>
  );
}
