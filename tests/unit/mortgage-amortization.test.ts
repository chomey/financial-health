import { describe, it, expect } from "vitest";
import { computeMortgageAmortization } from "@/lib/projections";

describe("computeMortgageAmortization", () => {
  it("starts at principal balance", () => {
    const balances = computeMortgageAmortization(400_000, 5, 2147, 360);
    expect(balances[0]).toBe(400_000);
  });

  it("reaches zero before or at term end for standard mortgage", () => {
    // $400k, 5%, $2148/mo — slightly above minimum payment so mortgage is fully paid by month 360
    const balances = computeMortgageAmortization(400_000, 5, 2148, 360);
    expect(balances[360]).toBe(0);
  });

  it("balance declines monotonically each month", () => {
    const balances = computeMortgageAmortization(300_000, 4, 1432, 360);
    for (let i = 1; i < balances.length; i++) {
      expect(balances[i]).toBeLessThanOrEqual(balances[i - 1]);
    }
  });

  it("returns months+1 data points", () => {
    const balances = computeMortgageAmortization(200_000, 3, 843, 180);
    expect(balances).toHaveLength(181); // months=180, so 181 entries (0..180)
  });

  it("handles zero annual rate (interest-free)", () => {
    // $120k, 0%, $1000/mo — paid off in 120 months
    const balances = computeMortgageAmortization(120_000, 0, 1000, 120);
    expect(balances[0]).toBe(120_000);
    expect(balances[120]).toBe(0);
  });

  it("never goes below zero", () => {
    // Overpay — balance should floor at 0
    const balances = computeMortgageAmortization(50_000, 3, 5000, 60);
    for (const b of balances) {
      expect(b).toBeGreaterThanOrEqual(0);
    }
  });

  it("balance reaches zero early when payment is much higher than needed", () => {
    // $100k, 5%, $5000/mo — paid off well before 360 months
    const balances = computeMortgageAmortization(100_000, 5, 5000, 360);
    // Should hit 0 around month 20
    expect(balances[24]).toBe(0);
    // All subsequent months should remain 0
    const zeroStart = balances.findIndex((b) => b === 0);
    for (let i = zeroStart; i < balances.length; i++) {
      expect(balances[i]).toBe(0);
    }
  });

  it("10-year mortgage at 4% has expected payoff", () => {
    // $100k, 4%, ~$1013/mo — 10-year mortgage
    const balances = computeMortgageAmortization(100_000, 4, 1013, 120);
    expect(balances[0]).toBe(100_000);
    // Balance should be very small at term end
    expect(balances[120]).toBeLessThan(500);
  });

  it("handles single month", () => {
    const balances = computeMortgageAmortization(10_000, 6, 500, 1);
    expect(balances).toHaveLength(2);
    expect(balances[0]).toBe(10_000);
    // After 1 month: 10000 * (1 + 0.06/12) - 500 = 10000*1.005 - 500 = 10050 - 500 = 9550
    expect(balances[1]).toBe(9550);
  });
});
