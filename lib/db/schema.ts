import type { InferSelectModel } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  index,
  integer,
  json,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const user = pgTable("User", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }),
  name: varchar("name", { length: 64 }),
  role: varchar("role", { length: 20 }).notNull().default("PATIENT"),

  // ✅ NEW: email verification
  emailVerifiedAt: timestamp("emailVerifiedAt", { withTimezone: true }),

  // ✅ NEW: subscription / free trial
  // When the 1-day free trial started (defaults to account creation time).
  trialStartedAt: timestamp("trialStartedAt", { withTimezone: true })
    .notNull()
    .defaultNow(),
  // Cached status label. Source-of-truth for *access* is the dates below
  // (see lib/subscription/access.ts); this column is updated on payment.
  subscriptionStatus: varchar("subscriptionStatus", {
    enum: ["trialing", "active", "expired"],
  })
    .notNull()
    .default("trialing"),
  // End of the currently paid period. null = never paid.
  currentPeriodEnd: timestamp("currentPeriodEnd", { withTimezone: true }),
});

export type User = InferSelectModel<typeof user>;

// ✅ NEW: one row per QPay invoice issued for a subscription month.
export const subscriptionPayment = pgTable("SubscriptionPayment", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  // QPay's invoice id (returned from POST /v2/invoice).
  qpayInvoiceId: text("qpayInvoiceId"),
  // Our own idempotency key sent to QPay as sender_invoice_no.
  senderInvoiceNo: varchar("senderInvoiceNo", { length: 64 }).notNull().unique(),
  amount: integer("amount").notNull(), // minor-unit-free MNT amount
  currency: varchar("currency", { length: 8 }).notNull().default("MNT"),
  status: varchar("status", {
    enum: ["pending", "paid", "expired", "failed"],
  })
    .notNull()
    .default("pending"),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .notNull()
    .defaultNow(),
  paidAt: timestamp("paidAt", { withTimezone: true }),
});

export type SubscriptionPayment = InferSelectModel<typeof subscriptionPayment>;

export const emailVerificationToken = pgTable("EmailVerificationToken", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  tokenHash: varchar("tokenHash", { length: 64 }).notNull(), // sha256 hex = 64
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull(),
  expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
});

export type EmailVerificationToken = InferSelectModel<
  typeof emailVerificationToken
>;

export const chat = pgTable("Chat", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull(),
  title: text("title").notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  visibility: varchar("visibility", { enum: ["public", "private"] })
    .notNull()
    .default("private"),
});

export type Chat = InferSelectModel<typeof chat>;

// DEPRECATED
export const messageDeprecated = pgTable("Message", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  role: varchar("role").notNull(),
  content: json("content").notNull(),
  createdAt: timestamp("createdAt").notNull(),
});

export type MessageDeprecated = InferSelectModel<typeof messageDeprecated>;

export const message = pgTable("Message_v2", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  role: varchar("role").notNull(),
  parts: json("parts").notNull(),
  attachments: json("attachments").notNull(),
  createdAt: timestamp("createdAt").notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;

// DEPRECATED
export const voteDeprecated = pgTable(
  "Vote",
  {
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id),
    messageId: uuid("messageId")
      .notNull()
      .references(() => messageDeprecated.id),
    isUpvoted: boolean("isUpvoted").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  }
);

export type VoteDeprecated = InferSelectModel<typeof voteDeprecated>;

export const vote = pgTable(
  "Vote_v2",
  {
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id),
    messageId: uuid("messageId")
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean("isUpvoted").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  }
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  "Document",
  {
    id: uuid("id").notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull(),
    title: text("title").notNull(),
    content: text("content"),
    kind: varchar("text", { enum: ["text", "code", "image", "sheet"] })
      .notNull()
      .default("text"),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  }
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  "Suggestion",
  {
    id: uuid("id").notNull().defaultRandom(),
    documentId: uuid("documentId").notNull(),
    documentCreatedAt: timestamp("documentCreatedAt").notNull(),
    originalText: text("originalText").notNull(),
    suggestedText: text("suggestedText").notNull(),
    description: text("description"),
    isResolved: boolean("isResolved").notNull().default(false),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  })
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = pgTable(
  "Stream",
  {
    id: uuid("id").notNull().defaultRandom(),
    chatId: uuid("chatId").notNull(),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    chatRef: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chat.id],
    }),
  })
);

export type Stream = InferSelectModel<typeof stream>;

/* ---------------------------------------------------------------------------
 * Therapy: real-time text chat between a patient and a real psychologist.
 * Booking/psychologist data lives in the web app's Prisma `scheduling` schema
 * (same Postgres DB); we link participants by email and only store the chat
 * itself here. See realtime-therapy-chat-decision memory.
 * ------------------------------------------------------------------------- */
export const therapyConversation = pgTable(
  "therapy_conversation",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    // scheduling.appointment.id (text uuid) this thread belongs to. Nullable so
    // a thread can exist without an appointment later if needed.
    appointmentId: text("appointment_id"),
    clientEmail: varchar("client_email", { length: 64 }).notNull(),
    psychologistEmail: varchar("psychologist_email", { length: 64 }).notNull(),
    status: varchar("status", { enum: ["open", "closed"] })
      .notNull()
      .default("open"),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // One conversation per appointment (NULLs are distinct, so appointment-less
    // threads are unconstrained).
    appointmentUnique: uniqueIndex(
      "therapy_conversation_appointment_unique"
    ).on(table.appointmentId),
  })
);

export type TherapyConversation = InferSelectModel<typeof therapyConversation>;

export const therapyMessage = pgTable(
  "therapy_message",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => therapyConversation.id),
    senderEmail: varchar("sender_email", { length: 64 }).notNull(),
    senderRole: varchar("sender_role", { enum: ["client", "psychologist"] })
      .notNull(),
    body: text("body").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    conversationIdx: index("therapy_message_conversation_idx").on(
      table.conversationId,
      table.createdAt
    ),
  })
);

export type TherapyMessage = InferSelectModel<typeof therapyMessage>;
