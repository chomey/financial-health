"use client";

/**
 * Financial Health Score — composite 0–100 score from key financial metrics.
 * Displayed as a ring gauge alongside metric breakdowns.
 *
 * Scoring rubric (each 0–25 points):
 *   Savings rate:     0% → 0, ≥20% → 25
 *   Emergency fund:   0 mo → 0, ≥6 mo → 25
 *   Debt-to-income:   ≥1.0 → 0, 0 → 25
 *   Net worth:        ≤0 → 0, ≥3× annual income → 25 (or 25 if no income but positive NW)
 */

export interface FinancialHealthScoreProps {
  savingsRate: number; // 0–1 fraction
  emergencyMonths: number;
  debtToIncomeRatio: number; // total debt / annual income
  netWorth: number;
  annualIncome: number;
}

interface SubScore {
  label: string;
  score: number; // 0–25
  detail: string;
}

function computeSubScores(props: FinancialHealthScoreProps): SubScore[] {
  const { savingsRate, emergencyMonths, debtToIncomeRatio, netWorth, annualIncome } = props;

  // Savings rate: 0% → 0, 20%+ → 25
  const srPct = Math.max(0, Math.min(savingsRate, 1)) * 100;
  const srScore = Math.min(25, (srPct / 20) * 25);
  const srDetail = `${srPct.toFixed(0)}% of income saved`;

  // Emergency fund: 0 → 0, 6+ → 25
  const efScore = Math.min(25, (Math.max(0, emergencyMonths) / 6) * 25);
  const efDetail = `${emergencyMonths.toFixed(1)} months of expenses`;

  // Debt-to-income: 1.0+ → 0, 0 → 25 (inverted)
  const dtiClamped = Math.max(0, Math.min(debtToIncomeRatio, 1));
  const dtiScore = (1 - dtiClamped) * 25;
  const dtiDetail = annualIncome > 0
    ? `${(debtToIncomeRatio * 100).toFixed(0)}% of annual income`
    : "No income data";

  // Net worth: ≤0 → 0, ≥3× income → 25
  let nwScore: number;
  if (annualIncome > 0) {
    const ratio = netWorth / annualIncome;
    nwScore = Math.min(25, Math.max(0, (ratio / 3) * 25));
  } else {
    nwScore = netWorth > 0 ? 25 : 0;
  }
  const nwDetail = annualIncome > 0
    ? `${(netWorth / annualIncome).toFixed(1)}× annual income`
    : (netWorth > 0 ? "Positive" : "Negative or zero");

  return [
    { label: "Savings Rate", score: srScore, detail: srDetail },
    { label: "Emergency Fund", score: efScore, detail: efDetail },
    { label: "Debt-to-Income", score: dtiScore, detail: dtiDetail },
    { label: "Net Worth", score: nwScore, detail: nwDetail },
  ];
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-cyan-400";
  if (score >= 40) return "text-amber-400";
  return "text-rose-400";
}

function getScoreStrokeColor(score: number): string {
  if (score >= 80) return "stroke-emerald-400";
  if (score >= 60) return "stroke-cyan-400";
  if (score >= 40) return "stroke-amber-400";
  return "stroke-rose-400";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Needs Work";
}

function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140" className="transform -rotate-90">
        {/* Background ring */}
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          strokeWidth="10"
          className="stroke-white/10"
        />
        {/* Score ring */}
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${getScoreStrokeColor(score)} transition-all duration-700`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${getScoreColor(score)}`}>
          {Math.round(score)}
        </span>
        <span className="text-xs text-slate-500 mt-0.5">/100</span>
      </div>
    </div>
  );
}

function SubScoreBar({ sub }: { sub: SubScore }) {
  const pct = (sub.score / 25) * 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-slate-300">{sub.label}</span>
        <span className="text-xs text-slate-500">{Math.round(sub.score)}/25</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            pct >= 80 ? "bg-emerald-400" : pct >= 50 ? "bg-cyan-400" : pct >= 25 ? "bg-amber-400" : "bg-rose-400"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-slate-500 mt-0.5">{sub.detail}</p>
    </div>
  );
}

export default function FinancialHealthScore(props: FinancialHealthScoreProps) {
  const subScores = computeSubScores(props);
  const totalScore = subScores.reduce((sum, s) => sum + s.score, 0);

  return (
    <div
      className="rounded-xl border border-white/10 bg-white/5 p-3 sm:p-5 shadow-sm"
      data-testid="financial-health-score"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-slate-200">Financial Health Score</h3>
        <span className="text-lg" aria-hidden="true">🏥</span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        {/* Ring gauge */}
        <div className="flex flex-col items-center shrink-0">
          <ScoreRing score={totalScore} />
          <span className={`mt-1 text-sm font-medium ${getScoreColor(totalScore)}`}>
            {getScoreLabel(totalScore)}
          </span>
        </div>

        {/* Sub-score breakdown */}
        <div className="flex-1 w-full space-y-3">
          {subScores.map((sub) => (
            <SubScoreBar key={sub.label} sub={sub} />
          ))}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500 leading-relaxed">
        Composite score based on savings rate, emergency fund, debt-to-income ratio, and net worth relative to income. Each metric contributes up to 25 points.
      </p>
    </div>
  );
}
