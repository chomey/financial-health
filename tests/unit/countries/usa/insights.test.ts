import { describe, it, expect } from "vitest";
import { americanInsights } from "@/lib/countries/usa/insights";
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

describe("americanInsights", () => {
  it("returns an array for a US state", () => {
    const state: FinancialState = { ...base, country: "US" };
    expect(Array.isArray(americanInsights.getCandidates(state))).toBe(true);
  });

  it("returns empty array for a CA state", () => {
    const state: FinancialState = { ...base, country: "CA" };
    expect(americanInsights.getCandidates(state)).toEqual([]);
  });

  it("returns empty array for an AU state", () => {
    const state: FinancialState = { ...base, country: "AU" };
    expect(americanInsights.getCandidates(state)).toEqual([]);
  });

  it("returns empty array when country is undefined", () => {
    const state: FinancialState = { ...base, country: undefined };
    expect(americanInsights.getCandidates(state)).toEqual([]);
  });

  // Roth IRA
  it("suggests Roth IRA when user has no Roth account", () => {
    const state: FinancialState = {
      ...base,
      country: "US",
      assets: [{ id: "a1", category: "Savings Account", amount: 5000 }],
    };
    expect(americanInsights.getCandidates(state).some((c) => c.id === "us-no-roth-ira")).toBe(true);
  });

  it("does NOT suggest Roth IRA when user already has a Roth IRA", () => {
    const state: FinancialState = {
      ...base,
      country: "US",
      assets: [{ id: "a1", category: "Roth IRA", amount: 10000 }],
    };
    expect(americanInsights.getCandidates(state).some((c) => c.id === "us-no-roth-ira")).toBe(false);
  });

  it("does NOT suggest Roth IRA when user already has a Roth 401k", () => {
    const state: FinancialState = {
      ...base,
      country: "US",
      assets: [{ id: "a1", category: "Roth 401k", amount: 15000 }],
    };
    expect(americanInsights.getCandidates(state).some((c) => c.id === "us-no-roth-ira")).toBe(false);
  });

  // 401k employer match
  it("suggests 401k when user has employment income but no 401k", () => {
    const state: FinancialState = {
      ...base,
      country: "US",
      assets: [{ id: "a1", category: "Roth IRA", amount: 10000 }],
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
    };
    expect(americanInsights.getCandidates(state).some((c) => c.id === "us-no-401k")).toBe(true);
  });

  it("does NOT suggest 401k when user already has a 401k", () => {
    const state: FinancialState = {
      ...base,
      country: "US",
      assets: [{ id: "a1", category: "401k", amount: 50000 }],
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
    };
    expect(americanInsights.getCandidates(state).some((c) => c.id === "us-no-401k")).toBe(false);
  });

  it("does NOT suggest 401k without employment income", () => {
    const state: FinancialState = {
      ...base,
      country: "US",
      income: [{ id: "i1", category: "Investment Returns", amount: 2000 }],
    };
    expect(americanInsights.getCandidates(state).some((c) => c.id === "us-no-401k")).toBe(false);
  });

  // HSA
  it("suggests HSA when user has employment income but no HSA", () => {
    const state: FinancialState = {
      ...base,
      country: "US",
      assets: [{ id: "a1", category: "401k", amount: 20000 }],
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
    };
    expect(americanInsights.getCandidates(state).some((c) => c.id === "us-no-hsa")).toBe(true);
  });

  it("does NOT suggest HSA when user already has an HSA", () => {
    const state: FinancialState = {
      ...base,
      country: "US",
      assets: [{ id: "a1", category: "HSA", amount: 4000 }],
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
    };
    expect(americanInsights.getCandidates(state).some((c) => c.id === "us-no-hsa")).toBe(false);
  });

  it("does NOT suggest HSA without employment income", () => {
    const state: FinancialState = {
      ...base,
      country: "US",
      assets: [{ id: "a1", category: "Savings Account", amount: 5000 }],
      income: [{ id: "i1", category: "Pension", amount: 2000 }],
    };
    expect(americanInsights.getCandidates(state).some((c) => c.id === "us-no-hsa")).toBe(false);
  });

  // RMD upcoming
  it("suggests RMD reminder for age 65–72 with a 401k", () => {
    const state: FinancialState = {
      ...base,
      country: "US",
      age: 68,
      assets: [{ id: "a1", category: "401k", amount: 200000 }],
    };
    const rmd = americanInsights.getCandidates(state).find((c) => c.id === "us-rmd-upcoming");
    expect(rmd).toBeDefined();
    expect(rmd!.message).toContain("5 years");
  });

  it("suggests RMD reminder for age 65–72 with an IRA", () => {
    const state: FinancialState = {
      ...base,
      country: "US",
      age: 70,
      assets: [{ id: "a1", category: "IRA", amount: 150000 }],
    };
    const rmd = americanInsights.getCandidates(state).find((c) => c.id === "us-rmd-upcoming");
    expect(rmd).toBeDefined();
    expect(rmd!.message).toContain("3 years");
  });

  it("does NOT suggest RMD reminder for age under 65", () => {
    const state: FinancialState = {
      ...base,
      country: "US",
      age: 55,
      assets: [{ id: "a1", category: "401k", amount: 200000 }],
    };
    expect(americanInsights.getCandidates(state).some((c) => c.id === "us-rmd-upcoming")).toBe(false);
  });

  it("does NOT suggest RMD reminder for age 73+", () => {
    const state: FinancialState = {
      ...base,
      country: "US",
      age: 73,
      assets: [{ id: "a1", category: "401k", amount: 200000 }],
    };
    expect(americanInsights.getCandidates(state).some((c) => c.id === "us-rmd-upcoming")).toBe(false);
  });

  it("does NOT suggest RMD reminder without tax-deferred accounts", () => {
    const state: FinancialState = {
      ...base,
      country: "US",
      age: 68,
      assets: [{ id: "a1", category: "Roth IRA", amount: 100000 }],
    };
    expect(americanInsights.getCandidates(state).some((c) => c.id === "us-rmd-upcoming")).toBe(false);
  });

  it("all returned insights have id, type, message, and icon", () => {
    const state: FinancialState = { ...base, country: "US" };
    for (const insight of americanInsights.getCandidates(state)) {
      expect(insight.id).toBeTruthy();
      expect(insight.type).toBeTruthy();
      expect(insight.message).toBeTruthy();
      expect(insight.icon).toBeTruthy();
    }
  });
});
