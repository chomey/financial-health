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

  it("shows popover on click", () => {
    render(<HelpTip text="Test tooltip text" />);
    fireEvent.click(screen.getByTestId("help-tip-button"));
    const popover = screen.getByTestId("help-tip-popover");
    expect(popover).toBeDefined();
    expect(popover.textContent).toContain("Test tooltip text");
  });

  it("hides popover on second click", () => {
    render(<HelpTip text="Test tooltip text" />);
    const btn = screen.getByTestId("help-tip-button");
    fireEvent.click(btn);
    expect(screen.getByTestId("help-tip-popover")).toBeDefined();
    fireEvent.click(btn);
    expect(screen.queryByTestId("help-tip-popover")).toBeNull();
  });

  it("popover has role=tooltip", () => {
    render(<HelpTip text="Test tooltip text" />);
    fireEvent.click(screen.getByTestId("help-tip-button"));
    const popover = screen.getByRole("tooltip");
    expect(popover).toBeDefined();
  });

  it("button has aria-expanded=false when closed", () => {
    render(<HelpTip text="Test tooltip text" />);
    const btn = screen.getByTestId("help-tip-button");
    expect(btn.getAttribute("aria-expanded")).toBe("false");
  });

  it("button has aria-expanded=true when open", () => {
    render(<HelpTip text="Test tooltip text" />);
    const btn = screen.getByTestId("help-tip-button");
    fireEvent.click(btn);
    expect(btn.getAttribute("aria-expanded")).toBe("true");
  });

  it("renders tooltip text correctly", () => {
    const text = "This is the help tooltip message.";
    render(<HelpTip text={text} />);
    fireEvent.click(screen.getByTestId("help-tip-button"));
    expect(screen.getByTestId("help-tip-popover").textContent).toContain(text);
  });

  it("closes on outside mousedown", () => {
    render(
      <div>
        <HelpTip text="Test tooltip text" />
        <div data-testid="outside">Outside</div>
      </div>
    );
    fireEvent.click(screen.getByTestId("help-tip-button"));
    expect(screen.getByTestId("help-tip-popover")).toBeDefined();
    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(screen.queryByTestId("help-tip-popover")).toBeNull();
  });
});
