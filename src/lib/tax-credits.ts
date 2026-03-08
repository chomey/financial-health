/**
 * Tax credits and deductions data model.
 * Supports per-filing-status income limits for eligibility indicators.
 */

// Filing status types
export type USFilingStatus = "single" | "married-jointly" | "married-separately" | "head-of-household";
export type CAFilingStatus = "single" | "married-common-law";
export type FilingStatus = USFilingStatus | CAFilingStatus;

/** Get available filing statuses for a country */
export function getFilingStatuses(country: "CA" | "US"): { value: FilingStatus; label: string }[] {
  if (country === "US") {
    return [
      { value: "single", label: "Single" },
      { value: "married-jointly", label: "Married Filing Jointly" },
      { value: "married-separately", label: "Married Filing Separately" },
      { value: "head-of-household", label: "Head of Household" },
    ];
  }
  return [
    { value: "single", label: "Single" },
    { value: "married-common-law", label: "Married / Common-Law" },
  ];
}

/** Get the default filing status for a country */
export function getDefaultFilingStatus(country: "CA" | "US"): FilingStatus {
  return "single";
}

/** Income limit thresholds for a specific filing status */
export interface IncomeLimitThresholds {
  /** AGI/net income where the credit begins to reduce */
  phaseOutStart?: number;
  /** AGI/net income where the credit is fully phased out */
  phaseOutEnd?: number;
  /** Absolute income cutoff — fully ineligible above this */
  hardCap?: number;
  /** This filing status cannot claim this credit at all */
  ineligible?: boolean;
}

/** A tax credit/deduction category definition */
export interface TaxCreditCategory {
  /** Display name */
  name: string;
  /** Credit type */
  type: "refundable" | "non-refundable" | "deduction";
  /** Which jurisdiction this applies to */
  jurisdiction: "CA" | "US";
  /** Short plain-English explanation */
  description: string;
  /** Income limits per filing status */
  incomeLimits: Partial<Record<FilingStatus, IncomeLimitThresholds>>;
  /** If true, show as info note only (already tracked elsewhere in the app) */
  infoOnly?: boolean;
  /** Maximum credit amount (for display) */
  maxAmount?: number;
  /** If true, only show when filing status is married/common-law */
  requiresSpouse?: boolean;
}

/** A user-entered tax credit/deduction */
export interface TaxCredit {
  id: string;
  category: string;
  annualAmount: number;
  type: "refundable" | "non-refundable" | "deduction";
}

/** Check income eligibility for a credit given income and filing status */
export function checkIncomeEligibility(
  category: TaxCreditCategory,
  annualIncome: number,
  filingStatus: FilingStatus,
): "eligible" | "reduced" | "ineligible" {
  const limits = category.incomeLimits[filingStatus];
  if (!limits) return "eligible"; // no limits defined for this status

  if (limits.ineligible) return "ineligible";

  if (limits.hardCap !== undefined && annualIncome > limits.hardCap) {
    return "ineligible";
  }

  if (limits.phaseOutEnd !== undefined && annualIncome > limits.phaseOutEnd) {
    return "ineligible";
  }

  if (limits.phaseOutStart !== undefined && annualIncome > limits.phaseOutStart) {
    return "reduced";
  }

  return "eligible";
}

/** Get a human-readable income limit description for a credit and filing status */
export function getIncomeLimitDescription(
  category: TaxCreditCategory,
  filingStatus: FilingStatus,
): string | null {
  const limits = category.incomeLimits[filingStatus];
  if (!limits) return null;

  if (limits.ineligible) {
    const statusLabel = filingStatus === "married-separately" ? "Married Filing Separately" :
      filingStatus === "married-jointly" ? "Married Filing Jointly" :
      filingStatus === "head-of-household" ? "Head of Household" :
      filingStatus === "married-common-law" ? "Married/Common-Law" : "Single";
    return `Not available for ${statusLabel}`;
  }

  if (limits.hardCap !== undefined) {
    return `Income must be below $${limits.hardCap.toLocaleString()}`;
  }

  if (limits.phaseOutStart !== undefined && limits.phaseOutEnd !== undefined) {
    return `Phases out between $${limits.phaseOutStart.toLocaleString()} and $${limits.phaseOutEnd.toLocaleString()}`;
  }

  if (limits.phaseOutStart !== undefined) {
    return `Begins to phase out above $${limits.phaseOutStart.toLocaleString()}`;
  }

  return null;
}

