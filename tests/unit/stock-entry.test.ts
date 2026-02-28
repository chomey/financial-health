import { describe, it, expect } from "vitest";
import {
  getStockValue,
  getStockPrice,
  getStockGainLoss,
} from "@/components/StockEntry";
import type { StockHolding } from "@/components/StockEntry";
import { computeTotals, computeMetrics, toFinancialData } from "@/lib/financial-state";
import type { FinancialState } from "@/lib/financial-state";
import { encodeState, decodeState, toCompact, fromCompact } from "@/lib/url-state";

// --- StockHolding utility tests ---

describe("getStockValue", () => {
  it("computes value from fetched price", () => {
    const stock: StockHolding = { id: "s1", ticker: "AAPL", shares: 10, lastFetchedPrice: 150 };
    expect(getStockValue(stock)).toBe(1500);
  });

  it("returns 0 when no price is set", () => {
    const stock: StockHolding = { id: "s1", ticker: "AAPL", shares: 10 };
    expect(getStockValue(stock)).toBe(0);
  });

  it("handles 0 shares", () => {
    const stock: StockHolding = { id: "s1", ticker: "AAPL", shares: 0, lastFetchedPrice: 150 };
    expect(getStockValue(stock)).toBe(0);
  });
});

describe("getStockPrice", () => {
  it("returns fetched price", () => {
    const stock: StockHolding = { id: "s1", ticker: "X", shares: 1, lastFetchedPrice: 75 };
    expect(getStockPrice(stock)).toBe(75);
  });

  it("returns 0 if no price available", () => {
    const stock: StockHolding = { id: "s1", ticker: "X", shares: 1 };
    expect(getStockPrice(stock)).toBe(0);
  });
});

describe("getStockGainLoss", () => {
  it("computes positive gain/loss", () => {
    const stock: StockHolding = { id: "s1", ticker: "AAPL", shares: 10, lastFetchedPrice: 200, costBasis: 100 };
    const result = getStockGainLoss(stock);
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(1000); // (200-100)*10
    expect(result!.percentage).toBeCloseTo(100);
  });

  it("computes negative gain/loss", () => {
    const stock: StockHolding = { id: "s1", ticker: "AAPL", shares: 5, lastFetchedPrice: 80, costBasis: 100 };
    const result = getStockGainLoss(stock);
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(-100); // (80-100)*5
    expect(result!.percentage).toBeCloseTo(-20);
  });

  it("returns null when no cost basis", () => {
    const stock: StockHolding = { id: "s1", ticker: "AAPL", shares: 10, lastFetchedPrice: 150 };
    expect(getStockGainLoss(stock)).toBeNull();
  });

  it("returns null when cost basis is 0", () => {
    const stock: StockHolding = { id: "s1", ticker: "AAPL", shares: 10, lastFetchedPrice: 150, costBasis: 0 };
    expect(getStockGainLoss(stock)).toBeNull();
  });

  it("returns null when no price available", () => {
    const stock: StockHolding = { id: "s1", ticker: "AAPL", shares: 10, costBasis: 100 };
    expect(getStockGainLoss(stock)).toBeNull();
  });
});

// --- FinancialState integration with stocks ---

function makeState(overrides: Partial<FinancialState> = {}): FinancialState {
  return {
    assets: [],
    debts: [],
    income: [],
    expenses: [],
    goals: [],
    properties: [],
    stocks: [],
    ...overrides,
  };
}

describe("computeTotals with stocks", () => {
  it("includes stock value in totalStocks", () => {
    const state = makeState({
      stocks: [
        { id: "s1", ticker: "AAPL", shares: 10, lastFetchedPrice: 150 },
        { id: "s2", ticker: "MSFT", shares: 5, lastFetchedPrice: 300 },
      ],
    });
    const totals = computeTotals(state);
    expect(totals.totalStocks).toBe(3000); // 1500 + 1500
  });

  it("handles empty stocks", () => {
    const state = makeState();
    const totals = computeTotals(state);
    expect(totals.totalStocks).toBe(0);
  });

  it("handles stocks without prices", () => {
    const state = makeState({
      stocks: [{ id: "s1", ticker: "AAPL", shares: 10 }],
    });
    const totals = computeTotals(state);
    expect(totals.totalStocks).toBe(0);
  });
});

describe("computeMetrics with stocks", () => {
  it("includes stocks in net worth", () => {
    const state = makeState({
      assets: [{ id: "a1", category: "Savings", amount: 10000 }],
      stocks: [{ id: "s1", ticker: "AAPL", shares: 10, lastFetchedPrice: 100 }],
    });
    const metrics = computeMetrics(state);
    const netWorth = metrics.find((m) => m.title === "Net Worth");
    expect(netWorth?.value).toBe(11000); // 10000 + 1000
  });

  it("includes stocks in financial runway", () => {
    const state = makeState({
      assets: [{ id: "a1", category: "Savings", amount: 5000 }],
      stocks: [{ id: "s1", ticker: "AAPL", shares: 10, lastFetchedPrice: 500 }],
      expenses: [{ id: "e1", category: "Rent", amount: 1000 }],
    });
    const metrics = computeMetrics(state);
    const runway = metrics.find((m) => m.title === "Financial Runway");
    // (5000 + 5000) / 1000 = 10 months
    expect(runway?.value).toBe(10);
  });
});

describe("toFinancialData with stocks", () => {
  it("includes stocks in totalAssets and liquidAssets", () => {
    const state = makeState({
      assets: [{ id: "a1", category: "Savings", amount: 5000 }],
      stocks: [{ id: "s1", ticker: "AAPL", shares: 10, lastFetchedPrice: 200 }],
    });
    const data = toFinancialData(state);
    expect(data.totalAssets).toBe(7000); // 5000 + 2000
    expect(data.liquidAssets).toBe(7000);
  });
});

// --- URL state encoding/decoding with stocks ---

describe("URL state encoding with stocks", () => {
  it("round-trips stocks through encode/decode", () => {
    const state = makeState({
      stocks: [
        { id: "s1", ticker: "AAPL", shares: 10, costBasis: 120 },
        { id: "s2", ticker: "MSFT", shares: 5 },
      ],
    });
    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.stocks).toHaveLength(2);
    expect(decoded!.stocks[0].ticker).toBe("AAPL");
    expect(decoded!.stocks[0].shares).toBe(10);
    expect(decoded!.stocks[0].costBasis).toBe(120);
    expect(decoded!.stocks[1].ticker).toBe("MSFT");
    expect(decoded!.stocks[1].shares).toBe(5);
    expect(decoded!.stocks[1].costBasis).toBeUndefined();
  });

  it("handles backward compat — state without stocks decodes with empty stocks", () => {
    const state = makeState();
    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.stocks).toEqual([]);
  });

  it("compact format uses short keys", () => {
    const state = makeState({
      stocks: [{ id: "s1", ticker: "AAPL", shares: 10, costBasis: 120 }],
    });
    const compact = toCompact(state);
    expect(compact.st).toBeDefined();
    expect(compact.st![0].t).toBe("AAPL");
    expect(compact.st![0].s).toBe(10);
    expect(compact.st![0].cb).toBe(120);
  });

  it("fromCompact restores stocks with generated IDs", () => {
    const compact = {
      a: [],
      d: [],
      i: [],
      e: [],
      g: [],
      st: [
        { t: "GOOG", s: 3 },
      ],
    };
    const state = fromCompact(compact);
    expect(state.stocks).toHaveLength(1);
    expect(state.stocks[0].id).toBe("s1");
    expect(state.stocks[0].ticker).toBe("GOOG");
    expect(state.stocks[0].shares).toBe(3);
  });
});
