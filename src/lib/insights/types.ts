import type { TaxCredit, FilingStatus } from "@/lib/tax-credits";

export interface DebtDetail {
  category: string;
  amount: number;
  interestRate?: number;
  monthlyPayment?: number;
}

export interface FinancialData {
  totalAssets: number;
  totalDebts: number;
  /** Liquid assets only (excludes property equity). Used for runway calculation. */
  liquidAssets?: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  /** Raw monthly expenses without investment contributions. Used for runway to match metric card. */
  rawMonthlyExpenses?: number;
  /** Monthly mortgage payments. Included in runway obligations alongside expenses. */
  monthlyMortgagePayments?: number;
  /** Individual debt details for interest-based insights */
  debts?: DebtDetail[];
  /** Effective tax rate (0-1) for tax insights */
  effectiveTaxRate?: number;
  /** Estimated annual tax amount */
  annualTax?: number;
  /** Whether any income is capital gains type */
  hasCapitalGains?: boolean;
  /** Home currency code (e.g., "CAD", "USD") for formatting */
  homeCurrency?: string;
  /** Total annual employer match across all eligible accounts */
  employerMatchAnnual?: number;
  /** FIRE number: portfolio size needed for financial independence (annual expenses / 4% SWR) */
  fireNumber?: number;
  /** Years until net worth reaches FIRE number (null = already reached, undefined = not enough data) */
  yearsToFire?: number | null;
  /** Marginal tax rate (0-1) for tax optimization suggestions */
  marginalRate?: number;
  /** Country code for country-specific account name suggestions */
  country?: "CA" | "US" | "AU";
  /** Annual employment income for RRSP/401k contribution suggestions */
  annualEmploymentIncome?: number;
  /** Income replacement ratio: % of monthly income sustainable by portfolio via 4% rule */
  incomeReplacementRatio?: number;
  /** Total monthly debt payments (minimum payments + mortgage). Used for DTI ratio. */
  monthlyDebtPayments?: number;
  /** Gross monthly income before tax. Used for DTI ratio calculation. */
  monthlyGrossIncome?: number;
  /** Monthly housing cost (mortgage payment or rent). Used for housing cost ratio. */
  monthlyHousingCost?: number;
  /** User's current age. Used for Coast FIRE and age-based insights. */
  currentAge?: number;
  /** Target retirement age. Default 65. Used for FIRE/Coast FIRE calculations. */
  retirementAge?: number;
  /** Monthly government retirement income (CPP+OAS, Social Security, Age Pension). Reduces FIRE number. */
  monthlyGovernmentRetirementIncome?: number;
  /** Total monthly investment contributions. Used for Coast FIRE projection. */
  monthlySavings?: number;
  /** User-entered tax credits and deductions */
  taxCredits?: TaxCredit[];
  /** Filing status for income limit eligibility checks */
  filingStatus?: FilingStatus;
  /** Whether user owns property (for homeowner-specific credit suggestions) */
  isHomeowner?: boolean;
  /** Whether user has student loan debts (for education credit suggestions) */
  hasStudentLoans?: boolean;
  /** Whether user has child care expenses (for child-related credit suggestions) */
  hasChildCareExpenses?: boolean;
  /** Asset category names the user has entered (for context-aware insights) */
  assetCategories?: string[];
  /** Debt category names the user has entered (for context-aware insights) */
  debtCategories?: string[];
  /** Total monthly investment returns (from asset ROI). Added to surplus to match metric card. */
  monthlyInvestmentReturns?: number;
  /** Outlook years (20/30/40/50) for timeline-scaled insight messages. */
  outlookYears?: number;
  /** Withdrawal tax impact data */
  withdrawalTax?: {
    /** Early withdrawal penalties based on user's current age */
    earlyWithdrawalPenalties?: import("@/lib/withdrawal-tax").EarlyWithdrawalPenalty[];
    /** How many months shorter the runway is due to withdrawal taxes */
    taxDragMonths: number;
    /** Optimal withdrawal order for this account mix */
    withdrawalOrder: string[];
    /** Account balances grouped by tax treatment */
    accountsByTreatment: {
      taxFree: { categories: string[]; total: number };
      taxDeferred: { categories: string[]; total: number };
      taxable: { categories: string[]; total: number };
    };
  };
}

export type InsightType = "runway" | "surplus" | "net-worth" | "savings-rate" | "debt-interest" | "tax" | "withdrawal-tax" | "employer-match" | "debt-strategy" | "fire" | "tax-optimization" | "income-replacement" | "debt-to-income" | "housing-cost" | "coast-fire" | "net-worth-milestone" | "net-worth-percentile" | "tax-credits-summary" | "tax-credits-unclaimed" | "tax-credits-refundable" | "tax-credits-ineligible" | "au-super" | "au-hecs-help" | "au-fhss" | "au-franking" | "au-mls";

export interface Insight {
  id: string;
  type: InsightType;
  message: string;
  icon: string;
}

/** Maximum insights to display in the UI (used by InsightsPanel) */
export const MAX_INSIGHTS = 8;
