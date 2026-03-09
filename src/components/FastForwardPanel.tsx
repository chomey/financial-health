"use client";

import { useState, useMemo, useCallback } from "react";
import type { FinancialState } from "@/lib/financial-state";
import {
  compareScenarios,
  EMPTY_MODIFICATION,
  type ScenarioModification,
  type ScenarioPreset,
  applyPreset,
  isTaxSheltered,
  getMonthlyLimit,
} from "@/lib/scenario";
import type { Scenario } from "@/lib/projections";
import { normalizeToMonthly } from "@/components/IncomeEntry";
import { useCurrency } from "@/lib/CurrencyContext";
import HelpTip from "@/components/HelpTip";

interface FastForwardPanelProps {
  state: FinancialState;
  scenario?: Scenario;
  years?: number;
  safeWithdrawalRate?: number;
  onSwrChange?: (rate: number) => void;
}

function formatMonthsDelta(months: number): string {
  const abs = Math.abs(months);
  const years = Math.floor(abs / 12);
  const remaining = abs % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} year${years !== 1 ? "s" : ""}`);
  if (remaining > 0) parts.push(`${remaining} month${remaining !== 1 ? "s" : ""}`);
  if (parts.length === 0) return "no change";
  const duration = parts.join(" ");
  return months < 0 ? `${duration} sooner` : `${duration} later`;
}

function formatRunway(months: number, projectionYears: number): string {
  if (months >= projectionYears * 12) return `${projectionYears}+ years`;
  const years = Math.floor(months / 12);
  const remaining = months % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} year${years !== 1 ? "s" : ""}`);
  if (remaining > 0) parts.push(`${remaining} month${remaining !== 1 ? "s" : ""}`);
  return parts.join(" ") || "0 months";
}

const PRESET_CONFIGS: { id: ScenarioPreset; label: string; description: string }[] = [
  { id: "conservative", label: "Conservative", description: "Lower ROI (-2%)" },
  { id: "aggressive-saver", label: "Aggressive Saver", description: "Max tax-sheltered" },
  { id: "early-retirement", label: "Early Retirement", description: "No income" },
];

