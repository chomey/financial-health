"use client";

import { useCallback } from "react";

export const CA_PROVINCES: { code: string; name: string }[] = [
  { code: "AB", name: "Alberta" },
  { code: "BC", name: "British Columbia" },
  { code: "MB", name: "Manitoba" },
  { code: "NB", name: "New Brunswick" },
  { code: "NL", name: "Newfoundland and Labrador" },
  { code: "NT", name: "Northwest Territories" },
  { code: "NS", name: "Nova Scotia" },
  { code: "NU", name: "Nunavut" },
  { code: "ON", name: "Ontario" },
  { code: "PE", name: "Prince Edward Island" },
  { code: "QC", name: "Quebec" },
  { code: "SK", name: "Saskatchewan" },
  { code: "YT", name: "Yukon" },
];

export const US_STATES: { code: string; name: string }[] = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

export const AU_STATES_TERRITORIES: { code: string; name: string }[] = [
  { code: "ACT", name: "Australian Capital Territory" },
  { code: "NSW", name: "New South Wales" },
  { code: "NT", name: "Northern Territory" },
  { code: "QLD", name: "Queensland" },
  { code: "SA", name: "South Australia" },
  { code: "TAS", name: "Tasmania" },
  { code: "VIC", name: "Victoria" },
  { code: "WA", name: "Western Australia" },
];

export const DEFAULT_JURISDICTION: Record<"CA" | "US" | "AU", string> = {
  CA: "ON",
  US: "CA",
  AU: "NSW",
};

interface CountryJurisdictionSelectorProps {
  country: "CA" | "US" | "AU";
  jurisdiction: string;
  onCountryChange: (country: "CA" | "US" | "AU") => void;
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
  const jurisdictions =
    country === "CA" ? CA_PROVINCES : country === "US" ? US_STATES : AU_STATES_TERRITORIES;

  const handleCountryChange = useCallback(
    (newCountry: "CA" | "US" | "AU") => {
      if (newCountry !== country) {
        onCountryChange(newCountry);
        onJurisdictionChange(DEFAULT_JURISDICTION[newCountry]);
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
          <button
            type="button"
            onClick={() => handleCountryChange("CA")}
            className={`inline-flex min-h-[36px] items-center gap-1 rounded-md px-2.5 py-1 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-1 focus:ring-offset-slate-900 ${
              country === "CA"
                ? "bg-white/15 text-slate-100 shadow-sm"
                : "text-slate-500 hover:text-slate-300"
            }`}
            aria-pressed={country === "CA"}
            aria-label="Select Canada"
            data-testid="country-ca"
          >
            <span aria-hidden="true" className="text-base leading-none">🇨🇦</span>
            Canada
          </button>
          <button
            type="button"
            onClick={() => handleCountryChange("US")}
            className={`inline-flex min-h-[36px] items-center gap-1 rounded-md px-2.5 py-1 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-1 focus:ring-offset-slate-900 ${
              country === "US"
                ? "bg-white/15 text-slate-100 shadow-sm"
                : "text-slate-500 hover:text-slate-300"
            }`}
            aria-pressed={country === "US"}
            aria-label="Select United States"
            data-testid="country-us"
          >
            <span aria-hidden="true" className="text-base leading-none">🇺🇸</span>
            USA
          </button>
          <button
            type="button"
            onClick={() => handleCountryChange("AU")}
            className={`inline-flex min-h-[36px] items-center gap-1 rounded-md px-2.5 py-1 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-1 focus:ring-offset-slate-900 ${
              country === "AU"
                ? "bg-white/15 text-slate-100 shadow-sm"
                : "text-slate-500 hover:text-slate-300"
            }`}
            aria-pressed={country === "AU"}
            aria-label="Select Australia"
            data-testid="country-au"
          >
            <span aria-hidden="true" className="text-base leading-none">🇦🇺</span>
            AU
          </button>
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
