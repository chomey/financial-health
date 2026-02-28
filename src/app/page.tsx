"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import AssetEntry from "@/components/AssetEntry";
import DebtEntry from "@/components/DebtEntry";
import PropertyEntry from "@/components/PropertyEntry";
import StockEntry from "@/components/StockEntry";
import IncomeEntry from "@/components/IncomeEntry";
import ExpenseEntry from "@/components/ExpenseEntry";
import SnapshotDashboard from "@/components/SnapshotDashboard";
import ProjectionChart from "@/components/ProjectionChart";
import CountryJurisdictionSelector from "@/components/CountryJurisdictionSelector";
import AssetAllocationChart from "@/components/AssetAllocationChart";
import ExpenseBreakdownChart from "@/components/ExpenseBreakdownChart";
import NetWorthWaterfallChart from "@/components/NetWorthWaterfallChart";
import FastForwardPanel from "@/components/FastForwardPanel";
import BenchmarkComparisons from "@/components/BenchmarkComparisons";
import CashFlowSankey from "@/components/CashFlowSankey";
import InsightsPanel from "@/components/InsightsPanel";
import {
  INITIAL_STATE,
  computeMetrics,
  computeTotals,
  toFinancialData,
} from "@/lib/financial-state";
import { getStateFromURL, updateURL } from "@/lib/url-state";
import type { Asset } from "@/components/AssetEntry";
import type { Debt } from "@/components/DebtEntry";
import type { Property } from "@/components/PropertyEntry";
import type { StockHolding } from "@/components/StockEntry";
import { getPortfolioSummary, getAnnualizedReturn } from "@/components/StockEntry";
import type { IncomeItem } from "@/components/IncomeEntry";
import type { ExpenseItem } from "@/components/ExpenseEntry";

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

function CollapsibleSection({
  title,
  icon,
  summary,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: string;
  summary?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm text-left transition-all duration-200 hover:shadow-md hover:bg-stone-50"
        aria-expanded={false}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span aria-hidden="true">{icon}</span>
          <h2 className="text-base font-semibold text-stone-800">{title}</h2>
          {summary && (
            <span className="ml-2 text-sm text-stone-400 truncate">{summary}</span>
          )}
        </div>
        <svg
          className="h-4 w-4 flex-shrink-0 text-stone-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="absolute right-3 top-3 z-10 rounded-md p-1 text-stone-400 transition-colors duration-150 hover:bg-stone-100 hover:text-stone-600"
        aria-expanded={true}
        aria-label={`Collapse ${title}`}
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>
      {children}
    </div>
  );
}

function formatCurrencySummary(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (Math.abs(amount) >= 1_000) return `$${(amount / 1_000).toFixed(0)}k`;
  return `$${amount.toFixed(0)}`;
}

