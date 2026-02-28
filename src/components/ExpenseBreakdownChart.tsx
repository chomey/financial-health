"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import type { ExpenseItem } from "@/components/ExpenseEntry";

// Warm, distinguishable colors for expense categories
const COLORS = [
  "#d97706", // amber-600
  "#dc2626", // red-600
  "#059669", // emerald-600
  "#2563eb", // blue-600
  "#7c3aed", // violet-600
  "#0891b2", // cyan-600
  "#0d9488", // teal-600
  "#4f46e5", // indigo-600
  "#be185d", // pink-700
  "#ca8a04", // yellow-600
];

export interface ExpenseSlice {
  name: string;
  value: number;
  percentage: number;
  isAuto: boolean;
}

export function computeExpenseBreakdown(
  expenses: ExpenseItem[],
  investmentContributions: number,
  mortgagePayments: number,
  federalTax: number,
  provincialStateTax: number
): ExpenseSlice[] {
  const slices: ExpenseSlice[] = [];

  // Add manual expense categories
  for (const exp of expenses) {
    if (exp.amount <= 0) continue;
    slices.push({
      name: exp.category,
      value: exp.amount,
      percentage: 0, // computed after totalling
      isAuto: false,
    });
  }

  // Add auto-generated categories
  if (investmentContributions > 0) {
    slices.push({
      name: "Investment Contributions",
      value: investmentContributions,
      percentage: 0,
      isAuto: true,
    });
  }
  if (mortgagePayments > 0) {
    slices.push({
      name: "Mortgage Payments",
      value: mortgagePayments,
      percentage: 0,
      isAuto: true,
    });
  }
  const totalTax = federalTax + provincialStateTax;
  if (totalTax > 0) {
    slices.push({
      name: "Taxes",
      value: totalTax,
      percentage: 0,
      isAuto: true,
    });
  }

  // Sort largest first
  slices.sort((a, b) => b.value - a.value);

  // Compute percentages
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  if (total > 0) {
    for (const sl of slices) {
      sl.percentage = (sl.value / total) * 100;
    }
  }

  return slices;
}

function formatCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${value.toFixed(0)}`;
}

function formatCurrencyFull(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: ExpenseSlice & { fill: string } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-md">
      <div className="flex items-center gap-1.5">
        <p className="text-sm font-medium text-stone-800">{item.name}</p>
        {item.isAuto && (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
            auto
          </span>
        )}
      </div>
      <p className="text-sm text-stone-600">{formatCurrencyFull(item.value)}/mo</p>
      <p className="text-xs text-stone-400">{item.percentage.toFixed(1)}% of total</p>
    </div>
  );
}

interface ExpenseBreakdownChartProps {
  expenses: ExpenseItem[];
  investmentContributions?: number;
  mortgagePayments?: number;
  federalTax?: number;
  provincialStateTax?: number;
  monthlyAfterTaxIncome?: number;
  monthlyGrossIncome?: number;
}

export default function ExpenseBreakdownChart({
  expenses,
  investmentContributions = 0,
  mortgagePayments = 0,
  federalTax = 0,
  provincialStateTax = 0,
  monthlyAfterTaxIncome = 0,
  monthlyGrossIncome,
}: ExpenseBreakdownChartProps) {
  // If taxes are shown as an expense slice, compare against gross income
  // to avoid double-counting (taxes subtracted from income AND shown as expense)
  const hasTaxSlice = federalTax + provincialStateTax > 0;
  const incomeForComparison = hasTaxSlice
    ? (monthlyGrossIncome ?? monthlyAfterTaxIncome)
    : monthlyAfterTaxIncome;
  const data = useMemo(
    () =>
      computeExpenseBreakdown(
        expenses,
        investmentContributions,
        mortgagePayments,
        federalTax,
        provincialStateTax
      ),
    [expenses, investmentContributions, mortgagePayments, federalTax, provincialStateTax]
  );

  const totalExpenses = data.reduce((s, d) => s + d.value, 0);

  // Spending power = after-tax income minus locked-in obligations (investments + mortgage)
  // This is what's actually available for day-to-day expenses
  const spendingPower = Math.max(0, monthlyAfterTaxIncome - investmentContributions - mortgagePayments);
  // Manual expenses only (what the user actually spends on day-to-day)
  const manualExpenses = expenses.reduce((s, e) => s + (e.amount > 0 ? e.amount : 0), 0);

  const INFLATION_RATE = 0.03; // 3% annual inflation

  if (data.length === 0) {
    return (
      <div
        className="rounded-xl border border-stone-200 bg-white p-5 text-center"
        data-testid="expense-breakdown-chart"
      >
        <p className="text-sm text-stone-400">
          Add expenses to see your spending breakdown
        </p>
      </div>
    );
  }

  // Build horizontal bar data — each slice is one bar entry
  const barData = data.map((slice, i) => ({
    ...slice,
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <div
      className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
      data-testid="expense-breakdown-chart"
    >
      <h3 className="mb-3 text-sm font-medium text-stone-500">
        Spending Breakdown
      </h3>

      {/* Income vs Expenses comparison bar */}
      {incomeForComparison > 0 && (
        <div className="mb-4" data-testid="income-vs-expenses">
          <div className="mb-1 flex items-center justify-between text-xs text-stone-500">
            <span>Expenses: {formatCurrency(totalExpenses)}/mo</span>
            <span>{hasTaxSlice ? "Gross Income" : "Income"}: {formatCurrency(incomeForComparison)}/mo</span>
          </div>
          <div className="relative h-4 w-full overflow-hidden rounded-full bg-stone-100">
            {/* Expense fill */}
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min((totalExpenses / incomeForComparison) * 100, 100)}%`,
                backgroundColor:
                  totalExpenses > incomeForComparison ? "#dc2626" : "#059669",
              }}
            />
            {/* Show surplus gap annotation if income > expenses */}
            {incomeForComparison > totalExpenses && (
              <div
                className="absolute inset-y-0 rounded-r-full bg-emerald-100 border-l-2 border-dashed border-emerald-400"
                style={{
                  left: `${(totalExpenses / incomeForComparison) * 100}%`,
                  width: `${((incomeForComparison - totalExpenses) / incomeForComparison) * 100}%`,
                }}
              />
            )}
          </div>
          {incomeForComparison > totalExpenses ? (
            <p className="mt-1 text-xs text-emerald-600">
              {formatCurrency(incomeForComparison - totalExpenses)}/mo surplus
            </p>
          ) : incomeForComparison < totalExpenses ? (
            <p className="mt-1 text-xs text-rose-600">
              {formatCurrency(totalExpenses - incomeForComparison)}/mo over budget
            </p>
          ) : null}
        </div>
      )}

      {/* Spending power & inflation */}
      {spendingPower > 0 && (
        <div className="mb-4 rounded-lg bg-stone-50 px-3 py-2.5 space-y-1.5" data-testid="spending-power">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-500">Spending Power</span>
            <span className="text-xs font-medium text-stone-800">{formatCurrency(spendingPower)}/mo</span>
          </div>
          {manualExpenses > 0 && manualExpenses < spendingPower && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-400">Discretionary remaining</span>
              <span className="text-xs font-medium text-emerald-600">{formatCurrency(spendingPower - manualExpenses)}/mo</span>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-stone-200 pt-1.5">
            <span className="text-xs text-stone-400 flex items-center gap-1">
              <svg className="h-3 w-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
              After inflation ({(INFLATION_RATE * 100).toFixed(0)}%/yr)
            </span>
            <span className="text-xs text-amber-600">{formatCurrency(spendingPower * (1 - INFLATION_RATE))}/mo in 1yr</span>
          </div>
        </div>
      )}

      {/* Horizontal bar chart */}
      <div
        className="w-full"
        style={{ height: Math.max(data.length * 36 + 20, 80) }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={barData}
            layout="vertical"
            margin={{ top: 0, right: 10, bottom: 0, left: 0 }}
          >
            <XAxis
              type="number"
              hide
              domain={[0, "dataMax"]}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fontSize: 11, fill: "#78716c" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
            />
            {incomeForComparison > 0 && (
              <ReferenceLine
                x={incomeForComparison}
                stroke="#059669"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            )}
            <Bar
              dataKey="value"
              radius={[0, 4, 4, 0]}
              animationDuration={600}
              animationEasing="ease-out"
            >
              {barData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.fill}
                  className="cursor-pointer transition-opacity duration-150 hover:opacity-80"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Compact legend with values */}
      <div className="mt-3 space-y-1">
        {data.map((slice, i) => (
          <div
            key={slice.name}
            className="flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-stone-600">{slice.name}</span>
              {slice.isAuto && (
                <span className="inline-flex items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
                  auto
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-stone-800 font-medium">
                {formatCurrency(slice.value)}
              </span>
              <span className="text-stone-400 w-10 text-right">
                {slice.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
