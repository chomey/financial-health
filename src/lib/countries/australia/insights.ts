import type { InsightProvider } from "@/lib/countries/types";
import type { Insight } from "@/lib/insights/types";
import { AU_PENSION_AGE, AU_SUPER_PRESERVATION_AGE } from "@/lib/countries/australia/government-retirement";

export const australianInsights: InsightProvider = {
  getCandidates(state) {
    if (state.country !== "AU") return [];

    const candidates: Insight[] = [];

    const assetCats = state.assets.map((a) => a.category.toLowerCase());
    const hasSuper = assetCats.some(
      (c) => c.includes("super") || c.includes("pension phase")
    );
    const hasFHSS = assetCats.some(
      (c) => c.includes("first home super") || c.includes("fhss")
    );
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

    // Super contribution — employer is required to contribute 11.5%; prompt to set up if missing
    if (!hasSuper && hasEmploymentIncome) {
      candidates.push({
        id: "au-no-super",
        type: "au-super",
        message:
          "If you're employed in Australia, your employer is required to contribute 11.5% of your salary to superannuation (the Super Guarantee). Make sure your fund is set up — contributions grow at a flat 15% tax rate, well below most marginal rates.",
        icon: "🏦",
      });
    }

    // FHSS — save inside super at 15% tax, then withdraw up to $50k for a first home
    if (!hasProperties && !hasFHSS && hasEmploymentIncome) {
      candidates.push({
        id: "au-fhss",
        type: "au-fhss",
        message:
          "The First Home Super Saver scheme lets you make voluntary super contributions (taxed at 15%) and withdraw up to $50,000 toward a first home purchase — a tax-efficient way to build a deposit faster.",
        icon: "🏠",
      });
    }

    // Age Pension approach — for ages 60 to just before pension eligibility age
    const age = state.age;
    if (age !== undefined && age >= 60 && age < AU_PENSION_AGE) {
      const yearsUntilPension = AU_PENSION_AGE - age;
      candidates.push({
        id: "au-age-pension-upcoming",
        type: "retirement-income-gap",
        message: `Age Pension eligibility starts at ${AU_PENSION_AGE} — that's ${yearsUntilPension} year${yearsUntilPension !== 1 ? "s" : ""} away. Your super is accessible from age ${AU_SUPER_PRESERVATION_AGE}, which can bridge the gap. Review your projected income to ensure a smooth transition into retirement.`,
        icon: "📋",
      });
    }

    return candidates;
  },
};
