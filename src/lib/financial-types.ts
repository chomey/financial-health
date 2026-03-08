import type { Asset } from "@/components/AssetEntry";
import type { Debt } from "@/components/DebtEntry";
import type { IncomeItem } from "@/components/IncomeEntry";
import type { ExpenseItem } from "@/components/ExpenseEntry";
import type { Property } from "@/components/PropertyEntry";
import type { StockHolding } from "@/components/StockEntry";
import type { FxRates } from "@/lib/currency";
import type { TaxCredit, FilingStatus } from "@/lib/tax-credits";

export interface FinancialState {
  assets: Asset[];
  debts: Debt[];
  income: IncomeItem[];
  expenses: ExpenseItem[];
  properties: Property[];
  stocks: StockHolding[];
  country?: "CA" | "US";
  jurisdiction?: string;
  age?: number;
  federalTaxOverride?: number; // annual override; undefined = use computed
  provincialTaxOverride?: number; // annual override; undefined = use computed
  surplusTargetComputedId?: string; // set when surplus target is a computed asset (e.g. "_computed_stocks")
  fxRates?: FxRates; // live FX rates (transient, not URL-persisted)
  fxManualOverride?: number; // manual FX override: 1 foreign = X home (persisted in URL)
  taxCredits?: TaxCredit[]; // tax credits and deductions
  filingStatus?: FilingStatus; // filing status for income limit checks
  taxYear?: number; // tax year for brackets/credits (2025 or 2026, default 2025)
}

export const INITIAL_STATE: FinancialState = {
  assets: [
    { id: "a1", category: "Savings Account", amount: 5000, surplusTarget: true },
    { id: "a2", category: "TFSA", amount: 22000 },
    { id: "a3", category: "RRSP", amount: 28000 },
  ],
  debts: [
    { id: "d1", category: "Car Loan", amount: 5000 },
  ],
  income: [
    { id: "i1", category: "Salary", amount: 4500 },
  ],
  expenses: [
    { id: "e1", category: "Rent/Mortgage Payment", amount: 1800 },
    { id: "e2", category: "Groceries", amount: 500 },
    { id: "e3", category: "Subscriptions", amount: 50 },
  ],
  properties: [],
  stocks: [],
  country: "CA",
  jurisdiction: "ON",
};
