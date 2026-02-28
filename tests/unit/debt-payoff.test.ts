import { describe, it, expect } from "vitest";
import {
  calculateDebtPayoff,
  formatDuration,
  formatPayoffCurrency,
} from "@/lib/debt-payoff";

describe("calculateDebtPayoff", () => {
  it("returns zero months for already-paid debt", () => {
    const result = calculateDebtPayoff(0, 5, 100);
    expect(result.months).toBe(0);
    expect(result.totalInterest).toBe(0);
    expect(result.coversInterest).toBe(true);
    expect(result.payoffDuration).toBe("Paid off");
  });

  it("handles zero interest rate", () => {
    const result = calculateDebtPayoff(1000, 0, 250);
    expect(result.months).toBe(4);
    expect(result.totalInterest).toBe(0);
    expect(result.coversInterest).toBe(true);
    expect(result.payoffDuration).toBe("4 months");
  });

  it("handles zero interest with non-even division", () => {
    const result = calculateDebtPayoff(1000, 0, 300);
    // 1000/300 = 3.33, rounds up to 4
    expect(result.months).toBe(4);
    expect(result.totalInterest).toBe(0);
  });

  it("calculates standard car loan payoff", () => {
    // $15,000 at 6% APR with $300/mo payment
    const result = calculateDebtPayoff(15000, 6, 300);
    expect(result.coversInterest).toBe(true);
    expect(result.months).toBeGreaterThan(50);
    expect(result.months).toBeLessThan(60);
    expect(result.totalInterest).toBeGreaterThan(2000);
    expect(result.totalInterest).toBeLessThan(3000);
  });

  it("calculates credit card payoff", () => {
    // $5,000 at 19.9% APR with $150/mo payment
    const result = calculateDebtPayoff(5000, 19.9, 150);
    expect(result.coversInterest).toBe(true);
    expect(result.months).toBeGreaterThan(40);
    expect(result.months).toBeLessThan(55);
    expect(result.totalInterest).toBeGreaterThan(1500);
  });

  it("returns warning when payment doesn't cover interest", () => {
    // $10,000 at 20% APR, monthly interest = ~$167, payment = $100
    const result = calculateDebtPayoff(10000, 20, 100);
    expect(result.coversInterest).toBe(false);
    expect(result.months).toBe(Infinity);
    expect(result.totalInterest).toBe(Infinity);
  });

  it("returns warning when payment equals interest exactly", () => {
    // $12,000 at 12% APR, monthly interest = $120, payment = $120
    const result = calculateDebtPayoff(12000, 12, 120);
    expect(result.coversInterest).toBe(false);
    expect(result.months).toBe(Infinity);
  });

  it("handles zero monthly payment", () => {
    const result = calculateDebtPayoff(5000, 5, 0);
    expect(result.coversInterest).toBe(false);
    expect(result.months).toBe(Infinity);
  });

  it("handles negative balance", () => {
    const result = calculateDebtPayoff(-100, 5, 50);
    expect(result.months).toBe(0);
    expect(result.payoffDuration).toBe("Paid off");
  });

  it("produces a readable payoff duration for multi-year loans", () => {
    // $15,000 at 6% with $300/mo
    const result = calculateDebtPayoff(15000, 6, 300);
    expect(result.payoffDuration).toMatch(/\d+ years? \d+ months?/);
  });
});

describe("formatDuration", () => {
  it("formats months only", () => {
    expect(formatDuration(5)).toBe("5 months");
  });

  it("formats single month", () => {
    expect(formatDuration(1)).toBe("1 month");
  });

  it("formats exact years", () => {
    expect(formatDuration(24)).toBe("2 years");
  });

  it("formats single year", () => {
    expect(formatDuration(12)).toBe("1 year");
  });

  it("formats years and months", () => {
    expect(formatDuration(14)).toBe("1 year 2 months");
  });

  it("formats years and single month", () => {
    expect(formatDuration(25)).toBe("2 years 1 month");
  });

  it("handles zero", () => {
    expect(formatDuration(0)).toBe("Paid off");
  });

  it("handles Infinity", () => {
    expect(formatDuration(Infinity)).toBe("Never");
  });
});

describe("formatPayoffCurrency", () => {
  it("formats whole dollars", () => {
    expect(formatPayoffCurrency(3200)).toBe("$3,200");
  });

  it("rounds cents to whole dollars", () => {
    expect(formatPayoffCurrency(3200.75)).toBe("$3,201");
  });

  it("formats zero", () => {
    expect(formatPayoffCurrency(0)).toBe("$0");
  });
});
