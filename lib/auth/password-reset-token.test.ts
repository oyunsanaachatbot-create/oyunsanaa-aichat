import assert from "node:assert/strict";
import test from "node:test";
import {
  createPasswordResetToken,
  hashPasswordResetToken,
  isPasswordResetToken,
} from "./password-reset-token";

test("password reset tokens are random 256-bit hex values", () => {
  const first = createPasswordResetToken();
  const second = createPasswordResetToken();

  assert.equal(first.length, 64);
  assert.equal(isPasswordResetToken(first), true);
  assert.notEqual(first, second);
});

test("only the token hash needs to be persisted", () => {
  const token = "a".repeat(64);
  const hash = hashPasswordResetToken(token);

  assert.equal(hash.length, 64);
  assert.notEqual(hash, token);
  assert.equal(hashPasswordResetToken(token), hash);
  assert.equal(isPasswordResetToken("not-a-reset-token"), false);
});
