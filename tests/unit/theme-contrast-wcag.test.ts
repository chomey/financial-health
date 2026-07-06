import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { CHART_AXIS_TICK, CHART_SEMANTIC, CHART_SERIES, CHART_TOOLTIP_STYLE } from "@/lib/chart-theme";

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
const BG_SURFACE_1 = blendRgba(255, 255, 255, 0.03, BG_DARK);
const BG_SURFACE_2 = blendRgba(255, 255, 255, 0.05, BG_DARK);
const BG_SURFACE_3 = blendRgba(255, 255, 255, 0.08, BG_DARK);
const FOCUS_RING_CYAN = blendRgba(34, 211, 238, 0.60, BG_DARK);

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
  { name: "cyan-300 (#67e8f9) on background", fg: "#67e8f9", bg: BG_DARK, minRatio: WCAG_AA_NORMAL },
  { name: "rose-300 (#fda4af) on background", fg: "#fda4af", bg: BG_DARK, minRatio: WCAG_AA_NORMAL },
  { name: "rose-400 (#fb7185) on background", fg: "#fb7185", bg: BG_DARK, minRatio: WCAG_AA_NORMAL },
  { name: "violet-400 (#a78bfa) on background", fg: "#a78bfa", bg: BG_DARK, minRatio: WCAG_AA_NORMAL },
  { name: "pink-400 (#f472b6) on background", fg: "#f472b6", bg: BG_DARK, minRatio: WCAG_AA_NORMAL },
  { name: "amber-400 (#fbbf24) on background", fg: "#fbbf24", bg: BG_DARK, minRatio: WCAG_AA_NORMAL },

  // Text on tokenized card surfaces
  { name: "foreground (#e2e8f0) on surface-1", fg: "#e2e8f0", bg: BG_SURFACE_1, minRatio: WCAG_AA_NORMAL },
  { name: "slate-300 (#cbd5e1) on surface-1", fg: "#cbd5e1", bg: BG_SURFACE_1, minRatio: WCAG_AA_NORMAL },
  { name: "foreground (#e2e8f0) on surface-2", fg: "#e2e8f0", bg: BG_SURFACE_2, minRatio: WCAG_AA_NORMAL },
  { name: "slate-300 (#cbd5e1) on surface-2", fg: "#cbd5e1", bg: BG_SURFACE_2, minRatio: WCAG_AA_NORMAL },
  { name: "cyan-400 (#22d3ee) on surface-2", fg: "#22d3ee", bg: BG_SURFACE_2, minRatio: WCAG_AA_NORMAL },
  { name: "cyan-300 (#67e8f9) on surface-3", fg: "#67e8f9", bg: BG_SURFACE_3, minRatio: WCAG_AA_NORMAL },
  { name: "rose-300 (#fda4af) on surface-3", fg: "#fda4af", bg: BG_SURFACE_3, minRatio: WCAG_AA_NORMAL },
  { name: "rose-400 (#fb7185) on surface-2", fg: "#fb7185", bg: BG_SURFACE_2, minRatio: WCAG_AA_NORMAL },
  { name: "violet-400 (#a78bfa) on surface-2", fg: "#a78bfa", bg: BG_SURFACE_2, minRatio: WCAG_AA_NORMAL },
  { name: "foreground (#e2e8f0) on surface-3", fg: "#e2e8f0", bg: BG_SURFACE_3, minRatio: WCAG_AA_NORMAL },
  { name: "slate-300 (#cbd5e1) on surface-3", fg: "#cbd5e1", bg: BG_SURFACE_3, minRatio: WCAG_AA_NORMAL },

  // Muted/secondary text, including text-xs chart legends
  { name: "slate-400 (#94a3b8) on background", fg: "#94a3b8", bg: BG_DARK, minRatio: WCAG_AA_NORMAL },
  { name: "slate-400 (#94a3b8) on surface-2", fg: "#94a3b8", bg: BG_SURFACE_2, minRatio: WCAG_AA_NORMAL },
  { name: "slate-400 (#94a3b8) on surface-3", fg: "#94a3b8", bg: BG_SURFACE_3, minRatio: WCAG_AA_NORMAL },
  { name: "amber-300 (#fcd34d) on amber-tinted surface", fg: "#fcd34d", bg: blendRgba(120, 53, 15, 0.20, BG_DARK), minRatio: WCAG_AA_NORMAL },
  { name: "cyan-300 (#67e8f9) on cyan-tinted surface", fg: "#67e8f9", bg: blendRgba(22, 78, 99, 0.30, BG_DARK), minRatio: WCAG_AA_NORMAL },
  { name: "violet-300 (#c4b5fd) on violet-tinted surface", fg: "#c4b5fd", bg: blendRgba(76, 29, 149, 0.20, BG_DARK), minRatio: WCAG_AA_NORMAL },

  // Focus indicators — non-text contrast threshold
  { name: "cyan-400/60 focus ring on slate-900", fg: FOCUS_RING_CYAN, bg: BG_DARK, minRatio: WCAG_AA_LARGE },
];

describe("Task 134: WCAG AA contrast ratio verification for cyberpunk theme", () => {
  it("contrast ratio utility calculates correctly for known values", () => {
    // Black on white should be 21:1
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 0);
    // Same color should be 1:1
    expect(contrastRatio("#808080", "#808080")).toBeCloseTo(1, 1);
  });

  it("surface blends produce progressively lighter surfaces than background", () => {
    const bgLum = relativeLuminance(BG_DARK);
    const surface1Lum = relativeLuminance(BG_SURFACE_1);
    const surface2Lum = relativeLuminance(BG_SURFACE_2);
    const surface3Lum = relativeLuminance(BG_SURFACE_3);
    expect(surface1Lum).toBeGreaterThan(bgLum);
    expect(surface2Lum).toBeGreaterThan(surface1Lum);
    expect(surface3Lum).toBeGreaterThan(surface2Lum);
  });

  for (const pair of colorPairs) {
    it(`${pair.name} meets ${pair.minRatio}:1 ratio`, () => {
      const ratio = contrastRatio(pair.fg, pair.bg);
      expect(ratio).toBeGreaterThanOrEqual(pair.minRatio);
    });
  }
});

describe("Task 134: Slate muted copy keeps an accessible floor", () => {
  it("does not approve slate-500 as meaningful copy on dark surfaces", () => {
    expect(contrastRatio("#64748b", BG_DARK)).toBeLessThan(WCAG_AA_NORMAL);
    expect(contrastRatio("#64748b", BG_SURFACE_2)).toBeLessThan(WCAG_AA_NORMAL);
  });
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
    "--surface-1",
    "--surface-2",
    "--surface-3",
    "--surface-border",
    "--surface-border-strong",
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

describe("Chart theme tokens", () => {
  it("uses the approved categorical palette order", () => {
    expect(CHART_SERIES).toEqual(["#22d3ee", "#a78bfa", "#f472b6", "#fbbf24", "#fb7185", "#94a3b8"]);
  });

  it("keeps chart text and tooltip colors accessible on dark surfaces", () => {
    expect(contrastRatio(CHART_AXIS_TICK.fill, BG_SURFACE_2)).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
    expect(contrastRatio(CHART_TOOLTIP_STYLE.color, CHART_TOOLTIP_STYLE.backgroundColor)).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
    expect(contrastRatio(CHART_SEMANTIC.taxes, BG_SURFACE_2)).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
  });
});
