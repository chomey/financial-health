import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const dashboardSrc = fs.readFileSync(
  path.join(process.cwd(), "src/components/SnapshotDashboard.tsx"),
  "utf-8"
);

const arrowsSrc = fs.readFileSync(
  path.join(process.cwd(), "src/components/DataFlowArrows.tsx"),
  "utf-8"
);

const pageSrc = fs.readFileSync(
  path.join(process.cwd(), "src/app/page.tsx"),
  "utf-8"
);

describe("Task 128: Dashboard dark theme — SnapshotDashboard", () => {
  it("metric cards use the hero surface token", () => {
    expect(dashboardSrc).toContain("bg-[var(--surface-3)]");
  });

  it("metric cards use backdrop-blur for glass effect", () => {
    expect(dashboardSrc).toContain("backdrop-blur-sm");
  });

  it("metric cards use the strong surface border", () => {
    expect(dashboardSrc).toContain("border-[var(--surface-border-strong)]");
  });

  it("positive metric value uses slate-100 instead of green-600", () => {
    expect(dashboardSrc).toContain("text-slate-100");
    expect(dashboardSrc).not.toContain("text-green-600");
  });

  it("negative metric value uses rose-300", () => {
    expect(dashboardSrc).toContain("text-rose-300");
  });

  it("neutral metric value uses slate-100 instead of stone-700", () => {
    expect(dashboardSrc).toContain("text-slate-100");
    expect(dashboardSrc).not.toContain("text-stone-700");
  });

  it("card title uses slate-400 instead of stone-500", () => {
    expect(dashboardSrc).toContain("text-slate-400");
    expect(dashboardSrc).not.toContain("text-stone-500");
  });

  it("metric titles use small uppercase labels", () => {
    expect(dashboardSrc).toContain("text-xs font-medium uppercase tracking-wider text-slate-400");
  });

  it("metric icons use consistent fixed chips", () => {
    expect(dashboardSrc).toContain("flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-lg sm:h-9 sm:w-9");
  });

  it("metric values are dominant and use tabular numerals", () => {
    expect(dashboardSrc).toContain("text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl md:text-4xl");
  });

  it("metric breakdowns wrap as muted monospace text on mobile", () => {
    expect(dashboardSrc).toContain("break-words font-mono text-xs text-slate-500");
    expect(dashboardSrc).toContain("title={metric.breakdown}");
  });

  it("metric cards and grid use equal-height rows", () => {
    expect(dashboardSrc).toContain("flex h-full flex-col");
    expect(dashboardSrc).toContain("grid auto-rows-fr grid-cols-1");
  });

  it("income replacement progress bar track uses dark slate-700", () => {
    expect(dashboardSrc).toContain("bg-slate-700");
  });

  it("income replacement progress bar uses emerald gradient", () => {
    expect(dashboardSrc).toContain("via-emerald-500");
    expect(dashboardSrc).not.toContain("via-green-400");
  });

  it("metric cards use consistent border without special glow", () => {
    expect(dashboardSrc).toContain("border-[var(--surface-border-strong)]");
    expect(dashboardSrc).not.toContain("animate-glow-pulse");
    expect(dashboardSrc).not.toContain("animate-warning-pulse");
  });

  it("insight text uses a left accent border instead of full-width colored text", () => {
    expect(dashboardSrc).toContain("border-l-2 pl-2 text-xs leading-relaxed text-slate-400");
    expect(dashboardSrc).toContain("border-cyan-400/50");
    expect(dashboardSrc).toContain("border-amber-400/50");
  });

  it("does not use any stone color classes (migrated to slate)", () => {
    // Verify no stone colors remain in MetricCard styling
    const stoneMatches = dashboardSrc.match(/text-stone-\d+|bg-stone-\d+|border-stone-\d+/g) ?? [];
    expect(stoneMatches).toHaveLength(0);
  });
});

