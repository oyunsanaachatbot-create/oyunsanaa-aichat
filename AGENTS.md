# Oyunsanaa AI Chat Agent Guide

## Scope

These instructions apply to the entire repository. Add a nested `AGENTS.md` only when a subtree needs genuinely different rules.

## Project Overview

This is a Next.js 16 App Router application using React 19, TypeScript, Auth.js, the Vercel AI SDK, Drizzle ORM/PostgreSQL, Redis, Tailwind CSS, Biome/Ultracite, and Playwright. Use `pnpm`; do not introduce another package manager or lockfile.

Important areas:

- `app/(auth)`: authentication configuration, actions, and pages.
- `app/(chat)`: chat pages, server actions, and chat API routes.
- `app/api`: non-chat API route handlers.
- `app/subscribe`, `lib/subscription`, `lib/qpay`: subscription access and QPay billing.
- `components`: application components; reusable primitives live in `components/ui`.
- `lib/ai`: model configuration, prompts, and AI helpers.
- `lib/db/schema.ts`: Drizzle schema and exported database types.
- `lib/db/queries.ts`: database access functions.
- `lib/db/migrations`: committed SQL migrations and Drizzle metadata.
- `lib/i18n`: translations and locale helpers.
- `tests`: Playwright tests, fixtures, and page objects.

## Working Principles

- Inspect the relevant route, component, query, schema, and nearby tests before editing. Follow existing patterns and `@/` imports.
- Preserve user changes and unrelated work in a dirty worktree. Keep patches narrowly scoped; do not reformat whole legacy files to fix local lint issues.
- Do not assume older Next.js behavior. This repository uses Next.js 16; confirm uncertain APIs against the installed version or current official documentation.
- Respect server/client boundaries. Keep credentials, provider clients, database access, and payment verification server-only. Add `"use client"` only to components that require browser state or effects.
- Authenticate protected route handlers and server actions at the entry point. Authorize access to user-owned records instead of trusting IDs supplied by the browser.
- Validate untrusted request data and return the project's established `ChatSDKError` responses where applicable. Do not expose provider payloads, stack traces, credentials, or internal database errors to clients.
- Keep environment-specific values out of source control. Document new variables in `.env.example` with safe placeholders; never copy secrets or test credentials into `AGENTS.md`, logs, fixtures, or committed files.
- Preserve accessibility and responsive behavior when changing UI. Reuse existing UI primitives and translation infrastructure where the affected surface is localized.

## Database Changes

- Treat `lib/db/schema.ts` and `lib/db/migrations` as a pair. Schema changes require a committed migration; do not rely on `db:push` as the deliverable.
- Generate migrations with `pnpm db:generate`, then inspect the SQL and metadata before accepting them. Never edit or replace an already-applied migration unless explicitly requested and safe.
- Make state transitions atomic and idempotent when callbacks, polling, retries, or concurrent requests can race.
- Do not run migrations against an unspecified or shared database. `pnpm build` runs `lib/db/migrate.ts` before building, so confirm the configured `POSTGRES_URL` is appropriate before using it.

## Subscription and QPay Invariants

- A subscription may be activated or extended only after server-side verification of a QPay payment.
- Verify the invoice belongs to the authenticated user on browser-triggered checks. Never trust a client-reported payment status or amount.
- Require the full stored invoice amount in `PAID` provider rows before granting access. Keep callback and polling paths idempotent so one payment extends the period exactly once.
- Preserve the payment audit trail and avoid logging secrets. If an external invoice is created but cannot be persisted locally, cancel it when safely possible.
- Do not add manual, development, or fallback endpoints that grant paid access without payment verification.

## Commands and Validation

Use the smallest relevant check first, then broaden validation in proportion to risk:

```bash
pnpm install
pnpm dev
pnpm exec biome lint path/to/changed-file.ts
pnpm exec biome format path/to/changed-file.ts
pnpm exec tsc --noEmit --incremental false
pnpm exec playwright test tests/e2e/relevant.test.ts
pnpm test
```

- Prefer targeted Biome checks while editing. Use `pnpm lint` for a repository-wide Ultracite check when the scope justifies it; it may require network access because the script invokes `npx ultracite@latest`.
- Use `pnpm exec biome format --write <files>` only for files intentionally being formatted. Do not run broad automatic fixes over unrelated code.
- Run focused Playwright tests for changed user journeys. Playwright starts `pnpm dev` and expects `/ping` on `PORT` or port 3000.
- Type checking or repository-wide checks may expose pre-existing failures. Distinguish failures caused by the current patch from untouched baseline failures and report both accurately; do not expand scope to fix unrelated issues.
- Do not claim successful QPay end-to-end validation without configured merchant credentials and an actual sandbox/test transaction. Static checks and mocked responses are not proof of provider acceptance.

## Completion Standard

Before handing off a change:

- Review `git diff` and `git diff --check`.
- Verify no secrets, generated caches, logs, screenshots, or unrelated formatting entered the patch.
- State what changed, which checks passed, any baseline failures, and any deployment steps such as environment variables or migrations.

## Өөрчлөлтийн баримтжуулалт ба GitHub нийтлэл

- Хэрэглэгчийн хүссэн өөрчлөлтийн нэг бүтэн хэсгийг хийж, холбогдох шалгалтуудыг амжилттай дуусгасны дараа төслийн үндсэн хавтас дахь `ӨӨРЧЛӨЛТҮҮД.md` файлыг монгол хэлээр шинэчил.
- Тэмдэглэлд огноо, зорилго, хийсэн өөрчлөлт, гол файлууд, шалгалтын үр дүн, шаардлагатай deployment алхмыг товч бөгөөд тодорхой бич.
- Тус тусдаа файл засах бүрд дутуу код push хийхгүй. Ажиллах боломжтой, шалгагдсан нэг өөрчлөлтийн багцыг нэг утгатай commit болгон GitHub руу push хий.
- Commit болон push хийхээс өмнө `git status`, `git diff`, `git diff --check`-ийг шалгаж, зөвхөн тухайн ажлын хамрах хүрээний файлуудыг stage хий.
- Нууц мэдээлэл, лог, cache, screenshot болон хэрэглэгчийн хамааралгүй өөрчлөлтийг commit-д оруулахгүй.
- GitHub authentication, remote эсвэл branch-ийн асуудлаас болж push хийх боломжгүй бол таамгаар өөр remote/branch ашиглахгүй; шалтгааныг хэрэглэгчид тодорхой мэдэгд.

## test admin user:

username = teksyko0402@gmail.com
password = teksyko0402@gmail.com
