import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  type SQL,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import type { ArtifactKind } from "@/components/artifact";
import type { VisibilityType } from "@/components/visibility-selector";
import { ChatSDKError } from "../errors";
import { generateUUID } from "../utils";
import {
  type Chat,
  chat,
  type DBMessage,
  document,
  message,
  type Suggestion,
  stream,
  suggestion,
  type User,
  user,
  vote,
} from "./schema";
import { generateHashedPassword } from "./utils";

// ---------------- DB ----------------
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

// ---------------- helpers ----------------
function normalizeEmail(email: string) {
  return String(email ?? "").trim().toLowerCase();
}

// ---------------- users ----------------
export async function getUser(email: string): Promise<User[]> {
  try {
    const e = normalizeEmail(email);
    return await db.select().from(user).where(eq(user.email, e));
  } catch {
    throw new ChatSDKError("bad_request:database", "Failed to get user");
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);
  try {
    const e = normalizeEmail(email);
    return await db.insert(user).values({
      email: e,
      password: hashedPassword,
    });
  } catch {
    throw new ChatSDKError("bad_request:database", "Failed to create user");
  }
}

export async function getUserIdByEmail(email: string): Promise<string | null> {
  try {
    const e = normalizeEmail(email);
    const [row] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, e))
      .limit(1);
    return row?.id ?? null;
  } catch {
    throw new ChatSDKError("bad_request:database", "Failed to get user id");
  }
}

export async function ensureUserIdByEmail(email: string): Promise<string> {
  const e = normalizeEmail(email);
  const existingId = await getUserIdByEmail(e);
  if (existingId) return existingId;

  try {
    const password = generateHashedPassword(generateUUID());
    const [created] = await db
      .insert(user)
      .values({ email: e, password })
      .returning({ id: user.id });

    if (!created?.id) throw new Error("User insert failed");
    return created.id;
  } catch {
    throw new ChatSDKError("bad_request:database", "Failed to ensure user");
  }
}

// ---------------- chats ----------------
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

    const [deleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return deleted;
  } catch {
    throw new ChatSDKError("bad_request:database", "Failed to delete chat");
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

    const base = (cond?: SQL<any>) =>
      db
        .select()
        .from(chat)
        .where(cond ? and(cond, eq(chat.userId, id)) : eq(chat.userId, id))
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let rows: Chat[] = [];

    if (startingAfter) {
      const [ref] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);
      if (!ref) throw new Error("Chat not found");
      rows = await base(gt(chat.createdAt, ref.createdAt));
    } else if (endingBefore) {
      const [ref] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);
      if (!ref) throw new Error("Chat not found");
      rows = await base(lt(chat.createdAt, ref.createdAt));
    } else {
      rows = await base();
    }

    const hasMore = rows.length > limit;
    return { chats: hasMore ? rows.slice(0, limit) : rows, hasMore };
  } catch {
    throw new ChatSDKError("bad_request:database", "Failed to get chats");
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [row] = await db.select().from(chat).where(eq(chat.id, id));
    return row ?? null;
  } catch {
    throw new ChatSDKError("bad_request:database", "Failed to get chat");
  }
}

// ---------------- messages ----------------
export async function saveMessages({ messages }: { messages: DBMessage[] }) {
  try {
    return await db.insert(message).values(messages);
  } catch {
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
    throw new ChatSDKError("bad_request:database", "Failed to get messages");
  }
}

// ---------------- votes ----------------
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
    const [existing] = await db
      .select()
      .from(vote)
      .where(eq(vote.messageId, messageId));

    if (existing) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === "up" })
        .where(and(eq(vote.chatId, chatId), eq(vote.messageId, messageId)));
    }

    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === "up",
    });
  } catch {
    throw new ChatSDKError("bad_request:database", "Failed to vote");
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch {
    throw new ChatSDKError("bad_request:database", "Failed to get votes");
  }
}

// ---------------- documents ----------------
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
      .values({ id, title, kind, content, userId, createdAt: new Date() })
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
    throw new ChatSDKError("bad_request:database", "Failed to get documents");
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [row] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));
    return row;
  } catch {
    throw new ChatSDKError("bad_request:database", "Failed to get document");
  }
}

// ---------------- rate limits ----------------
export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: {
  id: string;
  differenceInHours: number;
}) {
  try {
    const since = new Date(Date.now() - differenceInHours * 60 * 60 * 1000);
    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, since),
          eq(message.role, "user")
        )
      )
      .execute();
    return stats?.count ?? 0;
  } catch {
    throw new ChatSDKError("bad_request:database", "Failed to count messages");
  }
}

// ---------------- streams ----------------
export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    await db.insert(stream).values({ id: streamId, chatId, createdAt: new Date() });
  } catch {
    throw new ChatSDKError("bad_request:database", "Failed to create stream");
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const rows = await db
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt))
      .execute();
    return rows.map((r) => r.id);
  } catch {
    throw new ChatSDKError("bad_request:database", "Failed to get streams");
  }
}
