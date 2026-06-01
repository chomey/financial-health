import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CountryJurisdictionSelector from "@/components/CountryJurisdictionSelector";
import { getCountry } from "@/lib/countries";

describe("CountryJurisdictionSelector", () => {
  const defaultProps = {
    country: "CA" as const,
    jurisdiction: "ON",
    onCountryChange: vi.fn(),
    onJurisdictionChange: vi.fn(),
  };

  it("renders country toggle and jurisdiction dropdown", () => {
    render(<CountryJurisdictionSelector {...defaultProps} />);
    expect(screen.getByTestId("country-ca")).toBeInTheDocument();
    expect(screen.getByTestId("country-us")).toBeInTheDocument();
    expect(screen.getByTestId("country-au")).toBeInTheDocument();
    expect(screen.getByTestId("jurisdiction-select")).toBeInTheDocument();
  });

  it("shows CA button as active when country is CA", () => {
    render(<CountryJurisdictionSelector {...defaultProps} />);
    const caBtn = screen.getByTestId("country-ca");
    const usBtn = screen.getByTestId("country-us");
    expect(caBtn).toHaveAttribute("aria-pressed", "true");
    expect(usBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("shows US button as active when country is US", () => {
    render(
      <CountryJurisdictionSelector {...defaultProps} country="US" jurisdiction="CA" />
    );
    const caBtn = screen.getByTestId("country-ca");
    const usBtn = screen.getByTestId("country-us");
    expect(caBtn).toHaveAttribute("aria-pressed", "false");
    expect(usBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("shows AU button as active when country is AU", () => {
    render(
      <CountryJurisdictionSelector {...defaultProps} country="AU" jurisdiction="NSW" />
    );
    expect(screen.getByTestId("country-au")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("country-ca")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("country-us")).toHaveAttribute("aria-pressed", "false");
  });

  it("shows AU states/territories when country is AU", () => {
    render(
      <CountryJurisdictionSelector {...defaultProps} country="AU" jurisdiction="NSW" />
    );
    const select = screen.getByTestId("jurisdiction-select") as HTMLSelectElement;
    const options = Array.from(select.options);
    expect(options).toHaveLength(getCountry("AU").jurisdictions.length);
    expect(options.some((o) => o.value === "NSW")).toBe(true);
    expect(options.some((o) => o.value === "VIC")).toBe(true);
    expect(options.some((o) => o.value === "QLD")).toBe(true);
    // Should NOT show CA provinces or US states
    expect(options.some((o) => o.value === "ON")).toBe(false);
    expect(options.some((o) => o.value === "NY")).toBe(false);
  });

  it("calls onCountryChange and resets jurisdiction when switching to AU", async () => {
    const onCountryChange = vi.fn();
    const onJurisdictionChange = vi.fn();
    const user = userEvent.setup();
    render(
      <CountryJurisdictionSelector
        {...defaultProps}
        onCountryChange={onCountryChange}
        onJurisdictionChange={onJurisdictionChange}
      />
    );

    await user.click(screen.getByTestId("country-au"));
    expect(onCountryChange).toHaveBeenCalledWith("AU");
    expect(onJurisdictionChange).toHaveBeenCalledWith("NSW"); // default AU jurisdiction
  });

  it("does not call onCountryChange when clicking the already-selected AU country", async () => {
    const onCountryChange = vi.fn();
    const user = userEvent.setup();
    render(
      <CountryJurisdictionSelector
        {...defaultProps}
        country="AU"
        jurisdiction="NSW"
        onCountryChange={onCountryChange}
      />
    );

    await user.click(screen.getByTestId("country-au"));
    expect(onCountryChange).not.toHaveBeenCalled();
  });

  it("shows Canadian provinces when country is CA", () => {
    render(<CountryJurisdictionSelector {...defaultProps} />);
    const select = screen.getByTestId("jurisdiction-select") as HTMLSelectElement;
    const options = Array.from(select.options);
    expect(options).toHaveLength(getCountry("CA").jurisdictions.length);
    expect(options.some((o) => o.value === "ON")).toBe(true);
    expect(options.some((o) => o.value === "BC")).toBe(true);
    // Should NOT show US states
    expect(options.some((o) => o.value === "NY")).toBe(false);
  });

  it("shows US states when country is US", () => {
    render(
      <CountryJurisdictionSelector {...defaultProps} country="US" jurisdiction="CA" />
    );
    const select = screen.getByTestId("jurisdiction-select") as HTMLSelectElement;
    const options = Array.from(select.options);
    expect(options).toHaveLength(getCountry("US").jurisdictions.length);
    expect(options.some((o) => o.value === "NY")).toBe(true);
    expect(options.some((o) => o.value === "TX")).toBe(true);
    // Should NOT show Canadian provinces
    expect(options.some((o) => o.value === "ON")).toBe(false);
  });

  it("calls onCountryChange and resets jurisdiction when switching to US", async () => {
    const onCountryChange = vi.fn();
    const onJurisdictionChange = vi.fn();
    const user = userEvent.setup();
    render(
      <CountryJurisdictionSelector
        {...defaultProps}
        onCountryChange={onCountryChange}
        onJurisdictionChange={onJurisdictionChange}
      />
    );

    await user.click(screen.getByTestId("country-us"));
    expect(onCountryChange).toHaveBeenCalledWith("US");
    expect(onJurisdictionChange).toHaveBeenCalledWith("CA"); // default US jurisdiction
  });

  it("calls onCountryChange and resets jurisdiction when switching to CA", async () => {
    const onCountryChange = vi.fn();
    const onJurisdictionChange = vi.fn();
    const user = userEvent.setup();
    render(
      <CountryJurisdictionSelector
        country="US"
        jurisdiction="NY"
        onCountryChange={onCountryChange}
        onJurisdictionChange={onJurisdictionChange}
      />
    );

    await user.click(screen.getByTestId("country-ca"));
    expect(onCountryChange).toHaveBeenCalledWith("CA");
    expect(onJurisdictionChange).toHaveBeenCalledWith("ON"); // default CA jurisdiction
  });

  it("does not call onCountryChange when clicking the already-selected country", async () => {
    const onCountryChange = vi.fn();
    const user = userEvent.setup();
    render(
      <CountryJurisdictionSelector {...defaultProps} onCountryChange={onCountryChange} />
    );

    await user.click(screen.getByTestId("country-ca"));
    expect(onCountryChange).not.toHaveBeenCalled();
  });

  it("calls onJurisdictionChange when selecting a different province/state", async () => {
    const onJurisdictionChange = vi.fn();
    const user = userEvent.setup();
    render(
      <CountryJurisdictionSelector
        {...defaultProps}
        onJurisdictionChange={onJurisdictionChange}
      />
    );

    await user.selectOptions(screen.getByTestId("jurisdiction-select"), "BC");
    expect(onJurisdictionChange).toHaveBeenCalledWith("BC");
  });

  it("has correct selected jurisdiction value", () => {
    render(<CountryJurisdictionSelector {...defaultProps} jurisdiction="QC" />);
    const select = screen.getByTestId("jurisdiction-select") as HTMLSelectElement;
    expect(select.value).toBe("QC");
  });

  it("renders calendar-year labels for CA", () => {
    render(<CountryJurisdictionSelector {...defaultProps} onTaxYearChange={vi.fn()} />);
    expect(screen.getByTestId("tax-year-2025")).toHaveTextContent("2025");
    expect(screen.getByTestId("tax-year-2026")).toHaveAccessibleName("Tax year 2026");
  });

  it("renders fiscal-year labels for AU", () => {
    render(
      <CountryJurisdictionSelector
        {...defaultProps}
        country="AU"
        jurisdiction="NSW"
        onTaxYearChange={vi.fn()}
      />
    );
    expect(screen.getByTestId("tax-year-2025")).toHaveTextContent("2024/25 FY");
    expect(screen.getByTestId("tax-year-2026")).toHaveAccessibleName("Tax year 2025/26 FY");
  });
});

describe("jurisdiction data via country registry", () => {
  it("CA has 13 jurisdictions (10 provinces + 3 territories)", () => {
    expect(getCountry("CA").jurisdictions).toHaveLength(13);
  });

  it("US has 51 jurisdictions (50 states + DC)", () => {
    expect(getCountry("US").jurisdictions).toHaveLength(51);
  });

  it("AU has 8 jurisdictions (6 states + 2 territories)", () => {
    expect(getCountry("AU").jurisdictions).toHaveLength(8);
  });

  it("all CA jurisdiction codes are 2 characters", () => {
    getCountry("CA").jurisdictions.forEach((p) => {
      expect(p.code).toHaveLength(2);
    });
  });

  it("all US jurisdiction codes are 2 characters", () => {
    getCountry("US").jurisdictions.forEach((s) => {
      expect(s.code).toHaveLength(2);
    });
  });

  it("CA jurisdictions are sorted alphabetically by name", () => {
    const names = getCountry("CA").jurisdictions.map((p) => p.name);
    const sorted = [...names].sort();
    expect(names).toEqual(sorted);
  });

  it("US jurisdictions are sorted alphabetically by name", () => {
    const names = getCountry("US").jurisdictions.map((s) => s.name);
    const sorted = [...names].sort();
    expect(names).toEqual(sorted);
  });

  it("AU jurisdictions include all expected codes", () => {
    const codes = getCountry("AU").jurisdictions.map((s) => s.code);
    expect(codes).toContain("NSW");
    expect(codes).toContain("VIC");
    expect(codes).toContain("QLD");
    expect(codes).toContain("SA");
    expect(codes).toContain("WA");
    expect(codes).toContain("TAS");
    expect(codes).toContain("NT");
    expect(codes).toContain("ACT");
  });

  it("default jurisdictions are valid entries", () => {
    const ca = getCountry("CA");
    expect(ca.jurisdictions.some((p) => p.code === ca.defaultJurisdiction)).toBe(true);
    const us = getCountry("US");
    expect(us.jurisdictions.some((s) => s.code === us.defaultJurisdiction)).toBe(true);
    const au = getCountry("AU");
    expect(au.jurisdictions.some((s) => s.code === au.defaultJurisdiction)).toBe(true);
  });
});
