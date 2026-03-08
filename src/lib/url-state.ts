import type { FinancialState } from "@/lib/financial-state";
import { getHomeCurrency } from "@/lib/currency";
import type { SupportedCurrency } from "@/lib/currency";
import { deflate, inflate } from "pako";

// ASCII85 (base85) encoding/decoding for compact URL state
// Encodes binary data using printable ASCII characters (33-117), ~20% smaller than base64

const ASCII85_START = 33; // '!'
const ASCII85_END = 117; // 'u'

function encode85(bytes: Uint8Array): string {
  let result = "";
  let i = 0;

  while (i < bytes.length) {
    // Process 4 bytes at a time
    let value = 0;
    const blockSize = Math.min(4, bytes.length - i);

    for (let j = 0; j < 4; j++) {
      value = value * 256 + (j < blockSize ? bytes[i + j] : 0);
    }

    // Special case: 4 zero bytes encode as 'z'
    if (value === 0 && blockSize === 4) {
      result += "z";
      i += 4;
      continue;
    }

    // Convert to 5 base-85 digits
    const digits: number[] = [];
    for (let j = 0; j < 5; j++) {
      digits.unshift(value % 85);
      value = Math.floor(value / 85);
    }

    // Only output blockSize+1 digits for the last partial block
    const outputDigits = blockSize === 4 ? 5 : blockSize + 1;
    for (let j = 0; j < outputDigits; j++) {
      result += String.fromCharCode(digits[j] + ASCII85_START);
    }

    i += 4;
  }

  return result;
}

function decode85(encoded: string): Uint8Array {
  const bytes: number[] = [];
  let i = 0;

  while (i < encoded.length) {
    // Special case: 'z' represents 4 zero bytes
    if (encoded[i] === "z") {
      bytes.push(0, 0, 0, 0);
      i++;
      continue;
    }

    // Read up to 5 digits
    const digits: number[] = [];
    while (digits.length < 5 && i < encoded.length && encoded[i] !== "z") {
      const code = encoded.charCodeAt(i) - ASCII85_START;
      if (code < 0 || code > ASCII85_END - ASCII85_START) {
        throw new Error(`Invalid ASCII85 character at position ${i}`);
      }
      digits.push(code);
      i++;
    }

    // Pad short blocks with 'u' (84) for decoding
    const blockSize = digits.length;
    while (digits.length < 5) {
      digits.push(84); // 'u' - ASCII85_START = 84
    }

    // Convert 5 base-85 digits to a 32-bit value
    let value = 0;
    for (let j = 0; j < 5; j++) {
      value = value * 85 + digits[j];
    }

    // Extract 4 bytes (or fewer for the last block)
    const outputBytes = blockSize === 5 ? 4 : blockSize - 1;
    for (let j = 3; j >= 4 - outputBytes; j--) {
      bytes.push((value >> (j * 8)) & 0xff);
    }
  }

  return new Uint8Array(bytes);
}

