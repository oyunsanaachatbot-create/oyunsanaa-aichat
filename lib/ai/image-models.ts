export const IMAGE_CLASSIFIER_MODEL = "gpt-5.6-luna";
export const RECEIPT_PRIMARY_MODEL = "gpt-5-mini";
export const RECEIPT_FALLBACK_MODEL = "gpt-5.4-mini";
export const MEAL_IMAGE_MODEL = "gpt-5.4-mini";
export const MAIN_CHAT_MODEL = "openai/gpt-5.4-mini";
export const RECEIPT_CONFIDENCE_THRESHOLD = 0.78;

export function shouldUseReceiptFallback(
  confidence: number,
  itemCount: number
): boolean {
  return confidence < RECEIPT_CONFIDENCE_THRESHOLD || itemCount === 0;
}

export function openAIReasoningOptions(
  reasoningEffort: "none" | "minimal" | "low"
) {
  return { openai: { reasoningEffort } };
}

export function openAIImageDetailOptions(imageDetail: "low" | "high") {
  return { openai: { imageDetail } };
}
