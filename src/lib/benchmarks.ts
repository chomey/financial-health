/**
 * Benchmark data for financial comparisons by age group and country.
 *
 * Sources:
 * - Canada: Statistics Canada, Survey of Financial Security (SFS) 2023
 * - USA: Federal Reserve, Survey of Consumer Finances (SCF) 2022
 *
 * All values in respective local currency (CAD for CA, USD for US).
 * Since this app doesn't handle currency conversion, values are treated as
 * comparable approximations for encouraging benchmarking purposes.
 */

export interface AgeGroupBenchmark {
  ageMin: number;
  ageMax: number;
  label: string;
  medianNetWorth: number;
  medianSavingsRate: number; // as decimal (0.10 = 10%)
  medianDebtToIncomeRatio: number; // as decimal
  recommendedEmergencyMonths: number;
  medianIncome: number; // annual household income
}

/** National average values across all age groups */
export interface NationalAverage {
  netWorth: number;
  savingsRate: number;
  debtToIncomeRatio: number;
  emergencyMonths: number;
  income: number;
}

// Canadian benchmarks (CAD) — Statistics Canada SFS 2023, Census 2021
const CA_BENCHMARKS: AgeGroupBenchmark[] = [
  { ageMin: 18, ageMax: 24, label: "18–24", medianNetWorth: 5_000, medianSavingsRate: 0.05, medianDebtToIncomeRatio: 0.3, recommendedEmergencyMonths: 3, medianIncome: 32_000 },
  { ageMin: 25, ageMax: 34, label: "25–34", medianNetWorth: 48_800, medianSavingsRate: 0.10, medianDebtToIncomeRatio: 1.5, recommendedEmergencyMonths: 3, medianIncome: 58_000 },
  { ageMin: 35, ageMax: 44, label: "35–44", medianNetWorth: 234_400, medianSavingsRate: 0.12, medianDebtToIncomeRatio: 1.7, recommendedEmergencyMonths: 4, medianIncome: 72_000 },
  { ageMin: 45, ageMax: 54, label: "45–54", medianNetWorth: 351_400, medianSavingsRate: 0.15, medianDebtToIncomeRatio: 1.3, recommendedEmergencyMonths: 5, medianIncome: 76_000 },
  { ageMin: 55, ageMax: 64, label: "55–64", medianNetWorth: 543_200, medianSavingsRate: 0.18, medianDebtToIncomeRatio: 0.8, recommendedEmergencyMonths: 6, medianIncome: 65_000 },
  { ageMin: 65, ageMax: 120, label: "65+", medianNetWorth: 543_600, medianSavingsRate: 0.20, medianDebtToIncomeRatio: 0.3, recommendedEmergencyMonths: 6, medianIncome: 40_000 },
];

const CA_NATIONAL_AVERAGE: NationalAverage = {
  netWorth: 330_000,
  savingsRate: 0.13,
  debtToIncomeRatio: 1.0,
  emergencyMonths: 4,
  income: 62_000,
};

// US benchmarks (USD) — Federal Reserve SCF 2022, Census Bureau
const US_BENCHMARKS: AgeGroupBenchmark[] = [
  { ageMin: 18, ageMax: 24, label: "18–24", medianNetWorth: 8_000, medianSavingsRate: 0.05, medianDebtToIncomeRatio: 0.4, recommendedEmergencyMonths: 3, medianIncome: 30_000 },
  { ageMin: 25, ageMax: 34, label: "25–34", medianNetWorth: 39_000, medianSavingsRate: 0.10, medianDebtToIncomeRatio: 1.3, recommendedEmergencyMonths: 3, medianIncome: 55_000 },
  { ageMin: 35, ageMax: 44, label: "35–44", medianNetWorth: 135_600, medianSavingsRate: 0.12, medianDebtToIncomeRatio: 1.5, recommendedEmergencyMonths: 4, medianIncome: 68_000 },
  { ageMin: 45, ageMax: 54, label: "45–54", medianNetWorth: 247_200, medianSavingsRate: 0.15, medianDebtToIncomeRatio: 1.1, recommendedEmergencyMonths: 5, medianIncome: 72_000 },
  { ageMin: 55, ageMax: 64, label: "55–64", medianNetWorth: 364_500, medianSavingsRate: 0.18, medianDebtToIncomeRatio: 0.7, recommendedEmergencyMonths: 6, medianIncome: 65_000 },
  { ageMin: 65, ageMax: 120, label: "65+", medianNetWorth: 409_900, medianSavingsRate: 0.20, medianDebtToIncomeRatio: 0.3, recommendedEmergencyMonths: 6, medianIncome: 38_000 },
];