export default function Home() {
  const [assets, setAssets] = useState<Asset[]>(INITIAL_STATE.assets);
  const [debts, setDebts] = useState<Debt[]>(INITIAL_STATE.debts);
  const [properties, setProperties] = useState<Property[]>(INITIAL_STATE.properties);
  const [stocks, setStocks] = useState<StockHolding[]>(INITIAL_STATE.stocks);
  const [income, setIncome] = useState<IncomeItem[]>(INITIAL_STATE.income);
  const [expenses, setExpenses] = useState<ExpenseItem[]>(INITIAL_STATE.expenses);
  const [country, setCountry] = useState<"CA" | "US">(INITIAL_STATE.country ?? "CA");
  const [jurisdiction, setJurisdiction] = useState<string>(INITIAL_STATE.jurisdiction ?? "ON");
  const [age, setAge] = useState<number | undefined>(INITIAL_STATE.age);
  const isFirstRender = useRef(true);

  // Restore state from URL after hydration
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
      if (urlState.country) setCountry(urlState.country);
      if (urlState.jurisdiction) setJurisdiction(urlState.jurisdiction);
      if (urlState.age !== undefined) setAge(urlState.age);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Update URL whenever state changes (skip initial render to keep URL clean with defaults)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    updateURL({ assets, debts, properties, stocks, income, expenses, country, jurisdiction, age });
  }, [assets, debts, properties, stocks, income, expenses, country, jurisdiction, age]);

  const state = { assets, debts, properties, stocks, income, expenses, country, jurisdiction, age };
  const metrics = computeMetrics(state);
  const financialData = toFinancialData(state);
  const totals = computeTotals(state);
  const totalInvestmentContributions = assets.reduce((sum, a) => sum + (a.monthlyContribution ?? 0), 0);
  const totalMortgagePayments = totals.totalMortgagePayments;
  const monthlySurplus = totals.monthlyAfterTaxIncome - totals.monthlyExpenses - totals.totalMonthlyContributions - totalMortgagePayments;
  const surplusTargetName = assets.find((a) => a.surplusTarget)?.category ?? assets[0]?.category;

  // Summaries for collapsed sections
  const assetTotal = assets.reduce((sum, a) => sum + a.amount, 0);
  const debtTotal = debts.reduce((sum, d) => sum + d.amount, 0);
  const incomeTotal = income.reduce((sum, i) => sum + i.amount, 0);
  const expenseTotal = expenses.reduce((sum, e) => sum + e.amount, 0) + totalInvestmentContributions + totalMortgagePayments;
  const propertyCount = properties.length;
  const stockCount = stocks.length;

  // Benchmark comparison values
  const benchmarkNetWorth = totals.totalAssets + totals.totalStocks + totals.totalPropertyEquity - totals.totalDebts;
  // Savings rate includes surplus + investment contributions (which are a form of saving)
  const benchmarkSavingsRate = totals.monthlyAfterTaxIncome > 0 ? (monthlySurplus + totals.totalMonthlyContributions) / totals.monthlyAfterTaxIncome : 0;
  const benchmarkEmergencyMonths = totals.monthlyExpenses > 0 ? (totals.totalAssets + totals.totalStocks) / totals.monthlyExpenses : 0;
  const annualIncome = totals.monthlyIncome * 12;
  const benchmarkDebtToIncome = annualIncome > 0 ? (debtTotal + totals.totalPropertyMortgage) / annualIncome : 0;

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
            <CountryJurisdictionSelector
              country={country}
              jurisdiction={jurisdiction}
              onCountryChange={setCountry}
              onJurisdictionChange={setJurisdiction}
            />
            <CopyLinkButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Projection Chart — full-width above the two-column layout */}
        <section className="mb-6 space-y-4" aria-label="Financial projections">
          <ProjectionChart state={state} />
          <InsightsPanel data={financialData} />
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Entry Panel — left side on desktop, top on mobile */}
          <section
            className="lg:col-span-7"
            aria-label="Financial data entry"
          >
            <div className="space-y-3">
              <CollapsibleSection title="Assets" icon="💰" summary={formatCurrencySummary(assetTotal)}>
                <AssetEntry items={assets} onChange={setAssets} monthlySurplus={monthlySurplus} />
              </CollapsibleSection>

              <CollapsibleSection title="Debts" icon="💳" summary={debtTotal > 0 ? formatCurrencySummary(debtTotal) : "None"}>
                <DebtEntry items={debts} onChange={setDebts} />
              </CollapsibleSection>

