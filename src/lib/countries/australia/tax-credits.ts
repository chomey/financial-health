import type { TaxCreditCatalog } from "@/lib/countries/types";
import type { TaxCreditCategory, FilingStatus } from "@/lib/tax-credits";
import { resolveCategoryForYear } from "@/lib/tax-credit-resolve";

const AU_CATEGORIES: TaxCreditCategory[] = [
  {
    name: "Low Income Tax Offset (LITO)",
    type: "non-refundable",
    jurisdiction: "AU",
    description:
      "Automatic offset of up to $700 for individuals with taxable income up to $66,667. Full $700 for income up to $37,500. Reduces by 5c per $1 from $37,500 to $45,000, then by 1.5c per $1 from $45,000 to $66,667. Applied automatically — no need to claim.",
    incomeLimits: {
      single: { phaseOutStart: 37_500, phaseOutEnd: 66_667 },
      "married-de-facto": { phaseOutStart: 37_500, phaseOutEnd: 66_667 },
    },
    maxAmount: 700,
    fixedAmount: true,
  },
  {
    name: "Senior Australians and Pensioners Tax Offset (SAPTO)",
    type: "non-refundable",
    jurisdiction: "AU",
    description:
      "Tax offset for eligible seniors and pensioners who meet age and income requirements. Single: up to $2,230, phases out above $32,279 rebate income (fully gone at $50,119). Couple (each): up to $1,602, phases out above $28,974 rebate income (fully gone at $41,790). Must be of Age Pension age.",
    incomeLimits: {
      single: { phaseOutStart: 32_279, phaseOutEnd: 50_119 },
      "married-de-facto": { phaseOutStart: 28_974, phaseOutEnd: 41_790 },
    },
    maxAmount: 2_230,
    fixedAmount: true,
    amountOptions: [
      { label: "Single", value: 2_230 },
      { label: "Couple (each)", value: 1_602 },
    ],
  },
  {
    name: "Private Health Insurance Rebate",
    type: "refundable",
    jurisdiction: "AU",
    description:
      "Government rebate on private health insurance premiums, applied as a premium reduction or refundable tax offset. Rebate tiers based on age and income — under 65: 24.608% (base tier, income ≤$93,000 single/$186,000 family), 16.405% (tier 1, to $108,000/$216,000), 8.202% (tier 2, to $144,000/$288,000), 0% (tier 3, above $144,000/$288,000). Higher rebates for ages 65–69 and 70+.",
    incomeLimits: {
      single: { phaseOutStart: 93_000, phaseOutEnd: 144_000 },
      "married-de-facto": { phaseOutStart: 186_000, phaseOutEnd: 288_000 },
    },
  },
  {
    name: "Franking Credits (Dividend Imputation)",
    type: "refundable",
    jurisdiction: "AU",
    description:
      "When Australian companies pay tax on profits before distributing dividends, shareholders receive franking credits representing tax already paid. You include the grossed-up dividend (dividend + franking credit) in your taxable income, then claim the franking credit as a tax offset. Excess franking credits are refundable — you get a cash refund if credits exceed your tax liability. No income limit.",
    incomeLimits: {},
  },
  {
    name: "Zone Tax Offset",
    type: "non-refundable",
    jurisdiction: "AU",
    description:
      "Tax offset for individuals living in designated remote or isolated areas of Australia for at least 183 days. Zone A: up to $338, Zone B: up to $57, Special areas: up to $1,173. No income limit — based on location and duration of residence.",
    incomeLimits: {},
    maxAmount: 1_173,
    amountOptions: [
      { label: "Zone A", value: 338 },
      { label: "Zone B", value: 57 },
      { label: "Special area", value: 1_173 },
    ],
  },
  {
    name: "Super Co-contribution",
    type: "refundable",
    jurisdiction: "AU",
    description:
      "Government matches personal (non-concessional) super contributions up to $500 for low-income earners. Full $500 co-contribution on $1,000 of personal contributions when income is $45,400 or less. Phases out by 3.333c per $1 above $45,400, fully gone at $60,400. Must lodge a tax return and earn at least 10% from employment.",
    incomeLimits: {
      single: { phaseOutStart: 45_400, phaseOutEnd: 60_400 },
      "married-de-facto": { phaseOutStart: 45_400, phaseOutEnd: 60_400 },
    },
    maxAmount: 500,
    fixedAmount: true,
  },
  {
    name: "Spouse Super Tax Offset",
    type: "non-refundable",
    jurisdiction: "AU",
    description:
      "Tax offset of up to $540 when you make super contributions on behalf of your low-income spouse or de facto partner. Full offset on contributions of $3,000+ when spouse's income is $37,000 or less. Phases out between $37,000 and $40,000 of spouse's income.",
    incomeLimits: {},
    requiresSpouse: true,
    maxAmount: 540,
    fixedAmount: true,
  },
  {
    name: "Work-Related Expenses Deduction",
    type: "deduction",
    jurisdiction: "AU",
    description:
      "Deduction for expenses you incur in earning your employment income — uniforms, tools, professional memberships, and home office costs. You can claim up to $300 for work-related items without receipts; amounts above $300 require substantiation. No income cap.",
    incomeLimits: {},
    maxAmount: 300,
  },
  {
    name: "Charitable Donations (DGR)",
    type: "deduction",
    jurisdiction: "AU",
    description:
      "Donations of $2 or more to Deductible Gift Recipients (DGRs) are fully tax-deductible. DGRs include registered charities, disaster relief funds, environmental and cultural organisations, and many educational funds. No income cap — you can generally deduct the full donation against your taxable income.",
    incomeLimits: {},
  },
  {
    name: "Self-Education Expenses Deduction",
    type: "deduction",
    jurisdiction: "AU",
    description:
      "Tuition, textbooks, stationery, travel, and other education costs are deductible when the study is directly related to your current employment and maintains or improves the specific skills required for your role. A non-deductible floor of $250 may apply in some cases. No income cap.",
    incomeLimits: {},
  },
  {
    name: "Rental Property Losses (Negative Gearing)",
    type: "deduction",
    jurisdiction: "AU",
    description:
      "If your rental property expenses (interest, depreciation, maintenance, management fees) exceed your rental income, the net loss is deductible against your other income — reducing your taxable income dollar-for-dollar. Capital gains tax applies when you eventually sell. No income cap.",
    incomeLimits: {},
  },
  {
    name: "Income Protection Insurance Deduction",
    type: "deduction",
    jurisdiction: "AU",
    description:
      "Premiums paid on income protection insurance (also called salary continuance insurance) held outside of super are fully tax-deductible. Payments received under the policy are assessable income. Policies held inside super are not separately deductible — the super fund claims the deduction. No income cap.",
    incomeLimits: {},
  },
  {
    name: "Super (Concessional Contributions)",
    type: "deduction",
    jurisdiction: "AU",
    description:
      "Already tracked in your Assets — super contributions and employer super guarantee are managed there. Concessional cap: $30,000/year.",
    incomeLimits: {},
    infoOnly: true,
  },
  {
    name: "Medicare Levy Surcharge (MLS)",
    type: "non-refundable",
    jurisdiction: "AU",
    description:
      "Additional 1–1.5% surcharge on taxable income for high earners who don't hold an appropriate level of private hospital cover. Singles: 1% from $93,000–$108,000, 1.25% from $108,001–$144,000, 1.5% above $144,000. Families: thresholds are $186,000, $216,000, $288,000. Avoid by maintaining private health insurance.",
    incomeLimits: {
      single: { phaseOutStart: 93_000 },
      "married-de-facto": { phaseOutStart: 186_000 },
    },
    maxAmount: 0,
    infoOnly: true,
  },
];

export const australianTaxCredits: TaxCreditCatalog = {
  getCategories(year) {
    return AU_CATEGORIES.filter((c) => !c.infoOnly).map((c) => resolveCategoryForYear(c, year));
  },
  getCategoriesForFilingStatus(filingStatus: FilingStatus, year) {
    const isMarried = filingStatus === "married-de-facto";
    return AU_CATEGORIES
      .filter((c) => !c.infoOnly)
      .filter((c) => !c.requiresSpouse || isMarried)
      .map((c) => resolveCategoryForYear(c, year));
  },
  findCategory(name, year) {
    const found = AU_CATEGORIES.find((c) => c.name === name);
    return found ? resolveCategoryForYear(found, year) : undefined;
  },
};
