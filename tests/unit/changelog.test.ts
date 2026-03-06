import { describe, it, expect } from "vitest";
import { CHANGELOG, getChangelogByMilestone } from "@/lib/changelog";

describe("changelog data", () => {
  it("contains entries for all 64 completed tasks", () => {
    expect(CHANGELOG.length).toBe(64);
  });

  it("has unique version numbers", () => {
    const versions = CHANGELOG.map((e) => e.version);
    expect(new Set(versions).size).toBe(versions.length);
  });

  it("covers versions 1 through 64", () => {
    const versions = CHANGELOG.map((e) => e.version).sort((a, b) => a - b);
    expect(versions[0]).toBe(1);
    expect(versions[versions.length - 1]).toBe(64);
    for (let i = 1; i <= 64; i++) {
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
  it("returns 6 milestone groups", () => {
    const milestones = getChangelogByMilestone();
    expect(milestones.length).toBe(7);
  });

  it("contains all 64 entries across all groups", () => {
    const milestones = getChangelogByMilestone();
    const totalEntries = milestones.reduce((sum, m) => sum + m.entries.length, 0);
    expect(totalEntries).toBe(64);
  });

  it("groups entries correctly by milestone range", () => {
    const milestones = getChangelogByMilestone();
    // Withdrawal Tax Modeling: 62-68
    expect(milestones[0].milestone).toBe("Withdrawal Tax Modeling");
    expect(milestones[0].entries.length).toBe(3);
    expect(milestones[0].entries.every((e) => e.version >= 62 && e.version <= 68)).toBe(true);
    // Multi-Currency: 56-61
    expect(milestones[1].milestone).toBe("Multi-Currency Support");
    expect(milestones[1].entries.length).toBe(6);
    expect(milestones[1].entries.every((e) => e.version >= 56 && e.version <= 61)).toBe(true);
    // Foundation: 1-14
    expect(milestones[6].milestone).toBe("Foundation & Initial Build");
    expect(milestones[6].entries.length).toBe(14);
    expect(milestones[6].entries.every((e) => e.version >= 1 && e.version <= 14)).toBe(true);
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
