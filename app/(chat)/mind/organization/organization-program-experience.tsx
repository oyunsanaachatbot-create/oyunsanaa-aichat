"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ContentPayload, OrganizationContentType, ResponseType } from "@/lib/organizations/program-contract";

type TodayBlock = { id: string; recipientId: string; type: string; required: boolean; payload: ContentPayload; response: { value: unknown; status: string } | null; assessment: { slug: string; versionId: string; role: string } | null; gratitudeTarget: { id: string; name: string | null } | null };
type TodayCard = { instanceId: string; name: string; dayNumber: number; durationDays: number; blocks: TodayBlock[] };
type HistoryRow = { instanceId: string; instanceName: string; dayNumber: number; slotId: string; revision: number; publishState: string; type: string; title: string; status: string; value: unknown; resultDirection: string | null; runtimeSlug: string | null; recipientId: string };
type Props = {
  organizationName: string;
  cards: TodayCard[];
  history: HistoryRow[];
  schedule: Array<{ id: string; name: string; startDate: string; durationDays: number; status: string }>;
  personalResults: Array<{ title: string; percent: number | null; bandTitle: string | null; completedAt: string | null; runId?: string }>;
  sessionCredits: { available: number; reserved: number; used: number };
  chatGrantEndsAt: string | null;
  bookingHref: string;
  appreciations: Array<{ id: string; body: string; createdAt: string; senderName: string }>;
};

const labels: Record<OrganizationContentType, string> = {
  WORD_PACK: "Оюунсанаагийн үг", GRATITUDE: "Талархал", SUPERLATIVE_PACK: "Хамгийн-хамгийн", TRAINING: "Сургалт", AUDIO: "Аудио / дасгал", REMINDER: "Сануулга", CHECK_IN: "Check-in", PERSONAL_QUESTION: "Хувийн асуулт", ORGANIZATION_QUESTION: "Байгууллагын асуулт", FEEDBACK: "Санал хүсэлт", REFLECTION: "Эргэцүүлэл", SURVEY: "Санал асуулга", ASSESSMENT: "Үнэлгээ", TASK: "Даалгавар", PROGRAM: "Хөтөлбөр", MANAGER_MESSAGE: "Удирдлагын үг", IMPLEMENTATION: "Хэрэгжүүлэлт", SUGGESTION: "Санал болгох зүйл",
};

