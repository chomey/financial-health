import { describe, it, expect } from "vitest";
import { canadianInsights } from "@/lib/countries/canada/insights";
import { INITIAL_STATE } from "@/lib/financial-types";
import type { FinancialState } from "@/lib/financial-types";

const base: FinancialState = {
  ...INITIAL_STATE,
  assets: [],
  debts: [],
  income: [],
  expenses: [],
  properties: [],
  stocks: [],
};

describe("canadianInsights", () => {
  it("returns an array for a CA state", () => {
    const state: FinancialState = { ...base, country: "CA" };
    const candidates = canadianInsights.getCandidates(state);
    expect(Array.isArray(candidates)).toBe(true);
  });

  it("returns empty array for a non-CA state", () => {
    const state: FinancialState = { ...base, country: "US" };
    expect(canadianInsights.getCandidates(state)).toEqual([]);
  });

  it("returns empty array when country is AU", () => {
    const state: FinancialState = { ...base, country: "AU" };
    expect(canadianInsights.getCandidates(state)).toEqual([]);
  });

  it("returns empty array when country is undefined", () => {
    const state: FinancialState = { ...base, country: undefined };
    expect(canadianInsights.getCandidates(state)).toEqual([]);
  });

  it("suggests TFSA when user has no TFSA or FHSA", () => {
    const state: FinancialState = {
      ...base,
      country: "CA",
      assets: [{ id: "a1", category: "Savings Account", amount: 5000 }],
    };
    const candidates = canadianInsights.getCandidates(state);
    expect(candidates.some((c) => c.id === "ca-no-tfsa")).toBe(true);
  });

  it("does NOT suggest TFSA when user already has a TFSA", () => {
    const state: FinancialState = {
      ...base,
      country: "CA",
      assets: [{ id: "a1", category: "TFSA", amount: 10000 }],
    };
    const candidates = canadianInsights.getCandidates(state);
    expect(candidates.some((c) => c.id === "ca-no-tfsa")).toBe(false);
  });

  it("does NOT suggest TFSA when user already has an FHSA", () => {
    const state: FinancialState = {
      ...base,
      country: "CA",
      assets: [{ id: "a1", category: "FHSA", amount: 5000 }],
    };
    const candidates = canadianInsights.getCandidates(state);
    expect(candidates.some((c) => c.id === "ca-no-tfsa")).toBe(false);
  });

  it("suggests RRSP when user has salary income but no RRSP", () => {
    const state: FinancialState = {
      ...base,
      country: "CA",
      assets: [{ id: "a1", category: "TFSA", amount: 10000 }],
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
    };
    const candidates = canadianInsights.getCandidates(state);
    expect(candidates.some((c) => c.id === "ca-no-rrsp")).toBe(true);
  });

  it("does NOT suggest RRSP when user already has an RRSP", () => {
    const state: FinancialState = {
      ...base,
      country: "CA",
      assets: [
        { id: "a1", category: "TFSA", amount: 10000 },
        { id: "a2", category: "RRSP", amount: 20000 },
      ],
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
    };
    const candidates = canadianInsights.getCandidates(state);
    expect(candidates.some((c) => c.id === "ca-no-rrsp")).toBe(false);
  });

  it("does NOT suggest RRSP without employment income", () => {
    const state: FinancialState = {
      ...base,
      country: "CA",
      income: [{ id: "i1", category: "Investment Returns", amount: 2000 }],
    };
    const candidates = canadianInsights.getCandidates(state);
    expect(candidates.some((c) => c.id === "ca-no-rrsp")).toBe(false);
  });

  it("suggests FHSA when user has employment income, no property, and no FHSA", () => {
    const state: FinancialState = {
      ...base,
      country: "CA",
      assets: [{ id: "a1", category: "TFSA", amount: 5000 }],
      income: [{ id: "i1", category: "Salary", amount: 4000 }],
      properties: [],
    };
    const candidates = canadianInsights.getCandidates(state);
    expect(candidates.some((c) => c.id === "ca-fhsa")).toBe(true);
  });

  it("does NOT suggest FHSA when user already owns property", () => {
    const state: FinancialState = {
      ...base,
      country: "CA",
      assets: [{ id: "a1", category: "TFSA", amount: 5000 }],
      income: [{ id: "i1", category: "Salary", amount: 4000 }],
      properties: [{ id: "p1", name: "Home", value: 700000, mortgage: 400000 }],
    };
    const candidates = canadianInsights.getCandidates(state);
    expect(candidates.some((c) => c.id === "ca-fhsa")).toBe(false);
  });

  it("does NOT suggest FHSA when user already has an FHSA", () => {
    const state: FinancialState = {
      ...base,
      country: "CA",
      assets: [{ id: "a1", category: "FHSA", amount: 8000 }],
      income: [{ id: "i1", category: "Salary", amount: 4000 }],
      properties: [],
    };
    const candidates = canadianInsights.getCandidates(state);
    expect(candidates.some((c) => c.id === "ca-fhsa")).toBe(false);
  });

  it("suggests RRIF conversion reminder for age 65–70 with RRSP", () => {
    const state: FinancialState = {
      ...base,
      country: "CA",
      age: 68,
      assets: [{ id: "a1", category: "RRSP", amount: 200000 }],
    };
    const candidates = canadianInsights.getCandidates(state);
    const rrif = candidates.find((c) => c.id === "ca-rrif-upcoming");
    expect(rrif).toBeDefined();
    expect(rrif!.message).toContain("3 years");
  });

  it("does NOT suggest RRIF reminder for age under 65", () => {
    const state: FinancialState = {
      ...base,
      country: "CA",
      age: 55,
      assets: [{ id: "a1", category: "RRSP", amount: 200000 }],
    };
    const candidates = canadianInsights.getCandidates(state);
    expect(candidates.some((c) => c.id === "ca-rrif-upcoming")).toBe(false);
  });

  it("does NOT suggest RRIF reminder for age 71+", () => {
    const state: FinancialState = {
      ...base,
      country: "CA",
      age: 71,
      assets: [{ id: "a1", category: "RRSP", amount: 200000 }],
    };
    const candidates = canadianInsights.getCandidates(state);
    expect(candidates.some((c) => c.id === "ca-rrif-upcoming")).toBe(false);
  });

  it("does NOT suggest RRIF reminder without an RRSP", () => {
    const state: FinancialState = {
      ...base,
      country: "CA",
      age: 67,
      assets: [{ id: "a1", category: "TFSA", amount: 50000 }],
    };
    const candidates = canadianInsights.getCandidates(state);
    expect(candidates.some((c) => c.id === "ca-rrif-upcoming")).toBe(false);
  });

  it("all returned insights have id, type, message, and icon", () => {
    const state: FinancialState = { ...base, country: "CA" };
    for (const insight of canadianInsights.getCandidates(state)) {
      expect(insight.id).toBeTruthy();
      expect(insight.type).toBeTruthy();
      expect(insight.message).toBeTruthy();
      expect(insight.icon).toBeTruthy();
    }
  });
});
