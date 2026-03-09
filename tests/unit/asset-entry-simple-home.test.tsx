import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "../test-utils";
import userEvent from "@testing-library/user-event";
import AssetEntry, { SIMPLE_HOME_ID } from "@/components/AssetEntry";
import type { Property } from "@/components/PropertyEntry";

const mockAssets = [
  { id: "a1", category: "Savings", amount: 10000 },
];

describe("AssetEntry simple mode home subsection", () => {
  it("shows Home subsection in simple mode when onPropertiesChange is provided", () => {
    render(
      <AssetEntry
        items={mockAssets}
        properties={[]}
        onPropertiesChange={vi.fn()}
      />,
      { mode: "simple" }
    );
    expect(screen.getByTestId("simple-home-section")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("does not show Home subsection in advanced mode", () => {
    render(
      <AssetEntry
        items={mockAssets}
        properties={[]}
        onPropertiesChange={vi.fn()}
      />,
      { mode: "advanced" }
    );
    expect(screen.queryByTestId("simple-home-section")).not.toBeInTheDocument();
  });

  it("does not show Home subsection in simple mode when onPropertiesChange is not provided", () => {
    render(
      <AssetEntry items={mockAssets} />,
      { mode: "simple" }
    );
    expect(screen.queryByTestId("simple-home-section")).not.toBeInTheDocument();
  });

  it("displays $0 when no home value exists", () => {
    render(
      <AssetEntry
        items={mockAssets}
        properties={[]}
        onPropertiesChange={vi.fn()}
      />,
      { mode: "simple" }
    );
    expect(screen.getByTestId("simple-home-value")).toHaveTextContent("$0");
    expect(screen.getByTestId("simple-mortgage-value")).toHaveTextContent("$0");
  });

  it("displays existing home value and mortgage from properties", () => {
    const properties: Property[] = [
      { id: SIMPLE_HOME_ID, name: "Primary Residence", value: 500000, mortgage: 320000 },
    ];
    render(
      <AssetEntry
        items={mockAssets}
        properties={properties}
        onPropertiesChange={vi.fn()}
      />,
      { mode: "simple" }
    );
    expect(screen.getByTestId("simple-home-value")).toHaveTextContent("$500,000");
    expect(screen.getByTestId("simple-mortgage-value")).toHaveTextContent("$320,000");
  });

  it("calls onPropertiesChange with new property when home value is entered", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <AssetEntry
        items={mockAssets}
        properties={[]}
        onPropertiesChange={onChange}
      />,
      { mode: "simple" }
    );
    await user.click(screen.getByTestId("simple-home-value"));
    await user.type(screen.getByTestId("simple-home-value-input"), "400000");
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: SIMPLE_HOME_ID, name: "Primary Residence", value: 400000, mortgage: 0 }),
    ]);
  });

  it("calls onPropertiesChange with updated property when mortgage is entered", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const properties: Property[] = [
      { id: SIMPLE_HOME_ID, name: "Primary Residence", value: 400000, mortgage: 0 },
    ];
    render(
      <AssetEntry
        items={mockAssets}
        properties={properties}
        onPropertiesChange={onChange}
      />,
      { mode: "simple" }
    );
    await user.click(screen.getByTestId("simple-mortgage-value"));
    await user.type(screen.getByTestId("simple-mortgage-input"), "250000");
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: SIMPLE_HOME_ID, value: 400000, mortgage: 250000 }),
    ]);
  });

  it("removes property from list when both home value and mortgage are set to 0", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const properties: Property[] = [
      { id: SIMPLE_HOME_ID, name: "Primary Residence", value: 400000, mortgage: 0 },
    ];
    render(
      <AssetEntry
        items={mockAssets}
        properties={properties}
        onPropertiesChange={onChange}
      />,
      { mode: "simple" }
    );
    await user.click(screen.getByTestId("simple-home-value"));
    const input = screen.getByTestId("simple-home-value-input");
    await user.clear(input);
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("preserves non-simple-home properties when updating", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const properties: Property[] = [
      { id: "other-prop", name: "Rental", value: 200000, mortgage: 150000 },
    ];
    render(
      <AssetEntry
        items={mockAssets}
        properties={properties}
        onPropertiesChange={onChange}
      />,
      { mode: "simple" }
    );
    await user.click(screen.getByTestId("simple-home-value"));
    await user.type(screen.getByTestId("simple-home-value-input"), "500000");
    await user.keyboard("{Enter}");
    const called = onChange.mock.calls[0][0] as Property[];
    expect(called).toHaveLength(2);
    expect(called.find((p) => p.id === "other-prop")).toBeTruthy();
    expect(called.find((p) => p.id === SIMPLE_HOME_ID)).toBeTruthy();
  });

  it("shows 'Optional — leave blank if renting' helper text", () => {
    render(
      <AssetEntry
        items={mockAssets}
        properties={[]}
        onPropertiesChange={vi.fn()}
      />,
      { mode: "simple" }
    );
    expect(screen.getByText("Optional — leave blank if renting")).toBeInTheDocument();
  });
});
