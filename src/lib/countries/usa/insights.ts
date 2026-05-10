import type { InsightProvider } from "@/lib/countries/types";
import type { Insight } from "@/lib/insights/types";

export const americanInsights: InsightProvider = {
  getCandidates(state) {
    if (state.country !== "US") return [];

    const candidates: Insight[] = [];

    const assetCats = state.assets.map((a) => a.category.toLowerCase());
    const hasRoth = assetCats.some((c) => c.includes("roth"));
    const has401k = assetCats.some((c) => c.includes("401k"));
    const hasIRA = assetCats.some((c) => c.includes("ira") && !c.includes("roth"));
    const hasHSA = assetCats.some((c) => c.includes("hsa"));

    const hasEmploymentIncome = state.income.some((i) => {
      const cat = i.category.toLowerCase();
      return (
        cat.includes("salary") ||
        cat.includes("employment") ||
        cat.includes("wages") ||
        cat.includes("self-employ")
      );
    });

    // Roth IRA recommendation — tax-free growth and tax-free qualified withdrawals
    if (!hasRoth) {
      candidates.push({
        id: "us-no-roth-ira",
        type: "withdrawal-tax",
        message:
          "Consider opening a Roth IRA — contributions grow tax-free and qualified withdrawals are completely tax-free in retirement. The 2025 limit is $7,000/yr ($8,000 if 50+).",
        icon: "🏦",
      });
    }

    // 401(k) employer match — free money, highest-priority first dollar
    if (!has401k && hasEmploymentIncome) {
      candidates.push({
        id: "us-no-401k",
        type: "employer-match",
        message:
          "If your employer offers a 401(k) match, contributing enough to capture it is effectively a 100% instant return. Pre-tax contributions also reduce your taxable income today.",
        icon: "💡",
      });
    }

    // HSA recommendation — triple tax advantage: deductible, grows tax-free, tax-free for medical
    if (!hasHSA && hasEmploymentIncome) {
      candidates.push({
        id: "us-no-hsa",
        type: "tax-optimization",
        message:
          "An HSA (Health Savings Account) offers a triple tax advantage: contributions are pre-tax, growth is tax-free, and withdrawals for qualified medical expenses are tax-free. The 2025 limit is $4,300/yr for single coverage.",
        icon: "🏥",
      });
    }

    // IRA recommendation — if no traditional IRA and already has 401k but no IRA
    if (!hasIRA && !hasRoth && has401k && hasEmploymentIncome) {
      candidates.push({
        id: "us-no-ira",
        type: "tax-optimization",
        message:
          "A Traditional IRA can supplement your 401(k) with additional tax-deferred savings — contributions may be deductible depending on your income and filing status.",
        icon: "💰",
      });
    }

    // RMD upcoming reminder for ages 65–72 with tax-deferred accounts
    const age = state.age;
    if (age !== undefined && age >= 65 && age < 73 && (has401k || hasIRA)) {
      const yearsUntil = 73 - age;
      candidates.push({
        id: "us-rmd-upcoming",
        type: "rmd",
        message: `RMDs (Required Minimum Distributions) start at age 73 — that's ${yearsUntil} year${yearsUntil !== 1 ? "s" : ""} away. Strategic withdrawals or Roth conversions now could reduce your future forced taxable income.`,
        icon: "📋",
      });
    }

    return candidates;
  },
};
