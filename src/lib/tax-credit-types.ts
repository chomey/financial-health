export type USFilingStatus = "single" | "married-jointly" | "married-separately" | "head-of-household";
export type CAFilingStatus = "single" | "married-common-law";
export type AUFilingStatus = "single" | "married-de-facto";
export type FilingStatus = USFilingStatus | CAFilingStatus | AUFilingStatus;

export interface IncomeLimitThresholds {
  phaseOutStart?: number;
  phaseOutEnd?: number;
  hardCap?: number;
  ineligible?: boolean;
}

export interface TaxCreditYearOverride {
  maxAmount?: number;
  description?: string;
  incomeLimits?: Partial<Record<FilingStatus, IncomeLimitThresholds>>;
  amountOptions?: { label: string; value: number }[];
}

export interface TaxCreditCategory {
  name: string;
  type: "refundable" | "non-refundable" | "deduction";
  jurisdiction: "CA" | "US" | "AU";
  description: string;
  incomeLimits: Partial<Record<FilingStatus, IncomeLimitThresholds>>;
  infoOnly?: boolean;
  maxAmount?: number;
  requiresSpouse?: boolean;
  yearOverrides?: Record<number, TaxCreditYearOverride>;
  fixedAmount?: boolean;
  amountOptions?: { label: string; value: number }[];
}

export interface TaxCredit {
  id: string;
  category: string;
  annualAmount: number;
  type: "refundable" | "non-refundable" | "deduction";
}
