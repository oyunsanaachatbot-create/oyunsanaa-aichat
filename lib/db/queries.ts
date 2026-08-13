import "server-only";

import crypto from "crypto";
import { compare } from "bcrypt-ts";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  isNull,
  isNotNull,
  lt,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import type { ArtifactKind } from "@/components/artifact";
import type { VisibilityType } from "@/components/visibility-selector";
import { ChatSDKError } from "../errors";
import { generateUUID } from "../utils";

import {
  appEventLog,
  type Chat,
  chat,
  type DBMessage,
  aiGeneratedTest,
  document,
  ebookNote,
  emailVerificationToken, // ✅ schema.ts дээр байх ёстой
  message,
  paymentTransactionLog,
  program,
  programRun,
  programVersion,
  type Suggestion,
  stream,
  subscriptionPayment,
  suggestion,
  type User,
  user,
  vote,
  whoAmIProgramRun,
} from "./schema";
import { extendPeriodEnd } from "../subscription/access";
import { generateHashedPassword } from "./utils";
import {
  type ProgramDefinition,
  type ProgramResponses,
  missingRequiredResponseKeys,
  programDefinitionSchema,
  responsesMatchDefinition,
  scoreProgram,
} from "../programs/definition";

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!, {
  ssl: false,
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  // Supabase transaction pooler (port 6543) prepared statement-ийг найдвартай дэмждэггүй
  prepare: false,
});

const db = drizzle(client);

export type EbookNotePayload = {
  clientId: string;
  title: string;
  content: string;
  includeInBook: boolean;
  templateId: string;
  imageUrl: string;
  imageCaption: string;
  imageAspect: string;
  noteCreatedAt: Date;
};

export function getEbookNotes({
  userId,
  sectionId,
}: {
  userId: string;
  sectionId?: string;
}) {
  const condition = sectionId
    ? and(eq(ebookNote.userId, userId), eq(ebookNote.sectionId, sectionId))
    : eq(ebookNote.userId, userId);

  return db
    .select()
    .from(ebookNote)
    .where(condition)
    .orderBy(desc(ebookNote.noteCreatedAt));
}

export function replaceEbookNotes({
  userId,
  sectionId,
  notes,
}: {
  userId: string;
  sectionId: string;
  notes: EbookNotePayload[];
}) {
  return db.transaction(async (tx) => {
    await tx
      .delete(ebookNote)
      .where(
        and(eq(ebookNote.userId, userId), eq(ebookNote.sectionId, sectionId))
      );

    if (notes.length === 0) return [];

    return tx
      .insert(ebookNote)
      .values(
        notes.map((note) => ({
          ...note,
          userId,
          sectionId,
          updatedAt: new Date(),
        }))
      )
      .returning();
  });
}

export type PublishedProgram = {
  id: string;
  slug: string;
  renderer: "BUILDER" | "LEGACY";
  legacyKey: string | null;
  sortOrder: number;
  versionId: string;
  version: number;
  definition: ProgramDefinition;
};

function toPublishedProgram(row: {
  id: string;
  slug: string;
  renderer: "BUILDER" | "LEGACY";
  legacyKey: string | null;
  sortOrder: number;
  versionId: string;
  version: number;
  definition: unknown;
}): PublishedProgram | null {
  const parsed = programDefinitionSchema.safeParse(row.definition);
  return parsed.success ? { ...row, definition: parsed.data } : null;
}

export async function getPublishedPrograms(
  contentType?: ProgramDefinition["contentType"]
): Promise<PublishedProgram[]> {
  const rows = await db
    .select({
      id: program.id,
      slug: program.slug,
      renderer: program.renderer,
      legacyKey: program.legacyKey,
      sortOrder: program.sortOrder,
      versionId: programVersion.id,
      version: programVersion.version,
      definition: programVersion.definition,
    })
    .from(program)
    .innerJoin(
      programVersion,
      and(
        eq(programVersion.programId, program.id),
        eq(programVersion.status, "PUBLISHED")
      )
    )
    .where(eq(program.status, "PUBLISHED"))
    .orderBy(asc(program.sortOrder), asc(program.createdAt));

  const published = rows
    .map((row) => toPublishedProgram(row))
    .filter((item): item is PublishedProgram => item !== null);
  return contentType
    ? published.filter((item) => item.definition.contentType === contentType)
    : published;
}

export async function getPublishedProgramBySlug(slug: string) {
  const [row] = await db
    .select({
      id: program.id,
      slug: program.slug,
      renderer: program.renderer,
      legacyKey: program.legacyKey,
      sortOrder: program.sortOrder,
      versionId: programVersion.id,
      version: programVersion.version,
      definition: programVersion.definition,
    })
    .from(program)
    .innerJoin(
      programVersion,
      and(
        eq(programVersion.programId, program.id),
        eq(programVersion.status, "PUBLISHED")
      )
    )
    .where(and(eq(program.slug, slug), eq(program.status, "PUBLISHED")))
    .limit(1);

  return row ? toPublishedProgram(row) : null;
}

