import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

describe("App shell layout", () => {
  beforeEach(() => {
    // Simulate returning user with dashboard step so tests get the dashboard view
    const url = new URL(window.location.href);
    url.searchParams.set("step", "dashboard");
    window.history.replaceState(null, "", url.toString());
  });

  it("renders the app title", () => {
    render(<Home />);
    // Use getAllByText since PrintFooter also contains this text (hidden in print mode)
    expect(
      screen.getAllByText("Financial Health Snapshot").length
    ).toBeGreaterThanOrEqual(1);
  });

  it("renders the intro tab by default with welcome banner", () => {
    render(<Home />);
    expect(
      screen.getByText("Welcome! Here's how this works")
    ).toBeInTheDocument();
  });

  it("renders the dashboard tab stepper", () => {
    render(<Home />);
    expect(screen.getByRole("navigation", { name: "Dashboard sections" })).toBeInTheDocument();
  });

  it("renders the phase toggle showing Dashboard as active", () => {
    render(<Home />);
    expect(screen.getByText(/Dashboard/)).toBeInTheDocument();
    expect(screen.getByText(/My Finances/)).toBeInTheDocument();
  });

  it("renders all dashboard sections on one page", () => {
    render(<Home />);
    expect(screen.getByText("Welcome! Here's how this works")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-panel")).toBeInTheDocument();
  });
});
