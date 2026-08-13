import assert from "node:assert/strict";
import test from "node:test";
import {
  detectSpecializedPromptIntent,
  resolveSpecializedPromptIntent,
} from "./prompt-intent";

test("detects every PDF service prompt intent", () => {
  const cases = [
    ["Нойрны бүртгэлээ тайлбарлаач", "health"],
    ["Мөнгөний урсгалаа яаж ойлгох вэ?", "finance"],
    ["Өмнөх тэмдэглэлээ ашиглаж болох уу?", "notes"],
    ["Сэтгэлзүйн тестийн үр дүн юу гэсэн үг вэ?", "tests"],
    ["Энэ хөтөлбөрөөр яаж үргэлжлүүлэх вэ?", "programs"],
    ["Мэргэжилтний цагийг AI баталгаажуулах уу?", "specialist"],
    ["Онлайн сэтгэл зүйч бодит хүн үү?", "onlinePsychologist"],
    ["Мэргэжлийн тусламж авах цаг авъя", "specialist"],
    ["Өөрийгөө шалгах асуулт бөглөе", "tests"],
    ["Sanhuu yaj ajildag ve", "finance"],
    ["temdeglel хадгалмаар байна", "notes"],
  ] as const;

  for (const [message, expected] of cases) {
    assert.equal(detectSpecializedPromptIntent(message), expected, message);
  }
});

test("prefers the more specific service when intents overlap", () => {
  assert.equal(
    detectSpecializedPromptIntent(
      "Онлайн сэтгэл зүйчтэй уулзалтын цаг захиалах гэсэн юм"
    ),
    "onlinePsychologist"
  );
  assert.equal(
    detectSpecializedPromptIntent("Санхүүгийн хөтөлбөрийн талаар асууя"),
    "finance"
  );
});

test("inherits the latest specialized prompt for a short follow-up", () => {
  assert.equal(
    resolveSpecializedPromptIntent({
      latestUserText: "Тэгвэл AI өөрөө баталгаажуулж болох уу?",
      previousUserTexts: ["Мэргэжилтний цаг захиалгын талаар тайлбарлаач"],
    }),
    "specialist"
  );
});

test("a new explicit intent overrides prior conversation context", () => {
  assert.equal(
    resolveSpecializedPromptIntent({
      latestUserText: "Харин нойрны бүртгэлээ яаж харах вэ?",
      previousUserTexts: ["Санхүүгийн тайлангаа тайлбарлаач"],
    }),
    "health"
  );
});

test("does not keep a specialized prompt for an unrelated standalone turn", () => {
  assert.equal(
    resolveSpecializedPromptIntent({
      latestUserText: "Монголын нийслэл аль хот вэ?",
      previousUserTexts: ["Санхүүгийн тайлангаа тайлбарлаач"],
    }),
    null
  );
  assert.equal(
    resolveSpecializedPromptIntent({
      latestUserText: "Энэ улсын нийслэл аль хот вэ?",
      previousUserTexts: ["Санхүүгийн тайлангаа тайлбарлаач"],
    }),
    null
  );
});
