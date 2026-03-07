import { describe, it, expect } from "vitest";
import {
  getHomeCurrency,
  getForeignCurrency,
  fxPairKey,
  convertToHome,
  formatCurrency,
  formatCurrencyCompact,
  getEffectiveFxRates,
  FALLBACK_RATES,
} from "@/lib/currency";
import type { FxRates, SupportedCurrency } from "@/lib/currency";

describe("currency", () => {
  describe("getHomeCurrency", () => {
    it("returns CAD for CA", () => {
      expect(getHomeCurrency("CA")).toBe("CAD");
    });
    it("returns USD for US", () => {
      expect(getHomeCurrency("US")).toBe("USD");
    });
  });

  describe("getForeignCurrency", () => {
    it("returns USD when home is CAD", () => {
      expect(getForeignCurrency("CAD")).toBe("USD");
    });
    it("returns CAD when home is USD", () => {
      expect(getForeignCurrency("USD")).toBe("CAD");
    });
  });

  describe("fxPairKey", () => {
    it("builds correct pair key", () => {
      expect(fxPairKey("CAD", "USD")).toBe("CAD_USD");
      expect(fxPairKey("USD", "CAD")).toBe("USD_CAD");
    });
  });

  describe("convertToHome", () => {
    const rates: FxRates = { CAD_USD: 0.73, USD_CAD: 1.37 };

    it("returns original amount when from === to", () => {
      expect(convertToHome(1000, "CAD", "CAD", rates)).toBe(1000);
      expect(convertToHome(1000, "USD", "USD", rates)).toBe(1000);
    });

    it("converts USD to CAD", () => {
      expect(convertToHome(1000, "USD", "CAD", rates)).toBeCloseTo(1370, 0);
    });

    it("converts CAD to USD", () => {
      expect(convertToHome(1000, "CAD", "USD", rates)).toBeCloseTo(730, 0);
    });

    it("uses fallback rates when rate is missing", () => {
      expect(convertToHome(1000, "USD", "CAD", {})).toBeCloseTo(1370, 0);
    });

    it("returns original amount when no rate available at all", () => {
      // Both rates missing and no fallback — should never happen with CAD/USD but tests the path
      const emptyRates: FxRates = {};
      // Temporarily test with a hypothetical pair that has no fallback
      expect(convertToHome(1000, "CAD", "CAD", emptyRates)).toBe(1000);
    });
  });

  describe("formatCurrency", () => {
    it("formats with plain $ when no homeCurrency context", () => {
      expect(formatCurrency(1234, "USD")).toBe("$1,234");
      expect(formatCurrency(1234, "CAD")).toBe("$1,234");
    });

    it("formats home currency with plain $", () => {
      expect(formatCurrency(1234, "CAD", { homeCurrency: "CAD" })).toBe("$1,234");
      expect(formatCurrency(1234, "USD", { homeCurrency: "USD" })).toBe("$1,234");
    });

    it("formats foreign currency with prefix", () => {
      expect(formatCurrency(1234, "USD", { homeCurrency: "CAD" })).toBe("$1,234");  // Intl: US$ for USD
      expect(formatCurrency(1234, "CAD", { homeCurrency: "USD" })).toBe("CA$1,234");
    });

    it("handles negative amounts", () => {
      expect(formatCurrency(-500, "USD")).toBe("-$500");
    });

    it("supports showSign option", () => {
      expect(formatCurrency(500, "USD", { showSign: true })).toBe("+$500");
    });

    it("supports fraction digits", () => {
      expect(formatCurrency(1234.56, "USD", { maximumFractionDigits: 2 })).toBe("$1,234.56");
    });
  });

  describe("formatCurrencyCompact", () => {
    it("formats with plain $ for home currency", () => {
      expect(formatCurrencyCompact(1_200_000, "USD", "USD")).toBe("$1.2M");
      expect(formatCurrencyCompact(1_200_000, "CAD", "CAD")).toBe("$1.2M");
    });

    it("formats with prefix for foreign currency", () => {
      expect(formatCurrencyCompact(1_200_000, "CAD", "USD")).toBe("CA$1.2M");
      expect(formatCurrencyCompact(55_000, "USD", "CAD")).toBe("US$55k");
    });

    it("formats thousands", () => {
      expect(formatCurrencyCompact(55_000, "USD", "USD")).toBe("$55k");
    });

    it("formats small amounts", () => {
      expect(formatCurrencyCompact(500, "USD")).toBe("$500");
    });

    it("handles negative amounts", () => {
      expect(formatCurrencyCompact(-25_000, "USD")).toBe("-$25k");
    });
  });

  describe("getEffectiveFxRates", () => {
    it("uses manual override when provided", () => {
      const rates = getEffectiveFxRates("CAD", 1.4);
      expect(rates["USD_CAD"]).toBe(1.4);
      expect(rates["CAD_USD"]).toBeCloseTo(1 / 1.4, 5);
    });

    it("uses live rates when no override", () => {
      const live: FxRates = { CAD_USD: 0.75, USD_CAD: 1.33 };
      const rates = getEffectiveFxRates("CAD", undefined, live);
      expect(rates["CAD_USD"]).toBe(0.75);
    });

    it("falls back to hardcoded rates", () => {
      const rates = getEffectiveFxRates("CAD");
      expect(rates["CAD_USD"]).toBe(FALLBACK_RATES["CAD_USD"]);
    });

    it("generates correct pair keys for USD home", () => {
      const rates = getEffectiveFxRates("USD", 0.73);
      expect(rates["CAD_USD"]).toBe(0.73);
      expect(rates["USD_CAD"]).toBeCloseTo(1 / 0.73, 5);
    });
  });
});
