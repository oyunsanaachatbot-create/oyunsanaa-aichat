# Bug Audit — 2026-06

Full-project review of `oyunsanaa-aichat` (Next.js 16 + Drizzle/Postgres + Supabase-compat
layer + Vercel AI SDK v6 + NextAuth v5). This document lists concrete, verified bugs, marks
which were **fixed in code** in this pass, and which require a **DB migration / manual step**
(intentionally not auto-applied because they can break the deploy build or need data cleanup).

> **Second pass (2026-06-18)** added items 6–7 under "Fixed" and a new section
> "Second-pass findings" below.

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

### 6. `document` DELETE crashed (500) on a missing id — `app/(chat)/api/document/route.ts`
The `GET` handler guards `if (!document) return not_found`, but `DELETE` destructured
`const [document] = documents` and immediately read `document.userId`. For an id with no rows
that is `undefined.userId` → `TypeError` → unhandled 500 instead of a clean `not_found`.

**Fix:** added the same `if (!document)` guard before the ownership check.

### 7. Register stranded new users / risked the login loop — `app/(auth)/register/page.tsx`
On success the page did `router.replace("/")` + `router.refresh()` — the **exact** soft-navigation
pattern that `login/page.tsx` was deliberately moved away from because it loops/sticks against
the proxy with a freshly set session cookie.

**Fix:** register now does a hard `window.location.assign("/")` (same as login), and the now-unused
`useRouter` was removed.

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

## 🔎 Second-pass findings (2026-06-18) — not yet fixed

8. **`finance/transactions` POST has no input validation** (`app/api/finance/transactions/route.ts`).
   Client rows are spread straight into the insert: `rows.map(r => ({ ...r, user_id }))`. Column
   names are sanitized by `pgClient.ident()` and values are parameterized (no SQL injection, and
   `user_id` is force-overwritten), but a client can still set arbitrary columns it shouldn't
   (e.g. `id`, `created_at`). Also the multi-row path builds columns from `rows[0]` only — if later
   rows have different keys, those columns are silently dropped/nulled. Add a Zod schema + an
   explicit column allow-list.

9. **`document` POST returns `not_found:document` for an unauthenticated user**
   (`app/(chat)/api/document/route.ts` POST) — should be `unauthorized:document` like the other
   handlers. Cosmetic/incorrect status only.

10. **`chat` DELETE returns `forbidden` for a non-existent chat** (`app/(chat)/api/chat/route.ts`
    DELETE) — `chat?.userId !== session.user.id` is true when `chat` is `null`, so a missing id
    yields `forbidden:chat` instead of `not_found`. Cosmetic.

11. **`pgClient` upsert/insert array handling** (`lib/db/pgClient.ts`) — `upsert()` only handles a
    single object (`Object.keys(data)` on an array would produce broken SQL). No current caller
    passes an array to `upsert`, but it's a latent trap. `ON CONFLICT DO NOTHING` + `RETURNING`
    also yields no row on conflict, so `.single()` reports "Row not found" even though the row
    exists — callers relying on the returned row after a conflict will misbehave.

12. **Two separate connection pools per process** — `lib/db/queries.ts` and `lib/db/pgClient.ts`
    each open their own `postgres()` pool with `max: 10` against the Supabase pooler (same DB).
    Up to ~20 connections per PM2 process. Fine today; consolidate into one shared client if
    connection limits are ever hit.

13. **`history` GET defensive dead branch** (`app/(chat)/api/history/route.ts`) — handles
    `getChatsByUserId` returning either an array or `{ chats, hasMore }`, but the query function
    always returns the object form. Harmless, just dead code.

---

_Fixes touched: `proxy.ts`, `app/(chat)/api/chat/route.ts`, `lib/db/queries.ts`,
`app/(chat)/api/document/route.ts`, `app/(auth)/register/page.tsx`. Pre-existing biome style lint
warnings and the `lib/ai/models.test.ts` mock type errors are unrelated and not part of `next build`._
