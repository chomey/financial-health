import { describe, it, expect } from "vitest";
import {
  ACCOUNT_TYPE_DESCRIPTIONS,
  getAccountTypeDescription,
} from "@/components/AssetEntry";

describe("ACCOUNT_TYPE_DESCRIPTIONS", () => {
  it("includes all CA account types", () => {
    expect(ACCOUNT_TYPE_DESCRIPTIONS["TFSA"]).toBeDefined();
    expect(ACCOUNT_TYPE_DESCRIPTIONS["RRSP"]).toBeDefined();
    expect(ACCOUNT_TYPE_DESCRIPTIONS["RESP"]).toBeDefined();
    expect(ACCOUNT_TYPE_DESCRIPTIONS["FHSA"]).toBeDefined();
    expect(ACCOUNT_TYPE_DESCRIPTIONS["LIRA"]).toBeDefined();
  });

  it("includes all US account types", () => {
    expect(ACCOUNT_TYPE_DESCRIPTIONS["401k"]).toBeDefined();
    expect(ACCOUNT_TYPE_DESCRIPTIONS["Roth 401k"]).toBeDefined();
    expect(ACCOUNT_TYPE_DESCRIPTIONS["IRA"]).toBeDefined();
    expect(ACCOUNT_TYPE_DESCRIPTIONS["Roth IRA"]).toBeDefined();
    expect(ACCOUNT_TYPE_DESCRIPTIONS["529"]).toBeDefined();
    expect(ACCOUNT_TYPE_DESCRIPTIONS["HSA"]).toBeDefined();
  });

  it("includes all AU account types", () => {
    expect(ACCOUNT_TYPE_DESCRIPTIONS["Super (Accumulation)"]).toBeDefined();
    expect(ACCOUNT_TYPE_DESCRIPTIONS["Super (Pension Phase)"]).toBeDefined();
    expect(ACCOUNT_TYPE_DESCRIPTIONS["First Home Super Saver"]).toBeDefined();
  });

  it("TFSA description mentions contribution room", () => {
    expect(ACCOUNT_TYPE_DESCRIPTIONS["TFSA"]).toContain("$7,000");
  });

  it("RRSP description mentions tax-deferred", () => {
    expect(ACCOUNT_TYPE_DESCRIPTIONS["RRSP"]).toContain("Tax-deferred");
  });

  it("Roth IRA description mentions income limits", () => {
    expect(ACCOUNT_TYPE_DESCRIPTIONS["Roth IRA"]).toContain("income limits");
  });

  it("HSA description mentions triple tax advantage", () => {
    expect(ACCOUNT_TYPE_DESCRIPTIONS["HSA"]).toContain("Triple tax");
  });
});

describe("getAccountTypeDescription", () => {
  it("returns description for known types", () => {
    expect(getAccountTypeDescription("TFSA")).toBe(ACCOUNT_TYPE_DESCRIPTIONS["TFSA"]);
    expect(getAccountTypeDescription("401k")).toBe(ACCOUNT_TYPE_DESCRIPTIONS["401k"]);
    expect(getAccountTypeDescription("Super (Accumulation)")).toBe(ACCOUNT_TYPE_DESCRIPTIONS["Super (Accumulation)"]);
  });

  it("returns undefined for unknown types", () => {
    expect(getAccountTypeDescription("Savings")).toBeUndefined();
    expect(getAccountTypeDescription("Custom Account")).toBeUndefined();
    expect(getAccountTypeDescription("")).toBeUndefined();
  });
});
