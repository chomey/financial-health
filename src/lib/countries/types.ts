import type { TaxResult, IncomeType } from "@/lib/tax-engine";
import type {
  TaxTreatment,
  WithdrawalTaxResult,
  EarlyWithdrawalPenalty,
} from "@/lib/withdrawal-tax";
import type { TaxCreditCategory, FilingStatus } from "@/lib/tax-credits";
import type {
  GovernmentRetirementIncome,
  FinancialState,
} from "@/lib/financial-types";
import type { SampleProfile } from "@/lib/sample-profiles";
import type { SupportedCurrency, Locale } from "@/lib/currency";
import type { Insight } from "@/lib/insights/types";

export type CountryCode = "CA" | "US" | "AU";

export interface Jurisdiction {
  code: string;
  name: string;
}

export interface WithdrawalTaxArgs {
  category: string;
  jurisdiction: string;
  annualWithdrawal: number;
  costBasisPercent?: number;
  roiTaxTreatment?: "capital-gains" | "income";
  year?: number;
}

export interface TaxEngine {
  computeTax(annualIncome: number, type: IncomeType, jurisdiction: string, year: number): TaxResult;
  getMarginalRate(annualIncome: number, jurisdiction: string, year: number): number;
  classifyTaxTreatment(category: string): TaxTreatment;
  getWithdrawalTaxRate(args: WithdrawalTaxArgs): WithdrawalTaxResult;
  getEarlyWithdrawalPenalties(categories: string[], age: number): EarlyWithdrawalPenalty[];
}

export interface VehicleCatalog {
  categories: string[];
  flagEmoji: string;
  getDescription(category: string): string | undefined;
  getDefaultRoi(category: string): number | undefined;
  isTaxSheltered(category: string): boolean;
  isTaxDeferred(category: string): boolean;
  isIncomeTaxRoi(category: string): boolean;
  isReinvestDefault(category: string): boolean;
  isEmployerMatchEligible(category: string): boolean;
}

export interface GovernmentRetirementPlugin {
  programLabel: string;
  computeMonthly(income: GovernmentRetirementIncome | undefined): number;
  presetsFor(field: string): { value: string; label: string; amount: number }[];
}

export interface FlowchartWiki {
  tipName: string;
  linkText: string;
  linkUrl: string;
}

export interface TaxCreditCatalog {
  getCategories(year: number): TaxCreditCategory[];
  getCategoriesForFilingStatus(filingStatus: FilingStatus, year: number): TaxCreditCategory[];
  findCategory(name: string, year: number): TaxCreditCategory | undefined;
}

export interface ProfileLibrary {
  samples: SampleProfile[];
  quickStarts: SampleProfile[];
}

export interface InsightProvider {
  getCandidates(state: FinancialState): Insight[];
}

export type { Locale };

export interface CountryProfile {
  code: CountryCode;
  displayName: string;
  shortLabel: string;
  flagEmoji: string;
  homeCurrency: SupportedCurrency;
  locale: Locale;
  jurisdictions: Jurisdiction[];
  defaultJurisdiction: string;
  filingStatuses: { value: FilingStatus; label: string }[];
  defaultFilingStatus: FilingStatus;
  taxYearLabel(year: number): string;
  taxYearBoundary: { startMonth: number; startDay: number };
  taxEngine: TaxEngine;
  vehicles: VehicleCatalog;
  governmentRetirement: GovernmentRetirementPlugin;
  taxCredits: TaxCreditCatalog;
  profiles: ProfileLibrary;
  insights: InsightProvider;
  wizardRegisteredCategories: [string, string];
  flowchartWiki: FlowchartWiki;
  regionTaxLabel: string;
}
