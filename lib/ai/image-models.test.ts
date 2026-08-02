import assert from "node:assert/strict";
import test from "node:test";
import {
  IMAGE_CLASSIFIER_MODEL,
  MAIN_CHAT_MODEL,
  MEAL_IMAGE_MODEL,
  openAIImageDetailOptions,
  openAIReasoningOptions,
  RECEIPT_FALLBACK_MODEL,
  RECEIPT_PRIMARY_MODEL,
  shouldUseReceiptFallback,
} from "./image-models";

test("image routes use the intended model tiers", () => {
  assert.equal(IMAGE_CLASSIFIER_MODEL, "gpt-5.6-luna");
  assert.equal(RECEIPT_PRIMARY_MODEL, "gpt-5-mini");
  assert.equal(RECEIPT_FALLBACK_MODEL, "gpt-5.4-mini");
  assert.equal(MEAL_IMAGE_MODEL, "gpt-5.4-mini");
  assert.equal(MAIN_CHAT_MODEL, "openai/gpt-5.4-mini");
});

test("receipt analysis escalates only low-confidence or empty results", () => {
  assert.equal(shouldUseReceiptFallback(0.77, 3), true);
  assert.equal(shouldUseReceiptFallback(0.95, 0), true);
  assert.equal(shouldUseReceiptFallback(0.78, 1), false);
});

test("OpenAI image and reasoning options remain explicit", () => {
  assert.deepEqual(openAIImageDetailOptions("low"), {
    openai: { imageDetail: "low" },
  });
  assert.deepEqual(openAIImageDetailOptions("high"), {
    openai: { imageDetail: "high" },
  });
  assert.deepEqual(openAIReasoningOptions("none"), {
    openai: { reasoningEffort: "none" },
  });
  assert.deepEqual(openAIReasoningOptions("minimal"), {
    openai: { reasoningEffort: "minimal" },
  });
  assert.deepEqual(openAIReasoningOptions("low"), {
    openai: { reasoningEffort: "low" },
  });
});
