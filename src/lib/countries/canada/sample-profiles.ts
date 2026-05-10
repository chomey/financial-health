import type { SampleProfile } from "@/lib/sample-profiles";
import type { ProfileLibrary } from "@/lib/countries/types";

export const CA_SAMPLE_PROFILES: SampleProfile[] = [
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

export const CA_QUICK_START_PROFILES: SampleProfile[] = [
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

export const canadaProfiles: ProfileLibrary = {
  samples: CA_SAMPLE_PROFILES,
  quickStarts: CA_QUICK_START_PROFILES,
};
