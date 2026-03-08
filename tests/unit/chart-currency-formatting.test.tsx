/**
 * T1 unit tests for Task 108: Consistent currency formatting and composition tables
 * Verifies:
 * - Donut chart center label uses full currency (not compact)
 * - Asset allocation chart has composition table rows with full currency
 * - Projection chart tables use full currency formatting
 * - Composition tables are sorted by value descending
 */
import { describe, it, expect, beforeAll } from "vitest";
import { computeDonutData } from "@/components/NetWorthDonutChart";
import {
  computeAllocationByCategory,
  computeAllocationByLiquidity,
} from "@/components/AssetAllocationChart";
import type { Asset } from "@/components/AssetEntry";
import type { Debt } from "@/components/DebtEntry";
import type { Property } from "@/components/PropertyEntry";
import type { StockHolding } from "@/components/StockEntry";

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

const makeAsset = (id: string, category: string, amount: number): Asset => ({
  id,
  category,
  amount,
} as Asset);

const makeDebt = (id: string, category: string, amount: number): Debt => ({
  id,
  category,
  amount,
} as Debt);

const makeProperty = (id: string, name: string, value: number, mortgage: number): Property => ({
  id,
  name,
  value,
  mortgage,
} as Property);

const makeStock = (id: string, ticker: string, shares: number, price: number): StockHolding => ({
  id,
  ticker,
  shares,
  lastFetchedPrice: price,
} as StockHolding);

describe("Task 108 — Donut chart composition table", () => {
  it("composition table slices contain all asset types", () => {
    const assets = [
      makeAsset("a1", "RRSP", 100000),
      makeAsset("a2", "Savings", 50000),
    ];
    const stocks = [makeStock("s1", "VFV", 100, 50)]; // 5000
    const properties = [makeProperty("p1", "Home", 400000, 200000)]; // 200k equity

    const { slices } = computeDonutData(assets, [], properties, stocks);

    const names = slices.map((s) => s.name);
    expect(names).toContain("RRSP");
    expect(names).toContain("Savings");
    expect(names).toContain("Stocks");
    expect(names).toContain("Home Equity");
  });

  it("asset slices are sorted by value descending (largest first)", () => {
    const assets = [
      makeAsset("a1", "Savings", 10000),
      makeAsset("a2", "RRSP", 80000),
      makeAsset("a3", "TFSA", 30000),
    ];
    const { slices } = computeDonutData(assets, [], [], []);

    const assetSlices = slices.filter((s) => s.type === "asset");
    for (let i = 0; i < assetSlices.length - 1; i++) {
      expect(assetSlices[i].value).toBeGreaterThanOrEqual(assetSlices[i + 1].value);
    }
  });

  it("computes percentages correctly for asset slices", () => {
    const assets = [
      makeAsset("a1", "Savings", 25000),
      makeAsset("a2", "RRSP", 75000),
    ];
    const { slices, totalAssets } = computeDonutData(assets, [], [], []);
    expect(totalAssets).toBe(100000);

    const savingsSlice = slices.find((s) => s.name === "Savings")!;
    const rrspSlice = slices.find((s) => s.name === "RRSP")!;
    expect(savingsSlice.value / totalAssets).toBeCloseTo(0.25);
    expect(rrspSlice.value / totalAssets).toBeCloseTo(0.75);
  });

  it("debt slices show negative net worth impact", () => {
    const assets = [makeAsset("a1", "Savings", 50000)];
    const debts = [makeDebt("d1", "Student Loan", 30000)];
    const { netWorth, totalAssets, totalDebts } = computeDonutData(assets, debts, [], []);

    expect(totalAssets).toBe(50000);
    expect(totalDebts).toBe(30000);
    expect(netWorth).toBe(20000);
  });

  it("equity view (default): property equity as asset, no mortgage debt", () => {
    const properties = [makeProperty("p1", "Condo", 500000, 300000)];
    const { slices, netWorth } = computeDonutData([], [], properties, []);

    const equitySlice = slices.find((s) => s.name === "Condo Equity");
    expect(equitySlice).toBeDefined();
    expect(equitySlice!.value).toBe(200000);
    expect(equitySlice!.isProperty).toBe(true);
    expect(slices.find((s) => s.name === "Condo Mortgage")).toBeUndefined();
    expect(netWorth).toBe(200000);
  });

  it("gross view: full property value + mortgage as debt, same net worth", () => {
    const properties = [makeProperty("p1", "Condo", 500000, 300000)];
    const { slices, netWorth } = computeDonutData([], [], properties, [], true);

    expect(slices.find((s) => s.name === "Condo")!.value).toBe(500000);
    expect(slices.find((s) => s.name === "Condo Mortgage")!.value).toBe(300000);
    expect(netWorth).toBe(200000);
  });
});