export async function getProgramIdentityBySlug(slug: string) {
  const [row] = await db
    .select({
      id: program.id,
      renderer: program.renderer,
      status: program.status,
    })
    .from(program)
    .where(eq(program.slug, slug))
    .limit(1);
  return row ?? null;
}

export async function getActiveProgramRunBySlug({
  slug,
  userId,
}: {
  slug: string;
  userId: string;
}) {
  const [row] = await db
    .select({
      run: programRun,
      definition: programVersion.definition,
      version: programVersion.version,
    })
    .from(programRun)
    .innerJoin(program, eq(program.id, programRun.programId))
    .innerJoin(programVersion, eq(programVersion.id, programRun.programVersionId))
    .where(
      and(
        eq(program.slug, slug),
        eq(programRun.userId, userId),
        eq(programRun.status, "IN_PROGRESS")
      )
    )
    .limit(1);
  if (!row) return null;
  const parsed = programDefinitionSchema.safeParse(row.definition);
  return parsed.success
    ? { run: row.run, definition: parsed.data, version: row.version }
    : null;
}

export async function getOrCreateProgramRun({
  publishedProgram,
  userId,
}: {
  publishedProgram: PublishedProgram;
  userId: string;
}) {
  const [existing] = await db
    .select()
    .from(programRun)
    .where(
      and(
        eq(programRun.userId, userId),
        eq(programRun.programId, publishedProgram.id),
        eq(programRun.status, "IN_PROGRESS")
      )
    )
    .orderBy(desc(programRun.updatedAt))
    .limit(1);

  if (existing) {
    const [version] = await db
      .select()
      .from(programVersion)
      .where(eq(programVersion.id, existing.programVersionId))
      .limit(1);
    const parsed = version
      ? programDefinitionSchema.safeParse(version.definition)
      : null;
    if (version && parsed?.success) {
      return { run: existing, definition: parsed.data, version: version.version };
    }
    throw new Error("program_run_version_invalid");
  }

  const firstSectionId = publishedProgram.definition.sections[0]?.id;
  if (!firstSectionId) throw new Error("program_has_no_sections");

  const [created] = await db
    .insert(programRun)
    .values({
      userId,
      programId: publishedProgram.id,
      programVersionId: publishedProgram.versionId,
      currentSectionId: firstSectionId,
      responses: {},
      result: {},
    })
    .onConflictDoNothing()
    .returning();

  if (created) {
    return {
      run: created,
      definition: publishedProgram.definition,
      version: publishedProgram.version,
    };
  }

  const [concurrent] = await db
    .select()
    .from(programRun)
    .where(
      and(
        eq(programRun.userId, userId),
        eq(programRun.programId, publishedProgram.id),
        eq(programRun.status, "IN_PROGRESS")
      )
    )
    .limit(1);
  if (!concurrent) throw new Error("program_run_create_failed");
  return {
    run: concurrent,
    definition: publishedProgram.definition,
    version: publishedProgram.version,
  };
}

