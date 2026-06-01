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
import type { FinancialData, Insight } from "@/lib/insights/types";

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

export interface TaxBracketSegment {
  min: number;
  max: number;
  rate: number;
  amountInBracket: number;
  taxInBracket: number;
}

export interface BracketSegmentArgs {
  jurisdiction: string;
  year: number;
  grossAnnualIncome: number;
  capGainsTotal: number;
}

export interface BracketSegmentResult {
  federalBrackets: TaxBracketSegment[];
  regionalBrackets: TaxBracketSegment[];
  federalBPA: number;
  regionalBPA: number;
}

export interface TaxEngine {
  computeTax(annualIncome: number, type: IncomeType, jurisdiction: string, year: number): TaxResult;
  getMarginalRate(annualIncome: number, jurisdiction: string, year: number): number;
  classifyTaxTreatment(category: string): TaxTreatment;
  getWithdrawalTaxRate(args: WithdrawalTaxArgs): WithdrawalTaxResult;
  getEarlyWithdrawalPenalties(categories: string[], age: number): EarlyWithdrawalPenalty[];
  /** Compute federal + regional bracket segments for tax-explainer rendering.
   * Pass `grossAnnualIncome: 0` to get a reference rendering (all amounts zero). */
  computeBracketSegments(args: BracketSegmentArgs): BracketSegmentResult;
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
  getAllCategories(year: number): TaxCreditCategory[];
  findCategory(name: string, year: number): TaxCreditCategory | undefined;
}

export interface ProfileLibrary {
  samples: SampleProfile[];
  quickStarts: SampleProfile[];
}

export interface InsightProvider {
  getCandidates(state: FinancialState, data?: FinancialData): Insight[];
}

export interface RmdRule {
  /** Country-specific summary label used in the UI (e.g. "RMD", "RRIF minimum"). */
  ruleName: string;
  /** Compute the annual minimum required distribution for one account.
   * Returns 0 if the account category does not have an RMD/RRIF requirement. */
  computeRmd(balance: number, age: number, category: string): number;
}

export interface AgeGroupBenchmark {
  ageMin: number;
  ageMax: number;
  label: string;
  medianNetWorth: number;
  medianSavingsRate: number;
  medianDebtToIncomeRatio: number;
  recommendedEmergencyMonths: number;
  medianIncome: number;
}

export interface NationalAverage {
  netWorth: number;
  savingsRate: number;
  debtToIncomeRatio: number;
  emergencyMonths: number;
  income: number;
}

export interface BenchmarkData {
  ageGroups: AgeGroupBenchmark[];
  national: NationalAverage;
  /** Short attribution string shown in the UI footer. */
  dataSource: string;
}

export interface RawFlowchartStep {
  id: string;
  title: string;
  description: string;
  completionHint: string;
  detailText: string;
  progress: number;
  isComplete: boolean;
  userAcknowledgeable?: boolean;
  acknowledgeLabel?: string;
  skippable?: boolean;
  skipLabel?: string;
}

export interface FlowchartStepsBuilder {
  /** Build country-specific raw flowchart steps for the user's state. */
  build(state: FinancialState, isRetired: boolean): RawFlowchartStep[];
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
  rmd: RmdRule;
  benchmarks: BenchmarkData;
  flowchartSteps: FlowchartStepsBuilder;
  wizardRegisteredCategories: [string, string];
  flowchartWiki: FlowchartWiki;
  regionTaxLabel: string;
}
