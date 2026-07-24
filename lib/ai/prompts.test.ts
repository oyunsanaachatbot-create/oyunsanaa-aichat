import assert from "node:assert/strict";
import test from "node:test";
import { systemPrompt } from "./prompts";

const createSystemPrompt = (
  userText: string,
  selectedChatModel = "chat-model"
) =>
  systemPrompt({
    selectedChatModel,
    requestHints: {},
    userText,
  });

test("generic Mongolian app question always receives the internal app catalog", () => {
  const prompt = createSystemPrompt("Эрүүл мэндийн апп байгаа юу?");

  assert.ok(prompt.includes("ОЮУНСАНААГИЙН ДОТООД АППЫН КАТАЛОГ"));
  assert.ok(prompt.includes("/mind/self-care/stress"));
  assert.ok(prompt.includes("/mind/who-am-i/balance-test"));
});

test("Latin transliterated app question receives the same internal catalog", () => {
  const prompt = createSystemPrompt("amidraliin tentsver gej app baina uu");

  assert.ok(prompt.includes("Амьдралын тэнцвэр"));
  assert.ok(prompt.includes("/mind/who-am-i/balance-test"));
  assert.ok(prompt.includes("MyFitnessPal"));
  assert.ok(prompt.includes("өмнө санал болгохгүй"));
});

test("reasoning model also receives the internal app catalog", () => {
  const prompt = createSystemPrompt(
    "eruul mendiin app baigaa yu",
    "chat-model-reasoning"
  );

  assert.ok(prompt.includes("ОЮУНСАНААГИЙН ДОТООД АППЫН КАТАЛОГ"));
  assert.ok(prompt.includes("/mind/self-care/stress"));
});
