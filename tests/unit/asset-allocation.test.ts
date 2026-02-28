import { describe, it, expect } from "vitest";
import {
  computeAllocationByCategory,
  computeAllocationByLiquidity,
} from "@/components/AssetAllocationChart";
import type { Asset } from "@/components/AssetEntry";
import type { Property } from "@/components/PropertyEntry";
import type { StockHolding } from "@/components/StockEntry";

describe("computeAllocationByCategory", () => {
  it("groups assets by category type", () => {
    const assets: Asset[] = [
      { id: "1", category: "TFSA", amount: 20000 },
      { id: "2", category: "RRSP", amount: 30000 },
      { id: "3", category: "Savings", amount: 10000 },
    ];
    const result = computeAllocationByCategory(assets, [], []);
    expect(result).toHaveLength(2);

    const retirement = result.find((s) => s.name === "Retirement Accounts");
    expect(retirement).toBeDefined();
    expect(retirement!.value).toBe(50000);

    const savings = result.find((s) => s.name === "Savings & Checking");
    expect(savings).toBeDefined();
    expect(savings!.value).toBe(10000);
  });

  it("includes property equity", () => {
    const properties: Property[] = [
      { id: "p1", name: "Home", value: 500000, mortgage: 300000 },
    ];
    const result = computeAllocationByCategory([], properties, []);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Property Equity");
    expect(result[0].value).toBe(200000);
  });

  it("includes stocks", () => {
    const stocks: StockHolding[] = [
      { id: "s1", ticker: "AAPL", shares: 10, lastFetchedPrice: 150 },
    ];
    const result = computeAllocationByCategory([], [], stocks);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Stocks");
    expect(result[0].value).toBe(1500);
  });

  it("calculates percentages correctly", () => {
    const assets: Asset[] = [
      { id: "1", category: "Savings", amount: 50000 },
      { id: "2", category: "TFSA", amount: 50000 },
    ];
    const result = computeAllocationByCategory(assets, [], []);
    for (const slice of result) {
      expect(slice.percentage).toBeCloseTo(50, 0);
    }
  });

  it("returns empty array when no assets", () => {
    const result = computeAllocationByCategory([], [], []);
    expect(result).toHaveLength(0);
  });

  it("skips zero-amount assets", () => {
    const assets: Asset[] = [
      { id: "1", category: "Savings", amount: 0 },
      { id: "2", category: "TFSA", amount: 10000 },
    ];
    const result = computeAllocationByCategory(assets, [], []);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Retirement Accounts");
  });

  it("sorts by value descending", () => {
    const assets: Asset[] = [
      { id: "1", category: "Savings", amount: 5000 },
      { id: "2", category: "TFSA", amount: 50000 },
      { id: "3", category: "Brokerage", amount: 20000 },
    ];
    const result = computeAllocationByCategory(assets, [], []);
    expect(result[0].value).toBeGreaterThanOrEqual(result[1].value);
    expect(result[1].value).toBeGreaterThanOrEqual(result[2].value);
  });

  it("groups US retirement accounts correctly", () => {
    const assets: Asset[] = [
      { id: "1", category: "401k", amount: 100000 },
      { id: "2", category: "Roth IRA", amount: 30000 },
      { id: "3", category: "HSA", amount: 5000 },
    ];
    const result = computeAllocationByCategory(assets, [], []);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Retirement Accounts");
    expect(result[0].value).toBe(135000);
  });

  it("groups 'Savings Account' into Savings & Checking", () => {
    const assets: Asset[] = [
      { id: "1", category: "Savings Account", amount: 5000 },
    ];
    const result = computeAllocationByCategory(assets, [], []);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Savings & Checking");
  });

  it("handles property with zero equity", () => {
    const properties: Property[] = [
      { id: "p1", name: "Home", value: 300000, mortgage: 350000 },
    ];
    const result = computeAllocationByCategory([], properties, []);
    expect(result).toHaveLength(0);
  });
});

describe("computeAllocationByLiquidity", () => {
  it("separates liquid and illiquid assets", () => {
    const assets: Asset[] = [
      { id: "1", category: "Savings", amount: 20000 },
      { id: "2", category: "Vehicle", amount: 15000 },
    ];
    const result = computeAllocationByLiquidity(assets, [], []);
    expect(result).toHaveLength(2);

    const liquid = result.find((s) => s.name === "Liquid");
    expect(liquid!.value).toBe(20000);

    const illiquid = result.find((s) => s.name === "Illiquid");
    expect(illiquid!.value).toBe(15000);
  });

  it("classifies stocks as liquid", () => {
    const stocks: StockHolding[] = [
      { id: "s1", ticker: "MSFT", shares: 5, lastFetchedPrice: 400 },
    ];
    const result = computeAllocationByLiquidity([], [], stocks);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Liquid");
    expect(result[0].value).toBe(2000);
  });

  it("classifies property equity as illiquid", () => {
    const properties: Property[] = [
      { id: "p1", name: "Home", value: 500000, mortgage: 300000 },
    ];
    const result = computeAllocationByLiquidity([], properties, []);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Illiquid");
    expect(result[0].value).toBe(200000);
  });

  it("returns empty array when no assets", () => {
    const result = computeAllocationByLiquidity([], [], []);
    expect(result).toHaveLength(0);
  });

  it("calculates percentages correctly", () => {
    const assets: Asset[] = [
      { id: "1", category: "Savings", amount: 75000 },
      { id: "2", category: "Vehicle", amount: 25000 },
    ];
    const result = computeAllocationByLiquidity(assets, [], []);
    const liquid = result.find((s) => s.name === "Liquid");
    expect(liquid!.percentage).toBeCloseTo(75, 0);
    const illiquid = result.find((s) => s.name === "Illiquid");
    expect(illiquid!.percentage).toBeCloseTo(25, 0);
  });
});