const US_NATIONAL_AVERAGE: NationalAverage = {
  netWorth: 290_000,
  savingsRate: 0.12,
  debtToIncomeRatio: 1.0,
  emergencyMonths: 4,
  income: 59_000,
};

export function getBenchmarksForCountry(country: "CA" | "US" | "AU"): AgeGroupBenchmark[] {
  return country === "CA" ? CA_BENCHMARKS : US_BENCHMARKS;
}

export function getNationalAverage(country: "CA" | "US" | "AU"): NationalAverage {
  return country === "CA" ? CA_NATIONAL_AVERAGE : US_NATIONAL_AVERAGE;
}

export function getBenchmarkForAge(age: number, country: "CA" | "US" | "AU"): AgeGroupBenchmark | null {
  const benchmarks = getBenchmarksForCountry(country);
  return benchmarks.find((b) => age >= b.ageMin && age <= b.ageMax) ?? null;
}

export interface BenchmarkComparison {
  metric: string;
  userValue: number;
  benchmarkValue: number;
  nationalAverage: number;
  format: "currency" | "percent" | "months" | "ratio";
  /** Encouraging message about the comparison */
  message: string;
  /** Whether the user is at or above the benchmark */
  aboveBenchmark: boolean;
  /** Estimated percentile (0-100) within the age group for this metric */
  percentile: number;
  /** Age group label, e.g. "35–44" */
  ageGroupLabel: string;
}

/**
 * Approximate the normal CDF using the Abramowitz & Stegun polynomial method.
 * Accurate to ~7.5e-8.
 */
function normalCDF(z: number): number {
  const a1 = 0.319381530, a2 = -0.356563782, a3 = 1.781477937;
  const a4 = -1.821255978, a5 = 1.330274429;
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const poly = t * (a1 + t * (a2 + t * (a3 + t * (a4 + t * a5))));
  const pdf = Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
  const p = 1 - pdf * poly;
  return z >= 0 ? p : 1 - p;
}

/**
 * Estimate where the user falls in their age-group distribution for a metric.
 * Uses a lognormal model: median is the p50 point, sigma is the shape parameter.
 * Returns a percentile from 0 to 100 (clamped).
 *
 * @param userValue   The user's value
 * @param medianValue The age-group median for the metric
 * @param sigma       Log-normal shape (default 1.0 — typical for wealth/income)
 * @param higherIsBetter If false (e.g. debt ratio), we flip the direction
 */
export function estimatePercentile(
  userValue: number,
  medianValue: number,
  sigma = 1.0,
  higherIsBetter = true,
): number {
  if (medianValue <= 0 || userValue <= 0) {
    // Can't log-transform zeros/negatives — return a rough approximation
    if (userValue === medianValue) return 50;
    const above = higherIsBetter ? userValue > medianValue : userValue < medianValue;
    return above ? 65 : 35;
  }
  const mu = Math.log(medianValue);
  const z = (Math.log(userValue) - mu) / sigma;
  const raw = normalCDF(z) * 100;
  // If lower-is-better, flip the direction
  const pct = higherIsBetter ? raw : 100 - raw;
  return Math.max(1, Math.min(99, Math.round(pct)));
}

import { CurrencyFormatter, getHomeCurrency } from "@/lib/currency";

function fmtCurrency(n: number, country: "CA" | "US" | "AU" = "US"): string {
  return new CurrencyFormatter(getHomeCurrency(country)).compact(n);
}

function fmtPercent(n: number): string {
  return `${(n * 100).toFixed(0)}%`;
}

