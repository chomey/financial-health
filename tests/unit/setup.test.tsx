import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

describe("Project setup", () => {
  it("renders the home page with app title", () => {
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

  it("renders the welcome message", () => {
    render(<Home />);
    expect(
      screen.getByText("Welcome! Your financial snapshot is on its way.")
    ).toBeInTheDocument();
  });
});
