/**
 * US benchmark data — Federal Reserve SCF 2022, Census Bureau.
 * Values in USD.
 */

import type { BenchmarkData } from "@/lib/countries/types";

export const americanBenchmarks: BenchmarkData = {
  ageGroups: [
    { ageMin: 18, ageMax: 24, label: "18–24", medianNetWorth: 8_000, medianSavingsRate: 0.05, medianDebtToIncomeRatio: 0.4, recommendedEmergencyMonths: 3, medianIncome: 30_000 },
    { ageMin: 25, ageMax: 34, label: "25–34", medianNetWorth: 39_000, medianSavingsRate: 0.10, medianDebtToIncomeRatio: 1.3, recommendedEmergencyMonths: 3, medianIncome: 55_000 },
    { ageMin: 35, ageMax: 44, label: "35–44", medianNetWorth: 135_600, medianSavingsRate: 0.12, medianDebtToIncomeRatio: 1.5, recommendedEmergencyMonths: 4, medianIncome: 68_000 },
    { ageMin: 45, ageMax: 54, label: "45–54", medianNetWorth: 247_200, medianSavingsRate: 0.15, medianDebtToIncomeRatio: 1.1, recommendedEmergencyMonths: 5, medianIncome: 72_000 },
    { ageMin: 55, ageMax: 64, label: "55–64", medianNetWorth: 364_500, medianSavingsRate: 0.18, medianDebtToIncomeRatio: 0.7, recommendedEmergencyMonths: 6, medianIncome: 65_000 },
    { ageMin: 65, ageMax: 120, label: "65+", medianNetWorth: 409_900, medianSavingsRate: 0.20, medianDebtToIncomeRatio: 0.3, recommendedEmergencyMonths: 6, medianIncome: 38_000 },
  ],
  national: {
    netWorth: 290_000,
    savingsRate: 0.12,
    debtToIncomeRatio: 1.0,
    emergencyMonths: 4,
    income: 59_000,
  },
  dataSource: "Federal Reserve, Survey of Consumer Finances (SCF) 2022, Census Bureau",
};
