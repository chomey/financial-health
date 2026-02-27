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

  it("renders all four entry cards with empty states", () => {
    render(<Home />);
    expect(screen.getByText("Assets")).toBeInTheDocument();
    expect(screen.getByText("Debts")).toBeInTheDocument();
    expect(screen.getByText("Monthly Income")).toBeInTheDocument();
    expect(screen.getByText("Monthly Expenses")).toBeInTheDocument();
  });

  it("renders all four dashboard metric cards", () => {
    render(<Home />);
    expect(screen.getByText("Net Worth")).toBeInTheDocument();
    expect(screen.getByText("Monthly Surplus")).toBeInTheDocument();
    expect(screen.getByText("Financial Runway")).toBeInTheDocument();
    expect(screen.getByText("Debt-to-Asset Ratio")).toBeInTheDocument();
  });

  it("shows placeholder values in dashboard cards", () => {
    render(<Home />);
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBe(4);
  });

  it("shows encouraging empty state messages", () => {
    render(<Home />);
    expect(
      screen.getByText(/Add your savings, investments, and property/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Track your mortgage, loans, and credit cards/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Enter your income sources/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Add your regular expenses/)
    ).toBeInTheDocument();
  });
});
