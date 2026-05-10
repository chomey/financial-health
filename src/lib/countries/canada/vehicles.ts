import type { VehicleCatalog } from "@/lib/countries/types";

const CATEGORIES = ["TFSA", "RRSP", "RESP", "FHSA", "LIRA"];

const DESCRIPTIONS: Record<string, string> = {
  "TFSA": "Tax-free growth and withdrawals, $7,000/yr contribution room",
  "RRSP": "Tax-deferred, contributions reduce taxable income, taxed on withdrawal",
  "RESP": "Education savings, government grants up to $7,200 lifetime",
  "FHSA": "Tax-free first home savings, $8,000/yr limit",
  "LIRA": "Locked-in retirement, from employer pension, withdrawal restrictions",
};

const DEFAULT_ROI: Record<string, number> = {
  "TFSA": 5, "RRSP": 5, "RESP": 5, "FHSA": 5, "LIRA": 5,
};

const TAX_SHELTERED = new Set(["TFSA", "FHSA"]);
const TAX_DEFERRED = new Set(["RRSP", "RESP", "LIRA"]);
const INCOME_TAX_ROI = new Set(["Savings", "Savings Account", "Checking", "GIC", "HISA"]);
const REINVEST_DEFAULT = new Set(["TFSA", "RRSP", "RESP", "FHSA", "LIRA", "Brokerage"]);
const EMPLOYER_MATCH = new Set(["RRSP"]);

export const canadianVehicles: VehicleCatalog = {
  categories: CATEGORIES,
  flagEmoji: "🇨🇦",
  getDescription: (category) => DESCRIPTIONS[category],
  getDefaultRoi: (category) => DEFAULT_ROI[category],
  isTaxSheltered: (category) => TAX_SHELTERED.has(category),
  isTaxDeferred: (category) => TAX_DEFERRED.has(category),
  isIncomeTaxRoi: (category) => INCOME_TAX_ROI.has(category),
  isReinvestDefault: (category) => REINVEST_DEFAULT.has(category),
  isEmployerMatchEligible: (category) => EMPLOYER_MATCH.has(category),
};
