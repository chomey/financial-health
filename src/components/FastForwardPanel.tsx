"use client";

import { useState, useMemo, useCallback } from "react";
import type { FinancialState } from "@/lib/financial-state";
import {
  compareScenarios,
  EMPTY_MODIFICATION,
  type ScenarioModification,
} from "@/lib/scenario";
import type { Scenario } from "@/lib/projections";

interface FastForwardPanelProps {
  state: FinancialState;
  scenario?: Scenario;
  years?: number;
}

function formatCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value.toFixed(0)}`;
}

function formatDelta(value: number): string {
  const prefix = value > 0 ? "+" : "";
  return prefix + formatCurrency(value);
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

export default function FastForwardPanel({
  state,
  scenario = "moderate",
  years = 10,
}: FastForwardPanelProps) {
  const [mod, setMod] = useState<ScenarioModification>({ ...EMPTY_MODIFICATION });
  const [isOpen, setIsOpen] = useState(false);

  const hasModifications =
    mod.excludedDebtIds.length > 0 ||
    Object.keys(mod.contributionOverrides).length > 0 ||
    mod.incomeAdjustment !== 0 ||
    mod.windfall > 0;

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
  }, []);

  const setIncomeAdjustment = useCallback((value: number) => {
    setMod((prev) => ({ ...prev, incomeAdjustment: value }));
  }, []);

  const setWindfall = useCallback((value: number) => {
    setMod((prev) => ({ ...prev, windfall: value }));
  }, []);

  const resetScenario = useCallback(() => {
    setMod({ ...EMPTY_MODIFICATION });
  }, []);

  const hasDebts = state.debts.length > 0;
  const hasContributions = state.assets.some((a) => (a.monthlyContribution ?? 0) > 0);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm text-left transition-all duration-200 hover:shadow-md hover:bg-stone-50"
        data-testid="fast-forward-toggle"
        aria-expanded={false}
      >
        <div className="flex items-center gap-2">
          <span aria-hidden="true">⏩</span>
          <h3 className="text-base font-semibold text-stone-800">Fast Forward</h3>
          <span className="text-sm text-stone-400">What-if scenario modeling</span>
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
    <section
      className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6"
      data-testid="fast-forward-panel"
      aria-label="Fast Forward scenario modeling"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span aria-hidden="true">⏩</span>
          <h3 className="text-lg font-semibold text-stone-800">Fast Forward</h3>
        </div>
        <div className="flex items-center gap-2">
          {hasModifications && (
            <button
              onClick={resetScenario}
              className="rounded-lg px-3 py-1 text-xs font-medium text-stone-500 transition-all duration-200 hover:bg-stone-100 hover:text-stone-700"
              data-testid="reset-scenario"
            >
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-md p-1 text-stone-400 transition-colors duration-150 hover:bg-stone-100 hover:text-stone-600"
            aria-label="Collapse Fast Forward"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>

      <p className="mb-4 text-xs text-stone-500">
        Explore &quot;what if&quot; scenarios to see how changes affect your financial future. These are temporary — they won&apos;t change your saved data.
      </p>

      <div className="space-y-4">
        {/* Debt toggles */}
        {hasDebts && (
          <div data-testid="debt-toggles">
            <h4 className="mb-2 text-sm font-medium text-stone-700">
              What if you paid off a debt?
            </h4>
            <div className="space-y-1.5">
              {state.debts.map((debt) => (
                <label
                  key={debt.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-all duration-200 ${
                    mod.excludedDebtIds.includes(debt.id)
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                  }`}
                  data-testid={`debt-toggle-${debt.id}`}
                >
                  <input
                    type="checkbox"
                    checked={mod.excludedDebtIds.includes(debt.id)}
                    onChange={() => toggleDebt(debt.id)}
                    className="h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="flex-1">
                    {debt.category}
                    {mod.excludedDebtIds.includes(debt.id) && (
                      <span className="ml-1 text-xs text-emerald-600">Paid off!</span>
                    )}
                  </span>
                  <span className={`font-medium ${mod.excludedDebtIds.includes(debt.id) ? "line-through text-stone-400" : ""}`}>
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
            <h4 className="mb-2 text-sm font-medium text-stone-700">
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
                        isModified ? "border-blue-200 bg-blue-50" : "border-stone-200"
                      }`}
                      data-testid={`contribution-${asset.id}`}
                    >
                      <span className="flex-1 text-stone-700">{asset.category}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-stone-400">$</span>
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
                          className="w-20 rounded border border-stone-200 px-2 py-1 text-right text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                          min={0}
                          step={50}
                        />
                        <span className="text-xs text-stone-400">/mo</span>
                        {isModified && (
                          <button
                            onClick={() => setContributionOverride(asset.id, undefined)}
                            className="ml-1 text-xs text-stone-400 hover:text-stone-600"
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
          <h4 className="mb-2 text-sm font-medium text-stone-700">
            What if your income changed?
          </h4>
          <div className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-all duration-200 ${
            mod.incomeAdjustment !== 0 ? "border-blue-200 bg-blue-50" : "border-stone-200"
          }`}>
            <span className="text-sm text-stone-700 flex-1">Monthly adjustment</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIncomeAdjustment(mod.incomeAdjustment - 500)}
                className="rounded px-1.5 py-0.5 text-xs font-medium text-stone-500 hover:bg-stone-200 transition-colors"
                data-testid="income-decrease"
              >
                -$500
              </button>
              <span className={`min-w-[60px] text-center text-sm font-medium ${
                mod.incomeAdjustment > 0 ? "text-emerald-600" : mod.incomeAdjustment < 0 ? "text-red-500" : "text-stone-500"
              }`}>
                {mod.incomeAdjustment === 0 ? "$0" : formatDelta(mod.incomeAdjustment)}
              </span>
              <button
                onClick={() => setIncomeAdjustment(mod.incomeAdjustment + 500)}
                className="rounded px-1.5 py-0.5 text-xs font-medium text-stone-500 hover:bg-stone-200 transition-colors"
                data-testid="income-increase"
              >
                +$500
              </button>
              {mod.incomeAdjustment !== 0 && (
                <button
                  onClick={() => setIncomeAdjustment(0)}
                  className="ml-1 text-xs text-stone-400 hover:text-stone-600"
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
          <h4 className="mb-2 text-sm font-medium text-stone-700">
            One-time windfall
          </h4>
          <div className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-all duration-200 ${
            mod.windfall > 0 ? "border-amber-200 bg-amber-50" : "border-stone-200"
          }`}>
            <span className="text-sm text-stone-700 flex-1">
              Bonus, inheritance, or other lump sum
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-stone-400">$</span>
              <input
                type="number"
                value={mod.windfall || ""}
                onChange={(e) => setWindfall(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0"
                className="w-24 rounded border border-stone-200 px-2 py-1 text-right text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                min={0}
                step={1000}
                data-testid="windfall-amount"
              />
              {mod.windfall > 0 && (
                <button
                  onClick={() => setWindfall(0)}
                  className="ml-1 text-xs text-stone-400 hover:text-stone-600"
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
        <div className="mt-6 border-t border-stone-100 pt-4" data-testid="scenario-comparison">
          <h4 className="mb-3 text-sm font-semibold text-stone-800">
            Scenario Impact
          </h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {comparison.netWorthDeltas.map(({ year, baseline, scenario: scenVal, delta }) => (
              <div
                key={year}
                className="rounded-lg border border-stone-100 bg-stone-50 p-3"
                data-testid={`delta-year-${year}`}
              >
                <p className="text-xs font-medium text-stone-500 mb-1">Net worth at year {year}</p>
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-xs text-stone-400">Current plan</p>
                    <p className="text-sm font-medium text-stone-700">{formatCurrency(baseline)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-stone-400">Scenario</p>
                    <p className="text-sm font-medium text-stone-700">{formatCurrency(scenVal)}</p>
                  </div>
                </div>
                <p className={`mt-1 text-xs font-semibold ${delta > 0 ? "text-emerald-600" : delta < 0 ? "text-red-500" : "text-stone-500"}`}>
                  {formatDelta(delta)} {delta > 0 ? "better" : delta < 0 ? "worse" : ""}
                </p>
              </div>
            ))}
          </div>

          {/* Debt-free timeline delta */}
          {comparison.consumerDebtFreeDeltaMonths !== null && comparison.consumerDebtFreeDeltaMonths !== 0 && (
            <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3" data-testid="debt-free-delta">
              <p className={`text-sm font-medium ${comparison.consumerDebtFreeDeltaMonths < 0 ? "text-emerald-700" : "text-red-600"}`}>
                {comparison.consumerDebtFreeDeltaMonths < 0 ? "🎉" : "⚠️"} Debt-free {formatMonthsDelta(comparison.consumerDebtFreeDeltaMonths)}
              </p>
            </div>
          )}

          {comparison.debtFreeDeltaMonths !== null && comparison.debtFreeDeltaMonths !== 0 && comparison.debtFreeDeltaMonths !== comparison.consumerDebtFreeDeltaMonths && (
            <div className="mt-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3" data-testid="all-debt-free-delta">
              <p className={`text-sm font-medium ${comparison.debtFreeDeltaMonths < 0 ? "text-emerald-700" : "text-red-600"}`}>
                {comparison.debtFreeDeltaMonths < 0 ? "🏠" : "⚠️"} All debt (incl. mortgage) free {formatMonthsDelta(comparison.debtFreeDeltaMonths)}
              </p>
            </div>
          )}
        </div>
      )}

      {!hasModifications && (
        <div className="mt-4 rounded-lg border border-dashed border-stone-200 p-4 text-center text-sm text-stone-400">
          Toggle a debt, adjust a contribution, or add a windfall above to see how it impacts your financial future.
        </div>
      )}
    </section>
  );
}
