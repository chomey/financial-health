import type { SampleProfile } from "@/lib/sample-profiles";
import type { ProfileLibrary } from "@/lib/countries/types";

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

export const US_QUICK_START_PROFILES: SampleProfile[] = [
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

export const usaProfiles: ProfileLibrary = {
  samples: US_SAMPLE_PROFILES,
  quickStarts: US_QUICK_START_PROFILES,
};
