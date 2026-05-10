import { describe, it, expect } from "vitest";
import { getWithdrawalTaxRate } from "@/lib/withdrawal-tax";

const CATEGORIES_BY_COUNTRY: Record<"CA" | "US" | "AU", string[]> = {
  CA: ["TFSA", "RRSP", "RESP", "FHSA", "LIRA", "Savings Account", "Brokerage"],
  US: ["401k", "Roth 401k", "IRA", "Roth IRA", "529", "HSA", "Brokerage"],
  AU: ["Super (Accumulation)", "Super (Pension Phase)", "First Home Super Saver", "Brokerage"],
};

const JURISDICTION_BY_COUNTRY: Record<"CA" | "US" | "AU", string> = {
  CA: "ON", US: "CA", AU: "NSW",
};

describe("withdrawal tax snapshot regression", () => {
  for (const country of ["CA", "US", "AU"] as const) {
    for (const cat of CATEGORIES_BY_COUNTRY[country]) {
      for (const amount of [10_000, 50_000, 100_000]) {
        it(`${country} ${cat} ${amount}`, () => {
          const result = getWithdrawalTaxRate(
            cat,
            country,
            JURISDICTION_BY_COUNTRY[country],
            amount,
            100,
            undefined,
            2025,
          );
          expect(result).toMatchSnapshot();
        });
      }
    }
  }
});
