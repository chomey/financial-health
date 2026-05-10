import { describe, it, expect } from "vitest";
import {
  US_SAMPLE_PROFILES,
  US_QUICK_START_PROFILES,
  usaProfiles,
} from "@/lib/countries/usa/sample-profiles";

describe("US_SAMPLE_PROFILES", () => {
  it("has 3 profiles", () => {
    expect(US_SAMPLE_PROFILES).toHaveLength(3);
  });

  it("all profiles have country US", () => {
    for (const profile of US_SAMPLE_PROFILES) {
      expect(profile.state.country).toBe("US");
    }
  });

  it("contains fresh-grad-us, mid-career-us, and pre-retirement-us profiles", () => {
    const ids = US_SAMPLE_PROFILES.map((p) => p.id);
    expect(ids).toContain("fresh-grad-us");
    expect(ids).toContain("mid-career-us");
    expect(ids).toContain("pre-retirement-us");
  });

  it("fresh-grad-us has Roth IRA asset", () => {
    const profile = US_SAMPLE_PROFILES.find((p) => p.id === "fresh-grad-us")!;
    expect(profile.state.assets.some((a) => a.category === "Roth IRA")).toBe(true);
  });

  it("mid-career-us has 401k and HSA", () => {
    const profile = US_SAMPLE_PROFILES.find((p) => p.id === "mid-career-us")!;
    const cats = profile.state.assets.map((a) => a.category);
    expect(cats).toContain("401k");
    expect(cats).toContain("HSA");
  });

  it("pre-retirement-us has large 401k balance", () => {
    const profile = US_SAMPLE_PROFILES.find((p) => p.id === "pre-retirement-us")!;
    const account = profile.state.assets.find((a) => a.category === "401k");
    expect(account).toBeDefined();
    expect(account!.amount).toBeGreaterThan(100_000);
  });

  it("each profile has non-empty income, expenses, and assets", () => {
    for (const profile of US_SAMPLE_PROFILES) {
      expect(profile.state.income.length).toBeGreaterThan(0);
      expect(profile.state.expenses.length).toBeGreaterThan(0);
      expect(profile.state.assets.length).toBeGreaterThan(0);
    }
  });
});

describe("US_QUICK_START_PROFILES", () => {
  it("has 2 profiles", () => {
    expect(US_QUICK_START_PROFILES).toHaveLength(2);
  });

  it("all profiles have country US", () => {
    for (const profile of US_QUICK_START_PROFILES) {
      expect(profile.state.country).toBe("US");
    }
  });

  it("contains us-renter and us-homeowner profiles", () => {
    const ids = US_QUICK_START_PROFILES.map((p) => p.id);
    expect(ids).toContain("us-renter");
    expect(ids).toContain("us-homeowner");
  });

  it("quick-start profiles have no stocks", () => {
    for (const profile of US_QUICK_START_PROFILES) {
      expect(profile.state.stocks).toHaveLength(0);
    }
  });

  it("us-homeowner has a property with mortgage", () => {
    const homeowner = US_QUICK_START_PROFILES.find((p) => p.id === "us-homeowner")!;
    expect(homeowner.state.properties.length).toBeGreaterThan(0);
    expect(homeowner.state.properties[0].mortgage).toBeGreaterThan(0);
  });
});

describe("usaProfiles (ProfileLibrary)", () => {
  it("samples references US_SAMPLE_PROFILES", () => {
    expect(usaProfiles.samples).toBe(US_SAMPLE_PROFILES);
  });

  it("quickStarts references US_QUICK_START_PROFILES", () => {
    expect(usaProfiles.quickStarts).toBe(US_QUICK_START_PROFILES);
  });

  it("satisfies ProfileLibrary shape", () => {
    expect(Array.isArray(usaProfiles.samples)).toBe(true);
    expect(Array.isArray(usaProfiles.quickStarts)).toBe(true);
  });
});
