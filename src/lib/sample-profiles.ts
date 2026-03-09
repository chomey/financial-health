import type { FinancialState } from "@/lib/financial-state";

export interface SampleProfile {
  id: string;
  name: string;
  emoji: string;
  description: string;
  highlights: string[];
  state: FinancialState;
}

export const SAMPLE_PROFILES: SampleProfile[] = [
  {
    id: "fresh-grad",
    name: "Fresh grad, age 25",
    emoji: "🎓",
    description: "Just starting out — renting, student debt, TFSA open",
    highlights: ["$40k salary", "$18k student loan", "TFSA building"],
    state: {
      country: "CA",
      jurisdiction: "ON",
      age: 25,
      income: [
        { id: "i1", category: "Salary", amount: 3333, frequency: "monthly", incomeType: "employment" },
      ],
      expenses: [
        { id: "e1", category: "Rent/Mortgage Payment", amount: 1200 },
        { id: "e2", category: "Groceries", amount: 400 },
        { id: "e3", category: "Subscriptions", amount: 80 },
        { id: "e4", category: "Dining Out", amount: 200 },
        { id: "e5", category: "Transportation", amount: 150 },
        { id: "e6", category: "Utilities", amount: 120 },
        { id: "e7", category: "Phone", amount: 65 },
      ],
      assets: [
        { id: "a1", category: "TFSA", amount: 2000, roi: 5, monthlyContribution: 200 },
        { id: "a2", category: "Savings Account", amount: 1500, roi: 2.5, surplusTarget: true },
      ],
      debts: [
        { id: "d1", category: "Student Loan", amount: 18000, interestRate: 6, monthlyPayment: 350 },
      ],
      properties: [],
      stocks: [
        { id: "s1", ticker: "XEQT.TO", shares: 15, costBasis: 24.50, purchaseDate: "2024-06-15" },
      ],
    },
  },
  {
    id: "mid-career",
    name: "Mid-career family, age 38",
    emoji: "🏡",
    description: "Dual income, mortgage, two kids — RRSP & TFSA growing",
    highlights: ["$95k salary", "Mortgage + property", "RRSP/TFSA invested"],
    state: {
      country: "CA",
      jurisdiction: "BC",
      age: 38,
      income: [
        { id: "i1", category: "Salary", amount: 7917, frequency: "monthly", incomeType: "employment" },
      ],
      expenses: [
        { id: "e1", category: "Groceries", amount: 700 },
        { id: "e2", category: "Subscriptions", amount: 150 },
        { id: "e3", category: "Dining Out", amount: 300 },
        { id: "e4", category: "Childcare", amount: 1200 },
        { id: "e5", category: "Transportation", amount: 400 },
        { id: "e6", category: "Utilities", amount: 200 },
        { id: "e7", category: "Insurance", amount: 250 },
        { id: "e8", category: "Phone", amount: 130 },
      ],
      assets: [
        { id: "a1", category: "RRSP", amount: 35000, roi: 7, monthlyContribution: 500, employerMatchPct: 50 },
        { id: "a2", category: "TFSA", amount: 15000, roi: 6, monthlyContribution: 250 },
        { id: "a3", category: "RESP", amount: 8000, roi: 5, monthlyContribution: 200 },
        { id: "a4", category: "Savings Account", amount: 8000, roi: 2.5, surplusTarget: true },
      ],
      debts: [
        { id: "d1", category: "Car Loan", amount: 12000, interestRate: 5.9, monthlyPayment: 350 },
      ],
      properties: [
        {
          id: "p1",
          name: "Primary Home",
          value: 750000,
          mortgage: 480000,
          interestRate: 5.2,
          monthlyPayment: 2800,
          amortizationYears: 25,
          yearPurchased: 2018,
          appreciation: 3,
        },
      ],
      stocks: [
        { id: "s1", ticker: "XIU.TO", shares: 50, costBasis: 28, purchaseDate: "2020-03-20" },
        { id: "s2", ticker: "VFV.TO", shares: 30, costBasis: 95, purchaseDate: "2021-01-10" },
        { id: "s3", ticker: "ENB.TO", shares: 40, costBasis: 42, purchaseDate: "2022-06-01" },
      ],
    },
  },
  {
    id: "pre-retirement",
    name: "Pre-retirement, age 58",
    emoji: "🌅",
    description: "Mortgage almost paid off — large registered accounts, planning retirement",
    highlights: ["$120k salary", "Large RRSP/TFSA", "Near debt-free"],
    state: {
      country: "CA",
      jurisdiction: "AB",
      age: 58,
      income: [
        { id: "i1", category: "Salary", amount: 10000, frequency: "monthly", incomeType: "employment" },
      ],
      expenses: [
        { id: "e1", category: "Groceries", amount: 600 },
        { id: "e2", category: "Subscriptions", amount: 100 },
        { id: "e3", category: "Dining Out", amount: 400 },
        { id: "e4", category: "Travel", amount: 500 },
        { id: "e5", category: "Transportation", amount: 300 },
        { id: "e6", category: "Utilities", amount: 180 },
        { id: "e7", category: "Insurance", amount: 350 },
        { id: "e8", category: "Health", amount: 150 },
      ],
      assets: [
        { id: "a1", category: "RRSP", amount: 320000, roi: 6, monthlyContribution: 1500 },
        { id: "a2", category: "TFSA", amount: 85000, roi: 5, monthlyContribution: 600 },
        { id: "a3", category: "Savings Account", amount: 45000, roi: 3, surplusTarget: true },
        { id: "a4", category: "Non-Registered", amount: 60000, roi: 7, costBasisPercent: 65 },
      ],
      debts: [
        { id: "d1", category: "Line of Credit", amount: 5000, interestRate: 7, monthlyPayment: 200 },
      ],
      properties: [
        {
          id: "p1",
          name: "Primary Home",
          value: 950000,
          mortgage: 45000,
          interestRate: 4.5,
          monthlyPayment: 1100,
          amortizationYears: 25,
          yearPurchased: 2005,
          appreciation: 2.5,
        },
      ],
      stocks: [
        { id: "s1", ticker: "XIU.TO", shares: 200, costBasis: 22, purchaseDate: "2015-04-10" },
        { id: "s2", ticker: "XAW.TO", shares: 150, costBasis: 26, purchaseDate: "2017-09-15" },
        { id: "s3", ticker: "TD.TO", shares: 100, costBasis: 65, purchaseDate: "2018-11-01" },
        { id: "s4", ticker: "CNR.TO", shares: 60, costBasis: 120, purchaseDate: "2019-03-20" },
      ],
    },
  },
];

