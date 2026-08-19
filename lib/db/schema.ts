import { sql, type InferSelectModel } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  json,
  jsonb,
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
  authVersion: integer("authVersion").notNull().default(0),

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

/** Shared semantic catalog used by the web publisher and this app. */
export const contentCatalogItem = pgTable(
  "ContentCatalogItem",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    externalKey: varchar("externalKey", { length: 220 }).notNull(),
    sourceApp: varchar("sourceApp", { enum: ["WEB", "AICHAT"] }).notNull(),
    sourceType: varchar("sourceType", { length: 40 }).notNull(),
    sourceId: varchar("sourceId", { length: 220 }),
    kind: varchar("kind", {
      enum: [
        "PROGRAM",
        "TRAINING",
        "TEST",
        "RESEARCH",
        "ARTICLE",
        "NOTE",
        "FINANCE",
        "HEALTH",
        "SPECIALIST",
      ],
    }).notNull(),
    title: varchar("title", { length: 300 }).notNull(),
    summary: text("summary"),
    href: varchar("href", { length: 1000 }).notNull(),
    categoryCode: varchar("categoryCode", { length: 10 }).notNull(),
    subcategoryCode: varchar("subcategoryCode", { length: 10 }).notNull(),
    taxonomyType: varchar("taxonomyType", { length: 300 }).notNull(),
    primaryTagKey: varchar("primaryTagKey", { length: 500 }).notNull(),
    additionalTagKeys: text("additionalTagKeys")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    status: varchar("status", { enum: ["ACTIVE", "INACTIVE"] })
      .notNull()
      .default("ACTIVE"),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    externalKeyUnique: uniqueIndex("ContentCatalogItem_externalKey_key").on(
      table.externalKey
    ),
    statusKindCreatedIdx: index(
      "ContentCatalogItem_status_kind_created_idx"
    ).on(table.status, table.kind, table.createdAt),
    categorySubcategoryIdx: index(
      "ContentCatalogItem_category_subcategory_idx"
    ).on(table.categoryCode, table.subcategoryCode),
    additionalTagsCheck: check(
      "ContentCatalogItem_additional_tags_check",
      sql`cardinality(${table.additionalTagKeys}) <= 4 AND NOT ${table.primaryTagKey} = ANY(${table.additionalTagKeys})`
    ),
  })
);

export type ContentCatalogItem = InferSelectModel<typeof contentCatalogItem>;

export const taxonomyTagRecord = pgTable(
  "TaxonomyTagRecord",
  {
    key: varchar("key", { length: 500 }).primaryKey().notNull(),
    label: varchar("label", { length: 300 }).notNull(),
    categoryCode: varchar("categoryCode", { length: 10 }),
    subcategoryCode: varchar("subcategoryCode", { length: 10 }),
    taxonomyType: varchar("taxonomyType", { length: 300 }),
    origin: varchar("origin", { enum: ["SYSTEM_OVERRIDE", "CUSTOM"] })
      .notNull()
      .default("CUSTOM"),
    status: varchar("status", { enum: ["ACTIVE", "INACTIVE"] })
      .notNull()
      .default("ACTIVE"),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    pathIdx: index("TaxonomyTagRecord_path_idx").on(
      table.status,
      table.subcategoryCode,
      table.taxonomyType
    ),
  })
);

export const taxonomyTagProposal = pgTable(
  "TaxonomyTagProposal",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    label: varchar("label", { length: 300 }).notNull(),
    normalizedKey: varchar("normalizedKey", { length: 500 }).notNull(),
    categoryCode: varchar("categoryCode", { length: 10 }).notNull(),
    subcategoryCode: varchar("subcategoryCode", { length: 10 }).notNull(),
    taxonomyType: varchar("taxonomyType", { length: 300 }).notNull(),
    status: varchar("status", {
      enum: ["PENDING", "APPROVED", "REJECTED"],
    })
      .notNull()
      .default("PENDING"),
    reviewNote: varchar("reviewNote", { length: 1000 }),
    proposedById: uuid("proposedById").references(() => user.id, {
      onDelete: "set null",
    }),
    reviewedById: uuid("reviewedById").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    reviewedAt: timestamp("reviewedAt", { withTimezone: true }),
  },
  (table) => ({
    statusCreatedIdx: index("TaxonomyTagProposal_status_created_idx").on(
      table.status,
      table.createdAt
    ),
  })
);

