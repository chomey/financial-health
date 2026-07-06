"use client";

import CountryJurisdictionSelector from "@/components/CountryJurisdictionSelector";
import FxRateDisplay from "@/components/FxRateDisplay";
import GovernmentRetirementInput from "@/components/GovernmentRetirementInput";
import HelpTip from "@/components/HelpTip";
import type { FilingStatus } from "@/lib/tax-credits";
import { getCountry } from "@/lib/countries";
import type { FxRates, SupportedCurrency } from "@/lib/currency";
import type { GovernmentRetirementIncome } from "@/lib/financial-types";
import { useModeContext } from "@/lib/ModeContext";
import {
  FORM_INPUT_CLASS,
  FORM_SELECT_CLASS,
  SEGMENT_ACTIVE_CLASS,
  SEGMENT_CLASS,
  SEGMENT_INACTIVE_CLASS,
  SEGMENTED_CONTAINER_CLASS,
} from "@/components/formStyles";

export default function ProfileStep({
  country,
  jurisdiction,
  age,
  filingStatus,
  taxYear,
  homeCurrency,
  foreignCurrency,
  effectiveFxRates,
  fxManualOverride,
  onCountryChange,
  onJurisdictionChange,
  retirementAge,
  onAgeChange,
  onRetirementAgeChange,
  onFilingStatusChange,
  onTaxYearChange,
  governmentRetirementIncome,
  onGovernmentRetirementIncomeChange,
  onFxManualOverrideChange,
}: {
  country: "CA" | "US" | "AU";
  jurisdiction: string;
  age: number | undefined;
  retirementAge: number;
  governmentRetirementIncome: GovernmentRetirementIncome | undefined;
  filingStatus: FilingStatus;
  taxYear: number;
  homeCurrency: SupportedCurrency;
  foreignCurrency: SupportedCurrency;
  effectiveFxRates: FxRates;
  fxManualOverride: number | undefined;
  onCountryChange: (c: "CA" | "US" | "AU") => void;
  onJurisdictionChange: (j: string) => void;
  onAgeChange: (a: number | undefined) => void;
  onRetirementAgeChange: (a: number) => void;
  onGovernmentRetirementIncomeChange: (v: GovernmentRetirementIncome | undefined) => void;
  onFilingStatusChange: (fs: FilingStatus) => void;
  onTaxYearChange: (y: number) => void;
  onFxManualOverrideChange: (v: number | undefined) => void;
}) {
  const { mode, setMode } = useModeContext();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Your Profile</h2>
        <p className="mt-1 text-sm text-slate-400">
          Tell us about yourself so we can tailor tax calculations and financial benchmarks.
        </p>
      </div>

      {/* Mode selector */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-1.5">
          <span className="text-sm font-medium text-slate-300">Detail Level</span>
          <HelpTip text="Simple mode shows only the most important fields. Advanced mode unlocks all options including tax credits, individual stocks, ROI settings, and more." />
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setMode("simple")}
            className={`flex-1 rounded-xl border px-4 py-3 text-left transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:outline-none ${
              mode === "simple"
                ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-200"
                : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:bg-white/10 hover:text-slate-200"
            }`}
            aria-pressed={mode === "simple"}
            data-testid="profile-mode-simple"
          >
            <div className="text-sm font-semibold">Simple</div>
            <div className="mt-0.5 text-xs opacity-75">Essential fields only — done in minutes</div>
          </button>
          <button
            type="button"
            onClick={() => setMode("advanced")}
            className={`flex-1 rounded-xl border px-4 py-3 text-left transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:outline-none ${
              mode === "advanced"
                ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-200"
                : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:bg-white/10 hover:text-slate-200"
            }`}
            aria-pressed={mode === "advanced"}
            data-testid="profile-mode-advanced"
          >
            <div className="text-sm font-semibold">Advanced</div>
            <div className="mt-0.5 text-xs opacity-75">Full detail — tax credits, stocks, ROI &amp; more</div>
          </button>
        </div>
      </div>

      {/* Country, Region, Tax, Filing */}
      <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5">
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <span className="text-sm font-medium text-slate-300">Tax Year</span>
            <HelpTip text="Which tax year to use for estimating your taxes." />
          </div>
          <div className={SEGMENTED_CONTAINER_CLASS}>
            <button
              type="button"
              onClick={() => onTaxYearChange(2025)}
              className={`${SEGMENT_CLASS} px-3 ${taxYear === 2025 ? SEGMENT_ACTIVE_CLASS : SEGMENT_INACTIVE_CLASS}`}
              aria-pressed={taxYear === 2025}
              data-testid="tax-year-2025"
            >
              {getCountry(country).taxYearLabel(2025)}
            </button>
            <button
              type="button"
              onClick={() => onTaxYearChange(2026)}
              className={`${SEGMENT_CLASS} px-3 ${taxYear === 2026 ? SEGMENT_ACTIVE_CLASS : SEGMENT_INACTIVE_CLASS}`}
              aria-pressed={taxYear === 2026}
              data-testid="tax-year-2026"
            >
              {getCountry(country).taxYearLabel(2026)}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Country &amp; Region</label>
          <CountryJurisdictionSelector
            country={country}
            jurisdiction={jurisdiction}
            onCountryChange={onCountryChange}
            onJurisdictionChange={onJurisdictionChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Age</label>
          <input
            type="number"
            min={0}
            max={120}
            value={age ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              onAgeChange(val === "" ? undefined : parseInt(val, 10));
            }}
            placeholder="Your age (optional)"
            className={`${FORM_INPUT_CLASS} w-full`}
            data-testid="wizard-age-input"
          />
          <p className="mt-1 text-xs text-slate-500">Used for retirement projections and age-based benchmarks.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Target Retirement Age</label>
          <input
            type="number"
            min={30}
            max={100}
            value={retirementAge}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (val >= 30 && val <= 100) onRetirementAgeChange(val);
            }}
            className={`${FORM_INPUT_CLASS} w-full`}
            data-testid="wizard-retirement-age-input"
          />
          <p className="mt-1 text-xs text-slate-500">Used for FIRE and Coast FIRE calculations. Default: 65.</p>
        </div>

        {mode !== "simple" && (
          <GovernmentRetirementInput
            country={country}
            value={governmentRetirementIncome}
            onChange={onGovernmentRetirementIncomeChange}
          />
        )}

        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <label className="text-sm font-medium text-slate-300" htmlFor="filing-status-select">Filing Status</label>
            <HelpTip text="Affects tax bracket thresholds and deduction amounts." />
          </div>
          <div className="relative">
            <select
              id="filing-status-select"
              value={filingStatus}
              onChange={(e) => onFilingStatusChange(e.target.value as FilingStatus)}
              className={`${FORM_SELECT_CLASS} w-full`}
              data-testid="wizard-filing-status"
            >
              {getCountry(country).filingStatuses.map((fs) => (
                <option key={fs.value} value={fs.value} className="bg-slate-800">
                  {fs.label}
                </option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <span className="text-sm font-medium text-slate-300">Exchange Rate</span>
            <HelpTip text="Used to convert foreign-currency holdings to your home currency." />
          </div>
          <FxRateDisplay
            homeCurrency={homeCurrency}
            foreignCurrency={foreignCurrency}
            fxRates={effectiveFxRates}
            fxManualOverride={fxManualOverride}
            onManualOverrideChange={onFxManualOverrideChange}
          />
        </div>
      </div>
    </div>
  );
}
