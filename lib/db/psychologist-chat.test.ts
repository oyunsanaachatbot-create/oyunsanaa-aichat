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

test("psychologists can access only conversations assigned to them", () => {
  assert.equal(
    directConversationRoleForActor(participants, {
      id: "psychologist-id",
      role: "PSYCHOLOGIST",
    }),
    "psychologist"
  );
  assert.equal(
    directConversationRoleForActor(participants, {
      id: "another-psychologist-id",
      role: "PSYCHOLOGIST",
    }),
    null
  );
});

test("administrators can access every psychologist conversation", () => {
  assert.equal(
    directConversationRoleForActor(participants, {
      id: "admin-id",
      role: "ADMIN",
    }),
    "psychologist"
  );
});

test("participant labels never fall back to an email address", () => {
  assert.equal(displayParticipantName("  Саруул  ", "Сэтгэл зүйч"), "Саруул");
  assert.equal(displayParticipantName(null, "Сэтгэл зүйч"), "Сэтгэл зүйч");
  assert.equal(displayParticipantName("   ", "Үйлчлүүлэгч"), "Үйлчлүүлэгч");
});
