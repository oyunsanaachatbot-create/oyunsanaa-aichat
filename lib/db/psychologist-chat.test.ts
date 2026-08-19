import assert from "node:assert/strict";
import test from "node:test";
import { directConversationRoleForActor } from "./psychologist-chat";
import { displayParticipantName } from "../psychologist-chat/presentation";

const participants = {
  patientId: "patient-id",
  psychologistId: "psychologist-id",
};

test("patients can access only their own conversation", () => {
  assert.equal(
    directConversationRoleForActor(participants, {
      id: "patient-id",
      role: "PATIENT",
    }),
    "patient"
  );
  assert.equal(
    directConversationRoleForActor(participants, {
      id: "other-id",
      role: "PATIENT",
    }),
    null
  );
});

test("website psychologists cannot access the app support inbox", () => {
  assert.equal(
    directConversationRoleForActor(participants, {
      id: "psychologist-id",
      role: "PSYCHOLOGIST",
    }),
    null
  );
});

test("only admin users can access every conversation as an operator", () => {
  assert.equal(
    directConversationRoleForActor(participants, {
      id: "admin-one",
      role: "ADMIN",
    }),
    null
  );
  assert.equal(
    directConversationRoleForActor(participants, {
      id: "super-admin",
      role: "SUPER_ADMIN",
    }),
    null
  );
  assert.equal(
    directConversationRoleForActor(participants, {
      id: "admin-user",
      role: "ADMIN_USER",
    }),
    "psychologist"
  );
});

test("participant labels never fall back to an email address", () => {
  assert.equal(displayParticipantName("  Саруул  ", "Сэтгэл зүйч"), "Саруул");
  assert.equal(displayParticipantName(null, "Сэтгэл зүйч"), "Сэтгэл зүйч");
  assert.equal(displayParticipantName("   ", "Үйлчлүүлэгч"), "Үйлчлүүлэгч");
});