async function getOwnedProgramRunWithDefinition({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  const [row] = await db
    .select({
      run: programRun,
      definition: programVersion.definition,
    })
    .from(programRun)
    .innerJoin(programVersion, eq(programVersion.id, programRun.programVersionId))
    .where(and(eq(programRun.id, id), eq(programRun.userId, userId)))
    .limit(1);
  if (!row) return null;
  const parsed = programDefinitionSchema.safeParse(row.definition);
  return parsed.success ? { run: row.run, definition: parsed.data } : null;
}

export async function saveProgramRun({
  currentSectionId,
  id,
  programId,
  responses,
  userId,
}: {
  currentSectionId: string;
  id: string;
  programId: string;
  responses: ProgramResponses;
  userId: string;
}) {
  const owned = await getOwnedProgramRunWithDefinition({ id, userId });
  if (
    !owned ||
    owned.run.status !== "IN_PROGRESS" ||
    owned.run.programId !== programId
  ) {
    return null;
  }
  if (!responsesMatchDefinition(owned.definition, responses)) return null;
  if (!owned.definition.sections.some((section) => section.id === currentSectionId)) {
    return null;
  }

  const [updated] = await db
    .update(programRun)
    .set({ currentSectionId, responses, updatedAt: new Date() })
    .where(
      and(
        eq(programRun.id, id),
        eq(programRun.userId, userId),
        eq(programRun.status, "IN_PROGRESS")
      )
    )
    .returning();
  return updated ? { run: updated, definition: owned.definition } : null;
}

export async function completeProgramRun({
  id,
  programId,
  responses,
  userId,
}: {
  id: string;
  programId: string;
  responses: ProgramResponses;
  userId: string;
}) {
  const owned = await getOwnedProgramRunWithDefinition({ id, userId });
  if (owned?.run.status === "COMPLETED" && owned.run.programId === programId) {
    return {
      status: "COMPLETED" as const,
      run: owned.run,
      definition: owned.definition,
      result: owned.run.result,
    };
  }
  if (
    !owned ||
    owned.run.status !== "IN_PROGRESS" ||
    owned.run.programId !== programId
  ) {
    return null;
  }
  if (!responsesMatchDefinition(owned.definition, responses)) return null;
  const missing = missingRequiredResponseKeys(owned.definition, responses);
  if (missing.length > 0) {
    return { status: "MISSING" as const, missing };
  }
  const result = scoreProgram(owned.definition, responses);
  const lastSection = owned.definition.sections.at(-1);
  if (!lastSection) return null;

  const now = new Date();
  const [updated] = await db
    .update(programRun)
    .set({
      status: "COMPLETED",
      currentSectionId: lastSection.id,
      responses,
      result,
      completedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(programRun.id, id),
        eq(programRun.userId, userId),
        eq(programRun.status, "IN_PROGRESS")
      )
    )
    .returning();
  return updated
    ? {
        status: "COMPLETED" as const,
        run: updated,
        definition: owned.definition,
        result,
      }
    : null;
}

export async function getCompletedProgramRuns(userId: string) {
  const rows = await db
    .select({
      run: programRun,
      slug: program.slug,
      renderer: program.renderer,
      legacyKey: program.legacyKey,
      definition: programVersion.definition,
      version: programVersion.version,
    })
    .from(programRun)
    .innerJoin(program, eq(program.id, programRun.programId))
    .innerJoin(programVersion, eq(programVersion.id, programRun.programVersionId))
    .where(
      and(eq(programRun.userId, userId), eq(programRun.status, "COMPLETED"))
    )
    .orderBy(desc(programRun.completedAt))
    .limit(100);

  return rows.flatMap((row) => {
    const parsed = programDefinitionSchema.safeParse(row.definition);
    return parsed.success ? [{ ...row, definition: parsed.data }] : [];
  });
}

export async function getCompletedProgramRunById({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  const [row] = await db
    .select({
      run: programRun,
      slug: program.slug,
      definition: programVersion.definition,
      version: programVersion.version,
    })
    .from(programRun)
    .innerJoin(program, eq(program.id, programRun.programId))
    .innerJoin(programVersion, eq(programVersion.id, programRun.programVersionId))
    .where(
      and(
        eq(programRun.id, id),
        eq(programRun.userId, userId),
        eq(programRun.status, "COMPLETED")
      )
    )
    .limit(1);
  if (!row) return null;
  const parsed = programDefinitionSchema.safeParse(row.definition);
  return parsed.success ? { ...row, definition: parsed.data } : null;
}

export type WhoAmIProgramPayload = {
  screen: string;
  areaIdx: number;
  pct: Record<string, number>;
  notes: Record<string, string>;
  answers: Record<string, string>;
  scores: Record<string, number>;
  finalNote: string;
};

export async function getWhoAmIProgramRuns(userId: string) {
  const [draftRows, resultRows] = await Promise.all([
    db
      .select()
      .from(whoAmIProgramRun)
      .where(
        and(
          eq(whoAmIProgramRun.userId, userId),
          isNull(whoAmIProgramRun.completedAt)
        )
      )
      .orderBy(desc(whoAmIProgramRun.updatedAt))
      .limit(1),
    db
      .select()
      .from(whoAmIProgramRun)
      .where(
        and(
          eq(whoAmIProgramRun.userId, userId),
          isNotNull(whoAmIProgramRun.completedAt)
        )
      )
      .orderBy(desc(whoAmIProgramRun.completedAt))
      .limit(30),
  ]);

  return {
    draft: draftRows[0] ?? null,
    results: resultRows,
  };
}
export async function saveWhoAmIProgramDraft({
  id,
  payload,
  userId,
}: {
  id?: string;
  payload: WhoAmIProgramPayload;
  userId: string;
}) {
  const now = new Date();

  if (id) {
    const [updated] = await db
      .update(whoAmIProgramRun)
      .set({ ...payload, updatedAt: now })
      .where(
        and(
          eq(whoAmIProgramRun.id, id),
          eq(whoAmIProgramRun.userId, userId),
          isNull(whoAmIProgramRun.completedAt)
        )
      )
      .returning();
    if (updated) return updated;
  }

  const [existingDraft] = await db
    .select({ id: whoAmIProgramRun.id })
    .from(whoAmIProgramRun)
    .where(
      and(
        eq(whoAmIProgramRun.userId, userId),
        isNull(whoAmIProgramRun.completedAt)
      )
    )
    .orderBy(desc(whoAmIProgramRun.updatedAt))
    .limit(1);

  if (existingDraft) {
    const [updated] = await db
      .update(whoAmIProgramRun)
      .set({ ...payload, updatedAt: now })
      .where(
        and(
          eq(whoAmIProgramRun.id, existingDraft.id),
          eq(whoAmIProgramRun.userId, userId),
          isNull(whoAmIProgramRun.completedAt)
        )
      )
      .returning();
    if (updated) return updated;
  }

  const [created] = await db
    .insert(whoAmIProgramRun)
    .values({ ...payload, userId, updatedAt: now })
    .returning();
  return created;
}

export async function completeWhoAmIProgramRun({
  id,
  payload,
  userId,
}: {
  id?: string;
  payload: WhoAmIProgramPayload;
  userId: string;
}) {
  const now = new Date();

  if (id) {
    const [updated] = await db
      .update(whoAmIProgramRun)
      .set({ ...payload, completedAt: now, updatedAt: now })
      .where(
        and(eq(whoAmIProgramRun.id, id), eq(whoAmIProgramRun.userId, userId))
      )
      .returning();
    if (updated) return updated;
  }

  const [created] = await db
    .insert(whoAmIProgramRun)
    .values({ ...payload, userId, completedAt: now, updatedAt: now })
    .returning();
  return created;
}

export function getAIGeneratedTests(userId: string) {
  return db
    .select()
    .from(aiGeneratedTest)
    .where(eq(aiGeneratedTest.userId, userId))
    .orderBy(desc(aiGeneratedTest.createdAt))
    .limit(30);
}

export async function createAIGeneratedTest({
  userId,
  title,
  description,
  definition,
}: {
  userId: string;
  title: string;
  description: string;
  definition: Record<string, unknown>;
}) {
  const [created] = await db
    .insert(aiGeneratedTest)
    .values({ userId, title, description, definition })
    .returning();
  return created;
}


/* ---------------- helpers ---------------- */
function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

/* ---------------- users ---------------- */
export async function getUser(email: string): Promise<User[]> {
  const normalizedEmail = email.trim().toLowerCase();
  try {
    return await db
      .select()
      .from(user)
      .where(eq(user.email, normalizedEmail));
  } catch {
    throw new ChatSDKError("bad_request:database", "Failed to get user by email");
  }
}

export async function getUserRoleById(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  return row?.role ?? null;
}

export async function insertAppEvent(
  values: typeof appEventLog.$inferInsert
): Promise<void> {
  await db.insert(appEventLog).values(values);
}

export type AppEventFilters = {
  level?: "info" | "warn" | "error";
  source?: string;
  model?: string;
  userId?: string;
  userSearch?: string;
  since?: Date;
  limit?: number;
};

function appEventConditions(filters: AppEventFilters): SQL[] {
  const conditions: SQL[] = [];
  if (filters.level) conditions.push(eq(appEventLog.level, filters.level));
  if (filters.source) conditions.push(eq(appEventLog.source, filters.source));
  if (filters.model) conditions.push(eq(appEventLog.model, filters.model));
  if (filters.userId) conditions.push(eq(appEventLog.userId, filters.userId));
  if (filters.userSearch) {
    const pattern = `%${filters.userSearch}%`;
    const userCondition = or(ilike(user.name, pattern), ilike(user.email, pattern));
    if (userCondition) conditions.push(userCondition);
  }
  if (filters.since) conditions.push(gte(appEventLog.createdAt, filters.since));
  return conditions;
}

export async function getAppEvents(filters: AppEventFilters = {}) {
  const conditions = appEventConditions(filters);
  return await db
    .select({
      log: appEventLog,
      userName: user.name,
      userEmail: user.email,
    })
    .from(appEventLog)
    .leftJoin(user, eq(appEventLog.userId, user.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(appEventLog.createdAt))
    .limit(Math.min(Math.max(filters.limit ?? 100, 1), 250));
}

export async function getAppEventSummary(since: Date) {
  const [row] = await db
    .select({
      eventCount: count(),
      errorCount: sql<number>`count(*) filter (where ${appEventLog.level} = 'error')`,
      inputTokens: sql<number>`coalesce(sum(${appEventLog.inputTokens}), 0)`,
      cachedInputTokens: sql<number>`coalesce(sum(${appEventLog.cachedInputTokens}), 0)`,
      outputTokens: sql<number>`coalesce(sum(${appEventLog.outputTokens}), 0)`,
      totalTokens: sql<number>`coalesce(sum(${appEventLog.totalTokens}), 0)`,
    })
    .from(appEventLog)
    .where(gte(appEventLog.createdAt, since));
  return row;
}

export async function getAppEventFilterOptions() {
  const [sources, models] = await Promise.all([
    db
      .selectDistinct({ value: appEventLog.source })
      .from(appEventLog)
      .orderBy(asc(appEventLog.source)),
    db
      .selectDistinct({ value: appEventLog.model })
      .from(appEventLog)
      .where(isNotNull(appEventLog.model))
      .orderBy(asc(appEventLog.model)),
  ]);
  return {
    sources: sources.map((item) => item.value),
    models: models
      .map((item) => item.value)
      .filter((value): value is string => value !== null),
  };
}

export async function createUser(email: string, password: string, name: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name.trim();
  const hashedPassword = generateHashedPassword(password);

  try {
    return await db
      .insert(user)
      .values({
        email: normalizedEmail,
        name: normalizedName,
        password: hashedPassword,
      });
  } catch {
    throw new ChatSDKError("bad_request:database", "Failed to create user");
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    return await db.insert(user).values({ email, password }).returning({
      id: user.id,
      email: user.email,
    });
  } catch {
    throw new ChatSDKError("bad_request:database", "Failed to create guest user");
  }
}

export async function getUserIdByEmail(email: string): Promise<string | null> {
  const normalizedEmail = email.trim().toLowerCase();
  try {
    const [row] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, normalizedEmail))
      .limit(1);

    return row?.id ?? null;
  } catch {
    throw new ChatSDKError("bad_request:database", "Failed to get user id by email");
  }
}

export async function ensureUserIdByEmail(
  email: string,
  profileName?: string | null
): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = profileName?.trim() || null;
  const existingId = await getUserIdByEmail(normalizedEmail);
  if (existingId) {
    if (normalizedName) {
      await db
        .update(user)
        .set({ name: normalizedName })
        .where(
          and(
            eq(user.id, existingId),
            sql`(${user.name} IS NULL OR btrim(${user.name}) = '')`
          )
        );
    }
    return existingId;
  }

  try {
    const password = generateHashedPassword(generateUUID());

    const [created] = await db
      .insert(user)
      .values({ email: normalizedEmail, name: normalizedName, password })
      .returning({ id: user.id });

    if (!created?.id) throw new Error("User insert failed");
    return created.id;
  } catch (e: any) {
    // Concurrent requests can race on the canonical User.email UNIQUE
    // constraint. Recover by re-reading the row the other request created
    // instead of failing the whole request.
    if (e?.code === "23505") {
      const raced = await getUserIdByEmail(normalizedEmail);
      if (raced) return raced;
    }

    console.error("DB ensureUserIdByEmail failed:", {
      email: normalizedEmail,
      message: e?.message,
      code: e?.code,
      detail: e?.detail,
      hint: e?.hint,
      constraint: e?.constraint,
      stack: e?.stack,
    });
    throw new ChatSDKError("bad_request:database", "Failed to ensure user by email");
  }
}

