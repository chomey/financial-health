/**
 * Year-override resolver for TaxCreditCategory.
 * Kept in its own file so country plugins can import it without
 * creating a circular dependency with tax-credits.ts → countries/ → here.
 */

import type { TaxCreditCategory } from "@/lib/tax-credit-types";

/**
 * Resolve a credit category for a specific tax year by merging yearOverrides.
 * Returns a new object with overridden fields applied (does not mutate original).
 */
export function resolveCategoryForYear(category: TaxCreditCategory, year: number): TaxCreditCategory {
  const overrides = category.yearOverrides?.[year];
  if (!overrides) return category;
  return {
    ...category,
    ...(overrides.maxAmount !== undefined ? { maxAmount: overrides.maxAmount } : {}),
    ...(overrides.description !== undefined ? { description: overrides.description } : {}),
    ...(overrides.incomeLimits !== undefined ? { incomeLimits: overrides.incomeLimits } : {}),
    ...(overrides.amountOptions !== undefined ? { amountOptions: overrides.amountOptions } : {}),
  };
}
