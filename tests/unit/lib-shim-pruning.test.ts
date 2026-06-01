import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getAllCreditCategories } from "@/lib/tax-credits";

const SHIMS = [
  "tax-tables.ts",
  "government-retirement.ts",
  "sample-profiles.ts",
  "tax-credits.ts",
  "withdrawal-tax.ts",
];

describe("pruned library shims", () => {
  it.each(SHIMS)("%s stays below 100 lines", (filename) => {
    const contents = readFileSync(resolve(process.cwd(), "src/lib", filename), "utf8");
    expect(contents.split("\n").length).toBeLessThan(100);
  });

  it("reads all tax-credit categories from country plugins", () => {
    expect(getAllCreditCategories("CA").some((category) => category.infoOnly)).toBe(true);
    expect(getAllCreditCategories("US").some((category) => category.infoOnly)).toBe(true);
    expect(getAllCreditCategories("AU").some((category) => category.infoOnly)).toBe(true);
  });
});
