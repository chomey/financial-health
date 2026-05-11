import type { VehicleCatalog } from "@/lib/countries/types";

const CATEGORIES = [
  "Super (Accumulation)",
  "Super (Pension Phase)",
  "First Home Super Saver",
];

const DESCRIPTIONS: Record<string, string> = {
  "Super (Accumulation)": "Employer contributions + salary sacrifice, 15% tax on earnings, preserved until age 60",
  "Super (Pension Phase)": "Tax-free earnings and withdrawals after 60",
  "First Home Super Saver": "Withdraw up to $50,000 of voluntary super contributions for first home",
};

const DEFAULT_ROI: Record<string, number> = {
  "Super (Accumulation)": 7,
  "Super (Pension Phase)": 7,
  "First Home Super Saver": 7,
};

const TAX_SHELTERED = new Set(["Super (Pension Phase)"]);
const TAX_DEFERRED = new Set(["Super (Accumulation)"]);
const INCOME_TAX_ROI = new Set(["Savings", "Savings Account", "Checking", "GIC", "HISA"]);
const REINVEST_DEFAULT = new Set([
  "Super (Accumulation)",
  "Super (Pension Phase)",
  "First Home Super Saver",
  "Brokerage",
]);
const EMPLOYER_MATCH = new Set(["Super (Accumulation)"]);

export const australianVehicles: VehicleCatalog = {
  categories: CATEGORIES,
  flagEmoji: "🇦🇺",
  getDescription: (category) => DESCRIPTIONS[category],
  getDefaultRoi: (category) => DEFAULT_ROI[category],
  isTaxSheltered: (category) => TAX_SHELTERED.has(category),
  isTaxDeferred: (category) => TAX_DEFERRED.has(category),
  isIncomeTaxRoi: (category) => INCOME_TAX_ROI.has(category),
  isReinvestDefault: (category) => REINVEST_DEFAULT.has(category),
  isEmployerMatchEligible: (category) => EMPLOYER_MATCH.has(category),
};
