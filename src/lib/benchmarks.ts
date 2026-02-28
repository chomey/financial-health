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
}

// Canadian benchmarks (CAD) — Statistics Canada SFS 2023
const CA_BENCHMARKS: AgeGroupBenchmark[] = [
  { ageMin: 18, ageMax: 24, label: "18–24", medianNetWorth: 5_000, medianSavingsRate: 0.05, medianDebtToIncomeRatio: 0.3, recommendedEmergencyMonths: 3 },
  { ageMin: 25, ageMax: 34, label: "25–34", medianNetWorth: 48_800, medianSavingsRate: 0.10, medianDebtToIncomeRatio: 1.5, recommendedEmergencyMonths: 3 },
  { ageMin: 35, ageMax: 44, label: "35–44", medianNetWorth: 234_400, medianSavingsRate: 0.12, medianDebtToIncomeRatio: 1.7, recommendedEmergencyMonths: 4 },
  { ageMin: 45, ageMax: 54, label: "45–54", medianNetWorth: 351_400, medianSavingsRate: 0.15, medianDebtToIncomeRatio: 1.3, recommendedEmergencyMonths: 5 },
  { ageMin: 55, ageMax: 64, label: "55–64", medianNetWorth: 543_200, medianSavingsRate: 0.18, medianDebtToIncomeRatio: 0.8, recommendedEmergencyMonths: 6 },
  { ageMin: 65, ageMax: 120, label: "65+", medianNetWorth: 543_600, medianSavingsRate: 0.20, medianDebtToIncomeRatio: 0.3, recommendedEmergencyMonths: 6 },
];

// US benchmarks (USD) — Federal Reserve SCF 2022
const US_BENCHMARKS: AgeGroupBenchmark[] = [
  { ageMin: 18, ageMax: 24, label: "18–24", medianNetWorth: 8_000, medianSavingsRate: 0.05, medianDebtToIncomeRatio: 0.4, recommendedEmergencyMonths: 3 },
  { ageMin: 25, ageMax: 34, label: "25–34", medianNetWorth: 39_000, medianSavingsRate: 0.10, medianDebtToIncomeRatio: 1.3, recommendedEmergencyMonths: 3 },
  { ageMin: 35, ageMax: 44, label: "35–44", medianNetWorth: 135_600, medianSavingsRate: 0.12, medianDebtToIncomeRatio: 1.5, recommendedEmergencyMonths: 4 },
  { ageMin: 45, ageMax: 54, label: "45–54", medianNetWorth: 247_200, medianSavingsRate: 0.15, medianDebtToIncomeRatio: 1.1, recommendedEmergencyMonths: 5 },
  { ageMin: 55, ageMax: 64, label: "55–64", medianNetWorth: 364_500, medianSavingsRate: 0.18, medianDebtToIncomeRatio: 0.7, recommendedEmergencyMonths: 6 },
  { ageMin: 65, ageMax: 120, label: "65+", medianNetWorth: 409_900, medianSavingsRate: 0.20, medianDebtToIncomeRatio: 0.3, recommendedEmergencyMonths: 6 },
];

export function getBenchmarksForCountry(country: "CA" | "US"): AgeGroupBenchmark[] {
  return country === "CA" ? CA_BENCHMARKS : US_BENCHMARKS;
}

export function getBenchmarkForAge(age: number, country: "CA" | "US"): AgeGroupBenchmark | null {
  const benchmarks = getBenchmarksForCountry(country);
  return benchmarks.find((b) => age >= b.ageMin && age <= b.ageMax) ?? null;
}

export interface BenchmarkComparison {
  metric: string;
  userValue: number;
  benchmarkValue: number;
  format: "currency" | "percent" | "months" | "ratio";
  /** Encouraging message about the comparison */
  message: string;
  /** Whether the user is at or above the benchmark */
  aboveBenchmark: boolean;
}

function fmtCurrency(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toFixed(0)}`;
}

function fmtPercent(n: number): string {
  return `${(n * 100).toFixed(0)}%`;
}

export function computeBenchmarkComparisons(
  age: number,
  country: "CA" | "US",
  netWorth: number,
  savingsRate: number, // surplus / income, as decimal
  emergencyMonths: number,
  debtToIncomeRatio: number, // total debts / annual income
): BenchmarkComparison[] {
  const benchmark = getBenchmarkForAge(age, country);
  if (!benchmark) return [];

  const comparisons: BenchmarkComparison[] = [];

  // Net Worth comparison
  const nwAbove = netWorth >= benchmark.medianNetWorth;
  const nwMessage = nwAbove
    ? `Your net worth is above the median for your age group (${benchmark.label}) — great progress!`
    : `The median net worth for the ${benchmark.label} age group is ${fmtCurrency(benchmark.medianNetWorth)} — you're building toward it`;
  comparisons.push({
    metric: "Net Worth",
    userValue: netWorth,
    benchmarkValue: benchmark.medianNetWorth,
    format: "currency",
    message: nwMessage,
    aboveBenchmark: nwAbove,
  });

  // Savings Rate comparison
  const srAbove = savingsRate >= benchmark.medianSavingsRate;
  const srMessage = srAbove
    ? `Your savings rate is above the median for your age group — keep it up!`
    : `A ${fmtPercent(benchmark.medianSavingsRate)} savings rate is a solid target for your age group — every bit counts`;
  comparisons.push({
    metric: "Savings Rate",
    userValue: savingsRate,
    benchmarkValue: benchmark.medianSavingsRate,
    format: "percent",
    message: srMessage,
    aboveBenchmark: srAbove,
  });

  // Emergency Fund comparison
  const efAbove = emergencyMonths >= benchmark.recommendedEmergencyMonths;
  const efMessage = efAbove
    ? `You have more than the recommended ${benchmark.recommendedEmergencyMonths} months of emergency fund — well done!`
    : `Building toward ${benchmark.recommendedEmergencyMonths} months of expenses is a great goal for your age group`;
  comparisons.push({
    metric: "Emergency Fund",
    userValue: emergencyMonths,
    benchmarkValue: benchmark.recommendedEmergencyMonths,
    format: "months",
    message: efMessage,
    aboveBenchmark: efAbove,
  });

  // Debt-to-Income Ratio comparison (lower is better)
  const diAbove = debtToIncomeRatio <= benchmark.medianDebtToIncomeRatio;
  const diMessage = diAbove
    ? `Your debt-to-income ratio is better than the median for your age group — solid financial footing`
    : `A debt-to-income ratio around ${benchmark.medianDebtToIncomeRatio.toFixed(1)} is typical for your age group — mortgages and student loans are normal`;
  comparisons.push({
    metric: "Debt-to-Income",
    userValue: debtToIncomeRatio,
    benchmarkValue: benchmark.medianDebtToIncomeRatio,
    format: "ratio",
    message: diMessage,
    aboveBenchmark: diAbove,
  });

  return comparisons;
}

export const DATA_SOURCES = {
  CA: "Statistics Canada, Survey of Financial Security (SFS) 2023",
  US: "Federal Reserve, Survey of Consumer Finances (SCF) 2022",
};
