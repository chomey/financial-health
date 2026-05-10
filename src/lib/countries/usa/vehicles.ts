import type { VehicleCatalog } from "@/lib/countries/types";

const CATEGORIES = ["401k", "Roth 401k", "IRA", "Roth IRA", "529", "HSA"];

const DESCRIPTIONS: Record<string, string> = {
  "401k": "Employer-sponsored, pre-tax contributions, taxed on withdrawal",
  "Roth 401k": "After-tax contributions, tax-free growth and withdrawals",
  "IRA": "Individual retirement, pre-tax, $7,000/yr limit",
  "Roth IRA": "After-tax, tax-free growth, $7,000/yr limit, income limits apply",
  "529": "Education savings, tax-free for qualified expenses",
  "HSA": "Triple tax advantage for medical expenses, $4,300/yr single",
};

const DEFAULT_ROI: Record<string, number> = {
  "401k": 7, "Roth 401k": 7, "IRA": 7, "Roth IRA": 7, "529": 6, "HSA": 6,
};

const TAX_SHELTERED = new Set(["Roth IRA", "Roth 401k", "HSA"]);
const TAX_DEFERRED = new Set(["401k", "IRA", "529"]);
const INCOME_TAX_ROI = new Set(["Savings", "Savings Account", "Checking", "GIC", "HISA"]);
const REINVEST_DEFAULT = new Set(["401k", "Roth 401k", "IRA", "Roth IRA", "529", "HSA", "Brokerage"]);
const EMPLOYER_MATCH = new Set(["401k", "Roth 401k"]);

export const americanVehicles: VehicleCatalog = {
  categories: CATEGORIES,
  flagEmoji: "🇺🇸",
  getDescription: (category) => DESCRIPTIONS[category],
  getDefaultRoi: (category) => DEFAULT_ROI[category],
  isTaxSheltered: (category) => TAX_SHELTERED.has(category),
  isTaxDeferred: (category) => TAX_DEFERRED.has(category),
  isIncomeTaxRoi: (category) => INCOME_TAX_ROI.has(category),
  isReinvestDefault: (category) => REINVEST_DEFAULT.has(category),
  isEmployerMatchEligible: (category) => EMPLOYER_MATCH.has(category),
};
