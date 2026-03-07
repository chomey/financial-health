import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getTickerName,
  resolveTickerName,
  clearResolvedCache,
  getStaticMapSize,
} from "@/lib/ticker-names";

describe("ticker-names", () => {
  describe("getTickerName (static lookup)", () => {
    it("returns name for known S&P 500 ticker", () => {
      expect(getTickerName("AAPL")).toBe("Apple");
      expect(getTickerName("MSFT")).toBe("Microsoft");
      expect(getTickerName("GOOGL")).toBe("Alphabet");
      expect(getTickerName("AMZN")).toBe("Amazon");
      expect(getTickerName("NVDA")).toBe("NVIDIA");
    });

    it("returns name for popular ETFs", () => {
      expect(getTickerName("SPY")).toBe("SPDR S&P 500 ETF");
      expect(getTickerName("VOO")).toBe("Vanguard S&P 500 ETF");
      expect(getTickerName("QQQ")).toBe("Invesco QQQ Trust (Nasdaq 100)");
      expect(getTickerName("VTI")).toBe("Vanguard Total Stock Market ETF");
      expect(getTickerName("IWM")).toBe("iShares Russell 2000 ETF");
    });

    it("returns name for Canadian tickers", () => {
      expect(getTickerName("XIU")).toBe("iShares S&P/TSX 60 Index ETF");
      expect(getTickerName("XIC")).toBe("iShares Core S&P/TSX Capped Composite Index ETF");
      expect(getTickerName("VFV")).toBe("Vanguard S&P 500 Index ETF (CAD)");
      expect(getTickerName("VEQT")).toBe("Vanguard All-Equity ETF Portfolio");
    });

    it("returns name for Canadian .TO suffixed tickers", () => {
      expect(getTickerName("RY.TO")).toBe("Royal Bank of Canada");
      expect(getTickerName("SHOP.TO")).toBe("Shopify");
    });

    it("returns name for Vanguard/Fidelity mutual funds", () => {
      expect(getTickerName("VFIAX")).toBe("Vanguard 500 Index Fund Admiral");
      expect(getTickerName("FXAIX")).toBe("Fidelity 500 Index Fund");
    });

    it("is case-insensitive for uppercase lookups", () => {
      expect(getTickerName("aapl")).toBe("Apple");
      expect(getTickerName("Msft")).toBe("Microsoft");
      expect(getTickerName("spy")).toBe("SPDR S&P 500 ETF");
    });

    it("returns undefined for unknown ticker", () => {
      expect(getTickerName("ZZZZZ")).toBeUndefined();
      expect(getTickerName("NOTREAL")).toBeUndefined();
    });

    it("returns undefined for empty string", () => {
      expect(getTickerName("")).toBeUndefined();
    });

    it("trims whitespace", () => {
      expect(getTickerName("  AAPL  ")).toBe("Apple");
    });
  });

  describe("getStaticMapSize", () => {
    it("has at least 550 entries", () => {
      expect(getStaticMapSize()).toBeGreaterThanOrEqual(550);
    });
  });

  describe("resolveTickerName (async with cache)", () => {
    beforeEach(() => {
      clearResolvedCache();
      vi.restoreAllMocks();
    });

    it("returns static name without network call for known tickers", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch");
      const result = await resolveTickerName("AAPL");
      expect(result).toBe("Apple");
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("makes a network call for unknown tickers", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(
          JSON.stringify({ quotes: [{ shortname: "Test Corp" }] }),
          { status: 200 }
        )
      );
      const result = await resolveTickerName("TESTXYZ");
      expect(result).toBe("Test Corp");
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it("caches resolved names", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(
          JSON.stringify({ quotes: [{ shortname: "Cached Corp" }] }),
          { status: 200 }
        )
      );
      await resolveTickerName("CACHE1");
      await resolveTickerName("CACHE1");
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it("returns undefined and caches on network failure", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));
      const result = await resolveTickerName("FAILXYZ");
      expect(result).toBeUndefined();
      // Second call should use cache
      const result2 = await resolveTickerName("FAILXYZ");
      expect(result2).toBeUndefined();
    });

    it("returns undefined for empty string", async () => {
      const result = await resolveTickerName("");
      expect(result).toBeUndefined();
    });

    it("clears cache via clearResolvedCache", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(
          JSON.stringify({ quotes: [{ shortname: "Clear Corp" }] }),
          { status: 200 }
        )
      );
      await resolveTickerName("CLEARTEST");
      clearResolvedCache();
      await resolveTickerName("CLEARTEST");
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });

    it("uses longname if shortname is missing", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(
          JSON.stringify({ quotes: [{ longname: "Long Name Corp" }] }),
          { status: 200 }
        )
      );
      const result = await resolveTickerName("LONGONLY");
      expect(result).toBe("Long Name Corp");
    });

    it("returns undefined when API returns no quotes", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ quotes: [] }), { status: 200 })
      );
      const result = await resolveTickerName("NOQUOTE");
      expect(result).toBeUndefined();
    });
  });
});
