import type { FinancialState } from "@/lib/financial-types";
import type { MetricData } from "@/components/SnapshotDashboard";
import type { IncomeReplacementExplainerDetails } from "@/components/DataFlowArrows";
import type { TaxTreatment } from "@/lib/withdrawal-tax";
import { getTaxTreatment } from "@/lib/withdrawal-tax";
import { getDefaultRoi } from "@/components/AssetEntry";
import { getStockValue } from "@/components/StockEntry";
import { getHomeCurrency, getEffectiveFxRates, convertToHome } from "@/lib/currency";
import type { SupportedCurrency } from "@/lib/currency";
import { computeTotals, computeMonthlyInvestmentReturns, buildTaxExplainerDetails, fmtShort, computeMonthlyObligations, computeSurplus } from "@/lib/compute-totals";
import { simulateRunwayWithGrowth, simulateRunwayWithTax, buildRunwayExplainerDetails, type DetailedBucket } from "@/lib/runway-simulation";

const INCOME_REPLACEMENT_TIERS = [
  { label: "Early stage", threshold: 0 },
  { label: "Building momentum", threshold: 25 },
  { label: "Strong position", threshold: 50 },
  { label: "Nearly independent", threshold: 75 },
  { label: "Financially independent", threshold: 100 },
];

export function computeIncomeReplacementDetails(
  state: FinancialState,
  totalInvestedAssets: number,
  monthlyAfterTaxIncome: number,
): IncomeReplacementExplainerDetails {
  const homeCurrency = getHomeCurrency(state.country ?? "CA");
  const fxRates = getEffectiveFxRates(homeCurrency, state.fxManualOverride, state.fxRates);
  const toHome = (amount: number, itemCurrency?: SupportedCurrency) =>
    convertToHome(amount, itemCurrency ?? homeCurrency, homeCurrency, fxRates);

  const monthlyWithdrawal4pct = totalInvestedAssets * 0.04 / 12;
  const incomeReplacementPct = monthlyAfterTaxIncome > 0
    ? parseFloat((monthlyWithdrawal4pct / monthlyAfterTaxIncome * 100).toFixed(1))
    : 0;

  // Determine current tier and next tier
  let tierIndex = 0;
  for (let i = INCOME_REPLACEMENT_TIERS.length - 1; i >= 0; i--) {
    if (incomeReplacementPct >= INCOME_REPLACEMENT_TIERS[i].threshold) {
      tierIndex = i;
      break;
    }
  }
  const currentTierLabel = INCOME_REPLACEMENT_TIERS[tierIndex].label;
  const nextTier = tierIndex < INCOME_REPLACEMENT_TIERS.length - 1 ? INCOME_REPLACEMENT_TIERS[tierIndex + 1] : null;
  const nextTierLabel = nextTier?.label ?? null;
  const amountNeededForNextTier = nextTier && monthlyAfterTaxIncome > 0
    ? Math.max(0, Math.ceil((nextTier.threshold / 100 * monthlyAfterTaxIncome * 12) / 0.04) - totalInvestedAssets)
    : null;

  // Per-asset breakdown
  const assetBreakdown: { label: string; balance: number; monthlyWithdrawal: number }[] = [];
  for (const asset of state.assets.filter((a) => !a.computed)) {
    if (asset.amount > 0) {
      const balance = toHome(asset.amount, asset.currency);
      assetBreakdown.push({
        label: asset.category,
        balance,
        monthlyWithdrawal: Math.round(balance * 0.04 / 12),
      });
    }
  }
  for (const stock of (state.stocks ?? [])) {
    const val = getStockValue(stock);
    if (val > 0) {
      const balance = toHome(val, stock.priceCurrency);
      assetBreakdown.push({
        label: stock.ticker,
        balance,
        monthlyWithdrawal: Math.round(balance * 0.04 / 12),
      });
    }
  }

  return {
    totalInvestedAssets,
    monthlyWithdrawal4pct,
    monthlyAfterTaxIncome,
    incomeReplacementPct,
    currentTierLabel,
    nextTierLabel,
    amountNeededForNextTier,
    assetBreakdown,
  };
}

