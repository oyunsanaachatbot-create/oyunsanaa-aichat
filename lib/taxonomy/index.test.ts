import { describe, expect, it } from "vitest";
import {
  getStaticTag,
  isTaxonomyPathValid,
  inferTaxonomyFromText,
  normalizeTagKey,
  TAXONOMY,
  PROFESSIONAL_TAXONOMY,
  getProfessionalPlacements,
} from "./index";

describe("content taxonomy", () => {
  it("contains every PDF category, subcategory, type, and TAG placement", () => {
    const subcategories = TAXONOMY.flatMap(
      (category) => category.subcategories
    );
    const types = subcategories.flatMap((subcategory) => subcategory.types);
    const tags = types.flatMap((type) => type.tags);

    expect(TAXONOMY).toHaveLength(10);
    expect(subcategories).toHaveLength(73);
    expect(types).toHaveLength(73);
    expect(tags).toHaveLength(394);
    expect(new Set(tags.map(normalizeTagKey)).size).toBe(394);
    expect(PROFESSIONAL_TAXONOMY).toHaveLength(10);
    expect(
      new Set(
        PROFESSIONAL_TAXONOMY.flatMap((category) =>
          category.subcategories.flatMap((subcategory) =>
            subcategory.tags.map(normalizeTagKey)
          )
        )
      ).size
    ).toBe(394);
    expect(tags.every((tag) => getProfessionalPlacements(tag).length > 0)).toBe(
      true
    );
    expect(types.every((type) => type.tags.length > 0)).toBe(true);
  });

  it("classifies representative text into every main category", () => {
    const cases = [
      ["Өөрийн үнэлэмж", "e1"],
      ["Уур", "e2"],
      ["Итгэлцэл", "e3"],
      ["Хүүхдийн хөгжил", "e4"],
      ["Нойр", "e5"],
      ["Ажил мэргэжил", "e6"],
      ["Төсөв", "e7"],
      ["Уй гашуу", "e8"],
      ["Сүрдүүлэг", "e9"],
      ["Хиймэл оюун ухаан", "e10"],
    ] as const;

    for (const [text, categoryCode] of cases) {
      expect(inferTaxonomyFromText(text)?.categoryCode).toBe(categoryCode);
    }
  });

  it("does not discard short TAGs", () => {
    expect(inferTaxonomyFromText("Уур")).toMatchObject({
      categoryCode: "e2",
      subcategoryCode: "e2.5",
      primaryTagKey: "уур",
    });
  });

  it("replaces old choices without accepting reused numeric category codes", () => {
    expect(getStaticTag("темперамент ба төрөлхийн ялгаа")).toBeNull();
    expect(
      isTaxonomyPathValid({
        categoryCode: "1",
        subcategoryCode: "1.1",
        taxonomyType: "Өөрийгөө танин мэдэх",
      })
    ).toBe(false);
    expect(
      isTaxonomyPathValid({
        categoryCode: "p1",
        subcategoryCode: "p1.1",
        taxonomyType: "Өөрийгөө танин мэдэх",
      })
    ).toBe(true);
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
