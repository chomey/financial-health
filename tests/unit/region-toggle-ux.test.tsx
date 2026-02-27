import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegionToggle from "@/components/RegionToggle";
import {
  getGroupedCategorySuggestions,
  isOutOfRegion,
  CA_ASSET_CATEGORIES,
  US_ASSET_CATEGORIES,
} from "@/components/AssetEntry";
import {
  getGroupedDebtCategorySuggestions,
  isDebtOutOfRegion,
  CA_DEBT_CATEGORIES,
  US_DEBT_CATEGORIES,
} from "@/components/DebtEntry";
import AssetEntry from "@/components/AssetEntry";
import DebtEntry from "@/components/DebtEntry";

describe("RegionToggle tooltip and label", () => {
  it("has aria-label explaining toggle purpose", () => {
    render(<RegionToggle region="both" onChange={() => {}} />);
    const group = screen.getByRole("radiogroup");
    expect(group).toHaveAttribute("aria-label", "Filter account types by region");
  });

  it("has title attribute for native tooltip", () => {
    render(<RegionToggle region="both" onChange={() => {}} />);
    const group = screen.getByRole("radiogroup");
    expect(group).toHaveAttribute("title", "Filter account types by region");
  });
});

describe("RegionToggle toast feedback", () => {
  it("shows toast after region change", async () => {
    let currentRegion: string = "both";
    const { rerender } = render(
      <RegionToggle region="both" onChange={(r) => { currentRegion = r; }} />
    );

    // No toast initially
    expect(screen.queryByTestId("region-toast")).not.toBeInTheDocument();

    // Click US
    const usButton = screen.getByRole("radio", { name: /US/i });
    await userEvent.click(usButton);

    // Rerender with new region to trigger useEffect
    rerender(
      <RegionToggle region="US" onChange={(r) => { currentRegion = r; }} />
    );

    expect(screen.getByTestId("region-toast")).toHaveTextContent("Showing US account types");
  });

  it("shows CA message for CA region", () => {
    const { rerender } = render(
      <RegionToggle region="both" onChange={() => {}} />
    );
    rerender(<RegionToggle region="CA" onChange={() => {}} />);
    expect(screen.getByTestId("region-toast")).toHaveTextContent("Showing Canadian account types");
  });

  it("shows all message for both region", () => {
    const { rerender } = render(
      <RegionToggle region="CA" onChange={() => {}} />
    );
    rerender(<RegionToggle region="both" onChange={() => {}} />);
    expect(screen.getByTestId("region-toast")).toHaveTextContent("Showing all account types");
  });
});

describe("isOutOfRegion (assets)", () => {
  it("returns false for both region", () => {
    expect(isOutOfRegion("TFSA", "both")).toBe(false);
    expect(isOutOfRegion("401k", "both")).toBe(false);
    expect(isOutOfRegion("Savings", "both")).toBe(false);
  });

  it("returns true for US-specific category when CA is selected", () => {
    expect(isOutOfRegion("401k", "CA")).toBe(true);
    expect(isOutOfRegion("IRA", "CA")).toBe(true);
    expect(isOutOfRegion("Roth IRA", "CA")).toBe(true);
  });

  it("returns true for CA-specific category when US is selected", () => {
    expect(isOutOfRegion("TFSA", "US")).toBe(true);
    expect(isOutOfRegion("RRSP", "US")).toBe(true);
  });

  it("returns false for universal categories regardless of region", () => {
    expect(isOutOfRegion("Savings", "CA")).toBe(false);
    expect(isOutOfRegion("Savings", "US")).toBe(false);
    expect(isOutOfRegion("Brokerage", "CA")).toBe(false);
  });

  it("returns false when region is undefined", () => {
    expect(isOutOfRegion("TFSA")).toBe(false);
    expect(isOutOfRegion("401k")).toBe(false);
  });
});

describe("isDebtOutOfRegion", () => {
  it("returns false for both region", () => {
    expect(isDebtOutOfRegion("HELOC", "both")).toBe(false);
    expect(isDebtOutOfRegion("Medical Debt", "both")).toBe(false);
  });

  it("returns true for US-specific debt when CA is selected", () => {
    expect(isDebtOutOfRegion("Medical Debt", "CA")).toBe(true);
    expect(isDebtOutOfRegion("Federal Student Loan", "CA")).toBe(true);
  });

  it("returns true for CA-specific debt when US is selected", () => {
    expect(isDebtOutOfRegion("HELOC", "US")).toBe(true);
    expect(isDebtOutOfRegion("Canada Student Loan", "US")).toBe(true);
  });

  it("returns false for universal debts", () => {
    expect(isDebtOutOfRegion("Car Loan", "CA")).toBe(false);
    expect(isDebtOutOfRegion("Credit Card", "US")).toBe(false);
  });
});

