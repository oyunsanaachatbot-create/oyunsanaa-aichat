import assert from "node:assert/strict";
import test from "node:test";
import {
  canSeeAppointmentCta,
  canSeeOnlinePsychologistMenu,
  isAdminRole,
  isOnlinePsychologistOperatorRole,
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

test("the appointment CTA is hidden from operators and location providers", () => {
  assert.equal(canSeeAppointmentCta("ADMIN"), false);
  assert.equal(canSeeAppointmentCta("ADMIN_USER"), false);
  assert.equal(canSeeAppointmentCta("SUPER_ADMIN"), true);
  assert.equal(canSeeAppointmentCta("PATIENT"), true);
  assert.equal(canSeeAppointmentCta("LOCATION_PROVIDER"), false);
});

test("only admin users are online psychologist inbox operators", () => {
  assert.equal(isOnlinePsychologistOperatorRole("ADMIN_USER"), true);
  assert.equal(isOnlinePsychologistOperatorRole("admin_user"), true);
  assert.equal(isOnlinePsychologistOperatorRole("ADMIN"), false);
  assert.equal(isOnlinePsychologistOperatorRole("SUPER_ADMIN"), false);
  assert.equal(isOnlinePsychologistOperatorRole("PATIENT"), false);
});

test("only patients and admin users see the online psychologist menu", () => {
  assert.equal(canSeeOnlinePsychologistMenu("ADMIN_USER"), true);
  assert.equal(canSeeOnlinePsychologistMenu("admin_user"), true);
  assert.equal(canSeeOnlinePsychologistMenu("ADMIN"), false);
  assert.equal(canSeeOnlinePsychologistMenu("SUPER_ADMIN"), false);
  assert.equal(canSeeOnlinePsychologistMenu("PATIENT"), true);
  assert.equal(canSeeOnlinePsychologistMenu("PSYCHOLOGIST"), false);
  assert.equal(canSeeOnlinePsychologistMenu("LOCATION_PROVIDER"), false);
});
