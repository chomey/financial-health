/**
 * Retirement Readiness Score (0-100)
 *
 * Combines multiple financial health signals into a single retirement readiness score.
 * Each component is scored 0-100 and weighted:
 *
 * 1. Income Replacement (30%) — % of income sustainably replaceable by portfolio (4% rule)
 * 2. Emergency Runway (20%) — months of expenses covered by liquid assets
 * 3. Government Benefits (15%) — whether government retirement income is configured
 * 4. Debt Position (15%) — debt-to-asset ratio and debt-free-by-retirement likelihood
 * 5. Tax Diversification (20%) — mix of tax-free/deferred/taxable accounts
 */

export interface RetirementReadinessInput {
  /** Income replacement ratio as percentage (0-100+) */
  incomeReplacementRatio?: number;
  /** Emergency runway in months */
  runwayMonths: number;
  /** Monthly government retirement income */
  monthlyGovernmentIncome: number;
  /** Monthly expenses */
  monthlyExpenses: number;
  /** Total debts */
  totalDebts: number;
  /** Total assets (liquid) */
  totalAssets: number;
  /** Tax-free account total */
  taxFreeTotal: number;
  /** Tax-deferred account total */
  taxDeferredTotal: number;
  /** Taxable account total */
  taxableTotal: number;
}

export interface RetirementReadinessResult {
  /** Overall score 0-100 */
  score: number;
  /** Tier label */
  tier: string;
  /** Component scores for breakdown */
  components: {
    incomeReplacement: number;
    runway: number;
    governmentBenefits: number;
    debtPosition: number;
    taxDiversification: number;
  };
}

const TIERS: { min: number; label: string }[] = [
  { min: 80, label: "Retirement Ready" },
  { min: 60, label: "Strong" },
  { min: 40, label: "On Track" },
  { min: 20, label: "Building" },
  { min: 0, label: "Getting Started" },
];

export function getTierLabel(score: number): string {
  for (const tier of TIERS) {
    if (score >= tier.min) return tier.label;
  }
  return "Getting Started";
}

export function computeRetirementReadiness(input: RetirementReadinessInput): RetirementReadinessResult {
  // 1. Income Replacement (30%) — 0-100 scale, capped at 100
  const irScore = Math.min(100, input.incomeReplacementRatio ?? 0);

  // 2. Emergency Runway (20%) — 0 months=0, 6 months=50, 12 months=75, 24+=100
  let runwayScore = 0;
  if (input.runwayMonths >= 24) runwayScore = 100;
  else if (input.runwayMonths >= 12) runwayScore = 75 + (input.runwayMonths - 12) / 12 * 25;
  else if (input.runwayMonths >= 6) runwayScore = 50 + (input.runwayMonths - 6) / 6 * 25;
  else if (input.runwayMonths > 0) runwayScore = (input.runwayMonths / 6) * 50;

  // 3. Government Benefits (15%) — 0=none configured, 50=some, 100=covers 50%+ of expenses
  let govScore = 0;
  if (input.monthlyGovernmentIncome > 0 && input.monthlyExpenses > 0) {
    const govCoverage = input.monthlyGovernmentIncome / input.monthlyExpenses;
    if (govCoverage >= 0.5) govScore = 100;
    else govScore = 50 + (govCoverage / 0.5) * 50;
  } else if (input.monthlyGovernmentIncome > 0) {
    govScore = 50;
  }

  // 4. Debt Position (15%) — debt-to-asset ratio: 0%=100, 25%=75, 50%=50, 100%+=0
  let debtScore = 100;
  if (input.totalAssets > 0) {
    const dta = input.totalDebts / input.totalAssets;
    if (dta >= 1) debtScore = 0;
    else debtScore = Math.max(0, (1 - dta) * 100);
  } else if (input.totalDebts > 0) {
    debtScore = 0;
  }

  // 5. Tax Diversification (20%) — ideal is a mix of all three types
  // Score based on Shannon entropy of the three buckets, normalized to 0-100
  const totalInvested = input.taxFreeTotal + input.taxDeferredTotal + input.taxableTotal;
  let taxDivScore = 0;
  if (totalInvested > 0) {
    const buckets = [input.taxFreeTotal, input.taxDeferredTotal, input.taxableTotal].filter(b => b > 0);
    if (buckets.length === 1) {
      taxDivScore = 33; // Only one type — poor diversification
    } else if (buckets.length === 2) {
      taxDivScore = 66; // Two types — decent
    } else {
      // All three types — score based on how balanced they are
      const shares = [input.taxFreeTotal, input.taxDeferredTotal, input.taxableTotal].map(b => b / totalInvested);
      // Perfect balance = each is 33.3%. Score 100 for perfect, less for imbalance.
      const maxShare = Math.max(...shares);
      taxDivScore = maxShare <= 0.5 ? 100 : Math.max(66, 100 - (maxShare - 0.5) * 100);
    }
  }

  // Weighted average
  const score = Math.round(
    irScore * 0.30 +
    runwayScore * 0.20 +
    govScore * 0.15 +
    debtScore * 0.15 +
    taxDivScore * 0.20
  );

  return {
    score: Math.min(100, Math.max(0, score)),
    tier: getTierLabel(score),
    components: {
      incomeReplacement: Math.round(irScore),
      runway: Math.round(runwayScore),
      governmentBenefits: Math.round(govScore),
      debtPosition: Math.round(debtScore),
      taxDiversification: Math.round(taxDivScore),
    },
  };
}