export async function markUserEmailVerified(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  await db
    .update(user)
    .set({ emailVerifiedAt: new Date() })
    .where(
      and(
        eq(user.email, normalizedEmail),
        isNull(user.emailVerifiedAt)
      )
    );
}

const EMAIL_OTP_TTL_MS = 10 * 60 * 1000;
const EMAIL_OTP_COOLDOWN_MS = 60 * 1000;
const EMAIL_OTP_MAX_ATTEMPTS = 5;

export type IssueEmailOtpResult =
  | { status: "issued"; code: string }
  | { status: "already_verified" | "user_not_found" }
  | { status: "cooldown"; retryAfterSeconds: number };

/** Create one active, rate-limited six-digit email OTP for a shared user. */
export async function issueEmailVerificationOtp(
  email: string
): Promise<IssueEmailOtpResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const [target] = await db
    .select({
      emailVerifiedAt: user.emailVerifiedAt,
    })
    .from(user)
    .where(eq(user.email, normalizedEmail))
    .limit(1);

  if (!target) return { status: "user_not_found" };
  if (target.emailVerifiedAt) return { status: "already_verified" };

  const [current] = await db
    .select()
    .from(emailVerificationToken)
    .where(eq(emailVerificationToken.email, normalizedEmail))
    .limit(1);

  if (current) {
    const elapsed = Date.now() - current.createdAt.getTime();
    if (elapsed < EMAIL_OTP_COOLDOWN_MS) {
      return {
        status: "cooldown",
        retryAfterSeconds: Math.ceil(
          (EMAIL_OTP_COOLDOWN_MS - elapsed) / 1000
        ),
      };
    }
  }

  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  const tokenHash = generateHashedPassword(code);
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .delete(emailVerificationToken)
      .where(eq(emailVerificationToken.email, normalizedEmail));
    await tx.insert(emailVerificationToken).values({
      email: normalizedEmail,
      tokenHash,
      attempts: 0,
      createdAt: now,
      expiresAt: new Date(now.getTime() + EMAIL_OTP_TTL_MS),
    });
  });

  return { status: "issued", code };
}

