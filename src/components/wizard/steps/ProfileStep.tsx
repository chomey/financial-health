"use client";

import CountryJurisdictionSelector from "@/components/CountryJurisdictionSelector";
import FxRateDisplay from "@/components/FxRateDisplay";
import HelpTip from "@/components/HelpTip";
import { getFilingStatuses } from "@/lib/tax-credits";
import type { FilingStatus } from "@/lib/tax-credits";
import type { FxRates, SupportedCurrency } from "@/lib/currency";
import { useModeContext } from "@/lib/ModeContext";

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
  onAgeChange,
  onFilingStatusChange,
  onTaxYearChange,
  onFxManualOverrideChange,
}: {
  country: "CA" | "US" | "AU";
  jurisdiction: string;
  age: number | undefined;
  filingStatus: FilingStatus;
  taxYear: number;
  homeCurrency: SupportedCurrency;
  foreignCurrency: SupportedCurrency;
  effectiveFxRates: FxRates;
  fxManualOverride: number | undefined;
  onCountryChange: (c: "CA" | "US" | "AU") => void;
  onJurisdictionChange: (j: string) => void;
  onAgeChange: (a: number | undefined) => void;
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
            className={`flex-1 rounded-xl border px-4 py-3 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-400 ${
              mode === "simple"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
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
            className={`flex-1 rounded-xl border px-4 py-3 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-400 ${
              mode === "advanced"
                ? "border-violet-500/40 bg-violet-500/10 text-violet-300"
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
          <div className="inline-flex rounded-lg border border-white/10 bg-white/5 p-0.5">
            <button
              type="button"
              onClick={() => onTaxYearChange(2025)}
              className={`inline-flex min-h-[36px] items-center rounded-md px-3 py-1 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-1 focus:ring-offset-slate-900 ${
                taxYear === 2025
                  ? "bg-white/15 text-slate-100 shadow-sm"
                  : "text-slate-500 hover:text-slate-300"
              }`}
              aria-pressed={taxYear === 2025}
              data-testid="tax-year-2025"
            >
              2025
            </button>
            <button
              type="button"
              onClick={() => onTaxYearChange(2026)}
              className={`inline-flex min-h-[36px] items-center rounded-md px-3 py-1 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-1 focus:ring-offset-slate-900 ${
                taxYear === 2026
                  ? "bg-white/15 text-slate-100 shadow-sm"
                  : "text-slate-500 hover:text-slate-300"
              }`}
              aria-pressed={taxYear === 2026}
              data-testid="tax-year-2026"
            >
              2026
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
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition-all duration-200 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-violet-400"
            data-testid="wizard-age-input"
          />
          <p className="mt-1 text-xs text-slate-500">Used for retirement projections and age-based benchmarks.</p>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <label className="text-sm font-medium text-slate-300" htmlFor="filing-status-select">Filing Status</label>
            <HelpTip text="Affects tax bracket thresholds and deduction amounts." />
          </div>
          <select
            id="filing-status-select"
            value={filingStatus}
            onChange={(e) => onFilingStatusChange(e.target.value as FilingStatus)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition-all duration-200 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-violet-400"
            data-testid="wizard-filing-status"
          >
            {getFilingStatuses(country).map((fs) => (
              <option key={fs.value} value={fs.value} className="bg-slate-800">
                {fs.label}
              </option>
            ))}
          </select>
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
