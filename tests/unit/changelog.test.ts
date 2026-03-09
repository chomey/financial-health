import { describe, it, expect } from "vitest";
import { CHANGELOG, getChangelogByMilestone } from "@/lib/changelog";

describe("changelog data", () => {
  it("contains at least 169 entries", () => {
    expect(CHANGELOG.length).toBeGreaterThanOrEqual(169);
  });

  it("has unique version numbers", () => {
    const versions = CHANGELOG.map((e) => e.version);
    expect(new Set(versions).size).toBe(versions.length);
  });

  it("covers versions starting from 1", () => {
    const versions = CHANGELOG.map((e) => e.version).sort((a, b) => a - b);
    expect(versions[0]).toBe(1);
    // Ensure no gaps in versions 1 through the milestone-covered range
    const maxMilestonedVersion = 169;
    for (let i = 1; i <= maxMilestonedVersion; i++) {
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
  it("returns at least 16 milestone groups", () => {
    const milestones = getChangelogByMilestone();
    expect(milestones.length).toBeGreaterThanOrEqual(16);
  });

  it("contains entries across all groups", () => {
    const milestones = getChangelogByMilestone();
    const totalEntries = milestones.reduce((sum, m) => sum + m.entries.length, 0);
    expect(totalEntries).toBeGreaterThanOrEqual(169);
  });

  it("groups entries correctly by milestone range", () => {
    const milestones = getChangelogByMilestone();
    // Find milestones by name for stability
    const australia = milestones.find((m) => m.milestone === "Australia Country Support")!;
    expect(australia).toBeDefined();
    expect(australia.entries.length).toBeGreaterThanOrEqual(12);

    const wizard = milestones.find((m) => m.milestone === "Wizard & Dashboard Overhaul")!;
    expect(wizard).toBeDefined();
    expect(wizard.entries.length).toBe(6);
    expect(wizard.entries.every((e) => e.version >= 152 && e.version <= 157)).toBe(true);

    const foundation = milestones.find((m) => m.milestone === "Foundation & Initial Build")!;
    expect(foundation).toBeDefined();
    expect(foundation.entries.length).toBe(14);
    expect(foundation.entries.every((e) => e.version >= 1 && e.version <= 14)).toBe(true);
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
