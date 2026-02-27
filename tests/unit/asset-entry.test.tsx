import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AssetEntry, { getAllCategorySuggestions } from "@/components/AssetEntry";

describe("AssetEntry component", () => {
  it("renders the Assets heading", () => {
    render(<AssetEntry />);
    expect(screen.getByText("Assets")).toBeInTheDocument();
  });

  it("renders mock assets on load", () => {
    render(<AssetEntry />);
    expect(screen.getByText("Savings Account")).toBeInTheDocument();
    expect(screen.getByText("TFSA")).toBeInTheDocument();
    expect(screen.getByText("Brokerage")).toBeInTheDocument();
  });

  it("displays formatted dollar amounts", () => {
    render(<AssetEntry />);
    expect(screen.getByText("$12,000")).toBeInTheDocument();
    expect(screen.getByText("$35,000")).toBeInTheDocument();
    expect(screen.getByText("$18,500")).toBeInTheDocument();
  });

  it("shows total of all assets", () => {
    render(<AssetEntry />);
    expect(screen.getByText("Total: $65,500")).toBeInTheDocument();
  });

  it("renders the Add Asset button", () => {
    render(<AssetEntry />);
    expect(screen.getByText("+ Add Asset")).toBeInTheDocument();
  });

  it("shows add form when Add Asset is clicked", async () => {
    const user = userEvent.setup();
    render(<AssetEntry />);
    await user.click(screen.getByText("+ Add Asset"));
    expect(screen.getByLabelText("New asset category")).toBeInTheDocument();
    expect(screen.getByLabelText("New asset amount")).toBeInTheDocument();
  });

  it("deletes an asset when delete button is clicked", async () => {
    const user = userEvent.setup();
    render(<AssetEntry />);
    const deleteBtn = screen.getByLabelText("Delete Savings Account");
    await user.click(deleteBtn);
    expect(screen.queryByText("Savings Account")).not.toBeInTheDocument();
    // Total should update
    expect(screen.getByText("Total: $53,500")).toBeInTheDocument();
  });

  it("shows click-to-edit input when category is clicked", async () => {
    const user = userEvent.setup();
    render(<AssetEntry />);
    await user.click(
      screen.getByLabelText("Edit category for Savings Account")
    );
    expect(screen.getByLabelText("Edit category name")).toBeInTheDocument();
  });

  it("shows click-to-edit input when amount is clicked", async () => {
    const user = userEvent.setup();
    render(<AssetEntry />);
    await user.click(
      screen.getByLabelText(/Edit amount for Savings Account/)
    );
    expect(
      screen.getByLabelText("Edit amount for Savings Account")
    ).toBeInTheDocument();
  });

  it("has asset items list with proper role", () => {
    render(<AssetEntry />);
    expect(
      screen.getByRole("list", { name: "Asset items" })
    ).toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBe(3);
  });

  it("shows empty state when all assets are deleted", async () => {
    const user = userEvent.setup();
    render(<AssetEntry />);
    // Delete all three
    await user.click(screen.getByLabelText("Delete Savings Account"));
    await user.click(screen.getByLabelText("Delete TFSA"));
    await user.click(screen.getByLabelText("Delete Brokerage"));
    expect(
      screen.getByText(
        "Add your savings, investments, and property to see your full picture."
      )
    ).toBeInTheDocument();
  });
});

describe("getAllCategorySuggestions", () => {
  it("includes CA, US, and universal categories", () => {
    const suggestions = getAllCategorySuggestions();
    expect(suggestions).toContain("TFSA");
    expect(suggestions).toContain("RRSP");
    expect(suggestions).toContain("401k");
    expect(suggestions).toContain("Roth IRA");
    expect(suggestions).toContain("Savings");
    expect(suggestions).toContain("Brokerage");
  });

  it("returns 15 total suggestions", () => {
    const suggestions = getAllCategorySuggestions();
    expect(suggestions.length).toBe(15);
  });
});
