"use client";

import { useCallback } from "react";
import { getRegisteredCountries, getCountry } from "@/lib/countries";
import type { CountryCode } from "@/lib/countries";
import { clampTaxYear } from "@/lib/countries/canada/tax-tables";
import {
  FORM_SELECT_CLASS,
  SEGMENT_ACTIVE_CLASS,
  SEGMENT_CLASS,
  SEGMENT_INACTIVE_CLASS,
  SEGMENTED_CONTAINER_CLASS,
} from "@/components/formStyles";

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
  taxYear = clampTaxYear(new Date().getFullYear()),
  onTaxYearChange,
}: CountryJurisdictionSelectorProps) {
  const profile = getCountry(country);
  const jurisdictions = profile.jurisdictions;

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
          <div className={SEGMENTED_CONTAINER_CLASS}>
            <button
              type="button"
              onClick={() => onTaxYearChange(2025)}
              className={`${SEGMENT_CLASS} ${taxYear === 2025 ? SEGMENT_ACTIVE_CLASS : SEGMENT_INACTIVE_CLASS}`}
              aria-pressed={taxYear === 2025}
              aria-label={`Tax year ${profile.taxYearLabel(2025)}`}
              data-testid="tax-year-2025"
            >
              {profile.taxYearLabel(2025)}
            </button>
            <button
              type="button"
              onClick={() => onTaxYearChange(2026)}
              className={`${SEGMENT_CLASS} ${taxYear === 2026 ? SEGMENT_ACTIVE_CLASS : SEGMENT_INACTIVE_CLASS}`}
              aria-pressed={taxYear === 2026}
              aria-label={`Tax year ${profile.taxYearLabel(2026)}`}
              data-testid="tax-year-2026"
            >
              {profile.taxYearLabel(2026)}
            </button>
          </div>
        )}
        <div className={SEGMENTED_CONTAINER_CLASS}>
          {getRegisteredCountries().map((profile) => (
            <button
              key={profile.code}
              type="button"
              onClick={() => handleCountryChange(profile.code)}
              className={`${SEGMENT_CLASS} gap-1 ${country === profile.code ? SEGMENT_ACTIVE_CLASS : SEGMENT_INACTIVE_CLASS}`}
              aria-pressed={country === profile.code}
              aria-label={`Select ${profile.displayName}`}
              data-testid={`country-${profile.code.toLowerCase()}`}
            >
              <span aria-hidden="true" className="text-base leading-none">{profile.flagEmoji}</span>
              {profile.shortLabel}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <select
            value={jurisdiction}
            onChange={(e) => onJurisdictionChange(e.target.value)}
            className={`${FORM_SELECT_CLASS} w-full font-medium`}
            aria-label={country === "CA" ? "Select province or territory" : country === "AU" ? "Select state or territory" : "Select state"}
            data-testid="jurisdiction-select"
          >
            {jurisdictions.map((j) => (
              <option key={j.code} value={j.code}>
                {j.name} ({j.code})
              </option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  );
}
