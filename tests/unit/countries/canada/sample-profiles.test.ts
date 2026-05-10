import { describe, it, expect } from "vitest";
import {
  CA_SAMPLE_PROFILES,
  CA_QUICK_START_PROFILES,
  canadaProfiles,
} from "@/lib/countries/canada/sample-profiles";

describe("CA_SAMPLE_PROFILES", () => {
  it("has 3 profiles", () => {
    expect(CA_SAMPLE_PROFILES).toHaveLength(3);
  });

  it("all profiles have country CA", () => {
    for (const profile of CA_SAMPLE_PROFILES) {
      expect(profile.state.country).toBe("CA");
    }
  });

  it("contains fresh-grad, mid-career, and pre-retirement profiles", () => {
    const ids = CA_SAMPLE_PROFILES.map((p) => p.id);
    expect(ids).toContain("fresh-grad");
    expect(ids).toContain("mid-career");
    expect(ids).toContain("pre-retirement");
  });

  it("fresh-grad has TFSA asset", () => {
    const profile = CA_SAMPLE_PROFILES.find((p) => p.id === "fresh-grad")!;
    expect(profile.state.assets.some((a) => a.category === "TFSA")).toBe(true);
  });

  it("mid-career has RRSP and RESP", () => {
    const profile = CA_SAMPLE_PROFILES.find((p) => p.id === "mid-career")!;
    const cats = profile.state.assets.map((a) => a.category);
    expect(cats).toContain("RRSP");
    expect(cats).toContain("RESP");
  });

  it("pre-retirement has large RRSP balance", () => {
    const profile = CA_SAMPLE_PROFILES.find((p) => p.id === "pre-retirement")!;
    const rrsp = profile.state.assets.find((a) => a.category === "RRSP");
    expect(rrsp).toBeDefined();
    expect(rrsp!.amount).toBeGreaterThan(100_000);
  });

  it("each profile has non-empty income, expenses, and assets", () => {
    for (const profile of CA_SAMPLE_PROFILES) {
      expect(profile.state.income.length).toBeGreaterThan(0);
      expect(profile.state.expenses.length).toBeGreaterThan(0);
      expect(profile.state.assets.length).toBeGreaterThan(0);
    }
  });
});

describe("CA_QUICK_START_PROFILES", () => {
  it("has 2 profiles", () => {
    expect(CA_QUICK_START_PROFILES).toHaveLength(2);
  });

  it("all profiles have country CA", () => {
    for (const profile of CA_QUICK_START_PROFILES) {
      expect(profile.state.country).toBe("CA");
    }
  });

  it("contains ca-renter and ca-homeowner profiles", () => {
    const ids = CA_QUICK_START_PROFILES.map((p) => p.id);
    expect(ids).toContain("ca-renter");
    expect(ids).toContain("ca-homeowner");
  });

  it("quick-start profiles have no stocks", () => {
    for (const profile of CA_QUICK_START_PROFILES) {
      expect(profile.state.stocks).toHaveLength(0);
    }
  });

  it("ca-homeowner has a property with mortgage", () => {
    const homeowner = CA_QUICK_START_PROFILES.find((p) => p.id === "ca-homeowner")!;
    expect(homeowner.state.properties.length).toBeGreaterThan(0);
    expect(homeowner.state.properties[0].mortgage).toBeGreaterThan(0);
  });
});

describe("canadaProfiles (ProfileLibrary)", () => {
  it("samples references CA_SAMPLE_PROFILES", () => {
    expect(canadaProfiles.samples).toBe(CA_SAMPLE_PROFILES);
  });

  it("quickStarts references CA_QUICK_START_PROFILES", () => {
    expect(canadaProfiles.quickStarts).toBe(CA_QUICK_START_PROFILES);
  });

  it("satisfies ProfileLibrary shape", () => {
    expect(Array.isArray(canadaProfiles.samples)).toBe(true);
    expect(Array.isArray(canadaProfiles.quickStarts)).toBe(true);
  });
});
