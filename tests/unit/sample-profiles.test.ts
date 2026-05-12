import { describe, it, expect } from "vitest";
import { getProfilesForCountry, getQuickStartProfilesForCountry } from "@/lib/sample-profiles";

describe("getProfilesForCountry - CA", () => {
  const profiles = getProfilesForCountry("CA");

  it("has 3 CA profiles", () => {
    expect(profiles).toHaveLength(3);
  });

  it("each profile has required fields", () => {
    for (const profile of profiles) {
      expect(profile.id).toBeTruthy();
      expect(profile.name).toBeTruthy();
      expect(profile.emoji).toBeTruthy();
      expect(profile.description).toBeTruthy();
      expect(profile.highlights.length).toBeGreaterThan(0);
      expect(profile.state).toBeDefined();
    }
  });

  it("each profile state has all required FinancialState fields", () => {
    for (const profile of profiles) {
      const s = profile.state;
      expect(Array.isArray(s.income)).toBe(true);
      expect(Array.isArray(s.expenses)).toBe(true);
      expect(Array.isArray(s.assets)).toBe(true);
      expect(Array.isArray(s.debts)).toBe(true);
      expect(Array.isArray(s.properties)).toBe(true);
      expect(Array.isArray(s.stocks)).toBe(true);
    }
  });

  it("all CA profiles have country=CA", () => {
    for (const profile of profiles) {
      expect(profile.state.country).toBe("CA");
    }
  });

  it("fresh-grad profile has age 25, student loan, TFSA", () => {
    const p = profiles.find((p) => p.id === "fresh-grad")!;
    expect(p.state.age).toBe(25);
    expect(p.state.debts.some((d) => d.category === "Student Loan")).toBe(true);
    expect(p.state.assets.some((a) => a.category === "TFSA")).toBe(true);
    expect(p.state.properties).toHaveLength(0);
  });

  it("fresh-grad has positive income and expenses", () => {
    const p = profiles.find((p) => p.id === "fresh-grad")!;
    const totalIncome = p.state.income.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = p.state.expenses.reduce((sum, e) => sum + e.amount, 0);
    expect(totalIncome).toBeGreaterThan(0);
    expect(totalExpenses).toBeGreaterThan(0);
  });

  it("mid-career profile has age 38, mortgage property, RRSP", () => {
    const p = profiles.find((p) => p.id === "mid-career")!;
    expect(p.state.age).toBe(38);
    expect(p.state.properties).toHaveLength(1);
    expect(p.state.properties[0].mortgage).toBeGreaterThan(0);
    expect(p.state.assets.some((a) => a.category === "RRSP")).toBe(true);
  });

  it("pre-retirement profile has age 58, large RRSP, small mortgage", () => {
    const p = profiles.find((p) => p.id === "pre-retirement")!;
    expect(p.state.age).toBe(58);
    const rrsp = p.state.assets.find((a) => a.category === "RRSP")!;
    expect(rrsp.amount).toBeGreaterThan(100000);
    expect(p.state.properties[0].mortgage).toBeLessThan(100000);
  });

  it("profiles have unique IDs", () => {
    const ids = profiles.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all asset IDs within each profile are unique", () => {
    for (const profile of profiles) {
      const assetIds = profile.state.assets.map((a) => a.id);
      expect(new Set(assetIds).size).toBe(assetIds.length);
    }
  });
});

describe("getProfilesForCountry - US", () => {
  const profiles = getProfilesForCountry("US");

  it("has 3 US profiles", () => {
    expect(profiles).toHaveLength(3);
  });

  it("all US profiles have country=US", () => {
    for (const profile of profiles) {
      expect(profile.state.country).toBe("US");
    }
  });

  it("fresh-grad-us has Roth IRA, not TFSA", () => {
    const p = profiles.find((p) => p.id === "fresh-grad-us")!;
    expect(p.state.assets.some((a) => a.category === "Roth IRA")).toBe(true);
    expect(p.state.assets.some((a) => a.category === "TFSA")).toBe(false);
  });

  it("mid-career-us has 401k", () => {
    const p = profiles.find((p) => p.id === "mid-career-us")!;
    expect(p.state.assets.some((a) => a.category === "401k")).toBe(true);
  });
});

