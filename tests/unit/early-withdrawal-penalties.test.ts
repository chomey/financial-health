import { describe, it, expect } from "vitest";
import { getEarlyWithdrawalPenalties } from "@/lib/withdrawal-tax";
import { toFinancialData } from "@/lib/financial-state";
import { INITIAL_STATE } from "@/lib/financial-types";

describe("Early withdrawal penalties", () => {
  describe("US accounts", () => {
    it("401k has 10% penalty before 59.5", () => {
      const penalties = getEarlyWithdrawalPenalties(["401k"], 50, "US");
      expect(penalties).toHaveLength(1);
      expect(penalties[0].penaltyPercent).toBe(10);
      expect(penalties[0].penaltyFreeAge).toBe(59.5);
    });

    it("Traditional IRA has 10% penalty before 59.5", () => {
      const penalties = getEarlyWithdrawalPenalties(["IRA"], 45, "US");
      expect(penalties).toHaveLength(1);
      expect(penalties[0].penaltyPercent).toBe(10);
    });

    it("Roth IRA has earnings penalty before 59.5", () => {
      const penalties = getEarlyWithdrawalPenalties(["Roth IRA"], 40, "US");
      expect(penalties).toHaveLength(1);
      expect(penalties[0].rule).toContain("earnings");
    });

    it("no penalty at 60 for 401k", () => {
      const penalties = getEarlyWithdrawalPenalties(["401k"], 60, "US");
      expect(penalties).toHaveLength(0);
    });

    it("no penalty for taxable accounts", () => {
      const penalties = getEarlyWithdrawalPenalties(["Brokerage", "Savings"], 30, "US");
      expect(penalties).toHaveLength(0);
    });

    it("multiple accounts can have penalties", () => {
      const penalties = getEarlyWithdrawalPenalties(["401k", "IRA", "Roth IRA"], 50, "US");
      expect(penalties).toHaveLength(3);
    });
  });

  describe("CA accounts", () => {
    it("RRSP withdrawal flagged before 65", () => {
      const penalties = getEarlyWithdrawalPenalties(["RRSP"], 55, "CA");
      expect(penalties).toHaveLength(1);
      expect(penalties[0].rule).toContain("withholding");
    });

    it("LIRA flagged before 65", () => {
      const penalties = getEarlyWithdrawalPenalties(["LIRA"], 50, "CA");
      expect(penalties).toHaveLength(1);
    });

    it("no warning at 65 for RRSP", () => {
      const penalties = getEarlyWithdrawalPenalties(["RRSP"], 65, "CA");
      expect(penalties).toHaveLength(0);
    });

    it("TFSA has no penalty at any age", () => {
      const penalties = getEarlyWithdrawalPenalties(["TFSA"], 25, "CA");
      expect(penalties).toHaveLength(0);
    });
  });

  describe("AU accounts", () => {
    it("Super has restriction before 60", () => {
      const penalties = getEarlyWithdrawalPenalties(["Super (Accumulation)"], 55, "AU");
      expect(penalties).toHaveLength(1);
      expect(penalties[0].penaltyFreeAge).toBe(60);
      expect(penalties[0].rule).toContain("preservation age");
    });

    it("no restriction at 60 for Super", () => {
      const penalties = getEarlyWithdrawalPenalties(["Super (Accumulation)"], 60, "AU");
      expect(penalties).toHaveLength(0);
    });

    it("Super Pension Phase has restriction before 60", () => {
      const penalties = getEarlyWithdrawalPenalties(["Super (Pension Phase)"], 55, "AU");
      expect(penalties).toHaveLength(1);
    });

    it("FHSS not subject to preservation age", () => {
      const penalties = getEarlyWithdrawalPenalties(["First Home Super Saver"], 30, "AU");
      expect(penalties).toHaveLength(0);
    });
  });

  describe("edge cases", () => {
    it("no penalties when age is undefined", () => {
      const penalties = getEarlyWithdrawalPenalties(["401k"], undefined, "US");
      expect(penalties).toHaveLength(0);
    });

    it("no penalties with empty categories", () => {
      const penalties = getEarlyWithdrawalPenalties([], 30, "US");
      expect(penalties).toHaveLength(0);
    });
  });

  describe("toFinancialData integration", () => {
    it("includes penalties when user is young with tax-deferred accounts", () => {
      const state = { ...INITIAL_STATE, age: 40, country: "CA" as const };
      const data = toFinancialData(state);
      // Default INITIAL_STATE has RRSP — should have penalty at age 40
      expect(data.withdrawalTax?.earlyWithdrawalPenalties).toBeDefined();
      expect(data.withdrawalTax!.earlyWithdrawalPenalties!.length).toBeGreaterThan(0);
    });

    it("no penalties when user is old enough", () => {
      const state = { ...INITIAL_STATE, age: 70, country: "CA" as const };
      const data = toFinancialData(state);
      expect(data.withdrawalTax?.earlyWithdrawalPenalties).toBeUndefined();
    });

    it("US user with 401k gets penalty at age 50", () => {
      const state = {
        ...INITIAL_STATE,
        country: "US" as const,
        jurisdiction: "CA",
        age: 50,
        assets: [{ id: "a1", category: "401k", amount: 200000, surplusTarget: false }],
      };
      const data = toFinancialData(state);
      expect(data.withdrawalTax?.earlyWithdrawalPenalties).toBeDefined();
      const p401k = data.withdrawalTax!.earlyWithdrawalPenalties!.find(p => p.category === "401k");
      expect(p401k).toBeDefined();
      expect(p401k!.penaltyPercent).toBe(10);
    });
  });
});
