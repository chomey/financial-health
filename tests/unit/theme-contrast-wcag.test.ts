import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * WCAG AA contrast ratio tests for the cyberpunk theme.
 * Verifies that all text/background color pairs meet the 4.5:1 minimum
 * contrast ratio for normal text (WCAG 2.1 Level AA).
 */

// --- Contrast ratio calculation utilities ---

/** Parse a hex color string to [r, g, b] (0-255) */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

/** Convert sRGB channel (0-255) to linear luminance component */
function linearize(channel: number): number {
  const s = channel / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** Calculate relative luminance per WCAG 2.1 */
function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/** Calculate contrast ratio between two hex colors */
function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Blend an rgba overlay onto an opaque background.
 * Returns the resulting hex color.
 */
function blendRgba(
  overlayR: number,
  overlayG: number,
  overlayB: number,
  overlayA: number,
  bgHex: string
): string {
  const [bgR, bgG, bgB] = hexToRgb(bgHex);
  const r = Math.round(overlayR * overlayA + bgR * (1 - overlayA));
  const g = Math.round(overlayG * overlayA + bgG * (1 - overlayA));
  const b = Math.round(overlayB * overlayA + bgB * (1 - overlayA));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// --- Theme color constants ---
const BG_DARK = "#0f172a"; // slate-900 (--background)
// Glass card surface: rgba(255,255,255,0.05) on #0f172a
const BG_GLASS = blendRgba(255, 255, 255, 0.05, BG_DARK);

const WCAG_AA_NORMAL = 4.5; // Minimum contrast ratio for normal text
const WCAG_AA_LARGE = 3.0; // Minimum for large text (18pt+ or 14pt bold)

// --- Color pairs used in the theme ---
const colorPairs: {
  name: string;
  fg: string;
  bg: string;
  minRatio: number;
}[] = [
  // Primary text on dark background
  { name: "foreground (#e2e8f0) on background (#0f172a)", fg: "#e2e8f0", bg: BG_DARK, minRatio: WCAG_AA_NORMAL },
  { name: "slate-200 (#e2e8f0) on background", fg: "#e2e8f0", bg: BG_DARK, minRatio: WCAG_AA_NORMAL },
  { name: "slate-300 (#cbd5e1) on background", fg: "#cbd5e1", bg: BG_DARK, minRatio: WCAG_AA_NORMAL },

  // Accent colors on dark background
  { name: "cyan-400 (#22d3ee) on background", fg: "#22d3ee", bg: BG_DARK, minRatio: WCAG_AA_NORMAL },
  { name: "rose-400 (#fb7185) on background", fg: "#fb7185", bg: BG_DARK, minRatio: WCAG_AA_NORMAL },
  { name: "violet-400 (#a78bfa) on background", fg: "#a78bfa", bg: BG_DARK, minRatio: WCAG_AA_NORMAL },
  { name: "pink-400 (#f472b6) on background", fg: "#f472b6", bg: BG_DARK, minRatio: WCAG_AA_NORMAL },
  { name: "amber-400 (#fbbf24) on background", fg: "#fbbf24", bg: BG_DARK, minRatio: WCAG_AA_NORMAL },

  // Text on glass card surface (bg-white/5 over slate-900)
  { name: "foreground (#e2e8f0) on glass card", fg: "#e2e8f0", bg: BG_GLASS, minRatio: WCAG_AA_NORMAL },
  { name: "slate-300 (#cbd5e1) on glass card", fg: "#cbd5e1", bg: BG_GLASS, minRatio: WCAG_AA_NORMAL },
  { name: "cyan-400 (#22d3ee) on glass card", fg: "#22d3ee", bg: BG_GLASS, minRatio: WCAG_AA_NORMAL },
  { name: "rose-400 (#fb7185) on glass card", fg: "#fb7185", bg: BG_GLASS, minRatio: WCAG_AA_NORMAL },
  { name: "violet-400 (#a78bfa) on glass card", fg: "#a78bfa", bg: BG_GLASS, minRatio: WCAG_AA_NORMAL },

  // Muted/secondary text — large text threshold (labels, section headers)
  { name: "slate-400 (#94a3b8) on background [large text]", fg: "#94a3b8", bg: BG_DARK, minRatio: WCAG_AA_LARGE },
  { name: "slate-400 (#94a3b8) on glass card [large text]", fg: "#94a3b8", bg: BG_GLASS, minRatio: WCAG_AA_LARGE },
];

describe("Task 134: WCAG AA contrast ratio verification for cyberpunk theme", () => {
  it("contrast ratio utility calculates correctly for known values", () => {
    // Black on white should be 21:1
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 0);
    // Same color should be 1:1
    expect(contrastRatio("#808080", "#808080")).toBeCloseTo(1, 1);
  });

  it("glass card blend produces a slightly lighter surface than background", () => {
    const bgLum = relativeLuminance(BG_DARK);
    const glassLum = relativeLuminance(BG_GLASS);
    expect(glassLum).toBeGreaterThan(bgLum);
  });

  for (const pair of colorPairs) {
    it(`${pair.name} meets ${pair.minRatio}:1 ratio`, () => {
      const ratio = contrastRatio(pair.fg, pair.bg);
      expect(ratio).toBeGreaterThanOrEqual(pair.minRatio);
    });
  }
});

// --- Source file static checks ---
const globalsCss = fs.readFileSync(
  path.join(process.cwd(), "src/app/globals.css"),
  "utf-8"
);

describe("Task 134: Theme CSS variable definitions are present", () => {
  const requiredVars = [
    "--background",
    "--foreground",
    "--accent-positive",
    "--accent-negative",
    "--accent-info",
    "--accent-highlight",
    "--accent-muted",
    "--accent-surface",
    "--accent-border",
  ];

  for (const v of requiredVars) {
    it(`defines ${v} in globals.css`, () => {
      expect(globalsCss).toContain(v);
    });
  }

  it("background is dark slate-900 (#0f172a)", () => {
    expect(globalsCss).toMatch(/--background:\s*#0f172a/);
  });

  it("foreground is light slate-200 (#e2e8f0)", () => {
    expect(globalsCss).toMatch(/--foreground:\s*#e2e8f0/);
  });
});
