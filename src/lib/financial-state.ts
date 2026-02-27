import type { Asset } from "@/components/AssetEntry";
import type { Debt } from "@/components/DebtEntry";
import type { IncomeItem } from "@/components/IncomeEntry";
import type { ExpenseItem } from "@/components/ExpenseEntry";
import type { Goal } from "@/components/GoalEntry";
import type { FinancialData } from "@/lib/insights";
import type { MetricData } from "@/components/SnapshotDashboard";

export interface FinancialState {
  assets: Asset[];
  debts: Debt[];
  income: IncomeItem[];
  expenses: ExpenseItem[];
  goals: Goal[];
}

export const INITIAL_STATE: FinancialState = {
  assets: [
    { id: "1", category: "Savings Account", amount: 12000 },
    { id: "2", category: "TFSA", amount: 35000 },
    { id: "3", category: "Brokerage", amount: 18500 },
  ],
  debts: [
    { id: "d1", category: "Mortgage", amount: 280000 },
    { id: "d2", category: "Car Loan", amount: 15000 },
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
};

export function computeTotals(state: FinancialState) {
  const totalAssets = state.assets.reduce((sum, a) => sum + a.amount, 0);
  const totalDebts = state.debts.reduce((sum, d) => sum + d.amount, 0);
  const monthlyIncome = state.income.reduce((sum, i) => sum + i.amount, 0);
  const monthlyExpenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);
  return { totalAssets, totalDebts, monthlyIncome, monthlyExpenses };
}

export function computeMetrics(state: FinancialState): MetricData[] {
  const { totalAssets, totalDebts, monthlyIncome, monthlyExpenses } = computeTotals(state);

  const netWorth = totalAssets - totalDebts;
  const surplus = monthlyIncome - monthlyExpenses;
  const runway = monthlyExpenses > 0 ? totalAssets / monthlyExpenses : 0;
  const debtToAssetRatio = totalAssets > 0 ? totalDebts / totalAssets : 0;

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
  const { totalAssets, totalDebts, monthlyIncome, monthlyExpenses } = computeTotals(state);
  return {
    totalAssets,
    totalDebts,
    monthlyIncome,
    monthlyExpenses,
    goals: state.goals.map((g) => ({
      name: g.name,
      target: g.targetAmount,
      current: g.currentAmount,
    })),
  };
}
