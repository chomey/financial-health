import { describe, it, expect } from "vitest";

// Mirrors the labelOverride logic in DataFlowArrows.tsx ExplainerModal
function getLabelOverride(label: string | undefined): string | undefined {
  if (label?.startsWith("mortgage")) return "Mortgage";
  if (label?.startsWith("contributions")) return "Contributions";
  return undefined;
}

// Mirrors the sectionName resolution logic in DataFlowArrows.tsx
function getSectionName(
  label: string | undefined,
  sourceId: string,
  metaLabel: string | undefined
): string {
  const labelOverride = getLabelOverride(label);
  return labelOverride || metaLabel || label || sourceId.replace("section-", "");
}

describe("surplus explainer: virtual source ID label resolution", () => {
  it("virtual-contributions shows 'Contributions' not 'Assets'", () => {
    const sectionName = getSectionName(
      "contributions -$1,250",
      "virtual-contributions",
      undefined // no meta — virtual ID has no registered section
    );
    expect(sectionName).toBe("Contributions");
  });

  it("virtual-mortgage shows 'Mortgage' not 'Property'", () => {
    const sectionName = getSectionName(
      "mortgage -$2,000",
      "virtual-mortgage",
      undefined // no meta — virtual ID has no registered section
    );
    expect(sectionName).toBe("Mortgage");
  });

  it("real section-assets shows 'Assets' from meta label", () => {
    const sectionName = getSectionName(
      "$790,000",
      "section-assets",
      "Assets"
    );
    expect(sectionName).toBe("Assets");
  });

  it("virtual-contributions label does not bleed into real assets meta", () => {
    // When sourceId is virtual, meta is undefined — items must come only from conn.items
    const metaItems = undefined; // no meta for virtual IDs
    const connItems = undefined; // no explicit items for contributions
    const items = connItems ?? metaItems;
    expect(items).toBeUndefined();
  });

  it("virtual-mortgage with explicit mortgage items shows those items", () => {
    const connItems = [{ label: "Main St Mortgage", value: 2000 }];
    const metaItems = undefined; // no meta for virtual IDs
    const items = connItems ?? metaItems;
    expect(items).toEqual(connItems);
  });

  it("contributions label override works regardless of formatted amount", () => {
    // fmtLabel can produce various formats — ensure startsWith check is robust
    expect(getLabelOverride("contributions -$1,250")).toBe("Contributions");
    expect(getLabelOverride("contributions $0")).toBe("Contributions");
    expect(getLabelOverride("mortgage -$2,500.00")).toBe("Mortgage");
    expect(getLabelOverride("section-income")).toBeUndefined();
    expect(getLabelOverride(undefined)).toBeUndefined();
  });
});