export function OrganizationProgramExperience(props: Props) {
  const [tab, setTab] = useState<"TODAY" | "PROGRESS" | "RESULTS" | "FEEDBACK" | "SERVICES">("TODAY");
  const [notice, setNotice] = useState("");
  const router = useRouter();
  const dateParts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ulaanbaatar", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date()).map((part) => [part.type, part.value]));
  const localToday = `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
  const upcoming = props.schedule.filter((item) => item.status === "ACTIVE" && item.startDate > localToday);
  const personalDirections = new Map<string, { name: string; counts: Map<string, number> }>();
  for (const row of props.history) if (row.type === "PERSONAL_QUESTION" && row.resultDirection && ["SUBMITTED", "COMPLETED"].includes(row.status)) {
    const entry = personalDirections.get(row.instanceId) ?? { name: row.instanceName, counts: new Map<string, number>() };
    entry.counts.set(row.resultDirection, (entry.counts.get(row.resultDirection) ?? 0) + 1);
    personalDirections.set(row.instanceId, entry);
  }
  const ownProgress = props.schedule.map((instance) => {
    const elapsedDays = Math.min(instance.durationDays, Math.max(0, Math.floor((Date.parse(`${localToday}T00:00:00Z`) - Date.parse(`${instance.startDate}T00:00:00Z`)) / 86_400_000) + 1));
    const selected = new Map<string, HistoryRow>();
    const engaged = (row: HistoryRow) => ["DRAFT", "IN_PROGRESS", "SUBMITTED", "COMPLETED"].includes(row.status);
    for (const row of props.history.filter((item) => item.instanceId === instance.id)) {
      const key = `${row.dayNumber}:${row.slotId}`;
      const previous = selected.get(key);
      if ((engaged(row) && (!previous || !engaged(previous) || row.revision > previous.revision))
        || (!previous && row.publishState === "PUBLISHED")
        || (previous && !engaged(previous) && row.publishState === "PUBLISHED")) selected.set(key, row);
    }
    const assigned = selected.size;
    const completed = [...selected.values()].filter((row) => ["SUBMITTED", "COMPLETED"].includes(row.status)).length;
    return { ...instance, elapsedDays, assigned, completed, elapsedPercent: Math.round(elapsedDays / instance.durationDays * 100), completionPercent: assigned ? Math.round(completed / assigned * 100) : 0 };
  });
  async function completeDay(instanceId: string) {
    setNotice("");
    try {
      const response = await fetch("/api/mind/organization/days/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ instanceId }) });
      const data = await response.json();
      if (!response.ok) { setNotice(data.error === "REQUIRED_BLOCKS_INCOMPLETE" ? "Заавал хийх зүйлсээ эхэлж дуусгана уу." : "Өдрийг дуусгаж чадсангүй. Дахин оролдоно уу."); return; }
      setNotice("Өнөөдрийн зүйлс дууслаа ✓"); router.refresh();
    } catch { setNotice("Холболт тасарлаа. Дахин оролдоно уу."); }
  }
  return <div className="space-y-5">
    <header className="rounded-2xl bg-white p-5 shadow-sm"><p className="font-semibold text-blue-700 text-xs uppercase">Байгууллагын хөтөлбөр</p><h1 className="mt-1 font-bold text-2xl text-slate-900">{props.organizationName}</h1><p className="mt-2 text-slate-600 text-sm">Хувийн асуулт, эргэцүүлэл, үнэлгээний дэлгэрэнгүй үр дүн зөвхөн танд харагдана. Байгууллага зөвхөн нууцлал хангасан нэгтгэлийг харна.</p></header>
    <nav className="flex gap-2 overflow-x-auto border-slate-200 border-b" aria-label="Байгууллагын хөтөлбөр">
      {([ ["TODAY", "Өнөөдөр"], ["PROGRESS", "Миний явц"], ["RESULTS", "Миний үр дүн"], ["FEEDBACK", "Санал хүсэлт"], ["SERVICES", "Үйлчилгээ"] ] as const).map(([key, label]) => <button key={key} type="button" onClick={() => setTab(key)} aria-current={tab === key ? "page" : undefined} className={`min-h-11 shrink-0 border-b-2 px-3 font-semibold text-sm ${tab === key ? "border-blue-700 text-blue-700" : "border-transparent text-slate-600"}`}>{label}</button>)}
    </nav>
    {tab === "TODAY" && <section className="space-y-4">
      {props.appreciations.filter((item) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ulaanbaatar", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(item.createdAt)) === localToday).slice(0, 5).map((item) => <div key={item.id} className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="font-semibold text-emerald-800 text-xs">Хамт олноос ирсэн талархал · {item.senderName}</p><p className="mt-1 whitespace-pre-wrap text-slate-800 text-sm">{item.body}</p></div>)}
      {props.cards.length ? props.cards.map((card) => <article key={card.instanceId} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"><header><p className="font-semibold text-blue-700 text-xs uppercase">Өнөөдөр · {card.dayNumber} дахь өдөр</p><h2 className="mt-1 font-semibold text-xl">{card.name}</h2><p className="text-slate-600 text-sm">{card.dayNumber} / {card.durationDays} өдөр</p></header>
        {card.dayNumber === 1 && <p className="rounded-xl bg-blue-50 p-3 text-blue-800 text-sm">Шинэ хөтөлбөр эхэллээ. Өнөөдрийн агуулгаа дарааллаар нь хийнэ үү.</p>}
        {card.blocks.length ? card.blocks.map((block) => <EmployeeBlock key={block.id} block={block} onFeedback={() => setTab("FEEDBACK")} />) : <p className="rounded-xl bg-slate-50 p-4 text-slate-600 text-sm">Өнөөдөр танд оноогдсон зүйл байхгүй.</p>}
        <button type="button" className="min-h-11 rounded-xl bg-blue-700 px-5 font-semibold text-sm text-white" onClick={() => completeDay(card.instanceId)}>Өнөөдрийн зүйлсийг дуусгах</button>
      </article>) : <div className="space-y-2">{upcoming.map((item) => <p key={item.id} className="rounded-xl border bg-white p-5 text-slate-600 text-sm">{item.name} · {item.startDate}-нд эхэлнэ.</p>)}{!upcoming.length && <p className="rounded-xl border bg-white p-5 text-slate-600 text-sm">Өнөөдрийн агуулга байхгүй. Өмнөх явцаа “Миний явц”-аас харна уу.</p>}</div>}
      {notice && <output className="text-slate-700 text-sm">{notice}</output>}
    </section>}
    {tab === "PROGRESS" && <section className="space-y-3"><h2 className="font-semibold text-lg">Миний явц</h2>{ownProgress.map((item) => <div key={item.id} className="rounded-xl border bg-white p-4"><p className="font-semibold">{item.name}</p><p className="mt-1 text-slate-600 text-sm">Өдөр {item.elapsedDays} / {item.durationDays} · Хугацаа {item.elapsedPercent}% · Миний гүйцэтгэл {item.completionPercent}%</p><p className="text-slate-500 text-xs">Өөрт оноогдсон {item.assigned} зүйлээс {item.completed} дууссан.</p></div>)}{props.history.length ? props.history.map((item, index) => <div key={`${item.instanceId}-${item.dayNumber}-${index}`} className="rounded-xl border bg-white p-4"><p className="text-slate-500 text-xs">{item.instanceName} · {item.dayNumber} дахь өдөр</p><p className="font-medium">{item.title}</p><p className="text-slate-600 text-sm">{item.status === "SUBMITTED" ? "Хадгалагдсан ✓" : item.status === "COMPLETED" ? "Дууссан ✓" : item.status === "DRAFT" ? "Ноорог" : item.status === "IN_PROGRESS" ? "Үргэлжилж байна" : "Хийгээгүй"}</p>{item.value !== null && item.value !== undefined && <p className="mt-2 whitespace-pre-wrap text-sm">{String(item.value)}</p>}{item.runtimeSlug && item.status !== "COMPLETED" && <Link className="mt-2 inline-flex min-h-11 items-center font-semibold text-blue-700 text-sm underline" href={`/mind/programs/${item.runtimeSlug}?organizationAssignment=${item.recipientId}`}>Үргэлжлүүлэх</Link>}</div>) : <p className="rounded-xl border bg-white p-4 text-sm">Хувийн түүх хараахан бүрдээгүй байна.</p>}</section>}
    {tab === "RESULTS" && <section className="space-y-3"><h2 className="font-semibold text-lg">Миний үр дүн</h2><p className="text-slate-600 text-sm">Үнэлгээний хувийн үр дүн байгууллагын тайланд нэртэй очихгүй.</p>{props.personalResults.map((item) => <div key={item.runId ?? `${item.title}:${item.completedAt ?? "pending"}`} className="rounded-xl border bg-white p-4"><p className="font-medium">{item.title}</p><p className="text-slate-600 text-sm">{item.bandTitle ?? (item.percent !== null ? `${item.percent}%` : "Хувийн үр дүн бэлэн")}</p>{item.runId && <Link className="mt-2 inline-flex min-h-11 items-center font-semibold text-blue-700 text-sm underline" href={`/mind/programs/archive/${item.runId}`}>Дэлгэрэнгүй үр дүн харах</Link>}</div>)}{[...personalDirections].map(([instanceId, entry]) => <div key={instanceId} className="rounded-xl border bg-white p-4"><p className="font-medium">{entry.name} · хувийн асуултын чиглэл</p><div className="mt-2 space-y-1">{[...entry.counts].sort((a, b) => b[1] - a[1]).map(([direction, count]) => <p key={direction} className="text-slate-700 text-sm">{direction}: {count}</p>)}</div></div>)}{!props.personalResults.length && !personalDirections.size && <p className="rounded-xl border bg-white p-4 text-sm">Үр дүн хараахан байхгүй.</p>}{props.appreciations.length > 0 && <div className="space-y-2"><h3 className="font-semibold text-base">Надад ирсэн сайхан үгс</h3>{props.appreciations.map((item) => <div key={item.id} className="rounded-xl border bg-white p-4"><p className="text-slate-500 text-xs">{item.senderName}</p><p className="mt-1 whitespace-pre-wrap text-sm">{item.body}</p></div>)}</div>}</section>}
    {tab === "FEEDBACK" && <FeedbackForm />}
    {tab === "SERVICES" && <section className="space-y-3"><h2 className="font-semibold text-lg">Надад олгосон үйлчилгээ</h2>{props.sessionCredits.available > 0 ? <div className="rounded-xl border bg-white p-4"><p>Үлдсэн уулзалтын эрх: {props.sessionCredits.available}</p><p className="mt-1 text-slate-600 text-sm">Захиалсан: {props.sessionCredits.reserved} · Ашигласан: {props.sessionCredits.used}</p><Link className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-blue-700 px-4 font-semibold text-sm text-white" href={props.bookingHref}>Цаг авах</Link></div> : <p className="rounded-xl border bg-white p-4 text-sm">Одоогоор олгосон уулзалтын эрх алга.</p>}{props.chatGrantEndsAt && <div className="rounded-xl border bg-white p-4 text-sm">AI чат ашиглах эрх {new Date(props.chatGrantEndsAt).toLocaleDateString("mn-MN")} хүртэл идэвхтэй.</div>}</section>}
  </div>;
}

function EmployeeBlock({ block, onFeedback }: { block: TodayBlock; onFeedback: () => void }) {
  const [value, setValue] = useState<unknown>(block.response?.value ?? (block.type === "SURVEY" ? {} : block.type === "SUGGESTION" ? { selected: [] } : block.payload.responseType === "MULTIPLE_CHOICE" ? [] : ""));
  const [status, setStatus] = useState(block.response?.status ?? "AVAILABLE");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const done = status === "SUBMITTED" || status === "COMPLETED";
  const type = block.type as OrganizationContentType;
  async function save(mode: "DRAFT" | "SUBMIT", submittedValue = value) {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/mind/organization/blocks/${block.id}/response`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode, value: submittedValue }) });
      const result = await response.json();
      if (!response.ok) { setError(result.error === "INVALID_RESPONSE" ? "Хариултаа гүйцэд бөглөнө үү." : "Хадгалж чадсангүй. Дахин оролдоно уу."); return; }
      setStatus(result.status);
    } catch { setError("Холболт тасарлаа. Хариулт илгээгдээгүй."); }
    finally { setBusy(false); }
  }
  const payload = block.payload;
  const responseType = payload.responseType && payload.responseType !== "NONE" ? payload.responseType
    : type === "REFLECTION" ? "LONG_TEXT" : type === "CHECK_IN" ? "SCALE_1_5"
    : type === "PERSONAL_QUESTION" || type === "SUPERLATIVE_PACK" ? "SINGLE_CHOICE" : "NONE";
  return <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4"><div><p className="font-semibold text-blue-700 text-xs">{labels[type] ?? type}{block.required ? " · Заавал" : ""}</p><h3 className="mt-1 font-semibold text-slate-900">{payload.title}</h3>{payload.body && <p className="mt-1 whitespace-pre-wrap text-slate-700 text-sm">{payload.body}</p>}{payload.prompt && <p className="mt-1 text-slate-700 text-sm">{payload.prompt}</p>}{["PERSONAL_QUESTION", "REFLECTION", "ASSESSMENT"].includes(type) && <p className="mt-2 text-slate-600 text-xs">Хувийн хариулт, дэлгэрэнгүй үр дүн зөвхөн танд харагдана.</p>}{["CHECK_IN", "ORGANIZATION_QUESTION", "SURVEY"].includes(type) && <p className="mt-2 text-slate-600 text-xs">Байгууллага зөвхөн нууцлал хангасан нэгтгэлийг харна.</p>}</div>
    {done ? <p className="font-semibold text-emerald-700 text-sm">{status === "COMPLETED" ? "Дууссан ✓" : "Хадгалагдсан ✓"}</p> : <>
      {payload.audioUrl && <audio controls preload="none" className="w-full" src={payload.audioUrl}><track kind="captions" src={typeof payload.captionUrl === "string" ? payload.captionUrl : undefined} srcLang="mn" label="Монгол" /></audio>}
      {payload.url && <a className="inline-flex min-h-11 items-center font-semibold text-blue-700 text-sm underline" href={payload.url} target="_blank" rel="noopener noreferrer">Дэлгэрэнгүй нээх</a>}
      {(type === "ASSESSMENT" || type === "PROGRAM") && block.assessment ? <Link className="inline-flex min-h-11 items-center rounded-xl bg-blue-700 px-4 font-semibold text-sm text-white" href={`/mind/programs/${block.assessment.slug}?organizationAssignment=${block.recipientId}`}>{type === "ASSESSMENT" ? "Үнэлгээ" : "Хөтөлбөр"} эхлэх / үргэлжлүүлэх</Link> : null}
      {type === "FEEDBACK" && <button type="button" className="min-h-11 rounded-xl bg-blue-700 px-4 font-semibold text-sm text-white" onClick={onFeedback}>Нэргүй санал бичих</button>}
      {type === "GRATITUDE" && <GratitudeForm block={block} onDone={() => setStatus("SUBMITTED")} />}
      {type === "SUGGESTION" && <div><p className="font-medium text-sm">Хэрэгжүүлэхийг хүсэж буй саналаа сонгоно уу.</p><AnswerInput type="MULTIPLE_CHOICE" options={payload.options ?? []} value={(value as { selected?: string[] })?.selected ?? []} onChange={(selected) => setValue({ selected })} /></div>}
      {["WORD_PACK", "REMINDER", "MANAGER_MESSAGE"].includes(type) && <p className="font-semibold text-emerald-700 text-sm">Үзсэн ✓</p>}
      {type !== "ASSESSMENT" && !(type === "PROGRAM" && block.assessment) && type !== "GRATITUDE" && type !== "IMPLEMENTATION" && type !== "FEEDBACK" && !["WORD_PACK", "REMINDER", "MANAGER_MESSAGE"].includes(type) && <>
        {type === "SURVEY" && payload.questions?.map((question) => <div key={question.id}><p className="font-medium text-sm">{question.prompt}</p><AnswerInput type={question.responseType} options={question.options ?? []} value={(value as Record<string, unknown>)?.[question.id]} onChange={(next) => setValue((previous: unknown) => ({ ...(previous as Record<string, unknown>), [question.id]: next }))} /></div>)}
        {type !== "SURVEY" && type !== "SUGGESTION" && responseType !== "NONE" && <AnswerInput type={responseType} options={payload.options?.length ? payload.options : payload.answerDirections?.map((answer) => answer.label) ?? []} value={value} onChange={setValue} onBlur={type === "REFLECTION" ? async () => { if (typeof value === "string" && value.trim()) await save("DRAFT"); } : undefined} />}
        {status === "DRAFT" && <p className="text-slate-600 text-xs">Ноорог хадгалагдсан</p>}
        <button type="button" disabled={busy} onClick={() => save("SUBMIT", responseType === "NONE" && type !== "SURVEY" && type !== "SUGGESTION" ? true : value)} className="min-h-11 rounded-xl bg-blue-700 px-4 font-semibold text-sm text-white disabled:opacity-50">{type === "SUGGESTION" ? "Сонголтоо батлах" : responseType === "NONE" && type !== "SURVEY" ? "Хийж дууссан" : "Хариулт хадгалах"}</button>
      </>}
    </>}
    {error && <p role="alert" className="text-red-700 text-sm">{error}</p>}
  </section>;
}