export type VerifyEmailOtpResult =
  | { status: "verified" | "already_verified" }
  | { status: "invalid" | "expired" | "locked" | "user_not_found" };

/** Verify and consume an email OTP. Success updates the shared User row. */
export async function verifyEmailByOtp(
  email: string,
  code: string
): Promise<VerifyEmailOtpResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const [target] = await db
    .select({ emailVerifiedAt: user.emailVerifiedAt })
    .from(user)
    .where(eq(user.email, normalizedEmail))
    .limit(1);

  if (!target) return { status: "user_not_found" };
  if (target.emailVerifiedAt) return { status: "already_verified" };

  const [current] = await db
    .select()
    .from(emailVerificationToken)
    .where(eq(emailVerificationToken.email, normalizedEmail))
    .limit(1);

  if (!current || current.expiresAt.getTime() <= Date.now()) {
    return { status: "expired" };
  }
  if (current.attempts >= EMAIL_OTP_MAX_ATTEMPTS) {
    return { status: "locked" };
  }

  const valid = await compare(code, current.tokenHash);
  if (!valid) {
    await db
      .update(emailVerificationToken)
      .set({
        attempts: sql`${emailVerificationToken.attempts} + 1`,
      })
      .where(eq(emailVerificationToken.id, current.id));
    return {
      status:
        current.attempts + 1 >= EMAIL_OTP_MAX_ATTEMPTS ? "locked" : "invalid",
    };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(user)
      .set({ emailVerifiedAt: new Date() })
      .where(eq(user.email, normalizedEmail));
    await tx
      .delete(emailVerificationToken)
      .where(eq(emailVerificationToken.email, normalizedEmail));
  });

  return { status: "verified" };
}
/* ---------------- email verification ---------------- */
export async function createEmailVerification(email: string) {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = sha256(token);

    await db.transaction(async (tx) => {
      await tx
        .delete(emailVerificationToken)
        .where(eq(emailVerificationToken.email, normalizedEmail));
      await tx.insert(emailVerificationToken).values({
        email: normalizedEmail,
        tokenHash,
        attempts: 0,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 30), // 30 минут
      });
    });

    return { token };
  } catch {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create email verification token"
    );
  }
}

