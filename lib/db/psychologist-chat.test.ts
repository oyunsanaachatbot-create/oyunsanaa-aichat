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

test("the psychologist service team shares conversation access", () => {
  assert.equal(
    directConversationRoleForActor(participants, {
      id: "another-psychologist-id",
      role: "PSYCHOLOGIST",
    }),
    "psychologist"
  );
});

test("participant labels never fall back to an email address", () => {
  assert.equal(displayParticipantName("  Саруул  ", "Сэтгэл зүйч"), "Саруул");
  assert.equal(displayParticipantName(null, "Сэтгэл зүйч"), "Сэтгэл зүйч");
  assert.equal(displayParticipantName("   ", "Үйлчлүүлэгч"), "Үйлчлүүлэгч");
});
