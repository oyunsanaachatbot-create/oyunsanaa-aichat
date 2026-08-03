import { describe, expect, it } from "vitest";
import { requestedMemorySections } from "./user-memory-sections";

describe("requestedMemorySections", () => {
  it("selects only relevant stored-data sections", () => {
    expect(
      requestedMemorySections("Миний орлого зарлага, тестийн үр дүнг харьцуул")
    ).toEqual(["tests", "finance"]);
  });

  it("does not load private app data for ordinary conversation", () => {
    expect(
      requestedMemorySections("Сайн уу, өнөөдөр сайхан өдөр байна")
    ).toEqual([]);
  });
});
