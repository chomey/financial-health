/**
 * Canadian benchmark data — Statistics Canada SFS 2023, Census 2021.
 * Values in CAD. Used by the dashboard "Compare" panel.
 */

import type { BenchmarkData } from "@/lib/countries/types";

export const canadianBenchmarks: BenchmarkData = {
  ageGroups: [
    { ageMin: 18, ageMax: 24, label: "18–24", medianNetWorth: 5_000, medianSavingsRate: 0.05, medianDebtToIncomeRatio: 0.3, recommendedEmergencyMonths: 3, medianIncome: 32_000 },
    { ageMin: 25, ageMax: 34, label: "25–34", medianNetWorth: 48_800, medianSavingsRate: 0.10, medianDebtToIncomeRatio: 1.5, recommendedEmergencyMonths: 3, medianIncome: 58_000 },
    { ageMin: 35, ageMax: 44, label: "35–44", medianNetWorth: 234_400, medianSavingsRate: 0.12, medianDebtToIncomeRatio: 1.7, recommendedEmergencyMonths: 4, medianIncome: 72_000 },
    { ageMin: 45, ageMax: 54, label: "45–54", medianNetWorth: 351_400, medianSavingsRate: 0.15, medianDebtToIncomeRatio: 1.3, recommendedEmergencyMonths: 5, medianIncome: 76_000 },
    { ageMin: 55, ageMax: 64, label: "55–64", medianNetWorth: 543_200, medianSavingsRate: 0.18, medianDebtToIncomeRatio: 0.8, recommendedEmergencyMonths: 6, medianIncome: 65_000 },
    { ageMin: 65, ageMax: 120, label: "65+", medianNetWorth: 543_600, medianSavingsRate: 0.20, medianDebtToIncomeRatio: 0.3, recommendedEmergencyMonths: 6, medianIncome: 40_000 },
  ],
  national: {
    netWorth: 330_000,
    savingsRate: 0.13,
    debtToIncomeRatio: 1.0,
    emergencyMonths: 4,
    income: 62_000,
  },
  dataSource: "Statistics Canada, Survey of Financial Security (SFS) 2023, Census 2021",
};
