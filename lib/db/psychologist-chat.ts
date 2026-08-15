import { type AppRole, isAdminRole } from "@/lib/auth/roles";
import { getSql } from "./pgClient";

export type DirectChatRole = "patient" | "psychologist";

export type DirectChatActor = {
  id: string;
  name: string | null;
  role: AppRole;
};

export type DirectConversation = {
  id: string;
  patientId: string;
  psychologistId: string;
  patientName: string | null;
  psychologistName: string | null;
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
  senderName: string | null;
  senderRole: DirectChatRole;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export function directConversationRoleForActor(
  conversation: Pick<DirectConversation, "patientId" | "psychologistId">,
  actor: Pick<DirectChatActor, "id" | "role">
): DirectChatRole | null {
  if (isAdminRole(actor.role)) return "psychologist";
  if (actor.role === "PATIENT" && conversation.patientId === actor.id) {
    return "patient";
  }
  return null;
}

/**
 * Patients see only their own thread. Every administrator shares the entire
 * service inbox; website psychologists are not online-chat operators.
 */
export async function listDirectConversations(
  actor: DirectChatActor
): Promise<DirectConversation[]> {
  const sql = getSql();
  if (!sql) return [];
  const role: DirectChatRole =
    actor.role === "PATIENT" ? "patient" : "psychologist";
  const hasAdminAccess = isAdminRole(actor.role);

  return await sql<DirectConversation[]>`
    SELECT
      c.id,
      c.patient_id AS "patientId",
      c.psychologist_id AS "psychologistId",
      p.name AS "patientName",
      psy.name AS "psychologistName",
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
    WHERE (${hasAdminAccess})
       OR (${actor.role === "PATIENT"}
           AND c.patient_id = ${actor.id}::uuid)
    ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
  `;
}

/**
 * Create the patient's one inbox thread. `psychologist_id` is a legacy,
 * required foreign key, so it points to one deterministic administrator; it
 * does not limit which administrator can see or answer the shared inbox.
 */
export async function createOrGetDirectConversation(
  patientId: string
): Promise<DirectConversation | null> {
  const sql = getSql();
  if (!sql) return null;

  const rows = await sql<{ id: string }[]>`
    INSERT INTO psychologist_conversation (patient_id, psychologist_id)
    SELECT ${patientId}::uuid, operator.id
    FROM public."User" operator
    WHERE upper(operator.role::text) IN ('ADMIN', 'SUPER_ADMIN')
    ORDER BY CASE WHEN upper(operator.role::text) = 'ADMIN' THEN 0 ELSE 1 END,
      operator.id
    LIMIT 1
    ON CONFLICT (patient_id)
      DO UPDATE SET
        psychologist_id = EXCLUDED.psychologist_id,
        status = 'open'
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
      p.name AS "patientName",
      psy.name AS "psychologistName",
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

  const role = directConversationRoleForActor(conversation, actor);
  return role ? { conversation, role } : null;
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
