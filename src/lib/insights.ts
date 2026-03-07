import { compareDebtStrategies, formatDuration } from "@/lib/debt-payoff";

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
  /** Home currency code (e.g., "CAD", "USD") for formatting */
  homeCurrency?: string;
  /** Total annual employer match across all eligible accounts */
  employerMatchAnnual?: number;
  /** FIRE number: portfolio size needed for financial independence (annual expenses / 4% SWR) */
  fireNumber?: number;
  /** Years until net worth reaches FIRE number (null = already reached, undefined = not enough data) */
  yearsToFire?: number | null;
  /** Marginal tax rate (0-1) for tax optimization suggestions */
  marginalRate?: number;
  /** Country code for country-specific account name suggestions */
  country?: "CA" | "US";
  /** Annual employment income for RRSP/401k contribution suggestions */
  annualEmploymentIncome?: number;
  /** Income replacement ratio: % of monthly income sustainable by portfolio via 4% rule */
  incomeReplacementRatio?: number;
  /** Total monthly debt payments (minimum payments + mortgage). Used for DTI ratio. */
  monthlyDebtPayments?: number;
  /** Gross monthly income before tax. Used for DTI ratio calculation. */
  monthlyGrossIncome?: number;
  /** Monthly housing cost (mortgage payment or rent). Used for housing cost ratio. */
  monthlyHousingCost?: number;
  /** Withdrawal tax impact data */
  withdrawalTax?: {
    /** How many months shorter the runway is due to withdrawal taxes */
    taxDragMonths: number;
    /** Optimal withdrawal order for this account mix */
    withdrawalOrder: string[];
    /** Account balances grouped by tax treatment */
    accountsByTreatment: {
      taxFree: { categories: string[]; total: number };
      taxDeferred: { categories: string[]; total: number };
      taxable: { categories: string[]; total: number };
    };
  };
}

export type InsightType = "runway" | "surplus" | "net-worth" | "savings-rate" | "debt-interest" | "tax" | "withdrawal-tax" | "employer-match" | "debt-strategy" | "fire" | "tax-optimization" | "income-replacement" | "debt-to-income" | "housing-cost";

export interface Insight {
  id: string;
  type: InsightType;
  message: string;
  icon: string;
}

