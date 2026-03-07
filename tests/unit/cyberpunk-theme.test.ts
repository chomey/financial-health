import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const cssPath = path.join(process.cwd(), "src/app/globals.css");
const css = fs.readFileSync(cssPath, "utf-8");

describe("Soft cyberpunk theme tokens", () => {
  it("has dark background in :root", () => {
    expect(css).toMatch(/--background:\s*#0f172a/);
  });

  it("has light foreground in :root", () => {
    expect(css).toMatch(/--foreground:\s*#e2e8f0/);
  });

  it("defines --accent-positive (cyan)", () => {
    expect(css).toMatch(/--accent-positive:\s*#22d3ee/);
  });

  it("defines --accent-negative (rose)", () => {
    expect(css).toMatch(/--accent-negative:\s*#fb7185/);
  });

  it("defines --accent-info (violet)", () => {
    expect(css).toMatch(/--accent-info:\s*#a78bfa/);
  });

  it("defines --accent-highlight (pink)", () => {
    expect(css).toMatch(/--accent-highlight:\s*#f472b6/);
  });

  it("defines --accent-muted (slate)", () => {
    expect(css).toMatch(/--accent-muted:\s*#94a3b8/);
  });

  it("defines --accent-surface (glass effect)", () => {
    expect(css).toMatch(/--accent-surface:/);
  });

  it("defines --accent-border (subtle border)", () => {
    expect(css).toMatch(/--accent-border:/);
  });

  it("defines cyan color scale in @theme inline", () => {
    expect(css).toContain("--color-cyan-400:");
    expect(css).toContain("--color-cyan-500:");
    expect(css).toContain("--color-cyan-600:");
  });

  it("defines violet color scale in @theme inline", () => {
    expect(css).toContain("--color-violet-400:");
    expect(css).toContain("--color-violet-500:");
    expect(css).toContain("--color-violet-600:");
  });

  it("defines slate color scale in @theme inline", () => {
    expect(css).toContain("--color-slate-800:");
    expect(css).toContain("--color-slate-900:");
    expect(css).toContain("--color-slate-950:");
  });

  it("maps legacy green tokens to cyan values for gradual migration", () => {
    // green-400 should map to cyan-400 value
    const cyan400Match = css.match(/--color-cyan-400:\s*(#[0-9a-f]+)/i);
    const green400Match = css.match(/--color-green-400:\s*(#[0-9a-f]+)/i);
    expect(cyan400Match).not.toBeNull();
    expect(green400Match).not.toBeNull();
    expect(green400Match![1]).toBe(cyan400Match![1]);
  });

  it("maps legacy stone tokens to slate values for gradual migration", () => {
    const slate900Match = css.match(/--color-slate-900:\s*(#[0-9a-f]+)/i);
    const stone900Match = css.match(/--color-stone-900:\s*(#[0-9a-f]+)/i);
    expect(slate900Match).not.toBeNull();
    expect(stone900Match).not.toBeNull();
    expect(stone900Match![1]).toBe(slate900Match![1]);
  });

  it("maps legacy blue tokens to violet values for gradual migration", () => {
    const violet400Match = css.match(/--color-violet-400:\s*(#[0-9a-f]+)/i);
    const blue400Match = css.match(/--color-blue-400:\s*(#[0-9a-f]+)/i);
    expect(violet400Match).not.toBeNull();
    expect(blue400Match).not.toBeNull();
    expect(blue400Match![1]).toBe(violet400Match![1]);
  });

  it("uses cyan RGB values in glow-pulse keyframes", () => {
    expect(css).toMatch(/glow-pulse[\s\S]*rgba\(34,\s*211,\s*238/);
  });

  it("uses rose RGB values in warning-pulse keyframes", () => {
    expect(css).toMatch(/warning-pulse[\s\S]*rgba\(251,\s*113,\s*133/);
  });

  it("sets print body to white background and dark text", () => {
    expect(css).toMatch(/@media print[\s\S]*background:\s*white\s*!important/);
    expect(css).toMatch(/@media print[\s\S]*color:\s*#1c1917\s*!important/);
  });
});
