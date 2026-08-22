import { describe, expect, it } from "vitest";
import {
  programDefinitionSchema,
  resolveResultTaxonomy,
  scoreProgram,
} from "./definition";

describe("program result taxonomy", () => {
  it("keeps and returns the taxonomy of the matching result band", () => {
    const expectedTaxonomy = {
      categoryCode: "3",
      subcategoryCode: "3.2",
      taxonomyType: "Хөгжүүлэх чадвар",
      primaryTagKey: "ассертив харилцаа",
      additionalTagKeys: [],
    };
    const definition = programDefinitionSchema.parse({
      schemaVersion: 1,
      contentType: "PROGRAM",
      locale: "mn",
      title: "Result test",
      summary: "Result taxonomy test",
      icon: "🧪",
      sections: [
        {
          id: "assessment",
          type: "ASSESSMENT",
          title: "Assessment",
          questions: [
            {
              id: "score",
              type: "SCALE",
              prompt: "Score",
              required: true,
              min: 0,
              max: 10,
            },
          ],
        },
        {
          id: "result",
          type: "RESULT",
          title: "Result",
          resultBands: [
            {
              id: "low",
              minPercent: 0,
              maxPercent: 49,
              title: "Low",
              body: "Low result",
              taxonomy: {
                categoryCode: "2",
                subcategoryCode: "2.1",
                taxonomyType: "Сэтгэл санааны байдал",
                primaryTagKey: "сэтгэл санааны тогтвортой байдал",
                additionalTagKeys: [],
              },
            },
            {
              id: "high",
              minPercent: 50,
              maxPercent: 100,
              title: "High",
              body: "High result",
              taxonomy: expectedTaxonomy,
            },
          ],
        },
      ],
    });

    const result = scoreProgram(definition, { "assessment.score": 8 });
    expect(result.percent).toBe(80);
    expect(result.band?.id).toBe("high");
    expect(result.band?.taxonomy).toEqual(expectedTaxonomy);
  });

  it("infers taxonomy for legacy result bands without taxonomy", () => {
    const fallback = {
      categoryCode: "2",
      subcategoryCode: "2.4",
      taxonomyType: "Сэтгэл хөдлөлийн зохицуулалт",
      primaryTagKey: "сэтгэл хөдлөлийн эрчмийг зохицуулах",
      additionalTagKeys: [],
    };
    expect(
      resolveResultTaxonomy(
        {
          id: "legacy",
          minPercent: 0,
          maxPercent: 100,
          title: "Харьцангуй тогтвортой чадвар",
          body: "Та сэтгэл хөдлөлөө анзаарч, ойлгож, илэрхийлж, зохицуулах суурь чадвартай байна.",
        },
        fallback
      )
    ).toMatchObject({
      categoryCode: "2",
      subcategoryCode: "2.4",
      primaryTagKey: "сэтгэл хөдлөлийн эрчмийг зохицуулах",
    });
  });
});
