import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AssetEntry from "@/components/AssetEntry";
import DebtEntry from "@/components/DebtEntry";
import IncomeEntry from "@/components/IncomeEntry";
import ExpenseEntry from "@/components/ExpenseEntry";
import GoalEntry from "@/components/GoalEntry";

describe("setState-during-render fix", () => {
  describe("AssetEntry", () => {
    it("calls onChange after adding an asset (via useEffect, not during render)", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(
        <AssetEntry items={[]} onChange={onChange} />
      );

      // Click Add Asset
      await user.click(screen.getByText("+ Add Asset"));
      // Type category
      await user.type(screen.getByLabelText("New asset category"), "Test");
      // Type amount
      await user.type(screen.getByLabelText("New asset amount"), "1000");
      // Click confirm
      await user.click(screen.getByLabelText("Confirm add asset"));

      // onChange should be called with the new list
      expect(onChange).toHaveBeenCalled();
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      expect(lastCall).toHaveLength(1);
      expect(lastCall[0].category).toBe("Test");
      expect(lastCall[0].amount).toBe(1000);
    });

    it("calls onChange after deleting an asset", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      const items = [
        { id: "a1", category: "Savings", amount: 5000 },
        { id: "a2", category: "Checking", amount: 3000 },
      ];
      render(<AssetEntry items={items} onChange={onChange} />);

      await user.click(screen.getByLabelText("Delete Savings"));

      expect(onChange).toHaveBeenCalled();
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      expect(lastCall).toHaveLength(1);
      expect(lastCall[0].category).toBe("Checking");
    });

    it("does not call onChange on initial mount", () => {
      const onChange = vi.fn();
      render(<AssetEntry items={[{ id: "1", category: "Test", amount: 100 }]} onChange={onChange} />);
      expect(onChange).not.toHaveBeenCalled();
    });

    it("does not call onChange when items prop changes (external sync)", () => {
      const onChange = vi.fn();
      const { rerender } = render(
        <AssetEntry items={[{ id: "1", category: "A", amount: 100 }]} onChange={onChange} />
      );
      rerender(
        <AssetEntry items={[{ id: "1", category: "B", amount: 200 }]} onChange={onChange} />
      );
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("DebtEntry", () => {
    it("calls onChange after adding a debt", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<DebtEntry items={[]} onChange={onChange} />);

      await user.click(screen.getByText("+ Add Debt"));
      await user.type(screen.getByLabelText("New debt category"), "Credit Card");
      await user.type(screen.getByLabelText("New debt amount"), "5000");
      await user.click(screen.getByLabelText("Confirm add debt"));

      expect(onChange).toHaveBeenCalled();
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      expect(lastCall).toHaveLength(1);
      expect(lastCall[0].category).toBe("Credit Card");
    });

    it("does not call onChange on initial mount", () => {
      const onChange = vi.fn();
      render(<DebtEntry items={[{ id: "1", category: "Mortgage", amount: 200000 }]} onChange={onChange} />);
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("IncomeEntry", () => {
    it("calls onChange after adding income", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<IncomeEntry items={[]} onChange={onChange} />);

      await user.click(screen.getByText("+ Add Income"));
      await user.type(screen.getByLabelText("New income category"), "Salary");
      await user.type(screen.getByLabelText("New income amount"), "3000");
      await user.click(screen.getByLabelText("Confirm add income"));

      expect(onChange).toHaveBeenCalled();
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      expect(lastCall).toHaveLength(1);
      expect(lastCall[0].category).toBe("Salary");
    });

    it("does not call onChange on initial mount", () => {
      const onChange = vi.fn();
      render(<IncomeEntry items={[{ id: "1", category: "Salary", amount: 5000 }]} onChange={onChange} />);
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("ExpenseEntry", () => {
    it("calls onChange after adding expense", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<ExpenseEntry items={[]} onChange={onChange} />);

      await user.click(screen.getByText("+ Add Expense"));
      await user.type(screen.getByLabelText("New expense category"), "Groceries");
      await user.type(screen.getByLabelText("New expense amount"), "400");
      await user.click(screen.getByLabelText("Confirm add expense"));

      expect(onChange).toHaveBeenCalled();
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      expect(lastCall).toHaveLength(1);
      expect(lastCall[0].category).toBe("Groceries");
    });

    it("does not call onChange on initial mount", () => {
      const onChange = vi.fn();
      render(<ExpenseEntry items={[{ id: "1", category: "Rent", amount: 2000 }]} onChange={onChange} />);
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("GoalEntry", () => {
    it("calls onChange after adding a goal", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<GoalEntry items={[]} onChange={onChange} />);

      await user.click(screen.getByText("+ Add Goal"));
      await user.type(screen.getByLabelText("New goal name"), "Vacation");
      await user.type(screen.getByLabelText("New goal target amount"), "5000");
      await user.type(screen.getByLabelText("New goal current amount"), "1000");
      await user.click(screen.getByLabelText("Confirm add goal"));

      expect(onChange).toHaveBeenCalled();
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      expect(lastCall).toHaveLength(1);
      expect(lastCall[0].name).toBe("Vacation");
    });

    it("does not call onChange on initial mount", () => {
      const onChange = vi.fn();
      render(<GoalEntry items={[{ id: "1", name: "Car", targetAmount: 20000, currentAmount: 5000 }]} onChange={onChange} />);
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
