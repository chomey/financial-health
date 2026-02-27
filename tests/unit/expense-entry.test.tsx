import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ExpenseEntry, {
  getAllExpenseCategorySuggestions,
} from "@/components/ExpenseEntry";

describe("ExpenseEntry component", () => {
  it("renders the Monthly Expenses heading", () => {
    render(<ExpenseEntry />);
    expect(screen.getByText("Monthly Expenses")).toBeInTheDocument();
  });

  it("renders mock expense items on load", () => {
    render(<ExpenseEntry />);
    expect(screen.getByText("Rent/Mortgage Payment")).toBeInTheDocument();
    expect(screen.getByText("Groceries")).toBeInTheDocument();
    expect(screen.getByText("Subscriptions")).toBeInTheDocument();
  });

  it("displays formatted dollar amounts", () => {
    render(<ExpenseEntry />);
    expect(screen.getByText("$2,200")).toBeInTheDocument();
    expect(screen.getByText("$600")).toBeInTheDocument();
    expect(screen.getByText("$150")).toBeInTheDocument();
  });

  it("shows monthly total of all expenses", () => {
    render(<ExpenseEntry />);
    expect(screen.getByText("Monthly Total: $2,950")).toBeInTheDocument();
  });

  it("renders the Add Expense button", () => {
    render(<ExpenseEntry />);
    expect(screen.getByText("+ Add Expense")).toBeInTheDocument();
  });

  it("shows add form when Add Expense is clicked", async () => {
    const user = userEvent.setup();
    render(<ExpenseEntry />);
    await user.click(screen.getByText("+ Add Expense"));
    expect(screen.getByLabelText("New expense category")).toBeInTheDocument();
    expect(screen.getByLabelText("New expense amount")).toBeInTheDocument();
  });

  it("deletes an expense item when delete button is clicked", async () => {
    const user = userEvent.setup();
    render(<ExpenseEntry />);
    await user.click(screen.getByLabelText("Delete Subscriptions"));
    expect(screen.queryByText("Subscriptions")).not.toBeInTheDocument();
    expect(screen.getByText("Monthly Total: $2,800")).toBeInTheDocument();
  });

  it("shows click-to-edit input when category is clicked", async () => {
    const user = userEvent.setup();
    render(<ExpenseEntry />);
    await user.click(
      screen.getByLabelText("Edit category for Groceries")
    );
    expect(screen.getByLabelText("Edit category name")).toBeInTheDocument();
  });

  it("shows click-to-edit input when amount is clicked", async () => {
    const user = userEvent.setup();
    render(<ExpenseEntry />);
    await user.click(screen.getByLabelText(/Edit amount for Groceries/));
    expect(
      screen.getByLabelText("Edit amount for Groceries")
    ).toBeInTheDocument();
  });

  it("has expense items list with proper role", () => {
    render(<ExpenseEntry />);
    expect(
      screen.getByRole("list", { name: "Expense items" })
    ).toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBe(3);
  });

  it("shows empty state when all expense items are deleted", async () => {
    const user = userEvent.setup();
    render(<ExpenseEntry />);
    await user.click(screen.getByLabelText("Delete Rent/Mortgage Payment"));
    await user.click(screen.getByLabelText("Delete Groceries"));
    await user.click(screen.getByLabelText("Delete Subscriptions"));
    expect(
      screen.getByText(
        "Add your regular expenses — be as detailed or broad as you like."
      )
    ).toBeInTheDocument();
  });

  it("displays expense amounts in amber", () => {
    render(<ExpenseEntry />);
    const amountBtn = screen.getByLabelText(
      /Edit amount for Groceries, currently/
    );
    expect(amountBtn.className).toContain("text-amber-700");
  });

  it("adds a new expense item via the add form", async () => {
    const user = userEvent.setup();
    render(<ExpenseEntry />);
    await user.click(screen.getByText("+ Add Expense"));
    await user.type(
      screen.getByLabelText("New expense category"),
      "Transportation"
    );
    await user.type(screen.getByLabelText("New expense amount"), "200");
    await user.click(screen.getByLabelText("Confirm add expense"));
    expect(screen.getByText("Transportation")).toBeInTheDocument();
    expect(screen.getByText("$200")).toBeInTheDocument();
    expect(screen.getByText("Monthly Total: $3,150")).toBeInTheDocument();
  });
});

describe("getAllExpenseCategorySuggestions", () => {
  it("includes all expense categories", () => {
    const suggestions = getAllExpenseCategorySuggestions();
    expect(suggestions).toContain("Rent/Mortgage Payment");
    expect(suggestions).toContain("Childcare");
    expect(suggestions).toContain("Groceries");
    expect(suggestions).toContain("Subscriptions");
    expect(suggestions).toContain("Transportation");
    expect(suggestions).toContain("Insurance");
    expect(suggestions).toContain("Utilities");
    expect(suggestions).toContain("Monthly Expenses");
    expect(suggestions).toContain("Other");
  });

  it("returns 9 total suggestions", () => {
    const suggestions = getAllExpenseCategorySuggestions();
    expect(suggestions.length).toBe(9);
  });
});