export async function verifyEmailByToken(token: string) {
  try {
    const tokenHash = sha256(token);

    const [row] = await db
      .select()
      .from(emailVerificationToken)
      .where(
        and(
          eq(emailVerificationToken.tokenHash, tokenHash),
          gt(emailVerificationToken.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!row) return { ok: false as const };

    // ✅ user.emailVerifiedAt schema.ts дээр байх ёстой
    await db
      .update(user)
      .set({ emailVerifiedAt: new Date() })
      .where(eq(user.email, row.email));

    await db
      .delete(emailVerificationToken)
      .where(eq(emailVerificationToken.id, row.id));

    return { ok: true as const };
  } catch {
    throw new ChatSDKError("bad_request:database", "Failed to verify email by token");
  }
}

/* ---------------- chats ---------------- */
export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      visibility,
    });
  } catch {
    throw new ChatSDKError("bad_request:database", "Failed to save chat");
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));
    await db.delete(stream).where(eq(stream.chatId, id));

    const [chatsDeleted] = await db.delete(chat).where(eq(chat.id, id)).returning();
    return chatsDeleted;
  } catch {
    throw new ChatSDKError("bad_request:database", "Failed to delete chat by id");
  }
}

// ✅ Энэ нь build error дээр чинь 1:1 шаардлагатай байсан
export async function deleteAllChatsByUserId({ userId }: { userId: string }) {
  try {
    const userChats = await db
      .select({ id: chat.id })
      .from(chat)
      .where(eq(chat.userId, userId));

    if (userChats.length === 0) return { deletedCount: 0 };

    const chatIds = userChats.map((c) => c.id);

    await db.delete(vote).where(inArray(vote.chatId, chatIds));
    await db.delete(message).where(inArray(message.chatId, chatIds));
    await db.delete(stream).where(inArray(stream.chatId, chatIds));

    const deletedChats = await db
      .delete(chat)
      .where(eq(chat.userId, userId))
      .returning();

    return { deletedCount: deletedChats.length };
  } catch {
    throw new ChatSDKError("bad_request:database", "Failed to delete all chats by user id");
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<any>) =>
      db
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, id))
            : eq(chat.userId, id)
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Chat[] = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError("not_found:database", `Chat with id ${startingAfter} not found`);
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError("not_found:database", `Chat with id ${endingBefore} not found`);
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch {
    throw new ChatSDKError("bad_request:database", "Failed to get chats by user id");
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat ?? null;
  } catch {
    throw new ChatSDKError("bad_request:database", "Failed to get chat by id");
  }
}

/* ---------------- messages ---------------- */
export async function saveMessages({ messages }: { messages: DBMessage[] }) {
  try {
    return await db.insert(message).values(messages);
  } catch (e: any) {
    console.error("DB saveMessages failed:", {
      message: e?.message,
      code: e?.code,
      detail: e?.detail,
      hint: e?.hint,
      constraint: e?.constraint,
      stack: e?.stack,
    });
    throw new ChatSDKError("bad_request:database", "Failed to save messages");
  }
}


