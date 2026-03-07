import { describe, it, expect } from "vitest";
import {
  getAllCategorySuggestions,
  getDefaultRoi,
  shouldShowRoiTaxToggle,
  getAssetCategoryFlag,
  US_ASSET_CATEGORIES,
} from "@/components/AssetEntry";
import { getTaxTreatment } from "@/lib/withdrawal-tax";
import { computeAllocationByCategory } from "@/components/AssetAllocationChart";
import type { Asset } from "@/components/AssetEntry";

describe("Roth 401k support", () => {
  describe("category suggestions", () => {
    it("includes Roth 401k in all category suggestions", () => {
      const all = getAllCategorySuggestions();
      expect(all).toContain("Roth 401k");
    });

    it("lists Roth 401k after 401k in the US suggestions", () => {
      const all = getAllCategorySuggestions();
      const idx401k = all.indexOf("401k");
      const idxRoth401k = all.indexOf("Roth 401k");
      expect(idxRoth401k).toBe(idx401k + 1);
    });

    it("is recognized as a US asset category", () => {
      expect(US_ASSET_CATEGORIES.has("Roth 401k")).toBe(true);
    });

    it("shows US flag for Roth 401k", () => {
      expect(getAssetCategoryFlag("Roth 401k")).toBe("\u{1F1FA}\u{1F1F8}");
    });
  });

  describe("default ROI", () => {
    it("returns 7% default ROI for Roth 401k", () => {
      expect(getDefaultRoi("Roth 401k")).toBe(7);
    });
  });

  describe("tax treatment", () => {
    it("classifies Roth 401k as tax-free", () => {
      expect(getTaxTreatment("Roth 401k")).toBe("tax-free");
    });
  });

  describe("ROI tax toggle", () => {
    it("hides ROI tax treatment toggle for Roth 401k (tax-sheltered)", () => {
      expect(shouldShowRoiTaxToggle("Roth 401k")).toBe(false);
    });
  });

  describe("asset allocation chart", () => {
    it("shows Roth 401k as its own slice", () => {
      const assets: Asset[] = [
        { id: "1", category: "Roth 401k", amount: 50000 },
        { id: "2", category: "Savings", amount: 10000 },
      ];
      const result = computeAllocationByCategory(assets, [], []);
      const roth401k = result.find((s) => s.name === "Roth 401k");
      expect(roth401k).toBeDefined();
      expect(roth401k!.value).toBe(50000);
    });

    it("shows Roth 401k and 401k as separate slices", () => {
      const assets: Asset[] = [
        { id: "1", category: "401k", amount: 30000 },
        { id: "2", category: "Roth 401k", amount: 20000 },
      ];
      const result = computeAllocationByCategory(assets, [], []);
      expect(result.find((s) => s.name === "401k")!.value).toBe(30000);
      expect(result.find((s) => s.name === "Roth 401k")!.value).toBe(20000);
    });
  });
});
