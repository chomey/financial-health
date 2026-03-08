import { describe, it, expect } from "vitest";
import { SAMPLE_PROFILES, US_SAMPLE_PROFILES, AU_SAMPLE_PROFILES, getProfilesForCountry } from "@/lib/sample-profiles";

describe("SAMPLE_PROFILES (CA)", () => {
  it("has 3 CA profiles", () => {
    expect(SAMPLE_PROFILES).toHaveLength(3);
  });

  it("each profile has required fields", () => {
    for (const profile of SAMPLE_PROFILES) {
      expect(profile.id).toBeTruthy();
      expect(profile.name).toBeTruthy();
      expect(profile.emoji).toBeTruthy();
      expect(profile.description).toBeTruthy();
      expect(profile.highlights.length).toBeGreaterThan(0);
      expect(profile.state).toBeDefined();
    }
  });

  it("each profile state has all required FinancialState fields", () => {
    for (const profile of SAMPLE_PROFILES) {
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
    for (const profile of SAMPLE_PROFILES) {
      expect(profile.state.country).toBe("CA");
    }
  });

  it("fresh-grad profile has age 25, student loan, TFSA", () => {
    const p = SAMPLE_PROFILES.find((p) => p.id === "fresh-grad")!;
    expect(p.state.age).toBe(25);
    expect(p.state.debts.some((d) => d.category === "Student Loan")).toBe(true);
    expect(p.state.assets.some((a) => a.category === "TFSA")).toBe(true);
    expect(p.state.properties).toHaveLength(0);
  });

  it("fresh-grad has positive income and expenses", () => {
    const p = SAMPLE_PROFILES.find((p) => p.id === "fresh-grad")!;
    const totalIncome = p.state.income.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = p.state.expenses.reduce((sum, e) => sum + e.amount, 0);
    expect(totalIncome).toBeGreaterThan(0);
    expect(totalExpenses).toBeGreaterThan(0);
  });

  it("mid-career profile has age 38, mortgage property, RRSP", () => {
    const p = SAMPLE_PROFILES.find((p) => p.id === "mid-career")!;
    expect(p.state.age).toBe(38);
    expect(p.state.properties).toHaveLength(1);
    expect(p.state.properties[0].mortgage).toBeGreaterThan(0);
    expect(p.state.assets.some((a) => a.category === "RRSP")).toBe(true);
  });

  it("pre-retirement profile has age 58, large RRSP, small mortgage", () => {
    const p = SAMPLE_PROFILES.find((p) => p.id === "pre-retirement")!;
    expect(p.state.age).toBe(58);
    const rrsp = p.state.assets.find((a) => a.category === "RRSP")!;
    expect(rrsp.amount).toBeGreaterThan(100000);
    expect(p.state.properties[0].mortgage).toBeLessThan(100000);
  });

  it("profiles have unique IDs", () => {
    const ids = SAMPLE_PROFILES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all asset IDs within each profile are unique", () => {
    for (const profile of SAMPLE_PROFILES) {
      const assetIds = profile.state.assets.map((a) => a.id);
      expect(new Set(assetIds).size).toBe(assetIds.length);
    }
  });
});

describe("US_SAMPLE_PROFILES", () => {
  it("has 3 US profiles", () => {
    expect(US_SAMPLE_PROFILES).toHaveLength(3);
  });

  it("all US profiles have country=US", () => {
    for (const profile of US_SAMPLE_PROFILES) {
      expect(profile.state.country).toBe("US");
    }
  });

  it("fresh-grad-us has Roth IRA, not TFSA", () => {
    const p = US_SAMPLE_PROFILES.find((p) => p.id === "fresh-grad-us")!;
    expect(p.state.assets.some((a) => a.category === "Roth IRA")).toBe(true);
    expect(p.state.assets.some((a) => a.category === "TFSA")).toBe(false);
  });

  it("mid-career-us has 401k", () => {
    const p = US_SAMPLE_PROFILES.find((p) => p.id === "mid-career-us")!;
    expect(p.state.assets.some((a) => a.category === "401k")).toBe(true);
  });
});

describe("AU_SAMPLE_PROFILES", () => {
  it("has 3 AU profiles", () => {
    expect(AU_SAMPLE_PROFILES).toHaveLength(3);
  });

  it("all AU profiles have country=AU", () => {
    for (const profile of AU_SAMPLE_PROFILES) {
      expect(profile.state.country).toBe("AU");
    }
  });

  it("each AU profile has required fields", () => {
    for (const profile of AU_SAMPLE_PROFILES) {
      expect(profile.id).toBeTruthy();
      expect(profile.name).toBeTruthy();
      expect(profile.emoji).toBeTruthy();
      expect(profile.description).toBeTruthy();
      expect(profile.highlights.length).toBeGreaterThan(0);
      expect(profile.state).toBeDefined();
    }
  });

  it("each AU profile state has all required FinancialState arrays", () => {
    for (const profile of AU_SAMPLE_PROFILES) {
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
    const ids = AU_SAMPLE_PROFILES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("au-young-professional has Super (Accumulation) and HECS-HELP", () => {
    const p = AU_SAMPLE_PROFILES.find((p) => p.id === "au-young-professional")!;
    expect(p.state.age).toBe(25);
    expect(p.state.jurisdiction).toBe("NSW");
    expect(p.state.assets.some((a) => a.category === "Super (Accumulation)")).toBe(true);
    expect(p.state.debts.some((d) => d.category === "HECS-HELP")).toBe(true);
    expect(p.state.properties).toHaveLength(0);
    expect(p.state.stocks.some((s) => s.ticker === "VAS.AX")).toBe(true);
  });

  it("au-young-professional income and expenses are positive", () => {
    const p = AU_SAMPLE_PROFILES.find((p) => p.id === "au-young-professional")!;
    const totalIncome = p.state.income.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = p.state.expenses.reduce((sum, e) => sum + e.amount, 0);
    expect(totalIncome).toBeGreaterThan(0);
    expect(totalExpenses).toBeGreaterThan(0);
  });

  it("au-mid-career-family has Super, mortgage, VIC jurisdiction", () => {
    const p = AU_SAMPLE_PROFILES.find((p) => p.id === "au-mid-career-family")!;
    expect(p.state.age).toBe(40);
    expect(p.state.jurisdiction).toBe("VIC");
    expect(p.state.assets.some((a) => a.category === "Super (Accumulation)")).toBe(true);
    expect(p.state.properties).toHaveLength(1);
    expect(p.state.properties[0].mortgage).toBeGreaterThan(0);
    expect(p.state.stocks.some((s) => s.ticker === "A200.AX")).toBe(true);
  });

  it("au-pre-retiree has large Super, two properties, ASX blue chips", () => {
    const p = AU_SAMPLE_PROFILES.find((p) => p.id === "au-pre-retiree")!;
    expect(p.state.age).toBe(58);
    expect(p.state.jurisdiction).toBe("QLD");
    const super_ = p.state.assets.find((a) => a.category === "Super (Accumulation)")!;
    expect(super_.amount).toBeGreaterThan(100000);
    expect(p.state.properties).toHaveLength(2);
    expect(p.state.stocks.some((s) => s.ticker === "CBA.AX")).toBe(true);
    expect(p.state.stocks.some((s) => s.ticker === "BHP.AX")).toBe(true);
  });

  it("au-pre-retiree primary home is paid off", () => {
    const p = AU_SAMPLE_PROFILES.find((p) => p.id === "au-pre-retiree")!;
    const primaryHome = p.state.properties.find((p) => p.name === "Primary Home")!;
    expect(primaryHome.mortgage).toBe(0);
  });

  it("AU profiles all have ASX tickers (.AX suffix)", () => {
    for (const profile of AU_SAMPLE_PROFILES) {
      for (const stock of profile.state.stocks) {
        expect(stock.ticker).toMatch(/\.AX$/);
      }
    }
  });
});

describe("getProfilesForCountry", () => {
  it("returns CA profiles for CA", () => {
    const profiles = getProfilesForCountry("CA");
    expect(profiles).toBe(SAMPLE_PROFILES);
    expect(profiles[0].state.country).toBe("CA");
  });

  it("returns US profiles for US", () => {
    const profiles = getProfilesForCountry("US");
    expect(profiles).toBe(US_SAMPLE_PROFILES);
    expect(profiles[0].state.country).toBe("US");
  });

  it("returns AU profiles for AU", () => {
    const profiles = getProfilesForCountry("AU");
    expect(profiles).toBe(AU_SAMPLE_PROFILES);
    expect(profiles[0].state.country).toBe("AU");
  });

  it("returns 3 profiles for each country", () => {
    expect(getProfilesForCountry("CA")).toHaveLength(3);
    expect(getProfilesForCountry("US")).toHaveLength(3);
    expect(getProfilesForCountry("AU")).toHaveLength(3);
  });
});
