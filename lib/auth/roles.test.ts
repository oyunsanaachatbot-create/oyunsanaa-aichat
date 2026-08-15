import assert from "node:assert/strict";
import test from "node:test";
import {
  canSeeAppointmentCta,
  canSeeOnlinePsychologistMenu,
  isAdminRole,
  isSuperAdminRole,
} from "./roles";

test("super admins inherit administrator access", () => {
  assert.equal(isAdminRole("ADMIN"), true);
  assert.equal(isAdminRole("SUPER_ADMIN"), true);
  assert.equal(isAdminRole("ADMIN_USER"), true);
  assert.equal(isAdminRole("super_admin"), true);
  assert.equal(isAdminRole("admin_user"), true);
  assert.equal(isAdminRole("PATIENT"), false);
});

test("only super admins can receive super-admin-only permissions", () => {
  assert.equal(isSuperAdminRole("SUPER_ADMIN"), true);
  assert.equal(isSuperAdminRole("ADMIN"), false);
});

test("the appointment CTA is hidden only from ordinary administrators", () => {
  assert.equal(canSeeAppointmentCta("ADMIN"), false);
  assert.equal(canSeeAppointmentCta("ADMIN_USER"), false);
  assert.equal(canSeeAppointmentCta("SUPER_ADMIN"), true);
  assert.equal(canSeeAppointmentCta("PATIENT"), true);
});

test("the online psychologist menu is hidden only from admin users", () => {
  assert.equal(canSeeOnlinePsychologistMenu("ADMIN_USER"), false);
  assert.equal(canSeeOnlinePsychologistMenu("admin_user"), false);
  assert.equal(canSeeOnlinePsychologistMenu("ADMIN"), true);
  assert.equal(canSeeOnlinePsychologistMenu("SUPER_ADMIN"), true);
  assert.equal(canSeeOnlinePsychologistMenu("PATIENT"), true);
});
