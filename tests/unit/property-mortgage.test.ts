import { describe, it, expect } from "vitest";
import {
  computeMortgageBreakdown,
  computeAmortizationInfo,
  suggestMonthlyPayment,
  DEFAULT_INTEREST_RATE,
} from "@/components/PropertyEntry";

describe("computeMortgageBreakdown", () => {
  it("computes monthly interest and principal portions", () => {
    // $280,000 mortgage at 5% with $1,636/mo payment
    const result = computeMortgageBreakdown(280000, 5, 1636);
    // Monthly rate = 5/100/12 = 0.004167
    // Interest = 280000 * 0.004167 = ~1166.67
    expect(result.interestPortion).toBeCloseTo(1166.67, 0);
    expect(result.principalPortion).toBeCloseTo(469.33, 0);
  });

  it("caps principal at zero when payment is less than interest", () => {
    const result = computeMortgageBreakdown(280000, 10, 500);
    // Monthly interest = 280000 * 0.1/12 = ~2333
    expect(result.interestPortion).toBeCloseTo(2333.33, 0);
    expect(result.principalPortion).toBe(0);
  });

  it("handles zero mortgage", () => {
    const result = computeMortgageBreakdown(0, 5, 1000);
    expect(result.interestPortion).toBe(0);
    expect(result.principalPortion).toBe(1000);
  });

  it("handles zero interest rate", () => {
    const result = computeMortgageBreakdown(280000, 0, 1000);
    expect(result.interestPortion).toBe(0);
    expect(result.principalPortion).toBe(1000);
  });
});

describe("computeAmortizationInfo", () => {
  it("computes total interest and payoff months for a standard mortgage", () => {
    // $280k at 5% with $1,636/mo (approx 25-year amortization)
    const result = computeAmortizationInfo(280000, 5, 1636);
    expect(result.payoffMonths).toBeGreaterThan(200);
    expect(result.payoffMonths).toBeLessThan(350);
    expect(result.totalInterest).toBeGreaterThan(100000);
  });

  it("returns zero for zero mortgage", () => {
    const result = computeAmortizationInfo(0, 5, 1000);
    expect(result.payoffMonths).toBe(0);
    expect(result.totalInterest).toBe(0);
  });

  it("returns zero for zero payment", () => {
    const result = computeAmortizationInfo(280000, 5, 0);
    expect(result.payoffMonths).toBe(0);
    expect(result.totalInterest).toBe(0);
  });

  it("returns -1 when payment does not cover interest", () => {
    const result = computeAmortizationInfo(280000, 10, 500);
    expect(result.payoffMonths).toBe(-1);
    expect(result.totalInterest).toBe(-1);
  });

  it("handles zero interest rate", () => {
    const result = computeAmortizationInfo(120000, 0, 1000);
    expect(result.payoffMonths).toBe(120);
    expect(result.totalInterest).toBe(0);
  });
});

describe("suggestMonthlyPayment", () => {
  it("suggests a reasonable payment for a standard mortgage", () => {
    const payment = suggestMonthlyPayment(280000, 5, 25);
    // Standard 25-year amortization at 5% → ~$1,636/mo
    expect(payment).toBeGreaterThan(1500);
    expect(payment).toBeLessThan(1800);
  });

  it("returns 0 for zero mortgage", () => {
    expect(suggestMonthlyPayment(0, 5, 25)).toBe(0);
  });

  it("handles zero interest rate", () => {
    const payment = suggestMonthlyPayment(120000, 0, 10);
    expect(payment).toBe(1000); // 120000 / 120 months
  });

  it("defaults to 25 years when no term specified", () => {
    const payment = suggestMonthlyPayment(280000, 5);
    expect(payment).toBeGreaterThan(1500);
    expect(payment).toBeLessThan(1800);
  });
});

describe("DEFAULT_INTEREST_RATE", () => {
  it("is 5%", () => {
    expect(DEFAULT_INTEREST_RATE).toBe(5);
  });
});
