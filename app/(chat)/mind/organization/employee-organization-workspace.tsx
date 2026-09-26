"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppCard, Badge, Muted, PageHero, SectionHeading } from "@/components/mind/app-shell";
import { Button } from "@/components/ui/button";
import type { OrganizationDayBlock } from "@/lib/programs/definition";

export type DailyProgramCard = { id: string; slug: string; title: string; dayNumber: number; blocks: OrganizationDayBlock[]; responses: Record<string, string | number | string[]>; completed: boolean };
export type PersonalProgramResult = { title: string; percent: number | null; bandTitle: string | null; completedAt: string | null };
type Props = {
  organizationName: string;
  role: string;
  sessionCredits: { available: number; reserved: number; used: number };
  chatGrant: { endsAt: string } | null;
  bookingHref: string;
  initialPrograms: Array<{ id: string; slug: string; title: string }>;
  dailyPrograms: DailyProgramCard[];
  optionalPrograms: Array<{ id: string; slug: string; title: string }>;
  finalPrograms: Array<{ id: string; slug: string; title: string }>;
  appreciations: Array<{ id: string; body: string; createdAt: string; senderName: string }>;
  updates: Array<{ id: string; body: string; createdAt: string }>;
  personalResults: PersonalProgramResult[];
  teamMembers: Array<{ id: string; name: string }>;
};

const nav = ["Эхний үнэлгээ", "Өнөөдөр", "Нэмэлт үйлчилгээ", "Эцсийн үнэлгээ", "Миний тайлан"] as const;
type Stage = (typeof nav)[number];

