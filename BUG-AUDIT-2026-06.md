# Bug Audit — 2026-06

Full-project review of `oyunsanaa-aichat` (Next.js 16 + Drizzle/Postgres + Supabase-compat
layer + Vercel AI SDK v6 + NextAuth v5). This document lists concrete, verified bugs, marks
which were **fixed in code** in this pass, and which require a **DB migration / manual step**
(intentionally not auto-applied because they can break the deploy build or need data cleanup).

---

## ✅ Fixed in this pass

### 1. Login loop on the HTTPS server (secure-cookie name mismatch) — `proxy.ts`
NextAuth v5 derives the session-cookie name purely from `AUTH_URL`'s protocol
(`https` → `__Secure-authjs.session-token`, `http` → `authjs.session-token`), because
`reqWithEnvURL` rewrites every `/api/auth/*` request origin to `AUTH_URL`. The proxy was
deciding which cookie to *read* from `x-forwarded-proto` instead. When those disagree
(e.g. a stray `.env.local` on the server with `AUTH_URL=http://localhost:3000` while nginx
sends `x-forwarded-proto: https`), `getToken` looks for the wrong cookie name, finds nothing,
and redirects back to `/login` forever — a silent loop with no error toast.

**Fix:** `proxy.ts` now derives `isHttps` from `AUTH_URL` first (the same source of truth as
NextAuth), falling back to `x-forwarded-proto` only when `AUTH_URL` is unset.

> Server-side follow-ups: ensure no `.env.local` overrides `AUTH_URL` on the server, and
> replace the `ssl-cert-snakeoil` self-signed cert with a real one (Let's Encrypt) — browsers
> can refuse to persist `__Secure-`/`__Host-` cookies on an untrusted TLS connection.

### 2. Finance intent scanned the entire chat history — `app/(chat)/api/chat/route.ts`
`allUserText` joined the text of **all** past user messages. Once any message in a chat ever
contained `санхүү` / `баримт` / etc., **every** subsequent reply in that conversation switched
to `financePrompt` and discarded the mental-health system prompt permanently.

**Fix:** intent is now detected from the **latest user turn only** (the incoming `message`,
or the last user message in a tool-approval flow).

### 3. Receipt-image detection was dead code — `app/(chat)/api/chat/route.ts`
`hasReceiptImage` checked `part.type === "image"`, but attachments are sent as
`{ type: "file", mediaType: "image/..." }` (see `components/multimodal-input.tsx:162`). The
condition was **always false**, so image-only receipts never triggered finance mode.

**Fix:** now checks `part.type === "file" && mediaType.startsWith("image/")`.

### 4. `voteMessage` existence check ignored `chatId` — `lib/db/queries.ts`
The existence `SELECT` filtered only by `messageId` while the `UPDATE` filtered by both
`chatId` and `messageId`. With the composite PK `(chatId, messageId)` this was latently
inconsistent.

**Fix:** the existence check now filters by `chatId` **and** `messageId`, matching the update.

### 5. `ensureUserIdByEmail` race condition — `lib/db/queries.ts`
Check-then-insert with no concurrency handling. Two near-simultaneous requests (e.g. duplicate
tabs) could both insert. Previously a unique-violation would surface as a hard
`bad_request:database` error to the user.

**Fix:** on Postgres unique-violation (`23505`) it now re-reads the row the racing request
created and returns it instead of failing. This becomes fully correct once the unique index
in item A below is added.

---

## ⚠️ Requires a DB migration / manual step (NOT auto-applied)

> These are intentionally left for a deliberate migration. `npm run build` runs
> `tsx lib/db/migrate` on deploy, so a migration that fails (e.g. adding a UNIQUE constraint
> while duplicate rows exist) would **break the deploy**. Apply these with care.

### A. Missing `UNIQUE` constraint on `User.email` — `lib/db/schema.ts:16`
`getUser()` returns an array and `ensureUserIdByEmail` can theoretically see two rows precisely
because there is no unique constraint. Recommended steps:
1. De-dupe first:
   ```sql
   -- find dups
   SELECT email, count(*) FROM "User" GROUP BY email HAVING count(*) > 1;
   ```
   Merge/remove duplicates (and their child rows) before step 2.
2. Add `.unique()` to the `email` column and generate a Drizzle migration
   (`CREATE UNIQUE INDEX`), then deploy.

### B. `Document.kind` column is literally named `"text"` — `lib/db/schema.ts:125`
```ts
kind: varchar("text", { enum: ["text","code","image","sheet"] })
```
Drizzle queries by JS property name so it works, but the SQL column is confusingly named
`text`. Renaming requires `ALTER TABLE "Document" RENAME COLUMN "text" TO "kind"` plus the
schema change in the same migration. **Do not** change the schema string alone — that would
make Drizzle query a non-existent `kind` column and break inserts/reads.

### C. No indexes on hot columns — `lib/db/schema.ts`
Heavily queried, currently unindexed: `Message_v2.chatId` (every chat load),
`Chat.userId` (history sidebar), `Message_v2.createdAt` + `role` (rate-limit join).
Add via migration:
```ts
index("message_v2_chatId_idx").on(message.chatId)
index("chat_userId_idx").on(chat.userId)
index("message_v2_createdAt_idx").on(message.createdAt)
```

---

## 📋 Documented (lower priority / by-design / needs product decision)

1. **`deleteChatById` is not transactional** (`queries.ts`) — deletes votes → messages →
   streams → chat as four statements. A crash mid-way leaves orphaned/partial data. Wrap in
   `db.transaction()`. (`deleteAllChatsByUserId` and
   `deleteMessagesByChatIdAfterTimestamp` have the same shape.)

2. **`getMessagesByChatId` is unbounded** (`queries.ts`) — all messages for a chat are loaded
   and sent to the model. For long chats this is slow/expensive. Cap to the last N (e.g. 50)
   for the LLM path while keeping full history for display, or paginate.

3. **Rate-limit off-by-one** (`route.ts`) — `if (messageCount > limits.maxMessagesPerDay)`
   allows `maxMessagesPerDay + 1` user messages per 24h. Use `>=` if the limit must be exact.
   Left as-is to avoid silently tightening the product limit.

4. **KB slug lookup does up to 3 sequential queries** (`route.ts` `getKbArticleBySlug`) —
   exact → strip leading `/` → add leading `/`. Normalize slugs at write time or use a single
   `WHERE slug IN (...)` query to cut two network round-trips per chat request.

5. **`getSql()` / `queries.ts` pool size `max: 10`** — fine on the current single PM2 server.
   Only revisit (`max: 1` + external pooler) if this ever moves to serverless, where each
   invocation would open its own pool.

6. **Dead guest rate-limit block** (`route.ts` lines under `if (isGuest && …)`) — `isGuest` is
   hard-coded `false` since guest access was removed, so the cookie-based limiter never runs.
   Harmless but dead code; safe to delete for clarity.

7. **All-beta dependencies in production** — `next-auth@5.0.0-beta.25`, `ai@6.0.0-beta.*`,
   `@ai-sdk/react@3.0.0-beta.*`. Pin to stable releases when available; beta minors have shipped
   breaking auth/session changes before.

---

_Fixes in this pass touched only: `proxy.ts`, `app/(chat)/api/chat/route.ts`, `lib/db/queries.ts`.
Pre-existing biome style lint warnings and the `lib/ai/models.test.ts` mock type errors are
unrelated and not part of `next build`._
