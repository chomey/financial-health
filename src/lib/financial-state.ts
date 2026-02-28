import type { Asset } from "@/components/AssetEntry";
import type { Debt } from "@/components/DebtEntry";
import type { IncomeItem } from "@/components/IncomeEntry";
import { normalizeToMonthly } from "@/components/IncomeEntry";
import type { ExpenseItem } from "@/components/ExpenseEntry";
import type { Property } from "@/components/PropertyEntry";
import { getEffectivePayment } from "@/components/PropertyEntry";
import type { StockHolding } from "@/components/StockEntry";
import { getStockValue } from "@/components/StockEntry";
import type { FinancialData } from "@/lib/insights";
import type { MetricData } from "@/components/SnapshotDashboard";
import { computeTax } from "@/lib/tax-engine";

export interface FinancialState {
  assets: Asset[];
  debts: Debt[];
  income: IncomeItem[];
  expenses: ExpenseItem[];
  properties: Property[];
  stocks: StockHolding[];
  country?: "CA" | "US";
  jurisdiction?: string;
  age?: number;
}

export const INITIAL_STATE: FinancialState = {
  assets: [
    { id: "a1", category: "Savings Account", amount: 5000, surplusTarget: true },
    { id: "a2", category: "TFSA", amount: 22000 },
    { id: "a3", category: "RRSP", amount: 28000 },
  ],
  debts: [
    { id: "d1", category: "Car Loan", amount: 5000 },
  ],
  income: [
    { id: "i1", category: "Salary", amount: 4500 },
  ],
  expenses: [
    { id: "e1", category: "Rent/Mortgage Payment", amount: 1800 },
    { id: "e2", category: "Groceries", amount: 500 },
    { id: "e3", category: "Subscriptions", amount: 50 },
  ],
  properties: [],
  stocks: [],
  country: "CA",
  jurisdiction: "ON",
};

export function computeTotals(state: FinancialState) {
  const totalAssets = state.assets.reduce((sum, a) => sum + a.amount, 0);
  const totalDebts = state.debts.reduce((sum, d) => sum + d.amount, 0);
  const monthlyIncome = state.income.reduce((sum, i) => sum + normalizeToMonthly(i.amount, i.frequency), 0);
  const monthlyExpenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);
  // Total monthly contributions to investment accounts (comes from income, not double-counted in expenses)
  const totalMonthlyContributions = state.assets.reduce((sum, a) => sum + (a.monthlyContribution ?? 0), 0);
  // Properties: equity = value - mortgage. Counts toward net worth but NOT runway (illiquid).
  const properties = state.properties ?? [];
  const totalPropertyEquity = properties.reduce((sum, p) => sum + Math.max(0, p.value - p.mortgage), 0);
  const totalPropertyValue = properties.reduce((sum, p) => sum + p.value, 0);
  const totalPropertyMortgage = properties.reduce((sum, p) => sum + p.mortgage, 0);
  const totalMortgagePayments = properties.reduce((sum, p) => sum + getEffectivePayment(p), 0);
  // Stocks: total value of all holdings (liquid, counts toward net worth and runway)
  const stocks = state.stocks ?? [];
  const totalStocks = stocks.reduce((sum, s) => sum + getStockValue(s), 0);

  // Compute after-tax income: annualize each income item, compute tax, sum after-tax amounts
  const country = state.country ?? "CA";
  const jurisdiction = state.jurisdiction ?? "ON";
  let totalAnnualTax = 0;
  let totalFederalTax = 0;
  let totalProvincialStateTax = 0;
  let totalAfterTaxAnnual = 0;
  let weightedEffectiveRate = 0;

  for (const item of state.income) {
    const monthlyAmt = normalizeToMonthly(item.amount, item.frequency);
    const annualAmt = monthlyAmt * 12;
    if (annualAmt <= 0) continue;
    const taxResult = computeTax(annualAmt, item.incomeType ?? "employment", country, jurisdiction);
    totalAnnualTax += taxResult.totalTax;
    totalFederalTax += taxResult.federalTax;
    totalProvincialStateTax += taxResult.provincialStateTax;
    totalAfterTaxAnnual += taxResult.afterTaxIncome;
    weightedEffectiveRate += taxResult.effectiveRate * annualAmt;
  }

  const totalAnnualIncome = monthlyIncome * 12;
  const effectiveTaxRate = totalAnnualIncome > 0 ? weightedEffectiveRate / totalAnnualIncome : 0;
  const monthlyAfterTaxIncome = totalAfterTaxAnnual / 12;
  const totalTaxEstimate = totalAnnualTax;

  return { totalAssets, totalDebts, monthlyIncome, monthlyExpenses, totalMonthlyContributions, totalPropertyEquity, totalPropertyValue, totalPropertyMortgage, totalMortgagePayments, totalStocks, monthlyAfterTaxIncome, totalTaxEstimate, totalFederalTax, totalProvincialStateTax, effectiveTaxRate };
}

