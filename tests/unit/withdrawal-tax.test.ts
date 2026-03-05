import { describe, it, expect } from "vitest";
import { getTaxTreatment, getWithdrawalTaxRate, type TaxTreatment } from "@/lib/withdrawal-tax";

describe("getTaxTreatment", () => {
  describe("tax-free accounts", () => {
    it.each(["TFSA", "Roth IRA", "HSA"])("classifies %s as tax-free", (category) => {
      expect(getTaxTreatment(category)).toBe("tax-free");
    });
  });

  describe("tax-deferred accounts", () => {
    it.each(["RRSP", "401k", "IRA", "LIRA", "RESP", "FHSA", "529"])("classifies %s as tax-deferred", (category) => {
      expect(getTaxTreatment(category)).toBe("tax-deferred");
    });
  });

  describe("taxable accounts", () => {
    it.each(["Savings", "Savings Account", "Checking", "Brokerage", "Vehicle", "Other"])("classifies %s as taxable", (category) => {
      expect(getTaxTreatment(category)).toBe("taxable");
    });
  });

  it("defaults unknown categories to taxable", () => {
    expect(getTaxTreatment("Unknown Account")).toBe("taxable");
    expect(getTaxTreatment("My Custom Fund")).toBe("taxable");
    expect(getTaxTreatment("")).toBe("taxable");
  });
});

