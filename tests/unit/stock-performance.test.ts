import { describe, it, expect } from "vitest";
import {
  getAnnualizedReturn,
  getPortfolioSummary,
  getStockGainLoss,
  type StockHolding,
} from "@/components/StockEntry";
import { encodeState, decodeState } from "@/lib/url-state";
import { INITIAL_STATE } from "@/lib/financial-state";

function makeStock(overrides: Partial<StockHolding> = {}): StockHolding {
  return {
    id: "s1",
    ticker: "AAPL",
    shares: 10,
    lastFetchedPrice: 200,
    costBasis: 150,
    ...overrides,
  };
}

describe("getAnnualizedReturn", () => {
  it("returns null without cost basis", () => {
    expect(getAnnualizedReturn(makeStock({ costBasis: undefined }))).toBeNull();
  });

  it("returns null without purchase date", () => {
    expect(getAnnualizedReturn(makeStock({ purchaseDate: undefined }))).toBeNull();
  });

  it("returns null with zero cost basis", () => {
    expect(getAnnualizedReturn(makeStock({ costBasis: 0 }))).toBeNull();
  });

  it("returns null with zero price", () => {
    expect(getAnnualizedReturn(makeStock({ lastFetchedPrice: 0 }))).toBeNull();
  });

  it("returns null with future purchase date", () => {
    expect(getAnnualizedReturn(makeStock({ purchaseDate: "2099-01-01" }))).toBeNull();
  });

  it("returns null with invalid date", () => {
    expect(getAnnualizedReturn(makeStock({ purchaseDate: "not-a-date" }))).toBeNull();
  });

  it("computes positive annualized return", () => {
    // Bought at $100, now $200, 2 years ago → CAGR = (200/100)^(1/2) - 1 ≈ 41.4%
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const result = getAnnualizedReturn(
      makeStock({
        costBasis: 100,
        lastFetchedPrice: 200,
        purchaseDate: twoYearsAgo.toISOString().split("T")[0],
      })
    );
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(41.4, 0);
  });

  it("computes negative annualized return", () => {
    // Bought at $200, now $100, 1 year ago → CAGR = (100/200)^(1/1) - 1 = -50%
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const result = getAnnualizedReturn(
      makeStock({
        costBasis: 200,
        lastFetchedPrice: 100,
        purchaseDate: oneYearAgo.toISOString().split("T")[0],
      })
    );
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(-50, 0);
  });
});

describe("getPortfolioSummary", () => {
  it("returns zero for empty portfolio", () => {
    const result = getPortfolioSummary([]);
    expect(result.totalValue).toBe(0);
    expect(result.totalCostBasis).toBe(0);
    expect(result.totalGainLoss).toBe(0);
    expect(result.overallReturnPct).toBe(0);
  });

  it("computes gain for single stock", () => {
    const result = getPortfolioSummary([makeStock()]);
    // 10 shares × $200 = $2000 value, 10 × $150 = $1500 cost
    expect(result.totalValue).toBe(2000);
    expect(result.totalCostBasis).toBe(1500);
    expect(result.totalGainLoss).toBe(500);
    expect(result.overallReturnPct).toBeCloseTo(33.3, 1);
  });

  it("computes aggregate for multiple stocks", () => {
    const stocks = [
      makeStock({ id: "s1", shares: 10, costBasis: 100, lastFetchedPrice: 150 }),
      makeStock({ id: "s2", shares: 5, costBasis: 200, lastFetchedPrice: 180 }),
    ];
    const result = getPortfolioSummary(stocks);
    // Stock 1: 10 × $150 = $1500 value, 10 × $100 = $1000 cost
    // Stock 2: 5 × $180 = $900 value, 5 × $200 = $1000 cost
    expect(result.totalValue).toBe(2400);
    expect(result.totalCostBasis).toBe(2000);
    expect(result.totalGainLoss).toBe(400);
    expect(result.overallReturnPct).toBeCloseTo(20.0, 1);
  });

  it("skips stocks without cost basis in cost calculation", () => {
    const stocks = [
      makeStock({ id: "s1", shares: 10, costBasis: undefined, lastFetchedPrice: 150 }),
    ];
    const result = getPortfolioSummary(stocks);
    expect(result.totalValue).toBe(1500);
    expect(result.totalCostBasis).toBe(0);
    expect(result.totalGainLoss).toBe(0);
  });

  it("handles mix of stocks with and without cost basis", () => {
    const stocks = [
      makeStock({ id: "s1", shares: 10, costBasis: 100, lastFetchedPrice: 150 }),
      makeStock({ id: "s2", shares: 5, costBasis: undefined, lastFetchedPrice: 200 }),
    ];
    const result = getPortfolioSummary(stocks);
    expect(result.totalValue).toBe(2500);
    expect(result.totalCostBasis).toBe(1000); // only s1
    expect(result.totalGainLoss).toBe(1500); // 2500 - 1000
  });
});

describe("URL state round-trip with purchaseDate", () => {
  it("encodes and decodes purchaseDate", () => {
    const state = {
      ...INITIAL_STATE,
      stocks: [
        { id: "s1", ticker: "AAPL", shares: 10, costBasis: 150, purchaseDate: "2023-06-15" },
      ],
    };
    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.stocks[0].purchaseDate).toBe("2023-06-15");
    expect(decoded!.stocks[0].costBasis).toBe(150);
  });

  it("omits purchaseDate when undefined", () => {
    const state = {
      ...INITIAL_STATE,
      stocks: [
        { id: "s1", ticker: "AAPL", shares: 10 },
      ],
    };
    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.stocks[0].purchaseDate).toBeUndefined();
  });

  it("backward compat: decodes stocks without purchaseDate", () => {
    const state = {
      ...INITIAL_STATE,
      stocks: [
        { id: "s1", ticker: "MSFT", shares: 5, costBasis: 300 },
      ],
    };
    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.stocks[0].ticker).toBe("MSFT");
    expect(decoded!.stocks[0].purchaseDate).toBeUndefined();
  });
});
