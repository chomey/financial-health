"use client";

import { useState } from "react";
import AssetEntry from "@/components/AssetEntry";
import DebtEntry from "@/components/DebtEntry";
import IncomeEntry from "@/components/IncomeEntry";
import ExpenseEntry from "@/components/ExpenseEntry";
import GoalEntry from "@/components/GoalEntry";
import SnapshotDashboard from "@/components/SnapshotDashboard";
import {
  INITIAL_STATE,
  computeMetrics,
  toFinancialData,
} from "@/lib/financial-state";
import type { Asset } from "@/components/AssetEntry";
import type { Debt } from "@/components/DebtEntry";
import type { IncomeItem } from "@/components/IncomeEntry";
import type { ExpenseItem } from "@/components/ExpenseEntry";
import type { Goal } from "@/components/GoalEntry";

export default function Home() {
  const [assets, setAssets] = useState<Asset[]>(INITIAL_STATE.assets);
  const [debts, setDebts] = useState<Debt[]>(INITIAL_STATE.debts);
  const [income, setIncome] = useState<IncomeItem[]>(INITIAL_STATE.income);
  const [expenses, setExpenses] = useState<ExpenseItem[]>(INITIAL_STATE.expenses);
  const [goals, setGoals] = useState<Goal[]>(INITIAL_STATE.goals);

  const state = { assets, debts, income, expenses, goals };
  const metrics = computeMetrics(state);
  const financialData = toFinancialData(state);

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl font-bold text-stone-900">
            Financial Health Snapshot
          </h1>
          <p className="text-sm text-stone-500">
            Your finances at a glance — no judgment, just clarity
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Entry Panel — left side on desktop, top on mobile */}
          <section
            className="lg:col-span-7"
            aria-label="Financial data entry"
          >
            <div className="space-y-6">
              <AssetEntry items={assets} onChange={setAssets} />

              <DebtEntry items={debts} onChange={setDebts} />

              <IncomeEntry items={income} onChange={setIncome} />

              <ExpenseEntry items={expenses} onChange={setExpenses} />

              <GoalEntry items={goals} onChange={setGoals} />
            </div>
          </section>

          {/* Dashboard Panel — right side on desktop, bottom on mobile */}
          <section
            className="lg:col-span-5"
            aria-label="Financial dashboard"
          >
            <div className="lg:sticky lg:top-8">
              <SnapshotDashboard metrics={metrics} financialData={financialData} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
