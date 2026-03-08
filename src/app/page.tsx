"use client";

// Suppress Recharts dimension warnings for collapsed/hidden chart containers
if (typeof window !== "undefined") {
  const origError = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("The width(-1) and height(-1)")) return;
    origError.apply(console, args);
  };
}

import AssetEntry from "@/components/AssetEntry";
import DebtEntry from "@/components/DebtEntry";
import PropertyEntry from "@/components/PropertyEntry";
import StockEntry, { getStockValue } from "@/components/StockEntry";
import IncomeEntry from "@/components/IncomeEntry";
import ExpenseEntry from "@/components/ExpenseEntry";
import SnapshotDashboard, { type DataFlowConnectionDef } from "@/components/SnapshotDashboard";
import ProjectionChart from "@/components/ProjectionChart";
import CountryJurisdictionSelector from "@/components/CountryJurisdictionSelector";
import ExpenseBreakdownChart from "@/components/ExpenseBreakdownChart";
import NetWorthDonutChart from "@/components/NetWorthDonutChart";
import FastForwardPanel from "@/components/FastForwardPanel";
import BenchmarkComparisons from "@/components/BenchmarkComparisons";
import CashFlowSankey from "@/components/CashFlowSankey";
import FxRateDisplay from "@/components/FxRateDisplay";
import InsightsPanel from "@/components/InsightsPanel";
import ZoomableCard from "@/components/ZoomableCard";
import { DataFlowProvider, type SourceMetadataItem } from "@/components/DataFlowArrows";
import { CurrencyProvider } from "@/lib/CurrencyContext";
import {
  computeMetrics,
  computeTotals,
  computeMonthlyInvestmentReturns,
  toFinancialData,
} from "@/lib/financial-state";
import { getProfilesForCountry } from "@/lib/sample-profiles";
import MobileWizard from "@/components/MobileWizard";
import { formatCurrencyCompact } from "@/lib/currency";
import { getDefaultRoiTaxTreatment } from "@/components/AssetEntry";
import { computeMortgageBreakdown, DEFAULT_INTEREST_RATE } from "@/components/PropertyEntry";
import { getPortfolioSummary, getAnnualizedReturn } from "@/components/StockEntry";
import { normalizeToMonthly } from "@/components/IncomeEntry";
import TaxCreditEntry from "@/components/TaxCreditEntry";
import { getFilingStatuses } from "@/lib/tax-credits";
import {
  PrintSnapshotButton,
  PrintFooter,
  CopyLinkButton,
  AgeInputHeader,
  WelcomeBanner,
  CollapsibleSection,
  formatCurrencySummary,
} from "@/app/_page-helpers";
import { useFinancialState } from "@/app/_use-financial-state";

