import { createOpenAI } from "@ai-sdk/openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY");
}

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.openai.com/v1",
});

const THINKING_SUFFIX_REGEX = /-thinking$/;

const ALLOWED = new Set([
  "openai/gpt-4.1",
  "openai/gpt-4.1-mini",
  "openai/gpt-4o-mini",
]);

function normalize(id: string) {
  return id.replace(THINKING_SUFFIX_REGEX, "");
}

export function getLanguageModel(modelId: string) {
  const id = normalize(modelId);

  if (!id.startsWith("openai/")) {
    throw new Error(`Only OpenAI models are supported. Got "${modelId}"`);
  }

  if (!ALLOWED.has(id)) {
    throw new Error(`Model not allowed: "${modelId}"`);
  }

  return openai(id);
}

export function getTitleModel() {
  return openai("openai/gpt-4o-mini");
}

export function getArtifactModel() {
  return openai("openai/gpt-4o-mini");
}
