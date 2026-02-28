"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import AssetEntry from "@/components/AssetEntry";
import DebtEntry from "@/components/DebtEntry";
import PropertyEntry from "@/components/PropertyEntry";
import StockEntry from "@/components/StockEntry";
import IncomeEntry from "@/components/IncomeEntry";
import ExpenseEntry from "@/components/ExpenseEntry";
import GoalEntry from "@/components/GoalEntry";
import SnapshotDashboard from "@/components/SnapshotDashboard";
import ProjectionChart from "@/components/ProjectionChart";
import {
  INITIAL_STATE,
  computeMetrics,
  toFinancialData,
} from "@/lib/financial-state";
import { getStateFromURL, updateURL } from "@/lib/url-state";
import type { Asset } from "@/components/AssetEntry";
import type { Debt } from "@/components/DebtEntry";
import type { Property } from "@/components/PropertyEntry";
import type { StockHolding } from "@/components/StockEntry";
import type { IncomeItem } from "@/components/IncomeEntry";
import type { ExpenseItem } from "@/components/ExpenseEntry";
import type { Goal } from "@/components/GoalEntry";

function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const input = document.createElement("input");
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  return (
    <button
      onClick={handleCopy}
      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-600 shadow-sm transition-all duration-200 hover:border-stone-300 hover:bg-stone-50 hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 active:scale-95"
      aria-label="Copy link to clipboard"
    >
      {copied ? (
        <>
          <svg
            className="h-4 w-4 text-emerald-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-emerald-600">Copied!</span>
        </>
      ) : (
        <>
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          Copy Link
        </>
      )}
    </button>
  );
}

export default function Home() {
  // Always initialize with INITIAL_STATE for both server and client to avoid hydration mismatch.
  // URL state is loaded after mount via useEffect.
  const [assets, setAssets] = useState<Asset[]>(INITIAL_STATE.assets);
  const [debts, setDebts] = useState<Debt[]>(INITIAL_STATE.debts);
  const [properties, setProperties] = useState<Property[]>(INITIAL_STATE.properties);
  const [stocks, setStocks] = useState<StockHolding[]>(INITIAL_STATE.stocks);
  const [income, setIncome] = useState<IncomeItem[]>(INITIAL_STATE.income);
  const [expenses, setExpenses] = useState<ExpenseItem[]>(INITIAL_STATE.expenses);
  const [goals, setGoals] = useState<Goal[]>(INITIAL_STATE.goals);
  const isFirstRender = useRef(true);

  // Restore state from URL after hydration — prevents server/client mismatch
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const urlState = getStateFromURL();
    if (urlState) {
      setAssets(urlState.assets);
      setDebts(urlState.debts);
      setProperties(urlState.properties);
      setStocks(urlState.stocks);
      setIncome(urlState.income);
      setExpenses(urlState.expenses);
      setGoals(urlState.goals);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Update URL whenever state changes (skip the initial render to avoid unnecessary write)
  useEffect(() => {
    if (isFirstRender.current) {
      // Still write the URL on first render so the s= param is always present
      isFirstRender.current = false;
    }
    updateURL({ assets, debts, properties, stocks, income, expenses, goals });
  }, [assets, debts, properties, stocks, income, expenses, goals]);

  const state = { assets, debts, properties, stocks, income, expenses, goals };
  const metrics = computeMetrics(state);
  const financialData = toFinancialData(state);
  const totalInvestmentContributions = assets.reduce((sum, a) => sum + (a.monthlyContribution ?? 0), 0);

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white px-4 py-3 shadow-sm sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-stone-900 sm:text-2xl">
              Financial Health Snapshot
            </h1>
            <p className="text-xs text-stone-500 sm:text-sm">
              Your finances at a glance — no judgment, just clarity
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <CopyLinkButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Projection Chart — full-width above the two-column layout */}
        <section className="mb-8" aria-label="Financial projections">
          <ProjectionChart state={state} />
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Entry Panel — left side on desktop, top on mobile */}
          <section
            className="lg:col-span-7"
            aria-label="Financial data entry"
          >
            <div className="space-y-6">
              <AssetEntry items={assets} onChange={setAssets} />

              <DebtEntry items={debts} onChange={setDebts} />

              <PropertyEntry items={properties} onChange={setProperties} />

              <StockEntry items={stocks} onChange={setStocks} />

              <IncomeEntry items={income} onChange={setIncome} />

              <ExpenseEntry items={expenses} onChange={setExpenses} investmentContributions={totalInvestmentContributions} />

              <GoalEntry items={goals} onChange={setGoals} />
            </div>
          </section>

          {/* Dashboard Panel — right side on desktop, bottom on mobile */}
          <section
            className="lg:col-span-5"
            aria-label="Financial dashboard"
          >
            <div className="lg:sticky lg:top-8 overflow-visible space-y-6">
              <SnapshotDashboard metrics={metrics} financialData={financialData} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
