import { describe, it, expect } from "vitest";
import { getDefaultAppreciation, getPropertyIcon } from "@/components/PropertyEntry";
import { encodeState, decodeState } from "@/lib/url-state";
import { projectFinances } from "@/lib/projections";
import type { FinancialState } from "@/lib/financial-state";
import { INITIAL_STATE } from "@/lib/financial-state";

describe("getDefaultAppreciation", () => {
  it("returns +3 for home-like property names", () => {
    expect(getDefaultAppreciation("Home")).toBe(3);
    expect(getDefaultAppreciation("My House")).toBe(3);
    expect(getDefaultAppreciation("Condo")).toBe(3);
    expect(getDefaultAppreciation("Rental")).toBe(3);
    expect(getDefaultAppreciation("Cottage")).toBe(3);
  });

  it("returns -15 for vehicle-like property names", () => {
    expect(getDefaultAppreciation("Car")).toBe(-15);
    expect(getDefaultAppreciation("Vehicle")).toBe(-15);
    expect(getDefaultAppreciation("Truck")).toBe(-15);
    expect(getDefaultAppreciation("Motorcycle")).toBe(-15);
  });

  it("returns undefined for unrecognized names", () => {
    expect(getDefaultAppreciation("Storage Unit")).toBeUndefined();
    expect(getDefaultAppreciation("Land")).toBeUndefined();
  });

  it("is case-insensitive", () => {
    expect(getDefaultAppreciation("HOME")).toBe(3);
    expect(getDefaultAppreciation("my car")).toBe(-15);
  });
});

describe("getPropertyIcon", () => {
  it("returns house for appreciating properties", () => {
    expect(getPropertyIcon(3, "Home")).toBe("🏠");
    expect(getPropertyIcon(0, "Home")).toBe("🏠");
    expect(getPropertyIcon(undefined, "Home")).toBe("🏠"); // default +3
  });

  it("returns car for depreciating properties", () => {
    expect(getPropertyIcon(-15, "Car")).toBe("🚗");
    expect(getPropertyIcon(-5, "Home")).toBe("🚗"); // explicit negative overrides name
    expect(getPropertyIcon(undefined, "Car")).toBe("🚗"); // default -15
  });

  it("returns house for unknown names with no explicit rate", () => {
    expect(getPropertyIcon(undefined, "Storage")).toBe("🏠");
  });
});

describe("URL state round-trip with appreciation", () => {
  it("persists appreciation in URL encoding", () => {
    const state: FinancialState = {
      ...INITIAL_STATE,
      properties: [
        { id: "p1", name: "Home", value: 500000, mortgage: 300000, appreciation: 3 },
        { id: "p2", name: "Car", value: 30000, mortgage: 0, appreciation: -15 },
      ],
    };
    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.properties[0].appreciation).toBe(3);
    expect(decoded!.properties[1].appreciation).toBe(-15);
  });

  it("omits appreciation from encoding when undefined", () => {
    const state: FinancialState = {
      ...INITIAL_STATE,
      properties: [
        { id: "p1", name: "Home", value: 500000, mortgage: 300000 },
      ],
    };
    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.properties[0].appreciation).toBeUndefined();
  });

  it("handles backward compatibility — missing appreciation field decodes as undefined", () => {
    // Encode state without appreciation, decode should still work
    const state: FinancialState = {
      ...INITIAL_STATE,
      properties: [
        { id: "p1", name: "Home", value: 450000, mortgage: 280000 },
      ],
    };
    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.properties[0].appreciation).toBeUndefined();
    expect(decoded!.properties[0].name).toBe("Home");
  });
});

describe("Projection engine with property appreciation", () => {
  it("appreciating property increases in value over time", () => {
    const state: FinancialState = {
      ...INITIAL_STATE,
      properties: [
        { id: "p1", name: "Home", value: 500000, mortgage: 0, appreciation: 3 },
      ],
    };
    const result = projectFinances(state, 10, "moderate");
    const first = result.points[0];
    const last = result.points[result.points.length - 1];
    // After 10 years at 3% annual, property should be worth ~$671k
    expect(last.totalPropertyEquity).toBeGreaterThan(first.totalPropertyEquity);
    // Check approximate value: 500000 * (1.03)^10 ≈ 671,958
    const expected = Math.round(500000 * Math.pow(1.03, 10));
    // Allow some tolerance due to monthly compounding vs annual
    expect(last.totalPropertyEquity).toBeGreaterThan(expected * 0.95);
    expect(last.totalPropertyEquity).toBeLessThan(expected * 1.05);
  });

  it("depreciating property decreases in value over time", () => {
    const state: FinancialState = {
      ...INITIAL_STATE,
      properties: [
        { id: "p1", name: "Car", value: 30000, mortgage: 0, appreciation: -15 },
      ],
    };
    const result = projectFinances(state, 5, "moderate");
    const first = result.points[0];
    const last = result.points[result.points.length - 1];
    expect(last.totalPropertyEquity).toBeLessThan(first.totalPropertyEquity);
    // After 5 years at -15% annual, car ≈ 30000 * (0.85)^5 ≈ $13,311
    const expected = Math.round(30000 * Math.pow(0.85, 5));
    expect(last.totalPropertyEquity).toBeGreaterThan(expected * 0.9);
    expect(last.totalPropertyEquity).toBeLessThan(expected * 1.1);
  });

  it("property with no appreciation stays static (uses name-based default)", () => {
    const state: FinancialState = {
      ...INITIAL_STATE,
      properties: [
        { id: "p1", name: "Home", value: 500000, mortgage: 0 },
      ],
    };
    const result = projectFinances(state, 5, "moderate");
    const first = result.points[0];
    const last = result.points[result.points.length - 1];
    // "Home" has default appreciation of 3%, so value should increase
    expect(last.totalPropertyEquity).toBeGreaterThan(first.totalPropertyEquity);
  });

  it("property value does not go below zero with extreme depreciation", () => {
    const state: FinancialState = {
      ...INITIAL_STATE,
      properties: [
        { id: "p1", name: "Thing", value: 1000, mortgage: 0, appreciation: -90 },
      ],
    };
    const result = projectFinances(state, 5, "moderate");
    const last = result.points[result.points.length - 1];
    expect(last.totalPropertyEquity).toBeGreaterThanOrEqual(0);
  });
});
