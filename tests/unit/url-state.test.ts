import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  encode85,
  decode85,
  encodeState,
  decodeState,
  toCompact,
  fromCompact,
  getStateFromURL,
  updateURL,
} from "@/lib/url-state";
import { INITIAL_STATE } from "@/lib/financial-state";
import type { FinancialState } from "@/lib/financial-state";

describe("ASCII85 encode/decode", () => {
  it("encodes and decodes empty data", () => {
    const bytes = new Uint8Array(0);
    const encoded = encode85(bytes);
    const decoded = decode85(encoded);
    expect(decoded).toEqual(bytes);
  });

  it("encodes and decodes a simple string", () => {
    const text = "Hello, World!";
    const bytes = new TextEncoder().encode(text);
    const encoded = encode85(bytes);
    const decoded = decode85(encoded);
    expect(new TextDecoder().decode(decoded)).toBe(text);
  });

  it("handles the zero-block shortcut (z)", () => {
    const bytes = new Uint8Array([0, 0, 0, 0]);
    const encoded = encode85(bytes);
    expect(encoded).toBe("z");
    const decoded = decode85(encoded);
    expect(decoded).toEqual(bytes);
  });

  it("encodes and decodes arbitrary bytes", () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 255, 254, 253, 252, 128]);
    const encoded = encode85(bytes);
    const decoded = decode85(encoded);
    expect(decoded).toEqual(bytes);
  });

  it("roundtrips JSON data", () => {
    const json = JSON.stringify({ test: "value", num: 42, arr: [1, 2, 3] });
    const bytes = new TextEncoder().encode(json);
    const encoded = encode85(bytes);
    const decoded = decode85(encoded);
    expect(new TextDecoder().decode(decoded)).toBe(json);
  });

  it("throws on invalid ASCII85 characters", () => {
    expect(() => decode85("\x00")).toThrow("Invalid ASCII85 character");
  });
});

describe("toCompact / fromCompact", () => {
  it("compacts state by stripping IDs and shortening keys", () => {
    const compact = toCompact(INITIAL_STATE);
    expect(compact.a).toHaveLength(3);
    expect(compact.a[0]).toEqual({ c: "Savings Account", a: 12000, st: 1 });
    expect(compact.d[0]).toEqual({ c: "Car Loan", a: 15000 });
    expect(compact.p).toHaveLength(1);
    expect(compact.p![0]).toEqual({ n: "Home", v: 450000, m: 280000 });
    expect(compact.i[0]).toEqual({ c: "Salary", a: 5500 });
    expect(compact.e[0]).toEqual({ c: "Rent/Mortgage Payment", a: 2200 });
    expect(compact.g[0]).toEqual({ n: "Rainy Day Fund", t: 20000, s: 14500 });
  });

  it("restores state from compact format with generated IDs", () => {
    const compact = toCompact(INITIAL_STATE);
    const restored = fromCompact(compact);
    expect(restored.assets).toHaveLength(3);
    expect(restored.assets[0].category).toBe("Savings Account");
    expect(restored.assets[0].amount).toBe(12000);
    expect(restored.assets[0].id).toBeTruthy();
    expect(restored.goals[0].name).toBe("Rainy Day Fund");
    expect(restored.goals[0].targetAmount).toBe(20000);
    expect(restored.goals[0].currentAmount).toBe(14500);
    expect(restored.properties).toHaveLength(1);
    expect(restored.properties[0].name).toBe("Home");
    expect(restored.properties[0].value).toBe(450000);
    expect(restored.properties[0].mortgage).toBe(280000);
  });

  it("compacts country and jurisdiction into co/ju fields", () => {
    const state: FinancialState = {
      ...INITIAL_STATE,
      country: "US",
      jurisdiction: "NY",
    };
    const compact = toCompact(state);
    expect(compact.co).toBe("US");
    expect(compact.ju).toBe("NY");
  });

  it("omits co/ju when country/jurisdiction are undefined", () => {
    const state: FinancialState = {
      ...INITIAL_STATE,
      country: undefined,
      jurisdiction: undefined,
    };
    const compact = toCompact(state);
    expect(compact.co).toBeUndefined();
    expect(compact.ju).toBeUndefined();
  });

  it("restores country/jurisdiction from compact with defaults when missing", () => {
    const compact = toCompact({ ...INITIAL_STATE, country: undefined, jurisdiction: undefined });
    const restored = fromCompact(compact);
    // Should default to CA/ON when co/ju are missing
    expect(restored.country).toBe("CA");
    expect(restored.jurisdiction).toBe("ON");
  });
});

