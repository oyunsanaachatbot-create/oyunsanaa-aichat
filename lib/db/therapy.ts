/**
 * Therapy chat helpers.
 *
 * Booking + psychologist data live in the web app's Prisma `scheduling` schema
 * (same Postgres DB). Participants are linked across the two apps **by email**.
 * Reads of `scheduling.*` use raw `getSql()` because the pgClient query builder
 * cannot schema-qualify table names. Chat tables (`therapy_*`) live in `public`.
 */
import { getSql } from "./pgClient";

export type SchedulingRole = "PATIENT" | "PSYCHOLOGIST";

export type SchedulingUser = {
  id: string;
  email: string;
  name: string;
  role: SchedulingRole;
};

/** Resolve the logged-in aichat user (by email) to their web booking account. */
export async function getSchedulingUserByEmail(
  email: string
): Promise<SchedulingUser | null> {
  const sql = getSql();
  if (!sql) {
    return null;
  }
  const rows = await sql<SchedulingUser[]>`
    SELECT id, email, name, role::text AS role
    FROM scheduling."user"
    WHERE lower(email) = lower(${email})
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export type StartableAppointment = {
  appointmentId: string;
  status: string;
  sessionType: string;
  date: string;
  startTime: string;
  endTime: string;
  counterpartName: string;
  counterpartEmail: string;
};

/**
 * Confirmed ONLINE appointments the given booking user takes part in — from
 * either side. `counterpart*` is the other participant (the one you'd chat with).
 */
export async function getChatableAppointments(
  me: SchedulingUser
): Promise<StartableAppointment[]> {
  const sql = getSql();
  if (!sql) {
    return [];
  }
  const isPsychologist = me.role === "PSYCHOLOGIST";
  // The counterpart is the patient when I'm the psychologist, else the psychologist.
  const rows = await sql<StartableAppointment[]>`
    SELECT
      a.id AS "appointmentId",
      a.status::text AS status,
      a.session_type::text AS "sessionType",
      av.date::text AS date,
      av.start_time::text AS "startTime",
      av.end_time::text AS "endTime",
      cp.name AS "counterpartName",
      cp.email AS "counterpartEmail"
    FROM scheduling.appointment a
    JOIN scheduling.availability av ON av.id = a.availability_id
    JOIN scheduling."user" cp
      ON cp.id = ${isPsychologist ? sql`a.patient_id` : sql`a.psychologist_id`}
    WHERE ${isPsychologist ? sql`a.psychologist_id` : sql`a.patient_id`} = ${me.id}
      AND a.session_type = 'ONLINE'
      AND a.status = 'CONFIRMED'
    ORDER BY av.date DESC, av.start_time DESC
  `;
  return rows;
}

/** Load a single appointment with both participants' emails/ids (any schema). */
export type AppointmentParties = {
  appointmentId: string;
  status: string;
  sessionType: string;
  patientId: string;
  patientEmail: string;
  psychologistId: string;
  psychologistEmail: string;
};

export async function getAppointmentParties(
  appointmentId: string
): Promise<AppointmentParties | null> {
  const sql = getSql();
  if (!sql) {
    return null;
  }
  const rows = await sql<AppointmentParties[]>`
    SELECT
      a.id AS "appointmentId",
      a.status::text AS status,
      a.session_type::text AS "sessionType",
      a.patient_id AS "patientId",
      pat.email AS "patientEmail",
      a.psychologist_id AS "psychologistId",
      psy.email AS "psychologistEmail"
    FROM scheduling.appointment a
    JOIN scheduling."user" pat ON pat.id = a.patient_id
    JOIN scheduling."user" psy ON psy.id = a.psychologist_id
    WHERE a.id = ${appointmentId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export type ConversationRow = {
  id: string;
  appointmentId: string | null;
  clientEmail: string;
  psychologistEmail: string;
  status: string;
  lastMessageAt: string | null;
  createdAt: string;
};

export type ConversationAccess = {
  conversation: ConversationRow;
  role: "client" | "psychologist";
};

/**
 * Returns the conversation and the caller's role within it, or null if the
 * email is not a participant. This is the IDOR guard used by every chat route.
 */
export async function assertConversationAccess(
  conversationId: string,
  email: string
): Promise<ConversationAccess | null> {
  const sql = getSql();
  if (!sql) {
    return null;
  }
  const rows = await sql<ConversationRow[]>`
    SELECT
      id,
      appointment_id AS "appointmentId",
      client_email AS "clientEmail",
      psychologist_email AS "psychologistEmail",
      status,
      last_message_at AS "lastMessageAt",
      created_at AS "createdAt"
    FROM therapy_conversation
    WHERE id = ${conversationId}
    LIMIT 1
  `;
  const conversation = rows[0];
  if (!conversation) {
    return null;
  }
  const lower = email.toLowerCase();
  if (conversation.clientEmail.toLowerCase() === lower) {
    return { conversation, role: "client" };
  }
  if (conversation.psychologistEmail.toLowerCase() === lower) {
    return { conversation, role: "psychologist" };
  }
  return null;
}

export type ConversationListItem = ConversationRow & {
  counterpartEmail: string;
  unreadCount: number;
  lastBody: string | null;
  // Linked appointment context (null if the appointment was removed).
  apptStatus: string | null;
  apptDate: string | null;
  apptStartTime: string | null;
  // Whether the booked session's end time has already passed (null = no booking).
  apptWindowEnded: boolean | null;
};

/** Conversations the given email participates in, newest activity first. */
export async function listConversationsForEmail(
  email: string
): Promise<ConversationListItem[]> {
  const sql = getSql();
  if (!sql) {
    return [];
  }
  const lower = email.toLowerCase();
  return await sql<ConversationListItem[]>`
    SELECT
      c.id,
      c.appointment_id AS "appointmentId",
      c.client_email AS "clientEmail",
      c.psychologist_email AS "psychologistEmail",
      c.status,
      c.last_message_at AS "lastMessageAt",
      c.created_at AS "createdAt",
      CASE WHEN lower(c.client_email) = ${lower}
        THEN c.psychologist_email ELSE c.client_email END AS "counterpartEmail",
      (
        SELECT count(*)::int FROM therapy_message m
        WHERE m.conversation_id = c.id
          AND lower(m.sender_email) <> ${lower}
          AND m.read_at IS NULL
      ) AS "unreadCount",
      (
        SELECT m.body FROM therapy_message m
        WHERE m.conversation_id = c.id
        ORDER BY m.created_at DESC LIMIT 1
      ) AS "lastBody",
      a.status::text AS "apptStatus",
      av.date::text AS "apptDate",
      av.start_time::text AS "apptStartTime",
      CASE
        WHEN av.id IS NULL THEN NULL
        ELSE (now() > ((av.date + av.end_time) AT TIME ZONE 'UTC'))
      END AS "apptWindowEnded"
    FROM therapy_conversation c
    LEFT JOIN scheduling.appointment a ON a.id = c.appointment_id
    LEFT JOIN scheduling.availability av ON av.id = a.availability_id
    WHERE lower(c.client_email) = ${lower}
       OR lower(c.psychologist_email) = ${lower}
    ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
  `;
}

export type AppointmentSummary = {
  status: string;
  sessionType: string;
  date: string;
  startTime: string;
  endTime: string;
  // Session end as unix epoch *seconds*. The web app stores slot date/time as
  // naive values and treats them as UTC when deciding `isPast` (see web
  // dashboard query). We mirror that exact convention here so both apps agree
  // on when a session is over.
  endsAtEpoch: number;
  // Server-evaluated: the booked session's end time has passed. Once true the
  // chat is read-only regardless of the manual open/closed flag — this is what
  // stops a client from chatting after the appointment hour ends.
  windowEnded: boolean;
};

/** Date/time/status of a single appointment — used to tie a chat to its booking. */
export async function getAppointmentSummaryById(
  appointmentId: string
): Promise<AppointmentSummary | null> {
  const sql = getSql();
  if (!sql) {
    return null;
  }
  const rows = await sql<AppointmentSummary[]>`
    SELECT
      a.status::text AS status,
      a.session_type::text AS "sessionType",
      av.date::text AS date,
      av.start_time::text AS "startTime",
      av.end_time::text AS "endTime",
      extract(epoch from ((av.date + av.end_time) AT TIME ZONE 'UTC')) AS "endsAtEpoch",
      (now() > ((av.date + av.end_time) AT TIME ZONE 'UTC')) AS "windowEnded"
    FROM scheduling.appointment a
    JOIN scheduling.availability av ON av.id = a.availability_id
    WHERE a.id = ${appointmentId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}
