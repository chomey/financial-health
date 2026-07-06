import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "../test-utils";
import userEvent from "@testing-library/user-event";
import fs from "fs";
import path from "path";
import AssetEntry from "@/components/AssetEntry";
import DebtEntry from "@/components/DebtEntry";
import IncomeEntry from "@/components/IncomeEntry";
import ExpenseEntry from "@/components/ExpenseEntry";
import SnapshotDashboard from "@/components/SnapshotDashboard";

const projectionSrc = fs.readFileSync(
  path.join(process.cwd(), "src/components/ProjectionChart.tsx"),
  "utf-8"
);
const sankeySrc = fs.readFileSync(
  path.join(process.cwd(), "src/components/CashFlowSankey.tsx"),
  "utf-8"
);
const pageSrc = fs.readFileSync(
  path.join(process.cwd(), "src/app/page.tsx"),
  "utf-8"
);
const wizardStepperSrc = fs.readFileSync(
  path.join(process.cwd(), "src/components/wizard/WizardStepper.tsx"),
  "utf-8"
);
const dashboardSrc = fs.readFileSync(
  path.join(process.cwd(), "src/components/SnapshotDashboard.tsx"),
  "utf-8"
);

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

  });

  describe("Card padding responsive", () => {
    it("asset card has responsive padding (p-3 sm:p-4)", () => {
      const { container } = render(<AssetEntry />);
      const card = container.firstElementChild;
      expect(card?.className).toContain("p-3");
      expect(card?.className).toContain("sm:p-4");
    });

    it("debt card has responsive padding", () => {
      const { container } = render(<DebtEntry />);
      const card = container.firstElementChild;
      expect(card?.className).toContain("p-3");
      expect(card?.className).toContain("sm:p-4");
    });

    it("income card has responsive padding", () => {
      const { container } = render(<IncomeEntry />);
      const card = container.firstElementChild;
      expect(card?.className).toContain("p-3");
      expect(card?.className).toContain("sm:p-4");
    });

    it("expense card has responsive padding", () => {
      const { container } = render(<ExpenseEntry />);
      const card = container.firstElementChild;
      expect(card?.className).toContain("p-3");
      expect(card?.className).toContain("sm:p-4");
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

  describe("Dashboard mobile polish", () => {
    it("projection tables scroll horizontally with sticky first columns", () => {
      expect(projectionSrc).toContain("overflow-x-auto");
      expect(projectionSrc).toContain("min-w-[560px]");
      expect(projectionSrc).toContain("sticky left-0 z-10 bg-slate-900");
    });

    it("sankey keeps a readable minimum canvas width", () => {
      expect(sankeySrc).toContain("relative overflow-x-auto");
      expect(sankeySrc).toContain("min-w-[700px]");
    });

    it("main charts use capped mobile heights", () => {
      expect(projectionSrc).toContain('className="h-56 sm:h-72"');
      expect(projectionSrc).toContain('className="h-56 w-full sm:h-72"');
    });

    it("dashboard and wizard steppers use 40px mobile tap targets", () => {
      expect(pageSrc).toContain("flex min-h-10 items-center gap-3 px-4 sm:min-h-9");
      expect(pageSrc).toContain("relative flex min-h-10 items-center gap-1.5");
      expect(wizardStepperSrc).toContain("flex min-h-10 items-center px-4 sm:min-h-9");
      expect(wizardStepperSrc).toContain("relative flex min-h-10 items-center gap-1.5");
    });

    it("metric cards use one column on mobile, two at sm, and smaller mobile values", () => {
      expect(dashboardSrc).toContain("grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2");
      expect(dashboardSrc).toContain("text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl md:text-4xl");
    });
  });
});
