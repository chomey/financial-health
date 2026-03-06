import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import WithdrawalTaxSummary from "@/components/WithdrawalTaxSummary";

describe("WithdrawalTaxSummary pill overflow fix", () => {
  const baseProps = {
    taxDragMonths: 2,
    withdrawalOrder: [
      "My Very Long Account Name TFSA",
      "Another Super Long Brokerage Name",
      "Yet Another Extended RRSP Account",
    ],
    accountsByTreatment: {
      taxFree: { categories: ["TFSA"], total: 20000 },
      taxDeferred: { categories: ["RRSP"], total: 30000 },
      taxable: { categories: ["Brokerage"], total: 10000 },
    },
    homeCurrency: "USD",
  };

  it("withdrawal order container uses flex-wrap for wrapping", () => {
    render(<WithdrawalTaxSummary {...baseProps} />);
    const pills = screen.getByText("Suggested withdrawal order:").nextElementSibling;
    expect(pills).toBeTruthy();
    expect(pills!.className).toContain("flex-wrap");
    expect(pills!.className).not.toContain("items-center");
  });

  it("account name pills have max-w and truncate classes", () => {
    render(<WithdrawalTaxSummary {...baseProps} />);
    const pill = screen.getByText("My Very Long Account Name TFSA");
    expect(pill.className).toContain("max-w-[150px]");
    expect(pill.className).toContain("truncate");
  });
});
