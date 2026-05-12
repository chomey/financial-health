"use client";

import { useCallback } from "react";
import { getRegisteredCountries, getCountry } from "@/lib/countries";
import type { CountryCode } from "@/lib/countries";

interface CountryJurisdictionSelectorProps {
  country: CountryCode;
  jurisdiction: string;
  onCountryChange: (country: CountryCode) => void;
  onJurisdictionChange: (jurisdiction: string) => void;
  taxYear?: number;
  onTaxYearChange?: (year: number) => void;
}

export default function CountryJurisdictionSelector({
  country,
  jurisdiction,
  onCountryChange,
  onJurisdictionChange,
  taxYear = new Date().getFullYear(),
  onTaxYearChange,
}: CountryJurisdictionSelectorProps) {
  const jurisdictions = getCountry(country).jurisdictions;

  const handleCountryChange = useCallback(
    (newCountry: CountryCode) => {
      if (newCountry !== country) {
        onCountryChange(newCountry);
        onJurisdictionChange(getCountry(newCountry).defaultJurisdiction);
      }
    },
    [country, onCountryChange, onJurisdictionChange]
  );

  return (
    <div className="space-y-2" data-testid="country-jurisdiction-selector">
      {/* Tax year + Country + Region row */}
      <div className="flex flex-wrap items-center gap-2">
        {onTaxYearChange && (
          <div className="inline-flex rounded-lg border border-white/10 bg-white/5 p-0.5">
            <button
              type="button"
              onClick={() => onTaxYearChange(2025)}
              className={`inline-flex min-h-[36px] items-center rounded-md px-2.5 py-1 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-1 focus:ring-offset-slate-900 ${
                taxYear === 2025
                  ? "bg-white/15 text-slate-100 shadow-sm"
                  : "text-slate-500 hover:text-slate-300"
              }`}
              aria-pressed={taxYear === 2025}
              aria-label="Tax year 2025"
              data-testid="tax-year-2025"
            >
              2025
            </button>
            <button
              type="button"
              onClick={() => onTaxYearChange(2026)}
              className={`inline-flex min-h-[36px] items-center rounded-md px-2.5 py-1 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-1 focus:ring-offset-slate-900 ${
                taxYear === 2026
                  ? "bg-white/15 text-slate-100 shadow-sm"
                  : "text-slate-500 hover:text-slate-300"
              }`}
              aria-pressed={taxYear === 2026}
              aria-label="Tax year 2026"
              data-testid="tax-year-2026"
            >
              2026
            </button>
          </div>
        )}
        <div className="inline-flex rounded-lg border border-white/10 bg-white/5 p-0.5">
          {getRegisteredCountries().map((profile) => (
            <button
              key={profile.code}
              type="button"
              onClick={() => handleCountryChange(profile.code)}
              className={`inline-flex min-h-[36px] items-center gap-1 rounded-md px-2.5 py-1 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-1 focus:ring-offset-slate-900 ${
                country === profile.code
                  ? "bg-white/15 text-slate-100 shadow-sm"
                  : "text-slate-500 hover:text-slate-300"
              }`}
              aria-pressed={country === profile.code}
              aria-label={`Select ${profile.displayName}`}
              data-testid={`country-${profile.code.toLowerCase()}`}
            >
              <span aria-hidden="true" className="text-base leading-none">{profile.flagEmoji}</span>
              {profile.shortLabel}
            </button>
          ))}
        </div>
        <select
          value={jurisdiction}
          onChange={(e) => onJurisdictionChange(e.target.value)}
          className="min-h-[36px] flex-1 rounded-lg border border-white/10 bg-slate-800 px-2 py-1 text-sm font-medium text-slate-300 shadow-sm transition-all duration-200 hover:border-white/20 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-1 focus:ring-offset-slate-900"
          aria-label={country === "CA" ? "Select province or territory" : country === "AU" ? "Select state or territory" : "Select state"}
          data-testid="jurisdiction-select"
        >
          {jurisdictions.map((j) => (
            <option key={j.code} value={j.code}>
              {j.name} ({j.code})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
