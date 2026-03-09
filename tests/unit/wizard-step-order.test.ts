import { describe, it, expect } from "vitest";
import { WIZARD_STEPS } from "@/lib/url-state";

describe("WIZARD_STEPS order", () => {
  it("has the correct new order: income and expenses before debts, property, assets, stocks", () => {
    expect(WIZARD_STEPS).toEqual([
      "welcome",
      "profile",
      "income",
      "expenses",
      "debts",
      "property",
      "assets",
      "stocks",
      "tax-summary",
    ]);
  });

  it("income comes before expenses", () => {
    expect(WIZARD_STEPS.indexOf("income")).toBeLessThan(WIZARD_STEPS.indexOf("expenses"));
  });

  it("expenses comes before debts", () => {
    expect(WIZARD_STEPS.indexOf("expenses")).toBeLessThan(WIZARD_STEPS.indexOf("debts"));
  });

  it("debts comes before property", () => {
    expect(WIZARD_STEPS.indexOf("debts")).toBeLessThan(WIZARD_STEPS.indexOf("property"));
  });

  it("property comes before assets", () => {
    expect(WIZARD_STEPS.indexOf("property")).toBeLessThan(WIZARD_STEPS.indexOf("assets"));
  });

  it("assets comes before stocks", () => {
    expect(WIZARD_STEPS.indexOf("assets")).toBeLessThan(WIZARD_STEPS.indexOf("stocks"));
  });

  it("stocks comes before tax-summary", () => {
    expect(WIZARD_STEPS.indexOf("stocks")).toBeLessThan(WIZARD_STEPS.indexOf("tax-summary"));
  });

  it("tax-summary is the last step", () => {
    expect(WIZARD_STEPS[WIZARD_STEPS.length - 1]).toBe("tax-summary");
  });

  it("welcome is the first step", () => {
    expect(WIZARD_STEPS[0]).toBe("welcome");
  });

  it("profile is the second step", () => {
    expect(WIZARD_STEPS[1]).toBe("profile");
  });

  it("contains all 9 steps", () => {
    expect(WIZARD_STEPS.length).toBe(9);
  });
});
