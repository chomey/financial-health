/**
 * Financial Roadmap Step Definitions and Inference Engine
 *
 * Implements the r/personalfinance "How to handle $" (US),
 * r/PersonalFinanceCanada "Money Steps" (CA), and
 * r/AusFinance flowchart (AU).
 *
 * References:
 *   CA: https://www.reddit.com/r/PersonalFinanceCanada/wiki/money-steps
 *   US: https://www.reddit.com/r/personalfinance/wiki/commontopics
 *   AU: https://www.reddit.com/r/AusFinance/wiki/index
 */

import type { FinancialState } from "@/lib/financial-types";
import { normalizeToMonthly } from "@/components/IncomeEntry";
import { normalizeExpenseToMonthly } from "@/components/ExpenseEntry";
import { getStockValue } from "@/components/StockEntry";
import { getEffectivePayment } from "@/components/PropertyEntry";
import { getTaxTreatment } from "@/lib/withdrawal-tax";

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
const AU_SUPER_KEYWORDS = ["super", "superannuation"];
const AU_FHSS_KEYWORDS = ["fhss", "first home super saver"];
const AU_ETF_KEYWORDS = ["etf", "brokerage", "index fund", "shares", "asx", "investment"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function hasAccount(categories: string[], keywords: string[]): boolean {
  const lower = categories.map((c) => c.toLowerCase());
  return keywords.some((kw) => lower.some((c) => c.includes(kw)));
}

/** All non-computed assets + stocks (used for general liquidity checks) */
function getLiquidAssets(state: FinancialState): number {
  const assetTotal = state.assets
    .filter((a) => !a.computed)
    .reduce((sum, a) => sum + a.amount, 0);
  const stockTotal = (state.stocks ?? []).reduce((sum, s) => sum + getStockValue(s), 0);
  return assetTotal + stockTotal;
}

/**
 * Cash-like assets suitable for an emergency fund.
 * Excludes tax-advantaged accounts (TFSA, RRSP, RESP, HSA, 401k, IRA, etc.),
 * invested accounts (brokerage, ETF, index), and stocks.
 * Only counts savings, checking, HISA, GIC, money market, and bank accounts.
 */
const CASH_KEYWORDS = ["savings", "checking", "chequing", "hisa", "gic", "money market", "bank", "cash", "emergency"];
const INVESTED_KEYWORDS = ["brokerage", "etf", "index", "investment", "trading"];

function isCashLikeAccount(category: string, taxTreatment?: string): boolean {
  const treatment = getTaxTreatment(category, taxTreatment as "tax-free" | "tax-deferred" | "taxable" | undefined);
  // Tax-free and tax-deferred accounts are not emergency fund cash
  if (treatment !== "taxable") return false;
  const lower = category.toLowerCase();
  // Exclude invested/brokerage accounts
  if (INVESTED_KEYWORDS.some((kw) => lower.includes(kw))) return false;
  // Include if it matches cash keywords, or if it's a generic taxable account
  // (e.g., "TD Bank" contains "bank")
  return CASH_KEYWORDS.some((kw) => lower.includes(kw));
}

function getCashAssets(state: FinancialState): number {
  return state.assets
    .filter((a) => !a.computed && isCashLikeAccount(a.category, a.taxTreatment))
    .reduce((sum, a) => sum + a.amount, 0);
}

function getCashAssetItems(state: FinancialState): Array<{ category: string; amount: number }> {
  return state.assets
    .filter((a) => !a.computed && isCashLikeAccount(a.category, a.taxTreatment))
    .map((a) => ({ category: a.category, amount: a.amount }));
}

function getRawMonthlyExpenses(state: FinancialState): number {
  return state.expenses.reduce((sum, e) => sum + normalizeExpenseToMonthly(e.amount, e.frequency), 0);
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

// ── Retirement heuristic ──────────────────────────────────────────────────────

/**
 * Heuristically detects whether the user is likely retired.
 * Triggers when: no employment income AND (rough 20-year runway OR investment
 * returns exceed monthly expenses). Returns false if no income is entered at all
 * (too ambiguous — they may just not have filled in the form yet).
 */
export function detectRetirementHeuristic(state: FinancialState): boolean {
  // Require at least some income to be entered; if none, can't distinguish
  // "just started" from "retired with pension/investment income"
  if (state.income.length === 0) return false;

  // If any income is employment-type, not heuristically retired
  const hasEmploymentIncome = state.income.some(
    (i) => !i.incomeType || i.incomeType === "employment",
  );
  if (hasEmploymentIncome) return false;

  const monthlyExpenses = state.expenses.reduce((sum, e) => sum + normalizeExpenseToMonthly(e.amount, e.frequency), 0);
  if (monthlyExpenses === 0) return false;

  // Rough 20-year runway check (without growth)
  const totalLiquidAssets = state.assets
    .filter((a) => !a.computed)
    .reduce((sum, a) => sum + a.amount, 0);
  const roughRunwayYears = totalLiquidAssets / monthlyExpenses / 12;
  if (roughRunwayYears > 20) return true;

  // Monthly investment returns > monthly expenses
  const monthlyInvestmentReturns = state.assets
    .filter((a) => !a.computed && (a.roi ?? 0) > 0)
    .reduce((sum, a) => sum + (a.amount * (a.roi! / 100)) / 12, 0);
  if (monthlyInvestmentReturns > monthlyExpenses) return true;

  return false;
}

// ── Inference data ────────────────────────────────────────────────────────────

interface InferredData {
  hasIncome: boolean;
  hasExpenses: boolean;
  monthlyIncome: number;
  monthlyInvestmentReturns: number;
  liquidAssets: number;
  cashAssets: number;
  monthlyExpenses: number;
  monthlyMortgage: number;
  monthlyDebtPayments: number;
  monthlyObligations: number;
  assetCategories: string[];
  highInterestDebts: Array<{ category: string; amount: number; rate: number }>;
  moderateInterestDebts: Array<{ category: string; amount: number; rate: number }>;
  isRetired: boolean;
}

function inferData(state: FinancialState, isRetired: boolean): InferredData {
  const monthlyIncome = getMonthlyIncome(state);
  const monthlyExpenses = getRawMonthlyExpenses(state);
  const monthlyMortgage = getMonthlyMortgage(state);
  const monthlyDebtPayments = getMonthlyDebtPayments(state);
  const liquidAssets = getLiquidAssets(state);
  const cashAssets = getCashAssets(state);

  // Monthly returns from assets with ROI (interest, dividends, capital gains)
  const monthlyInvestmentReturns = state.assets
    .filter((a) => !a.computed && (a.roi ?? 0) > 0)
    .reduce((sum, a) => sum + (a.amount * (a.roi! / 100)) / 12, 0);

  const assetCategories = state.assets.filter((a) => !a.computed).map((a) => a.category);

  const highInterestDebts = state.debts
    .filter((d) => d.interestRate !== undefined && d.interestRate > 8)
    .map((d) => ({ category: d.category, amount: d.amount, rate: d.interestRate! }));

  const moderateInterestDebts = state.debts
    .filter((d) => d.interestRate !== undefined && d.interestRate >= 4 && d.interestRate <= 8)
    .map((d) => ({ category: d.category, amount: d.amount, rate: d.interestRate! }));

  const totalMonthlyIncome = monthlyIncome + monthlyInvestmentReturns;

  return {
    hasIncome: totalMonthlyIncome > 0,
    hasExpenses: state.expenses.length > 0 && monthlyExpenses > 0,
    monthlyIncome: totalMonthlyIncome,
    monthlyInvestmentReturns,
    liquidAssets,
    cashAssets,
    monthlyExpenses,
    monthlyMortgage,
    monthlyDebtPayments,
    monthlyObligations: monthlyExpenses + monthlyMortgage + monthlyDebtPayments,
    assetCategories,
    highInterestDebts,
    moderateInterestDebts,
    isRetired,
  };
}

/** Build a personalized budget detail paragraph based on the user's actual income/expense data. */
function buildBudgetDetailText(d: InferredData): string {
  const { monthlyIncome, monthlyExpenses, monthlyMortgage, monthlyDebtPayments, hasIncome, hasExpenses } = d;
  const totalOutflows = monthlyExpenses + monthlyMortgage + monthlyDebtPayments;
  const surplus = monthlyIncome - totalOutflows;

  if (!hasIncome && !hasExpenses) {
    return "Start by listing all income sources and essential expenses (housing, food, utilities, transportation, insurance). Create a spending plan that covers necessities first. The 50/30/20 rule (50% needs, 30% wants, 20% savings/debt) is a common starting point. Knowing your cash flow is the foundation of every financial decision.";
  }

  const fmt = (n: number) => `$${Math.round(Math.abs(n)).toLocaleString()}`;
  const parts: string[] = [];

  if (hasIncome && hasExpenses) {
    parts.push(`You're bringing in ${fmt(monthlyIncome)}/mo and spending ${fmt(totalOutflows)}/mo.`);
    if (surplus > 0) {
      const savingsRate = Math.round((surplus / monthlyIncome) * 100);
      parts.push(`That leaves ${fmt(surplus)}/mo (${savingsRate}% savings rate) to put toward your goals.`);
      if (savingsRate >= 20) {
        parts.push("You're meeting or exceeding the 20% savings benchmark — great work.");
      } else {
        parts.push(`The 50/30/20 rule suggests saving at least 20% — you're at ${savingsRate}%. Look for expenses you can trim.`);
      }
    } else if (surplus === 0) {
      parts.push("You're spending exactly what you earn. Look for areas to trim so you can start building savings.");
    } else {
      parts.push(`You're spending ${fmt(-surplus)}/mo more than you earn. Focus on closing this gap before other goals.`);
    }
  } else if (hasIncome) {
    parts.push(`You're earning ${fmt(monthlyIncome)}/mo. Add your expenses to see your full cash flow picture.`);
  } else {
    parts.push(`You're spending ${fmt(totalOutflows)}/mo. Add your income to see how much you can save.`);
  }

  return parts.join(" ");
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
  const { cashAssets, monthlyObligations, assetCategories, highInterestDebts, moderateInterestDebts, isRetired } = d;

  const starterTarget = 1000;
  const fullEFTarget = monthlyObligations > 0 ? monthlyObligations * 3 : 0;

  const hasTFSA = hasAccount(assetCategories, CA_TAX_FREE_KEYWORDS);
  const hasRRSP = hasAccount(assetCategories, CA_TAX_DEFERRED_KEYWORDS);
  const hasRESP_FHSA = hasAccount(assetCategories, CA_RESP_FHSA_KEYWORDS);

  const starterProgress = Math.round(clamp((cashAssets / starterTarget) * 100, 0, 100));
  const fullEFProgress =
    fullEFTarget > 0 ? Math.round(clamp((cashAssets / fullEFTarget) * 100, 0, 100)) : 0;

  const efMonths = monthlyObligations > 0 ? cashAssets / monthlyObligations : 0;

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
              ? isRetired
                ? "Expenses tracked — living on savings/investments."
                : "Expenses entered, but no income yet."
              : "Enter your income and expenses to begin.",
      detailText: buildBudgetDetailText(d),
      progress: (isRetired ? d.hasExpenses : d.hasIncome && d.hasExpenses) ? 100 : d.hasIncome || d.hasExpenses ? 50 : 0,
      isComplete: isRetired ? d.hasExpenses : d.hasIncome && d.hasExpenses,
    },
    {
      id: "ca-starter-ef",
      title: "Starter Emergency Fund ($1,000)",
      description: "Save a small cash buffer to avoid going into debt for minor emergencies.",
      completionHint:
        cashAssets >= starterTarget
          ? "Your cash savings cover this buffer."
          : `${starterProgress}% of the $1,000 goal reached.`,
      detailText:
        "A $1,000 cushion handles unexpected car repairs, medical co-pays, or appliance failures without reaching for a credit card. Keep it in a high-interest savings account (HISA). Once in place, focus on debt — revisit your emergency fund size in step 5.",
      progress: starterProgress,
      isComplete: cashAssets >= starterTarget,
    },
    {
      id: "ca-employer-match",
      title: "Employer RRSP / Pension Match",
      description:
        "Capture any employer contribution match — it's an instant 50–100% return before anything else.",
      completionHint: isRetired
        ? "Retired — employer match not applicable."
        : "Confirm you're capturing your full employer match.",
      detailText:
        "If your employer matches RRSP or pension contributions, prioritize contributing enough to capture the full match before paying down debt. This is typically the highest-ROI financial move available — a 50% match on 6% of salary is a 50% guaranteed return. If no match is offered, skip this step.",
      progress: isRetired ? 100 : 0,
      isComplete: isRetired,
      userAcknowledgeable: !isRetired,
      acknowledgeLabel: "I'm capturing my full employer match",
      skippable: !isRetired,
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
      description: "Build cash savings to cover 3–6 months of total living expenses.",
      completionHint:
        fullEFTarget > 0
          ? cashAssets >= fullEFTarget
            ? `Your cash savings cover ~${efMonths.toFixed(1)} months — emergency fund complete.`
            : `~${efMonths.toFixed(1)} of 3 months covered.`
          : "Enter your expenses to calculate your emergency fund target.",
      detailText:
        "A full emergency fund covers 3–6 months of total obligations (expenses + mortgage + debt payments). Keep it in a HISA or short-term GIC ladder — not in TFSA, RRSP, or investment accounts. Job loss, illness, or major repairs become manageable rather than catastrophic. 3 months is a good starting goal; 6 months is recommended if your income is irregular.",
      progress: fullEFProgress,
      isComplete: fullEFTarget > 0 && cashAssets >= fullEFTarget,
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
      skippable: isRetired,
      skipLabel: "Retired — contributions are optional",
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
      skippable: isRetired,
      skipLabel: "Retired — new contributions are optional",
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
  const { cashAssets, monthlyObligations, assetCategories, highInterestDebts, moderateInterestDebts, isRetired } = d;

  const starterTarget = 1000;
  const fullEFTarget = monthlyObligations > 0 ? monthlyObligations * 3 : 0;

  const hasHSA = hasAccount(assetCategories, US_HSA_KEYWORDS);
  const hasIRA = hasAccount(assetCategories, US_IRA_KEYWORDS);
  const has401k = hasAccount(assetCategories, US_401K_KEYWORDS);

  const starterProgress = Math.round(clamp((cashAssets / starterTarget) * 100, 0, 100));
  const fullEFProgress =
    fullEFTarget > 0 ? Math.round(clamp((cashAssets / fullEFTarget) * 100, 0, 100)) : 0;

  const efMonths = monthlyObligations > 0 ? cashAssets / monthlyObligations : 0;

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
              ? isRetired
                ? "Expenses tracked — living on savings/investments."
                : "Expenses entered, but no income yet."
              : "Enter your income and expenses to begin.",
      detailText: buildBudgetDetailText(d),
      progress: (isRetired ? d.hasExpenses : d.hasIncome && d.hasExpenses) ? 100 : d.hasIncome || d.hasExpenses ? 50 : 0,
      isComplete: isRetired ? d.hasExpenses : d.hasIncome && d.hasExpenses,
    },
    {
      id: "us-starter-ef",
      title: "Starter Emergency Fund ($1,000)",
      description: "Save a small cash buffer to avoid going into debt for minor emergencies.",
      completionHint:
        cashAssets >= starterTarget
          ? "Your cash savings cover this buffer."
          : `${starterProgress}% of the $1,000 goal reached.`,
      detailText:
        "A $1,000 cushion handles unexpected car repairs, medical co-pays, or appliance failures without reaching for a credit card. Keep it in a high-yield savings account (HYSA). Once in place, focus on debt — revisit your emergency fund size in step 5.",
      progress: starterProgress,
      isComplete: cashAssets >= starterTarget,
    },
    {
      id: "us-employer-match",
      title: "Employer 401(k) Match",
      description:
        "Contribute enough to your 401(k) to capture any employer match — it's an instant 50–100% return.",
      completionHint: isRetired
        ? "Retired — employer match not applicable."
        : "Confirm you're capturing your full employer match.",
      detailText:
        "If your employer matches 401(k) contributions, prioritize contributing enough to capture the full match before paying down debt. A 50% match on 6% of salary is a 50% guaranteed return — no investment beats this. If your employer offers a 403(b) or 457, the same principle applies. If no match is available, skip this step.",
      progress: isRetired ? 100 : 0,
      isComplete: isRetired,
      userAcknowledgeable: !isRetired,
      acknowledgeLabel: "I'm contributing enough to capture my full employer match",
      skippable: !isRetired,
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
      description: "Build cash savings to cover 3–6 months of total living expenses.",
      completionHint:
        fullEFTarget > 0
          ? cashAssets >= fullEFTarget
            ? `Your cash savings cover ~${efMonths.toFixed(1)} months — emergency fund complete.`
            : `~${efMonths.toFixed(1)} of 3 months covered.`
          : "Enter your expenses to calculate your emergency fund target.",
      detailText:
        "A full emergency fund covers 3–6 months of total obligations (expenses + mortgage + debt payments). Keep it in a HYSA — not in 401(k), IRA, or investment accounts. Job loss, illness, or major repairs become manageable rather than catastrophic. 3 months is a good goal if you have stable employment; 6 months if income is irregular or you're self-employed.",
      progress: fullEFProgress,
      isComplete: fullEFTarget > 0 && cashAssets >= fullEFTarget,
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
      userAcknowledgeable: !isRetired,
      acknowledgeLabel: "I'm maxing my HSA",
      skippable: true,
      skipLabel: isRetired ? "Retired — new contributions are optional" : "Not enrolled in an HDHP / not eligible for HSA",
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
      skippable: isRetired,
      skipLabel: "Retired — new contributions are optional",
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
      skippable: isRetired,
      skipLabel: "Retired — new contributions are optional",
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

// ── AU step definitions ───────────────────────────────────────────────────────

function buildAUSteps(d: InferredData): RawStep[] {
  const { cashAssets, monthlyObligations, assetCategories, highInterestDebts, moderateInterestDebts, isRetired } = d;

  const fullEFTarget = monthlyObligations > 0 ? monthlyObligations * 3 : 0;
  const fullEFProgress = fullEFTarget > 0 ? Math.round(clamp((cashAssets / fullEFTarget) * 100, 0, 100)) : 0;
  const efMonths = monthlyObligations > 0 ? cashAssets / monthlyObligations : 0;

  const hasSuper = hasAccount(assetCategories, AU_SUPER_KEYWORDS);
  const hasFHSS = hasAccount(assetCategories, AU_FHSS_KEYWORDS);
  const hasETF = hasAccount(assetCategories, AU_ETF_KEYWORDS);

  return [
    {
      id: "au-budget",
      title: "Budget & Essentials",
      description:
        "Track your income and essential expenses. Know where your money goes before anything else.",
      completionHint:
        d.hasIncome && d.hasExpenses
          ? "Income and expenses are entered — great start."
          : d.hasIncome
            ? "Income entered, but no expenses yet."
            : d.hasExpenses
              ? isRetired
                ? "Expenses tracked — living on savings/investments."
                : "Expenses entered, but no income yet."
              : "Enter your income and expenses to begin.",
      detailText: buildBudgetDetailText(d),
      progress: (isRetired ? d.hasExpenses : d.hasIncome && d.hasExpenses) ? 100 : d.hasIncome || d.hasExpenses ? 50 : 0,
      isComplete: isRetired ? d.hasExpenses : d.hasIncome && d.hasExpenses,
    },
    {
      id: "au-emergency-fund",
      title: "Emergency Fund (3–6 Months)",
      description: "Build cash savings to cover 3–6 months of living expenses before investing.",
      completionHint:
        fullEFTarget > 0
          ? cashAssets >= fullEFTarget
            ? `Your cash savings cover ~${efMonths.toFixed(1)} months — emergency fund complete.`
            : `~${efMonths.toFixed(1)} of 3 months covered.`
          : "Enter your expenses to calculate your emergency fund target.",
      detailText:
        "Unlike the US/CA flowcharts, AusFinance recommends building a full 3–6 month emergency fund before aggressively investing. Keep it in a High Interest Savings Account (HISA) — online banks like ING, Ubank, or Macquarie typically offer the best rates. This covers unexpected costs (car repairs, medical, job loss) without raiding your super or going into debt.",
      progress: fullEFProgress,
      isComplete: fullEFTarget > 0 && cashAssets >= fullEFTarget,
    },
    {
      id: "au-super-guarantee",
      title: "Employer Super Guarantee (11.5%)",
      description:
        "Ensure your employer is paying the compulsory 11.5% super guarantee on your salary.",
      completionHint: isRetired
        ? "Retired — super guarantee not applicable."
        : "Confirm your employer is paying 11.5% SGC.",
      detailText:
        "Australian employers must contribute 11.5% of your ordinary time earnings to your super fund (increasing to 12% from 1 July 2025). Check your payslip or myGov to confirm. If your employer is not paying the SGC, contact the ATO. Consolidate multiple super accounts via myGov to avoid paying multiple sets of fees — this is one of the easiest wins available.",
      progress: isRetired ? 100 : 0,
      isComplete: isRetired,
      userAcknowledgeable: !isRetired,
      acknowledgeLabel: "My employer is paying the full 11.5% super guarantee",
      skippable: !isRetired,
      skipLabel: "Self-employed or employer super not applicable",
    },
    {
      id: "au-high-debt",
      title: "Pay High-Interest Debt (>8%)",
      description:
        "Eliminate debt with interest rates above 8% — credit cards, personal loans, buy-now-pay-later.",
      completionHint:
        highInterestDebts.length === 0
          ? "No high-interest debt detected."
          : `High-interest debt: ${highInterestDebts.map((d) => d.category).join(", ")}.`,
      detailText:
        "High-interest debt costs more than most investments earn. Australian credit cards typically charge 20–22% p.a. — paying these off is a guaranteed ~20% return. Use the avalanche method (highest rate first) or snowball method (smallest balance first, for motivation). HECS-HELP is indexed to CPI (not standard interest) — it's generally low priority and can wait. Enter debt interest rates in the Debts section for tracking.",
      progress: highInterestDebts.length === 0 ? 100 : 0,
      isComplete: highInterestDebts.length === 0,
    },
    {
      id: "au-salary-sacrifice",
      title: "Salary Sacrifice to Super",
      description:
        "Contribute to super via salary sacrifice up to the $30,000 concessional cap for tax savings.",
      completionHint: isRetired
        ? "Retired — salary sacrifice not applicable."
        : hasSuper
          ? "You have a super account. Confirm you're making concessional contributions."
          : "No super account detected — confirm contributions are being made.",
      detailText:
        "Salary sacrifice contributions to super are taxed at just 15% (instead of your marginal tax rate), making this highly effective for most Australians. The concessional cap is $30,000/year (including the 11.5% SGC from your employer). Unused cap space from prior years can also be carried forward. Access to super is generally preserved until age 60, so balance contributions against short-term liquidity needs. Set up salary sacrifice via your employer's payroll.",
      progress: isRetired ? 100 : hasSuper ? 50 : 0,
      isComplete: isRetired,
      userAcknowledgeable: !isRetired,
      acknowledgeLabel: "I'm making concessional super contributions (salary sacrifice or personal deductible)",
      skippable: !isRetired,
      skipLabel: "Self-employed or salary sacrifice not applicable",
    },
    {
      id: "au-fhss",
      title: "First Home Super Saver (FHSS)",
      description:
        "Use the FHSS scheme to save for your first home inside super — with tax advantages.",
      completionHint: hasFHSS
        ? "You have an FHSS account in your assets."
        : "No FHSS detected. Only applies if saving for a first home.",
      detailText:
        "The First Home Super Saver scheme lets first-home buyers save up to $15,000/year (max $50,000 total) inside super using concessional or non-concessional contributions. Withdrawals are taxed at your marginal rate minus a 30% tax offset — typically better than saving in a standard savings account. You must apply to the ATO to release FHSS funds before signing a contract. Only applies if you've never owned a home in Australia.",
      progress: hasFHSS ? 100 : 0,
      isComplete: hasFHSS,
      userAcknowledgeable: true,
      acknowledgeLabel: "I'm actively saving via the FHSS scheme",
      skippable: true,
      skipLabel: "Already own a home or not saving for a first home",
    },
    {
      id: "au-moderate-debt",
      title: "Pay Moderate-Interest Debt (4–8%)",
      description:
        "Pay down debt with interest rates between 4% and 8% — car loans, personal loans, lines of credit.",
      completionHint:
        moderateInterestDebts.length === 0
          ? "No moderate-interest debt detected."
          : `Moderate-interest debt: ${moderateInterestDebts.map((d) => d.category).join(", ")}.`,
      detailText:
        "Once emergency fund and super contributions are in order, tackle moderate-interest debt. At 4–8%, the expected return from investing is competitive with the guaranteed return from paying down debt — the right choice depends on your risk tolerance. Many Australians split extra cash between debt reduction and investing at this stage. HECS-HELP (indexed to CPI only) is generally low priority.",
      progress: moderateInterestDebts.length === 0 ? 100 : 0,
      isComplete: moderateInterestDebts.length === 0,
    },
    {
      id: "au-etf-invest",
      title: "Invest in Diversified ETFs (ASX)",
      description:
        "Invest surplus savings in diversified index ETFs via the ASX for long-term wealth building.",
      completionHint: hasETF
        ? "You have investment/ETF holdings in your assets."
        : "No investment accounts detected — consider opening a brokerage account.",
      detailText:
        "Once debt is managed and super is on track, invest surplus in a diversified share portfolio outside super. Low-cost, globally diversified ETFs on the ASX are the AusFinance community standard: Vanguard (VAS, VGS, VDHG), iShares (IVV), or Betashares (NDQ, DHHF). Open a share trading account with CommSec, SelfWealth, Stake, or similar. Consider franking credits on Australian shares — these can reduce or eliminate your tax liability.",
      progress: hasETF ? 100 : 0,
      isComplete: hasETF,
      skippable: isRetired,
      skipLabel: "Already investing or retired",
    },
    {
      id: "au-nonconcessional-super",
      title: "Non-Concessional Super Contributions",
      description:
        "Make after-tax contributions to super up to the $120,000 non-concessional cap.",
      completionHint: isRetired
        ? "Retired — additional super contributions may still apply."
        : hasSuper
          ? "You have a super account. Consider non-concessional contributions."
          : "No super account detected.",
      detailText:
        "Non-concessional contributions (after-tax money into super) are taxed at 0% inside super — all growth and withdrawals in pension phase are tax-free. The annual cap is $120,000; a bring-forward rule allows up to $360,000 in a single year (if eligible). Particularly effective for those approaching retirement with additional savings to shelter. Remember: super is preserved until preservation age (60–65 depending on birth year).",
      progress: isRetired ? 100 : hasSuper ? 50 : 0,
      isComplete: false,
      userAcknowledgeable: true,
      acknowledgeLabel: "I'm making or planning non-concessional super contributions",
      skippable: true,
      skipLabel: "Not applicable at this stage",
    },
    {
      id: "au-lifestyle-giving",
      title: "Lifestyle & Giving Goals",
      description:
        "Pursue lifestyle goals, charitable giving, and additional wealth building beyond core investments.",
      completionHint: "Plan for lifestyle goals, charitable giving, and beyond.",
      detailText:
        "Once you've reached this step, you're in an excellent financial position. Consider: upgrading your investment property portfolio, donating to registered charities (tax-deductible in Australia), contributing to your children's education, travel and lifestyle funds, or gifting. Review your estate plan, beneficiary nominations on your super (binding death benefit nominations), and income protection / life insurance needs. Revisit your strategy annually.",
      progress: 0,
      isComplete: false,
      userAcknowledgeable: true,
      acknowledgeLabel: "I'm actively pursuing lifestyle goals and long-term planning",
    },
  ];
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Infer and return the ordered flowchart steps for the user's country.
 * Steps are marked complete/in-progress/upcoming based on FinancialState alone.
 * Call applyUserOverrides() afterwards to incorporate acknowledged/skipped steps.
 *
 * @param isRetired - When true, employer match steps are auto-completed and
 *   income-dependent steps relax their completion criteria.
 */
export function getFlowchartSteps(state: FinancialState, isRetired = false): FlowchartStep[] {
  const country = state.country ?? "CA";
  const d = inferData(state, isRetired);
  const rawSteps =
    country === "US" ? buildUSSteps(d) : country === "AU" ? buildAUSteps(d) : buildCASteps(d);

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
// ── Step context: actual user data for each step ─────────────────────────────

export interface StepContextItem {
  label: string;
  amount: number;
  detail?: string; // e.g., "@ 19.99%", "+$500/mo"
}

export interface StepContext {
  heading: string;
  items: StepContextItem[];
  progress?: { current: number; target: number };
}

function matchingAssetItems(state: FinancialState, keywords: string[]): StepContextItem[] {
  return state.assets
    .filter((a) => !a.computed && hasAccount([a.category], keywords))
    .map((a) => ({
      label: a.category,
      amount: a.amount,
      detail: a.monthlyContribution ? `+$${Math.round(a.monthlyContribution).toLocaleString()}/mo` : undefined,
    }));
}

/**
 * Returns the user's actual financial data relevant to a given step.
 * Used to show "Your situation" in the detail modal.
 */
export function getStepContext(stepId: string, state: FinancialState): StepContext | null {
  switch (stepId) {
    case "au-budget":
    case "ca-budget":
    case "us-budget": {
      const items: StepContextItem[] = [
        ...state.income.map((i) => ({
          label: i.category || "Income",
          amount: normalizeToMonthly(i.amount, i.frequency ?? "monthly"),
          detail: "/mo",
        })),
      ];
      // Add investment returns from assets with ROI
      const investmentReturns = state.assets
        .filter((a) => !a.computed && (a.roi ?? 0) > 0)
        .reduce((sum, a) => sum + (a.amount * (a.roi! / 100)) / 12, 0);
      if (investmentReturns > 0) {
        items.push({
          label: "Investment returns",
          amount: Math.round(investmentReturns),
          detail: "/mo",
        });
      }
      items.push(
        ...state.expenses.map((e) => ({
          label: e.category || "Expense",
          amount: -normalizeExpenseToMonthly(e.amount, e.frequency),
          detail: "/mo",
        })),
      );
      if (items.length === 0) return null;
      return { heading: "Your income & expenses", items };
    }

    case "ca-starter-ef":
    case "us-starter-ef": {
      const cash = getCashAssets(state);
      const cashItems = getCashAssetItems(state);
      return {
        heading: "Your cash savings",
        items: cashItems.map((a) => ({ label: a.category, amount: a.amount })),
        progress: { current: cash, target: 1000 },
      };
    }

    case "au-emergency-fund":
    case "ca-full-ef":
    case "us-full-ef": {
      const cash = getCashAssets(state);
      const cashItems = getCashAssetItems(state);
      const expenses = getRawMonthlyExpenses(state);
      const mortgage = getMonthlyMortgage(state);
      const debtPay = getMonthlyDebtPayments(state);
      const mo = expenses + mortgage + debtPay;
      const target = mo * 3;
      const items: StepContextItem[] = [];
      for (const a of cashItems) items.push({ label: a.category, amount: a.amount });
      if (expenses > 0) items.push({ label: "Monthly expenses", amount: expenses, detail: "/mo" });
      if (mortgage > 0) items.push({ label: "Mortgage payments", amount: mortgage, detail: "/mo" });
      if (debtPay > 0) items.push({ label: "Debt payments", amount: debtPay, detail: "/mo" });
      if (mo > 0) items.push({ label: "Total obligations", amount: mo, detail: "/mo" });
      return {
        heading: "Emergency fund breakdown",
        items,
        progress: target > 0 ? { current: cash, target } : undefined,
      };
    }

    case "au-super-guarantee":
    case "au-salary-sacrifice":
    case "au-nonconcessional-super":
      return { heading: "Your super accounts", items: matchingAssetItems(state, AU_SUPER_KEYWORDS) };
    case "au-fhss":
      return { heading: "Your FHSS accounts", items: matchingAssetItems(state, AU_FHSS_KEYWORDS) };
    case "au-etf-invest": {
      const items = state.assets
        .filter((a) => !a.computed && hasAccount([a.category], AU_ETF_KEYWORDS))
        .map((a) => ({ label: a.category, amount: a.amount }));
      const stockItems = (state.stocks ?? []).map((s) => ({ label: s.ticker || "Stock", amount: getStockValue(s) }));
      return { heading: "Your investment / ETF holdings", items: [...items, ...stockItems] };
    }

    case "ca-tfsa":
      return { heading: "Your TFSA accounts", items: matchingAssetItems(state, CA_TAX_FREE_KEYWORDS) };
    case "ca-rrsp":
      return { heading: "Your RRSP accounts", items: matchingAssetItems(state, CA_TAX_DEFERRED_KEYWORDS) };
    case "ca-resp-fhsa":
      return { heading: "Your RESP / FHSA accounts", items: matchingAssetItems(state, CA_RESP_FHSA_KEYWORDS) };
    case "ca-employer-match":
      return { heading: "Your RRSP / pension accounts", items: matchingAssetItems(state, CA_TAX_DEFERRED_KEYWORDS) };

    case "us-hsa":
      return { heading: "Your HSA accounts", items: matchingAssetItems(state, US_HSA_KEYWORDS) };
    case "us-ira":
      return { heading: "Your IRA accounts", items: matchingAssetItems(state, US_IRA_KEYWORDS) };
    case "us-401k":
      return { heading: "Your 401(k) accounts", items: matchingAssetItems(state, US_401K_KEYWORDS) };
    case "us-employer-match":
      return { heading: "Your 401(k) accounts", items: matchingAssetItems(state, US_401K_KEYWORDS) };

    case "au-high-debt":
    case "ca-high-debt":
    case "us-high-debt": {
      const debts = state.debts.filter((d) => d.interestRate !== undefined && d.interestRate > 8);
      return {
        heading: "Your high-interest debts",
        items: debts.map((d) => ({ label: d.category, amount: d.amount, detail: `@ ${d.interestRate}%` })),
      };
    }

    case "au-moderate-debt":
    case "ca-moderate-debt":
    case "us-moderate-debt": {
      const debts = state.debts.filter((d) => d.interestRate !== undefined && d.interestRate >= 4 && d.interestRate <= 8);
      return {
        heading: "Your moderate-interest debts",
        items: debts.map((d) => ({ label: d.category, amount: d.amount, detail: `@ ${d.interestRate}%` })),
      };
    }

    case "au-lifestyle-giving":
      return null;

    case "ca-taxable":
    case "us-taxable": {
      // Show assets that don't match any tax-advantaged keywords
      const allTaxAdvantaged = [
        ...CA_TAX_FREE_KEYWORDS, ...CA_TAX_DEFERRED_KEYWORDS, ...CA_RESP_FHSA_KEYWORDS,
        ...US_HSA_KEYWORDS, ...US_IRA_KEYWORDS, ...US_401K_KEYWORDS,
      ];
      const items = state.assets
        .filter((a) => !a.computed && !hasAccount([a.category], allTaxAdvantaged))
        .map((a) => ({ label: a.category, amount: a.amount }));
      const stockItems = (state.stocks ?? []).map((s) => ({ label: s.ticker || "Stock", amount: getStockValue(s) }));
      return { heading: "Your taxable / non-registered holdings", items: [...items, ...stockItems] };
    }

    default:
      return null;
  }
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