describe("Task 128: Dashboard dark theme — DataFlowArrows", () => {
  it("bracket colors use muted cyan-700 for lowest bracket", () => {
    expect(arrowsSrc).toContain("#0e7490");
  });

  it("bracket colors include violet for mid-high brackets", () => {
    expect(arrowsSrc).toContain("#7c3aed");
  });

  it("bracket colors include rose for highest brackets", () => {
    expect(arrowsSrc).toContain("#fb7185");
  });

  it("bracket bars no longer use light stone backgrounds", () => {
    // Should use dark slate backgrounds now
    expect(arrowsSrc).toContain("rgb(30,41,59)");
    expect(arrowsSrc).not.toContain("#f5f5f4");
    expect(arrowsSrc).not.toContain("#fafaf9");
  });

  it("bracket bar text uses light colors for dark container (text-slate-100)", () => {
    expect(arrowsSrc).toContain("text-slate-100");
  });

  it("bracket bar range text uses slate-300 instead of stone-500", () => {
    expect(arrowsSrc).toContain("text-slate-300");
  });

  it("explainer modal uses dark background (bg-slate-800)", () => {
    expect(arrowsSrc).toContain("bg-slate-800");
  });

  it("explainer modal has dark border (border-slate-700)", () => {
    expect(arrowsSrc).toContain("border border-slate-700");
  });

  it("explainer modal title uses light text (text-slate-200)", () => {
    expect(arrowsSrc).toContain('data-testid="explainer-title"');
    expect(arrowsSrc).toContain("text-slate-200");
  });

  it("source summary card uses the inner surface token", () => {
    expect(arrowsSrc).toContain("bg-[var(--surface-1)]");
  });

  it("source summary positive accent uses cyan-500 instead of green-500", () => {
    expect(arrowsSrc).toContain("border-l-cyan-500");
    expect(arrowsSrc).not.toContain("border-l-green-500");
  });

  it("source summary total value uses cyan-400 instead of green-600", () => {
    // Check in context of source-summary-total
    expect(arrowsSrc).toContain('data-testid={`source-summary-total-${sourceId}`}');
    const totalSection = arrowsSrc.substring(
      arrowsSrc.indexOf("source-summary-total-row"),
      arrowsSrc.indexOf("source-summary-total-row") + 500
    );
    expect(totalSection).toContain("text-cyan-400");
  });

  it("connector line positive color uses cyan (#22d3ee) instead of green (#059669)", () => {
    expect(arrowsSrc).toContain('"#22d3ee"');
    expect(arrowsSrc).not.toContain('"#059669"');
  });

  it("oval annotation positive color uses cyan (#22d3ee)", () => {
    // The oval stroke should use cyan
    const ovalSection = arrowsSrc.substring(
      arrowsSrc.indexOf("animate-draw-oval"),
      arrowsSrc.indexOf("animate-draw-oval") + 200
    );
    // Look back before animate-draw-oval for the stroke
    const ovalContext = arrowsSrc.substring(
      arrowsSrc.lastIndexOf("stroke={isPositive", arrowsSrc.indexOf("animate-draw-oval")),
      arrowsSrc.indexOf("animate-draw-oval") + 10
    );
    expect(ovalContext).toContain("#22d3ee");
  });

  it("operator symbol uses cyan-400 for positive", () => {
    expect(arrowsSrc).toContain("text-cyan-400");
    const operatorLine = arrowsSrc.match(/animate-operator-in.*?text-(\w+-\d+)/s)?.[0] ?? "";
    expect(operatorLine).toContain("cyan-400");
  });

  it("investment returns section uses cyan border and background", () => {
    expect(arrowsSrc).toContain("border-cyan-500/40");
    expect(arrowsSrc).toContain("bg-cyan-500/5");
  });

  it("tax-free withdrawal category uses cyan colors (not green)", () => {
    expect(arrowsSrc).toContain("bg-cyan-900/30 text-cyan-300 border-cyan-700/40");
    expect(arrowsSrc).not.toContain("bg-green-100 text-green-700 border-green-200");
  });

  it("after-tax income in tax explainer uses cyan-400 instead of green-600", () => {
    expect(arrowsSrc).toContain("text-cyan-400");
    expect(arrowsSrc).not.toContain("text-green-600");
  });

  it("does not use white text on light green (old readability issue fixed)", () => {
    // Old code had conditional 'text-white' for high bracket index. Should be gone.
    expect(arrowsSrc).not.toContain('"text-emerald-800"');
    expect(arrowsSrc).not.toContain("text-emerald-800");
  });
});

describe("Task 128: Dashboard dark theme — navigation interactions", () => {
  it("dashboard section links use shared cyan focus ring and quiet underline transitions", () => {
    expect(pageSrc).toContain("focus-ring relative flex min-h-10 items-center gap-1.5");
    expect(pageSrc).toContain("sm:min-h-9");
    expect(pageSrc).toContain("text-cyan-300 after:bg-cyan-300");
    expect(pageSrc).toContain("transition-colors duration-150");
    expect(pageSrc).not.toContain("focus:ring-2 focus:ring-violet-400");
  });
});
