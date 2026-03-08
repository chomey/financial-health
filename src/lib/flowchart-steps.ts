/**
 * Financial Roadmap Step Definitions and Inference Engine
 *
 * Implements the r/personalfinance "How to handle $" (US) and
 * r/PersonalFinanceCanada "Money Steps" (CA) flowcharts.
 *
 * References:
 *   CA: https://www.reddit.com/r/PersonalFinanceCanada/wiki/money-steps
 *   US: https://www.reddit.com/r/personalfinance/wiki/commontopics
 */

import type { FinancialState } from "@/lib/financial-types";
import { normalizeToMonthly } from "@/components/IncomeEntry";
import { getStockValue } from "@/components/StockEntry";
import { getEffectivePayment } from "@/components/PropertyEntry";

export type StepStatus = "complete" | "in-progress" | "upcoming";

export interface FlowchartStep {
  /** Unique step identifier, used for URL persistence */
  id: string;
  /** Sequential step number (1-based) */
  stepNumber: number;
  /** Short display title */
  title: string;
  /** One-line description shown when collapsed */
  description: string;
  /** Short hint shown in the step header explaining current status */
  completionHint: string;
  /** Longer explanation shown when expanded */
  detailText: string;
  /** Visual status for rendering */
  status: StepStatus;
  /** Completion percentage 0–100 */
  progress: number;
  /** Step cannot be inferred from data and requires user confirmation */
  userAcknowledgeable?: boolean;
  /** Label for the acknowledge checkbox */
  acknowledgeLabel?: string;
  /** Step may not apply to the user (e.g., no kids for RESP) */
  skippable?: boolean;
  /** Label for the skip checkbox */
  skipLabel?: string;
}

// ── Account type detection keywords ──────────────────────────────────────────

