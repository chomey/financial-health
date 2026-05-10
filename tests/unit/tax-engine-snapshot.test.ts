import { describe, it, expect } from "vitest";
import { computeTax, getMarginalRateForIncome } from "@/lib/tax-engine";

const SAMPLE_INCOMES = [10_000, 50_000, 100_000, 200_000, 500_000];
const TYPES = ["employment", "capital-gains", "other"] as const;
const YEARS = [2025, 2026];

const COMBOS: Array<[("CA" | "US" | "AU"), string]> = [
  ["CA", "ON"], ["CA", "AB"], ["CA", "BC"], ["CA", "QC"],
  ["US", "CA"], ["US", "TX"], ["US", "NY"], ["US", "FL"],
  ["AU", "NSW"], ["AU", "VIC"], ["AU", "QLD"],
];

describe("tax engine snapshot regression", () => {
  for (const [country, jurisdiction] of COMBOS) {
    for (const year of YEARS) {
      for (const type of TYPES) {
        for (const income of SAMPLE_INCOMES) {
          it(`${country}/${jurisdiction} ${year} ${type} ${income}`, () => {
            const result = computeTax(income, type, country, jurisdiction, year);
            expect(result).toMatchSnapshot();
          });
        }
      }
    }
  }
});

describe("marginal rate snapshot regression", () => {
  for (const [country, jurisdiction] of COMBOS) {
    for (const year of YEARS) {
      for (const income of SAMPLE_INCOMES) {
        it(`${country}/${jurisdiction} ${year} ${income}`, () => {
          const rate = getMarginalRateForIncome(income, country, jurisdiction, year);
          expect(rate).toMatchSnapshot();
        });
      }
    }
  }
});
