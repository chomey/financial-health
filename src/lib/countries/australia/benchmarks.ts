/**
 * Australian benchmark data — ABS Household Income and Wealth 2021-22.
 * Values in AUD.
 */

import type { BenchmarkData } from "@/lib/countries/types";

export const australianBenchmarks: BenchmarkData = {
  ageGroups: [
    { ageMin: 18, ageMax: 24, label: "18–24", medianNetWorth: 43_000, medianSavingsRate: 0.08, medianDebtToIncomeRatio: 0.2, recommendedEmergencyMonths: 3, medianIncome: 36_000 },
    { ageMin: 25, ageMax: 34, label: "25–34", medianNetWorth: 145_000, medianSavingsRate: 0.10, medianDebtToIncomeRatio: 2.0, recommendedEmergencyMonths: 3, medianIncome: 68_000 },
    { ageMin: 35, ageMax: 44, label: "35–44", medianNetWorth: 470_000, medianSavingsRate: 0.12, medianDebtToIncomeRatio: 2.5, recommendedEmergencyMonths: 4, medianIncome: 80_000 },
    { ageMin: 45, ageMax: 54, label: "45–54", medianNetWorth: 860_000, medianSavingsRate: 0.15, medianDebtToIncomeRatio: 1.8, recommendedEmergencyMonths: 5, medianIncome: 85_000 },
    { ageMin: 55, ageMax: 64, label: "55–64", medianNetWorth: 1_150_000, medianSavingsRate: 0.18, medianDebtToIncomeRatio: 0.8, recommendedEmergencyMonths: 6, medianIncome: 65_000 },
    { ageMin: 65, ageMax: 120, label: "65+", medianNetWorth: 1_100_000, medianSavingsRate: 0.15, medianDebtToIncomeRatio: 0.2, recommendedEmergencyMonths: 6, medianIncome: 42_000 },
  ],
  national: {
    netWorth: 672_800,
    savingsRate: 0.12,
    debtToIncomeRatio: 1.8,
    emergencyMonths: 4,
    income: 65_000,
  },
  dataSource: "Australian Bureau of Statistics, Survey of Income and Housing 2021-22",
};