// Strip IDs from state before encoding to reduce URL size
interface CompactAsset {
  c: string; // category
  a: number; // amount
  r?: number; // roi (annual %)
  rt?: string; // roiTaxTreatment ("income" only, omitted when "capital-gains"/default)
  m?: number; // monthlyContribution ($)
  st?: 1; // surplusTarget
  cu?: string; // currency override (omitted when home currency)
  cb?: number; // costBasisPercent (0-100, omitted when 100/default)
  tt?: string; // taxTreatment override ("tax-free" | "tax-deferred" | "taxable", omitted when auto-detected)
  emp?: number; // employerMatchPct (e.g., 50 = 50% match)
  emc?: number; // employerMatchCap (e.g., 6 = 6% of salary cap)
}
interface CompactDebt {
  c: string;
  a: number;
  ir?: number; // interestRate (annual %)
  mp?: number; // monthlyPayment ($)
  cu?: string; // currency override
}
interface CompactIncome {
  c: string;
  a: number;
  f?: string; // frequency (omitted when "monthly" / default)
  it?: string; // incomeType (omitted when "employment" / default)
  cu?: string; // currency (omitted when home currency)
}
interface CompactExpense {
  c: string;
  a: number;
  cu?: string; // currency (omitted when home currency)
}
interface CompactProperty {
  n: string; // name
  v: number; // value
  m: number; // mortgage
  ir?: number; // interestRate (annual %)
  mp?: number; // monthlyPayment ($)
  ay?: number; // amortizationYears
  yp?: number; // yearPurchased
  ap?: number; // appreciation (annual %)
  cu?: string; // currency override
}
interface CompactStock {
  t: string; // ticker
  s: number; // shares
  cb?: number; // costBasis
  pd?: string; // purchaseDate (ISO date string)
}
interface CompactTaxCredit {
  c: string; // category
  a: number; // annualAmount
  t: string; // type ("refundable" | "non-refundable" | "deduction")
}
interface CompactState {
  a: CompactAsset[];
  d: CompactDebt[];
  i: CompactIncome[];
  e: CompactExpense[];
  p?: CompactProperty[]; // properties (optional for backward compat)
  st?: CompactStock[]; // stocks (optional for backward compat)
  co?: string; // country ("CA" | "US", optional for backward compat)
  ju?: string; // jurisdiction (province/state code, optional for backward compat)
  ag?: number; // age (optional)
  ft?: number; // federal tax override (annual)
  pt?: number; // provincial/state tax override (annual)
  sr?: string; // surplusTargetComputedId — set when surplus target is a computed asset (e.g. "_computed_stocks")
  fxm?: number; // FX manual override: 1 foreign = X home
  tc?: CompactTaxCredit[]; // tax credits and deductions
  fs?: string; // filing status
  ty?: number; // tax year (2025 or 2026, omitted when 2025/default)
}

function toCompact(state: FinancialState): CompactState {
  // Filter out auto-computed assets (stocks/equity synced from other sections) —
  // they get re-derived on load, so persisting them causes duplicates.
  const realAssets = state.assets.filter((a) => !a.computed);
  const homeCurrency = getHomeCurrency(state.country ?? "CA");
  const compact: CompactState = {
    a: realAssets.map((x) => {
      const ca: CompactAsset = { c: x.category, a: x.amount };
      if (x.roi !== undefined) ca.r = x.roi;
      if (x.roiTaxTreatment && x.roiTaxTreatment !== "capital-gains") ca.rt = x.roiTaxTreatment;
      if (x.monthlyContribution !== undefined && x.monthlyContribution > 0) ca.m = x.monthlyContribution;
      if (x.surplusTarget) ca.st = 1;
      if (x.currency && x.currency !== homeCurrency) ca.cu = x.currency;
      if (x.costBasisPercent !== undefined && x.costBasisPercent < 100) ca.cb = x.costBasisPercent;
      if (x.taxTreatment) ca.tt = x.taxTreatment;
      if (x.employerMatchPct !== undefined && x.employerMatchPct > 0) ca.emp = x.employerMatchPct;
      if (x.employerMatchCap !== undefined && x.employerMatchCap > 0) ca.emc = x.employerMatchCap;
      return ca;
    }),
    d: state.debts.map((x) => {
      const cd: CompactDebt = { c: x.category, a: x.amount };
      if (x.interestRate !== undefined) cd.ir = x.interestRate;
      if (x.monthlyPayment !== undefined && x.monthlyPayment > 0) cd.mp = x.monthlyPayment;
      if (x.currency && x.currency !== homeCurrency) cd.cu = x.currency;
      return cd;
    }),
    i: state.income.map((x) => {
      const ci: CompactIncome = { c: x.category, a: x.amount };
      if (x.frequency && x.frequency !== "monthly") ci.f = x.frequency;
      if (x.incomeType && x.incomeType !== "employment") ci.it = x.incomeType;
      if (x.currency && x.currency !== homeCurrency) ci.cu = x.currency;
      return ci;
    }),
    e: state.expenses.map((x) => {
      const ce: CompactExpense = { c: x.category, a: x.amount };
      if (x.currency && x.currency !== homeCurrency) ce.cu = x.currency;
      return ce;
    }),
  };
  const properties = state.properties ?? [];
  if (properties.length > 0) {
    compact.p = properties.map((x) => {
      const cp: CompactProperty = { n: x.name, v: x.value, m: x.mortgage };
      if (x.interestRate !== undefined) cp.ir = x.interestRate;
      if (x.monthlyPayment !== undefined && x.monthlyPayment > 0) cp.mp = x.monthlyPayment;
      if (x.amortizationYears !== undefined) cp.ay = x.amortizationYears;
      if (x.yearPurchased !== undefined) cp.yp = x.yearPurchased;
      if (x.appreciation !== undefined) cp.ap = x.appreciation;
      if (x.currency && x.currency !== homeCurrency) cp.cu = x.currency;
      return cp;
    });
  }
  const stocks = state.stocks ?? [];
  if (stocks.length > 0) {
    compact.st = stocks.map((x) => {
      const cs: CompactStock = { t: x.ticker, s: x.shares };
      if (x.costBasis !== undefined) cs.cb = x.costBasis;
      if (x.purchaseDate) cs.pd = x.purchaseDate;
      return cs;
    });
  }
  if (state.country) compact.co = state.country;
  if (state.jurisdiction) compact.ju = state.jurisdiction;
  if (state.age !== undefined && state.age > 0) compact.ag = state.age;
  if (state.federalTaxOverride !== undefined) compact.ft = state.federalTaxOverride;
  if (state.provincialTaxOverride !== undefined) compact.pt = state.provincialTaxOverride;
  // Persist surplus target if it's on a computed asset (which isn't in the `a` array)
  const computedSurplusTarget = state.assets.find((a) => a.computed && a.surplusTarget);
  const surplusComputedId = computedSurplusTarget?.id ?? state.surplusTargetComputedId;
  if (surplusComputedId) compact.sr = surplusComputedId;
  if (state.fxManualOverride !== undefined && state.fxManualOverride > 0) compact.fxm = state.fxManualOverride;
  const taxCredits = state.taxCredits ?? [];
  if (taxCredits.length > 0) {
    compact.tc = taxCredits.map((x) => ({
      c: x.category,
      a: x.annualAmount,
      t: x.type,
    }));
  }
  if (state.filingStatus) compact.fs = state.filingStatus;
  if (state.taxYear !== undefined && state.taxYear !== 2025) compact.ty = state.taxYear;
  return compact;
}

