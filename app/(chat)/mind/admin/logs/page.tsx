import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAppEventFilterOptions,
  getAppEvents,
  getAppEventSummary,
} from "@/lib/db/queries";
import { getSuperAdminSession } from "@/lib/observability/admin";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const RANGE_HOURS: Record<string, number> = {
  "1h": 1,
  "24h": 24,
  "7d": 24 * 7,
  "30d": 24 * 30,
};

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function number(value: number | null | undefined): string {
  return new Intl.NumberFormat("mn-MN").format(value ?? 0);
}

function date(value: Date): string {
  return new Intl.DateTimeFormat("mn-MN", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "Asia/Ulaanbaatar",
  }).format(value);
}

function levelClass(level: string): string {
  if (level === "error") return "bg-red-100 text-red-700";
  if (level === "warn") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  if (!(await getSuperAdminSession())) notFound();

  const params = await searchParams;
  const range = one(params.range) in RANGE_HOURS ? one(params.range) : "24h";
  const levelRaw = one(params.level);
  const level = ["info", "warn", "error"].includes(levelRaw)
    ? (levelRaw as "info" | "warn" | "error")
    : undefined;
  const source = one(params.source) || undefined;
  const model = one(params.model) || undefined;
  const userIdRaw = one(params.userId);
  const userId = /^[0-9a-f-]{36}$/i.test(userIdRaw) ? userIdRaw : undefined;
  const userSearch = one(params.user).trim().slice(0, 100) || undefined;
  const since = new Date(Date.now() - RANGE_HOURS[range] * 60 * 60 * 1000);

  const [events, summary, options] = await Promise.all([
    getAppEvents({
      level,
      source,
      model,
      userId,
      userSearch,
      since,
      limit: 150,
    }),
    getAppEventSummary(since),
    getAppEventFilterOptions(),
  ]);

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-semibold text-2xl">Системийн лог</h1>
          <p className="text-muted-foreground text-sm">
            AI token usage, server болон browser алдааг хэрэглэгчээр шүүнэ.
          </p>
        </div>
        <Link className="rounded-lg border px-3 py-2 text-sm hover:bg-muted" href="/mind/admin/logs">
          Шинэчлэх
        </Link>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Үйл явдал", summary.eventCount],
          ["Алдаа", summary.errorCount],
          ["Input token", summary.inputTokens],
          ["Cached input", summary.cachedInputTokens],
          ["Output token", summary.outputTokens],
        ].map(([label, value]) => (
          <div className="rounded-xl border bg-card p-4" key={String(label)}>
            <div className="text-muted-foreground text-xs">{label}</div>
            <div className="mt-1 font-semibold text-xl">{number(Number(value))}</div>
          </div>
        ))}
      </section>

      <form className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-5">
        <select className="rounded-lg border bg-background px-3 py-2 text-sm" defaultValue={range} name="range">
          <option value="1h">Сүүлийн 1 цаг</option>
          <option value="24h">Сүүлийн 24 цаг</option>
          <option value="7d">Сүүлийн 7 хоног</option>
          <option value="30d">Сүүлийн 30 хоног</option>
        </select>
        <select className="rounded-lg border bg-background px-3 py-2 text-sm" defaultValue={level ?? ""} name="level">
          <option value="">Бүх түвшин</option>
          <option value="error">Error</option>
          <option value="warn">Warning</option>
          <option value="info">Info</option>
        </select>
        <select className="rounded-lg border bg-background px-3 py-2 text-sm" defaultValue={source ?? ""} name="source">
          <option value="">Бүх source</option>
          {options.sources.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
        <select className="rounded-lg border bg-background px-3 py-2 text-sm" defaultValue={model ?? ""} name="model">
          <option value="">Бүх model</option>
          {options.models.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
        <button className="rounded-lg bg-primary px-3 py-2 font-medium text-primary-foreground text-sm" type="submit">
          Шүүх
        </button>
        <input className="rounded-lg border bg-background px-3 py-2 text-sm md:col-span-5" defaultValue={userSearch ?? ""} name="user" placeholder="Хэрэглэгчийн нэр эсвэл имэйлээр шүүх" />
      </form>

      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs">
              <tr>
                <th className="p-3">Огноо</th><th className="p-3">Түвшин</th>
                <th className="p-3">Event / хэрэглэгч</th><th className="p-3">Model</th>
                <th className="p-3">Input / cache</th><th className="p-3">Output</th>
                <th className="p-3">Context</th><th className="p-3">Хугацаа</th>
              </tr>
            </thead>
            <tbody>
              {events.map(({ log, userName, userEmail }) => (
                <tr className="border-b align-top last:border-0" key={log.id}>
                  <td className="whitespace-nowrap p-3 text-xs">{date(log.createdAt)}</td>
                  <td className="p-3"><span className={`rounded-full px-2 py-1 font-medium text-xs ${levelClass(log.level)}`}>{log.level}</span></td>
                  <td className="max-w-sm p-3">
                    <div className="font-medium">{log.event}</div>
                    <div className="text-muted-foreground text-xs">{log.source} · {log.route ?? "—"}</div>
                    <div className="mt-1 text-xs">{userName || userEmail || log.userId || "Anonymous"}</div>
                    {Boolean(log.message || log.errorCode || log.metadata) && (
                      <details className="mt-2 text-xs">
                        <summary className="cursor-pointer text-primary">Дэлгэрэнгүй</summary>
                        {log.errorCode && <div className="mt-1 font-medium text-red-600">{log.errorCode}</div>}
                        {log.message && <div className="mt-1 break-words">{log.message}</div>}
                        {log.requestId && <div className="mt-1 text-muted-foreground">request: {log.requestId}</div>}
                        {log.metadata != null && <pre className="mt-2 max-w-lg overflow-auto rounded bg-muted p-2">{JSON.stringify(log.metadata, null, 2)}</pre>}
                      </details>
                    )}
                  </td>
                  <td className="p-3 text-xs">{log.model ?? "—"}</td>
                  <td className="p-3 text-xs">{number(log.inputTokens)} / {number(log.cachedInputTokens)}</td>
                  <td className="p-3 text-xs">{number(log.outputTokens)}<div className="text-muted-foreground">reason: {number(log.reasoningTokens)}</div></td>
                  <td className="p-3 text-xs">history {number(log.historyCount)}<br />image {number(log.imageCount)}</td>
                  <td className="p-3 text-xs">{log.durationMs == null ? "—" : `${number(log.durationMs)} ms`}{log.chatId && <div><Link className="text-primary" href={`/chat/${log.chatId}`}>Чат нээх</Link></div>}</td>
                </tr>
              ))}
              {events.length === 0 && <tr><td className="p-8 text-center text-muted-foreground" colSpan={8}>Сонгосон хугацаанд лог алга.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
