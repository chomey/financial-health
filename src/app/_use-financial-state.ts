"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { INITIAL_STATE } from "@/lib/financial-state";
import { getStateFromURL, updateURL, getSwrFromURL, updateSwrURL, getOutlookYearsFromURL, type OutlookYears } from "@/lib/url-state";
import { getHomeCurrency, getForeignCurrency, getEffectiveFxRates, fxPairKey } from "@/lib/currency";
import type { FxRates } from "@/lib/currency";
import type { Asset } from "@/components/AssetEntry";
import { getStockValue } from "@/components/StockEntry";
import type { Debt } from "@/components/DebtEntry";
import type { Property } from "@/components/PropertyEntry";
import type { StockHolding } from "@/components/StockEntry";
import type { IncomeItem } from "@/components/IncomeEntry";
import type { ExpenseItem } from "@/components/ExpenseEntry";
import type { TaxCredit } from "@/lib/tax-credits";
import { type FilingStatus, getDefaultFilingStatus } from "@/lib/tax-credits";
import type { SampleProfile } from "@/lib/sample-profiles";
import type { WizardResult } from "@/components/MobileWizard";

export function useFinancialState() {
  const [assets, setAssets] = useState<Asset[]>(INITIAL_STATE.assets);
  const [debts, setDebts] = useState<Debt[]>(INITIAL_STATE.debts);
  const [properties, setProperties] = useState<Property[]>(INITIAL_STATE.properties);
  const [stocks, setStocks] = useState<StockHolding[]>(INITIAL_STATE.stocks);
  const [income, setIncome] = useState<IncomeItem[]>(INITIAL_STATE.income);
  const [expenses, setExpenses] = useState<ExpenseItem[]>(INITIAL_STATE.expenses);
  const [country, setCountry] = useState<"CA" | "US">(INITIAL_STATE.country ?? "CA");
  const [jurisdiction, setJurisdiction] = useState<string>(INITIAL_STATE.jurisdiction ?? "ON");
  const [age, setAge] = useState<number | undefined>(INITIAL_STATE.age);
  const [federalTaxOverride, setFederalTaxOverride] = useState<number | undefined>(undefined);
  const [provincialTaxOverride, setProvincialTaxOverride] = useState<number | undefined>(undefined);
  const [surplusTargetComputedId, setSurplusTargetComputedId] = useState<string | undefined>(undefined);
  const [fxManualOverride, setFxManualOverride] = useState<number | undefined>(undefined);
  const [fxRates, setFxRates] = useState<FxRates | undefined>(undefined);
  const [taxCredits, setTaxCredits] = useState<TaxCredit[]>(INITIAL_STATE.taxCredits ?? []);
  const [filingStatus, setFilingStatus] = useState<FilingStatus>(INITIAL_STATE.filingStatus ?? getDefaultFilingStatus(INITIAL_STATE.country ?? "CA"));
  const [taxYear, setTaxYear] = useState<number>(new Date().getFullYear());
  const [flowchartAcks, setFlowchartAcks] = useState<string[]>([]);
  const [flowchartSkips, setFlowchartSkips] = useState<string[]>([]);
  const [isRetired, setIsRetired] = useState(false);
  const [showSampleProfiles, setShowSampleProfiles] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [safeWithdrawalRate, setSafeWithdrawalRate] = useState(4);
  const [outlookYears, setOutlookYears] = useState<OutlookYears>(30);
  const isFirstRender = useRef(true);

  // Restore state from URL after hydration; show sample profiles if no URL state
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setSafeWithdrawalRate(getSwrFromURL());
    setOutlookYears(getOutlookYearsFromURL());
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
      setFederalTaxOverride(urlState.federalTaxOverride);
      setProvincialTaxOverride(urlState.provincialTaxOverride);
      setSurplusTargetComputedId(urlState.surplusTargetComputedId);
      setFxManualOverride(urlState.fxManualOverride);
      if (urlState.taxCredits) setTaxCredits(urlState.taxCredits);
      if (urlState.filingStatus) setFilingStatus(urlState.filingStatus);
      if (urlState.taxYear) setTaxYear(urlState.taxYear);
      if (urlState.flowchartAcks) setFlowchartAcks(urlState.flowchartAcks);
      if (urlState.flowchartSkips) setFlowchartSkips(urlState.flowchartSkips);
      if (urlState.isRetired) setIsRetired(true);
    } else {
      // No saved state — show sample profile picker for new visitors
      setShowSampleProfiles(true);
      // Show guided wizard for new users on any viewport
      try {
        const wizardDone = localStorage.getItem("fhs-wizard-done");
        if (!wizardDone) {
          setShowWizard(true);
        }
      } catch {
        // localStorage unavailable (private browsing, test environment, etc.)
      }
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Fetch live FX rates on mount and when country changes (skip if manual override is set)
  useEffect(() => {
    if (fxManualOverride !== undefined && fxManualOverride > 0) return;
    const homeCurrency = getHomeCurrency(country);
    const foreignCurrency = getForeignCurrency(homeCurrency);
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/fx-rate?from=${foreignCurrency}&to=${homeCurrency}`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        const rate = data.rate as number;
        setFxRates({
          [fxPairKey(foreignCurrency, homeCurrency)]: rate,
          [fxPairKey(homeCurrency, foreignCurrency)]: 1 / rate,
        });
      } catch {
        // Silently fall back to hardcoded rates
      }
    })();
    return () => { cancelled = true; };
  }, [country, fxManualOverride]);

  // Update URL whenever state changes (skip initial render to keep URL clean with defaults)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    updateURL({ assets, debts, properties, stocks, income, expenses, country, jurisdiction, age, federalTaxOverride, provincialTaxOverride, surplusTargetComputedId, fxManualOverride, taxCredits, filingStatus, taxYear, flowchartAcks, flowchartSkips, isRetired: isRetired || undefined });
  }, [assets, debts, properties, stocks, income, expenses, country, jurisdiction, age, federalTaxOverride, provincialTaxOverride, surplusTargetComputedId, fxManualOverride, taxCredits, filingStatus, taxYear, flowchartAcks, flowchartSkips, isRetired]);

  // Sync computed assets for stocks and property equity (auto-update amounts, preserve ROI & surplusTarget)
  const syncComputedAssets = useCallback(() => {
    const totalStockValue = stocks.reduce((sum, s) => sum + getStockValue(s), 0);
    const totalEquity = properties.reduce((sum, p) => sum + Math.max(0, p.value - p.mortgage), 0);

    setAssets((prev) => {
      let next = [...prev];
      const stocksIdx = next.findIndex((a) => a.id === "_computed_stocks");

      if (totalStockValue > 0) {
        const existing = stocksIdx >= 0 ? next[stocksIdx] : undefined;
        const isSurplusTarget = existing?.surplusTarget || surplusTargetComputedId === "_computed_stocks";
        const entry: Asset = { id: "_computed_stocks", category: "Stocks & Equity", amount: totalStockValue, computed: true as const, roi: existing?.roi, surplusTarget: isSurplusTarget || undefined };
        if (stocksIdx >= 0) next[stocksIdx] = entry;
        else next = [entry, ...next];
      } else if (stocksIdx >= 0) {
        next.splice(stocksIdx, 1);
      }

      const equityIdxAfter = next.findIndex((a) => a.id === "_computed_equity");
      if (totalEquity > 0) {
        const existing = equityIdxAfter >= 0 ? next[equityIdxAfter] : undefined;
        const isSurplusTarget = existing?.surplusTarget || surplusTargetComputedId === "_computed_equity";
        const entry: Asset = { id: "_computed_equity", category: "Property Equity", amount: totalEquity, computed: true as const, roi: existing?.roi, surplusTarget: isSurplusTarget || undefined };
        if (equityIdxAfter >= 0) next[equityIdxAfter] = entry;
        else {
          const insertIdx = next.findIndex((a) => a.id === "_computed_stocks") >= 0 ? 1 : 0;
          next.splice(insertIdx, 0, entry);
        }
      } else if (equityIdxAfter >= 0) {
        next.splice(equityIdxAfter, 1);
      }

      // If a computed asset is the surplus target, clear it from real assets
      const computedHasSurplus = next.some((a) => a.computed && a.surplusTarget);
      if (computedHasSurplus) {
        next = next.map((a) => a.computed ? a : { ...a, surplusTarget: false });
      }

      return next;
    });
  }, [stocks, properties, surplusTargetComputedId]);

  // Sync on stocks/properties change
  useEffect(() => {
    syncComputedAssets();
  }, [syncComputedAssets]);

  // Wrap setAssets to track surplus target on computed assets
  const handleAssetsChange = useCallback((newAssets: Asset[]) => {
    setAssets(newAssets);
    const computedSurplus = newAssets.find((a) => a.computed && a.surplusTarget);
    setSurplusTargetComputedId(computedSurplus?.id);
  }, []);

  const loadProfile = useCallback((profile: SampleProfile) => {
    const s = profile.state;
    setAssets(s.assets);
    setDebts(s.debts);
    setIncome(s.income);
    setExpenses(s.expenses);
    setProperties(s.properties);
    setStocks(s.stocks);
    if (s.country) setCountry(s.country);
    if (s.jurisdiction) setJurisdiction(s.jurisdiction);
    if (s.age !== undefined) setAge(s.age);
    setFederalTaxOverride(undefined);
    setProvincialTaxOverride(undefined);
    setSurplusTargetComputedId(undefined);
    setFxManualOverride(undefined);
    setTaxCredits([]);
    setFilingStatus(getDefaultFilingStatus(s.country ?? "CA"));
    setShowSampleProfiles(false);
  }, []);

  const handleCountryChange = useCallback((newCountry: "CA" | "US") => {
    setCountry(newCountry);
    // Reset filing status to the default for the new country
    setFilingStatus(getDefaultFilingStatus(newCountry));
  }, []);

  const clearAll = useCallback(() => {
    setAssets([]);
    setDebts([]);
    setIncome([]);
    setExpenses([]);
    setProperties([]);
    setStocks([]);
    setTaxCredits([]);
    setFederalTaxOverride(undefined);
    setProvincialTaxOverride(undefined);
    setSurplusTargetComputedId(undefined);
    setFxManualOverride(undefined);
    setShowSampleProfiles(false);
  }, []);

  const handleWizardComplete = useCallback((result: WizardResult) => {
    setAssets(result.assets);
    setDebts(result.debts);
    setIncome(result.income);
    setExpenses(result.expenses);
    setShowWizard(false);
    setShowSampleProfiles(false);
  }, []);

  const handleWizardSkip = useCallback(() => {
    setShowWizard(false);
  }, []);

  const handleSwrChange = useCallback((rate: number) => {
    setSafeWithdrawalRate(rate);
    updateSwrURL(rate);
  }, []);

  const homeCurrency = getHomeCurrency(country);
  const foreignCurrency = getForeignCurrency(homeCurrency);
  const effectiveFxRates = getEffectiveFxRates(homeCurrency, fxManualOverride, fxRates);

  return {
    // State
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
    surplusTargetComputedId,
    fxManualOverride,
    fxRates,
    taxCredits,
    filingStatus,
    taxYear,
    flowchartAcks,
    flowchartSkips,
    isRetired,
    showSampleProfiles,
    showWizard,
    safeWithdrawalRate,
    outlookYears,
    // Derived
    homeCurrency,
    foreignCurrency,
    effectiveFxRates,
    // Setters
    setAssets,
    setDebts,
    setProperties,
    setStocks,
    setIncome,
    setExpenses,
    setCountry,
    setJurisdiction,
    setAge,
    setFederalTaxOverride,
    setProvincialTaxOverride,
    setSurplusTargetComputedId,
    setFxManualOverride,
    setFxRates,
    setTaxCredits,
    setFilingStatus,
    setTaxYear,
    setFlowchartAcks,
    setFlowchartSkips,
    setIsRetired,
    setShowSampleProfiles,
    setShowWizard,
    setSafeWithdrawalRate,
    setOutlookYears,
    // Handlers
    handleAssetsChange,
    loadProfile,
    handleCountryChange,
    clearAll,
    handleWizardComplete,
    handleWizardSkip,
    handleSwrChange,
  };
}
