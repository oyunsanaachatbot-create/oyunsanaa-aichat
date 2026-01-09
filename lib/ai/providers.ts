import { createOpenAI } from "@ai-sdk/openai";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

const THINKING_SUFFIX_REGEX = /-thinking$/;

// ✅ OpenAI provider (Gateway биш)
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  // заавал тавимаар байвал:
  baseURL: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
});

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "chat-model-reasoning": reasoningModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
      });
    })()
  : null;

function ensureThinkingTagModel(modelId: string) {
  // reasoning suffix-ийг цэвэрлээд бодит modelId болгож өгнө
  return modelId.replace(THINKING_SUFFIX_REGEX, "");
}

export function getLanguageModel(modelId: string) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel(modelId);
  }

  const isReasoningModel =
    modelId.includes("reasoning") || modelId.endsWith("-thinking");

  const cleanedId = ensureThinkingTagModel(modelId);

  // ✅ OpenAI-г шууд дуудна
  // models.ts дээр чинь id-ууд "openai/..." хэлбэртэй байгаа тул үүгээр шийднэ
  if (cleanedId.startsWith("openai/")) {
    const openaiModel = cleanedId.replace(/^openai\//, "");

    if (isReasoningModel) {
      return wrapLanguageModel({
        model: openai.languageModel(openaiModel),
        middleware: extractReasoningMiddleware({ tagName: "thinking" }),
      });
    }

    return openai.languageModel(openaiModel);
  }

  // ✅ бусад provider-уудыг одоохондоо бүрмөсөн хаана:
  // (Хэрвээ эндээс буцаагаад ашигламаар бол дараа нь нэмнэ)
  // Аюулгүй байдлын үүднээс OpenAI default руу унагая
  if (isReasoningModel) {
    return wrapLanguageModel({
      model: openai.languageModel("gpt-4.1"),
      middleware: extractReasoningMiddleware({ tagName: "thinking" }),
    });
  }
  return openai.languageModel("gpt-4.1");
}

export function getTitleModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("title-model");
  }
  // ✅ title-д mini ашиглавал хямд
  return openai.languageModel("gpt-4.1-mini");
}

export function getArtifactModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("artifact-model");
  }
  // ✅ artifact-д mini ашиглавал хямд
  return openai.languageModel("gpt-4.1-mini");
}
