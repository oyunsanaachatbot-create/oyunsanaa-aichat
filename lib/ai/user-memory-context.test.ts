import { describe, expect, it } from "vitest";
import {
  boundUserMemoryContext,
  USER_MEMORY_CONTEXT_MAX_CHARS,
  USER_MEMORY_ESTIMATED_MAX_INPUT_TOKENS,
} from "./user-memory-budget";
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

describe("user memory token budget", () => {
  it("caps even a very large set of private data blocks", () => {
    const context = boundUserMemoryContext(["ө".repeat(10_000)]);
    expect(context.length).toBeLessThanOrEqual(USER_MEMORY_CONTEXT_MAX_CHARS);
    expect(USER_MEMORY_ESTIMATED_MAX_INPUT_TOKENS).toBe(1200);
    expect(context).toContain("Заавар:");
  });
});
