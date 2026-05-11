import type { SampleProfile } from "@/lib/sample-profiles";
import type { ProfileLibrary } from "@/lib/countries/types";

export const AU_SAMPLE_PROFILES: SampleProfile[] = [
  {
    id: "fresh-grad-au",
    name: "Fresh grad, age 25",
    emoji: "🎓",
    description: "Just starting out — renting in Sydney, HELP debt, Super building",
    highlights: ["$65k salary", "$24k HELP debt", "Super accumulating"],
    state: {
      country: "AU",
      jurisdiction: "NSW",
      age: 25,
      income: [
        { id: "i1", category: "Salary", amount: 5417, frequency: "monthly", incomeType: "employment" },
      ],
      expenses: [
        { id: "e1", category: "Rent/Mortgage Payment", amount: 2200 },
        { id: "e2", category: "Groceries", amount: 500 },
        { id: "e3", category: "Subscriptions", amount: 80 },
        { id: "e4", category: "Dining Out", amount: 200 },
        { id: "e5", category: "Transportation", amount: 200 },
        { id: "e6", category: "Utilities", amount: 150 },
        { id: "e7", category: "Phone", amount: 60 },
      ],
      assets: [
        { id: "a1", category: "Super (Accumulation)", amount: 4000, roi: 7, monthlyContribution: 0, employerMatchPct: 11 },
        { id: "a2", category: "First Home Super Saver", amount: 1000, roi: 7, monthlyContribution: 100 },
        { id: "a3", category: "Savings Account", amount: 2500, roi: 4, surplusTarget: true },
      ],
      debts: [
        { id: "d1", category: "Student Loan", amount: 24000, interestRate: 3.4, monthlyPayment: 280 },
      ],
      properties: [],
      stocks: [
        { id: "s1", ticker: "VAS.AX", shares: 10, costBasis: 95, purchaseDate: "2024-07-01" },
      ],
    },
  },
  {
    id: "mid-career-au",
    name: "Mid-career family, age 38",
    emoji: "🏡",
    description: "Dual income, mortgage in Melbourne, Super & savings growing",
    highlights: ["$110k salary", "Mortgage + property", "Super building"],
    state: {
      country: "AU",
      jurisdiction: "VIC",
      age: 38,
      income: [
        { id: "i1", category: "Salary", amount: 9167, frequency: "monthly", incomeType: "employment" },
      ],
      expenses: [
        { id: "e1", category: "Groceries", amount: 750 },
        { id: "e2", category: "Subscriptions", amount: 150 },
        { id: "e3", category: "Dining Out", amount: 350 },
        { id: "e4", category: "Childcare", amount: 1400 },
        { id: "e5", category: "Transportation", amount: 400 },
        { id: "e6", category: "Utilities", amount: 220 },
        { id: "e7", category: "Insurance", amount: 280 },
        { id: "e8", category: "Phone", amount: 120 },
      ],
      assets: [
        { id: "a1", category: "Super (Accumulation)", amount: 85000, roi: 7, monthlyContribution: 500, employerMatchPct: 11 },
        { id: "a2", category: "Savings Account", amount: 15000, roi: 4, surplusTarget: true },
      ],
      debts: [
        { id: "d1", category: "Car Loan", amount: 18000, interestRate: 6.5, monthlyPayment: 450 },
      ],
      properties: [
        {
          id: "p1",
          name: "Primary Home",
          value: 850000,
          mortgage: 570000,
          interestRate: 6.2,
          monthlyPayment: 3400,
          amortizationYears: 25,
          yearPurchased: 2019,
          appreciation: 3,
        },
      ],
      stocks: [
        { id: "s1", ticker: "VAS.AX", shares: 30, costBasis: 88, purchaseDate: "2021-03-15" },
        { id: "s2", ticker: "VGS.AX", shares: 20, costBasis: 98, purchaseDate: "2022-01-10" },
        { id: "s3", ticker: "BHP.AX", shares: 50, costBasis: 40, purchaseDate: "2020-06-01" },
      ],
    },
  },
  {
    id: "pre-retirement-au",
    name: "Pre-retirement, age 58",
    emoji: "🌅",
    description: "Mortgage nearly paid off in Brisbane — large Super, planning retirement",
    highlights: ["$130k salary", "Large Super balance", "Near debt-free"],
    state: {
      country: "AU",
      jurisdiction: "QLD",
      age: 58,
      income: [
        { id: "i1", category: "Salary", amount: 10833, frequency: "monthly", incomeType: "employment" },
      ],
      expenses: [
        { id: "e1", category: "Groceries", amount: 650 },
        { id: "e2", category: "Subscriptions", amount: 110 },
        { id: "e3", category: "Dining Out", amount: 400 },
        { id: "e4", category: "Travel", amount: 600 },
        { id: "e5", category: "Transportation", amount: 350 },
        { id: "e6", category: "Utilities", amount: 200 },
        { id: "e7", category: "Insurance", amount: 380 },
        { id: "e8", category: "Health", amount: 200 },
      ],
      assets: [
        { id: "a1", category: "Super (Accumulation)", amount: 380000, roi: 6, monthlyContribution: 1500 },
        { id: "a2", category: "Savings Account", amount: 60000, roi: 4, surplusTarget: true },
        { id: "a3", category: "Brokerage", amount: 80000, roi: 7, costBasisPercent: 55 },
      ],
      debts: [
        { id: "d1", category: "Credit Card", amount: 4000, interestRate: 19.5, monthlyPayment: 200 },
      ],
      properties: [
        {
          id: "p1",
          name: "Primary Home",
          value: 850000,
          mortgage: 40000,
          interestRate: 5.5,
          monthlyPayment: 950,
          amortizationYears: 25,
          yearPurchased: 2003,
          appreciation: 3,
        },
      ],
      stocks: [
        { id: "s1", ticker: "VAS.AX", shares: 150, costBasis: 72, purchaseDate: "2015-05-10" },
        { id: "s2", ticker: "VGS.AX", shares: 100, costBasis: 85, purchaseDate: "2017-11-15" },
        { id: "s3", ticker: "A200.AX", shares: 80, costBasis: 95, purchaseDate: "2019-07-01" },
        { id: "s4", ticker: "CBA.AX", shares: 40, costBasis: 85, purchaseDate: "2018-04-20" },
      ],
    },
  },
];

