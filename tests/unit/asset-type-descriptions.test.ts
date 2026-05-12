import { describe, it, expect } from "vitest";
import {
  getAccountTypeDescription,
} from "@/components/AssetEntry";

describe("getAccountTypeDescription — CA account types", () => {
  it("returns description for all CA types", () => {
    expect(getAccountTypeDescription("TFSA")).toBeDefined();
    expect(getAccountTypeDescription("RRSP")).toBeDefined();
    expect(getAccountTypeDescription("RESP")).toBeDefined();
    expect(getAccountTypeDescription("FHSA")).toBeDefined();
    expect(getAccountTypeDescription("LIRA")).toBeDefined();
  });

  it("TFSA description mentions contribution room", () => {
    expect(getAccountTypeDescription("TFSA")).toContain("$7,000");
  });

  it("RRSP description mentions tax-deferred", () => {
    expect(getAccountTypeDescription("RRSP")).toContain("Tax-deferred");
  });
});

describe("getAccountTypeDescription — US account types", () => {
  it("returns description for all US types", () => {
    expect(getAccountTypeDescription("401k")).toBeDefined();
    expect(getAccountTypeDescription("Roth 401k")).toBeDefined();
    expect(getAccountTypeDescription("IRA")).toBeDefined();
    expect(getAccountTypeDescription("Roth IRA")).toBeDefined();
    expect(getAccountTypeDescription("529")).toBeDefined();
    expect(getAccountTypeDescription("HSA")).toBeDefined();
  });

  it("Roth IRA description mentions income limits", () => {
    expect(getAccountTypeDescription("Roth IRA")).toContain("income limits");
  });

  it("HSA description mentions triple tax advantage", () => {
    expect(getAccountTypeDescription("HSA")).toContain("Triple tax");
  });
});

describe("getAccountTypeDescription — AU account types", () => {
  it("returns description for all AU types", () => {
    expect(getAccountTypeDescription("Super (Accumulation)")).toBeDefined();
    expect(getAccountTypeDescription("Super (Pension Phase)")).toBeDefined();
    expect(getAccountTypeDescription("First Home Super Saver")).toBeDefined();
  });
});

describe("getAccountTypeDescription — unknown types", () => {
  it("returns undefined for generic categories", () => {
    expect(getAccountTypeDescription("Savings")).toBeUndefined();
    expect(getAccountTypeDescription("Custom Account")).toBeUndefined();
    expect(getAccountTypeDescription("")).toBeUndefined();
  });
});
