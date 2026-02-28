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

export const DEFAULT_JURISDICTION: Record<"CA" | "US", string> = {
  CA: "ON",
  US: "CA",
};

interface CountryJurisdictionSelectorProps {
  country: "CA" | "US";
  jurisdiction: string;
  onCountryChange: (country: "CA" | "US") => void;
  onJurisdictionChange: (jurisdiction: string) => void;
}

export default function CountryJurisdictionSelector({
  country,
  jurisdiction,
  onCountryChange,
  onJurisdictionChange,
}: CountryJurisdictionSelectorProps) {
  const jurisdictions = country === "CA" ? CA_PROVINCES : US_STATES;

  const handleCountryChange = useCallback(
    (newCountry: "CA" | "US") => {
      if (newCountry !== country) {
        onCountryChange(newCountry);
        onJurisdictionChange(DEFAULT_JURISDICTION[newCountry]);
      }
    },
    [country, onCountryChange, onJurisdictionChange]
  );

  return (
    <div className="flex items-center gap-1.5" data-testid="country-jurisdiction-selector">
      {/* Country segmented control */}
      <div className="inline-flex rounded-lg border border-stone-200 bg-stone-100 p-0.5">
        <button
          type="button"
          onClick={() => handleCountryChange("CA")}
          className={`inline-flex min-h-[36px] items-center gap-1 rounded-md px-2.5 py-1 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 ${
            country === "CA"
              ? "bg-white text-stone-800 shadow-sm"
              : "text-stone-500 hover:text-stone-700"
          }`}
          aria-pressed={country === "CA"}
          aria-label="Select Canada"
          data-testid="country-ca"
        >
          <span aria-hidden="true" className="text-base leading-none">🇨🇦</span>
          <span className="hidden sm:inline">Canada</span>
        </button>
        <button
          type="button"
          onClick={() => handleCountryChange("US")}
          className={`inline-flex min-h-[36px] items-center gap-1 rounded-md px-2.5 py-1 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 ${
            country === "US"
              ? "bg-white text-stone-800 shadow-sm"
              : "text-stone-500 hover:text-stone-700"
          }`}
          aria-pressed={country === "US"}
          aria-label="Select United States"
          data-testid="country-us"
        >
          <span aria-hidden="true" className="text-base leading-none">🇺🇸</span>
          <span className="hidden sm:inline">USA</span>
        </button>
      </div>

      {/* Jurisdiction dropdown */}
      <select
        value={jurisdiction}
        onChange={(e) => onJurisdictionChange(e.target.value)}
        className="min-h-[36px] rounded-lg border border-stone-200 bg-white px-2 py-1 text-sm font-medium text-stone-700 shadow-sm transition-all duration-200 hover:border-stone-300 hover:shadow focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
        aria-label={country === "CA" ? "Select province or territory" : "Select state"}
        data-testid="jurisdiction-select"
      >
        {jurisdictions.map((j) => (
          <option key={j.code} value={j.code}>
            {j.name} ({j.code})
          </option>
        ))}
      </select>
    </div>
  );
}
