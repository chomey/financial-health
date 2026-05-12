import type { TaxCreditCatalog } from "@/lib/countries/types";
import type { TaxCreditCategory, FilingStatus } from "@/lib/tax-credits";
import { resolveCategoryForYear } from "@/lib/tax-credit-resolve";

const US_CATEGORIES: TaxCreditCategory[] = [
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
    fixedAmount: true,
    amountOptions: [
      { label: "No children", value: 649 },
      { label: "1 child", value: 4_328 },
      { label: "2 children", value: 7_152 },
      { label: "3+ children", value: 8_046 },
    ],
    yearOverrides: {
      2026: {
        maxAmount: 8_271,
        description:
          "Refundable credit for low-to-moderate income workers. Amount varies by income and number of children — up to $8,271 with 3+ children. Phases out: Single/HoH from $21,968 to $61,577 (3+ children), MFJ from $28,907 to $68,690. Not available for Married Filing Separately.",
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
        description:
          "$2,000 per qualifying child under 17. Up to $1,748 is refundable (Additional Child Tax Credit). Phases out $50 per $1,000 of AGI above $200,000 (Single/HoH/MFS) or $400,000 (MFJ). Most families with children under 17 qualify.",
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
        description:
          "Non-refundable credit for low- and moderate-income individuals who contribute to a 401(k), IRA, or other retirement account. Worth 10–50% of contributions up to $2,000 ($4,000 MFJ). Fully ineligible above: $40,600 (Single/MFS), $60,900 (HoH), $81,200 (MFJ).",
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
        description:
          "Up to $17,764 of qualified adoption expenses per eligible child. Non-refundable but can be carried forward up to 5 years. Phases out between $266,447 and $307,447 of modified AGI. Not available for Married Filing Separately.",
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
        description:
          "The standard deduction reduces your taxable income before calculating tax — no receipts needed. For 2026: $15,420 (Single/MFS), $23,130 (Head of Household), $30,840 (Married Filing Jointly). This is your baseline; itemizing deductions is only worthwhile if your deductible expenses exceed this amount.",
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
        description:
          "Deduct up to $2,500 of student loan interest paid during the year — no itemizing required. Phases out: Single/HoH from $87,380 to $102,800, MFJ from $179,900 to $210,740. Not available for Married Filing Separately.",
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

export const americanTaxCredits: TaxCreditCatalog = {
  getCategories(year) {
    return US_CATEGORIES.filter((c) => !c.infoOnly).map((c) => resolveCategoryForYear(c, year));
  },
  getCategoriesForFilingStatus(filingStatus: FilingStatus, year) {
    const isMarried =
      filingStatus === "married-jointly" || filingStatus === "married-separately";
    return US_CATEGORIES
      .filter((c) => !c.infoOnly)
      .filter((c) => !c.requiresSpouse || isMarried)
      .map((c) => resolveCategoryForYear(c, year));
  },
  findCategory(name, year) {
    const found = US_CATEGORIES.find((c) => c.name === name);
    return found ? resolveCategoryForYear(found, year) : undefined;
  },
};
