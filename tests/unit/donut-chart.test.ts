import { describe, it, expect } from "vitest";
import { computeDonutData } from "@/components/NetWorthDonutChart";
import type { Asset } from "@/components/AssetEntry";
import type { Debt } from "@/components/DebtEntry";
import type { Property } from "@/components/PropertyEntry";
import type { StockHolding } from "@/components/StockEntry";

const makeAsset = (overrides: Partial<Asset> & { id: string; category: string; amount: number }): Asset => ({
  ...overrides,
});

const makeDebt = (overrides: Partial<Debt> & { id: string; category: string; amount: number }): Debt => ({
  ...overrides,
});

const makeProperty = (overrides: Partial<Property> & { id: string; name: string; value: number; mortgage: number }): Property => ({
  ...overrides,
});

const makeStock = (overrides: Partial<StockHolding> & { id: string; ticker: string; shares: number }): StockHolding => ({
  lastFetchedPrice: 0,
  ...overrides,
});

describe("computeDonutData", () => {
  it("returns empty slices and zero net worth when no data", () => {
    const result = computeDonutData([], [], [], []);
    expect(result.slices).toHaveLength(0);
    expect(result.netWorth).toBe(0);
    expect(result.totalAssets).toBe(0);
    expect(result.totalDebts).toBe(0);
  });

  it("builds asset slices from savings", () => {
    const assets = [
      makeAsset({ id: "a1", category: "Savings", amount: 10000 }),
      makeAsset({ id: "a2", category: "TFSA", amount: 25000 }),
    ];
    const result = computeDonutData(assets, [], [], []);

    const assetSlices = result.slices.filter(s => s.type === "asset");
    expect(assetSlices).toHaveLength(2);
    expect(result.totalAssets).toBe(35000);
    expect(result.netWorth).toBe(35000);
    expect(result.totalDebts).toBe(0);
  });

  it("includes debt slices", () => {
    const assets = [makeAsset({ id: "a1", category: "Savings", amount: 50000 })];
    const debts = [makeDebt({ id: "d1", category: "Car Loan", amount: 15000 })];
    const result = computeDonutData(assets, debts, [], []);

    expect(result.slices).toHaveLength(2);
    expect(result.totalAssets).toBe(50000);
    expect(result.totalDebts).toBe(15000);
    expect(result.netWorth).toBe(35000);

    const debtSlice = result.slices.find(s => s.type === "debt")!;
    expect(debtSlice.name).toBe("Car Loan");
    expect(debtSlice.value).toBe(15000);
  });

  it("includes property equity as asset with isProperty flag", () => {
    const properties = [makeProperty({ id: "p1", name: "Home", value: 500000, mortgage: 300000 })];
    const result = computeDonutData([], [], properties, []);

    const equitySlice = result.slices.find(s => s.name === "Home Equity")!;
    expect(equitySlice).toBeDefined();
    expect(equitySlice.value).toBe(200000);
    expect(equitySlice.type).toBe("asset");
    expect(equitySlice.isProperty).toBe(true);

    const mortgageSlice = result.slices.find(s => s.name === "Home Mortgage")!;
    expect(mortgageSlice).toBeDefined();
    expect(mortgageSlice.value).toBe(300000);
    expect(mortgageSlice.type).toBe("debt");
  });

  it("includes stock holdings", () => {
    const stocks = [makeStock({ id: "s1", ticker: "AAPL", shares: 10, lastFetchedPrice: 150 })];
    const result = computeDonutData([], [], [], stocks);

    expect(result.slices).toHaveLength(1);
    expect(result.slices[0].name).toBe("Stocks");
    expect(result.slices[0].value).toBe(1500);
    expect(result.totalAssets).toBe(1500);
  });

  it("skips zero-value items", () => {
    const assets = [
      makeAsset({ id: "a1", category: "Savings", amount: 10000 }),
      makeAsset({ id: "a2", category: "Empty", amount: 0 }),
    ];
    const debts = [makeDebt({ id: "d1", category: "Paid Off", amount: 0 })];
    const result = computeDonutData(assets, debts, [], []);

    expect(result.slices).toHaveLength(1);
    expect(result.slices[0].name).toBe("Savings");
  });

  it("handles negative net worth", () => {
    const assets = [makeAsset({ id: "a1", category: "Savings", amount: 5000 })];
    const debts = [makeDebt({ id: "d1", category: "Student Loan", amount: 50000 })];
    const result = computeDonutData(assets, debts, [], []);

    expect(result.netWorth).toBe(-45000);
    expect(result.totalAssets).toBe(5000);
    expect(result.totalDebts).toBe(50000);
  });

  it("groups duplicate asset categories", () => {
    const assets = [
      makeAsset({ id: "a1", category: "Savings", amount: 5000 }),
      makeAsset({ id: "a2", category: "Savings", amount: 3000 }),
    ];
    const result = computeDonutData(assets, [], [], []);

    const savingsSlices = result.slices.filter(s => s.name === "Savings");
    expect(savingsSlices).toHaveLength(1);
    expect(savingsSlices[0].value).toBe(8000);
  });

  it("handles complex scenario with all types", () => {
    const assets = [
      makeAsset({ id: "a1", category: "RRSP", amount: 30000 }),
      makeAsset({ id: "a2", category: "Savings", amount: 10000 }),
    ];
    const debts = [makeDebt({ id: "d1", category: "Car Loan", amount: 8000 })];
    const properties = [makeProperty({ id: "p1", name: "Home", value: 400000, mortgage: 250000 })];
    const stocks = [makeStock({ id: "s1", ticker: "VFV", shares: 50, lastFetchedPrice: 100 })];

    const result = computeDonutData(assets, debts, properties, stocks);

    const assetSlices = result.slices.filter(s => s.type === "asset");
    const debtSlices = result.slices.filter(s => s.type === "debt");

    expect(assetSlices).toHaveLength(4); // RRSP, Savings, Stocks, Home Equity
    expect(debtSlices).toHaveLength(2); // Car Loan, Home Mortgage

    // Net worth: 30k + 10k + 5k + 150k (equity) - 8k - 250k = -63k
    expect(result.netWorth).toBe(-63000);
    expect(result.totalAssets).toBe(195000);
    expect(result.totalDebts).toBe(258000);
  });

  it("property equity slices have isProperty=true for distinct styling", () => {
    const properties = [
      makeProperty({ id: "p1", name: "Home", value: 300000, mortgage: 200000 }),
      makeProperty({ id: "p2", name: "Cottage", value: 150000, mortgage: 0 }),
    ];
    const result = computeDonutData([], [], properties, []);

    const propertySlices = result.slices.filter(s => s.isProperty);
    expect(propertySlices).toHaveLength(2);
    expect(propertySlices[0].name).toBe("Home Equity");
    expect(propertySlices[1].name).toBe("Cottage Equity");
  });
});