export async function updateMessage({
  id,
  parts,
}: {
  id: string;
  parts: DBMessage["parts"];
}) {
  try {
    return await db.update(message).set({ parts }).where(eq(message.id, id));
  } catch {
    throw new ChatSDKError("bad_request:database", "Failed to update message");
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch {
    throw new ChatSDKError("bad_request:database", "Failed to get messages by chat id");
  }
}

// ✅ Build error дээр чинь “getMessageById doesn’t exist” гэж байсан
export async function getMessageById({ id }: { id: string }) {
  try {
    const [row] = await db.select().from(message).where(eq(message.id, id)).limit(1);
    return row ?? null;
  } catch {
    throw new ChatSDKError("bad_request:database", "Failed to get message by id");
  }
}

// ✅ Build error дээр чинь “deleteMessagesByChatIdAfterTimestamp doesn’t exist” гэж байсан
export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)));

    const messageIds = messagesToDelete.map((m) => m.id);

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)));

      return await db
        .delete(message)
        .where(and(eq(message.chatId, chatId), inArray(message.id, messageIds)));
    }

    return;
  } catch {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete messages by chat id after timestamp"
    );
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: "up" | "down";
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.chatId, chatId), eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === "up" })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }

    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === "up",
    });
  } catch {
    throw new ChatSDKError("bad_request:database", "Failed to vote message");
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch {
    throw new ChatSDKError("bad_request:database", "Failed to get votes by chat id");
  }
}

/* ---------------- documents ---------------- */
export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date(),
      })
      .returning();
  } catch {
    throw new ChatSDKError("bad_request:database", "Failed to save document");
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));
  } catch {
    throw new ChatSDKError("bad_request:database", "Failed to get documents by id");
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt))
      .limit(1);

    return selectedDocument ?? null;
  } catch {
    throw new ChatSDKError("bad_request:database", "Failed to get document by id");
  }
}

// ✅ Build error дээр чинь “deleteDocumentsByIdAfterTimestamp doesn’t exist” гэж байсан
export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(eq(suggestion.documentId, id), gt(suggestion.documentCreatedAt, timestamp))
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete documents by id after timestamp"
    );
  }
}

export async function saveSuggestions({ suggestions }: { suggestions: Suggestion[] }) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch {
    throw new ChatSDKError("bad_request:database", "Failed to save suggestions");
  }
}

export async function getSuggestionsByDocumentId({ documentId }: { documentId: string }) {
  try {
    return await db.select().from(suggestion).where(eq(suggestion.documentId, documentId));
  } catch {
    throw new ChatSDKError("bad_request:database", "Failed to get suggestions by document id");
  }
}

/* ---------------- chat updates ---------------- */
export async function updateChatVisibilityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: "private" | "public";
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch {
    throw new ChatSDKError("bad_request:database", "Failed to update chat visibility by id");
  }
}

export async function updateChatTitleById({
  chatId,
  title,
}: {
  chatId: string;
  title: string;
}) {
  try {
    return await db.update(chat).set({ title }).where(eq(chat.id, chatId));
  } catch (error) {
    console.warn("Failed to update title for chat", chatId, error);
    return;
  }
}

/* ---------------- rate limits ---------------- */
export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: {
  id: string;
  differenceInHours: number;
}) {
  try {
    const from = new Date(Date.now() - differenceInHours * 60 * 60 * 1000);

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(and(eq(chat.userId, id), gte(message.createdAt, from), eq(message.role, "user")))
      .execute();

    return stats?.count ?? 0;
  } catch {
    throw new ChatSDKError("bad_request:database", "Failed to get message count by user id");
  }
}

/* ---------------- streams ---------------- */
export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    await db.insert(stream).values({ id: streamId, chatId, createdAt: new Date() });
  } catch (error) {
    // Surface the real DB error — "Failed to create stream id" alone is undebuggable.
    const { logger, serializeError } = await import("@/lib/logger");
    await logger.error("create_stream_id_failed", {
      chatId,
      error: serializeError(error),
    });
    throw new ChatSDKError("bad_request:database", "Failed to create stream id");
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streamIds = await db
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt))
      .execute();

    return streamIds.map(({ id }) => id);
  } catch {
    throw new ChatSDKError("bad_request:database", "Failed to get stream ids by chat id");
  }
}

/* ---------------- subscription / free trial ---------------- */

/** Read the subscription-relevant fields of a user. */
export async function getUserSubscription(userId: string) {
  try {
    const [row] = await db
      .select({
        trialStartedAt: user.trialStartedAt,
        subscriptionStatus: user.subscriptionStatus,
        currentPeriodEnd: user.currentPeriodEnd,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return row ?? null;
  } catch {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get user subscription"
    );
  }
}

/** Persist a freshly-created QPay invoice as a pending payment row. */
export async function createPaymentInvoice({
  userId,
  senderInvoiceNo,
  qpayInvoiceId,
  amount,
  currency,
}: {
  userId: string;
  senderInvoiceNo: string;
  qpayInvoiceId: string;
  amount: number;
  currency: string;
}) {
  try {
    const [row] = await db
      .insert(subscriptionPayment)
      .values({ userId, senderInvoiceNo, qpayInvoiceId, amount, currency })
      .returning();
    return row;
  } catch {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create payment invoice"
    );
  }
}