<CollapsibleSection title="Income" icon="💵" summary={formatCurrencySummary(incomeTotal)}>
                <IncomeEntry items={income} onChange={setIncome} />
              </CollapsibleSection>

              <CollapsibleSection title="Expenses" icon="🧾" summary={formatCurrencySummary(expenseTotal)}>
                <ExpenseEntry items={expenses} onChange={setExpenses} investmentContributions={totalInvestmentContributions} mortgagePayments={totalMortgagePayments} surplus={monthlySurplus} surplusTargetName={surplusTargetName} federalTax={totals.totalFederalTax / 12} provincialStateTax={totals.totalProvincialStateTax / 12} country={country} isUnderwater={monthlySurplus < 0} />
              </CollapsibleSection>

              <CollapsibleSection title="Property" icon="🏠" summary={propertyCount > 0 ? `${propertyCount} propert${propertyCount !== 1 ? "ies" : "y"}` : "None"}>
                <PropertyEntry items={properties} onChange={setProperties} />
              </CollapsibleSection>

              <CollapsibleSection title="Stocks" icon="📊" summary={stockCount > 0 ? `${stockCount} holding${stockCount !== 1 ? "s" : ""}` : "None"}>
                <StockEntry items={stocks} onChange={setStocks} />
              </CollapsibleSection>
            </div>
          </section>

          {/* Dashboard Panel — right side on desktop, bottom on mobile */}
          <section
            className="lg:col-span-5"
            aria-label="Financial dashboard"
          >
            <div className="lg:sticky lg:top-8 overflow-visible space-y-6">
              <SnapshotDashboard metrics={metrics} financialData={financialData} />
              {stocks.length > 0 && (() => {
                const portfolio = getPortfolioSummary(stocks);
                const stocksWithReturns = stocks
                  .map((s) => ({ ticker: s.ticker, annualized: getAnnualizedReturn(s) }))
                  .filter((s) => s.annualized !== null) as { ticker: string; annualized: number }[];
                return (
                  <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5" data-testid="portfolio-performance">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-stone-500">Portfolio Performance</h3>
                      <span className="text-lg" aria-hidden="true">📊</span>
                    </div>
                    <p className={`mt-1.5 text-3xl font-bold ${portfolio.totalGainLoss >= 0 ? "text-green-600" : "text-rose-600"}`}>
                      {portfolio.totalGainLoss >= 0 ? "+" : ""}{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(portfolio.totalGainLoss)}
                    </p>
                    {portfolio.totalCostBasis > 0 && (
                      <p className="mt-0.5 text-sm text-stone-500" data-testid="portfolio-return-pct">
                        {portfolio.overallReturnPct >= 0 ? "+" : ""}{portfolio.overallReturnPct.toFixed(1)}% overall return
                      </p>
                    )}
                    {stocksWithReturns.length > 0 && (
                      <div className="mt-2 space-y-0.5">
                        {stocksWithReturns.map((s) => (
                          <p key={s.ticker} className="text-xs text-stone-400">
                            <span className="font-mono font-medium text-stone-500">{s.ticker}</span>{" "}
                            <span className={s.annualized >= 0 ? "text-green-500" : "text-rose-500"}>
                              {s.annualized >= 0 ? "+" : ""}{s.annualized.toFixed(1)}%/yr
                            </span>
                          </p>
                        ))}
                      </div>
                    )}
                    <p className="mt-1.5 text-xs text-stone-400 leading-relaxed">
                      Total gain/loss across your stock holdings based on cost basis. Annualized returns shown for holdings with purchase dates.
                    </p>
                  </div>
                );
              })()}
              <ExpenseBreakdownChart
                expenses={expenses}
                investmentContributions={totalInvestmentContributions}
                mortgagePayments={totalMortgagePayments}
                federalTax={totals.totalFederalTax / 12}
                provincialStateTax={totals.totalProvincialStateTax / 12}
                monthlyAfterTaxIncome={totals.monthlyAfterTaxIncome}
                monthlyGrossIncome={totals.monthlyIncome}
              />
              <AssetAllocationChart
                assets={assets}
                properties={properties}
                stocks={stocks}
              />
              <NetWorthWaterfallChart
                assets={assets}
                debts={debts}
                properties={properties}
                stocks={stocks}
              />
              <CashFlowSankey
                income={income}
                expenses={expenses}
                investmentContributions={totalInvestmentContributions}
                mortgagePayments={totalMortgagePayments}
                monthlyFederalTax={totals.totalFederalTax / 12}
                monthlyProvincialTax={totals.totalProvincialStateTax / 12}
                monthlySurplus={monthlySurplus}
              />
              <BenchmarkComparisons
                age={age}
                country={country}
                netWorth={benchmarkNetWorth}
                savingsRate={benchmarkSavingsRate}
                emergencyMonths={benchmarkEmergencyMonths}
                debtToIncomeRatio={benchmarkDebtToIncome}
                onAgeChange={setAge}
              />
            </div>
          </section>
        </div>

        {/* What If scenario panel — full-width at the bottom */}
        <section className="mt-8" aria-label="Scenario modeling">
          <FastForwardPanel state={state} />
        </section>
      </main>
    </div>
  );
}
