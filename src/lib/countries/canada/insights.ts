import type { InsightProvider } from "@/lib/countries/types";
import type { Insight } from "@/lib/insights/types";

export const canadianInsights: InsightProvider = {
  getCandidates(state) {
    if (state.country !== "CA") return [];

    const candidates: Insight[] = [];

    const assetCats = state.assets.map((a) => a.category.toLowerCase());
    const hasTFSA = assetCats.some((c) => c.includes("tfsa"));
    const hasFHSA = assetCats.some((c) => c.includes("fhsa"));
    const hasRRSP = assetCats.some((c) => c.includes("rrsp") || c.includes("lira"));
    const hasProperties = state.properties.length > 0;

    const hasEmploymentIncome = state.income.some((i) => {
      const cat = i.category.toLowerCase();
      return (
        cat.includes("salary") ||
        cat.includes("employment") ||
        cat.includes("wages") ||
        cat.includes("self-employ")
      );
    });

    // TFSA recommendation — tax-free growth and withdrawals, no income test
    if (!hasTFSA && !hasFHSA) {
      candidates.push({
        id: "ca-no-tfsa",
        type: "withdrawal-tax",
        message:
          "Consider opening a TFSA — contributions grow and can be withdrawn completely tax-free at any time, with no impact on government benefits.",
        icon: "🏦",
      });
    }

    // RRSP recommendation — deductible contributions reduce taxable income now
    if (!hasRRSP && hasEmploymentIncome) {
      candidates.push({
        id: "ca-no-rrsp",
        type: "tax-optimization",
        message:
          "An RRSP can reduce your taxable income now — contributions are deductible at your marginal rate, and growth is tax-deferred until withdrawal.",
        icon: "💡",
      });
    }

    // FHSA opportunity — deductible + tax-free withdrawal for first home
    if (!hasProperties && !hasFHSA && hasEmploymentIncome) {
      candidates.push({
        id: "ca-fhsa",
        type: "tax-optimization",
        message:
          "The First Home Savings Account (FHSA) lets you contribute $8,000/yr (up to $40,000 lifetime) with a tax deduction on the way in and tax-free withdrawal for a first home purchase.",
        icon: "🏠",
      });
    }

    // RRIF conversion reminder for ages 65–70 with an RRSP
    const age = state.age;
    if (age !== undefined && age >= 65 && age < 71 && hasRRSP) {
      const yearsUntil = 71 - age;
      candidates.push({
        id: "ca-rrif-upcoming",
        type: "rmd",
        message: `Your RRSP must be converted to a RRIF by age 71 — that's ${yearsUntil} year${yearsUntil !== 1 ? "s" : ""} away. Strategic withdrawals before then can reduce future mandatory income and spread out your tax bill.`,
        icon: "📋",
      });
    }

    return candidates;
  },
};
