import assert from "node:assert/strict";
import test from "node:test";
import { safeCallback } from "./callback-url";

test("login callbacks stay in the app and never loop to authentication pages", () => {
  for (const value of [null,"","javascript:alert(1)","https://attacker.invalid","//attacker.invalid","/\\attacker.invalid","/\n/attacker.invalid","/login?callbackUrl=/","/register","/x/../login","/%6cogin"])
    assert.equal(safeCallback(value),"/");
  assert.equal(safeCallback("/mind/programs?type=TRAINING#lesson"),"/mind/programs?type=TRAINING#lesson");
});