describe("getGroupedCategorySuggestions (assets)", () => {
  it("returns all groups for both region", () => {
    const groups = getGroupedCategorySuggestions("both");
    expect(groups).toHaveLength(3);
    expect(groups[0].label).toContain("Canadian");
    expect(groups[1].label).toContain("US");
    expect(groups[2].label).toBe("General");
  });

  it("returns CA + General for CA region (no US)", () => {
    const groups = getGroupedCategorySuggestions("CA");
    expect(groups).toHaveLength(2);
    expect(groups[0].label).toContain("Canadian");
    expect(groups[1].label).toBe("General");
    const allItems = groups.flatMap((g) => g.items);
    expect(allItems).not.toContain("401k");
    expect(allItems).toContain("TFSA");
  });

  it("returns US + General for US region (no CA)", () => {
    const groups = getGroupedCategorySuggestions("US");
    expect(groups).toHaveLength(2);
    expect(groups[0].label).toContain("US");
    expect(groups[1].label).toBe("General");
    const allItems = groups.flatMap((g) => g.items);
    expect(allItems).toContain("401k");
    expect(allItems).not.toContain("TFSA");
  });
});

describe("getGroupedDebtCategorySuggestions", () => {
  it("returns all groups for both region", () => {
    const groups = getGroupedDebtCategorySuggestions("both");
    expect(groups).toHaveLength(3);
    expect(groups[0].label).toContain("Canadian");
    expect(groups[1].label).toContain("US");
    expect(groups[2].label).toBe("General");
  });

  it("returns CA + General for CA region", () => {
    const groups = getGroupedDebtCategorySuggestions("CA");
    expect(groups).toHaveLength(2);
    expect(groups[0].label).toContain("Canadian");
    const allItems = groups.flatMap((g) => g.items);
    expect(allItems).toContain("HELOC");
    expect(allItems).not.toContain("Medical Debt");
  });
});

describe("AssetEntry out-of-region dimming", () => {
  it("dims TFSA when US region is selected", () => {
    const items = [
      { id: "a1", category: "TFSA", amount: 35000 },
      { id: "a2", category: "Savings", amount: 12000 },
    ];
    render(<AssetEntry items={items} region="US" />);
    // TFSA row should have opacity-50
    const tfsaItem = screen.getByRole("button", { name: /Edit category for TFSA/i }).closest('[role="listitem"]');
    expect(tfsaItem?.className).toContain("opacity-50");

    // Savings row should NOT be dimmed
    const savingsItem = screen.getByRole("button", { name: /Edit category for Savings/i }).closest('[role="listitem"]');
    expect(savingsItem?.className).not.toContain("opacity-50");
  });

  it("shows region badge on out-of-region asset", () => {
    const items = [
      { id: "a1", category: "TFSA", amount: 35000 },
    ];
    render(<AssetEntry items={items} region="US" />);
    const badge = screen.getByTestId("region-badge-a1");
    expect(badge).toHaveTextContent("CA");
  });

  it("does not dim when region is both", () => {
    const items = [
      { id: "a1", category: "TFSA", amount: 35000 },
      { id: "a2", category: "401k", amount: 50000 },
    ];
    render(<AssetEntry items={items} region="both" />);
    const tfsaItem = screen.getByRole("button", { name: /Edit category for TFSA/i }).closest('[role="listitem"]');
    expect(tfsaItem?.className).not.toContain("opacity-50");
    const k401Item = screen.getByRole("button", { name: /Edit category for 401k/i }).closest('[role="listitem"]');
    expect(k401Item?.className).not.toContain("opacity-50");
  });
});

describe("DebtEntry out-of-region dimming", () => {
  it("dims HELOC when US region is selected", () => {
    const items = [
      { id: "d1", category: "HELOC", amount: 20000 },
      { id: "d2", category: "Car Loan", amount: 15000 },
    ];
    render(<DebtEntry items={items} region="US" />);
    const helocItem = screen.getByRole("button", { name: /Edit category for HELOC/i }).closest('[role="listitem"]');
    expect(helocItem?.className).toContain("opacity-50");

    const carItem = screen.getByRole("button", { name: /Edit category for Car Loan/i }).closest('[role="listitem"]');
    expect(carItem?.className).not.toContain("opacity-50");
  });

  it("shows region badge on out-of-region debt", () => {
    const items = [
      { id: "d1", category: "HELOC", amount: 20000 },
    ];
    render(<DebtEntry items={items} region="US" />);
    const badge = screen.getByTestId("region-badge-d1");
    expect(badge).toHaveTextContent("CA");
  });
});