export function computeBenchmarkComparisons(
  age: number,
  country: "CA" | "US" | "AU",
  netWorth: number,
  savingsRate: number, // surplus / income, as decimal
  emergencyMonths: number,
  debtToIncomeRatio: number, // total debts / annual income
  annualIncome?: number, // annual gross income
): BenchmarkComparison[] {
  const benchmark = getBenchmarkForAge(age, country);
  if (!benchmark) return [];

  const natl = getNationalAverage(country);
  const comparisons: BenchmarkComparison[] = [];

  // Net Worth comparison
  const nwAbove = netWorth >= benchmark.medianNetWorth;
  const nwPct = estimatePercentile(netWorth, benchmark.medianNetWorth);
  const nwMessage = nwAbove
    ? `Your net worth of ${fmtCurrency(netWorth, country)} is above the ${benchmark.label} median of ${fmtCurrency(benchmark.medianNetWorth, country)} — you're in approximately the top ${100 - nwPct}% for your age group!`
    : `Your net worth of ${fmtCurrency(netWorth, country)} is building toward the ${benchmark.label} median of ${fmtCurrency(benchmark.medianNetWorth, country)} — keep going!`;
  comparisons.push({
    metric: "Net Worth",
    userValue: netWorth,
    benchmarkValue: benchmark.medianNetWorth,
    nationalAverage: natl.netWorth,
    format: "currency",
    message: nwMessage,
    aboveBenchmark: nwAbove,
    percentile: nwPct,
    ageGroupLabel: benchmark.label,
  });

  // Income comparison
  if (annualIncome !== undefined && annualIncome > 0) {
    const incAbove = annualIncome >= benchmark.medianIncome;
    const incPct = estimatePercentile(annualIncome, benchmark.medianIncome);
    const incMessage = incAbove
      ? `Your income of ${fmtCurrency(annualIncome, country)}/yr is above the ${benchmark.label} median of ${fmtCurrency(benchmark.medianIncome, country)}/yr — nice work!`
      : `Your income of ${fmtCurrency(annualIncome, country)}/yr is approaching the ${benchmark.label} median of ${fmtCurrency(benchmark.medianIncome, country)}/yr — you're on your way`;
    comparisons.push({
      metric: "Income",
      userValue: annualIncome,
      benchmarkValue: benchmark.medianIncome,
      nationalAverage: natl.income,
      format: "currency",
      message: incMessage,
      aboveBenchmark: incAbove,
      percentile: incPct,
      ageGroupLabel: benchmark.label,
    });
  }

  // Savings Rate comparison
  const srAbove = savingsRate >= benchmark.medianSavingsRate;
  const srPct = estimatePercentile(savingsRate, benchmark.medianSavingsRate, 1.5);
  const srMessage = srAbove
    ? `Your savings rate of ${fmtPercent(savingsRate)} beats the ${benchmark.label} median of ${fmtPercent(benchmark.medianSavingsRate)} — keep it up!`
    : `A ${fmtPercent(benchmark.medianSavingsRate)} savings rate is the ${benchmark.label} median — every extra percentage point compounds over time`;
  comparisons.push({
    metric: "Savings Rate",
    userValue: savingsRate,
    benchmarkValue: benchmark.medianSavingsRate,
    nationalAverage: natl.savingsRate,
    format: "percent",
    message: srMessage,
    aboveBenchmark: srAbove,
    percentile: srPct,
    ageGroupLabel: benchmark.label,
  });

  // Emergency Fund comparison
  const efAbove = emergencyMonths >= benchmark.recommendedEmergencyMonths;
  const efPct = estimatePercentile(emergencyMonths, benchmark.recommendedEmergencyMonths, 1.2);
  const efMessage = efAbove
    ? `You have more than the recommended ${benchmark.recommendedEmergencyMonths} months of emergency fund for ages ${benchmark.label} — well done!`
    : `Building toward ${benchmark.recommendedEmergencyMonths} months of expenses is a great goal for ages ${benchmark.label}`;
  comparisons.push({
    metric: "Emergency Fund",
    userValue: emergencyMonths,
    benchmarkValue: benchmark.recommendedEmergencyMonths,
    nationalAverage: natl.emergencyMonths,
    format: "months",
    message: efMessage,
    aboveBenchmark: efAbove,
    percentile: efPct,
    ageGroupLabel: benchmark.label,
  });

  // Debt-to-Income Ratio comparison (lower is better)
  const diAbove = debtToIncomeRatio <= benchmark.medianDebtToIncomeRatio;
  const diPct = estimatePercentile(debtToIncomeRatio, benchmark.medianDebtToIncomeRatio, 1.0, false);
  const diMessage = diAbove
    ? `Your debt-to-income ratio of ${debtToIncomeRatio.toFixed(1)} is better than the ${benchmark.label} median of ${benchmark.medianDebtToIncomeRatio.toFixed(1)} — solid financial footing`
    : `A debt-to-income ratio of ${benchmark.medianDebtToIncomeRatio.toFixed(1)} is typical for ages ${benchmark.label} — mortgages and student loans are normal`;
  comparisons.push({
    metric: "Debt-to-Income",
    userValue: debtToIncomeRatio,
    benchmarkValue: benchmark.medianDebtToIncomeRatio,
    nationalAverage: natl.debtToIncomeRatio,
    format: "ratio",
    message: diMessage,
    aboveBenchmark: diAbove,
    percentile: diPct,
    ageGroupLabel: benchmark.label,
  });

  return comparisons;
}

export const DATA_SOURCES: Record<"CA" | "US" | "AU", string> = {
  CA: "Statistics Canada, Survey of Financial Security (SFS) 2023, Census 2021",
  US: "Federal Reserve, Survey of Consumer Finances (SCF) 2022, Census Bureau",
  AU: "Australian Bureau of Statistics, Survey of Income and Housing 2021-22",
};
