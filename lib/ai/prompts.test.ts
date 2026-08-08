import assert from "node:assert/strict";
import test from "node:test";
import { financePrompt, financeReceiptPrompt } from "./prompts/finance";
import { foodPrompt, healthPrompt } from "./prompts/food";
import { notesPrompt } from "./prompts/notes";
import { onlinePsychologistPrompt } from "./prompts/online-psychologist";
import {
  pdfConversationPrompt,
  pdfFinanceAssistantPrompt,
  pdfHealthAssistantPrompt,
  pdfIdentityPrompt,
  pdfKnowledgePrompt,
  pdfNoteAssistantPrompt,
  pdfOnlinePsychologistPrompt,
  pdfProgramPrompt,
  pdfPsychologicalTestPrompt,
  pdfSpecialistSystemPrompt,
  pdfSystemPrompt,
  pdfUserUnderstandingPrompt,
  pdfImplementationPrompt,
  pdfSafetyPrompt,
} from "./prompts/oyunsanaa-pdf";
import { programsPrompt } from "./prompts/programs";
import { specialistPrompt } from "./prompts/specialist";
import { testsPrompt } from "./prompts/tests";
import { artifactsPrompt, systemPrompt } from "./prompts";

const createSystemPrompt = (
  userText: string,
  selectedChatModel = "chat-model"
) =>
  systemPrompt({
    selectedChatModel,
    requestHints: {},
    userText,
  });

test("general chat uses all six PDF core prompt modules", () => {
  const prompt = createSystemPrompt("Өнөөдөр сэтгэл жаахан тавгүй байна");

  for (const module of [
    pdfIdentityPrompt,
    pdfSystemPrompt,
    pdfConversationPrompt,
    pdfKnowledgePrompt,
    pdfUserUnderstandingPrompt,
    pdfImplementationPrompt,
    pdfSafetyPrompt,
  ]) {
    assert.ok(prompt.includes(module.trim()));
  }

  assert.ok(prompt.includes("# 01_SYSTEM_PROMPT"));
  assert.ok(prompt.includes("# 06_SAFETY_PROMPT"));
});

test("reasoning model receives the same PDF core prompt", () => {
  const prompt = createSystemPrompt(
    "Өөрийгөө ойлгоход туслаач",
    "chat-model-reasoning"
  );

  assert.ok(prompt.includes(pdfSystemPrompt.trim()));
  assert.ok(prompt.includes(pdfSafetyPrompt.trim()));
});

test("all PDF service modules are wired to their specialized prompts", () => {
  assert.ok(healthPrompt.includes(pdfHealthAssistantPrompt.trim()));
  assert.ok(financePrompt.includes(pdfFinanceAssistantPrompt.trim()));
  assert.ok(notesPrompt.includes(pdfNoteAssistantPrompt.trim()));
  assert.ok(testsPrompt.includes(pdfPsychologicalTestPrompt.trim()));
  assert.ok(programsPrompt.includes(pdfProgramPrompt.trim()));
  assert.ok(specialistPrompt.includes(pdfSpecialistSystemPrompt.trim()));
  assert.ok(
    onlinePsychologistPrompt.includes(pdfOnlinePsychologistPrompt.trim())
  );
});

test("structured image contracts remain limited to image prompts", () => {
  assert.equal(financePrompt.includes("<FINANCE_JSON>"), false);
  assert.ok(financeReceiptPrompt.includes("<FINANCE_JSON>"));
  assert.equal(healthPrompt.includes("<FOOD_JSON>"), false);
  assert.ok(foodPrompt.includes("<FOOD_JSON>"));
});

test("writing intent still receives artifact instructions", () => {
  const prompt = createSystemPrompt("Надад имэйл бичиж өгнө үү");
  assert.ok(prompt.includes(artifactsPrompt.trim()));
});