describe("getProfilesForCountry - AU", () => {
  const profiles = getProfilesForCountry("AU");

  it("has 3 AU profiles", () => {
    expect(profiles).toHaveLength(3);
  });

  it("all AU profiles have country=AU", () => {
    for (const profile of profiles) {
      expect(profile.state.country).toBe("AU");
    }
  });

  it("each AU profile has required fields", () => {
    for (const profile of profiles) {
      expect(profile.id).toBeTruthy();
      expect(profile.name).toBeTruthy();
      expect(profile.emoji).toBeTruthy();
      expect(profile.description).toBeTruthy();
      expect(profile.highlights.length).toBeGreaterThan(0);
      expect(profile.state).toBeDefined();
    }
  });

  it("each AU profile state has all required FinancialState arrays", () => {
    for (const profile of profiles) {
      const s = profile.state;
      expect(Array.isArray(s.income)).toBe(true);
      expect(Array.isArray(s.expenses)).toBe(true);
      expect(Array.isArray(s.assets)).toBe(true);
      expect(Array.isArray(s.debts)).toBe(true);
      expect(Array.isArray(s.properties)).toBe(true);
      expect(Array.isArray(s.stocks)).toBe(true);
    }
  });

  it("AU profiles have unique IDs", () => {
    const ids = profiles.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("fresh-grad-au has Super (Accumulation), student debt, no properties, VAS.AX stock", () => {
    const p = profiles.find((p) => p.id === "fresh-grad-au")!;
    expect(p.state.age).toBe(25);
    expect(p.state.jurisdiction).toBe("NSW");
    expect(p.state.assets.some((a) => a.category === "Super (Accumulation)")).toBe(true);
    expect(p.state.debts.length).toBeGreaterThan(0);
    expect(p.state.properties).toHaveLength(0);
    expect(p.state.stocks.some((s) => s.ticker === "VAS.AX")).toBe(true);
  });

  it("fresh-grad-au income and expenses are positive", () => {
    const p = profiles.find((p) => p.id === "fresh-grad-au")!;
    const totalIncome = p.state.income.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = p.state.expenses.reduce((sum, e) => sum + e.amount, 0);
    expect(totalIncome).toBeGreaterThan(0);
    expect(totalExpenses).toBeGreaterThan(0);
  });

  it("mid-career-au has Super, mortgage, VIC jurisdiction", () => {
    const p = profiles.find((p) => p.id === "mid-career-au")!;
    expect(p.state.age).toBe(38);
    expect(p.state.jurisdiction).toBe("VIC");
    expect(p.state.assets.some((a) => a.category === "Super (Accumulation)")).toBe(true);
    expect(p.state.properties).toHaveLength(1);
    expect(p.state.properties[0].mortgage).toBeGreaterThan(0);
    expect(p.state.stocks.some((s) => s.ticker === "VAS.AX")).toBe(true);
  });

  it("pre-retirement-au has large Super, property, ASX blue chips", () => {
    const p = profiles.find((p) => p.id === "pre-retirement-au")!;
    expect(p.state.age).toBe(58);
    expect(p.state.jurisdiction).toBe("QLD");
    const super_ = p.state.assets.find((a) => a.category === "Super (Accumulation)")!;
    expect(super_.amount).toBeGreaterThan(100000);
    expect(p.state.properties.length).toBeGreaterThan(0);
    expect(p.state.stocks.some((s) => s.ticker === "VAS.AX")).toBe(true);
    expect(p.state.stocks.some((s) => s.ticker === "CBA.AX")).toBe(true);
  });

  it("AU profiles all have ASX tickers (.AX suffix)", () => {
    for (const profile of profiles) {
      for (const stock of profile.state.stocks) {
        expect(stock.ticker).toMatch(/\.AX$/);
      }
    }
  });
});

describe("getProfilesForCountry - routing", () => {
  it("returns CA profiles for CA", () => {
    const profiles = getProfilesForCountry("CA");
    expect(profiles.length).toBeGreaterThan(0);
    expect(profiles[0].state.country).toBe("CA");
  });

  it("returns US profiles for US", () => {
    const profiles = getProfilesForCountry("US");
    expect(profiles.length).toBeGreaterThan(0);
    expect(profiles[0].state.country).toBe("US");
  });

  it("returns AU profiles for AU", () => {
    const profiles = getProfilesForCountry("AU");
    expect(profiles.length).toBeGreaterThan(0);
    expect(profiles[0].state.country).toBe("AU");
  });

  it("returns 3 profiles for each country", () => {
    expect(getProfilesForCountry("CA")).toHaveLength(3);
    expect(getProfilesForCountry("US")).toHaveLength(3);
    expect(getProfilesForCountry("AU")).toHaveLength(3);
  });
});

describe("getQuickStartProfilesForCountry", () => {
  it("returns CA quick-start profiles", () => {
    const profiles = getQuickStartProfilesForCountry("CA");
    expect(profiles.length).toBeGreaterThan(0);
    for (const p of profiles) expect(p.state.country).toBe("CA");
  });

  it("returns US quick-start profiles", () => {
    const profiles = getQuickStartProfilesForCountry("US");
    expect(profiles.length).toBeGreaterThan(0);
    for (const p of profiles) expect(p.state.country).toBe("US");
  });

  it("returns AU quick-start profiles", () => {
    const profiles = getQuickStartProfilesForCountry("AU");
    expect(profiles.length).toBeGreaterThan(0);
    for (const p of profiles) expect(p.state.country).toBe("AU");
  });

  it("quick-start profiles have no stocks", () => {
    for (const country of ["CA", "US", "AU"] as const) {
      for (const p of getQuickStartProfilesForCountry(country)) {
        expect(p.state.stocks).toHaveLength(0);
      }
    }
  });
});