export const AU_QUICK_START_PROFILES: SampleProfile[] = [
  {
    id: "au-renter",
    name: "Renter with salary",
    emoji: "🏢",
    description: "Salary income, renting, Super and savings building",
    highlights: ["$70k salary", "Renting", "Super growing"],
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
        { id: "e3", category: "Transportation", amount: 200 },
        { id: "e4", category: "Utilities", amount: 130 },
        { id: "e5", category: "Phone", amount: 65 },
      ],
      assets: [
        { id: "a1", category: "Super (Accumulation)", amount: 12000 },
        { id: "a2", category: "Savings Account", amount: 4000, surplusTarget: true },
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
    description: "Own a home in Melbourne, saving for retirement",
    highlights: ["$90k salary", "Home + mortgage", "Super growing"],
    state: {
      country: "AU",
      jurisdiction: "VIC",
      age: 38,
      income: [
        { id: "i1", category: "Salary", amount: 7500, frequency: "monthly" },
      ],
      expenses: [
        { id: "e1", category: "Groceries", amount: 700 },
        { id: "e2", category: "Transportation", amount: 350 },
        { id: "e3", category: "Utilities", amount: 200 },
        { id: "e4", category: "Insurance", amount: 250 },
        { id: "e5", category: "Phone", amount: 100 },
      ],
      assets: [
        { id: "a1", category: "Super (Accumulation)", amount: 55000 },
        { id: "a2", category: "Savings Account", amount: 15000, surplusTarget: true },
      ],
      debts: [],
      properties: [
        { id: "_simple_home", name: "Primary Residence", value: 750000, mortgage: 500000 },
      ],
      stocks: [],
    },
  },
];

export const australianProfiles: ProfileLibrary = {
  samples: AU_SAMPLE_PROFILES,
  quickStarts: AU_QUICK_START_PROFILES,
};
