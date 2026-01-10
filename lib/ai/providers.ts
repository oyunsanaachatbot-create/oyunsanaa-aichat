// lib/ai/providers.ts
import { createOpenAI } from "@ai-sdk/openai";
import { isTestEnvironment } from "../constants";

// ✅ Зөвхөн OpenAI key хэрэгтэй
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: "https://api.openai.com/v1", // gateway-ээс бүрэн салгахын тулд explicit
});

/**
 * ✅ Энд зөвхөн хэрэглэх 3 model-оо яг нэрээр нь бич.
 * Доорх 3-ыг чи өөрийн UI дээр ашигладаг нэртэйгээ тааруулж өөрчилж болно.
 */
const ALLOWED_MODELS = new Set<string>([
  "openai/gpt-4.1",
  "openai/gpt-4.1-mini",
  "openai/gpt-4o-mini",
]);

/**
 * UI чинь "…-thinking" гэх suffix хэрэглэдэг бол энд л тайрна.
 * Ж: "openai/gpt-4.1-thinking" -> "openai/gpt-4.1"
 */
const THINKING_SUFFIX_REGEX = /-thinking$/;

function normalizeModelId(modelId: string) {
  return modelId.replace(THINKING_SUFFIX_REGEX, "");
}

export function getLanguageModel(modelId: string) {
  // Test/mock хэвээр үлдээх бол (хэрвээ байгаа бол)
  if (isTestEnvironment) {
    // Хэрвээ чи mock ашигладаггүй бол энэ хэсгийг устгаж болно.
    // require("./models.mock") чинь байвал хэвээр нь үлдээж болно.
    const { customProvider } = require("ai");
    const { artifactModel, chatModel, reasoningModel, titleModel } =
      require("./models.mock");

    const myProvider = customProvider({
      languageModels: {
        "chat-model": chatModel,
        "chat-model-reasoning": reasoningModel,
        "title-model": titleModel,
        "artifact-model": artifactModel,
      },
    });

    return myProvider.languageModel(modelId);
  }

  const normalized = normalizeModelId(modelId);

  if (!ALLOWED_MODELS.has(normalized)) {
    throw new Error(
      `Model not allowed: "${modelId}". Allowed: ${Array.from(ALLOWED_MODELS).join(
        ", "
      )}`
    );
  }

  // ✅ Gateway биш: шууд OpenAI provider
  return openai(normalized);
}

/**
 * ✅ Гарчиг/Artifact дээр Anthropic ашиглахаа больж байна.
 * Энд хүсвэл илүү хямд model сонго (ж: gpt-4o-mini эсвэл gpt-4.1-mini).
 */
export function getTitleModel() {
  return openai("openai/gpt-4o-mini");
}

export function getArtifactModel() {
  return openai("openai/gpt-4o-mini");
}
