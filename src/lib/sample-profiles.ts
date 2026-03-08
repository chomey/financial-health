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
        { id: "i1", category: "Salary", amount: 3333 },
      ],
      expenses: [
        { id: "e1", category: "Rent/Mortgage Payment", amount: 1200 },
        { id: "e2", category: "Groceries", amount: 400 },
        { id: "e3", category: "Subscriptions", amount: 80 },
        { id: "e4", category: "Dining Out", amount: 200 },
        { id: "e5", category: "Transportation", amount: 150 },
      ],
      assets: [
        { id: "a1", category: "TFSA", amount: 2000, roi: 5 },
        { id: "a2", category: "Savings Account", amount: 1500, surplusTarget: true },
      ],
      debts: [
        { id: "d1", category: "Student Loan", amount: 18000, interestRate: 6, monthlyPayment: 350 },
      ],
      properties: [],
      stocks: [],
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
        { id: "i1", category: "Salary", amount: 7917 },
      ],
      expenses: [
        { id: "e1", category: "Groceries", amount: 700 },
        { id: "e2", category: "Subscriptions", amount: 150 },
        { id: "e3", category: "Dining Out", amount: 300 },
        { id: "e4", category: "Childcare", amount: 1200 },
        { id: "e5", category: "Transportation", amount: 400 },
      ],
      assets: [
        { id: "a1", category: "RRSP", amount: 35000, roi: 7, monthlyContribution: 500 },
        { id: "a2", category: "TFSA", amount: 15000, roi: 6 },
        { id: "a3", category: "Savings Account", amount: 8000, surplusTarget: true },
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
        { id: "s1", ticker: "XIU.TO", shares: 50, costBasis: 28 },
        { id: "s2", ticker: "VFV.TO", shares: 30, costBasis: 95 },
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
        { id: "i1", category: "Salary", amount: 10000 },
      ],
      expenses: [
        { id: "e1", category: "Groceries", amount: 600 },
        { id: "e2", category: "Subscriptions", amount: 100 },
        { id: "e3", category: "Dining Out", amount: 400 },
        { id: "e4", category: "Travel", amount: 500 },
        { id: "e5", category: "Transportation", amount: 300 },
      ],
      assets: [
        { id: "a1", category: "RRSP", amount: 320000, roi: 6, monthlyContribution: 1500 },
        { id: "a2", category: "TFSA", amount: 85000, roi: 5 },
        { id: "a3", category: "Savings Account", amount: 45000, surplusTarget: true },
        { id: "a4", category: "Non-Registered", amount: 60000, roi: 7 },
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
        { id: "s1", ticker: "XIU.TO", shares: 200, costBasis: 22 },
        { id: "s2", ticker: "XAW.TO", shares: 150, costBasis: 26 },
        { id: "s3", ticker: "TD.TO", shares: 100, costBasis: 65 },
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
        { id: "i1", category: "Salary", amount: 3500 },
      ],
      expenses: [
        { id: "e1", category: "Rent/Mortgage Payment", amount: 1400 },
        { id: "e2", category: "Groceries", amount: 350 },
        { id: "e3", category: "Subscriptions", amount: 80 },
        { id: "e4", category: "Dining Out", amount: 200 },
        { id: "e5", category: "Transportation", amount: 150 },
      ],
      assets: [
        { id: "a1", category: "Roth IRA", amount: 3000, roi: 7 },
        { id: "a2", category: "Savings Account", amount: 1500, surplusTarget: true },
      ],
      debts: [
        { id: "d1", category: "Student Loan", amount: 22000, interestRate: 5.5, monthlyPayment: 400 },
      ],
      properties: [],
      stocks: [],
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
        { id: "i1", category: "Salary", amount: 8333 },
      ],
      expenses: [
        { id: "e1", category: "Groceries", amount: 700 },
        { id: "e2", category: "Subscriptions", amount: 150 },
        { id: "e3", category: "Dining Out", amount: 350 },
        { id: "e4", category: "Childcare", amount: 1500 },
        { id: "e5", category: "Transportation", amount: 450 },
      ],
      assets: [
        { id: "a1", category: "401k", amount: 45000, roi: 7, monthlyContribution: 600 },
        { id: "a2", category: "Roth IRA", amount: 20000, roi: 7 },
        { id: "a3", category: "Savings Account", amount: 10000, surplusTarget: true },
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
        { id: "s1", ticker: "VTI", shares: 40, costBasis: 200 },
        { id: "s2", ticker: "AAPL", shares: 15, costBasis: 150 },
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
        { id: "i1", category: "Salary", amount: 10417 },
      ],
      expenses: [
        { id: "e1", category: "Groceries", amount: 600 },
        { id: "e2", category: "Subscriptions", amount: 120 },
        { id: "e3", category: "Dining Out", amount: 400 },
        { id: "e4", category: "Travel", amount: 600 },
        { id: "e5", category: "Transportation", amount: 350 },
      ],
      assets: [
        { id: "a1", category: "401k", amount: 380000, roi: 6, monthlyContribution: 1800 },
        { id: "a2", category: "Roth IRA", amount: 95000, roi: 6 },
        { id: "a3", category: "Savings Account", amount: 50000, surplusTarget: true },
        { id: "a4", category: "Brokerage", amount: 70000, roi: 7 },
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
        { id: "s1", ticker: "VTI", shares: 150, costBasis: 160 },
        { id: "s2", ticker: "VOO", shares: 80, costBasis: 320 },
        { id: "s3", ticker: "MSFT", shares: 50, costBasis: 250 },
      ],
    },
  },
];

/** Get the profiles appropriate for the given country */
export function getProfilesForCountry(country: "CA" | "US"): SampleProfile[] {
  return country === "US" ? US_SAMPLE_PROFILES : SAMPLE_PROFILES;
}