export function computeMetrics(state: FinancialState): MetricData[] {
  const { totalAssets, totalDebts, totalDebtPayments, monthlyIncome, monthlyExpenses, totalMonthlyContributions, totalPropertyEquity, totalPropertyValue, totalPropertyMortgage, totalMortgagePayments, totalStocks, monthlyAfterTaxIncome, totalTaxEstimate, effectiveTaxRate, totalFederalTax, totalProvincialStateTax, investmentIncomeAccounts, totalInvestmentInterest, totalTaxableBase } = computeTotals(state);
  const hc = getHomeCurrency(state.country ?? "CA");
  const $ = (n: number) => fmtShort(n, hc);

  // Net worth: show without property equity as primary, with equity as secondary
  const netWorthWithoutEquity = totalAssets + totalStocks - totalDebts;
  const netWorth = netWorthWithoutEquity;
  const netWorthWithEquity = totalAssets + totalStocks + totalPropertyEquity - totalDebts;
  // Compute estimated monthly investment returns from all assets (real + computed)
  const investmentReturns = computeMonthlyInvestmentReturns(state.assets);
  const totalMonthlyInvestmentReturns = investmentReturns.reduce((sum, r) => sum + r.amount, 0);
  // Surplus uses after-tax income + investment returns, subtracts expenses, contributions, mortgage payments, AND debt payments
  const surplus = computeSurplus(monthlyAfterTaxIncome, totalMonthlyInvestmentReturns, monthlyExpenses, totalMonthlyContributions, totalMortgagePayments, totalDebtPayments);
  // Runway uses liquid assets + stocks (NOT property), divided by total monthly obligations (including debt payments)
  const liquidTotal = totalAssets + totalStocks;
  const monthlyObligations = computeMonthlyObligations(monthlyExpenses, totalMortgagePayments, totalDebtPayments);
  const runway = monthlyObligations > 0 ? liquidTotal / monthlyObligations : 0;

  // Runway with investment growth: each asset account draws down proportionally, earning its own ROR.
  // Computed assets (stocks, equity) use their user-set ROI; real assets use their own ROI.
  let runwayWithGrowth: number | undefined;
  let runwayAfterTax: number | undefined;
  const country = state.country ?? "CA";
  const jurisdiction = state.jurisdiction ?? "ON";

  // Build detailed buckets with tax treatment info for both growth and tax-adjusted simulations
  const detailedBuckets: DetailedBucket[] = [];

  if (monthlyObligations > 0 && liquidTotal > 0) {
    const computedAssets = state.assets.filter((a) => a.computed);
    const hasComputedStocks = computedAssets.some((a) => a.id === "_computed_stocks");

    // Real assets
    for (const asset of state.assets.filter((a) => !a.computed)) {
      if (asset.amount > 0) {
        detailedBuckets.push({
          balance: asset.amount,
          ror: asset.roi ?? getDefaultRoi(asset.category) ?? 0,
          category: asset.category,
          taxTreatment: getTaxTreatment(asset.category, asset.taxTreatment) as TaxTreatment,
          costBasisPercent: asset.costBasisPercent ?? 100,
          roiTaxTreatment: asset.roiTaxTreatment,
        });
      }
    }
    // Computed assets (stocks, equity) — use their user-set ROI
    for (const asset of computedAssets) {
      if (asset.amount > 0 && asset.id !== "_computed_equity") {
        detailedBuckets.push({
          balance: asset.amount,
          ror: asset.roi ?? 0,
          category: asset.category,
          taxTreatment: getTaxTreatment(asset.category, asset.taxTreatment) as TaxTreatment,
          costBasisPercent: asset.costBasisPercent ?? 100,
          roiTaxTreatment: asset.roiTaxTreatment,
        });
      }
    }
    // Stocks without a computed asset entry: fall back to 0% growth, taxable
    if (!hasComputedStocks && totalStocks > 0) {
      detailedBuckets.push({ balance: totalStocks, ror: 0, category: "Brokerage", taxTreatment: "taxable", costBasisPercent: 100 });
    }

    // Runway with growth (existing, no tax)
    const hasGrowth = detailedBuckets.some((b) => b.ror > 0);
    if (hasGrowth) {
      const simBuckets = detailedBuckets.map((b) => ({ balance: b.balance, monthlyRate: b.ror / 100 / 12 }));
      const months = simulateRunwayWithGrowth(simBuckets, monthlyObligations);
      if (months - runway > 0.5) {
        runwayWithGrowth = months >= 1200 ? Infinity : parseFloat(months.toFixed(1));
      }
    }

    // Tax-adjusted runway: uses smart withdrawal order and grosses up for taxes
    const hasTaxedAccounts = detailedBuckets.some((b) => b.taxTreatment !== "tax-free");
    if (hasTaxedAccounts) {
      const taxBuckets = detailedBuckets.map((b) => ({
        balance: b.balance,
        monthlyRate: b.ror / 100 / 12,
        taxTreatment: b.taxTreatment,
        category: b.category,
        costBasisPercent: b.costBasisPercent,
        roiTaxTreatment: b.roiTaxTreatment,
      }));
      const taxMonths = simulateRunwayWithTax(taxBuckets, monthlyObligations, country, jurisdiction);
      const taxRunway = taxMonths >= 1200 ? Infinity : parseFloat(taxMonths.toFixed(1));
      // Compare against the growth-aware baseline (or simple runway if no growth)
      const baselineRunway = runwayWithGrowth ?? runway;
      const diff = baselineRunway === Infinity ? 0 : baselineRunway - taxRunway;
      if (diff > 0.3) {
        runwayAfterTax = taxRunway;
      }
    }
  }
  // Tax credit impact on metrics
  const taxCredits = state.taxCredits ?? [];
  const totalRefundableCredits = taxCredits.filter((c) => c.type === "refundable").reduce((s, c) => s + c.annualAmount, 0);
  const totalNonRefundableCredits = taxCredits.filter((c) => c.type === "non-refundable").reduce((s, c) => s + c.annualAmount, 0);
  // Non-refundable credits are capped at the total tax estimate (can't reduce tax below 0)
  const nonRefundableBenefit = Math.min(totalNonRefundableCredits, totalTaxEstimate);
  const creditAdjustedAnnualTax = Math.max(0, totalTaxEstimate - nonRefundableBenefit - totalRefundableCredits);
  const taxCreditAdjustedRate = taxCredits.length > 0 && totalTaxableBase > 0
    ? creditAdjustedAnnualTax / totalTaxableBase
    : undefined;
  // Monthly benefit from refundable credits (direct cash / income supplement)
  const monthlyRefundableCredits = totalRefundableCredits / 12;
  // Monthly benefit from non-refundable credits (reduced tax burden = more take-home)
  const monthlyNonRefundableBenefit = nonRefundableBenefit / 12;
  const totalMonthlyCreditBenefit = monthlyRefundableCredits + monthlyNonRefundableBenefit;
  // Credit-adjusted runway: credits reduce effective monthly obligations
  const creditAdjMonthlyObligations = Math.max(0.01, monthlyObligations - totalMonthlyCreditBenefit);
  const taxCreditAdjustedRunway = taxCredits.length > 0 && monthlyObligations > 0
    ? parseFloat((liquidTotal / creditAdjMonthlyObligations).toFixed(1))
    : undefined;

  // Debt-to-asset ratio includes property: (debts + mortgages) / (liquid assets + stocks + property values)
  // Use property VALUE (not equity) on asset side — equity already nets out the mortgage,
  // so using equity + mortgage as debt would double-count the mortgage.
  const totalAllAssets = totalAssets + totalStocks + totalPropertyValue;
  const totalAllDebts = totalDebts + totalPropertyMortgage;
  const debtToAssetRatio = totalAllAssets > 0 ? totalAllDebts / totalAllAssets : 0;
  // Ratio excluding mortgage — just consumer debts vs liquid assets + stocks
  const assetsWithoutProperty = totalAssets + totalStocks;
  const debtToAssetWithoutMortgage = assetsWithoutProperty > 0 ? totalDebts / assetsWithoutProperty : 0;

  // Build breakdown strings
  const nwParts: string[] = [];
  if (totalAssets > 0) nwParts.push(`${$(totalAssets)} savings`);
  if (totalStocks > 0) nwParts.push(`${$(totalStocks)} stocks`);
  if (totalPropertyEquity > 0) nwParts.push(`${$(totalPropertyEquity)} equity`);
  if (totalDebts > 0) nwParts.push(`- ${$(totalDebts)} debts`);
  const netWorthBreakdown = nwParts.length > 0 ? nwParts.join(" + ").replace("+ -", "- ") : undefined;

  const surplusTargetName = state.assets.find((a) => a.surplusTarget)?.category ?? state.assets[0]?.category;

  // Build surplus formula: income sources (added) then outflows (subtracted)
  const surplusIncome: string[] = [];
  const surplusOutflow: string[] = [];
  const monthlyTaxes = monthlyIncome - monthlyAfterTaxIncome;
  // List income sources largest-first (use gross income, taxes shown as outflow)
  if (totalMonthlyInvestmentReturns > monthlyIncome) {
    if (totalMonthlyInvestmentReturns > 0) surplusIncome.push(`${$(totalMonthlyInvestmentReturns)} investment returns`);
    if (monthlyIncome > 0) surplusIncome.push(`${$(monthlyIncome)} gross income`);
  } else {
    if (monthlyIncome > 0) surplusIncome.push(`${$(monthlyIncome)} gross income`);
    if (totalMonthlyInvestmentReturns > 0) surplusIncome.push(`${$(totalMonthlyInvestmentReturns)} investment returns`);
  }
  if (monthlyTaxes > 0) surplusOutflow.push(`${$(monthlyTaxes)} taxes`);
  if (monthlyExpenses > 0) surplusOutflow.push(`${$(monthlyExpenses)} expenses`);
  if (totalMonthlyContributions > 0) surplusOutflow.push(`${$(totalMonthlyContributions)} contributions`);
  if (totalMortgagePayments > 0) surplusOutflow.push(`${$(totalMortgagePayments)} mortgage`);
  if (totalDebtPayments > 0) surplusOutflow.push(`${$(totalDebtPayments)} debt payments`);
  const surplusFormula = [...surplusIncome.length > 0 ? [surplusIncome.join(" + ")] : [], ...surplusOutflow].join(" - ");
  const surplusBreakdown = surplus > 0 && surplusTargetName
    ? `${surplusFormula} → ${$(surplus)}/mo to ${surplusTargetName}`
    : surplusFormula;

  const obligationParts: string[] = [];
  if (monthlyExpenses > 0) obligationParts.push(`${$(monthlyExpenses)} expenses`);
  if (totalMortgagePayments > 0) obligationParts.push(`${$(totalMortgagePayments)} mortgage`);
  if (totalDebtPayments > 0) obligationParts.push(`${$(totalDebtPayments)} debt payments`);
  const runwayBreakdown = monthlyObligations > 0
    ? `${$(liquidTotal)} liquid / ${$(monthlyObligations)}/mo obligations${obligationParts.length > 1 ? ` (${obligationParts.join(" + ")})` : ""}`
    : undefined;

  const ratioBreakdown = totalAllAssets > 0
    ? `${$(totalAllDebts)} debts / ${$(totalAllAssets)} assets`
    : undefined;

  const taxBreakdown = totalTaxEstimate > 0
    ? `${$(monthlyIncome)} gross${totalInvestmentInterest > 0 ? ` + ${$(totalInvestmentInterest / 12)} inv. interest` : ""} - ${$(monthlyIncome - monthlyAfterTaxIncome)} tax = ${$(monthlyAfterTaxIncome)}/mo`
    : undefined;

  return [
    {
      title: "Net Worth",
      value: netWorth,
      format: "currency",
      icon: "💰",
      tooltip:
        "Your total assets minus total debts. This is a snapshot — it changes as you pay down debts and grow savings.",
      positive: netWorth >= 0,
      breakdown: netWorthBreakdown,
      valueWithEquity: totalPropertyEquity > 0 ? netWorthWithEquity : undefined,
    },
    {
      title: "Monthly Cash Flow",
      value: surplus,
      format: "currency",
      icon: "📈",
      tooltip:
        "How much more you earn than you spend each month, after estimated taxes and estimated investment returns. A positive surplus means you're building wealth.",
      positive: surplus > 0,
      breakdown: surplusBreakdown,
      investmentReturns: investmentReturns.length > 0 ? investmentReturns : undefined,
      taxCreditMonthlyBoost: monthlyRefundableCredits > 0 ? parseFloat(monthlyRefundableCredits.toFixed(2)) : undefined,
    },
    {
      title: "Estimated Tax",
      value: totalTaxEstimate,
      format: "currency",
      icon: "🏛️",
      tooltip:
        "Estimated annual income tax based on your income, income types, and selected country/jurisdiction. This is a rough estimate — consult a tax professional for accuracy.",
      positive: true,
      breakdown: taxBreakdown,
      effectiveRate: effectiveTaxRate,
      taxDetails: buildTaxExplainerDetails(state, totalTaxableBase, totalFederalTax, totalProvincialStateTax, effectiveTaxRate, totalTaxEstimate, investmentIncomeAccounts),
      taxCreditAdjustedRate,
    },
    {
      title: "Financial Runway",
      value: parseFloat(runway.toFixed(1)),
      format: "months",
      icon: "🛡️",
      tooltip:
        "How many months your liquid assets could cover your expenses and mortgage payments. 3–6 months is a solid emergency fund.",
      positive: runway >= 3,
      breakdown: runwayBreakdown,
      runwayWithGrowth,
      runwayAfterTax,
      runwayDetails: buildRunwayExplainerDetails(detailedBuckets, monthlyObligations, monthlyExpenses, totalMortgagePayments, runway, runwayWithGrowth, runwayAfterTax, country, jurisdiction),
      taxCreditAdjustedRunway: taxCreditAdjustedRunway !== undefined && taxCreditAdjustedRunway > runway + 0.1 ? taxCreditAdjustedRunway : undefined,
    },
    {
      title: "Debt-to-Asset Ratio",
      value: parseFloat(debtToAssetRatio.toFixed(2)),
      format: "ratio",
      icon: "⚖️",
      tooltip:
        "Your total debts divided by your total assets. A lower ratio means stronger financial footing. Mortgages often push this higher — that's normal.",
      positive: debtToAssetRatio <= 1,
      breakdown: ratioBreakdown,
      ratioWithoutMortgage: totalPropertyMortgage > 0 ? parseFloat(debtToAssetWithoutMortgage.toFixed(2)) : undefined,
    },
    ...(monthlyAfterTaxIncome > 0 ? [(() => {
      const liquidInvested = totalAssets + totalStocks;
      const incomeReplacementDetails = computeIncomeReplacementDetails(state, liquidInvested, monthlyAfterTaxIncome);
      return {
        title: "Income Replacement",
        value: incomeReplacementDetails.incomeReplacementPct,
        format: "percent" as const,
        icon: "🎯",
        tooltip:
          "What percentage of your monthly income your investment portfolio could sustainably replace using the 4% rule. 100% means financial independence.",
        positive: incomeReplacementDetails.incomeReplacementPct >= 100,
        breakdown: incomeReplacementDetails.currentTierLabel,
        incomeReplacementDetails,
      };
    })()] : []),
  ];
}