describe("getWithdrawalTaxRate", () => {
  describe("zero/negative withdrawal", () => {
    it("returns zero for zero withdrawal", () => {
      const result = getWithdrawalTaxRate("RRSP", "CA", "ON", 0);
      expect(result.effectiveRate).toBe(0);
      expect(result.taxFreeAmount).toBe(0);
      expect(result.taxableAmount).toBe(0);
    });

    it("returns zero for negative withdrawal", () => {
      const result = getWithdrawalTaxRate("RRSP", "CA", "ON", -1000);
      expect(result.effectiveRate).toBe(0);
      expect(result.taxFreeAmount).toBe(0);
      expect(result.taxableAmount).toBe(0);
    });
  });

  describe("tax-free accounts", () => {
    it("TFSA withdrawal has zero tax", () => {
      const result = getWithdrawalTaxRate("TFSA", "CA", "ON", 50000);
      expect(result.effectiveRate).toBe(0);
      expect(result.taxFreeAmount).toBe(50000);
      expect(result.taxableAmount).toBe(0);
    });

    it("Roth IRA withdrawal has zero tax", () => {
      const result = getWithdrawalTaxRate("Roth IRA", "US", "CA", 100000);
      expect(result.effectiveRate).toBe(0);
      expect(result.taxFreeAmount).toBe(100000);
      expect(result.taxableAmount).toBe(0);
    });

    it("HSA withdrawal has zero tax", () => {
      const result = getWithdrawalTaxRate("HSA", "US", "TX", 10000);
      expect(result.effectiveRate).toBe(0);
      expect(result.taxFreeAmount).toBe(10000);
      expect(result.taxableAmount).toBe(0);
    });
  });

  describe("tax-deferred accounts", () => {
    it("RRSP withdrawal is fully taxed as income (CA/ON)", () => {
      const result = getWithdrawalTaxRate("RRSP", "CA", "ON", 50000);
      expect(result.taxableAmount).toBe(50000);
      expect(result.taxFreeAmount).toBe(0);
      expect(result.effectiveRate).toBeGreaterThan(0);
      // At $50k in ON, effective rate should be reasonable (roughly 15-25%)
      expect(result.effectiveRate).toBeGreaterThan(0.1);
      expect(result.effectiveRate).toBeLessThan(0.35);
    });

    it("401k withdrawal is fully taxed as income (US/CA)", () => {
      const result = getWithdrawalTaxRate("401k", "US", "CA", 80000);
      expect(result.taxableAmount).toBe(80000);
      expect(result.taxFreeAmount).toBe(0);
      expect(result.effectiveRate).toBeGreaterThan(0);
    });

    it("IRA withdrawal is fully taxed as income (US/NY)", () => {
      const result = getWithdrawalTaxRate("IRA", "US", "NY", 60000);
      expect(result.taxableAmount).toBe(60000);
      expect(result.taxFreeAmount).toBe(0);
      expect(result.effectiveRate).toBeGreaterThan(0);
    });

    it("529 withdrawal is taxed as income", () => {
      const result = getWithdrawalTaxRate("529", "US", "TX", 30000);
      expect(result.taxableAmount).toBe(30000);
      expect(result.taxFreeAmount).toBe(0);
    });

    it("LIRA withdrawal is taxed as income (CA/ON)", () => {
      const result = getWithdrawalTaxRate("LIRA", "CA", "ON", 40000);
      expect(result.taxableAmount).toBe(40000);
      expect(result.taxFreeAmount).toBe(0);
      expect(result.effectiveRate).toBeGreaterThan(0);
    });

    it("no-tax state: 401k in TX has lower effective rate than NY", () => {
      const txResult = getWithdrawalTaxRate("401k", "US", "TX", 100000);
      const nyResult = getWithdrawalTaxRate("401k", "US", "NY", 100000);
      // TX has no state income tax, so effective rate should be lower
      expect(txResult.effectiveRate).toBeLessThan(nyResult.effectiveRate);
    });

    it("higher withdrawal has higher effective rate (progressive brackets)", () => {
      const low = getWithdrawalTaxRate("RRSP", "CA", "ON", 30000);
      const high = getWithdrawalTaxRate("RRSP", "CA", "ON", 200000);
      expect(high.effectiveRate).toBeGreaterThan(low.effectiveRate);
    });
  });

  describe("taxable accounts", () => {
    it("100% cost basis means zero tax", () => {
      const result = getWithdrawalTaxRate("Brokerage", "CA", "ON", 50000, 100);
      expect(result.effectiveRate).toBe(0);
      expect(result.taxFreeAmount).toBe(50000);
      expect(result.taxableAmount).toBe(0);
    });

    it("0% cost basis means full amount is gains, taxed as capital gains", () => {
      const result = getWithdrawalTaxRate("Brokerage", "CA", "ON", 50000, 0);
      expect(result.taxableAmount).toBe(50000);
      expect(result.taxFreeAmount).toBe(0);
      expect(result.effectiveRate).toBeGreaterThan(0);
    });

    it("50% cost basis means half is gains, half is tax-free", () => {
      const result = getWithdrawalTaxRate("Brokerage", "CA", "ON", 100000, 50);
      expect(result.taxFreeAmount).toBe(50000);
      expect(result.taxableAmount).toBe(50000);
      expect(result.effectiveRate).toBeGreaterThan(0);
      // Effective rate should be lower than full capital gains rate because
      // only half the withdrawal is taxable
      const fullGains = getWithdrawalTaxRate("Brokerage", "CA", "ON", 100000, 0);
      expect(result.effectiveRate).toBeLessThan(fullGains.effectiveRate);
    });

    it("capital gains in CA are taxed at lower effective rate than employment income", () => {
      // Compare: $100k capital gains vs $100k employment (both at same bracket)
      const capitalGains = getWithdrawalTaxRate("Brokerage", "CA", "ON", 100000, 0);
      const employment = getWithdrawalTaxRate("RRSP", "CA", "ON", 100000);
      // Capital gains should have lower effective rate due to 50% inclusion
      expect(capitalGains.effectiveRate).toBeLessThan(employment.effectiveRate);
    });

    it("US capital gains have lower effective rate than employment income", () => {
      const capitalGains = getWithdrawalTaxRate("Brokerage", "US", "CA", 100000, 0);
      const employment = getWithdrawalTaxRate("401k", "US", "CA", 100000);
      expect(capitalGains.effectiveRate).toBeLessThan(employment.effectiveRate);
    });

    it("clamps cost basis percent to 0-100 range", () => {
      // Over 100% should be treated as 100%
      const over = getWithdrawalTaxRate("Brokerage", "CA", "ON", 50000, 150);
      expect(over.effectiveRate).toBe(0);
      expect(over.taxFreeAmount).toBe(50000);

      // Under 0% should be treated as 0%
      const under = getWithdrawalTaxRate("Brokerage", "CA", "ON", 50000, -50);
      expect(under.taxableAmount).toBe(50000);
      expect(under.taxFreeAmount).toBe(0);
    });

    it("defaults costBasisPercent to 100 when omitted", () => {
      const result = getWithdrawalTaxRate("Savings", "CA", "ON", 50000);
      expect(result.effectiveRate).toBe(0);
      expect(result.taxFreeAmount).toBe(50000);
      expect(result.taxableAmount).toBe(0);
    });

    it("unknown category treated as taxable with default 100% cost basis", () => {
      const result = getWithdrawalTaxRate("My Custom Fund", "CA", "ON", 50000);
      expect(result.effectiveRate).toBe(0);
      expect(result.taxFreeAmount).toBe(50000);
    });
  });

  describe("cross-jurisdiction comparisons", () => {
    it("tax-deferred in CA vs US: both have positive effective rates", () => {
      const ca = getWithdrawalTaxRate("RRSP", "CA", "ON", 80000);
      const us = getWithdrawalTaxRate("401k", "US", "NY", 80000);
      expect(ca.effectiveRate).toBeGreaterThan(0);
      expect(us.effectiveRate).toBeGreaterThan(0);
    });

    it("very high income has higher effective rate", () => {
      const result = getWithdrawalTaxRate("RRSP", "CA", "ON", 500000);
      // At $500k, combined CA federal + ON rate should be substantial
      expect(result.effectiveRate).toBeGreaterThan(0.3);
    });
  });
});
