import assert from "node:assert/strict";
import test from "node:test";

import {
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
} from "./password-reset-validation";

const token = "a".repeat(64);

test("accepts a normalized email address", () => {
  const result = passwordResetRequestSchema.parse({
    email: "  Person@example.com ",
  });
  assert.equal(result.email, "Person@example.com");
});

test("accepts matching passwords and a valid reset token", () => {
  assert.equal(
    passwordResetConfirmSchema.safeParse({
      token,
      password: "new-password",
      confirmPassword: "new-password",
    }).success,
    true
  );
});

test("rejects malformed tokens, short passwords, and mismatches", () => {
  for (const input of [
    { token: "bad", password: "new-password", confirmPassword: "new-password" },
    { token, password: "short", confirmPassword: "short" },
    { token, password: "new-password", confirmPassword: "different-password" },
  ]) {
    assert.equal(passwordResetConfirmSchema.safeParse(input).success, false);
  }
});