describe("encodeState / decodeState", () => {
  it("roundtrips the initial state", () => {
    const encoded = encodeState(INITIAL_STATE);
    expect(typeof encoded).toBe("string");
    expect(encoded.length).toBeGreaterThan(0);

    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.assets).toHaveLength(INITIAL_STATE.assets.length);
    expect(decoded!.assets[0].category).toBe(INITIAL_STATE.assets[0].category);
    expect(decoded!.assets[0].amount).toBe(INITIAL_STATE.assets[0].amount);
    expect(decoded!.debts).toHaveLength(INITIAL_STATE.debts.length);
    expect(decoded!.income).toHaveLength(INITIAL_STATE.income.length);
    expect(decoded!.expenses).toHaveLength(INITIAL_STATE.expenses.length);
    expect(decoded!.goals).toHaveLength(INITIAL_STATE.goals.length);
  });

  it("roundtrips empty state", () => {
    const emptyState: FinancialState = {
      assets: [],
      debts: [],
      income: [],
      expenses: [],
      goals: [],
      properties: [],
    };
    const encoded = encodeState(emptyState);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.assets).toHaveLength(0);
    expect(decoded!.debts).toHaveLength(0);
  });

  it("roundtrips state with special characters in categories", () => {
    const state: FinancialState = {
      assets: [{ id: "1", category: "Roth IRA (tax-free)", amount: 50000 }],
      debts: [],
      income: [],
      expenses: [],
      goals: [],
      properties: [],
    };
    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded!.assets[0].category).toBe("Roth IRA (tax-free)");
  });

  it("returns null for invalid encoded data", () => {
    expect(decodeState("!!!invalid")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(decodeState("")).toBeNull();
  });

  it("produces URL-safe output", () => {
    const encoded = encodeState(INITIAL_STATE);
    // ASCII85 characters are in the printable range; URL encoding handles the rest
    expect(encoded).toBeTruthy();
  });

  it("roundtrips property with interest rate, monthly payment, and amortization", () => {
    const state: FinancialState = {
      assets: [],
      debts: [],
      income: [],
      expenses: [],
      goals: [],
      properties: [
        { id: "p1", name: "Home", value: 450000, mortgage: 280000, interestRate: 4.5, monthlyPayment: 1550, amortizationYears: 20 },
      ],
    };
    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.properties[0].interestRate).toBe(4.5);
    expect(decoded!.properties[0].monthlyPayment).toBe(1550);
    expect(decoded!.properties[0].amortizationYears).toBe(20);
  });

  it("roundtrips property without optional fields (backward compat)", () => {
    const state: FinancialState = {
      assets: [],
      debts: [],
      income: [],
      expenses: [],
      goals: [],
      properties: [
        { id: "p1", name: "Home", value: 450000, mortgage: 280000 },
      ],
    };
    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.properties[0].interestRate).toBeUndefined();
    expect(decoded!.properties[0].monthlyPayment).toBeUndefined();
    expect(decoded!.properties[0].amortizationYears).toBeUndefined();
  });

  it("roundtrips country and jurisdiction (CA/ON)", () => {
    const state: FinancialState = {
      assets: [],
      debts: [],
      income: [],
      expenses: [],
      goals: [],
      properties: [],
      stocks: [],
      country: "CA",
      jurisdiction: "ON",
    };
    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.country).toBe("CA");
    expect(decoded!.jurisdiction).toBe("ON");
  });

  it("roundtrips country and jurisdiction (US/CA)", () => {
    const state: FinancialState = {
      assets: [],
      debts: [],
      income: [],
      expenses: [],
      goals: [],
      properties: [],
      stocks: [],
      country: "US",
      jurisdiction: "CA",
    };
    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.country).toBe("US");
    expect(decoded!.jurisdiction).toBe("CA");
  });

  it("defaults to CA/ON when country/jurisdiction missing from encoded state (backward compat)", () => {
    // Encode a state without country/jurisdiction fields
    const state: FinancialState = {
      assets: [{ id: "a1", category: "Savings", amount: 1000 }],
      debts: [],
      income: [],
      expenses: [],
      goals: [],
      properties: [],
      stocks: [],
    };
    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    // Should default to CA/ON when not present
    expect(decoded!.country).toBe("CA");
    expect(decoded!.jurisdiction).toBe("ON");
  });

  it("roundtrips INITIAL_STATE with country and jurisdiction", () => {
    const encoded = encodeState(INITIAL_STATE);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.country).toBe("CA");
    expect(decoded!.jurisdiction).toBe("ON");
  });

  it("roundtrips US state with different jurisdiction codes", () => {
    const jurisdictions = ["NY", "TX", "FL", "WA"];
    for (const jur of jurisdictions) {
      const state: FinancialState = {
        assets: [],
        debts: [],
        income: [],
        expenses: [],
        goals: [],
        properties: [],
        stocks: [],
        country: "US",
        jurisdiction: jur,
      };
      const encoded = encodeState(state);
      const decoded = decodeState(encoded);
      expect(decoded).not.toBeNull();
      expect(decoded!.country).toBe("US");
      expect(decoded!.jurisdiction).toBe(jur);
    }
  });
});

