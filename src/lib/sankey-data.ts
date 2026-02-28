/**
 * Transforms financial state into Sankey diagram nodes and links.
 *
 * Flow: Income sources → [Taxes] + After-Tax Pool → Expenses / Investments / Mortgage / Debt / Surplus
 */

import type { IncomeItem } from "@/components/IncomeEntry";
import { normalizeToMonthly } from "@/components/IncomeEntry";
import type { ExpenseItem } from "@/components/ExpenseEntry";

export interface SankeyNode {
  id: string;
  label: string;
  /** "income" | "tax" | "pool" | "expense" | "investment" | "debt" | "surplus" */
  type: string;
  value?: number;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export interface CashFlowInput {
  income: IncomeItem[];
  expenses: ExpenseItem[];
  investmentContributions: number;
  mortgagePayments: number;
  monthlyFederalTax: number;
  monthlyProvincialTax: number;
  monthlySurplus: number;
}

/**
 * Builds Sankey nodes and links from financial cash flow data.
 * Returns empty data if there's no income.
 */
export function buildSankeyData(input: CashFlowInput): SankeyData {
  const nodes: SankeyNode[] = [];
  const links: SankeyLink[] = [];

  // Normalize income to monthly
  const incomeItems = input.income
    .map((item) => ({
      ...item,
      monthlyAmount: normalizeToMonthly(item.amount, item.frequency),
    }))
    .filter((item) => item.monthlyAmount > 0);

  const totalGrossIncome = incomeItems.reduce((sum, i) => sum + i.monthlyAmount, 0);
  if (totalGrossIncome <= 0) return { nodes: [], links: [] };

  const totalTax = Math.max(0, input.monthlyFederalTax + input.monthlyProvincialTax);

  // Add income source nodes and link them to the after-tax pool
  for (const item of incomeItems) {
    const nodeId = `income-${item.id}`;
    nodes.push({ id: nodeId, label: item.category || "Income", type: "income", value: item.monthlyAmount });
  }

  // Tax node (combined federal + provincial)
  if (totalTax > 0) {
    nodes.push({ id: "taxes", label: "Taxes", type: "tax", value: totalTax });
  }

  // After-tax income pool
  const afterTax = totalGrossIncome - totalTax;
  nodes.push({ id: "after-tax", label: "After-Tax Income", type: "pool", value: afterTax });

  // Link each income source → taxes (proportional) and → after-tax pool
  for (const item of incomeItems) {
    const nodeId = `income-${item.id}`;
    const proportion = item.monthlyAmount / totalGrossIncome;

    if (totalTax > 0) {
      const taxPortion = Math.round(totalTax * proportion * 100) / 100;
      if (taxPortion > 0) {
        links.push({ source: nodeId, target: "taxes", value: taxPortion });
      }
      const afterTaxPortion = item.monthlyAmount - taxPortion;
      if (afterTaxPortion > 0) {
        links.push({ source: nodeId, target: "after-tax", value: afterTaxPortion });
      }
    } else {
      links.push({ source: nodeId, target: "after-tax", value: item.monthlyAmount });
    }
  }

  // Right-side destinations from after-tax pool
  // Track how much of after-tax income we've allocated
  let allocated = 0;

  // Expense categories (user-entered only, no auto items)
  const expenseItems = input.expenses.filter((e) => e.amount > 0);
  for (const expense of expenseItems) {
    const nodeId = `expense-${expense.id}`;
    const amount = Math.min(expense.amount, afterTax - allocated);
    if (amount > 0) {
      nodes.push({ id: nodeId, label: expense.category || "Expense", type: "expense", value: expense.amount });
      links.push({ source: "after-tax", target: nodeId, value: amount });
      allocated += amount;
    }
  }

  // Investment contributions
  if (input.investmentContributions > 0) {
    const amount = Math.min(input.investmentContributions, Math.max(0, afterTax - allocated));
    if (amount > 0) {
      nodes.push({ id: "investments", label: "Investments", type: "investment", value: input.investmentContributions });
      links.push({ source: "after-tax", target: "investments", value: amount });
      allocated += amount;
    }
  }

  // Mortgage payments
  if (input.mortgagePayments > 0) {
    const amount = Math.min(input.mortgagePayments, Math.max(0, afterTax - allocated));
    if (amount > 0) {
      nodes.push({ id: "mortgage", label: "Mortgage", type: "debt", value: input.mortgagePayments });
      links.push({ source: "after-tax", target: "mortgage", value: amount });
      allocated += amount;
    }
  }

  // Surplus (remaining after-tax income)
  const surplus = Math.max(0, afterTax - allocated);
  if (surplus > 0) {
    nodes.push({ id: "surplus", label: "Surplus", type: "surplus", value: surplus });
    links.push({ source: "after-tax", target: "surplus", value: surplus });
  }

  return { nodes, links };
}

// Color palette for Sankey nodes
export const SANKEY_COLORS: Record<string, string> = {
  income: "#10b981",     // emerald-500
  tax: "#f59e0b",        // amber-500
  pool: "#3b82f6",       // blue-500
  expense: "#ef4444",    // red-500 (warm red)
  investment: "#06b6d4", // cyan-500
  debt: "#f97316",       // orange-500
  surplus: "#22c55e",    // green-500
};