/** Equivalent US versions of the same profiles (for users who switch to US after loading a CA profile) */
export const US_SAMPLE_PROFILES: SampleProfile[] = [
  {
    id: "fresh-grad-us",
    name: "Fresh grad, age 25",
    emoji: "🎓",
    description: "Just starting out — renting, student debt, Roth IRA open",
    highlights: ["$42k salary", "$22k student loans", "Roth IRA building"],
    state: {
      country: "US",
      jurisdiction: "CA",
      age: 25,
      income: [
        { id: "i1", category: "Salary", amount: 3500, frequency: "monthly", incomeType: "employment" },
      ],
      expenses: [
        { id: "e1", category: "Rent/Mortgage Payment", amount: 1400 },
        { id: "e2", category: "Groceries", amount: 350 },
        { id: "e3", category: "Subscriptions", amount: 80 },
        { id: "e4", category: "Dining Out", amount: 200 },
        { id: "e5", category: "Transportation", amount: 150 },
        { id: "e6", category: "Utilities", amount: 100 },
        { id: "e7", category: "Phone", amount: 55 },
      ],
      assets: [
        { id: "a1", category: "Roth IRA", amount: 3000, roi: 7, monthlyContribution: 250 },
        { id: "a2", category: "Savings Account", amount: 1500, roi: 4, surplusTarget: true },
      ],
      debts: [
        { id: "d1", category: "Student Loan", amount: 22000, interestRate: 5.5, monthlyPayment: 400 },
      ],
      properties: [],
      stocks: [
        { id: "s1", ticker: "VTI", shares: 10, costBasis: 220, purchaseDate: "2024-08-01" },
      ],
    },
  },
  {
    id: "mid-career-us",
    name: "Mid-career family, age 38",
    emoji: "🏡",
    description: "Dual income, mortgage, two kids — 401k & brokerage growing",
    highlights: ["$100k salary", "Mortgage + property", "401k/IRA invested"],
    state: {
      country: "US",
      jurisdiction: "TX",
      age: 38,
      income: [
        { id: "i1", category: "Salary", amount: 8333, frequency: "monthly", incomeType: "employment" },
      ],
      expenses: [
        { id: "e1", category: "Groceries", amount: 700 },
        { id: "e2", category: "Subscriptions", amount: 150 },
        { id: "e3", category: "Dining Out", amount: 350 },
        { id: "e4", category: "Childcare", amount: 1500 },
        { id: "e5", category: "Transportation", amount: 450 },
        { id: "e6", category: "Utilities", amount: 220 },
        { id: "e7", category: "Insurance", amount: 300 },
        { id: "e8", category: "Phone", amount: 120 },
      ],
      assets: [
        { id: "a1", category: "401k", amount: 45000, roi: 7, monthlyContribution: 600, employerMatchPct: 50 },
        { id: "a2", category: "Roth IRA", amount: 20000, roi: 7, monthlyContribution: 500 },
        { id: "a3", category: "HSA", amount: 5000, roi: 5, monthlyContribution: 150 },
        { id: "a4", category: "Savings Account", amount: 10000, roi: 4, surplusTarget: true },
      ],
      debts: [
        { id: "d1", category: "Car Loan", amount: 15000, interestRate: 6.4, monthlyPayment: 400 },
      ],
      properties: [
        {
          id: "p1",
          name: "Primary Home",
          value: 420000,
          mortgage: 280000,
          interestRate: 6.5,
          monthlyPayment: 2100,
          amortizationYears: 30,
          yearPurchased: 2018,
          appreciation: 3,
        },
      ],
      stocks: [
        { id: "s1", ticker: "VTI", shares: 40, costBasis: 200, purchaseDate: "2020-05-15" },
        { id: "s2", ticker: "AAPL", shares: 15, costBasis: 150, purchaseDate: "2021-03-01" },
        { id: "s3", ticker: "SCHD", shares: 25, costBasis: 72, purchaseDate: "2022-01-10" },
      ],
    },
  },
  {
    id: "pre-retirement-us",
    name: "Pre-retirement, age 58",
    emoji: "🌅",
    description: "Mortgage almost paid off — large 401k/IRA, planning retirement",
    highlights: ["$125k salary", "Large 401k/IRA", "Near debt-free"],
    state: {
      country: "US",
      jurisdiction: "FL",
      age: 58,
      income: [
        { id: "i1", category: "Salary", amount: 10417, frequency: "monthly", incomeType: "employment" },
      ],
      expenses: [
        { id: "e1", category: "Groceries", amount: 600 },
        { id: "e2", category: "Subscriptions", amount: 120 },
        { id: "e3", category: "Dining Out", amount: 400 },
        { id: "e4", category: "Travel", amount: 600 },
        { id: "e5", category: "Transportation", amount: 350 },
        { id: "e6", category: "Utilities", amount: 200 },
        { id: "e7", category: "Insurance", amount: 400 },
        { id: "e8", category: "Health", amount: 200 },
      ],
      assets: [
        { id: "a1", category: "401k", amount: 380000, roi: 6, monthlyContribution: 1800 },
        { id: "a2", category: "Roth IRA", amount: 95000, roi: 6, monthlyContribution: 600 },
        { id: "a3", category: "Savings Account", amount: 50000, roi: 4, surplusTarget: true },
        { id: "a4", category: "Brokerage", amount: 70000, roi: 7, costBasisPercent: 60 },
      ],
      debts: [
        { id: "d1", category: "Credit Card", amount: 3000, interestRate: 19.9, monthlyPayment: 150 },
      ],
      properties: [
        {
          id: "p1",
          name: "Primary Home",
          value: 600000,
          mortgage: 50000,
          interestRate: 4.0,
          monthlyPayment: 800,
          amortizationYears: 30,
          yearPurchased: 2005,
          appreciation: 2.5,
        },
      ],
      stocks: [
        { id: "s1", ticker: "VTI", shares: 150, costBasis: 160, purchaseDate: "2015-06-01" },
        { id: "s2", ticker: "VOO", shares: 80, costBasis: 320, purchaseDate: "2019-01-15" },
        { id: "s3", ticker: "MSFT", shares: 50, costBasis: 250, purchaseDate: "2020-04-01" },
        { id: "s4", ticker: "JNJ", shares: 30, costBasis: 155, purchaseDate: "2017-08-20" },
      ],
    },
  },
];