function AnswerInput({ type, options, value, onChange, onBlur }: { type: ResponseType; options: string[]; value: unknown; onChange: (value: unknown) => void; onBlur?: () => void }) {
  if (type === "TEXT" || type === "LONG_TEXT") return <textarea className="mt-2 min-h-24 w-full rounded-xl border bg-white p-3 text-base" value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)} onBlur={onBlur} />;
  if (type === "SCALE_1_5" || type === "SCALE_0_10") return <div className="mt-2 grid grid-cols-5 gap-2 sm:flex sm:flex-wrap">{Array.from({ length: type === "SCALE_1_5" ? 5 : 11 }, (_, index) => type === "SCALE_1_5" ? index + 1 : index).map((number) => <button key={number} type="button" aria-pressed={value === number} className={`min-h-11 min-w-11 rounded-xl border font-semibold text-sm ${value === number ? "border-blue-700 bg-blue-100 text-blue-800" : "bg-white"}`} onClick={() => onChange(number)}>{number}</button>)}</div>;
  if (type === "SINGLE_CHOICE") return <div className="mt-2 space-y-2">{options.map((option) => <button key={option} type="button" aria-pressed={value === option} className={`block min-h-11 w-full rounded-xl border px-3 text-left text-sm ${value === option ? "border-blue-700 bg-blue-50" : "bg-white"}`} onClick={() => onChange(option)}>{option}</button>)}</div>;
  if (type === "MULTIPLE_CHOICE") return <div className="mt-2 space-y-2">{options.map((option) => { const selected = Array.isArray(value) ? value as string[] : []; return <label key={option} className="flex min-h-11 items-center gap-2 rounded-xl border bg-white px-3 text-sm"><input type="checkbox" checked={selected.includes(option)} onChange={(event) => onChange(event.target.checked ? [...selected, option] : selected.filter((item) => item !== option))} />{option}</label>; })}</div>;
  return null;
}

