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
  /** Monthly mortgage payments. Included in runway obligations alongside expenses. */
  monthlyMortgagePayments?: number;
  /** Individual debt details for interest-based insights */
  debts?: DebtDetail[];
  /** Effective tax rate (0-1) for tax insights */
  effectiveTaxRate?: number;
  /** Estimated annual tax amount */
  annualTax?: number;
  /** Whether any income is capital gains type */
  hasCapitalGains?: boolean;
}

export type InsightType = "runway" | "surplus" | "net-worth" | "savings-rate" | "debt-interest" | "tax";

export interface Insight {
  id: string;
  type: InsightType;
  message: string;
  icon: string;
}

export function generateInsights(data: FinancialData): Insight[] {
  const insights: Insight[] = [];
  const { totalAssets, totalDebts, monthlyIncome, monthlyExpenses } = data;

  const netWorth = totalAssets - totalDebts;
  const surplus = monthlyIncome - monthlyExpenses;
  // Use liquid assets for runway if available, otherwise fall back to totalAssets
  // Use raw expenses (not including investment contributions) to match the metric card
  const runwayAssets = data.liquidAssets ?? totalAssets;
  const rawExpenses = data.rawMonthlyExpenses ?? monthlyExpenses;
  const monthlyObligations = rawExpenses + (data.monthlyMortgagePayments ?? 0);
  const runway = monthlyObligations > 0 ? runwayAssets / monthlyObligations : 0;
  // Savings rate: after-tax income minus expenses and mortgage payments, divided by after-tax income
  // Mortgage payments are excluded from savings since they include interest costs
  const mortgagePayments = data.monthlyMortgagePayments ?? 0;
  const totalSavings = monthlyIncome - rawExpenses - mortgagePayments;
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
    // Annual projection — wealth growth includes surplus + contributions + mortgage equity
    // (contributions move money into assets, mortgage payments reduce debt = both grow net worth)
    const annualWealthGrowth = (monthlyIncome - rawExpenses) * 12;
    insights.push({
      id: "surplus-annual",
      type: "surplus",
      message: `At this pace, you'll add ${formatCurrency(annualWealthGrowth)} to your wealth this year.`,
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
  if (savingsRate >= 50) {
    insights.push({
      id: "savings-rate-great",
      type: "savings-rate",
      message: `You're saving ${Math.round(savingsRate)}% of your income — you're on a fast track to financial independence.`,
      icon: "⭐",
    });
  } else if (savingsRate >= 20) {
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

  // Debt insights
  const debtRatio = totalAssets > 0 ? totalDebts / totalAssets : 0;
  if (data.debts && data.debts.length > 0) {
    const debtsWithInterest = data.debts.filter((d) => d.interestRate !== undefined && d.interestRate > 0 && d.amount > 0);
    const totalDebtBalance = data.debts.reduce((sum, d) => sum + d.amount, 0);

    if (totalDebtBalance <= 0) {
      insights.push({
        id: "debt-free",
        type: "debt-interest",
        message: "You're debt-free! Every dollar you earn goes straight to building wealth.",
        icon: "🎉",
      });
    } else if (debtRatio < 0.25 && totalAssets > 0) {
      insights.push({
        id: "debt-ratio-excellent",
        type: "debt-interest",
        message: `Your debts are less than 25% of your assets — that's a very strong financial position.`,
        icon: "⚖️",
      });
    } else if (debtRatio < 0.5 && totalAssets > 0) {
      insights.push({
        id: "debt-ratio-good",
        type: "debt-interest",
        message: `You own more than twice what you owe — your assets are working in your favor.`,
        icon: "⚖️",
      });
    }

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
  } else if (totalDebts <= 0) {
    insights.push({
      id: "debt-free",
      type: "debt-interest",
      message: "You're debt-free! Every dollar you earn goes straight to building wealth.",
      icon: "🎉",
    });
  }

  // Tax insights
  if (data.effectiveTaxRate !== undefined && data.effectiveTaxRate > 0) {
    const ratePercent = (data.effectiveTaxRate * 100).toFixed(1);
    if (data.hasCapitalGains) {
      insights.push({
        id: "tax-capital-gains",
        type: "tax",
        message: `Your effective tax rate is ${ratePercent}% — capital gains income is taxed at a lower rate than employment income.`,
        icon: "🏛️",
      });
    } else if (data.effectiveTaxRate > 0.3) {
      insights.push({
        id: "tax-rate-high",
        type: "tax",
        message: `Your effective tax rate is ${ratePercent}% — tax-advantaged accounts (TFSA, RRSP, 401k) can help reduce your tax burden.`,
        icon: "🏛️",
      });
    } else if (data.annualTax && data.annualTax > 0) {
      insights.push({
        id: "tax-rate-info",
        type: "tax",
        message: `Your effective tax rate is ${ratePercent}% — that's ${formatCurrency(data.annualTax)} annually in estimated taxes.`,
        icon: "🏛️",
      });
    }
  }

  // Net worth insight
  if (netWorth >= 1_000_000) {
    insights.push({
      id: "networth-positive",
      type: "net-worth",
      message: `Your net worth is ${formatCompact(netWorth)} — you've reached a major milestone. Compound growth is your biggest advantage now.`,
      icon: "💰",
    });
  } else if (netWorth > 0) {
    insights.push({
      id: "networth-positive",
      type: "net-worth",
      message: `Your net worth is ${formatCurrency(netWorth)} — positive and growing.`,
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

  // Income efficiency insight
  if (monthlyIncome > 0 && rawExpenses > 0) {
    const wealthBuildingRate = ((monthlyIncome - rawExpenses) / monthlyIncome) * 100;
    if (wealthBuildingRate >= 40) {
      insights.push({
        id: "income-efficiency",
        type: "surplus",
        message: `${Math.round(wealthBuildingRate)} cents of every dollar you earn goes toward building wealth — that's outstanding.`,
        icon: "💪",
      });
    }
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

function formatCompact(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(amount / 1_000).toFixed(0)}k`;
  return formatCurrency(amount);
}