/** Get all credit categories for a jurisdiction, excluding info-only entries */
export function getCreditCategories(jurisdiction: "CA" | "US"): TaxCreditCategory[] {
  return ALL_CREDIT_CATEGORIES.filter(
    (c) => c.jurisdiction === jurisdiction && !c.infoOnly,
  );
}

/**
 * Get credit categories filtered by jurisdiction and filing status.
 * Excludes info-only entries and spouse-only credits when not married.
 */
export function getCreditCategoriesForFilingStatus(
  jurisdiction: "CA" | "US",
  filingStatus: FilingStatus,
): TaxCreditCategory[] {
  const isMarried =
    filingStatus === "married-common-law" || filingStatus === "married-jointly";
  return ALL_CREDIT_CATEGORIES.filter(
    (c) =>
      c.jurisdiction === jurisdiction &&
      !c.infoOnly &&
      (!c.requiresSpouse || isMarried),
  );
}

/** Get all credit categories including info-only for a jurisdiction */
export function getAllCreditCategories(jurisdiction: "CA" | "US"): TaxCreditCategory[] {
  return ALL_CREDIT_CATEGORIES.filter((c) => c.jurisdiction === jurisdiction);
}

/** Look up a category definition by name and jurisdiction */
export function findCreditCategory(name: string, jurisdiction: "CA" | "US"): TaxCreditCategory | undefined {
  return ALL_CREDIT_CATEGORIES.find(
    (c) => c.name === name && c.jurisdiction === jurisdiction,
  );
}