export function generateInsights(data: FinancialData): Insight[] {
  _insightCurrency = data.homeCurrency ?? "USD";
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
    // Annual projection — wealth growth is surplus + investment contributions
    // Mortgage payments are excluded since they include interest costs
    const annualWealthGrowth = (monthlyIncome - rawExpenses - mortgagePayments) * 12;
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

  // Withdrawal tax insights
  if (data.withdrawalTax) {
    const wt = data.withdrawalTax;
    const totalLiquid = wt.accountsByTreatment.taxFree.total + wt.accountsByTreatment.taxDeferred.total + wt.accountsByTreatment.taxable.total;

    // Tax-free holdings insight
    if (wt.accountsByTreatment.taxFree.total > 0 && totalLiquid > 0) {
      const pct = Math.round((wt.accountsByTreatment.taxFree.total / totalLiquid) * 100);
      insights.push({
        id: "withdrawal-tax-free",
        type: "withdrawal-tax",
        message: `Your ${wt.accountsByTreatment.taxFree.categories.join(" & ")} hold${wt.accountsByTreatment.taxFree.categories.length === 1 ? "s" : ""} ${pct}% of your savings — that's ${formatCurrency(wt.accountsByTreatment.taxFree.total)} you can withdraw tax-free.`,
        icon: "🛡️",
      });
    }

    // Tax-deferred warning / suggestion
    if (wt.accountsByTreatment.taxDeferred.total > 0 && totalLiquid > 0) {
      const pct = Math.round((wt.accountsByTreatment.taxDeferred.total / totalLiquid) * 100);
      if (pct >= 50 && wt.accountsByTreatment.taxFree.total > 0) {
        insights.push({
          id: "withdrawal-tax-deferred-heavy",
          type: "withdrawal-tax",
          message: `Consider maximizing your ${wt.accountsByTreatment.taxFree.categories.join("/")} contributions — withdrawals from your ${wt.accountsByTreatment.taxDeferred.categories.join("/")} will be taxed as income.`,
          icon: "💡",
        });
      } else if (wt.accountsByTreatment.taxFree.total === 0) {
        insights.push({
          id: "withdrawal-tax-no-free",
          type: "withdrawal-tax",
          message: `Consider opening a tax-free account (TFSA or Roth IRA) — all your current savings will be taxed on withdrawal.`,
          icon: "💡",
        });
      }
    }

    // Tax drag on runway
    if (wt.taxDragMonths > 0.5) {
      insights.push({
        id: "withdrawal-tax-drag",
        type: "withdrawal-tax",
        message: `Withdrawal taxes reduce your financial runway by about ${wt.taxDragMonths.toFixed(1)} months — tax-free accounts can help reduce this impact.`,
        icon: "📉",
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

  // Income efficiency insight (excludes mortgage payments from wealth building)
  if (monthlyIncome > 0 && rawExpenses > 0) {
    const wealthBuildingRate = ((monthlyIncome - rawExpenses - mortgagePayments) / monthlyIncome) * 100;
    if (wealthBuildingRate >= 40) {
      insights.push({
        id: "income-efficiency",
        type: "surplus",
        message: `${Math.round(wealthBuildingRate)} cents of every dollar you earn goes toward building wealth — that's outstanding.`,
        icon: "💪",
      });
    }
  }

  // Employer match insight
  if (data.employerMatchAnnual && data.employerMatchAnnual > 0) {
    insights.push({
      id: "employer-match",
      type: "employer-match",
      message: `Your employer match adds ${formatCurrency(data.employerMatchAnnual)}/year in free money — make sure you're contributing enough to get the full match.`,
      icon: "🎁",
    });
  }

  // Debt payoff strategy comparison — shown when user has 2+ debts with interest & payments
  if (data.debts && data.debts.length >= 2) {
    const debtsForStrategy = data.debts
      .filter((d) => d.amount > 0 && d.monthlyPayment !== undefined && d.interestRate !== undefined)
      .map((d) => ({
        category: d.category,
        balance: d.amount,
        annualRate: d.interestRate!,
        monthlyPayment: d.monthlyPayment!,
      }));

    const comparison = compareDebtStrategies(debtsForStrategy);
    if (comparison) {
      // Determine the best strategy
      const avalancheBetter = comparison.avalancheInterestSavings >= comparison.snowballInterestSavings;
      const bestSavings = avalancheBetter ? comparison.avalancheInterestSavings : comparison.snowballInterestSavings;
      const bestMonths = avalancheBetter ? comparison.avalancheMonthsSaved : comparison.snowballMonthsSaved;
      const bestName = avalancheBetter ? "avalanche" : "snowball";
      const bestDescription = avalancheBetter ? "highest-rate debt first" : "smallest balance first";

      if (bestSavings > 0 || bestMonths > 0) {
        const savingsPart = bestSavings > 0 ? `saves ${formatCurrency(bestSavings)} in interest` : "";
        const monthsPart = bestMonths > 0 ? `pays off ${bestMonths} month${bestMonths !== 1 ? "s" : ""} sooner` : "";
        const combined = [savingsPart, monthsPart].filter(Boolean).join(" and ");

        insights.push({
          id: "debt-strategy-best",
          type: "debt-strategy",
          message: `Switching to the ${bestName} method (${bestDescription}) ${combined} compared to your current plan.`,
          icon: "📊",
        });
      }

      // Show the current payoff duration as encouragement
      if (isFinite(comparison.current.totalMonths) && comparison.current.totalMonths > 0) {
        const currentDuration = formatDuration(comparison.current.totalMonths);
        insights.push({
          id: "debt-strategy-timeline",
          type: "debt-strategy",
          message: `At current payments, you'll be debt-free in ${currentDuration}. Paying off high-interest debts first can accelerate that timeline.`,
          icon: "🗓️",
        });
      }
    }
  }

  // Tax optimization insights — show when there's a meaningful tax saving opportunity (> $100/year)
  if (data.marginalRate && data.marginalRate > 0 && data.withdrawalTax) {
    const wt = data.withdrawalTax;
    const taxableTotal = wt.accountsByTreatment.taxable.total;
    const taxFreeTotal = wt.accountsByTreatment.taxFree.total;
    const taxDeferredTotal = wt.accountsByTreatment.taxDeferred.total;
    const marginalRate = data.marginalRate;
    const country = data.country ?? "CA";
    const taxFreeAccountName = country === "CA" ? "TFSA" : "Roth IRA";
    const taxDeferredAccountName = country === "CA" ? "RRSP" : "401(k)";

    // Suggestion 1: Taxable brokerage → tax-free account
    // Annual tax cost on growth = taxable balance × assumed 5% growth × marginalRate
    if (taxableTotal > 0) {
      const annualTaxCost = taxableTotal * 0.05 * marginalRate;
      if (annualTaxCost >= 100) {
        const marginalPct = Math.round(marginalRate * 100);
        insights.push({
          id: "tax-opt-taxable-to-free",
          type: "tax-optimization",
          message: `You have ${formatCurrency(taxableTotal)} in taxable accounts with gains taxed at your ${marginalPct}% marginal rate. Shifting contributions to your ${taxFreeAccountName} would shelter ~${formatCurrency(Math.round(annualTaxCost))}/year in gains from tax.`,
          icon: "💡",
        });
      }
    }

    // Suggestion 2: RRSP/401(k) contribution deduction
    // Reference: each $10,000 contributed saves marginalRate × $10,000 in tax
    if (data.annualEmploymentIncome && data.annualEmploymentIncome > 0 && marginalRate >= 0.25) {
      const referenceContribution = 10_000;
      const taxSavings = referenceContribution * marginalRate;
      insights.push({
        id: "tax-opt-deferred-contribution",
        type: "tax-optimization",
        message: `Based on your income of ${formatCurrency(data.annualEmploymentIncome)}/year, each $10,000 contributed to your ${taxDeferredAccountName} reduces your tax bill by ~${formatCurrency(Math.round(taxSavings))}. Check your available contribution room.`,
        icon: "💡",
      });
    }

    // Suggestion 3: Tax-free room — redirect savings from taxable to tax-free
    // Show when taxable savings exceed tax-free savings and there's meaningful taxable exposure
    if (taxableTotal > taxFreeTotal && taxableTotal > 1000 && taxDeferredTotal === 0 && !insights.find((i) => i.id === "tax-opt-taxable-to-free")) {
      insights.push({
        id: "tax-opt-use-tax-free-room",
        type: "tax-optimization",
        message: `Your ${taxFreeAccountName} has room — contributing there instead of a taxable savings account shelters future growth from tax at no extra cost.`,
        icon: "💡",
      });
    }
  }

  // Income replacement ratio insight
  if (data.incomeReplacementRatio !== undefined && data.monthlyIncome > 0) {
    const pct = data.incomeReplacementRatio;
    let message: string;
    if (pct >= 100) {
      message = `Your investments could sustain ${Math.round(pct)}% of your income using the 4% rule — you've reached financial independence!`;
    } else if (pct >= 75) {
      message = `Your portfolio covers ${Math.round(pct)}% of your income using the 4% rule — you're nearly financially independent!`;
    } else if (pct >= 50) {
      message = `Your investments replace ${Math.round(pct)}% of your income using the 4% rule — you're in a strong financial position.`;
    } else if (pct >= 25) {
      message = `Your portfolio replaces ${Math.round(pct)}% of your income using the 4% rule — you're building real momentum toward financial independence.`;
    } else if (pct > 0) {
      message = `Your investments currently replace ${Math.round(pct)}% of your income using the 4% rule — every contribution brings you closer to financial independence.`;
    } else {
      message = `Start investing to build your income replacement ratio — the goal is for your portfolio to sustainably cover your living expenses.`;
    }
    insights.push({
      id: "income-replacement",
      type: "income-replacement",
      message,
      icon: "🎯",
    });
  }

  // Debt-to-income (DTI) ratio insight
  if (data.monthlyDebtPayments !== undefined && data.monthlyGrossIncome && data.monthlyGrossIncome > 0) {
    const dtiPct = (data.monthlyDebtPayments / data.monthlyGrossIncome) * 100;
    const dtiFormatted = dtiPct.toFixed(1);
    let message: string;
    if (dtiPct < 20) {
      message = `Your debt-to-income ratio is ${dtiFormatted}% — excellent. Lenders see you as low risk, which means better interest rates on mortgages, car loans, and credit cards.`;
    } else if (dtiPct < 36) {
      message = `Your debt-to-income ratio is ${dtiFormatted}% — good. You qualify for most loans and mortgages. Lenders use DTI to decide how much credit to extend and at what rate.`;
    } else if (dtiPct < 44) {
      message = `Your debt-to-income ratio is ${dtiFormatted}% — moderate. This is near the upper limit for most mortgage approvals (43%). Reducing monthly debt payments will improve your borrowing options.`;
    } else {
      message = `Your debt-to-income ratio is ${dtiFormatted}% — high. Lenders may decline new credit above 43–50% DTI. Paying down high-interest debts first will lower this ratio and open up better financial options.`;
    }
    insights.push({
      id: "debt-to-income",
      type: "debt-to-income",
      message,
      icon: "📊",
    });
  }

  // Housing cost ratio insight (30% rule)
  if (data.monthlyHousingCost !== undefined && data.monthlyHousingCost > 0 && data.monthlyGrossIncome && data.monthlyGrossIncome > 0) {
    const housingPct = (data.monthlyHousingCost / data.monthlyGrossIncome) * 100;
    const housingFormatted = housingPct.toFixed(1);
    let message: string;
    if (housingPct < 25) {
      message = `Your housing costs are ${housingFormatted}% of gross income — well within budget. The classic guideline is 30%, so you have plenty of room left over for savings, investments, and unexpected expenses.`;
    } else if (housingPct < 31) {
      message = `Your housing costs are ${housingFormatted}% of gross income — right at the sweet spot. Financial planners recommend keeping housing at or below 30% of gross income so there's room for savings, retirement contributions, and life's surprises.`;
    } else if (housingPct < 41) {
      message = `Your housing costs are ${housingFormatted}% of gross income — above the 30% guideline. This is common in expensive cities, but it does compress room for savings and emergencies. Look for ways to increase income or reduce housing costs when the opportunity arises.`;
    } else {
      message = `Your housing costs are ${housingFormatted}% of gross income — HUD defines 40%+ as cost-burdened. At this level, saving for retirement or emergencies is difficult. Reducing housing costs or boosting income should be a priority when possible.`;
    }
    insights.push({
      id: "housing-cost",
      type: "housing-cost",
      message,
      icon: "🏠",
    });
  }

  // FIRE (Financial Independence, Retire Early) insight
  if (data.fireNumber && data.fireNumber > 0) {
    const currentNetWorth = data.totalAssets - data.totalDebts;
    const fireNumber = data.fireNumber;
    if (currentNetWorth >= fireNumber) {
      insights.push({
        id: "fire-achieved",
        type: "fire",
        message: `🎉 You've reached financial independence! Your net worth of ${formatCurrency(currentNetWorth)} covers your annual expenses using the 4% rule. FIRE number: ${formatCurrency(fireNumber)}.`,
        icon: "🔥",
      });
    } else {
      const progressPct = currentNetWorth > 0 ? Math.min(99, Math.round((currentNetWorth / fireNumber) * 100)) : 0;
      const yearsText = data.yearsToFire != null
        ? ` At your current savings rate, you'll reach it in ~${data.yearsToFire.toFixed(1)} years.`
        : "";
      insights.push({
        id: "fire-progress",
        type: "fire",
        message: `You need ${formatCurrency(fireNumber)} to be financially independent (4% rule). You're ${progressPct}% there.${yearsText}`,
        icon: "🔥",
      });
    }
  }

  return insights;
}

// Module-level currency code, set per generateInsights call
let _insightCurrency = "USD";

function formatCurrency(amount: number): string {
  const abs = Math.abs(amount);
  return "$" + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(abs);
}

function formatCompact(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(abs / 1_000).toFixed(0)}k`;
  return formatCurrency(amount);
}
