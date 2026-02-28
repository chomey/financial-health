import { describe, it, expect } from "vitest";
import {
  encodeState,
  decodeState,
  toCompact,
  fromCompact,
} from "@/lib/url-state";
import { INITIAL_STATE } from "@/lib/financial-state";

describe("Deterministic IDs prevent hydration mismatch", () => {
  it("fromCompact generates type-prefixed IDs (a1, d1, i1, e1, p1)", () => {
    const compact = toCompact(INITIAL_STATE);
    const restored = fromCompact(compact);

    // Assets should have a-prefixed IDs
    expect(restored.assets[0].id).toBe("a1");
    expect(restored.assets[1].id).toBe("a2");
    expect(restored.assets[2].id).toBe("a3");

    // Debts should have d-prefixed IDs
    expect(restored.debts[0].id).toBe("d1");

    // Income should have i-prefixed IDs
    expect(restored.income[0].id).toBe("i1");

    // Expenses should have e-prefixed IDs
    expect(restored.expenses[0].id).toBe("e1");
    expect(restored.expenses[1].id).toBe("e2");
    expect(restored.expenses[2].id).toBe("e3");
  });

  it("INITIAL_STATE IDs match fromCompact output after roundtrip", () => {
    const compact = toCompact(INITIAL_STATE);
    const restored = fromCompact(compact);

    // Verify each type's IDs match between INITIAL_STATE and roundtripped state
    INITIAL_STATE.assets.forEach((asset, i) => {
      expect(restored.assets[i].id).toBe(asset.id);
    });
    INITIAL_STATE.debts.forEach((debt, i) => {
      expect(restored.debts[i].id).toBe(debt.id);
    });
    INITIAL_STATE.income.forEach((inc, i) => {
      expect(restored.income[i].id).toBe(inc.id);
    });
    INITIAL_STATE.expenses.forEach((exp, i) => {
      expect(restored.expenses[i].id).toBe(exp.id);
    });
    INITIAL_STATE.properties.forEach((prop, i) => {
      expect(restored.properties[i].id).toBe(prop.id);
    });
  });

  it("encode→decode roundtrip preserves deterministic IDs", () => {
    const encoded = encodeState(INITIAL_STATE);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();

    // All IDs should match INITIAL_STATE after roundtrip
    expect(decoded!.assets.map((a) => a.id)).toEqual(
      INITIAL_STATE.assets.map((a) => a.id)
    );
    expect(decoded!.debts.map((d) => d.id)).toEqual(
      INITIAL_STATE.debts.map((d) => d.id)
    );
    expect(decoded!.properties.map((p) => p.id)).toEqual(
      INITIAL_STATE.properties.map((p) => p.id)
    );
  });

  it("fromCompact generates unique IDs across repeated calls", () => {
    const compact = toCompact(INITIAL_STATE);
    const restored1 = fromCompact(compact);
    const restored2 = fromCompact(compact);

    // Same input should always produce the same IDs (deterministic)
    expect(restored1.assets[0].id).toBe(restored2.assets[0].id);
    expect(restored1.debts[0].id).toBe(restored2.debts[0].id);
  });
});