function FeedbackForm() {
  const [destination, setDestination] = useState("");
  const [body, setBody] = useState("");
  const [key, setKey] = useState(() => crypto.randomUUID());
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function send() {
    if (!destination || !body.trim()) { setMessage("Хүлээн авагч болон бичвэрээ сонгоно уу."); return; }
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/mind/organization/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ destination, body, idempotencyKey: key }) });
      if (!response.ok) { setMessage("Илгээж чадсангүй. Дахин оролдоно уу."); return; }
      setBody(""); setKey(crypto.randomUUID()); setMessage("Нэргүй санал илгээгдлээ ✓");
    } catch { setMessage("Холболт тасарлаа. Санал илгээгдээгүй."); }
    finally { setBusy(false); }
  }
  return <section className="space-y-3 rounded-xl border bg-white p-4"><h2 className="font-semibold text-lg">Нэргүй санал хүсэлт</h2><p className="text-slate-600 text-sm">Нэр, имэйл хүлээн авагчид харагдахгүй. Таны сонгосон тал л бичвэрийг хүлээн авна.</p><select aria-label="Хүлээн авагч" className="min-h-11 w-full rounded-xl border px-3" value={destination} onChange={(event) => setDestination(event.target.value)}><option value="">Хүлээн авагч сонгох</option><option value="ORGANIZATION">Байгууллагад</option><option value="OYUNSANAA">Оюунсанаад</option></select><textarea aria-label="Санал хүсэлт" className="min-h-28 w-full rounded-xl border p-3" value={body} onChange={(event) => setBody(event.target.value)} /><button type="button" disabled={busy} onClick={send} className="min-h-11 rounded-xl bg-blue-700 px-5 font-semibold text-sm text-white disabled:opacity-50">Илгээх</button>{message && <output className="text-sm">{message}</output>}</section>;
}

function GratitudeForm({ block, onDone }: { block: TodayBlock; onDone: () => void }) {
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  async function send() {
    if (!block.gratitudeTarget) return;
    const response = await fetch("/api/mind/organization/appreciations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipientMembershipId: block.gratitudeTarget.id, body, blockRecipientId: block.recipientId }) });
    if (!response.ok) { setMessage("Талархлыг илгээж чадсангүй."); return; }
    setMessage("Талархал илгээгдлээ ✓"); onDone();
  }
  return <div className="space-y-2"><p className="font-medium text-sm">Өнөөдрийн онцолсон хүн: {block.gratitudeTarget?.name ?? "Хамт олон"}</p><textarea aria-label="Талархлын үг" className="min-h-24 w-full rounded-xl border p-3" value={body} onChange={(event) => setBody(event.target.value)} /><button type="button" disabled={!block.gratitudeTarget || !body.trim()} className="min-h-11 rounded-xl bg-blue-700 px-4 text-sm text-white" onClick={send}>Илгээх</button>{message && <output className="text-sm">{message}</output>}</div>;
}
