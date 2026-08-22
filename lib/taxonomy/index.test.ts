import { describe, expect, it } from "vitest";
import { inferTaxonomyFromText, normalizeTagKey, TAXONOMY } from "./index";

describe("content taxonomy", () => {
  it("contains every PDF category, subcategory, type, and TAG placement", () => {
    const subcategories = TAXONOMY.flatMap(
      (category) => category.subcategories
    );
    const types = subcategories.flatMap((subcategory) => subcategory.types);
    const tags = types.flatMap((type) => type.tags);

    expect(TAXONOMY).toHaveLength(8);
    expect(subcategories).toHaveLength(85);
    expect(types).toHaveLength(343);
    expect(tags).toHaveLength(1562);
    expect(new Set(tags.map(normalizeTagKey)).size).toBe(1469);
    expect(types.every((type) => type.tags.length > 0)).toBe(true);
  });

  it("classifies representative text into every main category", () => {
    const cases = [
      ["зан төлөв ба хувь хүний онцлог", "1"],
      ["өдөр тутмын стресс их байна", "2"],
      ["ассертив харилцаа хөгжүүлэх", "3"],
      ["эрүүл мэндийн мэдээлэлтэй шийдвэр гаргах", "4"],
      ["ажлын ачааллаа зохицуулах", "5"],
      ["орлого зарлагаа бүртгэх", "6"],
      ["мэргэжлийн үйлчилгээтэй холбогдох", "7"],
      ["гар утасны хэрэглээ", "8"],
    ] as const;

    for (const [text, categoryCode] of cases) {
      expect(inferTaxonomyFromText(text)?.categoryCode).toBe(categoryCode);
    }
  });

  it("does not discard short TAGs", () => {
    expect(inferTaxonomyFromText("Уур")).toMatchObject({
      categoryCode: "2",
      subcategoryCode: "2.7",
      primaryTagKey: "уур",
    });
  });

  it("returns a valid placement for every unique TAG label", () => {
    const placements = new Map<
      string,
      Array<{
        categoryCode: string;
        subcategoryCode: string;
        taxonomyType: string;
      }>
    >();
    for (const category of TAXONOMY) {
      for (const subcategory of category.subcategories) {
        for (const type of subcategory.types) {
          for (const label of type.tags) {
            const key = normalizeTagKey(label);
            const existing = placements.get(key) ?? [];
            existing.push({
              categoryCode: category.code,
              subcategoryCode: subcategory.code,
              taxonomyType: type.name,
            });
            placements.set(key, existing);
          }
        }
      }
    }

    for (const [label, validPlacements] of placements) {
      const result = inferTaxonomyFromText(label);
      expect(result, label).not.toBeNull();
      expect(
        validPlacements.some(
          (placement) =>
            result?.categoryCode === placement.categoryCode &&
            result.subcategoryCode === placement.subcategoryCode &&
            result.taxonomyType === placement.taxonomyType
        ),
        label
      ).toBe(true);
    }
  });
});
