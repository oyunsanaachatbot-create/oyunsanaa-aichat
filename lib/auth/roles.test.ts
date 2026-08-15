import assert from "node:assert/strict";
import test from "node:test";
import { canSeeAppointmentCta, isAdminRole, isSuperAdminRole } from "./roles";

test("super admins inherit administrator access", () => {
  assert.equal(isAdminRole("ADMIN"), true);
  assert.equal(isAdminRole("SUPER_ADMIN"), true);
  assert.equal(isAdminRole("super_admin"), true);
  assert.equal(isAdminRole("PATIENT"), false);
});

test("only super admins can receive super-admin-only permissions", () => {
  assert.equal(isSuperAdminRole("SUPER_ADMIN"), true);
  assert.equal(isSuperAdminRole("ADMIN"), false);
});

test("the appointment CTA is hidden only from ordinary administrators", () => {
  assert.equal(canSeeAppointmentCta("ADMIN"), false);
  assert.equal(canSeeAppointmentCta("SUPER_ADMIN"), true);
  assert.equal(canSeeAppointmentCta("PATIENT"), true);
});
