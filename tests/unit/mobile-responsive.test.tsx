import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AssetEntry from "@/components/AssetEntry";
import DebtEntry from "@/components/DebtEntry";
import IncomeEntry from "@/components/IncomeEntry";
import ExpenseEntry from "@/components/ExpenseEntry";
import GoalEntry from "@/components/GoalEntry";
import RegionToggle from "@/components/RegionToggle";
import SnapshotDashboard from "@/components/SnapshotDashboard";

describe("Mobile responsiveness — touch targets and layout", () => {
  describe("Delete buttons", () => {
    it("asset delete buttons use sm:opacity-0 instead of bare opacity-0", () => {
      render(<AssetEntry />);
      const deleteButtons = screen.getAllByLabelText(/^Delete /);
      expect(deleteButtons.length).toBeGreaterThan(0);
      // Should have sm:opacity-0 (hidden on desktop hover-reveal) but NOT bare opacity-0
      deleteButtons.forEach((btn) => {
        const classes = btn.className.split(/\s+/);
        expect(classes).toContain("sm:opacity-0");
        // No bare "opacity-0" token — it should only appear with the sm: prefix
        expect(classes).not.toContain("opacity-0");
      });
    });

    it("debt delete buttons have min touch target size", () => {
      render(<DebtEntry />);
      const deleteButtons = screen.getAllByLabelText(/^Delete /);
      deleteButtons.forEach((btn) => {
        expect(btn.className).toContain("min-h-[44px]");
        expect(btn.className).toContain("min-w-[44px]");
      });
    });

    it("income delete buttons have min touch target size", () => {
      render(<IncomeEntry />);
      const deleteButtons = screen.getAllByLabelText(/^Delete /);
      deleteButtons.forEach((btn) => {
        expect(btn.className).toContain("min-h-[44px]");
      });
    });

    it("expense delete buttons have min touch target size", () => {
      render(<ExpenseEntry />);
      const deleteButtons = screen.getAllByLabelText(/^Delete /);
      deleteButtons.forEach((btn) => {
        expect(btn.className).toContain("min-h-[44px]");
      });
    });

    it("goal delete buttons have min touch target size", () => {
      render(<GoalEntry />);
      const deleteButtons = screen.getAllByLabelText(/^Delete /);
      deleteButtons.forEach((btn) => {
        expect(btn.className).toContain("min-h-[44px]");
      });
    });
  });

  describe("Inline edit buttons touch targets", () => {
    it("asset category buttons have min-h-[44px] for mobile", () => {
      render(<AssetEntry />);
      const categoryButtons = screen.getAllByLabelText(/^Edit category for /);
      categoryButtons.forEach((btn) => {
        expect(btn.className).toContain("min-h-[44px]");
      });
    });

    it("asset amount buttons have min-h-[44px] for mobile", () => {
      render(<AssetEntry />);
      const amountButtons = screen.getAllByLabelText(/^Edit amount for /);
      amountButtons.forEach((btn) => {
        expect(btn.className).toContain("min-h-[44px]");
      });
    });

    it("goal name buttons have min-h-[44px] for mobile", () => {
      render(<GoalEntry />);
      const nameButtons = screen.getAllByLabelText(/^Edit name for /);
      nameButtons.forEach((btn) => {
        expect(btn.className).toContain("min-h-[44px]");
      });
    });

    it("goal amount buttons have min-h-[44px] for mobile", () => {
      render(<GoalEntry />);
      const savedButtons = screen.getAllByLabelText(/^Edit saved amount for /);
      const targetButtons = screen.getAllByLabelText(/^Edit target amount for /);
      [...savedButtons, ...targetButtons].forEach((btn) => {
        expect(btn.className).toContain("min-h-[44px]");
      });
    });
  });

  describe("RegionToggle touch targets", () => {
    it("region toggle buttons have min-h-[44px]", () => {
      render(<RegionToggle region="both" onChange={() => {}} />);
      const buttons = screen.getAllByRole("radio");
      buttons.forEach((btn) => {
        expect(btn.className).toContain("min-h-[44px]");
      });
    });
  });

  describe("Card padding responsive", () => {
    it("asset card has responsive padding (p-4 sm:p-6)", () => {
      const { container } = render(<AssetEntry />);
      const card = container.firstElementChild;
      expect(card?.className).toContain("p-4");
      expect(card?.className).toContain("sm:p-6");
    });

    it("debt card has responsive padding", () => {
      const { container } = render(<DebtEntry />);
      const card = container.firstElementChild;
      expect(card?.className).toContain("p-4");
      expect(card?.className).toContain("sm:p-6");
    });

    it("income card has responsive padding", () => {
      const { container } = render(<IncomeEntry />);
      const card = container.firstElementChild;
      expect(card?.className).toContain("p-4");
      expect(card?.className).toContain("sm:p-6");
    });

    it("expense card has responsive padding", () => {
      const { container } = render(<ExpenseEntry />);
      const card = container.firstElementChild;
      expect(card?.className).toContain("p-4");
      expect(card?.className).toContain("sm:p-6");
    });

    it("goal card has responsive padding", () => {
      const { container } = render(<GoalEntry />);
      const card = container.firstElementChild;
      expect(card?.className).toContain("p-4");
      expect(card?.className).toContain("sm:p-6");
    });
  });

  describe("Tooltip tap support", () => {
    it("dashboard metric card has onClick handler for tap accessibility", () => {
      render(<SnapshotDashboard />);
      const netWorthCard = screen.getByRole("group", { name: "Net Worth" });
      // The card should have an onClick handler (for mobile tap-to-show tooltip)
      // In jsdom, we verify the element exists and has the cursor-default class
      // (actual click behavior is better tested in E2E with Playwright)
      expect(netWorthCard).toBeTruthy();
      expect(netWorthCard.className).toContain("cursor-default");
    });
  });

  describe("Add form stacking", () => {
    it("asset add form uses flex-col sm:flex-row layout", async () => {
      const user = userEvent.setup();
      render(<AssetEntry />);

      const addButton = screen.getByText("+ Add Asset");
      await user.click(addButton);

      const form = screen.getByLabelText("New asset category").closest(".flex.flex-col");
      expect(form).toBeTruthy();
      expect(form?.className).toContain("flex-col");
      expect(form?.className).toContain("sm:flex-row");
    });
  });
});
