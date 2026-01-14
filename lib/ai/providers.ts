import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
  type LanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

const THINKING_SUFFIX_REGEX = /-thinking$/;

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

/**
 * Map "openai/xxx" and "anthropic/yyy" style IDs to direct providers.
 * If modelId comes without a prefix, treat it as OpenAI.
 */
function resolveDirectModel(modelId: string): LanguageModel {
  const trimmed = modelId.replace(THINKING_SUFFIX_REGEX, "");

  if (trimmed.startsWith("openai/")) {
    return openai(trimmed.slice("openai/".length));
  }

  if (trimmed.startsWith("anthropic/")) {
    return anthropic(trimmed.slice("anthropic/".length));
  }

  // No prefix => assume OpenAI model id
  return openai(trimmed);
}

export function getLanguageModel(modelId: string) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel(modelId);
  }

  const isReasoningModel =
    modelId.includes("reasoning") || modelId.endsWith("-thinking");

  if (isReasoningModel) {
    const baseId = modelId.replace(THINKING_SUFFIX_REGEX, "");
    return wrapLanguageModel({
      model: resolveDirectModel(baseId),
      middleware: extractReasoningMiddleware({ tagName: "thinking" }),
    });
  }

  return resolveDirectModel(modelId);
}

export function getTitleModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("title-model");
  }

  // өмнө нь gateway дээр anthropic/claude-haiku-4.5 гэж явж байсан.
  // Direct provider дээр яг ямар нэр ашиглахыг хүсвэл доорхыг env-р сольж болно.
  const titleId =
    process.env.TITLE_MODEL_ID ?? "openai/gpt-4.1-mini";

  return resolveDirectModel(titleId);
}

export function getArtifactModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("artifact-model");
  }

  const artifactId =
    process.env.ARTIFACT_MODEL_ID ?? "openai/gpt-4.1-mini";

  return resolveDirectModel(artifactId);
}
