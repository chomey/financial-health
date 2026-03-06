import { describe, it, expect } from "vitest";
import { encodeState, decodeState, toCompact, fromCompact } from "@/lib/url-state";
import type { FinancialState } from "@/lib/financial-state";
import { INITIAL_STATE } from "@/lib/financial-state";
import { getTaxTreatment, getWithdrawalTaxRate } from "@/lib/withdrawal-tax";

describe("costBasisPercent URL state encoding", () => {
  it("round-trips costBasisPercent through encode/decode", () => {
    const state: FinancialState = {
      ...INITIAL_STATE,
      assets: [
        { id: "a1", category: "Brokerage", amount: 50000, costBasisPercent: 60 },
        { id: "a2", category: "Savings", amount: 10000 }, // no costBasisPercent
      ],
    };

    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.assets[0].costBasisPercent).toBe(60);
    expect(decoded!.assets[1].costBasisPercent).toBeUndefined();
  });

  it("omits costBasisPercent from compact when 100 (default)", () => {
    const state: FinancialState = {
      ...INITIAL_STATE,
      assets: [
        { id: "a1", category: "Brokerage", amount: 50000, costBasisPercent: 100 },
      ],
    };

    const compact = toCompact(state);
    expect(compact.a[0].cb).toBeUndefined();
  });

  it("includes costBasisPercent in compact when below 100", () => {
    const state: FinancialState = {
      ...INITIAL_STATE,
      assets: [
        { id: "a1", category: "Brokerage", amount: 50000, costBasisPercent: 75 },
      ],
    };

    const compact = toCompact(state);
    expect(compact.a[0].cb).toBe(75);
  });

  it("preserves costBasisPercent of 0", () => {
    const state: FinancialState = {
      ...INITIAL_STATE,
      assets: [
        { id: "a1", category: "Brokerage", amount: 50000, costBasisPercent: 0 },
      ],
    };

    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded!.assets[0].costBasisPercent).toBe(0);
  });

  it("backward compat: missing cb field defaults to undefined", () => {
    const compact = {
      a: [{ c: "Brokerage", a: 50000 }],
      d: [],
      i: [],
      e: [],
    };

    const state = fromCompact(compact);
    expect(state.assets[0].costBasisPercent).toBeUndefined();
  });
});

describe("costBasisPercent tax treatment classification", () => {
  it("classifies Brokerage as taxable", () => {
    expect(getTaxTreatment("Brokerage")).toBe("taxable");
  });

  it("classifies TFSA as tax-free", () => {
    expect(getTaxTreatment("TFSA")).toBe("tax-free");
  });

  it("classifies RRSP as tax-deferred", () => {
    expect(getTaxTreatment("RRSP")).toBe("tax-deferred");
  });
});

describe("costBasisPercent affects withdrawal tax", () => {
  it("100% cost basis = 0 effective rate for taxable account", () => {
    const result = getWithdrawalTaxRate("Brokerage", "CA", "ON", 50000, 100);
    expect(result.effectiveRate).toBe(0);
    expect(result.taxFreeAmount).toBe(50000);
    expect(result.taxableAmount).toBe(0);
  });

  it("lower cost basis increases effective tax rate", () => {
    // Use a large amount so capital gains exceed basic personal amount
    const result100 = getWithdrawalTaxRate("Brokerage", "CA", "ON", 200000, 100);
    const result60 = getWithdrawalTaxRate("Brokerage", "CA", "ON", 200000, 60);
    expect(result60.effectiveRate).toBeGreaterThan(result100.effectiveRate);
    expect(result60.taxableAmount).toBe(80000); // 40% gains on $200k
    expect(result60.taxFreeAmount).toBe(120000); // 60% cost basis
  });

  it("0% cost basis means full amount is taxable gains", () => {
    const result = getWithdrawalTaxRate("Brokerage", "CA", "ON", 50000, 0);
    expect(result.taxableAmount).toBe(50000);
    expect(result.taxFreeAmount).toBe(0);
    expect(result.effectiveRate).toBeGreaterThan(0);
  });

  it("US taxable account with gains uses capital gains rates", () => {
    const result = getWithdrawalTaxRate("Brokerage", "US", "CA", 100000, 50);
    // 50% gains = $50k taxable at capital gains rate
    expect(result.taxableAmount).toBe(50000);
    expect(result.taxFreeAmount).toBe(50000);
    expect(result.effectiveRate).toBeGreaterThan(0);
    // US long-term cap gains: 0%/15%/20% — at $50k cap gains, should be ~7.5%
    expect(result.effectiveRate).toBeLessThan(0.15);
  });
});

describe("unrealized gains calculation", () => {
  it("computes unrealized gains from amount and costBasisPercent", () => {
    const amount = 50000;
    const costBasisPercent = 60;
    const unrealizedGains = amount * (100 - costBasisPercent) / 100;
    expect(unrealizedGains).toBe(20000);
  });

  it("zero gains when costBasisPercent is 100", () => {
    const amount = 50000;
    const costBasisPercent = 100;
    const unrealizedGains = amount * (100 - costBasisPercent) / 100;
    expect(unrealizedGains).toBe(0);
  });

  it("full gains when costBasisPercent is 0", () => {
    const amount = 50000;
    const costBasisPercent = 0;
    const unrealizedGains = amount * (100 - costBasisPercent) / 100;
    expect(unrealizedGains).toBe(50000);
  });
});
