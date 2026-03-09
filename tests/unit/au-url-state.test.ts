/**
 * Task 173: AU URL state round-trip tests (T1)
 *
 * Verifies that AU sample profiles serialize/deserialize correctly
 * through the URL state encoding system, ensuring super accounts,
 * debts, properties, and stocks round-trip accurately.
 */
import { describe, it, expect } from "vitest";
import { encodeState, decodeState } from "@/lib/url-state";
import { AU_SAMPLE_PROFILES } from "@/lib/sample-profiles";

describe("AU URL state round-trip", () => {
  it.each(AU_SAMPLE_PROFILES)(
    "$id encodes and decodes: country preserved as AU",
    (profile) => {
      const encoded = encodeState(profile.state);
      expect(encoded).toBeTruthy();
      const decoded = decodeState(encoded);
      expect(decoded).not.toBeNull();
      expect(decoded!.country).toBe("AU");
    }
  );

  it("AU young professional: super account preserved through URL state", () => {
    const profile = AU_SAMPLE_PROFILES.find(
      (p) => p.id === "au-young-professional"
    )!;
    const decoded = decodeState(encodeState(profile.state));
    const superAsset = decoded!.assets.find(
      (a) => a.category === "Super (Accumulation)"
    );
    expect(superAsset).toBeDefined();
    expect(superAsset!.amount).toBe(15000);
    expect(superAsset!.roi).toBe(7);
  });

  it("AU young professional: HECS-HELP debt preserved", () => {
    const profile = AU_SAMPLE_PROFILES.find(
      (p) => p.id === "au-young-professional"
    )!;
    const decoded = decodeState(encodeState(profile.state));
    expect(decoded!.debts).toHaveLength(1);
    expect(decoded!.debts[0].category).toBe("HECS-HELP");
    expect(decoded!.debts[0].amount).toBe(35000);
    expect(decoded!.debts[0].interestRate).toBe(3.8);
  });

  it("AU mid-career family: all 3 assets preserved", () => {
    const profile = AU_SAMPLE_PROFILES.find(
      (p) => p.id === "au-mid-career-family"
    )!;
    const decoded = decodeState(encodeState(profile.state));
    expect(decoded!.assets).toHaveLength(3);
    const superAsset = decoded!.assets.find(
      (a) => a.category === "Super (Accumulation)"
    );
    expect(superAsset).toBeDefined();
    expect(superAsset!.amount).toBe(90000);
  });

  it("AU mid-career family: property preserved with correct value", () => {
    const profile = AU_SAMPLE_PROFILES.find(
      (p) => p.id === "au-mid-career-family"
    )!;
    const decoded = decodeState(encodeState(profile.state));
    expect(decoded!.properties).toHaveLength(1);
    expect(decoded!.properties[0].value).toBe(950000);
    expect(decoded!.properties[0].mortgage).toBe(620000);
  });

  it("AU pre-retiree: both properties preserved", () => {
    const profile = AU_SAMPLE_PROFILES.find(
      (p) => p.id === "au-pre-retiree"
    )!;
    const decoded = decodeState(encodeState(profile.state));
    expect(decoded!.properties).toHaveLength(2);
    expect(decoded!.properties[0].value).toBe(850000);
    expect(decoded!.properties[1].value).toBe(650000);
    expect(decoded!.properties[1].mortgage).toBe(280000);
  });

  it("AU pre-retiree: large super account preserved ($420k)", () => {
    const profile = AU_SAMPLE_PROFILES.find(
      (p) => p.id === "au-pre-retiree"
    )!;
    const decoded = decodeState(encodeState(profile.state));
    const superAsset = decoded!.assets.find(
      (a) => a.category === "Super (Accumulation)"
    );
    expect(superAsset).toBeDefined();
    expect(superAsset!.amount).toBe(420000);
  });

  it("AU pre-retiree: ASX stocks preserved", () => {
    const profile = AU_SAMPLE_PROFILES.find(
      (p) => p.id === "au-pre-retiree"
    )!;
    const decoded = decodeState(encodeState(profile.state));
    expect(decoded!.stocks).toHaveLength(4);
    expect(decoded!.stocks.some((s) => s.ticker === "CBA.AX")).toBe(true);
    expect(decoded!.stocks.some((s) => s.ticker === "VAS.AX")).toBe(true);
    expect(decoded!.stocks.some((s) => s.ticker === "BHP.AX")).toBe(true);
  });

  it("AU young professional: ASX ETF stocks preserved", () => {
    const profile = AU_SAMPLE_PROFILES.find(
      (p) => p.id === "au-young-professional"
    )!;
    const decoded = decodeState(encodeState(profile.state));
    expect(decoded!.stocks).toHaveLength(2);
    expect(decoded!.stocks.some((s) => s.ticker === "VAS.AX")).toBe(true);
    expect(decoded!.stocks.some((s) => s.ticker === "VGS.AX")).toBe(true);
  });

  it("all 3 AU profiles encode to URL-safe length < 2000 chars", () => {
    for (const profile of AU_SAMPLE_PROFILES) {
      const encoded = encodeState(profile.state);
      expect(encoded.length).toBeLessThan(2000);
    }
  });

  it("AU profile encoded state does not contain plaintext sensitive data", () => {
    for (const profile of AU_SAMPLE_PROFILES) {
      const encoded = encodeState(profile.state);
      expect(encoded).not.toContain("Super (Accumulation)");
      expect(encoded).not.toContain("HECS-HELP");
    }
  });
});
