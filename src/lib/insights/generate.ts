import { compareDebtStrategies, formatDuration } from "@/lib/debt-payoff";
import { computeCoastFireAge } from "@/lib/financial-state";
import {
  checkIncomeEligibility,
  findCreditCategory,
  ALL_CREDIT_CATEGORIES,
} from "@/lib/tax-credits";
import type { FinancialData, Insight } from "./types";
import { setInsightCurrency, formatCurrency, formatCompact, _filingStatusLabel } from "./formatting";
import { getNetWorthMilestone, getAgeGroup } from "./net-worth";

/**
 * Build a context-aware message for the "tax rate is high" insight.
 * Checks which tax-advantaged accounts the user already has and suggests
 * what's missing or encourages maximizing existing ones.
 */
function buildTaxRateHighMessage(ratePercent: string, country: "CA" | "US" | "AU", assetCategories: string[]): string {
  const cats = assetCategories.map((c) => c.toLowerCase());
  const prefix = `Your effective tax rate is ${ratePercent}% —`;

  if (country === "CA") {
    const hasTFSA = cats.some((c) => c.includes("tfsa") || c.includes("fhsa"));
    const hasRRSP = cats.some((c) => c.includes("rrsp") || c.includes("lira"));
    if (hasTFSA && hasRRSP) {
      return `${prefix} you're already using both a TFSA and RRSP. Maximizing contributions to both will continue to shelter your growth and income from tax.`;
    } else if (hasTFSA) {
      return `${prefix} you're already using a TFSA. Adding an RRSP can also reduce your taxable income and lower your tax bill.`;
    } else if (hasRRSP) {
      return `${prefix} you're already using an RRSP. Adding a TFSA would provide tax-free growth for funds you may need before retirement.`;
    }
    return `${prefix} tax-advantaged accounts (TFSA, RRSP) can help reduce your tax burden.`;
  } else if (country === "AU") {
    const hasSuper = cats.some((c) => c.includes("super") || c.includes("pension phase") || c.includes("fhss") || c.includes("first home super"));
    if (hasSuper) {
      return `${prefix} salary sacrificing additional amounts into super can reduce your taxable income. Concessional contributions (up to $30,000/yr cap) are taxed at just 15% inside the fund — well below most marginal rates.`;
    }
    return `${prefix} super contributions (up to the $30,000/yr concessional cap) are taxed at just 15% inside the fund. Consider topping up your super through salary sacrifice to reduce your taxable income.`;
  } else {
    const has401k = cats.some((c) => c.includes("401k"));
    const hasRoth = cats.some((c) => c.includes("roth"));
    const hasIRA = cats.some((c) => c.includes("ira") && !c.includes("roth"));
    if (has401k && (hasRoth || hasIRA)) {
      return `${prefix} you're already using tax-advantaged accounts. Maximizing your 401(k) and IRA contributions will further reduce your tax burden.`;
    } else if (has401k) {
      return `${prefix} you're already using a 401(k). Adding a Roth IRA could provide additional tax-free growth.`;
    } else if (hasRoth || hasIRA) {
      const name = hasRoth ? "Roth IRA" : "IRA";
      return `${prefix} you're already using a ${name}. If your employer offers a 401(k) match, capturing it first could add free money on top.`;
    }
    return `${prefix} tax-advantaged accounts (401(k), Roth IRA) can help reduce your tax burden.`;
  }
}

