import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import {
  getQuickStartProfilesForCountry,
  getProfilesForCountry,
  QUICK_START_CA_PROFILES,
  QUICK_START_US_PROFILES,
  QUICK_START_AU_PROFILES,
} from "@/lib/sample-profiles";
import { ModeProvider } from "@/lib/ModeContext";
import WelcomeStep from "@/components/wizard/steps/WelcomeStep";
import { CurrencyProvider } from "@/lib/CurrencyContext";

function renderWelcome(mode: "simple" | "advanced", country: "CA" | "US" | "AU" = "CA") {
  const loadProfile = vi.fn();
  const onProfileLoaded = vi.fn();
  const onEnterOwn = vi.fn();

  render(
    <ModeProvider mode={mode} setMode={() => {}}>
      <CurrencyProvider currency="CAD">
        <WelcomeStep
          country={country}
          jurisdiction="ON"
          taxYear={2025}
          onCountryChange={() => {}}
          onJurisdictionChange={() => {}}
          onTaxYearChange={() => {}}
          loadProfile={loadProfile}
          onProfileLoaded={onProfileLoaded}
          onEnterOwn={onEnterOwn}
        />
      </CurrencyProvider>
    </ModeProvider>
  );

  return { loadProfile, onProfileLoaded, onEnterOwn };
}

// ── Quick-start profile data tests ────────────────────────────────────────

describe("getQuickStartProfilesForCountry", () => {
  it("returns CA quick-start profiles for CA", () => {
    const profiles = getQuickStartProfilesForCountry("CA");
    expect(profiles).toBe(QUICK_START_CA_PROFILES);
    expect(profiles).toHaveLength(2);
  });

  it("returns US quick-start profiles for US", () => {
    const profiles = getQuickStartProfilesForCountry("US");
    expect(profiles).toBe(QUICK_START_US_PROFILES);
    expect(profiles).toHaveLength(2);
  });

  it("returns AU quick-start profiles for AU", () => {
    const profiles = getQuickStartProfilesForCountry("AU");
    expect(profiles).toBe(QUICK_START_AU_PROFILES);
    expect(profiles).toHaveLength(2);
  });

  it("CA quick-start profiles have expected IDs", () => {
    const profiles = getQuickStartProfilesForCountry("CA");
    expect(profiles[0].id).toBe("ca-renter");
    expect(profiles[1].id).toBe("ca-homeowner");
  });

  it("US quick-start profiles have expected IDs", () => {
    const profiles = getQuickStartProfilesForCountry("US");
    expect(profiles[0].id).toBe("us-renter");
    expect(profiles[1].id).toBe("us-homeowner");
  });

  it("AU quick-start profiles have expected IDs", () => {
    const profiles = getQuickStartProfilesForCountry("AU");
    expect(profiles[0].id).toBe("au-renter");
    expect(profiles[1].id).toBe("au-homeowner");
  });

  it("quick-start profiles have no stocks", () => {
    for (const country of ["CA", "US", "AU"] as const) {
      for (const profile of getQuickStartProfilesForCountry(country)) {
        expect(profile.state.stocks).toHaveLength(0);
      }
    }
  });

  it("quick-start profiles have no cost basis or employer match on assets", () => {
    for (const country of ["CA", "US", "AU"] as const) {
      for (const profile of getQuickStartProfilesForCountry(country)) {
        for (const asset of profile.state.assets) {
          expect((asset as Record<string, unknown>).costBasisPercent).toBeUndefined();
          expect((asset as Record<string, unknown>).employerMatchPct).toBeUndefined();
        }
      }
    }
  });

  it("homeowner profiles include _simple_home property", () => {
    const caHomeowner = QUICK_START_CA_PROFILES.find((p) => p.id === "ca-homeowner")!;
    expect(caHomeowner.state.properties).toHaveLength(1);
    expect(caHomeowner.state.properties[0].id).toBe("_simple_home");

    const usHomeowner = QUICK_START_US_PROFILES.find((p) => p.id === "us-homeowner")!;
    expect(usHomeowner.state.properties[0].id).toBe("_simple_home");

    const auHomeowner = QUICK_START_AU_PROFILES.find((p) => p.id === "au-homeowner")!;
    expect(auHomeowner.state.properties[0].id).toBe("_simple_home");
  });

  it("renter profiles have no properties", () => {
    for (const country of ["CA", "US", "AU"] as const) {
      const profiles = getQuickStartProfilesForCountry(country);
      const renter = profiles[0];
      expect(renter.state.properties).toHaveLength(0);
      expect(renter.state.debts).toHaveLength(0);
    }
  });
});

// ── WelcomeStep rendering tests ────────────────────────────────────────────

describe("WelcomeStep — simple mode", () => {
  it("shows quick snapshot tagline in simple mode", () => {
    renderWelcome("simple");
    expect(screen.getByTestId("welcome-tagline").textContent).toContain(
      "Get a quick snapshot of your financial health in under 2 minutes."
    );
  });

  it("shows standard tagline in advanced mode", () => {
    renderWelcome("advanced");
    expect(screen.getByTestId("welcome-tagline").textContent).toContain(
      "Choose your country and region"
    );
  });

  it("shows quick-start profile buttons in simple mode", () => {
    renderWelcome("simple");
    expect(screen.getByTestId("sample-profile-ca-renter")).toBeInTheDocument();
    expect(screen.getByTestId("sample-profile-ca-homeowner")).toBeInTheDocument();
  });

  it("does NOT show advanced profiles in simple mode", () => {
    renderWelcome("simple");
    expect(screen.queryByTestId("sample-profile-fresh-grad")).not.toBeInTheDocument();
    expect(screen.queryByTestId("sample-profile-mid-career")).not.toBeInTheDocument();
    expect(screen.queryByTestId("sample-profile-pre-retirement")).not.toBeInTheDocument();
  });

  it("shows advanced profiles in advanced mode", () => {
    renderWelcome("advanced");
    expect(screen.getByTestId("sample-profile-fresh-grad")).toBeInTheDocument();
    expect(screen.getByTestId("sample-profile-mid-career")).toBeInTheDocument();
    expect(screen.getByTestId("sample-profile-pre-retirement")).toBeInTheDocument();
  });

  it("clicking a quick-start profile calls loadProfile with correct data", () => {
    const { loadProfile, onProfileLoaded } = renderWelcome("simple");
    fireEvent.click(screen.getByTestId("sample-profile-ca-renter"));
    expect(loadProfile).toHaveBeenCalledWith(QUICK_START_CA_PROFILES[0]);
    expect(onProfileLoaded).toHaveBeenCalled();
  });

  it("shows US quick-start profiles for US country in simple mode", () => {
    renderWelcome("simple", "US");
    expect(screen.getByTestId("sample-profile-us-renter")).toBeInTheDocument();
    expect(screen.getByTestId("sample-profile-us-homeowner")).toBeInTheDocument();
  });
});
