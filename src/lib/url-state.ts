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
}
interface CompactExpense {
  c: string;
  a: number;
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
      return ci;
    }),
    e: state.expenses.map((x) => ({ c: x.category, a: x.amount })),
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
  return compact;
}

function fromCompact(compact: CompactState): FinancialState {
  return {
    assets: (() => {
      const assets = compact.a.map((x, i) => {
        const asset: { id: string; category: string; amount: number; roi?: number; roiTaxTreatment?: import("@/components/AssetEntry").RoiTaxTreatment; monthlyContribution?: number; surplusTarget?: boolean; currency?: SupportedCurrency; costBasisPercent?: number; taxTreatment?: import("@/lib/withdrawal-tax").TaxTreatment } = { id: `a${i + 1}`, category: x.c, amount: x.a };
        if (x.r !== undefined) asset.roi = x.r;
        if (x.rt) asset.roiTaxTreatment = x.rt as import("@/components/AssetEntry").RoiTaxTreatment;
        if (x.m !== undefined) asset.monthlyContribution = x.m;
        if (x.st) asset.surplusTarget = true;
        if (x.cu) asset.currency = x.cu as SupportedCurrency;
        if (x.cb !== undefined) asset.costBasisPercent = x.cb;
        if (x.tt) asset.taxTreatment = x.tt as import("@/lib/withdrawal-tax").TaxTreatment;
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
      const item: { id: string; category: string; amount: number; frequency?: import("@/components/IncomeEntry").IncomeFrequency; incomeType?: import("@/components/IncomeEntry").IncomeType } = { id: `i${i + 1}`, category: x.c, amount: x.a };
      if (x.f) item.frequency = x.f as import("@/components/IncomeEntry").IncomeFrequency;
      if (x.it) item.incomeType = x.it as import("@/components/IncomeEntry").IncomeType;
      return item;
    }),
    expenses: compact.e.map((x, i) => ({ id: `e${i + 1}`, category: x.c, amount: x.a })),
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

// Export for testing
export { encode85, decode85, toCompact, fromCompact };
