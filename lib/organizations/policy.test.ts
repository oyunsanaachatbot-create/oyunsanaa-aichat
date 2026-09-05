import assert from "node:assert/strict";
import test from "node:test";
import {
  isActiveWindow,
  organizationAiGrantEndsAt,
  roleCanAccessProgram,
} from "./policy";

test("organization roles use exact matching without inheritance", () => {
  assert.equal(roleCanAccessProgram("EMPLOYEE", ["EMPLOYEE"]), true);
  assert.equal(roleCanAccessProgram("MANAGER", ["EMPLOYEE"]), false);
  assert.equal(roleCanAccessProgram("DIRECTOR", ["MANAGER"]), false);
  assert.equal(
    roleCanAccessProgram("DIRECTOR", ["EMPLOYEE", "DIRECTOR"]),
    true
  );
});

test("membership and contract windows are start-inclusive and end-exclusive", () => {
  const start = new Date("2026-01-01T00:00:00.000Z");
  const end = new Date("2026-02-01T00:00:00.000Z");
  assert.equal(isActiveWindow("ACTIVE", start, end, start), true);
  assert.equal(isActiveWindow("ACTIVE", start, end, end), false);
  assert.equal(
    isActiveWindow(
      "SUSPENDED",
      start,
      end,
      new Date("2026-01-15T00:00:00.000Z")
    ),
    false
  );
});

test("AI Chat grant is exactly 30 days from assignment", () => {
  const start = new Date("2026-03-01T06:30:00.000Z");
  assert.equal(
    organizationAiGrantEndsAt(start).toISOString(),
    "2026-03-31T06:30:00.000Z"
  );
});