export const contentUsage = pgTable(
  "ContentUsage",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    contentItemId: uuid("contentItemId")
      .notNull()
      .references(() => contentCatalogItem.id, { onDelete: "cascade" }),
    state: varchar("state", { enum: ["VIEWED", "STARTED", "COMPLETED"] })
      .notNull()
      .default("VIEWED"),
    firstUsedAt: timestamp("firstUsedAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastUsedAt: timestamp("lastUsedAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completedAt", { withTimezone: true }),
  },
  (table) => ({
    userContentUnique: uniqueIndex("ContentUsage_user_content_unique").on(
      table.userId,
      table.contentItemId
    ),
    userLastUsedIdx: index("ContentUsage_user_last_used_idx").on(
      table.userId,
      table.lastUsedAt
    ),
  })
);

export type ContentUsage = InferSelectModel<typeof contentUsage>;

/**
 * "Миний тэмдэглэл"-ийн хэрэглэгч тус бүрийн серверийн хадгалалт.
 * clientId нь хуучин localStorage тэмдэглэлийг idempotent import хийхэд
 * ашиглагдана; нэг хэрэглэгчийн нэг section дотор давхардахгүй.
 */
export const ebookNote = pgTable(
  "EbookNote",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    clientId: varchar("clientId", { length: 80 }).notNull(),
    sectionId: varchar("sectionId", { length: 40 }).notNull(),
    title: varchar("title", { length: 240 }).notNull(),
    content: text("content").notNull().default(""),
    includeInBook: boolean("includeInBook").notNull().default(true),
    templateId: varchar("templateId", { length: 48 })
      .notNull()
      .default("paper-white"),
    imageUrl: text("imageUrl").notNull().default(""),
    imageCaption: text("imageCaption").notNull().default(""),
    imageAspect: varchar("imageAspect", { length: 24 }).notNull().default(""),
    noteCreatedAt: timestamp("noteCreatedAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userSectionClientUnique: uniqueIndex(
      "EbookNote_userId_sectionId_clientId_unique"
    ).on(table.userId, table.sectionId, table.clientId),
    userSectionCreatedIdx: index(
      "EbookNote_userId_sectionId_noteCreatedAt_idx"
    ).on(table.userId, table.sectionId, table.noteCreatedAt),
  })
);

export type EbookNote = InferSelectModel<typeof ebookNote>;

// ✅ NEW: one row per QPay invoice issued for a subscription month.
export const subscriptionPayment = pgTable("SubscriptionPayment", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  // QPay's invoice id (returned from POST /v2/invoice).
  qpayInvoiceId: text("qpayInvoiceId"),
  // Our own idempotency key sent to QPay as sender_invoice_no.
  senderInvoiceNo: varchar("senderInvoiceNo", { length: 64 })
    .notNull()
    .unique(),
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

// Privacy-safe operational events used by the admin observability screen.
// Never store prompts, chat contents, image bytes, passwords, or provider
// payloads here; metadata must contain only bounded diagnostic fields.
export const appEventLog = pgTable(
  "AppEventLog",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    level: varchar("level", { enum: ["info", "warn", "error"] }).notNull(),
    event: varchar("event", { length: 96 }).notNull(),
    source: varchar("source", { length: 64 }).notNull(),
    route: varchar("route", { length: 160 }),
    requestId: varchar("requestId", { length: 64 }),
    userId: uuid("userId").references(() => user.id, {
      onDelete: "set null",
    }),
    chatId: uuid("chatId"),
    model: varchar("model", { length: 64 }),
    statusCode: integer("statusCode"),
    errorCode: varchar("errorCode", { length: 96 }),
    message: text("message"),
    inputTokens: integer("inputTokens"),
    cachedInputTokens: integer("cachedInputTokens"),
    cacheWriteTokens: integer("cacheWriteTokens"),
    outputTokens: integer("outputTokens"),
    reasoningTokens: integer("reasoningTokens"),
    totalTokens: integer("totalTokens"),
    historyCount: integer("historyCount"),
    imageCount: integer("imageCount"),
    durationMs: integer("durationMs"),
    metadata: jsonb("metadata"),
  },
  (table) => ({
    createdAtIdx: index("AppEventLog_createdAt_idx").on(table.createdAt),
    levelCreatedAtIdx: index("AppEventLog_level_createdAt_idx").on(
      table.level,
      table.createdAt
    ),
    userCreatedAtIdx: index("AppEventLog_userId_createdAt_idx").on(
      table.userId,
      table.createdAt
    ),
    eventCreatedAtIdx: index("AppEventLog_event_createdAt_idx").on(
      table.event,
      table.createdAt
    ),
  })
);

export type AppEventLog = InferSelectModel<typeof appEventLog>;

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