function fromCompact(compact: CompactState): FinancialState {
  return {
    assets: (() => {
      const assets = compact.a.map((x, i) => {
        const asset: { id: string; category: string; amount: number; roi?: number; roiTaxTreatment?: import("@/components/AssetEntry").RoiTaxTreatment; monthlyContribution?: number; surplusTarget?: boolean; currency?: SupportedCurrency; costBasisPercent?: number; taxTreatment?: import("@/lib/withdrawal-tax").TaxTreatment; employerMatchPct?: number; employerMatchCap?: number } = { id: `a${i + 1}`, category: x.c, amount: x.a };
        if (x.r !== undefined) asset.roi = x.r;
        if (x.rt) asset.roiTaxTreatment = x.rt as import("@/components/AssetEntry").RoiTaxTreatment;
        if (x.m !== undefined) asset.monthlyContribution = x.m;
        if (x.st) asset.surplusTarget = true;
        if (x.cu) asset.currency = x.cu as SupportedCurrency;
        if (x.cb !== undefined) asset.costBasisPercent = x.cb;
        if (x.tt) asset.taxTreatment = x.tt as import("@/lib/withdrawal-tax").TaxTreatment;
        if (x.emp !== undefined) asset.employerMatchPct = x.emp;
        if (x.emc !== undefined) asset.employerMatchCap = x.emc;
        return asset;
      });
      // Ensure exactly one asset is the surplus target — but not if a computed asset owns it (sr field)
      if (assets.length > 0 && !assets.some((a) => a.surplusTarget) && !compact.sr) {
        assets[0].surplusTarget = true;
      }
      return assets;
    })(),
    debts: compact.d.map((x, i) => {
      const debt: { id: string; category: string; amount: number; interestRate?: number; monthlyPayment?: number; currency?: SupportedCurrency } = { id: `d${i + 1}`, category: x.c, amount: x.a };
      if (x.ir !== undefined) debt.interestRate = x.ir;
      if (x.mp !== undefined) debt.monthlyPayment = x.mp;
      if (x.cu) debt.currency = x.cu as SupportedCurrency;
      return debt;
    }),
    income: compact.i.map((x, i) => {
      const item: { id: string; category: string; amount: number; frequency?: import("@/components/IncomeEntry").IncomeFrequency; incomeType?: import("@/components/IncomeEntry").IncomeType; currency?: SupportedCurrency } = { id: `i${i + 1}`, category: x.c, amount: x.a };
      if (x.f) item.frequency = x.f as import("@/components/IncomeEntry").IncomeFrequency;
      if (x.it) item.incomeType = x.it as import("@/components/IncomeEntry").IncomeType;
      if (x.cu) item.currency = x.cu as SupportedCurrency;
      return item;
    }),
    expenses: compact.e.map((x, i) => {
      const item: { id: string; category: string; amount: number; currency?: SupportedCurrency } = { id: `e${i + 1}`, category: x.c, amount: x.a };
      if (x.cu) item.currency = x.cu as SupportedCurrency;
      return item;
    }),
    properties: (compact.p ?? []).map((x, i) => {
      const prop: { id: string; name: string; value: number; mortgage: number; interestRate?: number; monthlyPayment?: number; amortizationYears?: number; yearPurchased?: number; appreciation?: number; currency?: SupportedCurrency } = {
        id: `p${i + 1}`,
        name: x.n,
        value: x.v,
        mortgage: x.m,
      };
      if (x.ir !== undefined) prop.interestRate = x.ir;
      if (x.mp !== undefined) prop.monthlyPayment = x.mp;
      if (x.ay !== undefined) prop.amortizationYears = x.ay;
      if (x.yp !== undefined) prop.yearPurchased = x.yp;
      if (x.ap !== undefined) prop.appreciation = x.ap;
      if (x.cu) prop.currency = x.cu as SupportedCurrency;
      return prop;
    }),
    stocks: (compact.st ?? []).map((x, i) => {
      const stock: { id: string; ticker: string; shares: number; costBasis?: number; purchaseDate?: string } = {
        id: `s${i + 1}`,
        ticker: x.t,
        shares: x.s,
      };
      if (x.cb !== undefined) stock.costBasis = x.cb;
      if (x.pd) stock.purchaseDate = x.pd;
      return stock;
    }),
    country: (compact.co as "CA" | "US") ?? "CA",
    jurisdiction: compact.ju ?? "ON",
    age: compact.ag,
    federalTaxOverride: compact.ft,
    provincialTaxOverride: compact.pt,
    surplusTargetComputedId: compact.sr,
    fxManualOverride: compact.fxm,
    taxCredits: (compact.tc ?? []).map((x, i) => ({
      id: `tc${i + 1}`,
      category: x.c,
      annualAmount: x.a,
      type: x.t as "refundable" | "non-refundable" | "deduction",
    })),
    filingStatus: compact.fs as import("@/lib/tax-credits").FilingStatus | undefined,
    taxYear: compact.ty,
  };
}