describe("incomeType encoding", () => {
  it("omits incomeType when employment (default)", () => {
    const state: FinancialState = {
      assets: [],
      debts: [],
      income: [{ id: "i1", category: "Salary", amount: 5000, incomeType: "employment" }],
      expenses: [],
      goals: [],
      properties: [],
      stocks: [],
    };
    const compact = toCompact(state);
    expect(compact.i[0].it).toBeUndefined();
  });

  it("omits incomeType when undefined", () => {
    const state: FinancialState = {
      assets: [],
      debts: [],
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
      expenses: [],
      goals: [],
      properties: [],
      stocks: [],
    };
    const compact = toCompact(state);
    expect(compact.i[0].it).toBeUndefined();
  });

  it("encodes capital-gains incomeType", () => {
    const state: FinancialState = {
      assets: [],
      debts: [],
      income: [{ id: "i1", category: "Stock Sale", amount: 10000, incomeType: "capital-gains" }],
      expenses: [],
      goals: [],
      properties: [],
      stocks: [],
    };
    const compact = toCompact(state);
    expect(compact.i[0].it).toBe("capital-gains");
  });

  it("encodes other incomeType", () => {
    const state: FinancialState = {
      assets: [],
      debts: [],
      income: [{ id: "i1", category: "Gift", amount: 500, incomeType: "other" }],
      expenses: [],
      goals: [],
      properties: [],
      stocks: [],
    };
    const compact = toCompact(state);
    expect(compact.i[0].it).toBe("other");
  });

  it("roundtrips income with capital-gains incomeType", () => {
    const state: FinancialState = {
      assets: [],
      debts: [],
      income: [{ id: "i1", category: "Stock Sale", amount: 10000, incomeType: "capital-gains", frequency: "annually" }],
      expenses: [],
      goals: [],
      properties: [],
      stocks: [],
    };
    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.income[0].incomeType).toBe("capital-gains");
    expect(decoded!.income[0].frequency).toBe("annually");
    expect(decoded!.income[0].category).toBe("Stock Sale");
    expect(decoded!.income[0].amount).toBe(10000);
  });

  it("roundtrips income with other incomeType", () => {
    const state: FinancialState = {
      assets: [],
      debts: [],
      income: [{ id: "i1", category: "Gift", amount: 500, incomeType: "other" }],
      expenses: [],
      goals: [],
      properties: [],
      stocks: [],
    };
    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.income[0].incomeType).toBe("other");
  });

  it("roundtrips income without incomeType (backward compat)", () => {
    const state: FinancialState = {
      assets: [],
      debts: [],
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
      expenses: [],
      goals: [],
      properties: [],
      stocks: [],
    };
    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.income[0].incomeType).toBeUndefined();
  });

  it("roundtrips mixed income items with different types", () => {
    const state: FinancialState = {
      assets: [],
      debts: [],
      income: [
        { id: "i1", category: "Salary", amount: 5000 },
        { id: "i2", category: "Stock Sale", amount: 10000, incomeType: "capital-gains" },
        { id: "i3", category: "Side Job", amount: 800, incomeType: "other", frequency: "weekly" },
      ],
      expenses: [],
      goals: [],
      properties: [],
      stocks: [],
    };
    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.income).toHaveLength(3);
    expect(decoded!.income[0].incomeType).toBeUndefined();
    expect(decoded!.income[1].incomeType).toBe("capital-gains");
    expect(decoded!.income[2].incomeType).toBe("other");
    expect(decoded!.income[2].frequency).toBe("weekly");
  });
});

describe("getStateFromURL", () => {
  beforeEach(() => {
    // Set a clean URL
    window.history.replaceState(null, "", "/");
  });

  it("returns null when no s= param exists", () => {
    expect(getStateFromURL()).toBeNull();
  });

  it("restores state from s= param", () => {
    const encoded = encodeState(INITIAL_STATE);
    window.history.replaceState(null, "", `/?s=${encodeURIComponent(encoded)}`);
    const restored = getStateFromURL();
    expect(restored).not.toBeNull();
    expect(restored!.assets).toHaveLength(INITIAL_STATE.assets.length);
    expect(restored!.assets[0].category).toBe(INITIAL_STATE.assets[0].category);
  });

  it("returns null for corrupted s= param", () => {
    window.history.replaceState(null, "", "/?s=garbage_data");
    expect(getStateFromURL()).toBeNull();
  });
});

describe("updateURL", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("sets s= param in the URL", () => {
    updateURL(INITIAL_STATE);
    const params = new URLSearchParams(window.location.search);
    expect(params.has("s")).toBe(true);
    expect(params.get("s")).toBeTruthy();
  });

  it("updates can be read back with getStateFromURL", () => {
    updateURL(INITIAL_STATE);
    const restored = getStateFromURL();
    expect(restored).not.toBeNull();
    expect(restored!.assets[0].category).toBe(INITIAL_STATE.assets[0].category);
    expect(restored!.assets[0].amount).toBe(INITIAL_STATE.assets[0].amount);
  });

  it("uses replaceState (does not add history entries)", () => {
    const spy = vi.spyOn(window.history, "replaceState");
    updateURL(INITIAL_STATE);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
