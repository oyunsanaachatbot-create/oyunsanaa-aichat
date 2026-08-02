import assert from "node:assert/strict";
import test from "node:test";
import {
  CHAT_CONTEXT_MESSAGE_LIMIT,
  countChatImages,
  prepareChatContextMessages,
} from "./chat-context";

const image = (name: string) => ({
  type: "file",
  mediaType: "image/jpeg",
  url: `https://example.com/${name}`,
});

test("keeps at most twelve recent messages", () => {
  const messages = Array.from({ length: 20 }, (_, index) => ({
    role: index % 2 === 0 ? "user" : "assistant",
    parts: [{ type: "text", text: String(index) }],
  }));
  const result = prepareChatContextMessages(messages);
  assert.equal(result.length, CHAT_CONTEXT_MESSAGE_LIMIT);
  assert.equal((result[0]?.parts[0] as { text: string }).text, "8");
});

test("drops historical images but keeps the latest user image", () => {
  const result = prepareChatContextMessages([
    { role: "user", parts: [image("old.jpg")] },
    { role: "assistant", parts: [{ type: "text", text: "old result" }] },
    { role: "user", parts: [image("new.jpg"), { type: "text", text: "энэ" }] },
  ]);
  assert.equal(countChatImages(result), 1);
  assert.equal(
    (result[2]?.parts[0] as { url: string }).url.endsWith("new.jpg"),
    true
  );
});

test("drops all old images when the latest user turn is text-only", () => {
  const result = prepareChatContextMessages([
    { role: "user", parts: [image("receipt.jpg")] },
    { role: "assistant", parts: [{ type: "text", text: "extracted receipt" }] },
    { role: "user", parts: [{ type: "text", text: "зөв" }] },
  ]);
  assert.equal(countChatImages(result), 0);
});
