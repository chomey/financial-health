import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CountryJurisdictionSelector, {
  CA_PROVINCES,
  US_STATES,
  DEFAULT_JURISDICTION,
} from "@/components/CountryJurisdictionSelector";

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

  it("shows Canadian provinces when country is CA", () => {
    render(<CountryJurisdictionSelector {...defaultProps} />);
    const select = screen.getByTestId("jurisdiction-select") as HTMLSelectElement;
    const options = Array.from(select.options);
    expect(options).toHaveLength(CA_PROVINCES.length);
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
    expect(options).toHaveLength(US_STATES.length);
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
});

describe("jurisdiction data", () => {
  it("CA_PROVINCES has 13 entries (10 provinces + 3 territories)", () => {
    expect(CA_PROVINCES).toHaveLength(13);
  });

  it("US_STATES has 51 entries (50 states + DC)", () => {
    expect(US_STATES).toHaveLength(51);
  });

  it("all CA province codes are 2 characters", () => {
    CA_PROVINCES.forEach((p) => {
      expect(p.code).toHaveLength(2);
    });
  });

  it("all US state codes are 2 characters", () => {
    US_STATES.forEach((s) => {
      expect(s.code).toHaveLength(2);
    });
  });

  it("CA_PROVINCES are sorted alphabetically by name", () => {
    const names = CA_PROVINCES.map((p) => p.name);
    const sorted = [...names].sort();
    expect(names).toEqual(sorted);
  });

  it("US_STATES are sorted alphabetically by name", () => {
    const names = US_STATES.map((s) => s.name);
    const sorted = [...names].sort();
    expect(names).toEqual(sorted);
  });

  it("default jurisdictions are valid", () => {
    expect(CA_PROVINCES.some((p) => p.code === DEFAULT_JURISDICTION.CA)).toBe(true);
    expect(US_STATES.some((s) => s.code === DEFAULT_JURISDICTION.US)).toBe(true);
  });
});
