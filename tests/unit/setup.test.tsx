import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

describe("App shell layout", () => {
  it("renders the app title", () => {
    render(<Home />);
    expect(
      screen.getByText("Financial Health Snapshot")
    ).toBeInTheDocument();
  });

  it("renders the tagline", () => {
    render(<Home />);
    expect(
      screen.getByText(
        "Your finances at a glance — no judgment, just clarity"
      )
    ).toBeInTheDocument();
  });

  it("renders the entry panel with section label", () => {
    render(<Home />);
    const entryPanel = screen.getByRole("region", {
      name: "Financial data entry",
    });
    expect(entryPanel).toBeInTheDocument();
  });

  it("renders the dashboard panel with section label", () => {
    render(<Home />);
    const dashboardPanel = screen.getByRole("region", {
      name: "Financial dashboard",
    });
    expect(dashboardPanel).toBeInTheDocument();
  });

  it("renders all five entry sections", () => {
    render(<Home />);
    expect(screen.getByText("Assets")).toBeInTheDocument();
    expect(screen.getByText("Debts")).toBeInTheDocument();
    expect(screen.getByText("Monthly Income")).toBeInTheDocument();
    expect(screen.getByText("Monthly Expenses")).toBeInTheDocument();
    expect(screen.getByText("Goals")).toBeInTheDocument();
  });

  it("renders all four dashboard metric cards", () => {
    render(<Home />);
    expect(screen.getByText("Net Worth")).toBeInTheDocument();
    expect(screen.getByText("Monthly Surplus")).toBeInTheDocument();
    expect(screen.getByText("Financial Runway")).toBeInTheDocument();
    expect(screen.getByText("Debt-to-Asset Ratio")).toBeInTheDocument();
  });

  it("shows metric values in dashboard cards", () => {
    render(<Home />);
    // Each metric card has a group role with the metric title as label
    expect(screen.getByRole("group", { name: "Net Worth" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Monthly Surplus" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Financial Runway" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Debt-to-Asset Ratio" })).toBeInTheDocument();
  });

  it("shows mock data in income and expense sections", () => {
    render(<Home />);
    expect(screen.getByText("Salary")).toBeInTheDocument();
    expect(screen.getByText("Rent/Mortgage Payment")).toBeInTheDocument();
  });
});