const CA_TAX_FREE_KEYWORDS = ["tfsa", "fhsa"];
const CA_TAX_DEFERRED_KEYWORDS = ["rrsp", "lira", "group rrsp", "dpsp", "prpp"];
const CA_RESP_FHSA_KEYWORDS = ["resp", "fhsa"];
const US_HSA_KEYWORDS = ["hsa"];
const US_IRA_KEYWORDS = ["roth ira", "ira"];
const US_401K_KEYWORDS = ["401k", "roth 401k", "403b", "457b", "457"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function hasAccount(categories: string[], keywords: string[]): boolean {
  const lower = categories.map((c) => c.toLowerCase());
  return keywords.some((kw) => lower.some((c) => c.includes(kw)));
}

function getLiquidAssets(state: FinancialState): number {
  const assetTotal = state.assets
    .filter((a) => !a.computed)
    .reduce((sum, a) => sum + a.amount, 0);
  const stockTotal = (state.stocks ?? []).reduce((sum, s) => sum + getStockValue(s), 0);
  return assetTotal + stockTotal;
}

function getRawMonthlyExpenses(state: FinancialState): number {
  return state.expenses.reduce((sum, e) => sum + e.amount, 0);
}

function getMonthlyMortgage(state: FinancialState): number {
  return (state.properties ?? []).reduce((sum, p) => sum + getEffectivePayment(p), 0);
}

function getMonthlyDebtPayments(state: FinancialState): number {
  return state.debts.reduce((sum, d) => sum + (d.monthlyPayment ?? 0), 0);
}

function getMonthlyIncome(state: FinancialState): number {
  return state.income.reduce(
    (sum, i) => sum + normalizeToMonthly(i.amount, i.frequency ?? "monthly"),
    0,
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ── Inference data ────────────────────────────────────────────────────────────

interface InferredData {
  hasIncome: boolean;
  hasExpenses: boolean;
  liquidAssets: number;
  monthlyExpenses: number;
  monthlyMortgage: number;
  monthlyDebtPayments: number;
  monthlyObligations: number;
  assetCategories: string[];
  highInterestDebts: Array<{ category: string; amount: number; rate: number }>;
  moderateInterestDebts: Array<{ category: string; amount: number; rate: number }>;
}

function inferData(state: FinancialState): InferredData {
  const monthlyIncome = getMonthlyIncome(state);
  const monthlyExpenses = getRawMonthlyExpenses(state);
  const monthlyMortgage = getMonthlyMortgage(state);
  const monthlyDebtPayments = getMonthlyDebtPayments(state);
  const liquidAssets = getLiquidAssets(state);

  const assetCategories = state.assets.filter((a) => !a.computed).map((a) => a.category);

  const highInterestDebts = state.debts
    .filter((d) => d.interestRate !== undefined && d.interestRate > 8)
    .map((d) => ({ category: d.category, amount: d.amount, rate: d.interestRate! }));

  const moderateInterestDebts = state.debts
    .filter((d) => d.interestRate !== undefined && d.interestRate >= 4 && d.interestRate <= 8)
    .map((d) => ({ category: d.category, amount: d.amount, rate: d.interestRate! }));

  return {
    hasIncome: state.income.length > 0 && monthlyIncome > 0,
    hasExpenses: state.expenses.length > 0 && monthlyExpenses > 0,
    liquidAssets,
    monthlyExpenses,
    monthlyMortgage,
    monthlyDebtPayments,
    monthlyObligations: monthlyExpenses + monthlyMortgage + monthlyDebtPayments,
    assetCategories,
    highInterestDebts,
    moderateInterestDebts,
  };
}

// ── CA step definitions ───────────────────────────────────────────────────────

interface RawStep {
  id: string;
  title: string;
  description: string;
  completionHint: string;
  detailText: string;
  progress: number;
  isComplete: boolean;
  userAcknowledgeable?: boolean;
  acknowledgeLabel?: string;
  skippable?: boolean;
  skipLabel?: string;
}

function buildCASteps(d: InferredData): RawStep[] {
  const { liquidAssets, monthlyObligations, assetCategories, highInterestDebts, moderateInterestDebts } = d;

  const starterTarget = 1000;
  const fullEFTarget = monthlyObligations > 0 ? monthlyObligations * 3 : 0;

  const hasTFSA = hasAccount(assetCategories, CA_TAX_FREE_KEYWORDS);
  const hasRRSP = hasAccount(assetCategories, CA_TAX_DEFERRED_KEYWORDS);
  const hasRESP_FHSA = hasAccount(assetCategories, CA_RESP_FHSA_KEYWORDS);

  const starterProgress = Math.round(clamp((liquidAssets / starterTarget) * 100, 0, 100));
  const fullEFProgress =
    fullEFTarget > 0 ? Math.round(clamp((liquidAssets / fullEFTarget) * 100, 0, 100)) : 0;

  const efMonths = monthlyObligations > 0 ? liquidAssets / monthlyObligations : 0;

  return [
    {
      id: "ca-budget",
      title: "Budget & Essentials",
      description:
        "Track your income and essential expenses. Know where your money goes before anything else.",
      completionHint:
        d.hasIncome && d.hasExpenses
          ? "Income and expenses are entered — great start."
          : d.hasIncome
            ? "Income entered, but no expenses yet."
            : d.hasExpenses
              ? "Expenses entered, but no income yet."
              : "Enter your income and expenses to begin.",
      detailText:
        "List all income sources and essential expenses (housing, food, utilities, transportation, insurance). Create a spending plan that covers necessities first. Knowing your monthly cash flow is the foundation of every financial decision that follows.",
      progress: d.hasIncome && d.hasExpenses ? 100 : d.hasIncome || d.hasExpenses ? 50 : 0,
      isComplete: d.hasIncome && d.hasExpenses,
    },
    {
      id: "ca-starter-ef",
      title: "Starter Emergency Fund ($1,000)",
      description: "Save a small cash buffer to avoid going into debt for minor emergencies.",
      completionHint:
        liquidAssets >= starterTarget
          ? "Your liquid savings cover this buffer."
          : `${starterProgress}% of the $1,000 goal reached.`,
      detailText:
        "A $1,000 cushion handles unexpected car repairs, medical co-pays, or appliance failures without reaching for a credit card. Keep it in a high-interest savings account (HISA). Once in place, focus on debt — revisit your emergency fund size in step 5.",
      progress: starterProgress,
      isComplete: liquidAssets >= starterTarget,
    },
    {
      id: "ca-employer-match",
      title: "Employer RRSP / Pension Match",
      description:
        "Capture any employer contribution match — it's an instant 50–100% return before anything else.",
      completionHint: "Confirm you're capturing your full employer match.",
      detailText:
        "If your employer matches RRSP or pension contributions, prioritize contributing enough to capture the full match before paying down debt. This is typically the highest-ROI financial move available — a 50% match on 6% of salary is a 50% guaranteed return. If no match is offered, skip this step.",
      progress: 0,
      isComplete: false,
      userAcknowledgeable: true,
      acknowledgeLabel: "I'm capturing my full employer match",
      skippable: true,
      skipLabel: "No employer match available",
    },
    {
      id: "ca-high-debt",
      title: "Pay High-Interest Debt (>8%)",
      description:
        "Eliminate debt with interest rates above 8% — credit cards, payday loans, high-rate personal loans.",
      completionHint:
        highInterestDebts.length === 0
          ? "No high-interest debt detected."
          : `High-interest debt: ${highInterestDebts.map((d) => d.category).join(", ")}.`,
      detailText:
        "High-interest debt costs more than most investments earn. Pay these off aggressively using the avalanche method (highest rate first) or the snowball method (smallest balance first, for motivation). Credit cards in Canada typically run 19–29%+; eliminating them is a guaranteed ~20% return. Enter your debt interest rates in the Debts section for tracking.",
      progress: highInterestDebts.length === 0 ? 100 : 0,
      isComplete: highInterestDebts.length === 0,
    },
    {
      id: "ca-full-ef",
      title: "Full Emergency Fund (3–6 Months)",
      description: "Build savings to cover 3–6 months of total living expenses.",
      completionHint:
        fullEFTarget > 0
          ? liquidAssets >= fullEFTarget
            ? `Your savings cover ~${efMonths.toFixed(1)} months — emergency fund complete.`
            : `~${efMonths.toFixed(1)} of 3 months covered.`
          : "Enter your expenses to calculate your emergency fund target.",
      detailText:
        "A full emergency fund covers 3–6 months of total obligations (expenses + mortgage + debt payments). Keep it in a HISA or short-term GIC ladder. Job loss, illness, or major repairs become manageable rather than catastrophic. 3 months is a good starting goal; 6 months is recommended if your income is irregular.",
      progress: fullEFProgress,
      isComplete: fullEFTarget > 0 && liquidAssets >= fullEFTarget,
    },
    {
      id: "ca-tfsa",
      title: "TFSA (Tax-Free Savings Account)",
      description: "Open and contribute to a TFSA for completely tax-free investment growth.",
      completionHint: hasTFSA
        ? "You have a TFSA in your assets."
        : "No TFSA detected — consider opening one.",
      detailText:
        "The TFSA is one of Canada's best savings vehicles. Contributions aren't tax-deductible, but all growth and withdrawals are completely tax-free — forever. Unused contribution room accumulates from age 18. Ideal for both short-term goals and long-term investing. Annual limit: $7,000 (2024). Hold ETFs like XEQT or VEQT for long-term wealth building.",
      progress: hasTFSA ? 100 : 0,
      isComplete: hasTFSA,
    },
    {
      id: "ca-rrsp",
      title: "RRSP (Registered Retirement Savings Plan)",
      description:
        "Contribute to an RRSP to reduce your taxable income and invest tax-deferred for retirement.",
      completionHint: hasRRSP
        ? "You have an RRSP in your assets."
        : "No RRSP detected — consider opening one.",
      detailText:
        "RRSP contributions reduce your taxable income in the year contributed — essentially a tax refund upfront. Growth is tax-deferred until withdrawal. Annual limit: 18% of prior year earned income, up to $31,560 (2024). Particularly powerful for high earners who expect lower income in retirement. Consider spousal RRSP for income-splitting benefits.",
      progress: hasRRSP ? 100 : 0,
      isComplete: hasRRSP,
    },
    {
      id: "ca-moderate-debt",
      title: "Pay Moderate-Interest Debt (4–8%)",
      description:
        "Pay down debt with interest rates between 4% and 8% — car loans, student loans, lines of credit.",
      completionHint:
        moderateInterestDebts.length === 0
          ? "No moderate-interest debt detected."
          : `Moderate-interest debt: ${moderateInterestDebts.map((d) => d.category).join(", ")}.`,
      detailText:
        "Once tax-advantaged accounts are open, tackle moderate-interest debt. At 4–8%, expected investment returns are competitive with interest savings — the right choice depends on your risk tolerance. Many Canadians split extra cash between debt paydown and investing at this stage. Either way, the gap narrows and personal preference matters.",
      progress: moderateInterestDebts.length === 0 ? 100 : 0,
      isComplete: moderateInterestDebts.length === 0,
    },
    {
      id: "ca-resp-fhsa",
      title: "RESP / FHSA",
      description:
        "Save for a child's education (RESP) or your first home (FHSA), if applicable.",
      completionHint: hasRESP_FHSA
        ? "You have an RESP or FHSA in your assets."
        : "No RESP or FHSA detected.",
      detailText:
        "RESP: Government provides a 20% grant (CESG) on up to $2,500/year per child — that's $500 free per year. FHSA: Tax-deductible contributions + tax-free withdrawals for first-time homebuyers; $8,000/year limit ($40,000 lifetime). If you have children or are saving for a first home, these accounts should not be skipped. If neither applies, skip this step.",
      progress: hasRESP_FHSA ? 100 : 0,
      isComplete: hasRESP_FHSA,
      userAcknowledgeable: true,
      acknowledgeLabel: hasRESP_FHSA
        ? "I'm actively contributing to my RESP/FHSA"
        : "I'm opening/contributing to an RESP or FHSA",
      skippable: true,
      skipLabel: "No children and not a first-time homebuyer",
    },
    {
      id: "ca-taxable",
      title: "Taxable Investing & Goals",
      description:
        "Invest in a taxable brokerage account for additional wealth building and specific goals.",
      completionHint: "Invest surplus cash in a diversified portfolio.",
      detailText:
        "Once tax-advantaged accounts are maximized and high-interest debt is cleared, invest your surplus in a taxable brokerage account. Index ETFs (e.g., XEQT, VEQT, XBAL) offer low-cost, globally diversified exposure. Consider your asset location strategy — hold foreign equity in RRSP for withholding tax efficiency.",
      progress: 0,
      isComplete: false,
      userAcknowledgeable: true,
      acknowledgeLabel: "I'm investing in a taxable account or working toward a specific goal",
    },
  ];
}

// ── US step definitions ───────────────────────────────────────────────────────

function buildUSSteps(d: InferredData): RawStep[] {
  const { liquidAssets, monthlyObligations, assetCategories, highInterestDebts, moderateInterestDebts } = d;

  const starterTarget = 1000;
  const fullEFTarget = monthlyObligations > 0 ? monthlyObligations * 3 : 0;

  const hasHSA = hasAccount(assetCategories, US_HSA_KEYWORDS);
  const hasIRA = hasAccount(assetCategories, US_IRA_KEYWORDS);
  const has401k = hasAccount(assetCategories, US_401K_KEYWORDS);

  const starterProgress = Math.round(clamp((liquidAssets / starterTarget) * 100, 0, 100));
  const fullEFProgress =
    fullEFTarget > 0 ? Math.round(clamp((liquidAssets / fullEFTarget) * 100, 0, 100)) : 0;

  const efMonths = monthlyObligations > 0 ? liquidAssets / monthlyObligations : 0;

  return [
    {
      id: "us-budget",
      title: "Budget & Essentials",
      description:
        "Track your income and essential expenses. Know where your money goes before anything else.",
      completionHint:
        d.hasIncome && d.hasExpenses
          ? "Income and expenses are entered — great start."
          : d.hasIncome
            ? "Income entered, but no expenses yet."
            : d.hasExpenses
              ? "Expenses entered, but no income yet."
              : "Enter your income and expenses to begin.",
      detailText:
        "List all income sources and essential expenses (housing, food, utilities, transportation, insurance). Create a spending plan that covers necessities first. The 50/30/20 rule (50% needs, 30% wants, 20% savings/debt) is a common starting point. Knowing your cash flow is the foundation of every financial decision.",
      progress: d.hasIncome && d.hasExpenses ? 100 : d.hasIncome || d.hasExpenses ? 50 : 0,
      isComplete: d.hasIncome && d.hasExpenses,
    },
    {
      id: "us-starter-ef",
      title: "Starter Emergency Fund ($1,000)",
      description: "Save a small cash buffer to avoid going into debt for minor emergencies.",
      completionHint:
        liquidAssets >= starterTarget
          ? "Your liquid savings cover this buffer."
          : `${starterProgress}% of the $1,000 goal reached.`,
      detailText:
        "A $1,000 cushion handles unexpected car repairs, medical co-pays, or appliance failures without reaching for a credit card. Keep it in a high-yield savings account (HYSA). Once in place, focus on debt — revisit your emergency fund size in step 5.",
      progress: starterProgress,
      isComplete: liquidAssets >= starterTarget,
    },
    {
      id: "us-employer-match",
      title: "Employer 401(k) Match",
      description:
        "Contribute enough to your 401(k) to capture any employer match — it's an instant 50–100% return.",
      completionHint: "Confirm you're capturing your full employer match.",
      detailText:
        "If your employer matches 401(k) contributions, prioritize contributing enough to capture the full match before paying down debt. A 50% match on 6% of salary is a 50% guaranteed return — no investment beats this. If your employer offers a 403(b) or 457, the same principle applies. If no match is available, skip this step.",
      progress: 0,
      isComplete: false,
      userAcknowledgeable: true,
      acknowledgeLabel: "I'm contributing enough to capture my full employer match",
      skippable: true,
      skipLabel: "No employer match available",
    },
    {
      id: "us-high-debt",
      title: "Pay High-Interest Debt (>8%)",
      description:
        "Eliminate debt with interest rates above 8% — credit cards, payday loans, high-rate personal loans.",
      completionHint:
        highInterestDebts.length === 0
          ? "No high-interest debt detected."
          : `High-interest debt: ${highInterestDebts.map((d) => d.category).join(", ")}.`,
      detailText:
        "High-interest debt costs more than most investments earn. Pay these off aggressively using the avalanche method (highest rate first) or the snowball method (smallest balance first, for motivation). Credit cards in the US typically run 20–30%; eliminating them is a guaranteed ~25% return. Enter your debt interest rates in the Debts section for tracking.",
      progress: highInterestDebts.length === 0 ? 100 : 0,
      isComplete: highInterestDebts.length === 0,
    },
    {
      id: "us-full-ef",
      title: "Full Emergency Fund (3–6 Months)",
      description: "Build savings to cover 3–6 months of total living expenses.",
      completionHint:
        fullEFTarget > 0
          ? liquidAssets >= fullEFTarget
            ? `Your savings cover ~${efMonths.toFixed(1)} months — emergency fund complete.`
            : `~${efMonths.toFixed(1)} of 3 months covered.`
          : "Enter your expenses to calculate your emergency fund target.",
      detailText:
        "A full emergency fund covers 3–6 months of total obligations (expenses + mortgage + debt payments). Keep it in a HYSA. Job loss, illness, or major repairs become manageable rather than catastrophic. 3 months is a good goal if you have stable employment; 6 months if income is irregular or you're self-employed.",
      progress: fullEFProgress,
      isComplete: fullEFTarget > 0 && liquidAssets >= fullEFTarget,
    },
    {
      id: "us-hsa",
      title: "Max HSA (Health Savings Account)",
      description:
        "If eligible, max your HSA — the only triple-tax-advantaged account available.",
      completionHint: hasHSA
        ? "You have an HSA in your assets."
        : "No HSA detected. HSA requires enrollment in an HDHP.",
      detailText:
        "The HSA is uniquely powerful: contributions are tax-deductible, growth is tax-free, and qualified medical withdrawals are tax-free — triple tax advantage. Unused funds roll over annually and can be invested. After age 65, non-medical withdrawals are taxed like a traditional IRA. 2024 limits: $4,150 (self-only), $8,300 (family). Requires enrollment in a High-Deductible Health Plan (HDHP). If ineligible, skip this step.",
      progress: hasHSA ? 100 : 0,
      isComplete: hasHSA,
      userAcknowledgeable: true,
      acknowledgeLabel: "I'm maxing my HSA",
      skippable: true,
      skipLabel: "Not enrolled in an HDHP / not eligible for HSA",
    },
    {
      id: "us-ira",
      title: "Max IRA / Roth IRA",
      description:
        "Max out an IRA or Roth IRA for additional tax-advantaged retirement savings.",
      completionHint: hasIRA
        ? "You have an IRA or Roth IRA in your assets."
        : "No IRA or Roth IRA detected — consider opening one.",
      detailText:
        "Traditional IRA: contributions may be tax-deductible (depending on income and workplace plan coverage); growth is tax-deferred. Roth IRA: contributions after-tax, but growth and qualified withdrawals are completely tax-free. 2024 limit: $7,000/year ($8,000 if 50+). Roth is generally preferred if you expect to be in a higher tax bracket in retirement. Income limits apply for Roth direct contributions.",
      progress: hasIRA ? 100 : 0,
      isComplete: hasIRA,
    },
    {
      id: "us-401k",
      title: "Max 401(k)",
      description:
        "Max out your 401(k) (beyond the employer match) for tax-deferred retirement growth.",
      completionHint: has401k
        ? "You have a 401(k) or similar plan in your assets."
        : "No 401(k) detected — check if your employer offers one.",
      detailText:
        "After maxing your IRA, return to your 401(k) for the full contribution limit. 2024 limit: $23,000 ($30,500 if 50+). Roth 401(k) option is available at many employers — useful if you expect higher future tax rates. Even without a match, the tax-deferred growth is valuable. 403(b) and 457(b) plans follow the same logic.",
      progress: has401k ? 100 : 0,
      isComplete: has401k,
    },
    {
      id: "us-moderate-debt",
      title: "Pay Moderate-Interest Debt (4–8%)",
      description:
        "Pay down debt with interest rates between 4% and 8% — student loans, car loans, personal loans.",
      completionHint:
        moderateInterestDebts.length === 0
          ? "No moderate-interest debt detected."
          : `Moderate-interest debt: ${moderateInterestDebts.map((d) => d.category).join(", ")}.`,
      detailText:
        "Once tax-advantaged accounts are maxed, tackle moderate-interest debt. At 4–8%, expected investment returns are competitive with interest savings. Many people split extra cash between debt paydown and investing at this stage. Either path builds wealth — the best choice depends on your risk tolerance and peace of mind.",
      progress: moderateInterestDebts.length === 0 ? 100 : 0,
      isComplete: moderateInterestDebts.length === 0,
    },
    {
      id: "us-taxable",
      title: "Taxable Investing & Goals",
      description:
        "Invest in a taxable brokerage account for additional wealth building and specific financial goals.",
      completionHint: "Invest surplus cash in a diversified portfolio.",
      detailText:
        "Once tax-advantaged accounts are maxed and high-interest debt is cleared, invest your surplus in a taxable brokerage. Index funds (e.g., VTI, VXUS, VOO) offer low-cost, diversified exposure. Tax-loss harvesting and asset location strategies can improve after-tax returns. Consider I-bonds, real estate, or other goal-specific vehicles depending on your timeline.",
      progress: 0,
      isComplete: false,
      userAcknowledgeable: true,
      acknowledgeLabel: "I'm investing in a taxable account or working toward a specific goal",
    },
  ];
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Infer and return the ordered flowchart steps for the user's country.
 * Steps are marked complete/in-progress/upcoming based on FinancialState alone.
 * Call applyUserOverrides() afterwards to incorporate acknowledged/skipped steps.
 */
export function getFlowchartSteps(state: FinancialState): FlowchartStep[] {
  const country = state.country ?? "CA";
  const d = inferData(state);
  const rawSteps = country === "US" ? buildUSSteps(d) : buildCASteps(d);

  // Assign sequential status: complete → complete, first incomplete → in-progress, rest → upcoming
  let foundFirstIncomplete = false;
  return rawSteps.map((raw, idx) => {
    let status: StepStatus;
    if (raw.isComplete) {
      status = "complete";
    } else if (!foundFirstIncomplete) {
      status = "in-progress";
      foundFirstIncomplete = true;
    } else {
      status = "upcoming";
    }

    return {
      id: raw.id,
      stepNumber: idx + 1,
      title: raw.title,
      description: raw.description,
      completionHint: raw.completionHint,
      detailText: raw.detailText,
      status,
      progress: raw.isComplete ? 100 : raw.progress,
      userAcknowledgeable: raw.userAcknowledgeable,
      acknowledgeLabel: raw.acknowledgeLabel,
      skippable: raw.skippable,
      skipLabel: raw.skipLabel,
    };
  });
}

/**
 * Returns the index of the first non-complete step (the "current" step).
 * Returns steps.length - 1 if all steps are complete.
 */
export function getCurrentStepIndex(steps: FlowchartStep[]): number {
  const idx = steps.findIndex((s) => s.status !== "complete");
  return idx === -1 ? steps.length - 1 : idx;
}

/**
 * Apply user-provided overrides (acknowledged/skipped step IDs) to the step list.
 * Acknowledged or skipped steps are marked complete with 100% progress.
 * Re-runs sequential status assignment after overrides are applied.
 */
export function applyUserOverrides(
  steps: FlowchartStep[],
  acknowledged: string[],
  skipped: string[],
): FlowchartStep[] {
  const overrideIds = new Set([...acknowledged, ...skipped]);

  // First pass: mark overridden steps as complete
  const withOverrides = steps.map((step) =>
    overrideIds.has(step.id) ? { ...step, status: "complete" as StepStatus, progress: 100 } : step,
  );

  // Second pass: re-assign in-progress / upcoming based on updated completion
  let foundFirstIncomplete = false;
  return withOverrides.map((step) => {
    if (step.status === "complete") return step;
    if (!foundFirstIncomplete) {
      foundFirstIncomplete = true;
      return { ...step, status: "in-progress" as StepStatus };
    }
    return { ...step, status: "upcoming" as StepStatus };
  });
}