export const ALL_CREDIT_CATEGORIES: TaxCreditCategory[] = [
  // --- Canadian credits ---
  {
    name: "Disability Tax Credit (DTC)",
    type: "non-refundable",
    jurisdiction: "CA",
    description:
      "For individuals with a severe and prolonged impairment in mental or physical functions. Worth ~$9,428 federally (plus ~$5,500 supplement for under-18). No income limit — available regardless of income. Unused portion can be transferred to a supporting spouse or family member.",
    incomeLimits: {},
    maxAmount: 9428,
  },
  {
    name: "Spousal Amount Credit",
    type: "non-refundable",
    jurisdiction: "CA",
    description:
      "Claimable when your spouse or common-law partner's net income is below ~$15,705. Worth up to ~$2,359 federally. Only available to married or common-law couples.",
    incomeLimits: {},
    requiresSpouse: true,
    maxAmount: 2359,
  },
  {
    name: "Canada Caregiver Credit",
    type: "non-refundable",
    jurisdiction: "CA",
    description:
      "For individuals supporting a dependent with a physical or mental impairment. Worth up to ~$7,999. Phases out as the dependant's net income exceeds ~$18,783 (based on dependant's income, not yours).",
    incomeLimits: {},
    maxAmount: 7999,
  },
  {
    name: "Medical Expense Tax Credit",
    type: "non-refundable",
    jurisdiction: "CA",
    description:
      "15% federal credit on eligible medical expenses exceeding the lesser of 3% of your net income or $2,759. No income cap, but the effective benefit shrinks as income rises since the 3% floor grows. Includes prescriptions, dental, vision, and many specialist costs.",
    incomeLimits: {},
  },
  {
    name: "Home Accessibility Tax Credit",
    type: "non-refundable",
    jurisdiction: "CA",
    description:
      "15% credit on up to $20,000 of eligible renovation costs that make your home safer or more accessible. Available to individuals 65+ or those who qualify for the Disability Tax Credit. No income limit.",
    incomeLimits: {},
    maxAmount: 20000,
  },
  {
    name: "Canada Workers Benefit (CWB)",
    type: "refundable",
    jurisdiction: "CA",
    description:
      "Refundable credit for low-income workers. Single: phases out between $23,495 and $33,015. Married/common-law: phases out between $26,805 and $43,212 based on combined family income.",
    incomeLimits: {
      single: { phaseOutStart: 23495, phaseOutEnd: 33015 },
      "married-common-law": { phaseOutStart: 26805, phaseOutEnd: 43212 },
    },
    maxAmount: 1518,
  },
  {
    name: "GST/HST Credit",
    type: "refundable",
    jurisdiction: "CA",
    description:
      "Quarterly payment to offset the cost of sales tax for low- and moderate-income individuals and families. Single: phases out above ~$42,335. Married/common-law: phases out above ~$55,286 in combined family net income.",
    incomeLimits: {
      single: { phaseOutStart: 42335 },
      "married-common-law": { phaseOutStart: 55286 },
    },
    maxAmount: 519,
  },
  {
    name: "Canada Child Benefit (CCB)",
    type: "refundable",
    jurisdiction: "CA",
    description:
      "Monthly tax-free payment for families with children under 18. Based on combined family net income — always uses spousal income when married/common-law. Phases out above $36,502 family net income (rate depends on number of children).",
    incomeLimits: {
      single: { phaseOutStart: 36502 },
      "married-common-law": { phaseOutStart: 36502 },
    },
    maxAmount: 7437,
  },
  {
    name: "Climate Action Incentive",
    type: "refundable",
    jurisdiction: "CA",
    description:
      "Quarterly carbon rebate for residents in provinces where the federal fuel charge applies (AB, SK, MB, ON, NB, NS, PEI, NL). Married/common-law families receive a higher base amount. Phases out above ~$68,000 in family net income.",
    incomeLimits: {
      single: { phaseOutStart: 68000 },
      "married-common-law": { phaseOutStart: 68000 },
    },
  },
  {
    name: "Canada Training Credit",
    type: "refundable",
    jurisdiction: "CA",
    description:
      "Up to $250/year (lifetime limit $5,000) for eligible training fees at designated institutions. Your individual income must be between $10,342 and $150,473. Not affected by spousal income.",
    incomeLimits: {
      single: { hardCap: 150473 },
      "married-common-law": { hardCap: 150473 },
    },
    maxAmount: 250,
  },
  {
    name: "Moving Expenses Deduction",
    type: "deduction",
    jurisdiction: "CA",
    description:
      "Deductible moving costs when you relocate at least 40 km closer to a new job, business, or post-secondary school. Covers transport, storage, travel, and temporary accommodation. No income limit; deducted against income earned at new location.",
    incomeLimits: {},
  },
  {
    name: "Child Care Expenses Deduction",
    type: "deduction",
    jurisdiction: "CA",
    description:
      "Deductible child care costs (daycare, camps, babysitters) up to $8,000/child under 7, $5,000 for ages 7–16. Must generally be claimed by the lower-income spouse when married/common-law.",
    incomeLimits: {},
    maxAmount: 8000,
  },
  {
    name: "RRSP Deduction",
    type: "deduction",
    jurisdiction: "CA",
    description: "Already tracked in your Assets — no need to enter here. Spousal RRSP contributions are also tracked there.",
    incomeLimits: {},
    infoOnly: true,
  },
  {
    name: "Union & Professional Dues",
    type: "deduction",
    jurisdiction: "CA",
    description:
      "Annual dues paid to a union, professional association, or regulatory body required to maintain your professional status are fully deductible. No income limit.",
    incomeLimits: {},
  },
  {
    name: "Northern Residents Deduction",
    type: "deduction",
    jurisdiction: "CA",
    description:
      "For individuals who live in a prescribed northern or intermediate zone for at least 6 consecutive months. Includes a residency deduction and a travel benefit deduction. No income limit — you must qualify geographically.",
    incomeLimits: {},
  },

  // --- US credits ---
  {
    name: "Earned Income Tax Credit (EITC)",
    type: "refundable",
    jurisdiction: "US",
    description: "For low-to-moderate income workers. Amount depends on income and number of children.",
    incomeLimits: {
      single: { phaseOutStart: 17640, phaseOutEnd: 56838 },
      "head-of-household": { phaseOutStart: 17640, phaseOutEnd: 56838 },
      "married-jointly": { phaseOutStart: 24210, phaseOutEnd: 64268 },
      "married-separately": { ineligible: true },
    },
    maxAmount: 7430,
  },
  {
    name: "Child Tax Credit",
    type: "refundable",
    jurisdiction: "US",
    description: "$2,000 per child under 17. Partially refundable.",
    incomeLimits: {
      single: { phaseOutStart: 200000 },
      "head-of-household": { phaseOutStart: 200000 },
      "married-jointly": { phaseOutStart: 400000 },
      "married-separately": { phaseOutStart: 200000 },
    },
    maxAmount: 2000,
  },
  {
    name: "American Opportunity Tax Credit (AOTC)",
    type: "refundable",
    jurisdiction: "US",
    description: "Up to $2,500/student for first 4 years of college. 40% refundable.",
    incomeLimits: {
      single: { phaseOutStart: 80000, phaseOutEnd: 90000 },
      "head-of-household": { phaseOutStart: 80000, phaseOutEnd: 90000 },
      "married-jointly": { phaseOutStart: 160000, phaseOutEnd: 180000 },
      "married-separately": { ineligible: true },
    },
    maxAmount: 2500,
  },
  {
    name: "Lifetime Learning Credit",
    type: "non-refundable",
    jurisdiction: "US",
    description: "Up to $2,000/year for education expenses.",
    incomeLimits: {
      single: { phaseOutStart: 80000, phaseOutEnd: 90000 },
      "head-of-household": { phaseOutStart: 80000, phaseOutEnd: 90000 },
      "married-jointly": { phaseOutStart: 160000, phaseOutEnd: 180000 },
      "married-separately": { ineligible: true },
    },
    maxAmount: 2000,
  },
  {
    name: "Saver's Credit",
    type: "non-refundable",
    jurisdiction: "US",
    description: "Up to $1,000/$2,000 for low-income retirement savers.",
    incomeLimits: {
      single: { hardCap: 38250 },
      "head-of-household": { hardCap: 57375 },
      "married-jointly": { hardCap: 76500 },
      "married-separately": { hardCap: 38250 },
    },
    maxAmount: 2000,
  },
  {
    name: "Electric Vehicle Credit",
    type: "non-refundable",
    jurisdiction: "US",
    description: "Up to $7,500 for new qualifying EVs.",
    incomeLimits: {
      single: { hardCap: 150000 },
      "head-of-household": { hardCap: 225000 },
      "married-jointly": { hardCap: 300000 },
      "married-separately": { hardCap: 150000 },
    },
    maxAmount: 7500,
  },
  {
    name: "Residential Clean Energy Credit",
    type: "non-refundable",
    jurisdiction: "US",
    description: "30% of costs for solar, wind, or geothermal installations. No income limit.",
    incomeLimits: {},
  },
  {
    name: "Student Loan Interest Deduction",
    type: "deduction",
    jurisdiction: "US",
    description: "Up to $2,500 for student loan interest paid.",
    incomeLimits: {
      single: { phaseOutStart: 80000, phaseOutEnd: 95000 },
      "head-of-household": { phaseOutStart: 80000, phaseOutEnd: 95000 },
      "married-jointly": { phaseOutStart: 165000, phaseOutEnd: 195000 },
      "married-separately": { ineligible: true },
    },
    maxAmount: 2500,
  },
  {
    name: "SALT Deduction",
    type: "deduction",
    jurisdiction: "US",
    description: "State and local tax deduction. Capped at $10,000 ($5,000 if MFS).",
    incomeLimits: {},
    maxAmount: 10000,
  },
  {
    name: "HSA Deduction",
    type: "deduction",
    jurisdiction: "US",
    description: "Already tracked in your Assets — no need to enter here.",
    incomeLimits: {},
    infoOnly: true,
  },
  {
    name: "Mortgage Interest Deduction",
    type: "deduction",
    jurisdiction: "US",
    description: "Already tracked in your Properties — no need to enter here.",
    incomeLimits: {},
    infoOnly: true,
  },
];
