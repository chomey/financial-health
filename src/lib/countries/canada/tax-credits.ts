import type { TaxCreditCatalog } from "@/lib/countries/types";
import type { TaxCreditCategory, FilingStatus } from "@/lib/tax-credits";
import { resolveCategoryForYear } from "@/lib/tax-credit-resolve";

const CA_CATEGORIES: TaxCreditCategory[] = [
  {
    name: "Disability Tax Credit (DTC)",
    type: "non-refundable",
    jurisdiction: "CA",
    description:
      "For individuals with a severe and prolonged impairment in mental or physical functions. Base amount ~$10,138 federally. Children under 18 qualify for an additional ~$5,914 supplement. No income limit — available regardless of income. Unused portion can be transferred to a supporting spouse or family member.",
    incomeLimits: {},
    maxAmount: 10_138,
    fixedAmount: true,
    amountOptions: [
      { label: "Adult (18+)", value: 10_138 },
      { label: "Child under 18", value: 16_052 },
    ],
    yearOverrides: {
      2026: {
        maxAmount: 10_412,
        description:
          "For individuals with a severe and prolonged impairment in mental or physical functions. Base amount ~$10,412 federally. Children under 18 qualify for an additional ~$6,074 supplement. No income limit — available regardless of income. Unused portion can be transferred to a supporting spouse or family member.",
        amountOptions: [
          { label: "Adult (18+)", value: 10_412 },
          { label: "Child under 18", value: 16_486 },
        ],
      },
    },
  },
  {
    name: "Spousal Amount Credit",
    type: "non-refundable",
    jurisdiction: "CA",
    description:
      "Claimable when your spouse or common-law partner's net income is below ~$16,129. Worth up to ~$2,339 federally. Only available to married or common-law couples.",
    incomeLimits: {},
    requiresSpouse: true,
    maxAmount: 2_339,
    fixedAmount: true,
    yearOverrides: {
      2026: {
        maxAmount: 2_303,
        description:
          "Claimable when your spouse or common-law partner's net income is below ~$16,452. Worth up to ~$2,303 federally. Only available to married or common-law couples.",
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
    fixedAmount: true,
    yearOverrides: {
      2026: {
        maxAmount: 8_833,
        description:
          "For individuals supporting a dependent with a physical or mental impairment. Worth up to ~$8,833. Phases out as the dependant's net income exceeds ~$20,742 (based on dependant's income, not yours).",
      },
    },
  },
  {
    name: "Medical Expense Tax Credit",
    type: "non-refundable",
    jurisdiction: "CA",
    description:
      "14.5% federal credit on eligible medical expenses exceeding the lesser of 3% of your net income or $2,833. No income cap, but the effective benefit shrinks as income rises since the 3% floor grows. Includes prescriptions, dental, vision, and many specialist costs.",
    incomeLimits: {},
    yearOverrides: {
      2026: {
        description:
          "14% federal credit on eligible medical expenses exceeding the lesser of 3% of your net income or $2,910. No income cap, but the effective benefit shrinks as income rises since the 3% floor grows. Includes prescriptions, dental, vision, and many specialist costs.",
      },
    },
  },
  {
    name: "Home Accessibility Tax Credit",
    type: "non-refundable",
    jurisdiction: "CA",
    description:
      "14.5% credit on up to $20,000 of eligible renovation costs that make your home safer or more accessible. Available to individuals 65+ or those who qualify for the Disability Tax Credit. No income limit.",
    incomeLimits: {},
    maxAmount: 20000,
    yearOverrides: {
      2026: {
        description:
          "14% credit on up to $20,000 of eligible renovation costs that make your home safer or more accessible. Available to individuals 65+ or those who qualify for the Disability Tax Credit. No income limit.",
      },
    },
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
    fixedAmount: true,
    yearOverrides: {
      2026: {
        maxAmount: 1_677,
        description:
          "Refundable credit for low-income workers. Single: up to $1,677, phases out between $25,649 and $36,830. Married/common-law: up to $2,889, phases out between $29,263 and $48,523 based on combined family income.",
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
    fixedAmount: true,
    yearOverrides: {
      2026: {
        maxAmount: 547,
        description:
          "Quarterly payment to offset the cost of sales tax for low- and moderate-income individuals and families. Single: fully phases out above ~$57,698 in adjusted family net income. Married/common-law: fully phases out above ~$68,645 in combined family net income.",
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
    fixedAmount: true,
    amountOptions: [
      { label: "1 child under 6", value: 7_997 },
      { label: "1 child aged 6–17", value: 6_748 },
      { label: "2 children (under 6)", value: 15_994 },
      { label: "2 children (1 under 6 + 1 aged 6–17)", value: 14_745 },
      { label: "3+ children (under 6)", value: 23_991 },
    ],
    yearOverrides: {
      2026: {
        maxAmount: 8_213,
        description:
          "Monthly tax-free payment for families with children under 18. Up to $8,213 per child under 6 and $6,930 per child aged 6–17. Based on combined family net income — always uses spousal income when married/common-law. Phases out above $38,499 family net income (rate depends on number of children).",
        incomeLimits: {
          single: { phaseOutStart: 38_499 },
          "married-common-law": { phaseOutStart: 38_499 },
        },
        amountOptions: [
          { label: "1 child under 6", value: 8_213 },
          { label: "1 child aged 6–17", value: 6_930 },
          { label: "2 children (under 6)", value: 16_426 },
          { label: "2 children (1 under 6 + 1 aged 6–17)", value: 15_143 },
          { label: "3+ children (under 6)", value: 24_639 },
        ],
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
    fixedAmount: true,
    yearOverrides: {
      2026: {
        description:
          "Up to $250/year (lifetime limit $5,000) for eligible training fees at designated institutions. Your individual income must be between $10,908 and $158,706. Not affected by spousal income.",
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
    description:
      "Already tracked in your Assets — no need to enter here. Spousal RRSP contributions are also tracked there.",
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
];

export const canadianTaxCredits: TaxCreditCatalog = {
  getCategories(year) {
    return CA_CATEGORIES.filter((c) => !c.infoOnly).map((c) => resolveCategoryForYear(c, year));
  },
  getAllCategories(year) {
    return CA_CATEGORIES.map((c) => resolveCategoryForYear(c, year));
  },
  getCategoriesForFilingStatus(filingStatus: FilingStatus, year) {
    const isMarried = filingStatus === "married-common-law";
    return CA_CATEGORIES
      .filter((c) => !c.infoOnly)
      .filter((c) => !c.requiresSpouse || isMarried)
      .map((c) => resolveCategoryForYear(c, year));
  },
  findCategory(name, year) {
    const found = CA_CATEGORIES.find((c) => c.name === name);
    return found ? resolveCategoryForYear(found, year) : undefined;
  },
};
