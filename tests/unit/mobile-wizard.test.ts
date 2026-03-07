import { describe, it, expect } from "vitest";
import { buildWizardResult } from "@/components/MobileWizard";

const empty = {
  income: 0,
  housing: 0,
  food: 0,
  transport: 0,
  other: 0,
  savings: 0,
  registered1: 0,
  registered2: 0,
  debt1: 0,
  debt2: 0,
  debt3: 0,
};

describe("buildWizardResult", () => {
  it("returns empty arrays when all inputs are zero", () => {
    const result = buildWizardResult("CA", empty);
    expect(result.income).toHaveLength(0);
    expect(result.expenses).toHaveLength(0);
    expect(result.assets).toHaveLength(0);
    expect(result.debts).toHaveLength(0);
  });

  it("creates a monthly employment income item for non-zero income", () => {
    const result = buildWizardResult("CA", { ...empty, income: 5000 });
    expect(result.income).toHaveLength(1);
    expect(result.income[0]).toMatchObject({
      category: "Employment Income",
      amount: 5000,
      frequency: "monthly",
    });
  });

  it("does not create income item when income is zero", () => {
    const result = buildWizardResult("CA", { ...empty, income: 0 });
    expect(result.income).toHaveLength(0);
  });

  it("creates expense items for non-zero expense categories", () => {
    const result = buildWizardResult("CA", { ...empty, housing: 1500, food: 600, transport: 300, other: 500 });
    expect(result.expenses).toHaveLength(4);
    const cats = result.expenses.map((e) => e.category);
    expect(cats).toContain("Rent/Mortgage Payment");
    expect(cats).toContain("Groceries");
    expect(cats).toContain("Transportation");
    expect(cats).toContain("Monthly Expenses");
  });

  it("omits expense categories with zero values", () => {
    const result = buildWizardResult("CA", { ...empty, housing: 1200 });
    expect(result.expenses).toHaveLength(1);
    expect(result.expenses[0].category).toBe("Rent/Mortgage Payment");
    expect(result.expenses[0].amount).toBe(1200);
  });

  it("creates CA registered account assets (TFSA, RRSP)", () => {
    const result = buildWizardResult("CA", { ...empty, savings: 5000, registered1: 10000, registered2: 20000 });
    const cats = result.assets.map((a) => a.category);
    expect(cats).toContain("Savings");
    expect(cats).toContain("TFSA");
    expect(cats).toContain("RRSP");
  });

  it("creates US registered account assets (Roth IRA, 401k)", () => {
    const result = buildWizardResult("US", { ...empty, registered1: 10000, registered2: 20000 });
    const cats = result.assets.map((a) => a.category);
    expect(cats).toContain("Roth IRA");
    expect(cats).toContain("401k");
    expect(cats).not.toContain("TFSA");
    expect(cats).not.toContain("RRSP");
  });

  it("omits asset categories with zero values", () => {
    const result = buildWizardResult("CA", { ...empty, savings: 10000 });
    expect(result.assets).toHaveLength(1);
    expect(result.assets[0].category).toBe("Savings");
  });

  it("creates all three debt categories when non-zero", () => {
    const result = buildWizardResult("CA", { ...empty, debt1: 15000, debt2: 3000, debt3: 10000 });
    expect(result.debts).toHaveLength(3);
    const cats = result.debts.map((d) => d.category);
    expect(cats).toContain("Student Loan");
    expect(cats).toContain("Credit Card");
    expect(cats).toContain("Car Loan");
  });

  it("omits zero-value debts", () => {
    const result = buildWizardResult("CA", { ...empty, debt2: 5000 });
    expect(result.debts).toHaveLength(1);
    expect(result.debts[0].category).toBe("Credit Card");
    expect(result.debts[0].amount).toBe(5000);
  });

  it("stores correct amounts for all items", () => {
    const result = buildWizardResult("CA", {
      income: 6000,
      housing: 1800,
      food: 700,
      transport: 350,
      other: 400,
      savings: 12000,
      registered1: 25000,
      registered2: 40000,
      debt1: 20000,
      debt2: 0,
      debt3: 15000,
    });
    expect(result.income[0].amount).toBe(6000);
    expect(result.expenses.find((e) => e.category === "Groceries")?.amount).toBe(700);
    expect(result.assets.find((a) => a.category === "TFSA")?.amount).toBe(25000);
    expect(result.debts.find((d) => d.category === "Car Loan")?.amount).toBe(15000);
    expect(result.debts).toHaveLength(2); // no credit card (zero)
  });
});
