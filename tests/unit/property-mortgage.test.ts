import { describe, it, expect } from "vitest";
import {
  computeMortgageBreakdown,
  computeAmortizationInfo,
  computeAmortizationSchedule,
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

describe("computeAmortizationSchedule", () => {
  it("returns year-by-year summaries for a standard mortgage", () => {
    // $280k at 5% with $1,636/mo (~25-year amortization)
    const schedule = computeAmortizationSchedule(280000, 5, 1636);
    expect(schedule.length).toBeGreaterThan(20);
    expect(schedule.length).toBeLessThanOrEqual(30);
    // First year should have high interest
    expect(schedule[0].year).toBe(1);
    expect(schedule[0].interestPaid).toBeGreaterThan(schedule[0].principalPaid);
    // Last year should have low interest
    const last = schedule[schedule.length - 1];
    expect(last.endingBalance).toBe(0);
    expect(last.interestPaid).toBeLessThan(last.principalPaid);
  });

  it("returns empty array for zero mortgage", () => {
    expect(computeAmortizationSchedule(0, 5, 1000)).toEqual([]);
  });

  it("returns empty array for zero payment", () => {
    expect(computeAmortizationSchedule(280000, 5, 0)).toEqual([]);
  });

  it("stops when payment doesn't cover interest", () => {
    const schedule = computeAmortizationSchedule(280000, 10, 500);
    // Should return empty or partial since payment < interest from month 1
    expect(schedule.length).toBe(0);
  });

  it("handles zero interest rate", () => {
    const schedule = computeAmortizationSchedule(12000, 0, 1000);
    expect(schedule.length).toBe(1); // 12 months = 1 year
    expect(schedule[0].interestPaid).toBe(0);
    expect(schedule[0].principalPaid).toBe(12000);
    expect(schedule[0].endingBalance).toBe(0);
  });

  it("interest decreases and principal increases over time", () => {
    const schedule = computeAmortizationSchedule(200000, 6, 1200);
    // Check that interest portion decreases across years
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].interestPaid).toBeLessThanOrEqual(schedule[i - 1].interestPaid);
    }
  });
});

describe("DEFAULT_INTEREST_RATE", () => {
  it("is 5%", () => {
    expect(DEFAULT_INTEREST_RATE).toBe(5);
  });
});
