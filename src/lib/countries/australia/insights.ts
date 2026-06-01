import type { InsightProvider } from "@/lib/countries/types";
import type { Insight } from "@/lib/insights/types";
import { AU_PENSION_AGE, AU_SUPER_PRESERVATION_AGE } from "@/lib/countries/australia/government-retirement";
import { formatCurrency } from "@/lib/insights/formatting";

export const australianInsights: InsightProvider = {
  getCandidates(state, data) {
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
    if (!data && !hasSuper && hasEmploymentIncome) {
      candidates.push({
        id: "au-no-super",
        type: "au-super",
        message:
          "If you're employed in Australia, your employer is required to contribute 11.5% of your salary to superannuation (the Super Guarantee). Make sure your fund is set up — contributions grow at a flat 15% tax rate, well below most marginal rates.",
        icon: "🏦",
      });
    }

    // FHSS — save inside super at 15% tax, then withdraw up to $50k for a first home
    if (!data && !hasProperties && !hasFHSS && hasEmploymentIncome) {
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

    if (data) {
      const debtCats = (data.debtCategories ?? []).map((c) => c.toLowerCase());
      const annualIncome = (data.monthlyGrossIncome ?? 0) * 12;
      const employmentIncome = data.annualEmploymentIncome ?? 0;

      // Super guarantee check - 11.5% of salary (2024-25 rate)
      if (employmentIncome > 0) {
        const expectedGuarantee = employmentIncome * 0.115;
        const employerContrib = data.employerMatchAnnual ?? 0;
        if (!hasSuper) {
          candidates.push({
            id: "au-super-missing",
            type: "au-super",
            message: `Your employer must contribute 11.5% of your salary (${formatCurrency(expectedGuarantee)}/yr) to your super as the Super Guarantee. Make sure you've nominated a fund — and add your super account to track your balance.`,
            icon: "🦘",
          });
        } else if (employerContrib > 0 && employerContrib < expectedGuarantee * 0.9) {
          candidates.push({
            id: "au-super-guarantee",
            type: "au-super",
            message: `Your employer should be contributing ${formatCurrency(expectedGuarantee)}/yr (11.5% Super Guarantee) to your super. Check your latest super statement to confirm the full amount is being paid.`,
            icon: "🦘",
          });
        }
      }

      const hasHECS = debtCats.some((c) => c.includes("hecs") || c.includes("help"));
      if (hasHECS && employmentIncome >= 54_435) {
        candidates.push({
          id: "au-hecs-repayment",
          type: "au-hecs-help",
          message: "Your HECS-HELP repayments are automatically deducted via PAYG at your income level. Unlike regular interest, HECS-HELP is indexed to CPI — voluntary early repayments don't save you interest, they just reduce the balance before the annual indexation date (June 1). Check your MyGov account for your current balance.",
          icon: "🎓",
        });
      }

      if (!data.isHomeowner && employmentIncome > 0 && !hasFHSS) {
        candidates.push({
          id: "au-fhss",
          type: "au-fhss",
          message: "Saving for your first home? The First Home Super Saver (FHSS) scheme lets you voluntarily contribute up to $15,000/yr ($50,000 lifetime cap) into super at a 15% tax rate, then withdraw it for a deposit — a great deal if your marginal rate is above 15%.",
          icon: "🏠",
        });
      }

      const taxableBalance = data.withdrawalTax?.accountsByTreatment.taxable.total ?? 0;
      const hasFrankingClaim = (data.taxCredits ?? []).some((c) => c.category.toLowerCase().includes("franking"));
      if (taxableBalance > 10_000 && !hasFrankingClaim) {
        candidates.push({
          id: "au-franking",
          type: "au-franking",
          message: "Australian shares often pay franked dividends — the attached franking credits represent company tax already paid at 30%. You include the grossed-up dividend in your taxable income and claim the credit as an offset. If the credits exceed your tax liability, the ATO refunds the difference. Track these in the Tax Credits section.",
          icon: "📋",
        });
      }

      const hasPHI = (data.taxCredits ?? []).some((c) => c.category.toLowerCase().includes("private health"));
      if (annualIncome >= 93_000 && !hasPHI) {
        candidates.push({
          id: "au-mls",
          type: "au-mls",
          message: `At your income level, you may be liable for the Medicare Levy Surcharge (MLS) of 1–1.5% (up to ${formatCurrency(Math.round(annualIncome * 0.015))}/yr) if you don't hold private hospital cover. Basic hospital cover typically costs less than the surcharge — worth comparing. Add a Private Health Insurance Rebate in Tax Credits if you have cover.`,
          icon: "🏥",
        });
      }
    }

    return candidates;
  },
};
