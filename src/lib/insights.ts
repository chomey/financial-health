export interface DebtDetail {
  category: string;
  amount: number;
  interestRate?: number;
  monthlyPayment?: number;
}

export interface FinancialData {
  totalAssets: number;
  totalDebts: number;
  /** Liquid assets only (excludes property equity). Used for runway calculation. */
  liquidAssets?: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  /** Raw monthly expenses without investment contributions. Used for runway to match metric card. */
  rawMonthlyExpenses?: number;
  goals: { name: string; target: number; current: number }[];
  /** Individual debt details for interest-based insights */
  debts?: DebtDetail[];
}

export type InsightType = "runway" | "surplus" | "goal" | "net-worth" | "savings-rate" | "debt-interest";

export interface Insight {
  id: string;
  type: InsightType;
  message: string;
  icon: string;
}

export function generateInsights(data: FinancialData): Insight[] {
  const insights: Insight[] = [];
  const { totalAssets, totalDebts, monthlyIncome, monthlyExpenses, goals } = data;

  const netWorth = totalAssets - totalDebts;
  const surplus = monthlyIncome - monthlyExpenses;
  // Use liquid assets for runway if available, otherwise fall back to totalAssets
  // Use raw expenses (not including investment contributions) to match the metric card
  const runwayAssets = data.liquidAssets ?? totalAssets;
  const rawExpenses = data.rawMonthlyExpenses ?? monthlyExpenses;
  const runway = rawExpenses > 0 ? runwayAssets / rawExpenses : 0;
  // Savings rate includes both surplus AND investment contributions (which are a form of saving)
  const totalSavings = monthlyIncome - rawExpenses;
  const savingsRate = monthlyIncome > 0 ? (totalSavings / monthlyIncome) * 100 : 0;

  // Runway insight — use the same value shown on the metric card
  if (runway > 0) {
    const months = Math.floor(runway);
    if (months >= 12) {
      insights.push({
        id: "runway-strong",
        type: "runway",
        message: `That's about ${months} months of expenses covered — a strong safety net.`,
        icon: "🛡️",
      });
    } else if (months >= 3) {
      insights.push({
        id: "runway-solid",
        type: "runway",
        message: `About ${months} months of expenses covered — you're building a solid buffer.`,
        icon: "🛡️",
      });
    } else if (months >= 1) {
      insights.push({
        id: "runway-building",
        type: "runway",
        message: `About ${months} month${months > 1 ? "s" : ""} of expenses covered — every bit of savings strengthens your safety net.`,
        icon: "🛡️",
      });
    }
  }

  // Surplus insight
  if (surplus > 0) {
    const formatted = formatCurrency(surplus);
    insights.push({
      id: "surplus-positive",
      type: "surplus",
      message: `You're spending less than you earn each month — that ${formatted} surplus is building your future.`,
      icon: "📈",
    });
  } else if (surplus === 0 && monthlyIncome > 0) {
    insights.push({
      id: "surplus-balanced",
      type: "surplus",
      message: "You're breaking even each month — small adjustments could start building surplus.",
      icon: "📈",
    });
  }

  // Savings rate insight
  if (savingsRate >= 20) {
    insights.push({
      id: "savings-rate-great",
      type: "savings-rate",
      message: `You're saving ${Math.round(savingsRate)}% of your income — that's excellent financial discipline.`,
      icon: "⭐",
    });
  } else if (savingsRate >= 10) {
    insights.push({
      id: "savings-rate-good",
      type: "savings-rate",
      message: `You're saving ${Math.round(savingsRate)}% of your income — that's a healthy habit that adds up over time.`,
      icon: "⭐",
    });
  }

  // Goal insights — pick the closest-to-completion goal
  const activeGoals = goals.filter((g) => g.target > 0);
  if (activeGoals.length > 0) {
    // Sort by completion percentage descending
    const sorted = [...activeGoals].sort(
      (a, b) => b.current / b.target - a.current / a.target
    );
    const top = sorted[0];
    const pct = Math.round((top.current / top.target) * 100);

    if (pct >= 100) {
      insights.push({
        id: "goal-reached",
        type: "goal",
        message: `Congratulations — you've reached your "${top.name}" goal! Time to celebrate and set your sights on what's next.`,
        icon: "🎯",
      });
    } else if (pct >= 50) {
      insights.push({
        id: "goal-halfway",
        type: "goal",
        message: `Your savings are growing nicely — you're ${pct}% of the way to your "${top.name}" goal.`,
        icon: "🎯",
      });
    } else if (pct > 0) {
      insights.push({
        id: "goal-started",
        type: "goal",
        message: `You've started saving toward "${top.name}" — every contribution gets you closer to your ${formatCurrency(top.target)} target.`,
        icon: "🎯",
      });
    }
  }

  // High-interest debt insight — prioritize paying off highest-rate debt first
  if (data.debts && data.debts.length > 0) {
    const debtsWithInterest = data.debts.filter((d) => d.interestRate !== undefined && d.interestRate > 0 && d.amount > 0);
    if (debtsWithInterest.length > 0) {
      const sorted = [...debtsWithInterest].sort((a, b) => (b.interestRate ?? 0) - (a.interestRate ?? 0));
      const highest = sorted[0];
      if (highest.interestRate! >= 15) {
        insights.push({
          id: "debt-high-interest",
          type: "debt-interest",
          message: `Your ${highest.category} has a ${highest.interestRate}% interest rate — paying this down first could save you the most in interest costs.`,
          icon: "🔥",
        });
      } else if (debtsWithInterest.length >= 2) {
        insights.push({
          id: "debt-priority",
          type: "debt-interest",
          message: `Focus extra payments on your ${highest.category} (${highest.interestRate}% APR) first — the avalanche method saves the most on interest.`,
          icon: "🔥",
        });
      }
    }
  }

  // Net worth insight
  if (netWorth > 0) {
    insights.push({
      id: "networth-positive",
      type: "net-worth",
      message: `Your net worth is positive at ${formatCurrency(netWorth)} — your assets outweigh your debts.`,
      icon: "💰",
    });
  } else if (netWorth < 0 && totalAssets > 0) {
    insights.push({
      id: "networth-growing",
      type: "net-worth",
      message: "Your debts currently exceed your assets — this is common with mortgages and loans. Every payment brings you closer to positive net worth.",
      icon: "💰",
    });
  }

  return insights;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}