export function EmployeeOrganizationWorkspace(props: Props) {
  const [stage, setStage] = useState<Stage>("Өнөөдөр");
  return <AppCard className="space-y-5">
    <PageHero eyebrow="Байгууллагын хөтөлбөр" icon="🏢" title={props.organizationName} description={`${roleLabel(props.role)} · Таны хариулт, үнэлгээ зөвхөн танд харагдана.`} />
    <div className="grid gap-3 sm:grid-cols-3">
      <Summary label="Уулзалтын үлдсэн эрх" value={props.sessionCredits.available} />
      <Summary label="Захиалсан уулзалт" value={props.sessionCredits.reserved} />
      <Summary label="AI Chat эрх" value={props.chatGrant ? `Идэвхтэй · ${formatDate(props.chatGrant.endsAt)}` : "Олгогдоогүй"} />
    </div>
    <nav aria-label="Байгууллагын хөтөлбөр" className="flex gap-1 overflow-x-auto border-b border-slate-200">
      {nav.map((item) => <button aria-current={stage === item ? "page" : undefined} className={`min-h-11 shrink-0 border-b-2 px-3 text-sm font-semibold transition ${stage === item ? "border-[#1F6FB2] text-[#1F6FB2]" : "border-transparent text-slate-600 hover:text-slate-900"}`} key={item} onClick={() => setStage(item)}>{item}</button>)}
    </nav>
    {stage === "Эхний үнэлгээ" && <ProgramList title="Эхний үнэлгээ" description="Хөтөлбөр эхлэх үеийн үнэлгээ. Үр дүн зөвхөн таны хувийн тайланд хадгалагдана." items={props.initialPrograms} empty="Эхний үнэлгээ хараахан нийтлэгдээгүй байна." />}
    {stage === "Өнөөдөр" && <section className="space-y-4"><div><SectionHeading>Өнөөдрийн зүйлс</SectionHeading><Muted className="mt-1">Өдрийн агуулгаа бөглөж хадгалах эсвэл дуусгаарай. Дуусгасан өдрийг дахин өөрчлөх боломжгүй.</Muted></div>{props.dailyPrograms.length ? props.dailyPrograms.map((program) => <DailyProgram key={`${program.id}-${program.dayNumber}`} program={program} teamMembers={props.teamMembers} />) : <Notice>Өнөөдрийн агуулга хараахан нийтлэгдээгүй байна.</Notice>}
      <AppreciationComposer teamMembers={props.teamMembers} />
      {props.appreciations.length > 0 && <section className="space-y-3"><SectionHeading>Танд ирсэн сайхан үгс</SectionHeading>{props.appreciations.map((item) => <article className="rounded-xl border border-slate-200 bg-white p-4" key={item.id}><p className="whitespace-pre-wrap text-sm leading-6 text-slate-800">{item.body}</p><p className="mt-2 text-xs text-slate-500">{item.senderName} · {formatDate(item.createdAt)}</p></article>)}</section>}
    </section>}
    {stage === "Нэмэлт үйлчилгээ" && <section className="space-y-4"><div><SectionHeading>Нэмэлт үйлчилгээ</SectionHeading><Muted className="mt-1">Гэрээгээр танд олгосон уулзалтын эрхийг ашиглаарай.</Muted></div>{props.sessionCredits.available > 0 ? <AppCard className="rounded-xl border border-slate-200 bg-white p-4"><p className="font-semibold text-slate-900">Сэтгэлзүйчээс цаг авах</p><p className="mt-1 text-sm text-slate-600">Танд {props.sessionCredits.available} удаагийн уулзалтын эрх байна.</p><Link className="mt-3 inline-flex min-h-10 items-center rounded-xl bg-[#1F6FB2] px-4 text-sm font-semibold text-white" href={props.bookingHref}>Цаг авах</Link></AppCard> : <Notice>Нэмэлт үйлчилгээний уулзалтын эрх одоогоор олгогдоогүй байна.</Notice>}{props.optionalPrograms.length > 0 && <ProgramList title="Танд зориулсан хөтөлбөр, сургалт" description="Таны гэрээ болон байгууллагын role-д таарсан контент." items={props.optionalPrograms} empty="Нийтлэгдсэн зүйл алга." />}</section>}
    {stage === "Эцсийн үнэлгээ" && <ProgramList title="Эцсийн үнэлгээ" description="Хөтөлбөрийн төгсгөлийн үнэлгээг бөглөнө үү." items={props.finalPrograms} empty="Эцсийн үнэлгээ хараахан нийтлэгдээгүй байна." />}
    {stage === "Миний тайлан" && <section className="space-y-4"><header><Badge>ЗӨВХӨН ТАНД</Badge><SectionHeading className="mt-2">Миний тайлан</SectionHeading><Muted className="mt-1">Байгууллагын удирдлага таны нэр, имэйл, хувийн үнэлгээ болон түүхий хариултыг харахгүй.</Muted></header><div className="grid gap-3 sm:grid-cols-3"><Summary label="Дууссан өдөр" value={props.dailyPrograms.filter((item) => item.completed).length} /><Summary label="Дуусгасан хөтөлбөр" value={props.personalResults.length} /><Summary label="Танд ирсэн үг" value={props.appreciations.length} /></div><div className="space-y-3">{props.personalResults.length ? props.personalResults.map((item, index) => <article className="rounded-xl border border-slate-200 bg-white p-4" key={`${item.title}-${index}`}><p className="font-semibold text-slate-900">{item.title}</p><p className="mt-1 text-sm text-slate-600">{item.bandTitle ?? (item.percent !== null ? `${item.percent}%` : "Хувийн үр дүн хадгалагдсан")}{item.completedAt ? ` · ${formatDate(item.completedAt)}` : ""}</p></article>) : <Notice>Таны хувийн үр дүн хараахан бүрдээгүй байна.</Notice>}</div>{props.updates.length > 0 && <section className="space-y-3"><SectionHeading>Байгууллагаас мэдээлсэн зүйлс</SectionHeading>{props.updates.map((item) => <article className="rounded-xl bg-slate-50 p-4" key={item.id}><p className="whitespace-pre-wrap text-sm leading-6 text-slate-800">{item.body}</p><p className="mt-2 text-xs text-slate-500">{formatDate(item.createdAt)}</p></article>)}</section>}</section>}
  </AppCard>;
}

