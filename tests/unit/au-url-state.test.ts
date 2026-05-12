/**
 * Task 173: AU URL state round-trip tests (T1)
 *
 * Verifies that AU sample profiles serialize/deserialize correctly
 * through the URL state encoding system, ensuring super accounts,
 * debts, properties, and stocks round-trip accurately.
 */
import { describe, it, expect } from "vitest";
import { encodeState, decodeState } from "@/lib/url-state";
import { getProfilesForCountry } from "@/lib/sample-profiles";

const AU_PROFILES = getProfilesForCountry("AU");

describe("AU URL state round-trip", () => {
  it.each(AU_PROFILES)(
    "$id encodes and decodes: country preserved as AU",
    (profile) => {
      const encoded = encodeState(profile.state);
      expect(encoded).toBeTruthy();
      const decoded = decodeState(encoded);
      expect(decoded).not.toBeNull();
      expect(decoded!.country).toBe("AU");
    }
  );

  it("AU fresh-grad: super account preserved through URL state", () => {
    const profile = AU_PROFILES.find(
      (p) => p.id === "fresh-grad-au"
    )!;
    const decoded = decodeState(encodeState(profile.state));
    const superAsset = decoded!.assets.find(
      (a) => a.category === "Super (Accumulation)"
    );
    expect(superAsset).toBeDefined();
    expect(superAsset!.amount).toBe(4000);
    expect(superAsset!.roi).toBe(7);
  });

  it("AU fresh-grad: student debt preserved", () => {
    const profile = AU_PROFILES.find(
      (p) => p.id === "fresh-grad-au"
    )!;
    const decoded = decodeState(encodeState(profile.state));
    expect(decoded!.debts).toHaveLength(1);
    expect(decoded!.debts[0].amount).toBe(24000);
    expect(decoded!.debts[0].interestRate).toBe(3.4);
  });

  it("AU mid-career: all 2 assets preserved", () => {
    const profile = AU_PROFILES.find(
      (p) => p.id === "mid-career-au"
    )!;
    const decoded = decodeState(encodeState(profile.state));
    expect(decoded!.assets).toHaveLength(2);
    const superAsset = decoded!.assets.find(
      (a) => a.category === "Super (Accumulation)"
    );
    expect(superAsset).toBeDefined();
    expect(superAsset!.amount).toBe(85000);
  });

  it("AU mid-career: property preserved with correct value", () => {
    const profile = AU_PROFILES.find(
      (p) => p.id === "mid-career-au"
    )!;
    const decoded = decodeState(encodeState(profile.state));
    expect(decoded!.properties).toHaveLength(1);
    expect(decoded!.properties[0].value).toBe(850000);
    expect(decoded!.properties[0].mortgage).toBe(570000);
  });

  it("AU pre-retirement: property preserved", () => {
    const profile = AU_PROFILES.find(
      (p) => p.id === "pre-retirement-au"
    )!;
    const decoded = decodeState(encodeState(profile.state));
    expect(decoded!.properties).toHaveLength(1);
    expect(decoded!.properties[0].value).toBe(850000);
    expect(decoded!.properties[0].mortgage).toBe(40000);
  });

  it("AU pre-retirement: large super account preserved ($380k)", () => {
    const profile = AU_PROFILES.find(
      (p) => p.id === "pre-retirement-au"
    )!;
    const decoded = decodeState(encodeState(profile.state));
    const superAsset = decoded!.assets.find(
      (a) => a.category === "Super (Accumulation)"
    );
    expect(superAsset).toBeDefined();
    expect(superAsset!.amount).toBe(380000);
  });

  it("AU pre-retirement: ASX stocks preserved", () => {
    const profile = AU_PROFILES.find(
      (p) => p.id === "pre-retirement-au"
    )!;
    const decoded = decodeState(encodeState(profile.state));
    expect(decoded!.stocks).toHaveLength(4);
    expect(decoded!.stocks.some((s) => s.ticker === "CBA.AX")).toBe(true);
    expect(decoded!.stocks.some((s) => s.ticker === "VAS.AX")).toBe(true);
    expect(decoded!.stocks.some((s) => s.ticker === "A200.AX")).toBe(true);
  });

  it("AU fresh-grad: ASX ETF stock preserved", () => {
    const profile = AU_PROFILES.find(
      (p) => p.id === "fresh-grad-au"
    )!;
    const decoded = decodeState(encodeState(profile.state));
    expect(decoded!.stocks).toHaveLength(1);
    expect(decoded!.stocks.some((s) => s.ticker === "VAS.AX")).toBe(true);
  });

  it("all 3 AU profiles encode to URL-safe length < 2000 chars", () => {
    for (const profile of AU_PROFILES) {
      const encoded = encodeState(profile.state);
      expect(encoded.length).toBeLessThan(2000);
    }
  });

  it("AU profile encoded state does not contain plaintext sensitive data", () => {
    for (const profile of AU_PROFILES) {
      const encoded = encodeState(profile.state);
      expect(encoded).not.toContain("Super (Accumulation)");
    }
  });
});