/** Australian sample profiles */
export const AU_SAMPLE_PROFILES: SampleProfile[] = [
  {
    id: "au-young-professional",
    name: "Young professional, age 25",
    emoji: "🦘",
    description: "Renting in Sydney — Super accumulation, HECS-HELP debt, ETF portfolio",
    highlights: ["$75k salary", "$35k HECS-HELP", "Super building"],
    state: {
      country: "AU",
      jurisdiction: "NSW",
      age: 25,
      income: [
        { id: "i1", category: "Salary", amount: 6250, frequency: "monthly", incomeType: "employment" },
      ],
      expenses: [
        { id: "e1", category: "Rent/Mortgage Payment", amount: 2200 },
        { id: "e2", category: "Groceries", amount: 450 },
        { id: "e3", category: "Transportation", amount: 180 },
        { id: "e4", category: "Utilities", amount: 120 },
        { id: "e5", category: "Phone", amount: 70 },
        { id: "e6", category: "Dining Out", amount: 250 },
        { id: "e7", category: "Subscriptions", amount: 80 },
      ],
      assets: [
        { id: "a1", category: "Super (Accumulation)", amount: 15000, roi: 7, monthlyContribution: 719 },
        { id: "a2", category: "Savings Account", amount: 5000, roi: 4.5, surplusTarget: true },
      ],
      debts: [
        { id: "d1", category: "HECS-HELP", amount: 35000, interestRate: 3.8, monthlyPayment: 250 },
      ],
      properties: [],
      stocks: [
        { id: "s1", ticker: "VAS.AX", shares: 30, costBasis: 95, purchaseDate: "2024-03-15" },
        { id: "s2", ticker: "VGS.AX", shares: 20, costBasis: 115, purchaseDate: "2024-06-01" },
      ],
    },
  },
  {
    id: "au-mid-career-family",
    name: "Mid-career family, age 40",
    emoji: "🏡",
    description: "Dual income in Melbourne — Super, mortgage, salary sacrifice to super",
    highlights: ["$120k salary", "Mortgage + Super", "Salary sacrifice"],
    state: {
      country: "AU",
      jurisdiction: "VIC",
      age: 40,
      income: [
        { id: "i1", category: "Salary", amount: 10000, frequency: "monthly", incomeType: "employment" },
      ],
      expenses: [
        { id: "e1", category: "Groceries", amount: 800 },
        { id: "e2", category: "Transportation", amount: 350 },
        { id: "e3", category: "Utilities", amount: 220 },
        { id: "e4", category: "Phone", amount: 120 },
        { id: "e5", category: "Childcare", amount: 1200 },
        { id: "e6", category: "Dining Out", amount: 300 },
        { id: "e7", category: "Subscriptions", amount: 150 },
        { id: "e8", category: "Insurance", amount: 280 },
      ],
      assets: [
        { id: "a1", category: "Super (Accumulation)", amount: 90000, roi: 7, monthlyContribution: 1650 },
        { id: "a2", category: "Savings Account", amount: 25000, roi: 4.5, surplusTarget: true },
        { id: "a3", category: "Non-Registered", amount: 30000, roi: 8 },
      ],
      debts: [],
      properties: [
        {
          id: "p1",
          name: "Primary Home",
          value: 950000,
          mortgage: 620000,
          interestRate: 6.1,
          monthlyPayment: 3800,
          amortizationYears: 30,
          yearPurchased: 2019,
          appreciation: 3.5,
        },
      ],
      stocks: [
        { id: "s1", ticker: "VAS.AX", shares: 60, costBasis: 88, purchaseDate: "2021-03-10" },
        { id: "s2", ticker: "A200.AX", shares: 40, costBasis: 130, purchaseDate: "2022-07-15" },
        { id: "s3", ticker: "NDQ.AX", shares: 25, costBasis: 40, purchaseDate: "2023-01-20" },
      ],
    },
  },
  {
    id: "au-pre-retiree",
    name: "Pre-retiree, age 58",
    emoji: "🌅",
    description: "Pre-retirement in Brisbane — Super, investment property, franking credits",
    highlights: ["$150k salary", "Super + property", "Franking credits"],
    state: {
      country: "AU",
      jurisdiction: "QLD",
      age: 58,
      income: [
        { id: "i1", category: "Salary", amount: 12500, frequency: "monthly", incomeType: "employment" },
      ],
      expenses: [
        { id: "e1", category: "Groceries", amount: 700 },
        { id: "e2", category: "Transportation", amount: 350 },
        { id: "e3", category: "Utilities", amount: 200 },
        { id: "e4", category: "Phone", amount: 100 },
        { id: "e5", category: "Travel", amount: 600 },
        { id: "e6", category: "Dining Out", amount: 400 },
        { id: "e7", category: "Insurance", amount: 400 },
        { id: "e8", category: "Health", amount: 200 },
      ],
      assets: [
        { id: "a1", category: "Super (Accumulation)", amount: 420000, roi: 7, monthlyContribution: 1438 },
        { id: "a2", category: "Savings Account", amount: 55000, roi: 5, surplusTarget: true },
        { id: "a3", category: "Non-Registered", amount: 85000, roi: 7, costBasisPercent: 55 },
      ],
      debts: [
        { id: "d1", category: "Line of Credit", amount: 8000, interestRate: 8.5, monthlyPayment: 300 },
      ],
      properties: [
        {
          id: "p1",
          name: "Primary Home",
          value: 850000,
          mortgage: 0,
          interestRate: 0,
          monthlyPayment: 0,
          amortizationYears: 25,
          yearPurchased: 2008,
          appreciation: 3,
        },
        {
          id: "p2",
          name: "Investment Property",
          value: 650000,
          mortgage: 280000,
          interestRate: 6.2,
          monthlyPayment: 1800,
          amortizationYears: 30,
          yearPurchased: 2015,
          appreciation: 4,
        },
      ],
      stocks: [
        { id: "s1", ticker: "CBA.AX", shares: 80, costBasis: 98, purchaseDate: "2018-05-15" },
        { id: "s2", ticker: "BHP.AX", shares: 100, costBasis: 42, purchaseDate: "2016-09-10" },
        { id: "s3", ticker: "VAS.AX", shares: 150, costBasis: 82, purchaseDate: "2019-03-20" },
        { id: "s4", ticker: "WES.AX", shares: 60, costBasis: 55, purchaseDate: "2020-11-05" },
      ],
    },
  },
];

