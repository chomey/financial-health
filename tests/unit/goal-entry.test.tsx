import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GoalEntry from "@/components/GoalEntry";

describe("GoalEntry component", () => {
  it("renders the Goals heading", () => {
    render(<GoalEntry />);
    expect(screen.getByText("Goals")).toBeInTheDocument();
  });

  it("renders mock goals on load", () => {
    render(<GoalEntry />);
    expect(screen.getByText("Rainy Day Fund")).toBeInTheDocument();
    expect(screen.getByText("New Car")).toBeInTheDocument();
    expect(screen.getByText("Vacation")).toBeInTheDocument();
  });

  it("displays formatted current and target amounts", () => {
    render(<GoalEntry />);
    expect(screen.getByText("$14,500")).toBeInTheDocument();
    expect(screen.getByText("$20,000")).toBeInTheDocument();
    expect(screen.getByText("$13,500")).toBeInTheDocument();
    expect(screen.getByText("$42,000")).toBeInTheDocument();
    expect(screen.getByText("$6,200")).toBeInTheDocument();
    expect(screen.getByText("$6,500")).toBeInTheDocument();
  });

  it("renders progress bars for each goal", () => {
    render(<GoalEntry />);
    const progressBars = screen.getAllByRole("progressbar");
    expect(progressBars.length).toBe(3);
  });

  it("shows correct progress percentages on progress bars", () => {
    render(<GoalEntry />);
    const progressBars = screen.getAllByRole("progressbar");
    // Rainy Day Fund: 14500/20000 = 73%
    expect(progressBars[0]).toHaveAttribute("aria-valuenow", "73");
    // New Car: 13500/42000 = 32%
    expect(progressBars[1]).toHaveAttribute("aria-valuenow", "32");
    // Vacation: 6200/6500 = 95%
    expect(progressBars[2]).toHaveAttribute("aria-valuenow", "95");
  });

  it("renders the Add Goal button", () => {
    render(<GoalEntry />);
    expect(screen.getByText("+ Add Goal")).toBeInTheDocument();
  });

  it("shows add form when Add Goal is clicked", async () => {
    const user = userEvent.setup();
    render(<GoalEntry />);
    await user.click(screen.getByText("+ Add Goal"));
    expect(screen.getByLabelText("New goal name")).toBeInTheDocument();
    expect(screen.getByLabelText("New goal target amount")).toBeInTheDocument();
    expect(screen.getByLabelText("New goal current amount")).toBeInTheDocument();
  });

  it("deletes a goal when delete button is clicked", async () => {
    const user = userEvent.setup();
    render(<GoalEntry />);
    const deleteBtn = screen.getByLabelText("Delete Rainy Day Fund");
    await user.click(deleteBtn);
    expect(screen.queryByText("Rainy Day Fund")).not.toBeInTheDocument();
    // Other goals remain
    expect(screen.getByText("New Car")).toBeInTheDocument();
    expect(screen.getByText("Vacation")).toBeInTheDocument();
  });

  it("shows click-to-edit input when goal name is clicked", async () => {
    const user = userEvent.setup();
    render(<GoalEntry />);
    await user.click(screen.getByLabelText("Edit name for Rainy Day Fund"));
    expect(screen.getByLabelText("Edit goal name")).toBeInTheDocument();
  });

  it("shows click-to-edit input when current amount is clicked", async () => {
    const user = userEvent.setup();
    render(<GoalEntry />);
    await user.click(
      screen.getByLabelText(/Edit saved amount for Rainy Day Fund, currently/)
    );
    expect(
      screen.getByLabelText("Edit saved amount for Rainy Day Fund")
    ).toBeInTheDocument();
  });

  it("shows click-to-edit input when target amount is clicked", async () => {
    const user = userEvent.setup();
    render(<GoalEntry />);
    await user.click(
      screen.getByLabelText(/Edit target amount for Rainy Day Fund, currently/)
    );
    expect(
      screen.getByLabelText("Edit target amount for Rainy Day Fund")
    ).toBeInTheDocument();
  });

  it("has goal items list with proper role", () => {
    render(<GoalEntry />);
    expect(
      screen.getByRole("list", { name: "Goal items" })
    ).toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBe(3);
  });

  it("shows empty state when all goals are deleted", async () => {
    const user = userEvent.setup();
    render(<GoalEntry />);
    await user.click(screen.getByLabelText("Delete Rainy Day Fund"));
    await user.click(screen.getByLabelText("Delete New Car"));
    await user.click(screen.getByLabelText("Delete Vacation"));
    expect(
      screen.getByText(
        "Set financial goals to track your progress toward what matters most."
      )
    ).toBeInTheDocument();
  });

  it("adds a new goal with name, target, and current amount", async () => {
    const user = userEvent.setup();
    render(<GoalEntry />);
    await user.click(screen.getByText("+ Add Goal"));
    await user.type(screen.getByLabelText("New goal name"), "House Down Payment");
    await user.type(screen.getByLabelText("New goal target amount"), "100000");
    await user.type(screen.getByLabelText("New goal current amount"), "25000");
    await user.click(screen.getByLabelText("Confirm add goal"));
    expect(screen.getByText("House Down Payment")).toBeInTheDocument();
    // 4 goals now
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBe(4);
  });
});
