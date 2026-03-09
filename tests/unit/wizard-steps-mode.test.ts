import { describe, it, expect } from "vitest";
import {
  getWizardSteps,
  SIMPLE_WIZARD_STEPS,
  ADVANCED_WIZARD_STEPS,
  WIZARD_STEPS,
} from "@/lib/url-state";

describe("getWizardSteps", () => {
  it("returns 6 steps for simple mode", () => {
    const steps = getWizardSteps("simple");
    expect(steps).toHaveLength(6);
  });

  it("returns 9 steps for advanced mode", () => {
    const steps = getWizardSteps("advanced");
    expect(steps).toHaveLength(9);
  });

  it("simple mode includes welcome, profile, income, expenses, assets, tax-summary", () => {
    const steps = getWizardSteps("simple");
    expect(steps).toEqual(["welcome", "profile", "income", "expenses", "assets", "tax-summary"]);
  });

  it("advanced mode includes debts, property, stocks — hidden in simple", () => {
    const steps = getWizardSteps("advanced");
    expect(steps).toContain("debts");
    expect(steps).toContain("property");
    expect(steps).toContain("stocks");
  });

  it("simple mode does NOT include debts, property, or stocks", () => {
    const steps = getWizardSteps("simple");
    expect(steps).not.toContain("debts");
    expect(steps).not.toContain("property");
    expect(steps).not.toContain("stocks");
  });

  it("advanced mode ends with tax-summary", () => {
    const steps = getWizardSteps("advanced");
    expect(steps[steps.length - 1]).toBe("tax-summary");
  });

  it("simple mode ends with tax-summary", () => {
    const steps = getWizardSteps("simple");
    expect(steps[steps.length - 1]).toBe("tax-summary");
  });

  it("both modes start with welcome, profile", () => {
    expect(getWizardSteps("simple").slice(0, 2)).toEqual(["welcome", "profile"]);
    expect(getWizardSteps("advanced").slice(0, 2)).toEqual(["welcome", "profile"]);
  });

  it("SIMPLE_WIZARD_STEPS matches getWizardSteps('simple')", () => {
    expect(SIMPLE_WIZARD_STEPS).toEqual(getWizardSteps("simple"));
  });

  it("ADVANCED_WIZARD_STEPS matches getWizardSteps('advanced')", () => {
    expect(ADVANCED_WIZARD_STEPS).toEqual(getWizardSteps("advanced"));
  });

  it("WIZARD_STEPS backward-compat alias equals ADVANCED_WIZARD_STEPS", () => {
    expect(WIZARD_STEPS).toEqual(ADVANCED_WIZARD_STEPS);
  });
});
