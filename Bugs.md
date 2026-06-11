Bugs to fix

Architecture Overview
Stack: Next.js 16 (App Router) + Drizzle ORM + PostgreSQL + Supabase + Vercel AI SDK + NextAuth v5

The project follows a clean route-group structure (auth)/(chat) with proper server/client separation and a custom error class system. The core architecture is solid, but there are several critical bugs and scalability problems.

Critical Bugs

1. Finance intent scans ALL messages — not just the latest
   route.ts:294-313

const allUserText = (uiMessages ?? [])
.filter((m) => m.role === "user")
.flatMap(...) // ALL past messages
If a user ever mentioned "санхүү" in any previous message of the chat, every future reply in that conversation uses financePrompt — completely discarding the mental health system prompt. Fix: only check message (the latest incoming message), not all uiMessages.

2. ensureUserIdByEmail race condition (no transaction)
   queries.ts:102-128

Check-then-insert without a transaction. Under concurrent requests (e.g. tab opened twice), two requests can both see no user exists and both try to insert — one will fail with a constraint error if there's a unique constraint, or both succeed if there isn't one. Fix: use ON CONFLICT DO NOTHING ... RETURNING.

3. Missing UNIQUE constraint on user.email
   schema.ts:14-21

email: varchar("email", { length: 64 }).notNull()
// .unique() is missing
Without .unique(), the race condition above creates duplicate users silently. getUser() returns an array precisely because of this — ensureUserIdByEmail could theoretically return two rows. Fix: add .unique() to the column and a migration.

4. deleteChatById runs without a transaction
   queries.ts:209-220

Deletes votes → messages → streams → chat in four separate queries. If the server crashes mid-way, the data is left in a corrupted state (e.g. messages deleted but chat still exists). Fix: wrap in db.transaction().

5. voteMessage queries inconsistently
   queries.ts:424-428

.where(and(eq(vote.messageId, messageId))) // missing chatId filter
The existence check only filters by messageId but the update filters by both chatId AND messageId. A vote from a different chat could be found and then the update misses it. Fix: add eq(vote.chatId, chatId) to the select.

6. Document schema column is misnamed
   schema.ts:125

kind: varchar("text", { enum: [...] }) // DB column is called "text", not "kind"
The database column is literally named "text" instead of "kind". Drizzle uses the JS property name for queries so it works, but the underlying SQL column has a confusing name that would surprise anyone using Supabase Studio or writing raw SQL.

7. Guest rate limit is trivially bypassable
   route.ts:173-196

Cookie-based rate limiting can be bypassed by clearing cookies. Anyone can get unlimited guest messages. This is acceptable only if guest access is meant to be truly open.

Scalability Issues

1. No DB indexes defined
   The schema defines no explicit indexes. These columns are queried heavily:

Column Query pattern
message.chatId every chat load
chat.userId history sidebar
message.createdAt rate limiting (join query)
message.role rate limiting filter
PostgreSQL will do full table scans as data grows. Add indexes via a Drizzle migration.

2. getMessagesByChatId has no limit
   queries.ts:357-367

All messages for a chat are fetched and passed to the LLM. A chat with 500 messages sends all 500 to the model — expensive and slow. Add a .limit(50).orderBy(desc(...)) and reverse before passing to the model.

3. DB connection pool wrong for serverless
   queries.ts:41-46

const client = postgres(process.env.POSTGRES_URL!, { max: 10 })
In serverless (Vercel), each function invocation creates its own connection pool of up to 10. At 100 concurrent requests you get 1000 connections to PostgreSQL. Use max: 1 for serverless, or use a connection pooler like PgBouncer / Neon pooling / Supabase pooler.

4. Triple-query KB slug lookup
   route.ts:113-150

Three sequential Supabase queries per request just to normalize a slug:

exact → strip leading slash → add leading slash
Normalize slugs at insert time or use a LIKE / OR query. This is 3 network round trips on every chat request for users reading KB articles.

5. Split data across two DB providers with no clear boundary
   Core app data lives in PostgreSQL (Drizzle), but KB articles, user settings, test results, health data, and finance data are all in Supabase — accessed via the Supabase JS client with raw queries. There's no abstraction layer; query logic is scattered across different API routes. This makes it hard to maintain consistency and run unified migrations.

6. All beta packages in production
   Package Version
   next-auth 5.0.0-beta.25
   ai 6.0.0-beta.159
   @ai-sdk/react 3.0.0-beta.162
   These APIs can break between beta releases. NextAuth v5 beta in particular has had breaking changes in auth callbacks and session handling.

How to Improve
High priority (data integrity)
Add user.email unique constraint + update ensureUserIdByEmail to use upsert:

db.insert(user).values({ email, password })
.onConflictDoNothing()
.returning({ id: user.id })
Wrap deleteChatById in a transaction:

await db.transaction(async (tx) => { ... })
Fix finance intent to check only the latest message — replace allUserText scan with just message.parts.

Fix voteMessage select to include chatId filter.

High priority (performance)
Add DB indexes via a Drizzle migration:

index("message_chatId_idx").on(message.chatId)
index("chat_userId_idx").on(chat.userId)
index("message_createdAt_role_idx").on(message.createdAt, message.role)
Cap getMessagesByChatId to the last N messages (50–100) before sending to the LLM.

Fix DB connection pool size to max: 1 for serverless deployment.

Medium priority
Consolidate the slug lookup into a single SQL OR query or normalize slugs at write time.

Pin non-beta versions once stable releases are available — especially NextAuth and the AI SDK.

Move balance test results to server-side (currently localStorage only — data is lost if the user clears storage or switches devices).

Add Zod validation to the other API routes (finance, health, goals) — currently only the main chat route validates its request body.

Lower priority / architecture
Create a lib/supabase/ layer that mirrors lib/db/queries.ts — one place for all Supabase queries rather than scattered createClient() calls in each API route.

Fix the document kind column name in the schema from varchar("text", ...) to varchar("kind", ...) with a migration.

The core architecture is well-structured and the separation of concerns (auth/chat groups, lib/ai, lib/db) is clean. The main risks are the missing unique constraint on email, the transaction-less deletes, and the finance intent detection bug — those three are worth fixing first.
