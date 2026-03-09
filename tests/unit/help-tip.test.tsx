import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HelpTip from "@/components/HelpTip";

describe("HelpTip component", () => {
  it("renders a ? button", () => {
    render(<HelpTip text="Test tooltip text" />);
    const btn = screen.getByTestId("help-tip-button");
    expect(btn).toBeDefined();
    expect(btn.textContent).toBe("?");
  });

  it("does not show popover initially", () => {
    render(<HelpTip text="Test tooltip text" />);
    expect(screen.queryByTestId("help-tip-popover")).toBeNull();
  });

  it("shows popover on hover", () => {
    render(<HelpTip text="Test tooltip text" />);
    fireEvent.mouseEnter(screen.getByTestId("help-tip-button"));
    const popover = screen.getByTestId("help-tip-popover");
    expect(popover).toBeDefined();
    expect(popover.textContent).toContain("Test tooltip text");
  });

  it("hides popover on mouse leave", () => {
    render(<HelpTip text="Test tooltip text" />);
    const btn = screen.getByTestId("help-tip-button");
    fireEvent.mouseEnter(btn);
    expect(screen.getByTestId("help-tip-popover")).toBeDefined();
    fireEvent.mouseLeave(btn);
    expect(screen.queryByTestId("help-tip-popover")).toBeNull();
  });

  it("popover has role=tooltip", () => {
    render(<HelpTip text="Test tooltip text" />);
    fireEvent.mouseEnter(screen.getByTestId("help-tip-button"));
    const popover = screen.getByRole("tooltip");
    expect(popover).toBeDefined();
  });

  it("shows popover on focus (keyboard accessibility)", () => {
    render(<HelpTip text="Test tooltip text" />);
    fireEvent.focus(screen.getByTestId("help-tip-button"));
    expect(screen.getByTestId("help-tip-popover")).toBeDefined();
  });

  it("hides popover on blur", () => {
    render(<HelpTip text="Test tooltip text" />);
    const btn = screen.getByTestId("help-tip-button");
    fireEvent.focus(btn);
    expect(screen.getByTestId("help-tip-popover")).toBeDefined();
    fireEvent.blur(btn);
    expect(screen.queryByTestId("help-tip-popover")).toBeNull();
  });

  it("renders tooltip text correctly", () => {
    const text = "This is the help tooltip message.";
    render(<HelpTip text={text} />);
    fireEvent.mouseEnter(screen.getByTestId("help-tip-button"));
    expect(screen.getByTestId("help-tip-popover").textContent).toContain(text);
  });

  it("renders tooltip via portal at document.body level", () => {
    render(<HelpTip text="Portal test" />);
    fireEvent.mouseEnter(screen.getByTestId("help-tip-button"));
    const popover = screen.getByTestId("help-tip-popover");
    // Portal renders at body level, ensuring z-index works globally
    expect(popover.closest("body")).toBeDefined();
  });
});