export function encodeState(state: FinancialState): string {
  const compact = toCompact(state);
  const json = JSON.stringify(compact);
  const raw = new TextEncoder().encode(json);

  // Deflate compress, then prepend version byte 0x01
  const compressed = deflate(raw);
  const versioned = new Uint8Array(compressed.length + 1);
  versioned[0] = 0x01;
  versioned.set(compressed, 1);

  return encode85(versioned);
}

export function decodeState(encoded: string): FinancialState | null {
  try {
    const raw = decode85(encoded);
    let bytes: Uint8Array;

    if (raw[0] === 0x01) {
      // Version 1: deflate-compressed
      bytes = inflate(raw.slice(1));
    } else {
      // Legacy: uncompressed (first byte is '{' = 0x7b)
      bytes = raw;
    }

    const json = new TextDecoder().decode(bytes);
    const compact = JSON.parse(json) as CompactState;

    // Validate structure
    if (
      !compact ||
      !Array.isArray(compact.a) ||
      !Array.isArray(compact.d) ||
      !Array.isArray(compact.i) ||
      !Array.isArray(compact.e)
    ) {
      return null;
    }

    return fromCompact(compact);
  } catch {
    return null;
  }
}

export function getStateFromURL(): FinancialState | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get("s");
  if (!encoded) return null;
  return decodeState(encoded);
}

export function updateURL(state: FinancialState): void {
  if (typeof window === "undefined") return;
  const encoded = encodeState(state);
  const url = new URL(window.location.href);
  url.searchParams.set("s", encoded);
  window.history.replaceState(null, "", url.toString());
}

