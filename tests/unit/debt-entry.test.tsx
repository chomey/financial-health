import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DebtEntry, { getAllDebtCategorySuggestions } from "@/components/DebtEntry";

describe("DebtEntry component", () => {
  it("renders the Debts heading", () => {
    render(<DebtEntry />);
    expect(screen.getByText("Debts")).toBeInTheDocument();
  });

  it("renders mock debts on load", () => {
    render(<DebtEntry />);
    expect(screen.getByText("Mortgage")).toBeInTheDocument();
    expect(screen.getByText("Car Loan")).toBeInTheDocument();
  });

  it("displays formatted dollar amounts", () => {
    render(<DebtEntry />);
    expect(screen.getByText("$280,000")).toBeInTheDocument();
    expect(screen.getByText("$15,000")).toBeInTheDocument();
  });

  it("shows total of all debts", () => {
    render(<DebtEntry />);
    expect(screen.getByText("Total: $295,000")).toBeInTheDocument();
  });

  it("renders the Add Debt button", () => {
    render(<DebtEntry />);
    expect(screen.getByText("+ Add Debt")).toBeInTheDocument();
  });

  it("shows add form when Add Debt is clicked", async () => {
    const user = userEvent.setup();
    render(<DebtEntry />);
    await user.click(screen.getByText("+ Add Debt"));
    expect(screen.getByLabelText("New debt category")).toBeInTheDocument();
    expect(screen.getByLabelText("New debt amount")).toBeInTheDocument();
  });

  it("deletes a debt when delete button is clicked", async () => {
    const user = userEvent.setup();
    render(<DebtEntry />);
    const deleteBtn = screen.getByLabelText("Delete Car Loan");
    await user.click(deleteBtn);
    expect(screen.queryByText("Car Loan")).not.toBeInTheDocument();
    expect(screen.getByText("Total: $280,000")).toBeInTheDocument();
  });

  it("shows click-to-edit input when category is clicked", async () => {
    const user = userEvent.setup();
    render(<DebtEntry />);
    await user.click(screen.getByLabelText("Edit category for Mortgage"));
    expect(screen.getByLabelText("Edit category name")).toBeInTheDocument();
  });

  it("shows click-to-edit input when amount is clicked", async () => {
    const user = userEvent.setup();
    render(<DebtEntry />);
    await user.click(screen.getByLabelText(/Edit amount for Mortgage/));
    expect(
      screen.getByLabelText("Edit amount for Mortgage")
    ).toBeInTheDocument();
  });

  it("has debt items list with proper role", () => {
    render(<DebtEntry />);
    expect(
      screen.getByRole("list", { name: "Debt items" })
    ).toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBe(2);
  });

  it("shows empty state when all debts are deleted", async () => {
    const user = userEvent.setup();
    render(<DebtEntry />);
    await user.click(screen.getByLabelText("Delete Mortgage"));
    await user.click(screen.getByLabelText("Delete Car Loan"));
    expect(
      screen.getByText(
        "Track your mortgage, loans, and credit cards — every number brings clarity."
      )
    ).toBeInTheDocument();
  });

  it("displays debt amounts in rose/red color", () => {
    render(<DebtEntry />);
    const amountButton = screen.getByLabelText(
      /Edit amount for Mortgage, currently/
    );
    expect(amountButton.className).toContain("text-rose-600");
  });
});

describe("getAllDebtCategorySuggestions", () => {
  it("includes all debt categories", () => {
    const suggestions = getAllDebtCategorySuggestions();
    expect(suggestions).toContain("Mortgage");
    expect(suggestions).toContain("Car Loan");
    expect(suggestions).toContain("Student Loan");
    expect(suggestions).toContain("Credit Card");
    expect(suggestions).toContain("Line of Credit");
    expect(suggestions).toContain("Personal Loan");
    expect(suggestions).toContain("Other");
  });

  it("returns 11 total suggestions (7 universal + 2 CA + 2 US)", () => {
    const suggestions = getAllDebtCategorySuggestions();
    expect(suggestions.length).toBe(11);
  });
});
