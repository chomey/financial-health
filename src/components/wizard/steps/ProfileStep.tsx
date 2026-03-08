"use client";

import CountryJurisdictionSelector from "@/components/CountryJurisdictionSelector";
import FxRateDisplay from "@/components/FxRateDisplay";
import { getFilingStatuses } from "@/lib/tax-credits";
import type { FilingStatus } from "@/lib/tax-credits";
import type { FxRates, SupportedCurrency } from "@/lib/currency";

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
  country: "CA" | "US";
  jurisdiction: string;
  age: number | undefined;
  filingStatus: FilingStatus;
  taxYear: number;
  homeCurrency: SupportedCurrency;
  foreignCurrency: SupportedCurrency;
  effectiveFxRates: FxRates;
  fxManualOverride: number | undefined;
  onCountryChange: (c: "CA" | "US") => void;
  onJurisdictionChange: (j: string) => void;
  onAgeChange: (a: number | undefined) => void;
  onFilingStatusChange: (fs: FilingStatus) => void;
  onTaxYearChange: (y: number) => void;
  onFxManualOverrideChange: (v: number | undefined) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Your Profile</h2>
        <p className="mt-1 text-sm text-slate-400">
          Tell us about yourself so we can tailor tax calculations and financial benchmarks.
        </p>
      </div>

      {/* Country, Region, Tax, Filing */}
      <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Tax Year</label>
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
          <label className="block text-sm font-medium text-slate-300 mb-2">Filing Status</label>
          <select
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
          <label className="block text-sm font-medium text-slate-300 mb-2">Exchange Rate</label>
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
