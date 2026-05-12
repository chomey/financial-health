import type { CountryProfile } from "@/lib/countries/types";
import { australianTaxEngine } from "./tax-engine";
import { australianVehicles } from "./vehicles";
import { australianGovernmentRetirement } from "./government-retirement";
import { australianTaxCredits } from "./tax-credits";
import { australianProfiles } from "./sample-profiles";
import { australianInsights } from "./insights";

export const AUSTRALIA: CountryProfile = {
  code: "AU",
  displayName: "Australia",
  shortLabel: "Australia",
  flagEmoji: "🇦🇺",
  homeCurrency: "AUD",
  locale: "en-AU",
  jurisdictions: [
    { code: "NSW", name: "New South Wales" },
    { code: "VIC", name: "Victoria" },
    { code: "QLD", name: "Queensland" },
    { code: "WA", name: "Western Australia" },
    { code: "SA", name: "South Australia" },
    { code: "TAS", name: "Tasmania" },
    { code: "ACT", name: "Australian Capital Territory" },
    { code: "NT", name: "Northern Territory" },
  ],
  defaultJurisdiction: "NSW",
  filingStatuses: [
    { value: "single", label: "Single" },
    { value: "married-de-facto", label: "Married / De Facto" },
  ],
  defaultFilingStatus: "single",
  taxYearLabel: (year) => `${year - 1}/${String(year).slice(2)} FY`,
  taxYearBoundary: { startMonth: 7, startDay: 1 },
  taxEngine: australianTaxEngine,
  vehicles: australianVehicles,
  governmentRetirement: australianGovernmentRetirement,
  taxCredits: australianTaxCredits,
  profiles: australianProfiles,
  insights: australianInsights,
  wizardRegisteredCategories: ["Roth IRA", "401k"],
  flowchartWiki: {
    tipName: "r/AusFinance",
    linkText: "r/personalfinance",
    linkUrl: "https://www.reddit.com/r/personalfinance/wiki/commontopics",
  },
  regionTaxLabel: "State",
};
