import "server-only";

import { getSql } from "@/lib/db/pgClient";
import { boundUserMemoryContext } from "@/lib/ai/user-memory-budget";
import { requestedMemorySections } from "@/lib/ai/user-memory-sections";

async function safely<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await query();
  } catch {
    // Some installations may not have every optional app table yet. Memory
    // enrichment must never prevent the user from chatting.
    return fallback;
  }
}

function compact(value: unknown, max = 500): string {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? {});
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export async function buildUserMemoryContext(
  userId: string,
  userText: string
): Promise<string> {
  const sections = requestedMemorySections(userText);
  const sql = getSql();
  if (!sql || sections.length === 0) return "";

  const blocks = await Promise.all(
    sections.map(async (section) => {
      if (section === "programs") {
        const rows = await safely(
          async () => [
            ...(await sql<
              Array<{ status: string; title: string; updatedAt: string }>
            >`
            SELECT r.status, COALESCE(v.definition->>'title', p.slug) AS title,
                   r."updatedAt" AS "updatedAt"
            FROM "ProgramRun" r
            JOIN "Program" p ON p.id = r."programId"
            JOIN "ProgramVersion" v ON v.id = r."programVersionId"
            WHERE r."userId" = ${userId}::uuid
            ORDER BY r."updatedAt" DESC
            LIMIT 5
            `),
          ],
          []
        );
        return `[ХӨТӨЛБӨРҮҮД]\n${rows.length ? rows.map((r) => `- ${r.title}: ${r.status}`).join("\n") : "- Хадгалсан явц одоогоор алга."}`;
      }

      if (section === "tests") {
        const rows = await safely(
          async () => [
            ...(await sql<
              Array<{
                title: string;
                score: number;
                band: string | null;
                createdAt: string;
              }>
            >`
            SELECT test_title AS title, score_pct AS score, band_title AS band,
                   created_at AS "createdAt"
            FROM relations_test_results
            WHERE user_id = ${userId}::uuid
            ORDER BY created_at DESC
            LIMIT 3
            `),
          ],
          []
        );
        return `[СЭТГЭЛЗҮЙН ТЕСТИЙН СҮҮЛИЙН ҮР ДҮН]\n${rows.length ? rows.map((r) => `- ${r.title}: ${r.score}%${r.band ? ` — ${r.band}` : ""}`).join("\n") : "- Хадгалсан үр дүн одоогоор алга."}`;
      }

      if (section === "finance") {
        const [row] = await safely(
          async () => [
            ...(await sql<
              Array<{ count: number; income: number; expense: number }>
            >`
            SELECT count(*)::int AS count,
              COALESCE(sum(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::float8 AS income,
              COALESCE(sum(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::float8 AS expense
            FROM transactions
            WHERE user_id = ${userId}::uuid
            `),
          ],
          []
        );
        return `[САНХҮҮ]\n- Гүйлгээ: ${row?.count ?? 0}\n- Нийт орлого: ${row?.income ?? 0} ₮\n- Нийт зарлага: ${row?.expense ?? 0} ₮`;
      }

      if (section === "health") {
        const rows = await safely(
          async () => [
            ...(await sql<
              Array<{ date: string; items: unknown; totals: unknown }>
            >`
            SELECT date, items, totals
            FROM health_daily_logs
            WHERE user_id = ${userId}::uuid
            ORDER BY date DESC
            LIMIT 3
            `),
          ],
          []
        );
        return `[ЭРҮҮЛ МЭНДИЙН СҮҮЛИЙН БҮРТГЭЛ]\n${rows.length ? rows.map((r) => `- ${r.date}: ${compact(r.items, 120)}${r.totals ? `; totals=${compact(r.totals, 80)}` : ""}`).join("\n") : "- Өдрийн бүртгэл одоогоор алга."}`;
      }

      if (section === "services") {
        const [row] = await safely(
          async () => [
            ...(await sql<Array<{ conversations: number; active: number }>>`
            SELECT count(*)::int AS conversations,
              count(*) FILTER (WHERE status = 'open')::int AS active
            FROM psychologist_conversation
            WHERE patient_id = ${userId}::uuid OR psychologist_id = ${userId}::uuid
            `),
          ],
          []
        );
        return `[ХЭРЭГЛЭГЧИЙН ҮЙЛЧИЛГЭЭ]\n- Онлайн сэтгэл зүйчийн чат: ${row?.conversations ?? 0}\n- Үргэлжилж буй чат: ${row?.active ?? 0}`;
      }

      const [summary] = await safely(
        async () => [
          ...(await sql<Array<{ count: number; pages: number }>>`
          SELECT count(*)::int AS count,
            COALESCE(sum(GREATEST(1, ceil(char_length(content) / 1200.0))), 0)::int AS pages
          FROM "EbookNote"
          WHERE "userId" = ${userId}::uuid
          `),
        ],
        []
      );
      const recentNotes = await safely(
        async () => [
          ...(await sql<Array<{ title: string; content: string }>>`
          SELECT title, content
          FROM "EbookNote"
          WHERE "userId" = ${userId}::uuid
          ORDER BY "noteCreatedAt" DESC
          LIMIT 4
          `),
        ],
        []
      );
      return `[МИНИЙ ТЭМДЭГЛЭЛ]\n- Нийт тэмдэглэл: ${summary?.count ?? 0}\n- Ойролцоолсон хуудас: ${summary?.pages ?? 0}\n${
        recentNotes.length
          ? recentNotes
              .map(
                (note) =>
                  `- ${compact(note.title, 80)}: ${compact(note.content, 180)}`
              )
              .join("\n")
          : "- Тэмдэглэл одоогоор алга."
      }`;
    })
  );

  return boundUserMemoryContext(blocks);
}
