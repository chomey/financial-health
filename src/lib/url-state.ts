import type { FinancialState } from "@/lib/financial-state";

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
}
interface CompactDebt {
  c: string;
  a: number;
}
interface CompactIncome {
  c: string;
  a: number;
}
interface CompactExpense {
  c: string;
  a: number;
}
interface CompactGoal {
  n: string; // name
  t: number; // target
  s: number; // saved
}
interface CompactProperty {
  n: string; // name
  v: number; // value
  m: number; // mortgage
}
interface CompactState {
  a: CompactAsset[];
  d: CompactDebt[];
  i: CompactIncome[];
  e: CompactExpense[];
  g: CompactGoal[];
  p?: CompactProperty[]; // properties (optional for backward compat)
  r?: string; // region: "CA" | "US" | "both"
}

function toCompact(state: FinancialState): CompactState {
  const compact: CompactState = {
    a: state.assets.map((x) => ({ c: x.category, a: x.amount })),
    d: state.debts.map((x) => ({ c: x.category, a: x.amount })),
    i: state.income.map((x) => ({ c: x.category, a: x.amount })),
    e: state.expenses.map((x) => ({ c: x.category, a: x.amount })),
    g: state.goals.map((x) => ({ n: x.name, t: x.targetAmount, s: x.currentAmount })),
  };
  const properties = state.properties ?? [];
  if (properties.length > 0) {
    compact.p = properties.map((x) => ({ n: x.name, v: x.value, m: x.mortgage }));
  }
  if (state.region && state.region !== "both") {
    compact.r = state.region;
  }
  return compact;
}

function fromCompact(compact: CompactState): FinancialState {
  return {
    region: (compact.r as FinancialState["region"]) || "both",
    assets: compact.a.map((x, i) => ({ id: `a${i + 1}`, category: x.c, amount: x.a })),
    debts: compact.d.map((x, i) => ({ id: `d${i + 1}`, category: x.c, amount: x.a })),
    income: compact.i.map((x, i) => ({ id: `i${i + 1}`, category: x.c, amount: x.a })),
    expenses: compact.e.map((x, i) => ({ id: `e${i + 1}`, category: x.c, amount: x.a })),
    goals: compact.g.map((x, i) => ({
      id: `g${i + 1}`,
      name: x.n,
      targetAmount: x.t,
      currentAmount: x.s,
    })),
    properties: (compact.p ?? []).map((x, i) => ({
      id: `p${i + 1}`,
      name: x.n,
      value: x.v,
      mortgage: x.m,
    })),
  };
}

export function encodeState(state: FinancialState): string {
  const compact = toCompact(state);
  const json = JSON.stringify(compact);
  const encoder = new TextEncoder();
  const bytes = encoder.encode(json);
  return encode85(bytes);
}

export function decodeState(encoded: string): FinancialState | null {
  try {
    const bytes = decode85(encoded);
    const decoder = new TextDecoder();
    const json = decoder.decode(bytes);
    const compact = JSON.parse(json) as CompactState;

    // Validate structure
    if (
      !compact ||
      !Array.isArray(compact.a) ||
      !Array.isArray(compact.d) ||
      !Array.isArray(compact.i) ||
      !Array.isArray(compact.e) ||
      !Array.isArray(compact.g)
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
