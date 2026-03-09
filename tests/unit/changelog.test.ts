import { describe, it, expect } from "vitest";
import { CHANGELOG, getChangelogByMilestone } from "@/lib/changelog";

describe("changelog data", () => {
  it("contains entries for completed tasks (166 entries, versions 1-166)", () => {
    expect(CHANGELOG.length).toBe(166);
  });

  it("has unique version numbers", () => {
    const versions = CHANGELOG.map((e) => e.version);
    expect(new Set(versions).size).toBe(versions.length);
  });

  it("covers versions 1 through 166", () => {
    const versions = CHANGELOG.map((e) => e.version).sort((a, b) => a - b);
    expect(versions[0]).toBe(1);
    expect(versions[versions.length - 1]).toBe(166);
    for (let i = 1; i <= 166; i++) {
      expect(versions).toContain(i);
    }
  });

  it("is sorted in reverse chronological order (newest first)", () => {
    for (let i = 0; i < CHANGELOG.length - 1; i++) {
      expect(CHANGELOG[i].version).toBeGreaterThan(CHANGELOG[i + 1].version);
    }
  });

  it("every entry has required fields", () => {
    for (const entry of CHANGELOG) {
      expect(entry.version).toBeTypeOf("number");
      expect(entry.title).toBeTypeOf("string");
      expect(entry.title.length).toBeGreaterThan(0);
      expect(entry.description).toBeTypeOf("string");
      expect(entry.description.length).toBeGreaterThan(0);
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("has valid dates", () => {
    for (const entry of CHANGELOG) {
      const date = new Date(entry.date);
      expect(date.getTime()).not.toBeNaN();
    }
  });
});

describe("getChangelogByMilestone", () => {
  it("returns 16 milestone groups", () => {
    const milestones = getChangelogByMilestone();
    expect(milestones.length).toBe(16);
  });

  it("contains all entries across all groups", () => {
    const milestones = getChangelogByMilestone();
    const totalEntries = milestones.reduce((sum, m) => sum + m.entries.length, 0);
    expect(totalEntries).toBe(166);
  });

  it("groups entries correctly by milestone range", () => {
    const milestones = getChangelogByMilestone();
    // Australia Country Support: 158+
    expect(milestones[0].milestone).toBe("Australia Country Support");
    expect(milestones[0].entries.length).toBe(9); // 158-166
    // Wizard & Dashboard Overhaul: 152-157
    expect(milestones[1].milestone).toBe("Wizard & Dashboard Overhaul");
    expect(milestones[1].entries.length).toBe(6); // 152-157
    expect(milestones[1].entries.every((e) => e.version >= 152 && e.version <= 157)).toBe(true);
    // Financial Roadmap: 147-151
    expect(milestones[2].milestone).toBe("Financial Roadmap");
    expect(milestones[2].entries.length).toBe(5); // 147, 148, 149, 150, 151
    expect(milestones[2].entries.every((e) => e.version >= 147 && e.version <= 151)).toBe(true);
    // Tax Credits & Deductions: 140-146
    expect(milestones[3].milestone).toBe("Tax Credits & Deductions");
    expect(milestones[3].entries.length).toBe(7); // 140, 141, 142, 143, 144, 145, 146
    expect(milestones[3].entries.every((e) => e.version >= 140 && e.version <= 146)).toBe(true);
    // UI Polish: 88-139
    expect(milestones[4].milestone).toBe("UI Polish");
    expect(milestones[4].entries.length).toBe(52); // 88-139
    expect(milestones[4].entries.every((e) => e.version >= 88 && e.version <= 139)).toBe(true);
    // Metric-Specific Explainers: 83-87
    expect(milestones[5].milestone).toBe("Metric-Specific Explainers");
    expect(milestones[5].entries.length).toBe(5); // 83, 84, 85, 86, 87
    expect(milestones[5].entries.every((e) => e.version >= 83 && e.version <= 87)).toBe(true);
    // Whiteboard Explainer Mode: 79-82
    expect(milestones[6].milestone).toBe("Whiteboard Explainer Mode");
    expect(milestones[6].entries.length).toBe(4);
    expect(milestones[6].entries.every((e) => e.version >= 79 && e.version <= 82)).toBe(true);
    // Spotlight Dimming System: 77-78
    expect(milestones[7].milestone).toBe("Spotlight Dimming System");
    expect(milestones[7].entries.length).toBe(2);
    expect(milestones[7].entries.every((e) => e.version >= 77 && e.version <= 78)).toBe(true);
    // Data Flow Visualization: 69-76
    expect(milestones[8].milestone).toBe("Data Flow Visualization");
    expect(milestones[8].entries.length).toBe(8);
    expect(milestones[8].entries.every((e) => e.version >= 69 && e.version <= 76)).toBe(true);
    // Withdrawal Tax Modeling: 62-68
    expect(milestones[9].milestone).toBe("Withdrawal Tax Modeling");
    expect(milestones[9].entries.length).toBe(7);
    expect(milestones[9].entries.every((e) => e.version >= 62 && e.version <= 68)).toBe(true);
    // Multi-Currency: 56-61
    expect(milestones[10].milestone).toBe("Multi-Currency Support");
    expect(milestones[10].entries.length).toBe(6);
    expect(milestones[10].entries.every((e) => e.version >= 56 && e.version <= 61)).toBe(true);
    // Foundation: 1-14
    expect(milestones[15].milestone).toBe("Foundation & Initial Build");
    expect(milestones[15].entries.length).toBe(14);
    expect(milestones[15].entries.every((e) => e.version >= 1 && e.version <= 14)).toBe(true);
  });

  it("each milestone has a non-empty name", () => {
    const milestones = getChangelogByMilestone();
    for (const m of milestones) {
      expect(m.milestone.length).toBeGreaterThan(0);
    }
  });

  it("no entry appears in multiple milestones", () => {
    const milestones = getChangelogByMilestone();
    const allVersions = milestones.flatMap((m) => m.entries.map((e) => e.version));
    expect(new Set(allVersions).size).toBe(allVersions.length);
  });
});
