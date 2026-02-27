import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PropertyEntry from "@/components/PropertyEntry";
import type { Property } from "@/components/PropertyEntry";

describe("PropertyEntry component", () => {
  it("renders the Property heading", () => {
    render(<PropertyEntry />);
    expect(screen.getByText("Property")).toBeInTheDocument();
  });

  it("renders mock property on load", () => {
    render(<PropertyEntry />);
    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("displays formatted property value, mortgage, and equity", () => {
    render(<PropertyEntry />);
    expect(screen.getByText("$450,000")).toBeInTheDocument();
    expect(screen.getByText("$280,000")).toBeInTheDocument();
    expect(screen.getByText("$170,000")).toBeInTheDocument();
  });

  it("shows total equity", () => {
    render(<PropertyEntry />);
    expect(screen.getByText("Total Equity: $170,000")).toBeInTheDocument();
  });

  it("renders the Add Property button", () => {
    render(<PropertyEntry />);
    expect(screen.getByText("+ Add Property")).toBeInTheDocument();
  });

  it("shows add form when Add Property is clicked", async () => {
    const user = userEvent.setup();
    render(<PropertyEntry />);
    await user.click(screen.getByText("+ Add Property"));
    expect(screen.getByLabelText("New property name")).toBeInTheDocument();
    expect(screen.getByLabelText("New property value")).toBeInTheDocument();
    expect(screen.getByLabelText("New property mortgage")).toBeInTheDocument();
  });

  it("deletes a property when delete button is clicked", async () => {
    const user = userEvent.setup();
    render(<PropertyEntry />);
    const deleteBtn = screen.getByLabelText("Delete Home");
    await user.click(deleteBtn);
    expect(screen.queryByText("Home")).not.toBeInTheDocument();
    expect(screen.getByText("Total Equity: $0")).toBeInTheDocument();
  });

  it("shows empty state when all properties are deleted", async () => {
    const user = userEvent.setup();
    render(<PropertyEntry />);
    await user.click(screen.getByLabelText("Delete Home"));
    expect(
      screen.getByText("Add your home or other properties to see your full net worth.")
    ).toBeInTheDocument();
  });

  it("shows click-to-edit input when name is clicked", async () => {
    const user = userEvent.setup();
    render(<PropertyEntry />);
    await user.click(screen.getByLabelText("Edit name for Home"));
    expect(screen.getByLabelText("Edit property name")).toBeInTheDocument();
  });

  it("shows click-to-edit input when value is clicked", async () => {
    const user = userEvent.setup();
    render(<PropertyEntry />);
    await user.click(screen.getByLabelText(/Edit value for Home/));
    expect(screen.getByLabelText(/Edit value for Home/)).toBeInTheDocument();
  });

  it("shows click-to-edit input when mortgage is clicked", async () => {
    const user = userEvent.setup();
    render(<PropertyEntry />);
    await user.click(screen.getByLabelText(/Edit mortgage for Home/));
    expect(screen.getByLabelText(/Edit mortgage for Home/)).toBeInTheDocument();
  });

  it("has property items list with proper role", () => {
    render(<PropertyEntry />);
    expect(
      screen.getByRole("list", { name: "Property items" })
    ).toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBe(1);
  });

  it("computes equity correctly when mortgage exceeds value", () => {
    const items: Property[] = [
      { id: "p1", name: "Underwater", value: 200000, mortgage: 300000 },
    ];
    render(<PropertyEntry items={items} />);
    // Equity should be capped at 0 (not negative)
    expect(screen.getByText("$0")).toBeInTheDocument();
    expect(screen.getByText("Total Equity: $0")).toBeInTheDocument();
  });

  it("calls onChange when a property is deleted", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const items: Property[] = [
      { id: "p1", name: "Home", value: 450000, mortgage: 280000 },
    ];
    render(<PropertyEntry items={items} onChange={onChange} />);
    await user.click(screen.getByLabelText("Delete Home"));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("shows suggested interest rate badge for default property", () => {
    render(<PropertyEntry />);
    const rateBadge = screen.getByTestId("rate-badge-p1");
    expect(rateBadge).toHaveTextContent("5% APR (suggested)");
  });

  it("shows suggested monthly payment badge for default property", () => {
    render(<PropertyEntry />);
    const paymentBadge = screen.getByTestId("payment-badge-p1");
    expect(paymentBadge).toHaveTextContent("/mo (suggested)");
  });

  it("shows term years placeholder for default property", () => {
    render(<PropertyEntry />);
    const amortBadge = screen.getByTestId("amort-badge-p1");
    expect(amortBadge).toHaveTextContent("Term years");
  });

  it("displays user-set interest rate as active badge", () => {
    const items: Property[] = [
      { id: "p1", name: "Home", value: 450000, mortgage: 280000, interestRate: 4.5 },
    ];
    render(<PropertyEntry items={items} />);
    const rateBadge = screen.getByTestId("rate-badge-p1");
    expect(rateBadge).toHaveTextContent("4.5% APR");
    expect(rateBadge).not.toHaveTextContent("suggested");
  });

  it("displays user-set monthly payment as active badge", () => {
    const items: Property[] = [
      { id: "p1", name: "Home", value: 450000, mortgage: 280000, monthlyPayment: 1800 },
    ];
    render(<PropertyEntry items={items} />);
    const paymentBadge = screen.getByTestId("payment-badge-p1");
    expect(paymentBadge).toHaveTextContent("$1,800/mo");
    expect(paymentBadge).not.toHaveTextContent("suggested");
  });

  it("displays user-set amortization years as active badge", () => {
    const items: Property[] = [
      { id: "p1", name: "Home", value: 450000, mortgage: 280000, amortizationYears: 20 },
    ];
    render(<PropertyEntry items={items} />);
    const amortBadge = screen.getByTestId("amort-badge-p1");
    expect(amortBadge).toHaveTextContent("20yr term");
  });

  it("shows computed mortgage info when payment is set", () => {
    const items: Property[] = [
      { id: "p1", name: "Home", value: 450000, mortgage: 280000, interestRate: 5, monthlyPayment: 1636 },
    ];
    render(<PropertyEntry items={items} />);
    const info = screen.getByTestId("mortgage-info-p1");
    expect(info).toBeInTheDocument();
    expect(info).toHaveTextContent("Monthly interest");
    expect(info).toHaveTextContent("Monthly principal");
    expect(info).toHaveTextContent("Total interest remaining");
    expect(info).toHaveTextContent("Estimated payoff");
  });

  it("shows warning when payment doesn't cover interest", () => {
    const items: Property[] = [
      { id: "p1", name: "Home", value: 450000, mortgage: 280000, interestRate: 10, monthlyPayment: 500 },
    ];
    render(<PropertyEntry items={items} />);
    const warning = screen.getByTestId("mortgage-warning-p1");
    expect(warning).toHaveTextContent("Payment doesn't cover monthly interest");
  });

  it("allows editing interest rate inline", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const items: Property[] = [
      { id: "p1", name: "Home", value: 450000, mortgage: 280000 },
    ];
    render(<PropertyEntry items={items} onChange={onChange} />);
    await user.click(screen.getByTestId("rate-badge-p1"));
    const input = screen.getByLabelText("Edit interest rate for Home");
    await user.clear(input);
    await user.type(input, "4.5");
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ interestRate: 4.5 }),
    ]);
  });
});
