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

describe("Task 128: Dashboard dark theme — SnapshotDashboard", () => {
  it("metric cards use glass effect background (bg-white/5)", () => {
    expect(dashboardSrc).toContain("bg-white/5");
  });

  it("metric cards use backdrop-blur for glass effect", () => {
    expect(dashboardSrc).toContain("backdrop-blur-sm");
  });

  it("metric cards use semi-transparent dark border (border-white/10)", () => {
    expect(dashboardSrc).toContain("border-white/10");
  });

  it("positive metric value uses cyan-400 instead of green-600", () => {
    expect(dashboardSrc).toContain("text-cyan-400");
    expect(dashboardSrc).not.toContain("text-green-600");
  });

  it("negative metric value uses rose-400 instead of rose-600", () => {
    expect(dashboardSrc).toContain("text-rose-400");
  });

  it("neutral metric value uses slate-200 instead of stone-700", () => {
    expect(dashboardSrc).toContain("text-slate-200");
    expect(dashboardSrc).not.toContain("text-stone-700");
  });

  it("card title uses slate-400 instead of stone-500", () => {
    expect(dashboardSrc).toContain("text-slate-400");
    expect(dashboardSrc).not.toContain("text-stone-500");
  });

  it("income replacement progress bar track uses dark slate-700", () => {
    expect(dashboardSrc).toContain("bg-slate-700");
  });

  it("income replacement progress bar uses cyan gradient", () => {
    expect(dashboardSrc).toContain("via-cyan-500");
    expect(dashboardSrc).not.toContain("via-green-400");
  });

  it("runway celebration uses cyan glow border", () => {
    expect(dashboardSrc).toContain("border-cyan-500/40");
    expect(dashboardSrc).not.toContain("border-green-300");
  });

  it("underwater warning uses rose glow border", () => {
    expect(dashboardSrc).toContain("border-rose-500/40");
    expect(dashboardSrc).not.toContain("border-rose-300");
  });

  it("insight text uses cyan-400 instead of green-600", () => {
    // Insights below the metric value
    const insightLine = dashboardSrc.match(/text-xs font-medium text-(\w+-\d+)/g) ?? [];
    expect(insightLine.some((cls) => cls.includes("cyan-400"))).toBe(true);
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

  it("source summary card uses dark glass background (bg-slate-700/50)", () => {
    expect(arrowsSrc).toContain("bg-slate-700/50");
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
