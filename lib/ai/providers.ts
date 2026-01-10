import { createOpenAI } from "@ai-sdk/openai";

// OpenAI client (Gateway байхгүй)
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: "https://api.openai.com/v1",
});

// UI дээр "-thinking" suffix ирж магадгүй
const THINKING_SUFFIX_REGEX = /-thinking$/;

// UI дээр "openai/..." гэж хадгалагддаг бол зөвшөөрөх жагсаалт
const ALLOWED_UI_MODELS = new Set([
  "openai/gpt-4.1",
  "openai/gpt-4.1-mini",
  "openai/gpt-4o-mini",
]);

function normalizeUiModelId(modelId: string) {
  return modelId.replace(THINKING_SUFFIX_REGEX, "");
}

function toOpenAIModelName(uiModelId: string) {
  // "openai/gpt-4o-mini" -> "gpt-4o-mini"
  return uiModelId.startsWith("openai/") ? uiModelId.slice("openai/".length) : uiModelId;
}

export function getLanguageModel(modelId: string) {
  const normalized = normalizeUiModelId(modelId);

  if (!normalized.startsWith("openai/")) {
    throw new Error(`Only OpenAI models are allowed. Got "${modelId}"`);
  }
  if (!ALLOWED_UI_MODELS.has(normalized)) {
    throw new Error(`Model not allowed: "${modelId}"`);
  }

  return openai(toOpenAIModelName(normalized));
}

export function getTitleModel() {
  return openai("gpt-4o-mini");
}

export function getArtifactModel() {
  return openai("gpt-4o-mini");
}