/** Get the profiles appropriate for the given country */
export function getProfilesForCountry(country: "CA" | "US" | "AU"): SampleProfile[] {
  if (country === "US") return US_SAMPLE_PROFILES;
  if (country === "AU") return AU_SAMPLE_PROFILES;
  return SAMPLE_PROFILES;
}

// ── Quick-start profiles (simple mode only) ────────────────────────────────
// No stocks, no cost basis, no employer match, no tax credits, minimal fields

export const QUICK_START_CA_PROFILES: SampleProfile[] = [
  {
    id: "ca-renter",
    name: "Renter with salary",
    emoji: "🏢",
    description: "Salary income, renting, building your savings",
    highlights: ["$55k salary", "Renting", "TFSA savings"],
    state: {
      country: "CA",
      jurisdiction: "ON",
      age: 30,
      income: [
        { id: "i1", category: "Salary", amount: 4583, frequency: "monthly" },
      ],
      expenses: [
        { id: "e1", category: "Rent/Mortgage Payment", amount: 1500 },
        { id: "e2", category: "Groceries", amount: 400 },
        { id: "e3", category: "Transportation", amount: 200 },
        { id: "e4", category: "Utilities", amount: 120 },
        { id: "e5", category: "Phone", amount: 60 },
      ],
      assets: [
        { id: "a1", category: "TFSA", amount: 8000 },
        { id: "a2", category: "Savings Account", amount: 3000, surplusTarget: true },
      ],
      debts: [],
      properties: [],
      stocks: [],
    },
  },
  {
    id: "ca-homeowner",
    name: "Homeowner with mortgage",
    emoji: "🏡",
    description: "Own a home, saving for retirement",
    highlights: ["$80k salary", "Home + mortgage", "RRSP growing"],
    state: {
      country: "CA",
      jurisdiction: "ON",
      age: 38,
      income: [
        { id: "i1", category: "Salary", amount: 6667, frequency: "monthly" },
      ],
      expenses: [
        { id: "e1", category: "Groceries", amount: 600 },
        { id: "e2", category: "Transportation", amount: 300 },
        { id: "e3", category: "Utilities", amount: 180 },
        { id: "e4", category: "Insurance", amount: 200 },
        { id: "e5", category: "Phone", amount: 80 },
      ],
      assets: [
        { id: "a1", category: "RRSP", amount: 35000 },
        { id: "a2", category: "TFSA", amount: 15000 },
        { id: "a3", category: "Savings Account", amount: 10000, surplusTarget: true },
      ],
      debts: [],
      properties: [
        { id: "_simple_home", name: "Primary Residence", value: 600000, mortgage: 400000 },
      ],
      stocks: [],
    },
  },
];

