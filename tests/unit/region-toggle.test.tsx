import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegionToggle from "@/components/RegionToggle";
import { getAllCategorySuggestions } from "@/components/AssetEntry";

describe("RegionToggle", () => {
  it("renders three region options", () => {
    render(<RegionToggle region="both" onChange={() => {}} />);
    expect(screen.getByRole("radio", { name: /CA/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /US/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Both/i })).toBeInTheDocument();
  });

  it("marks selected region as checked", () => {
    render(<RegionToggle region="CA" onChange={() => {}} />);
    expect(screen.getByRole("radio", { name: /CA/i })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: /US/i })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("radio", { name: /Both/i })).toHaveAttribute("aria-checked", "false");
  });

  it("calls onChange when a different region is clicked", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<RegionToggle region="both" onChange={onChange} />);
    await user.click(screen.getByRole("radio", { name: /CA/i }));
    expect(onChange).toHaveBeenCalledWith("CA");
  });

  it("has radiogroup role with accessible label", () => {
    render(<RegionToggle region="US" onChange={() => {}} />);
    expect(screen.getByRole("radiogroup", { name: /Select financial region/i })).toBeInTheDocument();
  });

  it("shows flag icons", () => {
    render(<RegionToggle region="both" onChange={() => {}} />);
    expect(screen.getByText("🇨🇦")).toBeInTheDocument();
    expect(screen.getByText("🇺🇸")).toBeInTheDocument();
    expect(screen.getByText("🌐")).toBeInTheDocument();
  });

  it("applies selected styling to the active region", () => {
    render(<RegionToggle region="US" onChange={() => {}} />);
    const usButton = screen.getByRole("radio", { name: /US/i });
    expect(usButton.className).toContain("bg-white");
    expect(usButton.className).toContain("shadow-sm");
  });
});

describe("getAllCategorySuggestions", () => {
  it("returns all suggestions when region is 'both' or undefined", () => {
    const all = getAllCategorySuggestions("both");
    expect(all).toContain("TFSA");
    expect(all).toContain("401k");
    expect(all).toContain("Savings");

    const defaultAll = getAllCategorySuggestions();
    expect(defaultAll).toEqual(all);
  });

  it("returns only CA + universal suggestions for CA region", () => {
    const ca = getAllCategorySuggestions("CA");
    expect(ca).toContain("TFSA");
    expect(ca).toContain("RRSP");
    expect(ca).toContain("Savings");
    expect(ca).not.toContain("401k");
    expect(ca).not.toContain("IRA");
    expect(ca).not.toContain("Roth IRA");
  });

  it("returns only US + universal suggestions for US region", () => {
    const us = getAllCategorySuggestions("US");
    expect(us).toContain("401k");
    expect(us).toContain("IRA");
    expect(us).toContain("Savings");
    expect(us).not.toContain("TFSA");
    expect(us).not.toContain("RRSP");
    expect(us).not.toContain("LIRA");
  });

  it("always includes universal categories regardless of region", () => {
    const universal = ["Savings", "Checking", "Brokerage", "Vehicle", "Other"];
    for (const region of ["CA", "US", "both"] as const) {
      const suggestions = getAllCategorySuggestions(region);
      for (const cat of universal) {
        expect(suggestions).toContain(cat);
      }
    }
  });
});