export default function FastForwardPanel({
  state,
  scenario = "moderate",
  years = 10,
  safeWithdrawalRate = 4,
  onSwrChange,
}: FastForwardPanelProps) {
  const fmt = useCurrency();
  const formatCurrency = (v: number) => fmt.compact(v);
  const formatDelta = (v: number) => (v > 0 ? "+" : "") + fmt.compact(v);
  const [mod, setMod] = useState<ScenarioModification>({ ...EMPTY_MODIFICATION });
  const [isOpen, setIsOpen] = useState(true);
  const [activePreset, setActivePreset] = useState<ScenarioPreset | null>(null);

  const hasModifications =
    mod.excludedDebtIds.length > 0 ||
    Object.keys(mod.contributionOverrides).length > 0 ||
    mod.incomeAdjustment !== 0 ||
    mod.windfall > 0 ||
    mod.retireToday ||
    mod.maxTaxSheltered ||
    mod.housingDownsizePercent > 0 ||
    mod.roiAdjustment !== 0;

  const comparison = useMemo(() => {
    if (!hasModifications) return null;
    return compareScenarios(state, mod, years, scenario);
  }, [state, mod, years, scenario, hasModifications]);

  const toggleDebt = useCallback((debtId: string) => {
    setMod((prev) => {
      const excluded = prev.excludedDebtIds.includes(debtId)
        ? prev.excludedDebtIds.filter((id) => id !== debtId)
        : [...prev.excludedDebtIds, debtId];
      return { ...prev, excludedDebtIds: excluded };
    });
    setActivePreset(null);
  }, []);

  const setContributionOverride = useCallback((assetId: string, value: number | undefined) => {
    setMod((prev) => {
      const overrides = { ...prev.contributionOverrides };
      if (value === undefined) {
        delete overrides[assetId];
      } else {
        overrides[assetId] = value;
      }
      return { ...prev, contributionOverrides: overrides };
    });
    setActivePreset(null);
  }, []);

  const setIncomeAdjustment = useCallback((value: number) => {
    setMod((prev) => ({ ...prev, incomeAdjustment: value }));
    setActivePreset(null);
  }, []);

  const setWindfall = useCallback((value: number) => {
    setMod((prev) => ({ ...prev, windfall: value }));
    setActivePreset(null);
  }, []);

  const toggleRetireToday = useCallback(() => {
    setMod((prev) => ({ ...prev, retireToday: !prev.retireToday }));
    setActivePreset(null);
  }, []);

  const toggleMaxTaxSheltered = useCallback(() => {
    setMod((prev) => ({ ...prev, maxTaxSheltered: !prev.maxTaxSheltered }));
    setActivePreset(null);
  }, []);

  const setHousingDownsize = useCallback((value: number) => {
    setMod((prev) => ({ ...prev, housingDownsizePercent: value }));
    setActivePreset(null);
  }, []);

  const setRoiAdjustment = useCallback((value: number) => {
    setMod((prev) => ({ ...prev, roiAdjustment: value }));
    setActivePreset(null);
  }, []);

  const handlePreset = useCallback((preset: ScenarioPreset) => {
    if (activePreset === preset) {
      setMod({ ...EMPTY_MODIFICATION });
      setActivePreset(null);
    } else {
      setMod(applyPreset(preset, state));
      setActivePreset(preset);
    }
  }, [activePreset, state]);

  const resetScenario = useCallback(() => {
    setMod({ ...EMPTY_MODIFICATION });
    setActivePreset(null);
  }, []);

  const hasDebts = state.debts.length > 0;
  const hasContributions = state.assets.some((a) => (a.monthlyContribution ?? 0) > 0);
  const hasProperties = state.properties.length > 0;
  const hasTaxSheltered = state.assets.some((a) => isTaxSheltered(a.category));
  const totalMonthlyIncome = state.income.reduce((sum, i) => sum + normalizeToMonthly(i.amount, i.frequency), 0);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 shadow-sm text-left transition-all duration-200 hover:shadow-md hover:bg-white/10"
        data-testid="fast-forward-toggle"
        aria-expanded={false}
      >
        <div className="flex items-center gap-2">
          <span aria-hidden="true">⏩</span>
          <h3 className="text-base font-semibold text-slate-200">Fast Forward</h3>
          <span className="text-sm text-slate-500">What-if scenario modeling</span>
        </div>
        <svg
          className="h-4 w-4 flex-shrink-0 text-slate-500"
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
    <section
      className="overflow-hidden rounded-xl border border-white/10 bg-white/5 p-3 shadow-sm sm:p-6"
      data-testid="fast-forward-panel"
      aria-label="Fast Forward scenario modeling"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span aria-hidden="true">⏩</span>
          <h3 className="text-lg font-semibold text-slate-200">Fast Forward</h3>
          <HelpTip text="Model 'what if' scenarios by adjusting income, contributions, debts, or adding a windfall. Compare the projected outcome against your current trajectory." />
        </div>
        <div className="flex items-center gap-2">
          {hasModifications && (
            <button
              onClick={resetScenario}
              className="rounded-lg px-3 py-1 text-xs font-medium text-slate-400 transition-all duration-200 hover:bg-white/10 hover:text-slate-200"
              data-testid="reset-scenario"
            >
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-md p-1 text-slate-500 transition-colors duration-150 hover:bg-white/10 hover:text-slate-300"
            aria-label="Collapse Fast Forward"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>

      <p className="mb-4 text-xs text-slate-400">
        Explore &quot;what if&quot; scenarios. These are temporary — they won&apos;t change your saved data.
      </p>

      {/* Scenario Presets */}
      <div className="mb-4" data-testid="scenario-presets">
        <h4 className="mb-2 text-sm font-medium text-slate-300">Quick scenarios</h4>
        <div className="flex flex-wrap gap-2">
          {PRESET_CONFIGS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePreset(preset.id)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                activePreset === preset.id
                  ? "border-violet-400/50 bg-violet-400/15 text-violet-300"
                  : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:border-white/20"
              }`}
              data-testid={`preset-${preset.id}`}
            >
              <span className="block">{preset.label}</span>
              <span className="block text-[10px] font-normal opacity-70">{preset.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {/* Retire Today toggle */}
        {totalMonthlyIncome > 0 && (
          <div data-testid="retire-today">
            <h4 className="mb-2 text-sm font-medium text-slate-300">
              What if you retired today?
            </h4>
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-all duration-200 ${
                mod.retireToday
                  ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              <input
                type="checkbox"
                checked={mod.retireToday}
                onChange={toggleRetireToday}
                className="h-4 w-4 rounded border-white/20 bg-slate-800 text-amber-500 focus:ring-amber-400"
                data-testid="retire-today-checkbox"
              />
              <span className="flex-1">
                Set all income to $0 and see how long your savings last
              </span>
              {mod.retireToday && (
                <span className="text-xs font-medium text-amber-400">
                  -{formatCurrency(totalMonthlyIncome)}/mo
                </span>
              )}
            </label>
          </div>
        )}

        {/* Max tax-sheltered contributions */}
        {hasTaxSheltered && (
          <div data-testid="max-tax-sheltered">
            <h4 className="mb-2 text-sm font-medium text-slate-300">
              What if you maxed tax-sheltered accounts?
            </h4>
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-all duration-200 ${
                mod.maxTaxSheltered
                  ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-300"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              <input
                type="checkbox"
                checked={mod.maxTaxSheltered}
                onChange={toggleMaxTaxSheltered}
                className="h-4 w-4 rounded border-white/20 bg-slate-800 text-cyan-500 focus:ring-cyan-400"
                data-testid="max-tax-sheltered-checkbox"
              />
              <span className="flex-1">
                Maximize contributions to annual limits
              </span>
            </label>
            {mod.maxTaxSheltered && (
              <div className="mt-2 space-y-1 pl-7">
                {state.assets
                  .filter((a) => isTaxSheltered(a.category))
                  .map((a) => {
                    const limit = getMonthlyLimit(a.category);
                    const current = a.monthlyContribution ?? 0;
                    const isAlreadyMax = current >= limit;
                    return (
                      <div key={a.id} className="flex items-center justify-between text-xs text-cyan-300">
                        <span>{a.category}</span>
                        <span>
                          {isAlreadyMax ? (
                            <span className="text-slate-500">Already at max</span>
                          ) : (
                            <>
                              {formatCurrency(current)}/mo → <span className="font-medium">{formatCurrency(limit)}/mo</span>
                            </>
                          )}
                        </span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Housing downsize */}
        {hasProperties && (
          <div data-testid="housing-downsize">
            <h4 className="mb-2 text-sm font-medium text-slate-300">
              What if you downsized housing?
            </h4>
            <div className={`rounded-lg border px-3 py-2 transition-all duration-200 ${
              mod.housingDownsizePercent > 0 ? "border-violet-400/40 bg-violet-400/10" : "border-white/10"
            }`}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-sm text-slate-300 flex-1 min-w-[140px]">
                  Reduce property value by
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={50}
                    step={5}
                    value={mod.housingDownsizePercent}
                    onChange={(e) => setHousingDownsize(parseInt(e.target.value))}
                    className="w-24 accent-violet-400"
                    data-testid="housing-downsize-slider"
                  />
                  <span className={`min-w-[36px] text-right text-sm font-medium ${
                    mod.housingDownsizePercent > 0 ? "text-violet-300" : "text-slate-500"
                  }`}>
                    {mod.housingDownsizePercent}%
                  </span>
                </div>
              </div>
              {mod.housingDownsizePercent > 0 && (
                <p className="mt-1 text-xs text-violet-300">
                  Equity released is added to your savings
                </p>
              )}
            </div>
          </div>
        )}

        {/* ROI adjustment */}
        <div data-testid="roi-adjustment">
          <h4 className="mb-2 text-sm font-medium text-slate-300">
            What if market returns changed?
          </h4>
          <div className={`rounded-lg border px-3 py-2 transition-all duration-200 ${
            mod.roiAdjustment !== 0 ? "border-pink-400/40 bg-pink-400/10" : "border-white/10"
          }`}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-sm text-slate-300 flex-1 min-w-[140px]">Global ROI adjustment</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={-5}
                  max={5}
                  step={1}
                  value={mod.roiAdjustment}
                  onChange={(e) => setRoiAdjustment(parseInt(e.target.value))}
                  className="w-24 accent-pink-400"
                  data-testid="roi-adjustment-slider"
                />
                <span className={`min-w-[40px] text-right text-sm font-medium ${
                  mod.roiAdjustment > 0 ? "text-emerald-400" : mod.roiAdjustment < 0 ? "text-rose-400" : "text-slate-500"
                }`}>
                  {mod.roiAdjustment > 0 ? "+" : ""}{mod.roiAdjustment}%
                </span>
                {mod.roiAdjustment !== 0 && (
                  <button
                    onClick={() => setRoiAdjustment(0)}
                    className="text-xs text-slate-500 hover:text-slate-300"
                    title="Reset"
                  >
                    ↩
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* FIRE safe withdrawal rate */}
        <div data-testid="swr-adjustment">
          <h4 className="mb-2 text-sm font-medium text-slate-300">
            FIRE withdrawal rate
          </h4>
          <div className={`rounded-lg border px-3 py-2 transition-all duration-200 ${
            safeWithdrawalRate !== 4 ? "border-amber-400/40 bg-amber-400/10" : "border-white/10"
          }`}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-sm text-slate-300 flex-1 min-w-[140px]">Safe withdrawal rate</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={3}
                  max={5}
                  step={0.5}
                  value={safeWithdrawalRate}
                  onChange={(e) => onSwrChange?.(parseFloat(e.target.value))}
                  className="w-24 accent-amber-400"
                  data-testid="swr-slider"
                />
                <span className={`min-w-[36px] text-right text-sm font-medium ${
                  safeWithdrawalRate !== 4 ? "text-amber-400" : "text-slate-500"
                }`}>
                  {safeWithdrawalRate}%
                </span>
                {safeWithdrawalRate !== 4 && (
                  <button
                    onClick={() => onSwrChange?.(4)}
                    className="text-xs text-slate-500 hover:text-slate-300"
                    title="Reset to 4%"
                  >
                    ↩
                  </button>
                )}
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Adjusts the FIRE milestone on the projection chart (3% conservative, 4% standard, 5% aggressive)
            </p>
          </div>
        </div>

        {/* Debt toggles */}
        {hasDebts && (
          <div data-testid="debt-toggles">
            <h4 className="mb-2 text-sm font-medium text-slate-300">
              What if you paid off a debt?
            </h4>
            <div className="space-y-1.5">
              {state.debts.map((debt) => (
                <label
                  key={debt.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-all duration-200 ${
                    mod.excludedDebtIds.includes(debt.id)
                      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                  data-testid={`debt-toggle-${debt.id}`}
                >
                  <input
                    type="checkbox"
                    checked={mod.excludedDebtIds.includes(debt.id)}
                    onChange={() => toggleDebt(debt.id)}
                    className="h-4 w-4 rounded border-white/20 bg-slate-800 text-emerald-500 focus:ring-emerald-400"
                  />
                  <span className="flex-1">
                    {debt.category}
                    {mod.excludedDebtIds.includes(debt.id) && (
                      <span className="ml-1 text-xs text-emerald-400">Paid off!</span>
                    )}
                  </span>
                  <span className={`font-medium ${mod.excludedDebtIds.includes(debt.id) ? "line-through text-slate-500" : ""}`}>
                    {formatCurrency(debt.amount)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Contribution adjustments */}
        {hasContributions && (
          <div data-testid="contribution-adjustments">
            <h4 className="mb-2 text-sm font-medium text-slate-300">
              Adjust monthly contributions
            </h4>
            <div className="space-y-1.5">
              {state.assets
                .filter((a) => (a.monthlyContribution ?? 0) > 0)
                .map((asset) => {
                  const currentVal = mod.contributionOverrides[asset.id] ?? asset.monthlyContribution ?? 0;
                  const isModified = mod.contributionOverrides[asset.id] !== undefined;
                  return (
                    <div
                      key={asset.id}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-all duration-200 ${
                        isModified ? "border-violet-400/40 bg-violet-400/10" : "border-white/10"
                      }`}
                      data-testid={`contribution-${asset.id}`}
                    >
                      <span className="flex-1 text-slate-300">{asset.category}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-500">$</span>
                        <input
                          type="number"
                          value={currentVal}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            if (val === (asset.monthlyContribution ?? 0)) {
                              setContributionOverride(asset.id, undefined);
                            } else {
                              setContributionOverride(asset.id, val);
                            }
                          }}
                          className="w-20 rounded border border-white/10 bg-slate-800 px-2 py-1 text-right text-sm text-slate-200 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400"
                          min={0}
                          step={50}
                        />
                        <span className="text-xs text-slate-500">/mo</span>
                        {isModified && (
                          <button
                            onClick={() => setContributionOverride(asset.id, undefined)}
                            className="ml-1 text-xs text-slate-500 hover:text-slate-300"
                            title="Reset to original"
                          >
                            ↩
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Income adjustment */}
        <div data-testid="income-adjustment">
          <h4 className="mb-2 text-sm font-medium text-slate-300">
            What if your income changed?
          </h4>
          <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-2 transition-all duration-200 ${
            mod.incomeAdjustment !== 0 ? "border-cyan-400/40 bg-cyan-400/10" : "border-white/10"
          }`}>
            <span className="text-sm text-slate-300 flex-1 min-w-[140px]">Monthly adjustment</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIncomeAdjustment(mod.incomeAdjustment - 500)}
                className="rounded px-1.5 py-0.5 text-xs font-medium text-slate-400 hover:bg-white/10 transition-colors"
                data-testid="income-decrease"
              >
                -$500
              </button>
              <span className={`min-w-[60px] text-center text-sm font-medium ${
                mod.incomeAdjustment > 0 ? "text-emerald-400" : mod.incomeAdjustment < 0 ? "text-rose-400" : "text-slate-500"
              }`}>
                {mod.incomeAdjustment === 0 ? "$0" : formatDelta(mod.incomeAdjustment)}
              </span>
              <button
                onClick={() => setIncomeAdjustment(mod.incomeAdjustment + 500)}
                className="rounded px-1.5 py-0.5 text-xs font-medium text-slate-400 hover:bg-white/10 transition-colors"
                data-testid="income-increase"
              >
                +$500
              </button>
              {mod.incomeAdjustment !== 0 && (
                <button
                  onClick={() => setIncomeAdjustment(0)}
                  className="ml-1 text-xs text-slate-500 hover:text-slate-300"
                  title="Reset"
                >
                  ↩
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Windfall */}
        <div data-testid="windfall-input">
          <h4 className="mb-2 text-sm font-medium text-slate-300">
            One-time windfall
          </h4>
          <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-2 transition-all duration-200 ${
            mod.windfall > 0 ? "border-amber-400/40 bg-amber-400/10" : "border-white/10"
          }`}>
            <span className="text-sm text-slate-300 flex-1 min-w-[140px]">
              Bonus, inheritance, or lump sum
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">$</span>
              <input
                type="number"
                value={mod.windfall || ""}
                onChange={(e) => setWindfall(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0"
                className="w-24 rounded border border-white/10 bg-slate-800 px-2 py-1 text-right text-sm text-slate-200 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                min={0}
                step={1000}
                data-testid="windfall-amount"
              />
              {mod.windfall > 0 && (
                <button
                  onClick={() => setWindfall(0)}
                  className="ml-1 text-xs text-slate-500 hover:text-slate-300"
                  title="Reset"
                >
                  ↩
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comparison results */}
      {comparison && hasModifications && (
        <div className="mt-6 border-t border-white/10 pt-4" data-testid="scenario-comparison">
          <h4 className="mb-3 text-sm font-semibold text-slate-200">
            Scenario Impact
          </h4>

          {/* Runway for retire-today */}
          {mod.retireToday && comparison.scenarioRunwayMonths !== null && (
            <div className="mb-3 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3" data-testid="runway-estimate">
              <p className="text-sm font-medium text-amber-300">
                Your savings would last approximately{" "}
                <span className="font-bold">{formatRunway(comparison.scenarioRunwayMonths, years)}</span>
                {" "}with no income
              </p>
              <p className="mt-1 text-xs text-amber-400/70">
                Based on current expenses and asset growth projections
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {comparison.netWorthDeltas.map(({ year, baseline, scenario: scenVal, delta }) => (
              <div
                key={year}
                className="rounded-lg border border-white/10 bg-white/5 p-3"
                data-testid={`delta-year-${year}`}
              >
                <p className="text-xs font-medium text-slate-400 mb-1">Net worth at year {year}</p>
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-xs text-slate-500">Current plan</p>
                    <p className="text-sm font-medium text-slate-300">{formatCurrency(baseline)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Scenario</p>
                    <p className="text-sm font-medium text-slate-300">{formatCurrency(scenVal)}</p>
                  </div>
                </div>
                <p className={`mt-1 text-xs font-semibold ${delta > 0 ? "text-emerald-400" : delta < 0 ? "text-rose-400" : "text-slate-500"}`}>
                  {formatDelta(delta)} {delta > 0 ? "better" : delta < 0 ? "worse" : ""}
                </p>
              </div>
            ))}
          </div>

          {/* Debt-free timeline delta */}
          {comparison.consumerDebtFreeDeltaMonths !== null && comparison.consumerDebtFreeDeltaMonths !== 0 && (
            <div className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3" data-testid="debt-free-delta">
              <p className={`text-sm font-medium ${comparison.consumerDebtFreeDeltaMonths < 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {comparison.consumerDebtFreeDeltaMonths < 0 ? "🎉" : "⚠️"} Debt-free {formatMonthsDelta(comparison.consumerDebtFreeDeltaMonths)}
              </p>
            </div>
          )}

          {comparison.debtFreeDeltaMonths !== null && comparison.debtFreeDeltaMonths !== 0 && comparison.debtFreeDeltaMonths !== comparison.consumerDebtFreeDeltaMonths && (
            <div className="mt-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3" data-testid="all-debt-free-delta">
              <p className={`text-sm font-medium ${comparison.debtFreeDeltaMonths < 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {comparison.debtFreeDeltaMonths < 0 ? "🏠" : "⚠️"} All debt (incl. mortgage) free {formatMonthsDelta(comparison.debtFreeDeltaMonths)}
              </p>
            </div>
          )}
        </div>
      )}

      {!hasModifications && (
        <div className="mt-4 rounded-lg border border-dashed border-white/10 p-4 text-center text-sm text-slate-500">
          Pick a quick scenario above, or customize individual options to see how changes affect your financial future.
        </div>
      )}
    </section>
  );
}