/** Read inflation toggle state from URL params (ia=1 and ir=<rate>). */
export function getInflationFromURL(): { adjusted: boolean; rate: number } {
  if (typeof window === "undefined") return { adjusted: false, rate: 2.5 };
  const params = new URLSearchParams(window.location.search);
  const adjusted = params.get("ia") === "1";
  const parsed = parseFloat(params.get("ir") ?? "2.5");
  const rate = isNaN(parsed) ? 2.5 : parsed;
  return { adjusted, rate };
}

/** Persist inflation toggle state to URL params without affecting the main state param. */
export function updateInflationURL(adjusted: boolean, rate: number): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (adjusted) {
    url.searchParams.set("ia", "1");
    url.searchParams.set("ir", String(rate));
  } else {
    url.searchParams.delete("ia");
    url.searchParams.delete("ir");
  }
  window.history.replaceState(null, "", url.toString());
}

/** Read safe withdrawal rate from URL params (`swr=<rate>`). Defaults to 4. */
export function getSwrFromURL(): number {
  if (typeof window === "undefined") return 4;
  const params = new URLSearchParams(window.location.search);
  const parsed = parseFloat(params.get("swr") ?? "4");
  if (isNaN(parsed)) return 4;
  return Math.max(1, Math.min(10, parsed));
}

/** Persist safe withdrawal rate to URL params without affecting the main state param. */
export function updateSwrURL(rate: number): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (rate === 4) {
    url.searchParams.delete("swr");
  } else {
    url.searchParams.set("swr", String(rate));
  }
  window.history.replaceState(null, "", url.toString());
}

/** Valid outlook year options */
export const OUTLOOK_YEAR_OPTIONS = [20, 30, 40, 50] as const;
export type OutlookYears = (typeof OUTLOOK_YEAR_OPTIONS)[number];

/** Read outlook years from URL params (`oy=<years>`). Defaults to 30. */
export function getOutlookYearsFromURL(): OutlookYears {
  if (typeof window === "undefined") return 30;
  const params = new URLSearchParams(window.location.search);
  const parsed = parseInt(params.get("oy") ?? "30", 10);
  if ((OUTLOOK_YEAR_OPTIONS as readonly number[]).includes(parsed)) return parsed as OutlookYears;
  return 30;
}

/** Persist outlook years to URL params without affecting the main state param. */
export function updateOutlookYearsURL(years: OutlookYears): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (years === 30) {
    url.searchParams.delete("oy");
  } else {
    url.searchParams.set("oy", String(years));
  }
  window.history.replaceState(null, "", url.toString());
}

// ── Flowchart retirement URL helpers ─────────────────────────────────────────

/**
 * Read retirement flag from URL param `fret=1`.
 * When true, the user has indicated they are retired.
 */
export function getRetiredFromURL(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("fret") === "1";
}

/**
 * Persist retirement flag to URL param `fret=1` without affecting other params.
 */
export function updateRetiredURL(isRetired: boolean): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (isRetired) {
    url.searchParams.set("fret", "1");
  } else {
    url.searchParams.delete("fret");
  }
  window.history.replaceState(null, "", url.toString());
}

// ── Flowchart override URL helpers ────────────────────────────────────────────

/**
 * Read flowchart-acknowledged step IDs from URL param `fca=`.
 * Format: comma-separated step IDs, e.g. "ca-employer-match,ca-resp-fhsa"
 */
export function getFlowchartAcksFromURL(): string[] {
  if (typeof window === "undefined") return [];
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("fca");
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Read flowchart-skipped step IDs from URL param `fcs=`.
 * Format: comma-separated step IDs, e.g. "ca-employer-match"
 */
export function getFlowchartSkipsFromURL(): string[] {
  if (typeof window === "undefined") return [];
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("fcs");
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Persist flowchart acknowledged and skipped step IDs to URL params
 * `fca=` and `fcs=` without affecting the main state param.
 */
export function updateFlowchartOverridesURL(acknowledged: string[], skipped: string[]): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (acknowledged.length > 0) {
    url.searchParams.set("fca", acknowledged.join(","));
  } else {
    url.searchParams.delete("fca");
  }
  if (skipped.length > 0) {
    url.searchParams.set("fcs", skipped.join(","));
  } else {
    url.searchParams.delete("fcs");
  }
  window.history.replaceState(null, "", url.toString());
}

// Export for testing
export { encode85, decode85, toCompact, fromCompact };