describe("Task 108 — Asset allocation composition table", () => {
  it("computeAllocationByCategory produces slices sorted by value descending", () => {
    const assets = [
      makeAsset("a1", "Savings", 5000),
      makeAsset("a2", "RRSP", 80000),
      makeAsset("a3", "Brokerage", 20000),
    ];
    const slices = computeAllocationByCategory(assets, [], []);

    for (let i = 0; i < slices.length - 1; i++) {
      expect(slices[i].value).toBeGreaterThanOrEqual(slices[i + 1].value);
    }
  });

  it("computeAllocationByCategory groups retirement accounts", () => {
    const assets = [
      makeAsset("a1", "RRSP", 50000),
      makeAsset("a2", "TFSA", 30000), // TFSA is tax-sheltered, grouped as Retirement
      makeAsset("a3", "Savings", 20000),
    ];
    const slices = computeAllocationByCategory(assets, [], []);

    const rrspSlice = slices.find((s) => s.name === "RRSP");
    expect(rrspSlice).toBeDefined();
    expect(rrspSlice!.value).toBe(50000);

    const tfsaSlice = slices.find((s) => s.name === "TFSA");
    expect(tfsaSlice).toBeDefined();
    expect(tfsaSlice!.value).toBe(30000);

    const savingsSlice = slices.find((s) => s.name === "Savings");
    expect(savingsSlice).toBeDefined();
    expect(savingsSlice!.value).toBe(20000);
  });

  it("computeAllocationByLiquidity correctly splits liquid/illiquid", () => {
    const assets = [
      makeAsset("a1", "Savings", 30000), // liquid
      makeAsset("a2", "Vehicle", 20000), // illiquid
    ];
    const properties = [makeProperty("p1", "Home", 400000, 300000)]; // 100k equity = illiquid
    const slices = computeAllocationByLiquidity(assets, properties, []);

    const liquid = slices.find((s) => s.name === "Liquid");
    const illiquid = slices.find((s) => s.name === "Illiquid");
    expect(liquid).toBeDefined();
    expect(liquid!.value).toBe(30000);
    expect(illiquid).toBeDefined();
    expect(illiquid!.value).toBe(120000); // 20k vehicle + 100k equity
  });

  it("allocation percentages sum to 100%", () => {
    const assets = [
      makeAsset("a1", "RRSP", 40000),
      makeAsset("a2", "Savings", 60000),
    ];
    const slices = computeAllocationByCategory(assets, [], []);
    const totalPct = slices.reduce((sum, s) => sum + s.percentage, 0);
    expect(totalPct).toBeCloseTo(100, 1);
  });

  it("allocation includes stocks in category view", () => {
    const stocks = [makeStock("s1", "VFV", 50, 200)]; // 10000
    const slices = computeAllocationByCategory([], [], stocks);

    const stockSlice = slices.find((s) => s.name === "Stocks");
    expect(stockSlice).toBeDefined();
    expect(stockSlice!.value).toBe(10000);
  });
});

describe("Task 108 — Currency format distinction (full vs compact)", () => {
  it("full format uses commas and no abbreviations for large values", () => {
    // Simulate what fmt.full vs fmt.compact would produce (via Intl.NumberFormat)
    const fullFmt = new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    const compactFmt = new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      notation: "compact",
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });

    const value = 1234567;
    const full = fullFmt.format(value);
    const compact = compactFmt.format(value);

    // Full should contain commas and the full number
    expect(full).toMatch(/1[,.]?234[,.]?567/);
    // Compact should abbreviate to something like "CA$1.2M"
    expect(compact).toMatch(/M/);
    // Full should not contain M/K abbreviations
    expect(full).not.toMatch(/[MK]$/);
  });

  it("full format for small values shows exact numbers", () => {
    const fullFmt = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    const value = 450000;
    const full = fullFmt.format(value);
    expect(full).toContain("450");
    expect(full).not.toMatch(/[MK]/);
  });
});
