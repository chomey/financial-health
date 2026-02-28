import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import IncomeEntry, {
  getAllIncomeCategorySuggestions,
} from "@/components/IncomeEntry";

describe("IncomeEntry component", () => {
  it("renders the Monthly Income heading", () => {
    render(<IncomeEntry />);
    expect(screen.getByText("Monthly Income")).toBeInTheDocument();
  });

  it("renders mock income items on load", () => {
    render(<IncomeEntry />);
    expect(screen.getByText("Salary")).toBeInTheDocument();
    expect(screen.getByText("Freelance")).toBeInTheDocument();
  });

  it("displays formatted dollar amounts", () => {
    render(<IncomeEntry />);
    expect(screen.getByText("$5,500")).toBeInTheDocument();
    expect(screen.getByText("$800")).toBeInTheDocument();
  });

  it("shows monthly total of all income", () => {
    render(<IncomeEntry />);
    expect(screen.getByTestId("income-monthly-total")).toHaveTextContent("$6,300");
  });

  it("renders the Add Income button", () => {
    render(<IncomeEntry />);
    expect(screen.getByText("+ Add Income")).toBeInTheDocument();
  });

  it("shows add form when Add Income is clicked", async () => {
    const user = userEvent.setup();
    render(<IncomeEntry />);
    await user.click(screen.getByText("+ Add Income"));
    expect(screen.getByLabelText("New income category")).toBeInTheDocument();
    expect(screen.getByLabelText("New income amount")).toBeInTheDocument();
  });

  it("deletes an income item when delete button is clicked", async () => {
    const user = userEvent.setup();
    render(<IncomeEntry />);
    await user.click(screen.getByLabelText("Delete Freelance"));
    expect(screen.queryByText("Freelance")).not.toBeInTheDocument();
    expect(screen.getByTestId("income-monthly-total")).toHaveTextContent("$5,500");
  });

  it("shows click-to-edit input when category is clicked", async () => {
    const user = userEvent.setup();
    render(<IncomeEntry />);
    await user.click(screen.getByLabelText("Edit category for Salary"));
    expect(screen.getByLabelText("Edit category name")).toBeInTheDocument();
  });

  it("shows click-to-edit input when amount is clicked", async () => {
    const user = userEvent.setup();
    render(<IncomeEntry />);
    await user.click(screen.getByLabelText(/Edit amount for Salary/));
    expect(
      screen.getByLabelText("Edit amount for Salary")
    ).toBeInTheDocument();
  });

  it("has income items list with proper role", () => {
    render(<IncomeEntry />);
    expect(
      screen.getByRole("list", { name: "Income items" })
    ).toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBe(2);
  });

  it("shows empty state when all income items are deleted", async () => {
    const user = userEvent.setup();
    render(<IncomeEntry />);
    await user.click(screen.getByLabelText("Delete Salary"));
    await user.click(screen.getByLabelText("Delete Freelance"));
    expect(
      screen.getByText(
        "Enter your income sources to understand your monthly cash flow."
      )
    ).toBeInTheDocument();
  });

  it("displays income amounts in green", () => {
    render(<IncomeEntry />);
    const amountBtn = screen.getByLabelText(/Edit amount for Salary, currently/);
    expect(amountBtn.className).toContain("text-green-700");
  });

  it("adds a new income item via the add form", async () => {
    const user = userEvent.setup();
    render(<IncomeEntry />);
    await user.click(screen.getByText("+ Add Income"));
    await user.type(screen.getByLabelText("New income category"), "Side Hustle");
    await user.type(screen.getByLabelText("New income amount"), "500");
    await user.click(screen.getByLabelText("Confirm add income"));
    expect(screen.getByText("Side Hustle")).toBeInTheDocument();
    expect(screen.getByText("$500")).toBeInTheDocument();
    expect(screen.getByTestId("income-monthly-total")).toHaveTextContent("$6,800");
  });
});

describe("getAllIncomeCategorySuggestions", () => {
  it("includes all income categories", () => {
    const suggestions = getAllIncomeCategorySuggestions();
    expect(suggestions).toContain("Salary");
    expect(suggestions).toContain("Freelance");
    expect(suggestions).toContain("Investment Income");
    expect(suggestions).toContain("Capital Gains");
    expect(suggestions).toContain("Dividends");
    expect(suggestions).toContain("Side Hustle");
    expect(suggestions).toContain("Other");
  });

  it("returns 7 total suggestions", () => {
    const suggestions = getAllIncomeCategorySuggestions();
    expect(suggestions.length).toBe(7);
  });
});
