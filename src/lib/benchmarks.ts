/**
 * Benchmark data for financial comparisons by age group and country.
 *
 * Per-country age groups, national averages, and source attribution live in
 * each country plugin's `benchmarks` field (see
 * `src/lib/countries/<country>/benchmarks.ts`). This file is a thin shim plus
 * the comparison helpers used by the dashboard.
 */

import type { AgeGroupBenchmark, NationalAverage, CountryCode } from "@/lib/countries";
import { getCountry } from "@/lib/countries";

export type { AgeGroupBenchmark, NationalAverage } from "@/lib/countries";

export function getBenchmarksForCountry(country: CountryCode): AgeGroupBenchmark[] {
  return getCountry(country).benchmarks.ageGroups;
}

export function getNationalAverage(country: CountryCode): NationalAverage {
  return getCountry(country).benchmarks.national;
}

export function getBenchmarkForAge(age: number, country: CountryCode): AgeGroupBenchmark | null {
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

function fmtCurrency(n: number, country: CountryCode = "US"): string {
  return new CurrencyFormatter(getHomeCurrency(country)).compact(n);
}

function fmtPercent(n: number): string {
  return `${(n * 100).toFixed(0)}%`;
}

export function computeBenchmarkComparisons(
  age: number,
  country: CountryCode,
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

export const DATA_SOURCES: Record<CountryCode, string> = {
  CA: getCountry("CA").benchmarks.dataSource,
  US: getCountry("US").benchmarks.dataSource,
  AU: getCountry("AU").benchmarks.dataSource,
};
