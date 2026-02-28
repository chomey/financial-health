import { describe, it, expect, vi } from "vitest";
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
  it("returns employment suggestions by default", () => {
    const suggestions = getAllIncomeCategorySuggestions();
    expect(suggestions).toContain("Salary");
    expect(suggestions).toContain("Freelance");
    expect(suggestions).toContain("Investment Income");
    expect(suggestions).toContain("Dividends");
    expect(suggestions).toContain("Side Hustle");
    expect(suggestions).toContain("Other");
    expect(suggestions).not.toContain("Stock Sale");
  });

  it("returns 6 employment suggestions", () => {
    const suggestions = getAllIncomeCategorySuggestions("employment");
    expect(suggestions.length).toBe(6);
  });

  it("returns capital-gains specific suggestions", () => {
    const suggestions = getAllIncomeCategorySuggestions("capital-gains");
    expect(suggestions).toContain("Stock Sale");
    expect(suggestions).toContain("Property Sale");
    expect(suggestions).toContain("Crypto");
    expect(suggestions).toContain("Capital Gains");
    expect(suggestions).toContain("Other");
    expect(suggestions).not.toContain("Salary");
  });

  it("returns 5 capital-gains suggestions", () => {
    const suggestions = getAllIncomeCategorySuggestions("capital-gains");
    expect(suggestions.length).toBe(5);
  });

  it("returns all suggestions for 'other' income type", () => {
    const suggestions = getAllIncomeCategorySuggestions("other");
    expect(suggestions).toContain("Salary");
    expect(suggestions).toContain("Stock Sale");
    expect(suggestions).toContain("Crypto");
    expect(suggestions.length).toBe(10);
  });
});

describe("IncomeEntry income type selector", () => {
  it("renders income type selector for each row", () => {
    render(<IncomeEntry />);
    expect(screen.getByLabelText("Change income type for Salary")).toBeInTheDocument();
    expect(screen.getByLabelText("Change income type for Freelance")).toBeInTheDocument();
  });

  it("defaults to Employment income type", () => {
    render(<IncomeEntry />);
    const selector = screen.getByTestId("income-type-i1") as HTMLSelectElement;
    expect(selector.value).toBe("employment");
  });

  it("applies capital-gains visual styling to row", () => {
    const items = [
      { id: "i1", category: "Stock Sale", amount: 5000, incomeType: "capital-gains" as const },
    ];
    render(<IncomeEntry items={items} />);
    const listItem = screen.getByRole("listitem");
    expect(listItem.className).toContain("bg-amber-50");
    expect(listItem.className).toContain("border-amber-400");
  });

  it("does not apply capital-gains styling to employment rows", () => {
    render(<IncomeEntry />);
    const listItems = screen.getAllByRole("listitem");
    expect(listItems[0].className).not.toContain("bg-amber-50");
  });

  it("shows income type selector in add new form", async () => {
    const user = userEvent.setup();
    render(<IncomeEntry />);
    await user.click(screen.getByText("+ Add Income"));
    expect(screen.getByLabelText("New income type")).toBeInTheDocument();
    expect(screen.getByTestId("new-income-type")).toBeInTheDocument();
  });

  it("adds new item with selected income type", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<IncomeEntry items={[]} onChange={onChange} />);
    await user.click(screen.getByText("+ Add Income"));
    await user.type(screen.getByLabelText("New income category"), "Stock Sale");
    await user.type(screen.getByLabelText("New income amount"), "10000");
    await user.selectOptions(screen.getByTestId("new-income-type"), "capital-gains");
    await user.click(screen.getByLabelText("Confirm add income"));
    // The onChange should have been called with the new item
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
    const addedItem = lastCall[0][0];
    expect(addedItem.category).toBe("Stock Sale");
    expect(addedItem.incomeType).toBe("capital-gains");
  });

  it("changes income type on existing row via selector", async () => {
    const onChange = vi.fn();
    const items = [{ id: "i1", category: "Salary", amount: 5000 }];
    const user = userEvent.setup();
    render(<IncomeEntry items={items} onChange={onChange} />);
    await user.selectOptions(screen.getByTestId("income-type-i1"), "capital-gains");
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
    expect(lastCall[0][0].incomeType).toBe("capital-gains");
  });

  it("styles capital-gains income type selector with amber colors", () => {
    const items = [
      { id: "i1", category: "Stock Sale", amount: 5000, incomeType: "capital-gains" as const },
    ];
    render(<IncomeEntry items={items} />);
    const selector = screen.getByTestId("income-type-i1");
    expect(selector.className).toContain("border-amber-300");
    expect(selector.className).toContain("text-amber-700");
  });
});