function fmtShort(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toFixed(0)}`;
}

export function computeMetrics(state: FinancialState): MetricData[] {
  const { totalAssets, totalDebts, monthlyIncome, monthlyExpenses, totalMonthlyContributions, totalPropertyEquity, totalPropertyValue, totalPropertyMortgage, totalMortgagePayments, totalStocks, monthlyAfterTaxIncome, totalTaxEstimate, effectiveTaxRate } = computeTotals(state);

  // Net worth: show without property equity as primary, with equity as secondary
  const netWorthWithoutEquity = totalAssets + totalStocks - totalDebts;
  const netWorth = netWorthWithoutEquity;
  const netWorthWithEquity = totalAssets + totalStocks + totalPropertyEquity - totalDebts;
  // Surplus uses after-tax income, subtracts expenses, investment contributions, and mortgage payments
  const surplus = monthlyAfterTaxIncome - monthlyExpenses - totalMonthlyContributions - totalMortgagePayments;
  // Runway uses liquid assets + stocks (NOT property), divided by total monthly obligations
  const liquidTotal = totalAssets + totalStocks;
  const monthlyObligations = monthlyExpenses + totalMortgagePayments;
  const runway = monthlyObligations > 0 ? liquidTotal / monthlyObligations : 0;
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
  if (totalAssets > 0) nwParts.push(`${fmtShort(totalAssets)} savings`);
  if (totalStocks > 0) nwParts.push(`${fmtShort(totalStocks)} stocks`);
  if (totalPropertyEquity > 0) nwParts.push(`${fmtShort(totalPropertyEquity)} equity`);
  if (totalDebts > 0) nwParts.push(`- ${fmtShort(totalDebts)} debts`);
  const netWorthBreakdown = nwParts.length > 0 ? nwParts.join(" + ").replace("+ -", "- ") : undefined;

  const surplusTargetName = state.assets.find((a) => a.surplusTarget)?.category ?? state.assets[0]?.category;

  const surplusParts = [`${fmtShort(monthlyAfterTaxIncome)} after-tax income`];
  if (monthlyExpenses > 0) surplusParts.push(`${fmtShort(monthlyExpenses)} expenses`);
  if (totalMonthlyContributions > 0) surplusParts.push(`${fmtShort(totalMonthlyContributions)} contributions`);
  const surplusBreakdown = surplus > 0 && surplusTargetName
    ? `${surplusParts.join(" - ")} → ${fmtShort(surplus)}/mo to ${surplusTargetName}`
    : surplusParts.join(" - ");

  const runwayBreakdown = monthlyObligations > 0
    ? `${fmtShort(liquidTotal)} liquid / ${fmtShort(monthlyObligations)}/mo obligations${totalMortgagePayments > 0 ? ` (${fmtShort(monthlyExpenses)} expenses + ${fmtShort(totalMortgagePayments)} mortgage)` : ""}`
    : undefined;

  const ratioBreakdown = totalAllAssets > 0
    ? `${fmtShort(totalAllDebts)} debts / ${fmtShort(totalAllAssets)} assets`
    : undefined;

  const taxBreakdown = totalTaxEstimate > 0
    ? `${fmtShort(monthlyIncome)} gross - ${fmtShort(monthlyIncome - monthlyAfterTaxIncome)} tax = ${fmtShort(monthlyAfterTaxIncome)}/mo`
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
      title: "Monthly Surplus",
      value: surplus,
      format: "currency",
      icon: "📈",
      tooltip:
        "How much more you earn than you spend each month, after estimated taxes. A positive surplus means you're building wealth.",
      positive: surplus > 0,
      breakdown: surplusBreakdown,
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
  ];
}

export function toFinancialData(state: FinancialState): FinancialData {
  const { totalAssets, totalDebts, monthlyIncome, monthlyExpenses, totalMonthlyContributions, totalPropertyValue, totalPropertyMortgage, totalMortgagePayments, totalStocks, monthlyAfterTaxIncome, totalTaxEstimate, effectiveTaxRate } = computeTotals(state);
  const hasCapitalGains = state.income.some((i) => i.incomeType === "capital-gains");
  // Use property value + mortgage so that netWorth = totalAssets - totalDebts matches computeMetrics
  return {
    totalAssets: totalAssets + totalStocks + totalPropertyValue,
    totalDebts: totalDebts + totalPropertyMortgage,
    liquidAssets: totalAssets + totalStocks,
    monthlyIncome: monthlyAfterTaxIncome,
    monthlyExpenses: monthlyExpenses + totalMonthlyContributions + totalMortgagePayments,
    rawMonthlyExpenses: monthlyExpenses,
    monthlyMortgagePayments: totalMortgagePayments,
    debts: state.debts.map((d) => ({
      category: d.category,
      amount: d.amount,
      interestRate: d.interestRate,
      monthlyPayment: d.monthlyPayment,
    })),
    effectiveTaxRate: effectiveTaxRate,
    annualTax: totalTaxEstimate,
    hasCapitalGains,
  };
}
