import { getSql } from "./pgClient";

export type DirectChatRole = "patient" | "psychologist";

export type DirectChatActor = {
  id: string;
  email: string;
  name: string | null;
  role: "PATIENT" | "PSYCHOLOGIST";
};

export type DirectConversation = {
  id: string;
  patientId: string;
  psychologistId: string;
  patientEmail: string;
  patientName: string | null;
  psychologistEmail: string;
  psychologistName: string | null;
  status: "open" | "closed";
  lastMessageAt: string | null;
  lastBody: string | null;
  unreadCount: number;
  createdAt: string;
};

export type DirectConversationAccess = {
  conversation: DirectConversation;
  role: DirectChatRole;
};

export type DirectMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderEmail: string;
  senderName: string | null;
  senderRole: DirectChatRole;
  body: string;
  readAt: string | null;
  createdAt: string;
};

function actorRole(actor: DirectChatActor): DirectChatRole {
  return actor.role === "PSYCHOLOGIST" ? "psychologist" : "patient";
}

/** List only the inbox threads visible to this authenticated user. */
export async function listDirectConversations(
  actor: DirectChatActor
): Promise<DirectConversation[]> {
  const sql = getSql();
  if (!sql) return [];

  const role = actorRole(actor);
  return await sql<DirectConversation[]>`
    SELECT
      c.id,
      c.patient_id AS "patientId",
      c.psychologist_id AS "psychologistId",
      p.email AS "patientEmail",
      p.name AS "patientName",
      psy.email AS "psychologistEmail",
      psy.name AS "psychologistName",
      c.status,
      c.last_message_at AS "lastMessageAt",
      (
        SELECT m.body
        FROM psychologist_message m
        WHERE m.conversation_id = c.id
        ORDER BY m.created_at DESC
        LIMIT 1
      ) AS "lastBody",
      (
        SELECT count(*)::int
        FROM psychologist_message m
        WHERE m.conversation_id = c.id
          AND m.sender_role <> ${role}
          AND m.read_at IS NULL
      ) AS "unreadCount",
      c.created_at AS "createdAt"
    FROM psychologist_conversation c
    JOIN public."User" p ON p.id = c.patient_id
    JOIN public."User" psy ON psy.id = c.psychologist_id
    WHERE (
      ${role === "patient"} AND c.patient_id = ${actor.id}::uuid
    ) OR (
      ${role === "psychologist"} AND c.psychologist_id = ${actor.id}::uuid
    )
    ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
  `;
}

/**
 * Create the patient's one inbox thread, assigning it to the psychologist
 * with the fewest existing threads. The unique patient index makes retries
 * idempotent when the user clicks start more than once.
 */
export async function createOrGetDirectConversation(
  patientId: string
): Promise<DirectConversation | null> {
  const sql = getSql();
  if (!sql) return null;

  const rows = await sql<{ id: string }[]>`
    INSERT INTO psychologist_conversation (patient_id, psychologist_id)
    SELECT ${patientId}::uuid, psy.id
    FROM public."User" psy
    WHERE upper(psy.role) = 'PSYCHOLOGIST'
      AND psy.id <> ${patientId}::uuid
    ORDER BY (
      SELECT count(*)
      FROM psychologist_conversation existing
      WHERE existing.psychologist_id = psy.id
    ) ASC, psy.id ASC
    LIMIT 1
    ON CONFLICT (patient_id)
      DO UPDATE SET patient_id = EXCLUDED.patient_id
    RETURNING id
  `;

  const id = rows[0]?.id;
  if (!id) return null;

  const conversation = await getDirectConversationById(id);
  return conversation;
}

export async function getDirectConversationById(
  id: string
): Promise<DirectConversation | null> {
  const sql = getSql();
  if (!sql) return null;

  const rows = await sql<DirectConversation[]>`
    SELECT
      c.id,
      c.patient_id AS "patientId",
      c.psychologist_id AS "psychologistId",
      p.email AS "patientEmail",
      p.name AS "patientName",
      psy.email AS "psychologistEmail",
      psy.name AS "psychologistName",
      c.status,
      c.last_message_at AS "lastMessageAt",
      (
        SELECT m.body
        FROM psychologist_message m
        WHERE m.conversation_id = c.id
        ORDER BY m.created_at DESC
        LIMIT 1
      ) AS "lastBody",
      0::int AS "unreadCount",
      c.created_at AS "createdAt"
    FROM psychologist_conversation c
    JOIN public."User" p ON p.id = c.patient_id
    JOIN public."User" psy ON psy.id = c.psychologist_id
    WHERE c.id = ${id}::uuid
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function assertDirectConversationAccess(
  conversationId: string,
  actor: DirectChatActor
): Promise<DirectConversationAccess | null> {
  const conversation = await getDirectConversationById(conversationId);
  if (!conversation) return null;

  if (conversation.patientId === actor.id && actor.role === "PATIENT") {
    return { conversation, role: "patient" };
  }
  if (
    conversation.psychologistId === actor.id &&
    actor.role === "PSYCHOLOGIST"
  ) {
    return { conversation, role: "psychologist" };
  }
  return null;
}

export async function getDirectMessages(
  conversationId: string,
  role: DirectChatRole
): Promise<DirectMessage[]> {
  const sql = getSql();
  if (!sql) return [];

  await sql`
    UPDATE psychologist_message
    SET read_at = now()
    WHERE conversation_id = ${conversationId}::uuid
      AND sender_role <> ${role}
      AND read_at IS NULL
  `;

  return await sql<DirectMessage[]>`
    SELECT
      m.id,
      m.conversation_id AS "conversationId",
      m.sender_id AS "senderId",
      u.email AS "senderEmail",
      u.name AS "senderName",
      m.sender_role AS "senderRole",
      m.body,
      m.read_at AS "readAt",
      m.created_at AS "createdAt"
    FROM psychologist_message m
    JOIN public."User" u ON u.id = m.sender_id
    WHERE m.conversation_id = ${conversationId}::uuid
    ORDER BY m.created_at ASC
  `;
}

export async function insertDirectMessage({
  conversationId,
  actor,
  role,
  body,
}: {
  conversationId: string;
  actor: DirectChatActor;
  role: DirectChatRole;
  body: string;
}): Promise<DirectMessage | null> {
  const sql = getSql();
  if (!sql) return null;

  const rows = await sql<DirectMessage[]>`
    INSERT INTO psychologist_message
      (conversation_id, sender_id, sender_role, body)
    VALUES
      (${conversationId}::uuid, ${actor.id}::uuid, ${role}, ${body})
    RETURNING
      id,
      conversation_id AS "conversationId",
      sender_id AS "senderId",
      ${actor.email}::text AS "senderEmail",
      ${actor.name}::text AS "senderName",
      sender_role AS "senderRole",
      body,
      read_at AS "readAt",
      created_at AS "createdAt"
  `;
  const message = rows[0] ?? null;

  if (message) {
    await sql`
      UPDATE psychologist_conversation
      SET last_message_at = now()
      WHERE id = ${conversationId}::uuid
    `;
  }

  return message;
}

export async function updateDirectConversationStatus(
  conversationId: string,
  status: "open" | "closed"
) {
  const sql = getSql();
  if (!sql) return;
  await sql`
    UPDATE psychologist_conversation
    SET status = ${status}
    WHERE id = ${conversationId}::uuid
  `;
}
