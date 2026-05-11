import { describe, it, expect } from "vitest";
import {
  AU_SAMPLE_PROFILES,
  AU_QUICK_START_PROFILES,
  australianProfiles,
} from "@/lib/countries/australia/sample-profiles";

describe("AU_SAMPLE_PROFILES", () => {
  it("has 3 profiles", () => {
    expect(AU_SAMPLE_PROFILES).toHaveLength(3);
  });

  it("all profiles have country AU", () => {
    for (const profile of AU_SAMPLE_PROFILES) {
      expect(profile.state.country).toBe("AU");
    }
  });

  it("contains fresh-grad-au, mid-career-au, and pre-retirement-au profiles", () => {
    const ids = AU_SAMPLE_PROFILES.map((p) => p.id);
    expect(ids).toContain("fresh-grad-au");
    expect(ids).toContain("mid-career-au");
    expect(ids).toContain("pre-retirement-au");
  });

  it("fresh-grad-au has Super (Accumulation) asset", () => {
    const profile = AU_SAMPLE_PROFILES.find((p) => p.id === "fresh-grad-au")!;
    expect(profile.state.assets.some((a) => a.category === "Super (Accumulation)")).toBe(true);
  });

  it("fresh-grad-au has First Home Super Saver asset", () => {
    const profile = AU_SAMPLE_PROFILES.find((p) => p.id === "fresh-grad-au")!;
    expect(profile.state.assets.some((a) => a.category === "First Home Super Saver")).toBe(true);
  });

  it("mid-career-au has Super (Accumulation) with employer match", () => {
    const profile = AU_SAMPLE_PROFILES.find((p) => p.id === "mid-career-au")!;
    const super_ = profile.state.assets.find((a) => a.category === "Super (Accumulation)");
    expect(super_).toBeDefined();
    expect(super_!.employerMatchPct).toBeGreaterThan(0);
  });

  it("pre-retirement-au has large Super balance", () => {
    const profile = AU_SAMPLE_PROFILES.find((p) => p.id === "pre-retirement-au")!;
    const super_ = profile.state.assets.find((a) => a.category === "Super (Accumulation)");
    expect(super_).toBeDefined();
    expect(super_!.amount).toBeGreaterThan(100_000);
  });

  it("each profile has non-empty income, expenses, and assets", () => {
    for (const profile of AU_SAMPLE_PROFILES) {
      expect(profile.state.income.length).toBeGreaterThan(0);
      expect(profile.state.expenses.length).toBeGreaterThan(0);
      expect(profile.state.assets.length).toBeGreaterThan(0);
    }
  });

  it("all profiles use Australian jurisdictions", () => {
    const auJurisdictions = new Set(["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"]);
    for (const profile of AU_SAMPLE_PROFILES) {
      expect(auJurisdictions.has(profile.state.jurisdiction!)).toBe(true);
    }
  });
});

describe("AU_QUICK_START_PROFILES", () => {
  it("has 2 profiles", () => {
    expect(AU_QUICK_START_PROFILES).toHaveLength(2);
  });

  it("all profiles have country AU", () => {
    for (const profile of AU_QUICK_START_PROFILES) {
      expect(profile.state.country).toBe("AU");
    }
  });

  it("contains au-renter and au-homeowner profiles", () => {
    const ids = AU_QUICK_START_PROFILES.map((p) => p.id);
    expect(ids).toContain("au-renter");
    expect(ids).toContain("au-homeowner");
  });

  it("quick-start profiles have no stocks", () => {
    for (const profile of AU_QUICK_START_PROFILES) {
      expect(profile.state.stocks).toHaveLength(0);
    }
  });

  it("au-homeowner has a property with mortgage", () => {
    const homeowner = AU_QUICK_START_PROFILES.find((p) => p.id === "au-homeowner")!;
    expect(homeowner.state.properties.length).toBeGreaterThan(0);
    expect(homeowner.state.properties[0].mortgage).toBeGreaterThan(0);
  });

  it("au-renter has Super (Accumulation) asset", () => {
    const renter = AU_QUICK_START_PROFILES.find((p) => p.id === "au-renter")!;
    expect(renter.state.assets.some((a) => a.category === "Super (Accumulation)")).toBe(true);
  });
});

describe("australianProfiles (ProfileLibrary)", () => {
  it("samples references AU_SAMPLE_PROFILES", () => {
    expect(australianProfiles.samples).toBe(AU_SAMPLE_PROFILES);
  });

  it("quickStarts references AU_QUICK_START_PROFILES", () => {
    expect(australianProfiles.quickStarts).toBe(AU_QUICK_START_PROFILES);
  });

  it("satisfies ProfileLibrary shape", () => {
    expect(Array.isArray(australianProfiles.samples)).toBe(true);
    expect(Array.isArray(australianProfiles.quickStarts)).toBe(true);
  });
});