export default function Home() {
  const {
    assets,
    debts,
    properties,
    stocks,
    income,
    expenses,
    country,
    jurisdiction,
    age,
    federalTaxOverride,
    provincialTaxOverride,
    fxManualOverride,
    taxCredits,
    filingStatus,
    showSampleProfiles,
    showWizard,
    safeWithdrawalRate,
    outlookYears,
    surplusTargetComputedId,
    homeCurrency,
    foreignCurrency,
    effectiveFxRates,
    setAge,
    setJurisdiction,
    setFilingStatus,
    setFxManualOverride,
    setShowSampleProfiles,
    setOutlookYears,
    setTaxCredits,
    setDebts,
    setIncome,
    setExpenses,
    setProperties,
    setStocks,
    setFederalTaxOverride,
    setProvincialTaxOverride,
    handleAssetsChange,
    loadProfile,
    handleCountryChange,
    clearAll,
    handleWizardComplete,
    handleWizardSkip,
    handleSwrChange,
  } = useFinancialState();

  const state = { assets, debts, properties, stocks, income, expenses, country, jurisdiction, age, federalTaxOverride, provincialTaxOverride, surplusTargetComputedId, fxRates: effectiveFxRates, fxManualOverride, taxCredits, filingStatus };
  const metrics = computeMetrics(state);
  const runwayDetails = metrics.find(m => m.title === "Financial Runway")?.runwayDetails;
  const financialData = { ...toFinancialData(state), outlookYears };
  const totals = computeTotals(state);
  const totalInvestmentContributions = assets.filter((a) => !a.computed).reduce((sum, a) => sum + (a.monthlyContribution ?? 0), 0);
  const totalMortgagePayments = totals.totalMortgagePayments;
  const monthlyInvestmentReturns = computeMonthlyInvestmentReturns(assets);
  const totalMonthlyInvestmentReturns = monthlyInvestmentReturns.reduce((sum, r) => sum + r.amount, 0);
  const monthlySurplus = totals.monthlyAfterTaxIncome + totalMonthlyInvestmentReturns - totals.monthlyExpenses - totals.totalMonthlyContributions - totalMortgagePayments - totals.totalDebtPayments;
  const annualEmploymentSalary = income.reduce((sum, i) => {
    if ((i.incomeType ?? "employment") !== "employment") return sum;
    return sum + normalizeToMonthly(i.amount, i.frequency) * 12;
  }, 0);
  const realAssets = assets.filter((a) => !a.computed);
  const surplusTargetName = realAssets.find((a) => a.surplusTarget)?.category ?? realAssets[0]?.category;

  // Summaries for collapsed sections — use converted totals from computeTotals
  const assetTotal = totals.totalAssets;
  const debtTotal = totals.totalDebts;
  const incomeTotal = totals.monthlyIncome;
  const expenseTotal = totals.monthlyExpenses;
  const propertyCount = properties.length;
  const stockCount = stocks.length;

  // Build item-level data for source summary cards in explainer modal
  const assetItems: SourceMetadataItem[] = assets.filter((a) => !a.computed).map((a) => ({ label: a.category, value: a.amount, currency: a.currency }));
  const debtItems: SourceMetadataItem[] = debts.map((d) => ({ label: d.category, value: d.amount, currency: d.currency }));
  const incomeItems: SourceMetadataItem[] = [
    ...income.map((i) => ({ label: i.category, value: normalizeToMonthly(i.amount, i.frequency) })),
    ...monthlyInvestmentReturns.map((r) => ({ label: `${r.label} returns`, value: Math.round(r.amount) })),
  ];
  const expenseItems: SourceMetadataItem[] = expenses.map((e) => ({ label: e.category, value: e.amount }));
  const propertyItems: SourceMetadataItem[] = properties.map((p) => ({ label: p.name, value: Math.max(0, p.value - p.mortgage), currency: p.currency }));
  const stockItems: SourceMetadataItem[] = stocks.map((s) => ({ label: s.ticker, value: getStockValue(s) }));

  // Data-flow connections for metric cards
  const fmtLabel = (v: number) => {
    const sign = v >= 0 ? "+" : "-";
    return `${sign}${formatCurrencyCompact(Math.abs(v), homeCurrency, homeCurrency)}`;
  };

  const netWorthConnections: DataFlowConnectionDef[] = [
    { sourceId: "section-assets", label: fmtLabel(totals.totalAssets), value: totals.totalAssets, sign: "positive" },
    { sourceId: "section-stocks", label: fmtLabel(totals.totalStocks), value: totals.totalStocks, sign: "positive" },
    ...(totals.totalPropertyEquity > 0 ? [{ sourceId: "section-property", label: fmtLabel(totals.totalPropertyEquity), value: totals.totalPropertyEquity, sign: "positive" as const }] : []),
    { sourceId: "section-debts", label: fmtLabel(-totals.totalDebts), value: totals.totalDebts, sign: "negative" },
  ];

  const incomeAndReturnsTotal = totals.monthlyIncome + totalMonthlyInvestmentReturns;
  const monthlyTaxes = totals.monthlyIncome - totals.monthlyAfterTaxIncome;

  // Compute mortgage principal/interest breakdown for explainer
  const mortgageItems: { label: string; value: number }[] = [];
  if (totalMortgagePayments > 0) {
    let totalInterest = 0;
    let totalPrincipal = 0;
    for (const prop of properties) {
      if (prop.mortgage > 0 && prop.monthlyPayment && prop.monthlyPayment > 0) {
        const rate = prop.interestRate ?? DEFAULT_INTEREST_RATE;
        const { interestPortion, principalPortion } = computeMortgageBreakdown(prop.mortgage, rate, prop.monthlyPayment);
        totalInterest += interestPortion;
        totalPrincipal += principalPortion;
      }
    }
    if (totalInterest > 0) mortgageItems.push({ label: "Interest", value: Math.round(totalInterest) });
    if (totalPrincipal > 0) mortgageItems.push({ label: "Principal", value: Math.round(totalPrincipal) });
  }

  const monthlySurplusConnections: DataFlowConnectionDef[] = [
    { sourceId: "section-income", label: fmtLabel(incomeAndReturnsTotal), value: incomeAndReturnsTotal, sign: "positive" },
    ...(monthlyTaxes > 0 ? [{ sourceId: "virtual-taxes", label: `taxes ${fmtLabel(-monthlyTaxes)}`, value: monthlyTaxes, sign: "negative" as const }] : []),
    { sourceId: "section-expenses", label: fmtLabel(-totals.monthlyExpenses), value: totals.monthlyExpenses, sign: "negative" },
    ...(totals.totalMonthlyContributions > 0 ? [{ sourceId: "virtual-contributions", label: `contributions ${fmtLabel(-totals.totalMonthlyContributions)}`, value: totals.totalMonthlyContributions, sign: "negative" as const }] : []),
    ...(totalMortgagePayments > 0 ? [{ sourceId: "virtual-mortgage", label: `mortgage ${fmtLabel(-totalMortgagePayments)}`, value: totalMortgagePayments, sign: "negative" as const, items: mortgageItems.length > 0 ? mortgageItems : undefined }] : []),
    ...(totals.totalDebtPayments > 0 ? [{ sourceId: "section-debts", label: `debt payments ${fmtLabel(-totals.totalDebtPayments)}`, value: totals.totalDebtPayments, sign: "negative" as const }] : []),
  ];

  // Estimated Tax: green arrow from income showing gross income, label with effective rate + annual tax
  const estimatedTaxConnections: DataFlowConnectionDef[] = [
    { sourceId: "section-income", label: totals.effectiveTaxRate > 0 ? `${(totals.effectiveTaxRate * 100).toFixed(1)}% of ${fmtLabel(totals.monthlyIncome * 12).replace(/^[+-]/, "")}` : fmtLabel(totals.monthlyIncome * 12), value: totals.monthlyIncome, sign: "positive" },
  ];

  // Financial Runway: liquid assets (green) / monthly obligations (red)
  const financialRunwayConnections: DataFlowConnectionDef[] = [
    { sourceId: "section-assets", label: fmtLabel(totals.totalAssets), value: totals.totalAssets, sign: "positive" },
    { sourceId: "section-stocks", label: fmtLabel(totals.totalStocks), value: totals.totalStocks, sign: "positive" },
    { sourceId: "section-expenses", label: fmtLabel(-totals.monthlyExpenses), value: totals.monthlyExpenses, sign: "negative" },
    ...(totalMortgagePayments > 0 ? [{ sourceId: "section-property", label: `mortgage ${fmtLabel(-totalMortgagePayments)}`, value: totalMortgagePayments, sign: "negative" as const }] : []),
    ...(totals.totalDebtPayments > 0 ? [{ sourceId: "section-debts", label: `debt payments ${fmtLabel(-totals.totalDebtPayments)}`, value: totals.totalDebtPayments, sign: "negative" as const }] : []),
  ];

  // Debt-to-Asset Ratio: all assets (green) vs all debts (red)
  const debtToAssetConnections: DataFlowConnectionDef[] = [
    { sourceId: "section-assets", label: fmtLabel(totals.totalAssets), value: totals.totalAssets, sign: "positive" },
    { sourceId: "section-stocks", label: fmtLabel(totals.totalStocks), value: totals.totalStocks, sign: "positive" },
    ...(totals.totalPropertyValue > 0 ? [{ sourceId: "section-property", label: `value ${fmtLabel(totals.totalPropertyValue)}`, value: totals.totalPropertyValue, sign: "positive" as const }] : []),
    { sourceId: "section-debts", label: fmtLabel(-totals.totalDebts), value: totals.totalDebts, sign: "negative" },
    ...(totals.totalPropertyMortgage > 0 ? [{ sourceId: "section-property", label: `mortgage ${fmtLabel(-totals.totalPropertyMortgage)}`, value: totals.totalPropertyMortgage, sign: "negative" as const }] : []),
  ];

  // Income Replacement: invested assets (green) driving the 4% withdrawal
  const incomeReplacementConnections: DataFlowConnectionDef[] = [
    { sourceId: "section-assets", label: fmtLabel(totals.totalAssets), value: totals.totalAssets, sign: "positive" as const },
    ...(totals.totalStocks > 0 ? [{ sourceId: "section-stocks", label: fmtLabel(totals.totalStocks), value: totals.totalStocks, sign: "positive" as const }] : []),
  ].filter((c) => c.value > 0);

  const dataFlowConnections: Record<string, DataFlowConnectionDef[]> = {
    "Net Worth": netWorthConnections,
    "Monthly Cash Flow": monthlySurplusConnections,
    "Estimated Tax": estimatedTaxConnections,
    "Financial Runway": financialRunwayConnections,
    "Debt-to-Asset Ratio": debtToAssetConnections,
    "Income Replacement": incomeReplacementConnections,
  };

  // Insight-type data-flow connections (keyed by InsightType)
  const insightConnections: Record<string, DataFlowConnectionDef[]> = {
    "runway": [
      { sourceId: "section-assets", label: fmtLabel(totals.totalAssets), value: totals.totalAssets, sign: "positive" },
      { sourceId: "section-expenses", label: fmtLabel(-totals.monthlyExpenses), value: totals.monthlyExpenses, sign: "negative" },
    ],
    "surplus": [
      { sourceId: "section-income", label: fmtLabel(totals.monthlyAfterTaxIncome), value: totals.monthlyAfterTaxIncome, sign: "positive" },
      { sourceId: "section-expenses", label: fmtLabel(-totals.monthlyExpenses), value: totals.monthlyExpenses, sign: "negative" },
    ],
    "net-worth": [
      { sourceId: "section-assets", label: fmtLabel(totals.totalAssets), value: totals.totalAssets, sign: "positive" },
      { sourceId: "section-debts", label: fmtLabel(-totals.totalDebts), value: totals.totalDebts, sign: "negative" },
    ],
    "savings-rate": [
      { sourceId: "section-income", label: fmtLabel(totals.monthlyAfterTaxIncome), value: totals.monthlyAfterTaxIncome, sign: "positive" },
      { sourceId: "section-expenses", label: fmtLabel(-totals.monthlyExpenses), value: totals.monthlyExpenses, sign: "negative" },
    ],
    "debt-interest": [
      { sourceId: "section-debts", label: fmtLabel(-totals.totalDebts), value: totals.totalDebts, sign: "negative" },
    ],
    "debt-to-income": [
      { sourceId: "section-debts", label: fmtLabel(-totals.totalDebts), value: totals.totalDebts, sign: "negative" },
      { sourceId: "section-income", label: fmtLabel(totals.monthlyIncome), value: totals.monthlyIncome, sign: "positive" },
    ],
    "housing-cost": [
      { sourceId: "section-income", label: fmtLabel(totals.monthlyIncome), value: totals.monthlyIncome, sign: "positive" },
      ...(totalMortgagePayments > 0
        ? [{ sourceId: "section-property", label: `mortgage ${fmtLabel(-totalMortgagePayments)}`, value: totalMortgagePayments, sign: "negative" as const }]
        : [{ sourceId: "section-expenses", label: fmtLabel(-totals.monthlyExpenses), value: totals.monthlyExpenses, sign: "negative" as const }]),
    ],
    "tax": [
      { sourceId: "section-income", label: fmtLabel(totals.monthlyIncome * 12), value: totals.monthlyIncome, sign: "positive" },
    ],
    "withdrawal-tax": [
      { sourceId: "section-assets", label: fmtLabel(totals.totalAssets), value: totals.totalAssets, sign: "positive" },
    ],
  };

  // Benchmark comparison values
  const benchmarkNetWorth = totals.totalAssets + totals.totalStocks + totals.totalPropertyEquity - totals.totalDebts;
  // Savings rate includes surplus + investment contributions (which are a form of saving)
  const benchmarkSavingsRate = totals.monthlyAfterTaxIncome > 0 ? (monthlySurplus + totals.totalMonthlyContributions) / totals.monthlyAfterTaxIncome : 0;
  const benchmarkMonthlyObligations = totals.monthlyExpenses + totals.totalMortgagePayments + totals.totalDebtPayments;
  const benchmarkEmergencyMonths = benchmarkMonthlyObligations > 0 ? (totals.totalAssets + totals.totalStocks) / benchmarkMonthlyObligations : 0;
  const annualIncome = totals.monthlyIncome * 12;
  const benchmarkDebtToIncome = annualIncome > 0 ? (debtTotal + totals.totalPropertyMortgage) / annualIncome : 0;

  return (
    <CurrencyProvider currency={homeCurrency}>
    <DataFlowProvider homeCurrency={homeCurrency}>
    {/* Guided wizard — full-screen for new users without saved state */}
    {showWizard && (
      <MobileWizard
        country={country}
        onComplete={handleWizardComplete}
        onSkip={handleWizardSkip}
      />
    )}
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur-sm px-4 py-3 shadow-sm sm:px-6 sm:py-4">
        <div className="mx-auto max-w-7xl space-y-2">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-white sm:text-2xl">
                Financial Health Snapshot
              </h1>
              <p className="text-xs text-slate-400 sm:text-sm">
                Your finances at a glance — no judgment, just clarity
                <span className="mx-1.5 text-slate-600">·</span>
                <a
                  href="/changelog"
                  className="text-violet-400 transition-colors duration-200 hover:text-violet-300 hover:underline"
                >
                  Changelog
                </a>
              </p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2 print:hidden">
              <CopyLinkButton />
              <PrintSnapshotButton />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 print:hidden">
            <CountryJurisdictionSelector
              country={country}
              jurisdiction={jurisdiction}
              onCountryChange={handleCountryChange}
              onJurisdictionChange={setJurisdiction}
            />
            <select
              value={filingStatus}
              onChange={(e) => setFilingStatus(e.target.value as typeof filingStatus)}
              className="min-h-[44px] rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-slate-300 transition-all duration-200 hover:border-white/20 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-400 sm:min-h-0"
              aria-label="Filing status"
              data-testid="filing-status-selector"
            >
              {getFilingStatuses(country).map((fs) => (
                <option key={fs.value} value={fs.value} className="bg-slate-800">
                  {fs.label}
                </option>
              ))}
            </select>
            <AgeInputHeader age={age} onAgeChange={setAge} />
            <FxRateDisplay
              homeCurrency={homeCurrency}
              foreignCurrency={foreignCurrency}
              fxRates={effectiveFxRates}
              fxManualOverride={fxManualOverride}
              onManualOverrideChange={setFxManualOverride}
            />
          </div>
        </div>
      </header>

      <nav className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/90 backdrop-blur-sm shadow-sm print:hidden">
        <div className="mx-auto max-w-7xl overflow-x-auto px-4 sm:px-6">
          <div className="flex items-center gap-1 py-1.5 text-sm">
            {[
              { id: "projections", icon: "📈", label: "Projections" },
              { id: "assets", icon: "💰", label: "Assets" },
              { id: "debts", icon: "💳", label: "Debts" },
              { id: "income", icon: "💵", label: "Income" },
              { id: "expenses", icon: "🧾", label: "Expenses" },
              { id: "property", icon: "🏠", label: "Property" },
              { id: "stocks", icon: "📊", label: "Stocks" },
              { id: "dashboard", icon: "🎯", label: "Dashboard" },
              { id: "scenarios", icon: "🔮", label: "What If" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="flex-shrink-0 rounded-md px-2.5 py-1.5 font-medium text-slate-400 transition-all duration-150 hover:bg-white/10 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400 active:scale-95"
              >
                <span aria-hidden="true" className="mr-1">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-8">
        {/* Welcome explainer for first-time visitors */}
        <WelcomeBanner />

        {/* Sample profile picker for new visitors (no URL state) */}
        {showSampleProfiles && (
          <div className="mb-6 rounded-xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 to-emerald-400/5 px-4 py-5 shadow-sm sm:px-6 print:hidden backdrop-blur-sm" data-testid="sample-profiles-banner">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-200 sm:text-lg">Start with a sample profile</h2>
                <p className="mt-0.5 text-sm text-slate-400">See how the tool works with realistic numbers, then edit to match your own.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSampleProfiles(false)}
                className="shrink-0 rounded-md p-1 text-slate-500 transition-colors hover:bg-white/10 hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
                aria-label="Dismiss sample profiles"
                data-testid="sample-profiles-dismiss"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {getProfilesForCountry(country).map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => loadProfile(profile)}
                  className="group flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 p-4 text-left shadow-sm transition-all duration-200 hover:border-cyan-400/40 hover:bg-white/10 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 active:scale-95"
                  data-testid={`sample-profile-${profile.id}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl" aria-hidden="true">{profile.emoji}</span>
                    <span className="font-semibold text-slate-200 text-sm leading-tight group-hover:text-cyan-400 transition-colors duration-150">{profile.name}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{profile.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-auto">
                    {profile.highlights.map((h) => (
                      <span key={h} className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-xs font-medium text-cyan-300 border border-cyan-400/20">{h}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">Or enter your own numbers directly in the sections below.</p>
              <button
                type="button"
                onClick={clearAll}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-400 shadow-sm transition-all duration-150 hover:border-white/20 hover:text-slate-200 hover:shadow focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-1 focus:ring-offset-slate-900 active:scale-95"
                data-testid="clear-all-button"
              >
                Clear all
              </button>
            </div>
          </div>
        )}

        {/* Projection Chart — full-width above the two-column layout */}
        <section id="projections" className="mb-4 sm:mb-6 space-y-3 sm:space-y-4 scroll-mt-16" aria-label="Financial projections">
          <ZoomableCard><ProjectionChart state={state} runwayDetails={runwayDetails ?? undefined} safeWithdrawalRate={safeWithdrawalRate} onOutlookChange={setOutlookYears} /></ZoomableCard>
          <InsightsPanel data={financialData} insightConnections={insightConnections} />
        </section>

        <div className="grid grid-cols-1 gap-4 sm:gap-8 lg:grid-cols-12">
          {/* Entry Panel — left side on desktop, top on mobile */}
          <section
            className="lg:col-span-7 print:hidden"
            aria-label="Financial data entry"
            data-testid="entry-panel"
          >
            <div className="space-y-3">
              <CollapsibleSection id="assets" title="Assets" icon="💰" summary={formatCurrencySummary(assetTotal)} dataFlowId="section-assets" dataFlowValue={assetTotal} dataFlowLabel="Assets" dataFlowItems={assetItems}>
                <AssetEntry items={assets} onChange={handleAssetsChange} monthlySurplus={monthlySurplus} homeCurrency={homeCurrency} fxRates={effectiveFxRates} annualEmploymentSalary={annualEmploymentSalary} />
              </CollapsibleSection>

              <CollapsibleSection id="debts" title="Debts" icon="💳" summary={debtTotal > 0 ? formatCurrencySummary(debtTotal) : "None"} dataFlowId="section-debts" dataFlowValue={debtTotal} dataFlowLabel="Debts" dataFlowItems={debtItems}>
                <DebtEntry items={debts} onChange={setDebts} homeCurrency={homeCurrency} fxRates={effectiveFxRates} />
              </CollapsibleSection>

              <CollapsibleSection id="income" title="Income" icon="💵" summary={formatCurrencySummary(incomeTotal)} dataFlowId="section-income" dataFlowValue={incomeTotal + totalMonthlyInvestmentReturns} dataFlowLabel="Income & Returns" dataFlowItems={incomeItems}>
                <IncomeEntry items={income} onChange={setIncome} investmentReturns={monthlyInvestmentReturns} homeCurrency={homeCurrency} fxRates={effectiveFxRates} />
              </CollapsibleSection>

              <CollapsibleSection id="expenses" title="Expenses" icon="🧾" summary={formatCurrencySummary(expenseTotal)} dataFlowId="section-expenses" dataFlowValue={expenseTotal} dataFlowLabel="Expenses" dataFlowItems={expenseItems}>
                <ExpenseEntry items={expenses} onChange={setExpenses} investmentContributions={totalInvestmentContributions} mortgagePayments={totalMortgagePayments} surplus={monthlySurplus} surplusTargetName={surplusTargetName} federalTax={totals.totalFederalTax / 12} provincialStateTax={totals.totalProvincialStateTax / 12} computedFederalTax={totals.computedFederalTax / 12} computedProvincialStateTax={totals.computedProvincialStateTax / 12} federalTaxOverride={federalTaxOverride !== undefined ? federalTaxOverride / 12 : undefined} provincialTaxOverride={provincialTaxOverride !== undefined ? provincialTaxOverride / 12 : undefined} onFederalTaxOverride={(monthly) => setFederalTaxOverride(monthly !== undefined ? monthly * 12 : undefined)} onProvincialTaxOverride={(monthly) => setProvincialTaxOverride(monthly !== undefined ? monthly * 12 : undefined)} country={country} isUnderwater={monthlySurplus < 0} homeCurrency={homeCurrency} fxRates={effectiveFxRates} />
              </CollapsibleSection>

              <CollapsibleSection id="tax-credits" title="Tax Credits" icon="🏷️" summary={taxCredits.length > 0 ? `${taxCredits.length} credit${taxCredits.length !== 1 ? "s" : ""}` : "None"}>
                <TaxCreditEntry items={taxCredits} onChange={setTaxCredits} country={country} filingStatus={filingStatus} annualIncome={totals.monthlyIncome * 12} />
              </CollapsibleSection>

              <CollapsibleSection id="property" title="Property" icon="🏠" summary={propertyCount > 0 ? `${propertyCount} propert${propertyCount !== 1 ? "ies" : "y"}` : "None"} dataFlowId="section-property" dataFlowValue={totals.totalPropertyEquity} dataFlowLabel="Property" dataFlowItems={propertyItems}>
                <PropertyEntry items={properties} onChange={setProperties} homeCurrency={homeCurrency} fxRates={effectiveFxRates} />
              </CollapsibleSection>

              <CollapsibleSection id="stocks" title="Stocks" icon="📊" summary={stockCount > 0 ? `${stockCount} holding${stockCount !== 1 ? "s" : ""}` : "None"} dataFlowId="section-stocks" dataFlowValue={totals.totalStocks} dataFlowLabel="Stocks" dataFlowItems={stockItems}>
                <StockEntry items={stocks} onChange={setStocks} />
              </CollapsibleSection>
            </div>
          </section>

          {/* Dashboard Panel — right side on desktop, bottom on mobile */}
          <section
            id="dashboard"
            className="lg:col-span-5 scroll-mt-16 print:col-span-full"
            data-testid="dashboard-panel"
            aria-label="Financial dashboard"
          >
            <div className="lg:sticky lg:top-8 overflow-visible space-y-3 sm:space-y-6">
              <SnapshotDashboard metrics={metrics} financialData={financialData} homeCurrency={homeCurrency} dataFlowConnections={dataFlowConnections} />
              {stocks.length > 0 && (() => {
                const portfolio = getPortfolioSummary(stocks);
                const stocksWithReturns = stocks
                  .map((s) => ({ ticker: s.ticker, annualized: getAnnualizedReturn(s) }))
                  .filter((s) => s.annualized !== null) as { ticker: string; annualized: number }[];
                return (
                  <ZoomableCard><div className="rounded-xl border border-white/10 bg-white/5 p-5 shadow-sm transition-all duration-200" data-testid="portfolio-performance">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-slate-400">Portfolio Performance</h3>
                      <span className="text-lg" aria-hidden="true">📊</span>
                    </div>
                    <p className={`mt-1.5 text-3xl font-bold ${portfolio.totalGainLoss >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {portfolio.totalGainLoss >= 0 ? "+" : "-"}${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.abs(portfolio.totalGainLoss))}
                    </p>
                    {portfolio.totalCostBasis > 0 && (
                      <p className="mt-0.5 text-sm text-slate-400" data-testid="portfolio-return-pct">
                        {portfolio.overallReturnPct >= 0 ? "+" : ""}{portfolio.overallReturnPct.toFixed(1)}% overall return
                      </p>
                    )}
                    {stocksWithReturns.length > 0 && (
                      <div className="mt-2 space-y-0.5">
                        {stocksWithReturns.map((s) => (
                          <p key={s.ticker} className="text-xs text-slate-500">
                            <span className="font-mono font-medium text-slate-400">{s.ticker}</span>{" "}
                            <span className={s.annualized >= 0 ? "text-emerald-400" : "text-rose-400"}>
                              {s.annualized >= 0 ? "+" : ""}{s.annualized.toFixed(1)}%/yr
                            </span>
                          </p>
                        ))}
                      </div>
                    )}
                    <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                      Total gain/loss across your stock holdings based on cost basis. Annualized returns shown for holdings with purchase dates.
                    </p>
                  </div></ZoomableCard>
                );
              })()}
              <ZoomableCard><ExpenseBreakdownChart
                expenses={expenses}
                investmentContributions={totalInvestmentContributions}
                mortgagePayments={totalMortgagePayments}
                federalTax={totals.totalFederalTax / 12}
                provincialStateTax={totals.totalProvincialStateTax / 12}
                monthlyAfterTaxIncome={totals.monthlyAfterTaxIncome}
                monthlyGrossIncome={totals.monthlyIncome}
              /></ZoomableCard>
              <ZoomableCard><NetWorthDonutChart
                assets={assets}
                debts={debts}
                properties={properties}
                stocks={stocks}
              /></ZoomableCard>
              <ZoomableCard><CashFlowSankey
                income={income}
                expenses={expenses}
                investmentContributions={totalInvestmentContributions}
                mortgagePayments={totalMortgagePayments}
                monthlyFederalTax={totals.totalFederalTax / 12}
                monthlyProvincialTax={totals.totalProvincialStateTax / 12}
                monthlySurplus={monthlySurplus}
                investmentReturns={monthlyInvestmentReturns
                  .filter((r) => {
                    const asset = assets.find((a) => a.category === r.label);
                    if (!asset) return false;
                    const treatment = asset.roiTaxTreatment ?? getDefaultRoiTaxTreatment(asset.category);
                    return treatment === "income";
                  })
                  .map((r) => ({ label: r.label, monthlyAmount: r.amount }))}
              /></ZoomableCard>
              <ZoomableCard><BenchmarkComparisons
                age={age}
                country={country}
                netWorth={benchmarkNetWorth}
                savingsRate={benchmarkSavingsRate}
                emergencyMonths={benchmarkEmergencyMonths}
                debtToIncomeRatio={benchmarkDebtToIncome}
                annualIncome={annualIncome}
                onAgeChange={setAge}
              /></ZoomableCard>
            </div>
          </section>
        </div>

        {/* What If scenario panel — full-width at the bottom */}
        <section id="scenarios" className="mt-8 scroll-mt-16 print:hidden" aria-label="Scenario modeling">
          <FastForwardPanel state={state} safeWithdrawalRate={safeWithdrawalRate} onSwrChange={handleSwrChange} />
        </section>

        <PrintFooter />
      </main>
    </div>
    </DataFlowProvider>
    </CurrencyProvider>
  );
}