export const passwordResetToken = pgTable(
  "PasswordResetToken",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    tokenHash: varchar("tokenHash", { length: 64 }).notNull(),
    expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
    usedAt: timestamp("usedAt", { withTimezone: true }),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tokenHashUnique: uniqueIndex("PasswordResetToken_tokenHash_unique").on(
      table.tokenHash
    ),
    userCreatedAtIdx: index("PasswordResetToken_userId_createdAt_idx").on(
      table.userId,
      table.createdAt
    ),
  })
);

export type PasswordResetToken = InferSelectModel<typeof passwordResetToken>;

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
    senderRole: varchar("sender_role", {
      enum: ["client", "psychologist"],
    }).notNull(),
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
    senderRole: varchar("sender_role", {
      enum: ["patient", "psychologist"],
    }).notNull(),
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

/**
 * Админаас нийтэлдэг сургалтын тогтвортой identity. Нийтлэгдсэн контент нь
 * ProgramVersion дээр immutable snapshot хэлбэрээр хадгалагдана.
 */
export const program = pgTable(
  "Program",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    slug: varchar("slug", { length: 120 }).notNull(),
    status: varchar("status", {
      enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
    })
      .notNull()
      .default("DRAFT"),
    renderer: varchar("renderer", { enum: ["BUILDER", "LEGACY"] })
      .notNull()
      .default("BUILDER"),
    legacyKey: varchar("legacyKey", { length: 80 }),
    sortOrder: integer("sortOrder").notNull().default(0),
    catalogItemId: uuid("catalogItemId").references(
      () => contentCatalogItem.id,
      { onDelete: "set null" }
    ),
    createdById: uuid("createdById").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    slugUnique: uniqueIndex("Program_slug_unique").on(table.slug),
    catalogItemUnique: uniqueIndex("Program_catalogItemId_key").on(
      table.catalogItemId
    ),
    statusSortIdx: index("Program_status_sort_idx").on(
      table.status,
      table.sortOrder
    ),
  })
);

export type Program = InferSelectModel<typeof program>;

/** Draft-ийг засаж, publish хийх бүрд шинэ immutable version үүснэ. */
export const programVersion = pgTable(
  "ProgramVersion",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    programId: uuid("programId")
      .notNull()
      .references(() => program.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    status: varchar("status", {
      enum: ["DRAFT", "PUBLISHED", "RETIRED"],
    })
      .notNull()
      .default("DRAFT"),
    definition: jsonb("definition").notNull(),
    createdById: uuid("createdById").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    publishedAt: timestamp("publishedAt", { withTimezone: true }),
  },
  (table) => ({
    programVersionUnique: uniqueIndex(
      "ProgramVersion_program_version_unique"
    ).on(table.programId, table.version),
    programStatusVersionIdx: index(
      "ProgramVersion_program_status_version_idx"
    ).on(table.programId, table.status, table.version),
  })
);

export type ProgramVersion = InferSelectModel<typeof programVersion>;

/** Хэрэглэгчийн явц нь эхэлсэн үеийн ProgramVersion-доо үргэлж түгжигдэнэ. */
export const programRun = pgTable(
  "ProgramRun",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    programId: uuid("programId")
      .notNull()
      .references(() => program.id, { onDelete: "cascade" }),
    programVersionId: uuid("programVersionId")
      .notNull()
      .references(() => programVersion.id),
    status: varchar("status", {
      enum: ["IN_PROGRESS", "COMPLETED", "ABANDONED"],
    })
      .notNull()
      .default("IN_PROGRESS"),
    currentSectionId: varchar("currentSectionId", { length: 64 }).notNull(),
    responses: jsonb("responses").notNull().default({}),
    result: jsonb("result").notNull().default({}),
    startedAt: timestamp("startedAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completedAt", { withTimezone: true }),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userStatusUpdatedIdx: index("ProgramRun_user_status_updated_idx").on(
      table.userId,
      table.status,
      table.updatedAt
    ),
    userProgramUpdatedIdx: index("ProgramRun_user_program_updated_idx").on(
      table.userId,
      table.programId,
      table.updatedAt
    ),
  })
);

export type ProgramRun = InferSelectModel<typeof programRun>;

/** AI-аар тухайн хэрэглэгчид зориулж үүсгэсэн, зөвхөн өөрт нь харагдах тест. */
export const aiGeneratedTest = pgTable(
  "AIGeneratedTest",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
    title: varchar("title", { length: 240 }).notNull(),
    description: text("description").notNull().default(""),
    definition: json("definition").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userCreatedIdx: index("AIGeneratedTest_user_created_idx").on(
      table.userId,
      table.createdAt
    ),
  })
);

export type AIGeneratedTest = InferSelectModel<typeof aiGeneratedTest>;
