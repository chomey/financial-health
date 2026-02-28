import { describe, it, expect } from "vitest";
import { computeWaterfallData } from "@/components/NetWorthWaterfallChart";
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

describe("computeWaterfallData", () => {
  it("returns only total segment when no data", () => {
    const result = computeWaterfallData([], [], [], []);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Net Worth");
    expect(result[0].value).toBe(0);
    expect(result[0].type).toBe("total");
  });

  it("builds segments from assets only", () => {
    const assets = [
      makeAsset({ id: "a1", category: "Savings", amount: 10000 }),
      makeAsset({ id: "a2", category: "TFSA", amount: 25000 }),
    ];
    const result = computeWaterfallData(assets, [], [], []);

    // Should have 2 asset segments + 1 total = 3
    expect(result).toHaveLength(3);

    // Sorted by value descending, TFSA first
    expect(result[0].name).toBe("TFSA");
    expect(result[0].value).toBe(25000);
    expect(result[0].base).toBe(0);
    expect(result[0].cumulative).toBe(25000);
    expect(result[0].type).toBe("asset");

    expect(result[1].name).toBe("Savings");
    expect(result[1].value).toBe(10000);
    expect(result[1].base).toBe(25000);
    expect(result[1].cumulative).toBe(35000);
    expect(result[1].type).toBe("asset");

    // Total
    expect(result[2].name).toBe("Net Worth");
    expect(result[2].value).toBe(35000);
    expect(result[2].type).toBe("total");
  });

  it("builds segments from assets and debts", () => {
    const assets = [makeAsset({ id: "a1", category: "Savings", amount: 50000 })];
    const debts = [makeDebt({ id: "d1", category: "Car Loan", amount: 15000 })];
    const result = computeWaterfallData(assets, debts, [], []);

    expect(result).toHaveLength(3);

    // Asset
    expect(result[0].name).toBe("Savings");
    expect(result[0].type).toBe("asset");
    expect(result[0].cumulative).toBe(50000);

    // Debt
    expect(result[1].name).toBe("Car Loan");
    expect(result[1].type).toBe("debt");
    expect(result[1].value).toBe(-15000);
    expect(result[1].visible).toBe(15000);
    expect(result[1].cumulative).toBe(35000);
    // Debt base should be at the cumulative value (where the bar starts from bottom)
    expect(result[1].base).toBe(35000);

    // Total
    expect(result[2].name).toBe("Net Worth");
    expect(result[2].value).toBe(35000);
  });

  it("includes property equity and mortgage separately", () => {
    const properties = [makeProperty({ id: "p1", name: "Home", value: 500000, mortgage: 300000 })];
    const result = computeWaterfallData([], [], properties, []);

    expect(result).toHaveLength(3);

    // Property equity as asset
    expect(result[0].name).toBe("Home Equity");
    expect(result[0].value).toBe(200000);
    expect(result[0].type).toBe("asset");

    // Mortgage as debt
    expect(result[1].name).toBe("Home Mortgage");
    expect(result[1].value).toBe(-300000);
    expect(result[1].type).toBe("debt");

    // Net worth = equity - mortgage = 200000 - 300000 = -100000
    expect(result[2].name).toBe("Net Worth");
    expect(result[2].value).toBe(-100000);
  });

  it("includes stock holdings", () => {
    const stocks = [makeStock({ id: "s1", ticker: "AAPL", shares: 10, lastFetchedPrice: 150 })];
    const result = computeWaterfallData([], [], [], stocks);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Stocks");
    expect(result[0].value).toBe(1500);
    expect(result[0].type).toBe("asset");
  });

  it("skips zero-value items", () => {
    const assets = [
      makeAsset({ id: "a1", category: "Savings", amount: 10000 }),
      makeAsset({ id: "a2", category: "Empty", amount: 0 }),
    ];
    const debts = [makeDebt({ id: "d1", category: "Paid Off", amount: 0 })];
    const result = computeWaterfallData(assets, debts, [], []);

    // Only Savings + Net Worth total
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Savings");
  });

  it("handles negative net worth correctly", () => {
    const assets = [makeAsset({ id: "a1", category: "Savings", amount: 5000 })];
    const debts = [makeDebt({ id: "d1", category: "Student Loan", amount: 50000 })];
    const result = computeWaterfallData(assets, debts, [], []);

    const total = result.find(s => s.name === "Net Worth")!;
    expect(total.value).toBe(-45000);
    expect(total.type).toBe("total");
    // For negative net worth, base should be at the net worth value
    expect(total.base).toBe(-45000);
    expect(total.visible).toBe(45000);
  });

  it("groups duplicate asset categories", () => {
    const assets = [
      makeAsset({ id: "a1", category: "Savings", amount: 5000 }),
      makeAsset({ id: "a2", category: "Savings", amount: 3000 }),
    ];
    const result = computeWaterfallData(assets, [], [], []);

    // Should merge into one "Savings" segment
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Savings");
    expect(result[0].value).toBe(8000);
  });

  it("handles complex scenario with all types", () => {
    const assets = [
      makeAsset({ id: "a1", category: "RRSP", amount: 30000 }),
      makeAsset({ id: "a2", category: "Savings", amount: 10000 }),
    ];
    const debts = [makeDebt({ id: "d1", category: "Car Loan", amount: 8000 })];
    const properties = [makeProperty({ id: "p1", name: "Home", value: 400000, mortgage: 250000 })];
    const stocks = [makeStock({ id: "s1", ticker: "VFV", shares: 50, lastFetchedPrice: 100 })];

    const result = computeWaterfallData(assets, debts, properties, stocks);

    // Assets: RRSP(30k), Home Equity(150k), Savings(10k), Stocks(5k) = 4 assets
    // Debts: Home Mortgage(250k), Car Loan(8k) = 2 debts
    // Total = 1
    expect(result).toHaveLength(7);

    // Verify all types are present
    const assetSegments = result.filter(s => s.type === "asset");
    const debtSegments = result.filter(s => s.type === "debt");
    const totalSegment = result.find(s => s.type === "total")!;

    expect(assetSegments).toHaveLength(4);
    expect(debtSegments).toHaveLength(2);

    // Net worth: 30k + 10k + 5k + 150k (equity) - 8k - 250k = -63k
    expect(totalSegment.value).toBe(-63000);
  });
});