function roleLabel(role: string) { return role === "DIRECTOR" ? "Удирдлага" : role === "MANAGER" ? "Менежер" : "Ажилтан"; }
function formatDate(value: string) { return new Date(value).toLocaleDateString("mn-MN", { timeZone: "Asia/Ulaanbaatar" }); }
function Summary({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-600">{label}</p><p className="mt-1 font-bold text-slate-900">{value}</p></div>; }
function Notice({ children }: { children: string }) { return <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">{children}</p>; }

function ProgramList({ title, description, items, empty }: { title: string; description: string; items: Array<{ id: string; slug: string; title: string }>; empty: string }) {
  return <section className="space-y-3"><div><SectionHeading>{title}</SectionHeading><Muted className="mt-1">{description}</Muted></div>{items.length ? <div className="grid gap-3 sm:grid-cols-2">{items.map((item) => <Link className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-[#1F6FB2] hover:bg-slate-50" href={`/mind/programs/${item.slug}`} key={item.id}><p className="font-semibold text-slate-900">{item.title}</p><span className="mt-2 inline-flex text-sm font-semibold text-[#1F6FB2]">Нээх →</span></Link>)}</div> : <Notice>{empty}</Notice>}</section>;
}

function DailyProgram({ program, teamMembers }: { program: DailyProgramCard; teamMembers: Props["teamMembers"] }) {
  const [responses, setResponses] = useState<Record<string, string | number | string[]>>(program.responses);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  async function save(complete: boolean) {
    setBusy(true); setMessage(null);
    const response = await fetch("/api/mind/organization/daily", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ programId: program.id, dayNumber: program.dayNumber, responses, complete }) });
    const result = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) { setMessage(result.error === "INVALID_DAILY_RESPONSE" ? "Шаардлагатай асуултуудад зөв хариулна уу." : "Хариултыг хадгалж чадсангүй. Дахин оролдоно уу."); return; }
    setMessage(complete ? "Өдрийг дуусгалаа." : "Ноорог хадгалагдлаа.");
    if (complete) window.location.reload();
  }
  return <article className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-semibold uppercase tracking-wide text-[#1F6FB2]">ӨДӨР {program.dayNumber}</p><h3 className="mt-1 font-semibold text-slate-900">{program.title}</h3></div>{program.completed && <Badge>ДУУССАН</Badge>}</div>
    {program.blocks.map((block) => <DayBlock key={block.id} block={block} responses={responses} setResponses={setResponses} teamMembers={teamMembers} />)}
    {message && <p role="status" className="text-sm text-slate-600">{message}</p>}
    {!program.completed && <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy} onClick={() => save(false)}>Ноорог хадгалах</Button><Button disabled={busy} onClick={() => save(true)}>Өнөөдрийн зүйлсийг дуусгах</Button></div>}
  </article>;
}

function DayBlock({ block, responses, setResponses, teamMembers }: { block: OrganizationDayBlock; responses: Record<string, string | number | string[]>; setResponses: (update: (previous: Record<string, string | number | string[]>) => Record<string, string | number | string[]>) => void; teamMembers: Props["teamMembers"] }) {
  const update = (value: string | number | string[]) => setResponses((previous) => ({ ...previous, [block.id]: value }));
  const label = block.title || block.prompt || block.body || blockTypeLabel(block.type);
  return <section className="rounded-xl bg-slate-50 p-4"><p className="font-medium leading-6 text-slate-900">{label}{block.required && <span className="ml-1 text-red-600" aria-label="заавал">*</span>}</p>{block.body && block.body !== label && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{block.body}</p>}{block.audioUrl && <audio className="mt-3 w-full" controls preload="none" src={block.audioUrl} />}
    {block.responseType === "TEXT" && <textarea className="mt-3 min-h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-[#1F6FB2] focus:ring-2 focus:ring-blue-100" value={typeof responses[block.id] === "string" ? responses[block.id] as string : ""} onChange={(event) => update(event.target.value)} aria-label={label} />}
    {block.responseType === "SCALE" && <div className="mt-3 flex flex-wrap gap-2">{[1,2,3,4,5].map((value) => <button aria-pressed={responses[block.id] === value} className={`size-11 rounded-xl border font-semibold ${responses[block.id] === value ? "border-[#1F6FB2] bg-blue-50 text-[#1F6FB2]" : "border-slate-200 bg-white text-slate-700"}`} key={value} onClick={() => update(value)}>{value}</button>)}</div>}
    {block.responseType === "SINGLE_CHOICE" && <div className="mt-3 space-y-2">{block.options.map((option) => <label className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700" key={option}><input type="radio" name={block.id} checked={responses[block.id] === option} onChange={() => update(option)} />{option}</label>)}</div>}
    {block.responseType === "MULTIPLE_CHOICE" && <div className="mt-3 space-y-2">{block.options.map((option) => { const selected = Array.isArray(responses[block.id]) ? responses[block.id] as string[] : []; return <label className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700" key={option}><input type="checkbox" checked={selected.includes(option)} onChange={(event) => update(event.target.checked ? [...selected, option] : selected.filter((item) => item !== option))} />{option}</label>; })}</div>}
    {block.type === "APPRECIATION" && <AppreciationComposer teamMembers={teamMembers} compact />}
    {block.type === "TASK" && block.responseType === "NONE" && <p className="mt-2 text-xs text-slate-500">Даалгавар</p>}
  </section>;
}

function blockTypeLabel(type: OrganizationDayBlock["type"]) {
  const labels: Record<OrganizationDayBlock["type"], string> = { OYUNSANAA_MESSAGE: "Оюунсанаагийн үг", CHECK_IN: "Сэтгэл санааны check-in", QUESTION: "Асуулт", APPRECIATION: "Талархал", SURPRISE: "Гэнэтийн зүйл", MESSAGE: "Мессеж", AUDIO: "Сонсох дасгал", QUIZ: "Сонжоо", TRAINING: "Сургалт", PROGRAM: "Хөтөлбөр", TASK: "Даалгавар" };
  return labels[type];
}

function AppreciationComposer({ teamMembers, compact = false }: { teamMembers: Props["teamMembers"]; compact?: boolean }) {
  const router = useRouter();
  const [recipientMembershipId, setRecipient] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function send() {
    if (!recipientMembershipId || !body.trim()) { setMessage("Хэнд илгээх, бичвэрээ сонгоно уу."); return; }
    setBusy(true); setMessage(null);
    const response = await fetch("/api/mind/organization/appreciations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipientMembershipId, body }) });
    const result = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) { setMessage("Талархлыг илгээж чадсангүй."); return; }
    setBody(""); setMessage("Талархал илгээгдлээ."); router.refresh();
  }
  return <section className={`rounded-xl border border-slate-200 bg-white ${compact ? "mt-3 p-3" : "p-4"}`}><h3 className="font-semibold text-slate-900">Хамт олонд талархал илгээх</h3>{teamMembers.length ? <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_2fr_auto]"><select aria-label="Хэнд илгээх" className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm" value={recipientMembershipId} onChange={(event) => setRecipient(event.target.value)}><option value="">Хүлээн авагч</option>{teamMembers.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select><input aria-label="Талархлын үг" className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm" maxLength={1000} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Сайхан үгээ бичнэ үү" /><Button disabled={busy} onClick={send}>Илгээх</Button></div> : <Muted className="mt-2">Одоогоор хамт олон бүртгэгдээгүй байна.</Muted>}{message && <p role="status" className="mt-2 text-sm text-slate-600">{message}</p>}</section>;
}
