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

/** Per-year overrides for credit values that change with inflation indexing */
export interface TaxCreditYearOverride {
  maxAmount?: number;
  description?: string;
  incomeLimits?: Partial<Record<FilingStatus, IncomeLimitThresholds>>;
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
  /** Year-specific overrides (e.g., indexed amounts for 2026) */
  yearOverrides?: Record<number, TaxCreditYearOverride>;
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

/**
 * Resolve a credit category for a specific tax year by merging yearOverrides.
 * Returns a new object with overridden fields applied (does not mutate original).
 */
function resolveCategoryForYear(category: TaxCreditCategory, year: number): TaxCreditCategory {
  const overrides = category.yearOverrides?.[year];
  if (!overrides) return category;
  return {
    ...category,
    ...(overrides.maxAmount !== undefined ? { maxAmount: overrides.maxAmount } : {}),
    ...(overrides.description !== undefined ? { description: overrides.description } : {}),
    ...(overrides.incomeLimits !== undefined ? { incomeLimits: overrides.incomeLimits } : {}),
  };
}

/** Get all credit categories for a jurisdiction, excluding info-only entries */
export function getCreditCategories(jurisdiction: "CA" | "US", year: number = 2025): TaxCreditCategory[] {
  return ALL_CREDIT_CATEGORIES
    .filter((c) => c.jurisdiction === jurisdiction && !c.infoOnly)
    .map((c) => resolveCategoryForYear(c, year));
}

/**
 * Get credit categories filtered by jurisdiction and filing status.
 * Excludes info-only entries and spouse-only credits when not married.
 */
export function getCreditCategoriesForFilingStatus(
  jurisdiction: "CA" | "US",
  filingStatus: FilingStatus,
  year: number = 2025,
): TaxCreditCategory[] {
  const isMarried =
    filingStatus === "married-common-law" || filingStatus === "married-jointly";
  return ALL_CREDIT_CATEGORIES
    .filter(
      (c) =>
        c.jurisdiction === jurisdiction &&
        !c.infoOnly &&
        (!c.requiresSpouse || isMarried),
    )
    .map((c) => resolveCategoryForYear(c, year));
}

/** Get all credit categories including info-only for a jurisdiction */
export function getAllCreditCategories(jurisdiction: "CA" | "US", year: number = 2025): TaxCreditCategory[] {
  return ALL_CREDIT_CATEGORIES
    .filter((c) => c.jurisdiction === jurisdiction)
    .map((c) => resolveCategoryForYear(c, year));
}

/** Look up a category definition by name and jurisdiction */
export function findCreditCategory(name: string, jurisdiction: "CA" | "US", year: number = 2025): TaxCreditCategory | undefined {
  const found = ALL_CREDIT_CATEGORIES.find(
    (c) => c.name === name && c.jurisdiction === jurisdiction,
  );
  return found ? resolveCategoryForYear(found, year) : undefined;
}

export const ALL_CREDIT_CATEGORIES: TaxCreditCategory[] = [
  // --- Canadian credits ---
  {
    name: "Disability Tax Credit (DTC)",
    type: "non-refundable",
    jurisdiction: "CA",
    description:
      "For individuals with a severe and prolonged impairment in mental or physical functions. Worth ~$10,138 federally (plus ~$5,914 supplement for under-18). No income limit — available regardless of income. Unused portion can be transferred to a supporting spouse or family member.",
    incomeLimits: {},
    maxAmount: 10_138,
    yearOverrides: {
      2026: {
        maxAmount: 10_412,
        description: "For individuals with a severe and prolonged impairment in mental or physical functions. Worth ~$10,412 federally (plus ~$6,074 supplement for under-18). No income limit — available regardless of income. Unused portion can be transferred to a supporting spouse or family member.",
      },
    },
  },
  {
    name: "Spousal Amount Credit",
    type: "non-refundable",
    jurisdiction: "CA",
    description:
      "Claimable when your spouse or common-law partner's net income is below ~$16,129. Worth up to ~$2,419 federally. Only available to married or common-law couples.",
    incomeLimits: {},
    requiresSpouse: true,
    maxAmount: 2_419,
    yearOverrides: {
      2026: {
        maxAmount: 2_485,
        description: "Claimable when your spouse or common-law partner's net income is below ~$16,564. Worth up to ~$2,485 federally. Only available to married or common-law couples.",
      },
    },
  },
  {
    name: "Canada Caregiver Credit",
    type: "non-refundable",
    jurisdiction: "CA",
    description:
      "For individuals supporting a dependent with a physical or mental impairment. Worth up to ~$8,601. Phases out as the dependant's net income exceeds ~$20,197 (based on dependant's income, not yours).",
    incomeLimits: {},
    maxAmount: 8_601,
    yearOverrides: {
      2026: {
        maxAmount: 8_833,
        description: "For individuals supporting a dependent with a physical or mental impairment. Worth up to ~$8,833. Phases out as the dependant's net income exceeds ~$20,742 (based on dependant's income, not yours).",
      },
    },
  },
  {
    name: "Medical Expense Tax Credit",
    type: "non-refundable",
    jurisdiction: "CA",
    description:
      "15% federal credit on eligible medical expenses exceeding the lesser of 3% of your net income or $2,833. No income cap, but the effective benefit shrinks as income rises since the 3% floor grows. Includes prescriptions, dental, vision, and many specialist costs.",
    incomeLimits: {},
    yearOverrides: {
      2026: {
        description: "15% federal credit on eligible medical expenses exceeding the lesser of 3% of your net income or $2,910. No income cap, but the effective benefit shrinks as income rises since the 3% floor grows. Includes prescriptions, dental, vision, and many specialist costs.",
      },
    },
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
      "Refundable credit for low-income workers. Single: up to $1,633, phases out between $24,975 and $35,862. Married/common-law: up to $2,813, phases out between $28,494 and $47,247 based on combined family income.",
    incomeLimits: {
      single: { phaseOutStart: 24_975, phaseOutEnd: 35_862 },
      "married-common-law": { phaseOutStart: 28_494, phaseOutEnd: 47_247 },
    },
    maxAmount: 1_633,
    yearOverrides: {
      2026: {
        maxAmount: 1_677,
        description: "Refundable credit for low-income workers. Single: up to $1,677, phases out between $25,649 and $36,830. Married/common-law: up to $2,889, phases out between $29,263 and $48,523 based on combined family income.",
        incomeLimits: {
          single: { phaseOutStart: 25_649, phaseOutEnd: 36_830 },
          "married-common-law": { phaseOutStart: 29_263, phaseOutEnd: 48_523 },
        },
      },
    },
  },
  {
    name: "GST/HST Credit",
    type: "refundable",
    jurisdiction: "CA",
    description:
      "Quarterly payment to offset the cost of sales tax for low- and moderate-income individuals and families. Single: fully phases out above ~$56,181 in adjusted family net income. Married/common-law: fully phases out above ~$66,841 in combined family net income.",
    incomeLimits: {
      single: { phaseOutStart: 45_521, phaseOutEnd: 56_181 },
      "married-common-law": { phaseOutStart: 45_521, phaseOutEnd: 66_841 },
    },
    maxAmount: 533,
    yearOverrides: {
      2026: {
        maxAmount: 547,
        description: "Quarterly payment to offset the cost of sales tax for low- and moderate-income individuals and families. Single: fully phases out above ~$57,698 in adjusted family net income. Married/common-law: fully phases out above ~$68,645 in combined family net income.",
        incomeLimits: {
          single: { phaseOutStart: 46_750, phaseOutEnd: 57_698 },
          "married-common-law": { phaseOutStart: 46_750, phaseOutEnd: 68_645 },
        },
      },
    },
  },
  {
    name: "Canada Child Benefit (CCB)",
    type: "refundable",
    jurisdiction: "CA",
    description:
      "Monthly tax-free payment for families with children under 18. Up to $7,997 per child under 6 and $6,748 per child aged 6–17. Based on combined family net income — always uses spousal income when married/common-law. Phases out above $37,487 family net income (rate depends on number of children).",
    incomeLimits: {
      single: { phaseOutStart: 37_487 },
      "married-common-law": { phaseOutStart: 37_487 },
    },
    maxAmount: 7_997,
    yearOverrides: {
      2026: {
        maxAmount: 8_213,
        description: "Monthly tax-free payment for families with children under 18. Up to $8,213 per child under 6 and $6,930 per child aged 6–17. Based on combined family net income — always uses spousal income when married/common-law. Phases out above $38,499 family net income (rate depends on number of children).",
        incomeLimits: {
          single: { phaseOutStart: 38_499 },
          "married-common-law": { phaseOutStart: 38_499 },
        },
      },
    },
  },
  {
    name: "Climate Action Incentive",
    type: "refundable",
    jurisdiction: "CA",
    description:
      "Quarterly carbon rebate for residents in provinces where the federal fuel charge applies (AB, SK, MB, ON, NB, NS, PEI, NL). Married/common-law families receive a higher base amount. Not income-tested — all eligible residents receive the payment regardless of income.",
    incomeLimits: {},
  },
  {
    name: "Canada Training Credit",
    type: "refundable",
    jurisdiction: "CA",
    description:
      "Up to $250/year (lifetime limit $5,000) for eligible training fees at designated institutions. Your individual income must be between $10,621 and $154,534. Not affected by spousal income.",
    incomeLimits: {
      single: { hardCap: 154_534 },
      "married-common-law": { hardCap: 154_534 },
    },
    maxAmount: 250,
    yearOverrides: {
      2026: {
        description: "Up to $250/year (lifetime limit $5,000) for eligible training fees at designated institutions. Your individual income must be between $10,908 and $158,706. Not affected by spousal income.",
        incomeLimits: {
          single: { hardCap: 158_706 },
          "married-common-law": { hardCap: 158_706 },
        },
      },
    },
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
    description:
      "Refundable credit for low-to-moderate income workers. Amount varies by income and number of children — up to $8,046 with 3+ children. Phases out: Single/HoH from $21,370 to $59,899 (3+ children), MFJ from $28,120 to $66,819. Not available for Married Filing Separately.",
    incomeLimits: {
      single: { phaseOutStart: 21_370, phaseOutEnd: 59_899 },
      "head-of-household": { phaseOutStart: 21_370, phaseOutEnd: 59_899 },
      "married-jointly": { phaseOutStart: 28_120, phaseOutEnd: 66_819 },
      "married-separately": { ineligible: true },
    },
    maxAmount: 8_046,
    yearOverrides: {
      2026: {
        maxAmount: 8_271,
        description: "Refundable credit for low-to-moderate income workers. Amount varies by income and number of children — up to $8,271 with 3+ children. Phases out: Single/HoH from $21,968 to $61,577 (3+ children), MFJ from $28,907 to $68,690. Not available for Married Filing Separately.",
        incomeLimits: {
          single: { phaseOutStart: 21_968, phaseOutEnd: 61_577 },
          "head-of-household": { phaseOutStart: 21_968, phaseOutEnd: 61_577 },
          "married-jointly": { phaseOutStart: 28_907, phaseOutEnd: 68_690 },
          "married-separately": { ineligible: true },
        },
      },
    },
  },
  {
    name: "Child Tax Credit",
    type: "refundable",
    jurisdiction: "US",
    description:
      "$2,000 per qualifying child under 17. Up to $1,700 is refundable (Additional Child Tax Credit). Phases out $50 per $1,000 of AGI above $200,000 (Single/HoH/MFS) or $400,000 (MFJ). Most families with children under 17 qualify.",
    incomeLimits: {
      single: { phaseOutStart: 200_000 },
      "head-of-household": { phaseOutStart: 200_000 },
      "married-jointly": { phaseOutStart: 400_000 },
      "married-separately": { phaseOutStart: 200_000 },
    },
    maxAmount: 2_000,
    yearOverrides: {
      2026: {
        description: "$2,000 per qualifying child under 17. Up to $1,748 is refundable (Additional Child Tax Credit). Phases out $50 per $1,000 of AGI above $200,000 (Single/HoH/MFS) or $400,000 (MFJ). Most families with children under 17 qualify.",
      },
    },
  },
  {
    name: "Child and Dependent Care Credit",
    type: "non-refundable",
    jurisdiction: "US",
    description:
      "Credit for child care (children under 13) or dependent care expenses that allow you to work or look for work. Worth 20–35% of up to $3,000 (1 child) or $6,000 (2+ children) in expenses. No hard income cap, but the credit rate drops from 35% to 20% as AGI rises above $43,000. Not available for Married Filing Separately.",
    incomeLimits: {
      single: { phaseOutStart: 15000 },
      "head-of-household": { phaseOutStart: 15000 },
      "married-jointly": { phaseOutStart: 15000 },
      "married-separately": { ineligible: true },
    },
    maxAmount: 2100,
  },
  {
    name: "American Opportunity Tax Credit (AOTC)",
    type: "refundable",
    jurisdiction: "US",
    description:
      "Up to $2,500 per eligible student for the first 4 years of post-secondary education. 40% is refundable (up to $1,000). Phases out: Single/HoH from $80,000 to $90,000, MFJ from $160,000 to $180,000. Not available for Married Filing Separately.",
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
    description:
      "Up to $2,000 per tax return (20% of up to $10,000) for tuition and fees at eligible institutions. No limit on years of study — great for graduate school or professional development. Phases out: Single/HoH from $80,000 to $90,000, MFJ from $160,000 to $180,000. Not available for Married Filing Separately.",
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
    description:
      "Non-refundable credit for low- and moderate-income individuals who contribute to a 401(k), IRA, or other retirement account. Worth 10–50% of contributions up to $2,000 ($4,000 MFJ). Fully ineligible above: $39,500 (Single/MFS), $59,250 (HoH), $79,000 (MFJ).",
    incomeLimits: {
      single: { hardCap: 39_500 },
      "head-of-household": { hardCap: 59_250 },
      "married-jointly": { hardCap: 79_000 },
      "married-separately": { hardCap: 39_500 },
    },
    maxAmount: 2_000,
    yearOverrides: {
      2026: {
        description: "Non-refundable credit for low- and moderate-income individuals who contribute to a 401(k), IRA, or other retirement account. Worth 10–50% of contributions up to $2,000 ($4,000 MFJ). Fully ineligible above: $40,600 (Single/MFS), $60,900 (HoH), $81,200 (MFJ).",
        incomeLimits: {
          single: { hardCap: 40_600 },
          "head-of-household": { hardCap: 60_900 },
          "married-jointly": { hardCap: 81_200 },
          "married-separately": { hardCap: 40_600 },
        },
      },
    },
  },
  {
    name: "Premium Tax Credit",
    type: "refundable",
    jurisdiction: "US",
    description:
      "Refundable credit that helps eligible individuals and families cover the cost of health insurance premiums purchased through the Marketplace. Amount is based on income relative to the Federal Poverty Level (FPL). Since the ARP 2021 extension, no hard income cap — anyone paying over a percentage of their income for benchmark coverage may qualify.",
    incomeLimits: {},
    maxAmount: 0,
  },
  {
    name: "Adoption Credit",
    type: "non-refundable",
    jurisdiction: "US",
    description:
      "Up to $17,280 of qualified adoption expenses per eligible child. Non-refundable but can be carried forward up to 5 years. Phases out between $259,190 and $299,190 of modified AGI. Not available for Married Filing Separately.",
    incomeLimits: {
      single: { phaseOutStart: 259_190, phaseOutEnd: 299_190 },
      "head-of-household": { phaseOutStart: 259_190, phaseOutEnd: 299_190 },
      "married-jointly": { phaseOutStart: 259_190, phaseOutEnd: 299_190 },
      "married-separately": { ineligible: true },
    },
    maxAmount: 17_280,
    yearOverrides: {
      2026: {
        maxAmount: 17_764,
        description: "Up to $17,764 of qualified adoption expenses per eligible child. Non-refundable but can be carried forward up to 5 years. Phases out between $266,447 and $307,447 of modified AGI. Not available for Married Filing Separately.",
        incomeLimits: {
          single: { phaseOutStart: 266_447, phaseOutEnd: 307_447 },
          "head-of-household": { phaseOutStart: 266_447, phaseOutEnd: 307_447 },
          "married-jointly": { phaseOutStart: 266_447, phaseOutEnd: 307_447 },
          "married-separately": { ineligible: true },
        },
      },
    },
  },
  {
    name: "Residential Clean Energy Credit",
    type: "non-refundable",
    jurisdiction: "US",
    description:
      "30% of the cost of installing solar panels, solar water heaters, wind turbines, geothermal heat pumps, or battery storage at your home. No income limit. Any unused credit can be carried forward to future tax years.",
    incomeLimits: {},
  },
  {
    name: "Electric Vehicle Credit",
    type: "non-refundable",
    jurisdiction: "US",
    description:
      "Up to $7,500 for new qualifying electric or plug-in hybrid vehicles. Fully ineligible above: $150,000 (Single/MFS), $225,000 (HoH), $300,000 (MFJ). The vehicle must also meet North American assembly and battery sourcing requirements.",
    incomeLimits: {
      single: { hardCap: 150000 },
      "head-of-household": { hardCap: 225000 },
      "married-jointly": { hardCap: 300000 },
      "married-separately": { hardCap: 150000 },
    },
    maxAmount: 7500,
  },
  {
    name: "Standard Deduction",
    type: "deduction",
    jurisdiction: "US",
    description:
      "The standard deduction reduces your taxable income before calculating tax — no receipts needed. For 2025: $15,000 (Single/MFS), $22,500 (Head of Household), $30,000 (Married Filing Jointly). This is your baseline; itemizing deductions is only worthwhile if your deductible expenses exceed this amount.",
    incomeLimits: {},
    infoOnly: true,
    yearOverrides: {
      2026: {
        description: "The standard deduction reduces your taxable income before calculating tax — no receipts needed. For 2026: $15,420 (Single/MFS), $23,130 (Head of Household), $30,840 (Married Filing Jointly). This is your baseline; itemizing deductions is only worthwhile if your deductible expenses exceed this amount.",
      },
    },
  },
  {
    name: "Mortgage Interest Deduction",
    type: "deduction",
    jurisdiction: "US",
    description:
      "Interest paid on a mortgage for your primary or secondary home (up to $750,000 of mortgage debt) is deductible if you itemize. Already tracked in your Properties — no need to enter a separate amount here.",
    incomeLimits: {},
    infoOnly: true,
  },
  {
    name: "State and Local Tax (SALT) Deduction",
    type: "deduction",
    jurisdiction: "US",
    description:
      "Deduction for state and local income taxes (or sales tax) plus property taxes. Capped at $10,000 per return — or $5,000 if Married Filing Separately. Only beneficial if you itemize deductions.",
    incomeLimits: {
      "married-separately": { hardCap: 5000 },
    },
    maxAmount: 10000,
  },
  {
    name: "Student Loan Interest Deduction",
    type: "deduction",
    jurisdiction: "US",
    description:
      "Deduct up to $2,500 of student loan interest paid during the year — no itemizing required. Phases out: Single/HoH from $85,000 to $100,000, MFJ from $175,000 to $205,000. Not available for Married Filing Separately.",
    incomeLimits: {
      single: { phaseOutStart: 85_000, phaseOutEnd: 100_000 },
      "head-of-household": { phaseOutStart: 85_000, phaseOutEnd: 100_000 },
      "married-jointly": { phaseOutStart: 175_000, phaseOutEnd: 205_000 },
      "married-separately": { ineligible: true },
    },
    maxAmount: 2_500,
    yearOverrides: {
      2026: {
        description: "Deduct up to $2,500 of student loan interest paid during the year — no itemizing required. Phases out: Single/HoH from $87,380 to $102,800, MFJ from $179,900 to $210,740. Not available for Married Filing Separately.",
        incomeLimits: {
          single: { phaseOutStart: 87_380, phaseOutEnd: 102_800 },
          "head-of-household": { phaseOutStart: 87_380, phaseOutEnd: 102_800 },
          "married-jointly": { phaseOutStart: 179_900, phaseOutEnd: 210_740 },
          "married-separately": { ineligible: true },
        },
      },
    },
  },
  {
    name: "Charitable Contributions Deduction",
    type: "deduction",
    jurisdiction: "US",
    description:
      "Donations to qualifying 501(c)(3) organizations are deductible if you itemize. Cash contributions limited to 60% of AGI; appreciated assets (stocks, property) limited to 30% of AGI. Excess can be carried forward 5 years. No income cap, but only available to itemizers.",
    incomeLimits: {},
  },
  {
    name: "HSA Deduction",
    type: "deduction",
    jurisdiction: "US",
    description:
      "Contributions to a Health Savings Account (HSA) are tax-deductible (above-the-line). Already tracked in your Assets — no need to enter a separate amount here.",
    incomeLimits: {},
    infoOnly: true,
  },
  {
    name: "SSDI/SSI Benefits",
    type: "non-refundable",
    jurisdiction: "US",
    description:
      "Social Security Disability Insurance (SSDI) and Supplemental Security Income (SSI) are income programs, not tax credits. If you receive disability benefits, enter them as income in the Income section. Note: SSDI may be partially taxable depending on your combined income.",
    incomeLimits: {},
    infoOnly: true,
  },
];
