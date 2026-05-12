import type { CountryProfile } from "@/lib/countries/types";
import { canadianTaxEngine } from "./tax-engine";
import { canadianVehicles } from "./vehicles";
import { canadianGovernmentRetirement } from "./government-retirement";
import { canadianTaxCredits } from "./tax-credits";
import { canadaProfiles } from "./sample-profiles";
import { canadianInsights } from "./insights";

export const CANADA: CountryProfile = {
  code: "CA",
  displayName: "Canada",
  shortLabel: "Canada",
  flagEmoji: "🇨🇦",
  homeCurrency: "CAD",
  locale: "en-CA",
  jurisdictions: [
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
  ],
  defaultJurisdiction: "ON",
  filingStatuses: [
    { value: "single", label: "Single" },
    { value: "married-common-law", label: "Married / Common-Law" },
  ],
  defaultFilingStatus: "single",
  taxYearLabel: (year) => String(year),
  taxYearBoundary: { startMonth: 1, startDay: 1 },
  taxEngine: canadianTaxEngine,
  vehicles: canadianVehicles,
  governmentRetirement: canadianGovernmentRetirement,
  taxCredits: canadianTaxCredits,
  profiles: canadaProfiles,
  insights: canadianInsights,
  wizardRegisteredCategories: ["TFSA", "RRSP"],
  flowchartWiki: {
    tipName: "r/PersonalFinanceCanada",
    linkText: "r/PersonalFinanceCanada",
    linkUrl: "https://www.reddit.com/r/PersonalFinanceCanada/wiki/money-steps",
  },
  regionTaxLabel: "Provincial",
};
