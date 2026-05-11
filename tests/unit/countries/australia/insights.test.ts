import { describe, it, expect } from "vitest";
import { australianInsights } from "@/lib/countries/australia/insights";
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

describe("australianInsights", () => {
  it("returns an array for an AU state", () => {
    const state: FinancialState = { ...base, country: "AU" };
    expect(Array.isArray(australianInsights.getCandidates(state))).toBe(true);
  });

  it("returns empty array for a CA state", () => {
    const state: FinancialState = { ...base, country: "CA" };
    expect(australianInsights.getCandidates(state)).toEqual([]);
  });

  it("returns empty array for a US state", () => {
    const state: FinancialState = { ...base, country: "US" };
    expect(australianInsights.getCandidates(state)).toEqual([]);
  });

  it("returns empty array when country is undefined", () => {
    const state: FinancialState = { ...base, country: undefined };
    expect(australianInsights.getCandidates(state)).toEqual([]);
  });

  // Super contribution
  it("suggests super setup when user has employment income but no super", () => {
    const state: FinancialState = {
      ...base,
      country: "AU",
      assets: [{ id: "a1", category: "Savings Account", amount: 5000 }],
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
    };
    expect(australianInsights.getCandidates(state).some((c) => c.id === "au-no-super")).toBe(true);
  });

  it("does NOT suggest super setup when user already has Super (Accumulation)", () => {
    const state: FinancialState = {
      ...base,
      country: "AU",
      assets: [{ id: "a1", category: "Super (Accumulation)", amount: 20000 }],
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
    };
    expect(australianInsights.getCandidates(state).some((c) => c.id === "au-no-super")).toBe(false);
  });

  it("does NOT suggest super setup when user has Super (Pension Phase)", () => {
    const state: FinancialState = {
      ...base,
      country: "AU",
      assets: [{ id: "a1", category: "Super (Pension Phase)", amount: 500000 }],
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
    };
    expect(australianInsights.getCandidates(state).some((c) => c.id === "au-no-super")).toBe(false);
  });

  it("does NOT suggest super setup without employment income", () => {
    const state: FinancialState = {
      ...base,
      country: "AU",
      income: [{ id: "i1", category: "Investment Returns", amount: 2000 }],
    };
    expect(australianInsights.getCandidates(state).some((c) => c.id === "au-no-super")).toBe(false);
  });

  // FHSS
  it("suggests FHSS when user has employment income, no property, and no FHSS account", () => {
    const state: FinancialState = {
      ...base,
      country: "AU",
      assets: [{ id: "a1", category: "Super (Accumulation)", amount: 10000 }],
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
      properties: [],
    };
    expect(australianInsights.getCandidates(state).some((c) => c.id === "au-fhss")).toBe(true);
  });

  it("does NOT suggest FHSS when user already has a First Home Super Saver account", () => {
    const state: FinancialState = {
      ...base,
      country: "AU",
      assets: [
        { id: "a1", category: "Super (Accumulation)", amount: 10000 },
        { id: "a2", category: "First Home Super Saver", amount: 5000 },
      ],
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
      properties: [],
    };
    expect(australianInsights.getCandidates(state).some((c) => c.id === "au-fhss")).toBe(false);
  });

  it("does NOT suggest FHSS when user already owns property", () => {
    const state: FinancialState = {
      ...base,
      country: "AU",
      assets: [{ id: "a1", category: "Super (Accumulation)", amount: 10000 }],
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
      properties: [{ id: "p1", name: "Home", value: 700000, mortgage: 400000 }],
    };
    expect(australianInsights.getCandidates(state).some((c) => c.id === "au-fhss")).toBe(false);
  });

  it("does NOT suggest FHSS without employment income", () => {
    const state: FinancialState = {
      ...base,
      country: "AU",
      income: [{ id: "i1", category: "Pension", amount: 2000 }],
    };
    expect(australianInsights.getCandidates(state).some((c) => c.id === "au-fhss")).toBe(false);
  });

  // Age Pension
  it("suggests Age Pension reminder for age 60–66 with upcoming eligibility", () => {
    const state: FinancialState = {
      ...base,
      country: "AU",
      age: 63,
      assets: [{ id: "a1", category: "Super (Accumulation)", amount: 300000 }],
    };
    const pension = australianInsights.getCandidates(state).find((c) => c.id === "au-age-pension-upcoming");
    expect(pension).toBeDefined();
    expect(pension!.message).toContain("4 years");
  });

  it("Age Pension reminder message uses singular 'year' when 1 year away", () => {
    const state: FinancialState = {
      ...base,
      country: "AU",
      age: 66,
    };
    const pension = australianInsights.getCandidates(state).find((c) => c.id === "au-age-pension-upcoming");
    expect(pension).toBeDefined();
    expect(pension!.message).toContain("1 year ");
    expect(pension!.message).not.toContain("1 years");
  });

  it("does NOT suggest Age Pension reminder for age below 60", () => {
    const state: FinancialState = {
      ...base,
      country: "AU",
      age: 55,
    };
    expect(australianInsights.getCandidates(state).some((c) => c.id === "au-age-pension-upcoming")).toBe(false);
  });

  it("does NOT suggest Age Pension reminder at age 67 (already eligible)", () => {
    const state: FinancialState = {
      ...base,
      country: "AU",
      age: 67,
    };
    expect(australianInsights.getCandidates(state).some((c) => c.id === "au-age-pension-upcoming")).toBe(false);
  });

  it("does NOT suggest Age Pension reminder when age is undefined", () => {
    const state: FinancialState = { ...base, country: "AU" };
    expect(australianInsights.getCandidates(state).some((c) => c.id === "au-age-pension-upcoming")).toBe(false);
  });

  it("all returned insights have id, type, message, and icon", () => {
    const state: FinancialState = {
      ...base,
      country: "AU",
      income: [{ id: "i1", category: "Salary", amount: 5000 }],
    };
    for (const insight of australianInsights.getCandidates(state)) {
      expect(insight.id).toBeTruthy();
      expect(insight.type).toBeTruthy();
      expect(insight.message).toBeTruthy();
      expect(insight.icon).toBeTruthy();
    }
  });
});