export const QUICK_START_US_PROFILES: SampleProfile[] = [
  {
    id: "us-renter",
    name: "Renter with salary",
    emoji: "🏢",
    description: "Salary income, renting, building your savings",
    highlights: ["$58k salary", "Renting", "Roth IRA savings"],
    state: {
      country: "US",
      jurisdiction: "TX",
      age: 30,
      income: [
        { id: "i1", category: "Salary", amount: 4833, frequency: "monthly" },
      ],
      expenses: [
        { id: "e1", category: "Rent/Mortgage Payment", amount: 1400 },
        { id: "e2", category: "Groceries", amount: 400 },
        { id: "e3", category: "Transportation", amount: 200 },
        { id: "e4", category: "Utilities", amount: 110 },
        { id: "e5", category: "Phone", amount: 55 },
      ],
      assets: [
        { id: "a1", category: "Roth IRA", amount: 9000 },
        { id: "a2", category: "Savings Account", amount: 4000, surplusTarget: true },
      ],
      debts: [],
      properties: [],
      stocks: [],
    },
  },
  {
    id: "us-homeowner",
    name: "Homeowner with mortgage",
    emoji: "🏡",
    description: "Own a home, saving for retirement",
    highlights: ["$85k salary", "Home + mortgage", "401k growing"],
    state: {
      country: "US",
      jurisdiction: "TX",
      age: 38,
      income: [
        { id: "i1", category: "Salary", amount: 7083, frequency: "monthly" },
      ],
      expenses: [
        { id: "e1", category: "Groceries", amount: 650 },
        { id: "e2", category: "Transportation", amount: 350 },
        { id: "e3", category: "Utilities", amount: 200 },
        { id: "e4", category: "Insurance", amount: 250 },
        { id: "e5", category: "Phone", amount: 80 },
      ],
      assets: [
        { id: "a1", category: "401k", amount: 40000 },
        { id: "a2", category: "Roth IRA", amount: 15000 },
        { id: "a3", category: "Savings Account", amount: 12000, surplusTarget: true },
      ],
      debts: [],
      properties: [
        { id: "_simple_home", name: "Primary Residence", value: 420000, mortgage: 300000 },
      ],
      stocks: [],
    },
  },
];