export async function getPaymentBySenderInvoiceNo(senderInvoiceNo: string) {
  try {
    const [row] = await db
      .select()
      .from(subscriptionPayment)
      .where(eq(subscriptionPayment.senderInvoiceNo, senderInvoiceNo))
      .limit(1);
    return row ?? null;
  } catch {
    throw new ChatSDKError("bad_request:database", "Failed to get payment");
  }
}

/**
 * Close a user's pending subscription invoice after QPay has cancelled it.
 * The database uses the existing terminal "failed" state for user-cancelled
 * invoices, so this requires no schema or migration change.
 */
export async function markPaymentInvoiceCancelled(
  senderInvoiceNo: string,
  userId: string
): Promise<boolean> {
  try {
    const [cancelled] = await db
      .update(subscriptionPayment)
      .set({ status: "failed" })
      .where(
        and(
          eq(subscriptionPayment.senderInvoiceNo, senderInvoiceNo),
          eq(subscriptionPayment.userId, userId),
          eq(subscriptionPayment.status, "pending")
        )
      )
      .returning({ id: subscriptionPayment.id });
    return Boolean(cancelled);
  } catch {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to cancel payment invoice"
    );
  }
}

/**
 * Mark a pending payment as paid and extend the user's subscription by one
 * period. Idempotent: a payment already in "paid" state is a no-op, so QPay
 * delivering the callback twice (or callback + polling racing) is safe.
 *
 * Returns the new currentPeriodEnd, or null if the payment was not found.
 */
export async function markPaymentPaidAndExtend(
  senderInvoiceNo: string
): Promise<Date | null> {
  try {
    return await db.transaction(async (tx) => {
      const [payment] = await tx
        .select()
        .from(subscriptionPayment)
        .where(eq(subscriptionPayment.senderInvoiceNo, senderInvoiceNo))
        .limit(1);

      if (!payment) return null;

      // Already processed — return the user's current end without re-extending.
      if (payment.status === "paid") {
        const [settledUser] = await tx
          .select({ currentPeriodEnd: user.currentPeriodEnd })
          .from(user)
          .where(eq(user.id, payment.userId))
          .limit(1);
        return settledUser?.currentPeriodEnd ?? null;
      }

      const now = new Date();
      // Claim this payment atomically. A provider callback and browser poll can
      // arrive together; only the winner may extend the subscription period.
      const [claimed] = await tx
        .update(subscriptionPayment)
        .set({ status: "paid", paidAt: now })
        .where(
          and(
            eq(subscriptionPayment.id, payment.id),
            eq(subscriptionPayment.status, "pending")
          )
        )
        .returning({ id: subscriptionPayment.id });

      if (!claimed) {
        const [concurrentUser] = await tx
          .select({ currentPeriodEnd: user.currentPeriodEnd })
          .from(user)
          .where(eq(user.id, payment.userId))
          .limit(1);
        return concurrentUser?.currentPeriodEnd ?? null;
      }

      const [u] = await tx
        .select({ currentPeriodEnd: user.currentPeriodEnd })
        .from(user)
        .where(eq(user.id, payment.userId))
        .limit(1);

      const newEnd = extendPeriodEnd(u?.currentPeriodEnd ?? null, now);

      await tx
        .update(user)
        .set({ currentPeriodEnd: newEnd, subscriptionStatus: "active" })
        .where(eq(user.id, payment.userId));

      return newEnd;
    });
  } catch {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to mark payment paid"
    );
  }
}

export type PaymentLogEvent =
  | "invoice_created"
  | "callback_received"
  | "verify_requested"
  | "qpay_check"
  | "payment_confirmed"
  | "payment_cancelled"
  | "error";

export type PaymentLogSource = "invoice" | "callback" | "verify" | "cancel";

/**
 * Append a row to the payment audit trail. Best-effort: an audit failure must
 * never break the actual payment flow, so errors are logged and swallowed.
 */
export async function logPaymentTransaction(entry: {
  event: PaymentLogEvent;
  source: PaymentLogSource;
  userId?: string | null;
  senderInvoiceNo?: string | null;
  qpayInvoiceId?: string | null;
  amount?: number | null;
  currency?: string | null;
  ip?: string | null;
  message?: string | null;
  raw?: unknown;
}): Promise<void> {
  try {
    await db.insert(paymentTransactionLog).values({
      event: entry.event,
      source: entry.source,
      userId: entry.userId ?? null,
      senderInvoiceNo: entry.senderInvoiceNo ?? null,
      qpayInvoiceId: entry.qpayInvoiceId ?? null,
      amount: entry.amount ?? null,
      currency: entry.currency ?? null,
      ip: entry.ip ?? null,
      message: entry.message ?? null,
      raw: entry.raw ?? null,
    });
  } catch (error) {
    console.error("Failed to write payment transaction log:", error);
  }
}
