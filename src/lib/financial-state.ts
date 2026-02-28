import type { Asset } from "@/components/AssetEntry";
import type { Debt } from "@/components/DebtEntry";
import type { IncomeItem } from "@/components/IncomeEntry";
import { normalizeToMonthly } from "@/components/IncomeEntry";
import type { ExpenseItem } from "@/components/ExpenseEntry";
import type { Goal } from "@/components/GoalEntry";
import type { Property } from "@/components/PropertyEntry";
import type { FinancialData } from "@/lib/insights";
import type { MetricData } from "@/components/SnapshotDashboard";

export type Region = "CA" | "US" | "both";

export interface FinancialState {
  assets: Asset[];
  debts: Debt[];
  income: IncomeItem[];
  expenses: ExpenseItem[];
  goals: Goal[];
  properties: Property[];
  region: Region;
}

export const INITIAL_STATE: FinancialState = {
  region: "both" as Region,
  assets: [
    { id: "a1", category: "Savings Account", amount: 12000 },
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
  goals: [
    { id: "g1", name: "Rainy Day Fund", targetAmount: 20000, currentAmount: 14500 },
    { id: "g2", name: "New Car", targetAmount: 42000, currentAmount: 13500 },
    { id: "g3", name: "Vacation", targetAmount: 6500, currentAmount: 6200 },
  ],
  properties: [
    { id: "p1", name: "Home", value: 450000, mortgage: 280000 },
  ],
};

export function computeTotals(state: FinancialState) {
  const totalAssets = state.assets.reduce((sum, a) => sum + a.amount, 0);
  const totalDebts = state.debts.reduce((sum, d) => sum + d.amount, 0);
  const monthlyIncome = state.income.reduce((sum, i) => sum + normalizeToMonthly(i.amount, i.frequency), 0);
  const monthlyExpenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);
  // Properties: equity = value - mortgage. Counts toward net worth but NOT runway (illiquid).
  const properties = state.properties ?? [];
  const totalPropertyEquity = properties.reduce((sum, p) => sum + Math.max(0, p.value - p.mortgage), 0);
  const totalPropertyValue = properties.reduce((sum, p) => sum + p.value, 0);
  const totalPropertyMortgage = properties.reduce((sum, p) => sum + p.mortgage, 0);
  return { totalAssets, totalDebts, monthlyIncome, monthlyExpenses, totalPropertyEquity, totalPropertyValue, totalPropertyMortgage };
}

export function computeMetrics(state: FinancialState): MetricData[] {
  const { totalAssets, totalDebts, monthlyIncome, monthlyExpenses, totalPropertyEquity, totalPropertyMortgage } = computeTotals(state);

  // Net worth includes property equity: (liquid assets + property equity) - debts
  const netWorth = totalAssets + totalPropertyEquity - totalDebts;
  const surplus = monthlyIncome - monthlyExpenses;
  // Runway uses only liquid assets (NOT property)
  const runway = monthlyExpenses > 0 ? totalAssets / monthlyExpenses : 0;
  // Debt-to-asset ratio includes property: (debts + mortgages) / (liquid assets + property values)
  const totalAllAssets = totalAssets + totalPropertyEquity;
  const totalAllDebts = totalDebts + totalPropertyMortgage;
  const debtToAssetRatio = totalAllAssets > 0 ? totalAllDebts / totalAllAssets : 0;

  return [
    {
      title: "Net Worth",
      value: netWorth,
      format: "currency",
      icon: "💰",
      tooltip:
        "Your total assets minus total debts. This is a snapshot — it changes as you pay down debts and grow savings.",
      positive: netWorth >= 0,
    },
    {
      title: "Monthly Surplus",
      value: surplus,
      format: "currency",
      icon: "📈",
      tooltip:
        "How much more you earn than you spend each month. A positive surplus means you're building wealth.",
      positive: surplus > 0,
    },
    {
      title: "Financial Runway",
      value: parseFloat(runway.toFixed(1)),
      format: "months",
      icon: "🛡️",
      tooltip:
        "How many months your liquid assets could cover your expenses. 3–6 months is a solid emergency fund.",
      positive: runway >= 3,
    },
    {
      title: "Debt-to-Asset Ratio",
      value: parseFloat(debtToAssetRatio.toFixed(2)),
      format: "ratio",
      icon: "⚖️",
      tooltip:
        "Your total debts divided by your total assets. A lower ratio means stronger financial footing. Mortgages often push this higher — that's normal.",
      positive: debtToAssetRatio <= 1,
    },
  ];
}

export function toFinancialData(state: FinancialState): FinancialData {
  const { totalAssets, totalDebts, monthlyIncome, monthlyExpenses, totalPropertyEquity, totalPropertyMortgage } = computeTotals(state);
  return {
    totalAssets: totalAssets + totalPropertyEquity,
    totalDebts: totalDebts + totalPropertyMortgage,
    liquidAssets: totalAssets,
    monthlyIncome,
    monthlyExpenses,
    goals: state.goals.map((g) => ({
      name: g.name,
      target: g.targetAmount,
      current: g.currentAmount,
    })),
    debts: state.debts.map((d) => ({
      category: d.category,
      amount: d.amount,
      interestRate: d.interestRate,
      monthlyPayment: d.monthlyPayment,
    })),
  };
}