export const QUICK_START_AU_PROFILES: SampleProfile[] = [
  {
    id: "au-renter",
    name: "Renter with salary",
    emoji: "🏢",
    description: "Salary income, renting, building your savings",
    highlights: ["$70k salary", "Renting", "Super building"],
    state: {
      country: "AU",
      jurisdiction: "NSW",
      age: 30,
      income: [
        { id: "i1", category: "Salary", amount: 5833, frequency: "monthly" },
      ],
      expenses: [
        { id: "e1", category: "Rent/Mortgage Payment", amount: 2000 },
        { id: "e2", category: "Groceries", amount: 450 },
        { id: "e3", category: "Transportation", amount: 180 },
        { id: "e4", category: "Utilities", amount: 120 },
        { id: "e5", category: "Phone", amount: 70 },
      ],
      assets: [
        { id: "a1", category: "Super (Accumulation)", amount: 20000 },
        { id: "a2", category: "Savings Account", amount: 5000, surplusTarget: true },
      ],
      debts: [],
      properties: [],
      stocks: [],
    },
  },
  {
    id: "au-homeowner",
    name: "Homeowner with mortgage",
    emoji: "🏡",
    description: "Own a home, building super for retirement",
    highlights: ["$95k salary", "Home + mortgage", "Super growing"],
    state: {
      country: "AU",
      jurisdiction: "VIC",
      age: 38,
      income: [
        { id: "i1", category: "Salary", amount: 7917, frequency: "monthly" },
      ],
      expenses: [
        { id: "e1", category: "Groceries", amount: 700 },
        { id: "e2", category: "Transportation", amount: 300 },
        { id: "e3", category: "Utilities", amount: 200 },
        { id: "e4", category: "Insurance", amount: 220 },
        { id: "e5", category: "Phone", amount: 80 },
      ],
      assets: [
        { id: "a1", category: "Super (Accumulation)", amount: 75000 },
        { id: "a2", category: "Savings Account", amount: 15000, surplusTarget: true },
      ],
      debts: [],
      properties: [
        { id: "_simple_home", name: "Primary Residence", value: 850000, mortgage: 550000 },
      ],
      stocks: [],
    },
  },
];

/** Get the quick-start profiles (simple mode) for the given country */
export function getQuickStartProfilesForCountry(country: "CA" | "US" | "AU"): SampleProfile[] {
  if (country === "US") return QUICK_START_US_PROFILES;
  if (country === "AU") return QUICK_START_AU_PROFILES;
  return QUICK_START_CA_PROFILES;
}
