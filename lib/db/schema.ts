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
  email: varchar("email", { length: 64 }).notNull().unique(),
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

// Append-only audit trail of every payment event (invoice created, QPay
// callback received, verify polled, QPay check result, payment confirmed,
// errors). One SubscriptionPayment row can have many log rows.
export const paymentTransactionLog = pgTable(
  "PaymentTransactionLog",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    // Nullable: a callback can arrive for an invoice we can't resolve.
    userId: uuid("userId"),
    senderInvoiceNo: varchar("senderInvoiceNo", { length: 64 }),
    qpayInvoiceId: text("qpayInvoiceId"),
    // What happened, e.g. invoice_created / callback_received / verify_requested
    // / qpay_check / payment_confirmed / error.
    event: varchar("event", { length: 32 }).notNull(),
    // Which code path produced it: invoice | callback | verify | activate.
    source: varchar("source", { length: 16 }).notNull(),
    amount: integer("amount"),
    currency: varchar("currency", { length: 8 }),
    ip: varchar("ip", { length: 64 }),
    message: text("message"),
    // Raw provider payload / request details for later debugging.
    raw: json("raw"),
  },
  (table) => ({
    senderInvoiceNoIdx: index("PaymentTransactionLog_senderInvoiceNo_idx").on(
      table.senderInvoiceNo
    ),
    createdAtIdx: index("PaymentTransactionLog_createdAt_idx").on(
      table.createdAt
    ),
  })
);

export type PaymentTransactionLog = InferSelectModel<
  typeof paymentTransactionLog
>;

export const emailVerificationToken = pgTable(
  "EmailVerificationToken",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    email: varchar("email", { length: 64 }).notNull(),
    // bcrypt hash of the current six-digit OTP (legacy link hashes also fit).
    tokenHash: varchar("tokenHash", { length: 64 }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    createdAt: timestamp("createdAt", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
  },
  (table) => ({
    emailUnique: uniqueIndex("EmailVerificationToken_email_unique").on(
      table.email
    ),
  })
);

export type EmailVerificationToken = InferSelectModel<
  typeof emailVerificationToken
>;

export const chat = pgTable(
  "Chat",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull(),
    title: text("title").notNull(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
    visibility: varchar("visibility", { enum: ["public", "private"] })
      .notNull()
      .default("private"),
  },
  // Sidebar history: WHERE userId ORDER BY createdAt DESC — индексгүйгээр
  // хэрэглэгч бүрийн түүх ачаалахад бүтэн скан хийдэг байсан.
  (table) => ({
    userIdCreatedAtIdx: index("Chat_userId_createdAt_idx").on(
      table.userId,
      table.createdAt
    ),
  })
);

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

export const message = pgTable(
  "Message_v2",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id),
    role: varchar("role").notNull(),
    parts: json("parts").notNull(),
    attachments: json("attachments").notNull(),
    createdAt: timestamp("createdAt").notNull(),
  },
  // Мессеж бүр ачаалахад WHERE chatId ORDER BY createdAt — Postgres FK-д
  // индекс автоматаар үүсгэдэггүй тул урьд нь бүтэн скан хийдэг байсан.
  // createdAt индекс нь rate-limit тооллого (24h user message count) дээр
  // мөн тусална.
  (table) => ({
    chatIdCreatedAtIdx: index("Message_v2_chatId_createdAt_idx").on(
      table.chatId,
      table.createdAt
    ),
    createdAtIdx: index("Message_v2_createdAt_idx").on(table.createdAt),
  })
);

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

/* ---------------------------------------------------------------------------
 * Online psychologist: an always-available direct inbox for registered users.
 * This is intentionally separate from the appointment-linked therapy chat
 * above, which keeps its booking and session-window rules.
 * ------------------------------------------------------------------------- */
export const psychologistConversation = pgTable(
  "psychologist_conversation",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => user.id),
    psychologistId: uuid("psychologist_id")
      .notNull()
      .references(() => user.id),
    status: varchar("status", { enum: ["open", "closed"] })
      .notNull()
      .default("open"),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    patientUnique: uniqueIndex("psychologist_conversation_patient_unique").on(
      table.patientId
    ),
    psychologistIdx: index("psychologist_conversation_psychologist_idx").on(
      table.psychologistId,
      table.lastMessageAt
    ),
  })
);

export type PsychologistConversation = InferSelectModel<
  typeof psychologistConversation
>;

export const psychologistMessage = pgTable(
  "psychologist_message",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => psychologistConversation.id),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => user.id),
    senderRole: varchar("sender_role", { enum: ["patient", "psychologist"] })
      .notNull(),
    body: text("body").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    conversationIdx: index("psychologist_message_conversation_idx").on(
      table.conversationId,
      table.createdAt
    ),
  })
);

export type PsychologistMessage = InferSelectModel<typeof psychologistMessage>;

/**
 * "Би хэн бэ?" хөтөлбөрийн явц болон дууссан үр дүн.
 * Draft нь completedAt = null, дууссан үнэлгээ нь completedAt утгатай байна.
 * Бүх мөрийг зөвхөн тухайн userId-ээр уншиж, өөрчилнө.
 */
export const whoAmIProgramRun = pgTable(
  "WhoAmIProgramRun",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
    screen: varchar("screen", { length: 32 }).notNull().default("area"),
    areaIdx: integer("areaIdx").notNull().default(0),
    pct: json("pct").notNull(),
    notes: json("notes").notNull(),
    answers: json("answers").notNull(),
    scores: json("scores").notNull(),
    finalNote: text("finalNote").notNull().default(""),
    completedAt: timestamp("completedAt", { withTimezone: true }),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userCompletedUpdatedIdx: index(
      "WhoAmIProgramRun_user_completed_updated_idx"
    ).on(table.userId, table.completedAt, table.updatedAt),
  })
);

export type WhoAmIProgramRun = InferSelectModel<typeof whoAmIProgramRun>;
