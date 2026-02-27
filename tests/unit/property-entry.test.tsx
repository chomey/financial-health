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
});
