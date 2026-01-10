// lib/ai/providers.ts
import { createOpenAI } from "@ai-sdk/openai";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: "https://api.openai.com/v1",
});

const THINKING_SUFFIX_REGEX = /-thinking$/;

function normalize(modelId: string) {
  return modelId.replace(THINKING_SUFFIX_REGEX, "");
}

// ✅ зөвхөн OpenAI ашиглах хамгаалалт
const ALLOWED = new Set<string>([
  "openai/gpt-4.1",
  "openai/gpt-4.1-mini",
  "openai/gpt-4o-mini",
]);

export function getLanguageModel(modelId: string) {
  const id = normalize(modelId);

  if (!id.startsWith("openai/")) {
    throw new Error(`Only OpenAI models are allowed. Got: "${modelId}"`);
  }
  if (!ALLOWED.has(id)) {
    throw new Error(
      `Model not allowed: "${modelId}". Allowed: ${Array.from(ALLOWED).join(", ")}`
    );
  }

  return openai(id);
}

export function getTitleModel() {
  return openai("openai/gpt-4o-mini");
}

export function getArtifactModel() {
  return openai("openai/gpt-4o-mini");
}