export function generateInsights(data: FinancialData): Insight[] {
  setInsightCurrency(data.homeCurrency ?? "USD");
  const insights: Insight[] = [];
  const { totalAssets, totalDebts, monthlyIncome, monthlyExpenses } = data;

  const netWorth = totalAssets - totalDebts;
  const investmentReturns = data.monthlyInvestmentReturns ?? 0;
  const surplus = monthlyIncome + investmentReturns - monthlyExpenses;
  const outlookYears = data.outlookYears ?? 10;
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
    // Outlook projection — wealth growth is surplus + investment contributions, scaled to outlook period
    // Mortgage payments are excluded since they include interest costs
    const annualWealthGrowth = (monthlyIncome + investmentReturns - rawExpenses - mortgagePayments) * 12;
    const outlookGrowth = annualWealthGrowth * outlookYears;
    insights.push({
      id: "surplus-annual",
      type: "surplus",
      message: outlookYears === 1
        ? `At this pace, you'll add ${formatCurrency(annualWealthGrowth)} to your wealth this year.`
        : `At this pace, you'll add ${formatCompact(outlookGrowth)} over ${outlookYears} years (${formatCurrency(annualWealthGrowth)}/yr).`,
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
      const taxRateMsg = buildTaxRateHighMessage(ratePercent, data.country ?? "CA", data.assetCategories ?? []);
      insights.push({
        id: "tax-rate-high",
        type: "tax",
        message: taxRateMsg,
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
        const wtCountry = data.country ?? "CA";
        const wtMessage = wtCountry === "AU"
          ? `All your current savings will be taxed on withdrawal. Contributing to super means fund earnings are taxed at just 15%, and withdrawals after 60 (pension phase) are completely tax-free.`
          : `Consider opening a ${wtCountry === "CA" ? "TFSA" : "Roth IRA"} — all your current savings will be taxed on withdrawal.`;
        insights.push({
          id: "withdrawal-tax-no-free",
          type: "withdrawal-tax",
          message: wtMessage,
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

  // Net worth insight — with outlook projection
  // Simple projection: grow current net worth + annual surplus, assuming ~5% real return on assets
  const annualSurplus = surplus > 0 ? surplus * 12 : 0;
  const projectedNetWorth = netWorth > 0
    ? (() => {
        let projected = netWorth;
        for (let y = 0; y < outlookYears; y++) {
          projected = projected * 1.05 + annualSurplus;
        }
        return projected;
      })()
    : netWorth + annualSurplus * outlookYears;
  const projectionNote = surplus > 0 && netWorth > 0
    ? ` On track for ~${formatCompact(projectedNetWorth)} in ${outlookYears} years.`
    : "";

  if (netWorth >= 1_000_000) {
    insights.push({
      id: "networth-positive",
      type: "net-worth",
      message: `Your net worth is ${formatCompact(netWorth)} — you've reached a major milestone.${projectionNote}`,
      icon: "💰",
    });
  } else if (netWorth > 0) {
    insights.push({
      id: "networth-positive",
      type: "net-worth",
      message: `Your net worth is ${formatCurrency(netWorth)} — positive and growing.${projectionNote}`,
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
      message: `Your employer match adds ${formatCurrency(data.employerMatchAnnual)}/yr in free money — that's ${formatCompact(data.employerMatchAnnual * outlookYears)} over ${outlookYears} years. Make sure you're contributing enough to get the full match.`,
      icon: "🎁",
    });
  }

  // AU-specific insights: super guarantee, HECS-HELP, FHSS, franking credits, MLS
  if ((data.country ?? "CA") === "AU") {
    const auAssetCats = (data.assetCategories ?? []).map((c) => c.toLowerCase());
    const auDebtCats = (data.debtCategories ?? []).map((c) => c.toLowerCase());
    const auAnnualIncome = (data.monthlyGrossIncome ?? 0) * 12;
    const auEmploymentIncome = data.annualEmploymentIncome ?? 0;

    // Super guarantee check — 11.5% of salary (2024-25 rate)
    if (auEmploymentIncome > 0) {
      const hasSuperAcct = auAssetCats.some((c) => c.includes("super") || c.includes("pension phase") || c.includes("fhss"));
      const expectedGuarantee = auEmploymentIncome * 0.115;
      const employerContrib = data.employerMatchAnnual ?? 0;
      if (!hasSuperAcct) {
        insights.push({
          id: "au-super-missing",
          type: "au-super",
          message: `Your employer must contribute 11.5% of your salary (${formatCurrency(expectedGuarantee)}/yr) to your super as the Super Guarantee. Make sure you've nominated a fund — and add your super account to track your balance.`,
          icon: "🦘",
        });
      } else if (employerContrib > 0 && employerContrib < expectedGuarantee * 0.9) {
        insights.push({
          id: "au-super-guarantee",
          type: "au-super",
          message: `Your employer should be contributing ${formatCurrency(expectedGuarantee)}/yr (11.5% Super Guarantee) to your super. Check your latest super statement to confirm the full amount is being paid.`,
          icon: "🦘",
        });
      }
    }

    // HECS-HELP compulsory repayment threshold (2025-26: $54,435)
    const hasHECS = auDebtCats.some((c) => c.includes("hecs") || c.includes("help"));
    if (hasHECS && auEmploymentIncome >= 54_435) {
      insights.push({
        id: "au-hecs-repayment",
        type: "au-hecs-help",
        message: `Your HECS-HELP repayments are automatically deducted via PAYG at your income level. Unlike regular interest, HECS-HELP is indexed to CPI — voluntary early repayments don't save you interest, they just reduce the balance before the annual indexation date (June 1). Check your MyGov account for your current balance.`,
        icon: "🎓",
      });
    }

    // FHSS eligibility — user is not a homeowner, has income, no FHSS account
    if (!data.isHomeowner && auEmploymentIncome > 0) {
      const hasFHSS = auAssetCats.some((c) => c.includes("fhss") || c.includes("first home super"));
      if (!hasFHSS) {
        insights.push({
          id: "au-fhss",
          type: "au-fhss",
          message: `Saving for your first home? The First Home Super Saver (FHSS) scheme lets you voluntarily contribute up to $15,000/yr ($50,000 lifetime cap) into super at a 15% tax rate, then withdraw it for a deposit — a great deal if your marginal rate is above 15%.`,
          icon: "🏠",
        });
      }
    }

    // Franking credits — user has taxable investments but hasn't claimed franking credits
    const taxableBalance = data.withdrawalTax?.accountsByTreatment.taxable.total ?? 0;
    const hasFrankingClaim = (data.taxCredits ?? []).some((c) => c.category.toLowerCase().includes("franking"));
    if (taxableBalance > 10_000 && !hasFrankingClaim) {
      insights.push({
        id: "au-franking",
        type: "au-franking",
        message: `Australian shares often pay franked dividends — the attached franking credits represent company tax already paid at 30%. You include the grossed-up dividend in your taxable income and claim the credit as an offset. If the credits exceed your tax liability, the ATO refunds the difference. Track these in the Tax Credits section.`,
        icon: "📋",
      });
    }

    // Medicare Levy Surcharge avoidance — income > $93,000, no private health insurance rebate claimed
    const hasPHI = (data.taxCredits ?? []).some((c) => c.category.toLowerCase().includes("private health"));
    if (auAnnualIncome >= 93_000 && !hasPHI) {
      insights.push({
        id: "au-mls",
        type: "au-mls",
        message: `At your income level, you may be liable for the Medicare Levy Surcharge (MLS) of 1–1.5% (up to ${formatCurrency(Math.round(auAnnualIncome * 0.015))}/yr) if you don't hold private hospital cover. Basic hospital cover typically costs less than the surcharge — worth comparing. Add a Private Health Insurance Rebate in Tax Credits if you have cover.`,
        icon: "🏥",
      });
    }
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
    const taxFreeAccountName = country === "CA" ? "TFSA" : country === "AU" ? "Super (Pension Phase)" : "Roth IRA";
    const taxDeferredAccountName = country === "CA" ? "RRSP" : country === "AU" ? "Super (Accumulation)" : "401(k)";

    const assetCatLower = (data.assetCategories ?? []).map((c) => c.toLowerCase());
    const alreadyHasTaxFreeAcct = country === "CA"
      ? assetCatLower.some((c) => c.includes("tfsa") || c.includes("fhsa"))
      : country === "AU"
        ? assetCatLower.some((c) => c.includes("pension phase") || c.includes("fhss") || c.includes("first home super"))
        : assetCatLower.some((c) => c.includes("roth") || c.includes("hsa"));
    const alreadyHasTaxDeferredAcct = country === "CA"
      ? assetCatLower.some((c) => c.includes("rrsp") || c.includes("lira"))
      : country === "AU"
        ? assetCatLower.some((c) => c.includes("super") && c.includes("accumulation"))
        : assetCatLower.some((c) => c.includes("401k") || (c.includes("ira") && !c.includes("roth")));

    // Suggestion 1: Taxable brokerage → tax-free account
    // Annual tax cost on growth = taxable balance × assumed 5% growth × marginalRate
    if (taxableTotal > 0) {
      const annualTaxCost = taxableTotal * 0.05 * marginalRate;
      if (annualTaxCost >= 100) {
        const marginalPct = Math.round(marginalRate * 100);
        const actionPhrase = alreadyHasTaxFreeAcct
          ? `Maximizing your ${taxFreeAccountName} contributions`
          : `Shifting contributions to a ${taxFreeAccountName}`;
        insights.push({
          id: "tax-opt-taxable-to-free",
          type: "tax-optimization",
          message: `You have ${formatCurrency(taxableTotal)} in taxable accounts with gains taxed at your ${marginalPct}% marginal rate. ${actionPhrase} would shelter ~${formatCurrency(Math.round(annualTaxCost))}/yr in gains from tax — that's ${formatCompact(annualTaxCost * outlookYears)} over ${outlookYears} years.`,
          icon: "💡",
        });
      }
    }

    // Suggestion 2: RRSP/401(k)/super salary sacrifice contribution deduction
    // Skip if user has no taxable accounts — nothing to redirect into a tax-deferred vehicle
    // AU: salary sacrifice taxed at 15% in fund vs marginal rate = net saving of (marginalRate - 0.15) per dollar
    if (taxableTotal > 0 && data.annualEmploymentIncome && data.annualEmploymentIncome > 0 && marginalRate >= 0.25) {
      const referenceContribution = 10_000;
      let deductionInsightMessage: string;
      if (country === "AU") {
        const netSaving = referenceContribution * (marginalRate - 0.15);
        const actionPhrase = alreadyHasTaxDeferredAcct
          ? `salary sacrificing additional amounts into super`
          : `salary sacrificing into super`;
        deductionInsightMessage = `Each $10,000 from ${actionPhrase} is taxed at 15% inside the fund instead of your ${Math.round(marginalRate * 100)}% marginal rate — a net saving of ~${formatCurrency(Math.round(netSaving))} per $10,000. The concessional cap is $30,000/yr (including your employer's Super Guarantee).`;
      } else {
        const taxSavings = referenceContribution * marginalRate;
        const actionPhrase = alreadyHasTaxDeferredAcct
          ? `increasing your ${taxDeferredAccountName} contributions`
          : `contributing to a ${taxDeferredAccountName}`;
        deductionInsightMessage = `Based on your income of ${formatCurrency(data.annualEmploymentIncome)}/year, each $10,000 from ${actionPhrase} reduces your tax bill by ~${formatCurrency(Math.round(taxSavings))}. Check your available contribution room.`;
      }
      insights.push({
        id: "tax-opt-deferred-contribution",
        type: "tax-optimization",
        message: deductionInsightMessage,
        icon: "💡",
      });
    }

    // Suggestion 3: Tax-free room — redirect savings from taxable to tax-free
    // Show when taxable savings exceed tax-free savings and there's meaningful taxable exposure
    if (taxableTotal > taxFreeTotal && taxableTotal > 1000 && taxDeferredTotal === 0 && !insights.find((i) => i.id === "tax-opt-taxable-to-free")) {
      const message = alreadyHasTaxFreeAcct
        ? `Your ${taxFreeAccountName} has room — contributing there instead of a taxable savings account shelters future growth from tax at no extra cost.`
        : `Opening a ${taxFreeAccountName} lets you grow your savings tax-free instead of paying tax on gains in your taxable accounts.`;
      insights.push({
        id: "tax-opt-use-tax-free-room",
        type: "tax-optimization",
        message,
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

  // Coast FIRE insight
  if (data.currentAge && data.liquidAssets && data.rawMonthlyExpenses && data.rawMonthlyExpenses > 0) {
    const annualExpenses = data.rawMonthlyExpenses * 12;
    const targetRetirementAge = data.retirementAge ?? 65;
    const coastAge = computeCoastFireAge(data.currentAge, data.liquidAssets, annualExpenses, targetRetirementAge, 0.05, data.monthlySavings ?? 0);
    if (coastAge !== null) {
      if (coastAge <= data.currentAge) {
        insights.push({
          id: "coast-fire-achieved",
          type: "coast-fire",
          message: `You've hit Coast FIRE! Even if you stopped saving today, your investments would grow to cover retirement by age ${targetRetirementAge}. Coast FIRE means your existing portfolio, compounding at ~5% real return, will reach your FIRE number without additional contributions — a powerful milestone for peace of mind.`,
          icon: "🏖️",
        });
      } else {
        const yearsAway = coastAge - data.currentAge;
        insights.push({
          id: "coast-fire-progress",
          type: "coast-fire",
          message: `If you keep saving until age ${coastAge}, you could stop contributing and still retire at ${targetRetirementAge} — that's ${yearsAway} year${yearsAway !== 1 ? "s" : ""} away. Coast FIRE is the point where your current investments, growing at ~5% real return, will compound to cover your retirement expenses without any more contributions.`,
          icon: "🏖️",
        });
      }
    }
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
        ? ` At your current savings rate, you'll reach it in ~${data.yearsToFire.toFixed(1)} years${data.yearsToFire <= outlookYears ? " (within your outlook)" : ""}.`
        : "";
      insights.push({
        id: "fire-progress",
        type: "fire",
        message: `You need ${formatCurrency(fireNumber)} to be financially independent (4% rule). You're ${progressPct}% there.${yearsText}`,
        icon: "🔥",
      });
    }
  }

  // Net worth milestone insight (only when netWorth > 0 — crossing from negative to positive is a milestone)
  const milestone = netWorth > 0 ? getNetWorthMilestone(netWorth) : null;
  if (milestone) {
    insights.push({
      id: `net-worth-milestone-${milestone.amount}`,
      type: "net-worth-milestone",
      message: milestone.message,
      icon: "🏆",
    });
  }

  // Tax credit insights — only when user has entered credits
  if (data.taxCredits && data.taxCredits.length > 0) {
    const country = data.country ?? "CA";
    const filingStatus = data.filingStatus ?? "single";
    const annualGrossIncome = (data.monthlyGrossIncome ?? 0) * 12;
    const totalCredits = data.taxCredits.reduce((sum, c) => sum + c.annualAmount, 0);

    // (1) tax-credits-summary
    if (totalCredits > 0) {
      let adjustedTotal = totalCredits;
      let phaseOutAmount = 0;
      if (annualGrossIncome > 0) {
        for (const credit of data.taxCredits) {
          const category = findCreditCategory(credit.category, country);
          if (category) {
            const elig = checkIncomeEligibility(category, annualGrossIncome, filingStatus);
            if (elig === "ineligible") {
              adjustedTotal -= credit.annualAmount;
              phaseOutAmount += credit.annualAmount;
            }
          }
        }
      }

      let message: string;
      if (annualGrossIncome > 0 && data.annualTax !== undefined && data.annualTax > 0) {
        const taxBefore = data.annualTax + totalCredits;
        const taxAfter = Math.max(0, data.annualTax);
        const rateBefore = ((taxBefore / annualGrossIncome) * 100).toFixed(1);
        const rateAfter = ((taxAfter / annualGrossIncome) * 100).toFixed(1);
        message = `You're claiming ${formatCurrency(totalCredits)} in annual tax credits, reducing your effective tax rate from ${rateBefore}% to ${rateAfter}%.`;
      } else {
        message = `You're claiming ${formatCurrency(totalCredits)} in annual tax credits.`;
      }

      if (phaseOutAmount > 0) {
        message += ` Note: ${formatCurrency(phaseOutAmount)} of your claimed credits may be reduced or unavailable at your income level — adjusted total: ${formatCurrency(adjustedTotal)}.`;
      }

      insights.push({
        id: "tax-credits-summary",
        type: "tax-credits-summary",
        message,
        icon: "🏛️",
      });
    }

    // (2) tax-credits-unclaimed — suggest credits the user hasn't claimed (max 2)
    {
      const claimed = new Set(data.taxCredits.map((c) => c.category));
      const suggestions: Array<{ name: string; maxAmount?: number }> = [];

      // Helper: check eligibility before suggesting
      const eligible = (creditName: string): boolean => {
        const cat = ALL_CREDIT_CATEGORIES.find((c) => c.name === creditName && c.jurisdiction === country);
        if (!cat) return false;
        if (annualGrossIncome > 0) {
          return checkIncomeEligibility(cat, annualGrossIncome, filingStatus) !== "ineligible";
        }
        return true;
      };

      if (country === "CA") {
        if (data.hasChildCareExpenses && !claimed.has("Canada Child Benefit (CCB)") && eligible("Canada Child Benefit (CCB)")) {
          suggestions.push({ name: "Canada Child Benefit (CCB)", maxAmount: 7437 });
        }
        if (!claimed.has("Canada Workers Benefit (CWB)") && annualGrossIncome > 0 && annualGrossIncome < 43212 && eligible("Canada Workers Benefit (CWB)")) {
          suggestions.push({ name: "Canada Workers Benefit (CWB)", maxAmount: 1518 });
        }
        if (!claimed.has("Disability Tax Credit (DTC)") && !claimed.has("Medical Expense Tax Credit")) {
          suggestions.push({ name: "Disability Tax Credit (DTC)", maxAmount: 9428 });
        }
        if (data.isHomeowner && !claimed.has("Home Accessibility Tax Credit")) {
          suggestions.push({ name: "Home Accessibility Tax Credit", maxAmount: 20000 });
        }
        if (data.hasStudentLoans && !claimed.has("Canada Training Credit") && eligible("Canada Training Credit")) {
          suggestions.push({ name: "Canada Training Credit", maxAmount: 250 });
        }
      } else if (country === "AU") {
        if (annualGrossIncome > 0 && annualGrossIncome < 66_667 && !claimed.has("Low Income Tax Offset (LITO)") && eligible("Low Income Tax Offset (LITO)")) {
          suggestions.push({ name: "Low Income Tax Offset (LITO)", maxAmount: 700 });
        }
        if (annualGrossIncome > 0 && annualGrossIncome < 60_400 && !claimed.has("Super Co-contribution") && eligible("Super Co-contribution")) {
          suggestions.push({ name: "Super Co-contribution", maxAmount: 500 });
        }
        if (!claimed.has("Franking Credits") && eligible("Franking Credits")) {
          suggestions.push({ name: "Franking Credits" });
        }
        if (annualGrossIncome > 0 && annualGrossIncome >= 93_000 && !claimed.has("Private Health Insurance Rebate") && eligible("Private Health Insurance Rebate")) {
          suggestions.push({ name: "Private Health Insurance Rebate" });
        }
      } else {
        if (data.hasChildCareExpenses && !claimed.has("Child Tax Credit") && eligible("Child Tax Credit")) {
          suggestions.push({ name: "Child Tax Credit", maxAmount: 2000 });
        }
        if (!claimed.has("Earned Income Tax Credit (EITC)") && annualGrossIncome > 0 && annualGrossIncome < 64268 && eligible("Earned Income Tax Credit (EITC)")) {
          suggestions.push({ name: "Earned Income Tax Credit (EITC)", maxAmount: 7430 });
        }
        if (!claimed.has("Disability Tax Credit (DTC)") && !claimed.has("Child and Dependent Care Credit")) {
          // Universal suggestion for people who may have disability or dependent care
        }
        if (data.isHomeowner && !claimed.has("Residential Clean Energy Credit")) {
          suggestions.push({ name: "Residential Clean Energy Credit" });
        }
        if (data.hasStudentLoans && !claimed.has("American Opportunity Tax Credit (AOTC)") && eligible("American Opportunity Tax Credit (AOTC)")) {
          suggestions.push({ name: "American Opportunity Tax Credit (AOTC)", maxAmount: 2500 });
        } else if (data.hasStudentLoans && !claimed.has("Lifetime Learning Credit") && eligible("Lifetime Learning Credit")) {
          suggestions.push({ name: "Lifetime Learning Credit", maxAmount: 2000 });
        }
      }

      const filingLabel = _filingStatusLabel(filingStatus);
      for (const suggestion of suggestions.slice(0, 2)) {
        const amountStr = suggestion.maxAmount ? `worth up to ${formatCurrency(suggestion.maxAmount)}/year` : "potentially valuable";
        insights.push({
          id: `tax-credits-unclaimed-${suggestion.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          type: "tax-credits-unclaimed",
          message: `You may be eligible for the ${suggestion.name} — ${amountStr} for ${filingLabel}. Worth checking with a tax professional!`,
          icon: "💡",
        });
      }
    }

    // (3) tax-credits-refundable — if refundable credits exceed estimated tax
    {
      const totalRefundable = data.taxCredits
        .filter((c) => c.type === "refundable")
        .reduce((sum, c) => sum + c.annualAmount, 0);
      if (totalRefundable > 0 && data.annualTax !== undefined && totalRefundable > data.annualTax) {
        insights.push({
          id: "tax-credits-refundable",
          type: "tax-credits-refundable",
          message: `Your refundable tax credits (${formatCurrency(totalRefundable)}) may result in a tax refund.`,
          icon: "💰",
        });
      }
    }

    // (4) tax-credits-ineligible — credits user likely can't claim
    if (annualGrossIncome > 0 || data.filingStatus) {
      let ineligibleCount = 0;
      let ineligibleAmount = 0;
      let adjustedTotal = 0;
      for (const credit of data.taxCredits) {
        const category = findCreditCategory(credit.category, country);
        if (!category || annualGrossIncome === 0) {
          adjustedTotal += credit.annualAmount;
          continue;
        }
        const elig = checkIncomeEligibility(category, annualGrossIncome, filingStatus);
        if (elig === "ineligible") {
          ineligibleCount++;
          ineligibleAmount += credit.annualAmount;
        } else {
          adjustedTotal += credit.annualAmount;
        }
      }
      if (ineligibleCount > 0) {
        const filingLabel = _filingStatusLabel(filingStatus);
        const incomeStr = annualGrossIncome > 0 ? ` ($${Math.round(annualGrossIncome).toLocaleString()} AGI, filing ${filingLabel})` : ` (filing ${filingLabel})`;
        insights.push({
          id: "tax-credits-ineligible",
          type: "tax-credits-ineligible",
          message: `Heads up: ${ineligibleCount} of your claimed credit${ineligibleCount !== 1 ? "s" : ""} may be reduced or unavailable at your income level${incomeStr}. The adjusted credit total is ${formatCurrency(adjustedTotal)}. Consider reviewing with a tax professional.`,
          icon: "⚠️",
        });
      }
      // suppress unused variable warning
      void ineligibleAmount;
    }
  }

  // Age-based net worth percentile insight
  if (data.currentAge !== undefined && data.currentAge > 0) {
    const ageGroup = getAgeGroup(data.currentAge);
    if (ageGroup) {
      const above = netWorth >= ageGroup.median;
      insights.push({
        id: above ? "net-worth-percentile-above" : "net-worth-percentile-below",
        type: "net-worth-percentile",
        message: above
          ? `Your net worth of ${formatCompact(netWorth)} is above the median for your age group (${ageGroup.label}: ${formatCompact(ageGroup.median)}). You're building real financial strength.`
          : `The median net worth for your age group (${ageGroup.label}) is ${formatCompact(ageGroup.median)}. You're on your way — every dollar saved now compounds over time.`,
        icon: "📊",
      });
    }
  }

  return deduplicateInsights(insights);
}

/**
 * Deduplicate insights by topic group: when multiple insights from the same
 * topic fire, keep only the first (highest priority). Then cap at MAX_INSIGHTS.
 *
 * Groups (keep 1 when multiple fire):
 * - surplus + income-efficiency → keep first surplus only
 * - savings-rate vs income-efficiency → drop income-efficiency if savings-rate exists
 * - net-worth + net-worth-milestone + net-worth-percentile → keep 1
 * - fire + coast-fire → keep 1
 * - withdrawal-tax (multiple sub-insights) → keep 1
 * - debt-free + debt-to-income (when DTI ~0) → keep debt-free
 * - tax-credits-* → keep 1
 */
export function deduplicateInsights(insights: Insight[]): Insight[] {
  const drop = new Set<string>();

  // 1. Surplus: "spending less than you earn" + "add $X this year" + "X cents per dollar" are all
  //    variations of the same cash flow message. Keep only the first surplus insight.
  const surplusInsights = insights.filter((i) => i.type === "surplus");
  if (surplusInsights.length > 1) {
    for (const s of surplusInsights.slice(1)) drop.add(s.id);
  }

  // 2. Savings-rate ("saving X%") and income-efficiency ("X cents per dollar") say the same thing
  if (insights.some((i) => i.type === "savings-rate")) {
    for (const i of insights) {
      if (i.id === "income-efficiency") drop.add(i.id);
    }
  }

  // 3. Debt-free makes DTI 0% redundant
  if (insights.some((i) => i.id === "debt-free")) {
    for (const i of insights) {
      if (i.type === "debt-to-income") drop.add(i.id);
    }
  }

  // 4. Net worth: milestone ("Millionaire!") supersedes base net-worth ("$1.8M positive and growing")
  //    Keep percentile if present — it adds distinct age-group context
  const hasMilestone = insights.some((i) => i.type === "net-worth-milestone");
  if (hasMilestone) {
    for (const i of insights) {
      if (i.type === "net-worth") drop.add(i.id);
    }
  }

  // 5. Coast FIRE and FIRE progress overlap — keep Coast FIRE (more specific)
  if (insights.some((i) => i.type === "coast-fire") && insights.some((i) => i.type === "fire")) {
    for (const i of insights) {
      if (i.type === "fire") drop.add(i.id);
    }
  }

  // 6. Income-replacement ("replaces X% of income") overlaps with FIRE progress ("X% there")
  //    Keep income-replacement only if no FIRE insight exists
  if (insights.some((i) => i.type === "fire" || i.type === "coast-fire")) {
    for (const i of insights) {
      if (i.type === "income-replacement") drop.add(i.id);
    }
  }

  return insights.filter((i) => !drop.has(i.id));
}
