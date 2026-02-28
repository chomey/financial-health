import type { Asset } from "@/components/AssetEntry";
import type { Debt } from "@/components/DebtEntry";
import type { IncomeItem } from "@/components/IncomeEntry";
import { normalizeToMonthly } from "@/components/IncomeEntry";
import type { ExpenseItem } from "@/components/ExpenseEntry";
import type { Property } from "@/components/PropertyEntry";
import type { StockHolding } from "@/components/StockEntry";
import { getStockValue } from "@/components/StockEntry";
import type { FinancialData } from "@/lib/insights";
import type { MetricData } from "@/components/SnapshotDashboard";

export interface FinancialState {
  assets: Asset[];
  debts: Debt[];
  income: IncomeItem[];
  expenses: ExpenseItem[];
  properties: Property[];
  stocks: StockHolding[];
  country?: "CA" | "US";
  jurisdiction?: string;
}

export const INITIAL_STATE: FinancialState = {
  assets: [
    { id: "a1", category: "Savings Account", amount: 12000, surplusTarget: true },
    { id: "a2", category: "TFSA", amount: 35000 },
    { id: "a3", category: "Brokerage", amount: 18500 },
  ],
  debts: [
    { id: "d1", category: "Car Loan", amount: 15000 },
  ],
  income: [
    { id: "i1", category: "Salary", amount: 5500 },
    { id: "i2", category: "Freelance", amount: 800 },
  ],
  expenses: [
    { id: "e1", category: "Rent/Mortgage Payment", amount: 2200 },
    { id: "e2", category: "Groceries", amount: 600 },
    { id: "e3", category: "Subscriptions", amount: 150 },
  ],
  properties: [
    { id: "p1", name: "Home", value: 450000, mortgage: 280000 },
  ],
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
  // Stocks: total value of all holdings (liquid, counts toward net worth and runway)
  const stocks = state.stocks ?? [];
  const totalStocks = stocks.reduce((sum, s) => sum + getStockValue(s), 0);
  return { totalAssets, totalDebts, monthlyIncome, monthlyExpenses, totalMonthlyContributions, totalPropertyEquity, totalPropertyValue, totalPropertyMortgage, totalStocks };
}

function fmtShort(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toFixed(0)}`;
}

export function computeMetrics(state: FinancialState): MetricData[] {
  const { totalAssets, totalDebts, monthlyIncome, monthlyExpenses, totalMonthlyContributions, totalPropertyEquity, totalPropertyMortgage, totalStocks } = computeTotals(state);

  // Net worth includes property equity + stocks: (liquid assets + stocks + property equity) - debts
  const netWorth = totalAssets + totalStocks + totalPropertyEquity - totalDebts;
  // Surplus excludes investment contributions (they're already allocated to specific assets)
  const surplus = monthlyIncome - monthlyExpenses - totalMonthlyContributions;
  // Runway uses liquid assets + stocks (NOT property)
  const liquidTotal = totalAssets + totalStocks;
  const runway = monthlyExpenses > 0 ? liquidTotal / monthlyExpenses : 0;
  // Debt-to-asset ratio includes property: (debts + mortgages) / (liquid assets + stocks + property values)
  const totalAllAssets = totalAssets + totalStocks + totalPropertyEquity;
  const totalAllDebts = totalDebts + totalPropertyMortgage;
  const debtToAssetRatio = totalAllAssets > 0 ? totalAllDebts / totalAllAssets : 0;

  // Build breakdown strings
  const nwParts: string[] = [];
  if (totalAssets > 0) nwParts.push(`${fmtShort(totalAssets)} savings`);
  if (totalStocks > 0) nwParts.push(`${fmtShort(totalStocks)} stocks`);
  if (totalPropertyEquity > 0) nwParts.push(`${fmtShort(totalPropertyEquity)} equity`);
  if (totalDebts > 0) nwParts.push(`- ${fmtShort(totalDebts)} debts`);
  const netWorthBreakdown = nwParts.length > 0 ? nwParts.join(" + ").replace("+ -", "- ") : undefined;

  const surplusTargetName = state.assets.find((a) => a.surplusTarget)?.category ?? state.assets[0]?.category;

  const surplusParts = [`${fmtShort(monthlyIncome)} income`];
  if (monthlyExpenses > 0) surplusParts.push(`${fmtShort(monthlyExpenses)} expenses`);
  if (totalMonthlyContributions > 0) surplusParts.push(`${fmtShort(totalMonthlyContributions)} contributions`);
  const surplusBreakdown = surplus > 0 && surplusTargetName
    ? `${surplusParts.join(" - ")} → ${fmtShort(surplus)}/mo to ${surplusTargetName}`
    : surplusParts.join(" - ");

  const runwayBreakdown = monthlyExpenses > 0
    ? `${fmtShort(liquidTotal)} liquid / ${fmtShort(monthlyExpenses)}/mo expenses`
    : undefined;

  const ratioBreakdown = totalAllAssets > 0
    ? `${fmtShort(totalAllDebts)} debts / ${fmtShort(totalAllAssets)} assets`
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
    },
    {
      title: "Monthly Surplus",
      value: surplus,
      format: "currency",
      icon: "📈",
      tooltip:
        "How much more you earn than you spend each month. A positive surplus means you're building wealth.",
      positive: surplus > 0,
      breakdown: surplusBreakdown,
    },
    {
      title: "Financial Runway",
      value: parseFloat(runway.toFixed(1)),
      format: "months",
      icon: "🛡️",
      tooltip:
        "How many months your liquid assets could cover your expenses. 3–6 months is a solid emergency fund.",
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
    },
  ];
}

export function toFinancialData(state: FinancialState): FinancialData {
  const { totalAssets, totalDebts, monthlyIncome, monthlyExpenses, totalMonthlyContributions, totalPropertyValue, totalPropertyMortgage, totalStocks } = computeTotals(state);
  // Use property value + mortgage so that netWorth = totalAssets - totalDebts matches computeMetrics
  return {
    totalAssets: totalAssets + totalStocks + totalPropertyValue,
    totalDebts: totalDebts + totalPropertyMortgage,
    liquidAssets: totalAssets + totalStocks,
    monthlyIncome,
    monthlyExpenses: monthlyExpenses + totalMonthlyContributions,
    rawMonthlyExpenses: monthlyExpenses,
    debts: state.debts.map((d) => ({
      category: d.category,
      amount: d.amount,
      interestRate: d.interestRate,
      monthlyPayment: d.monthlyPayment,
    })),
  };
}
