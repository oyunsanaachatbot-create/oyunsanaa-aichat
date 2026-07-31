"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AppShell, Button } from "@/components/mind/app-shell";
import { useT } from "@/lib/i18n/provider";

/* ================= CONFIG ================= */
const SECTION_ORDER = [
  "world",
  "memories",
  "notes",
  "happy",
  "letters",
  "difficult",
  "wisdom",
  "complaints",
  "creatives",
  "personals",
];

// Extras (cover/preface/ending) storage
const EXTRAS_KEY = "oyun_ebook_extras_v1";

/* ================= HELPERS ================= */
function safeJsonParse(s, fallback) {
  try {
    const v = JSON.parse(s);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function formatDateLabelISO(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}.${m}.${dd} ${hh}:${mm}`;
}

function escEmpty(s) {
  return s && String(s).trim() ? String(s) : " ";
}

function bgClass(bg) {
  switch (bg) {
    case "white":
      return "bg-white";
    case "sky":
      return "bg-[#edf6ff]";
    case "sage":
      return "bg-[#f2faf6]";
    case "lilac":
      return "bg-[#f7f4ff]";
    default:
      return "bg-[#f8fbff]";
  }
}

/**
 * ✅ Цэвэр, тогтвортой paginate (height хэмжихгүй)
 * - Зурагтай бол бага chars
 * - Үг таслахгүйгээр ойролцоогоор хуваана
 */
function splitTextByChars(text, maxChars) {
  const raw = String(text || "").replace(/\r\n/g, "\n");
  if (!raw.trim()) return [""];
  const out = [];
  let i = 0;

  while (i < raw.length) {
    let end = Math.min(raw.length, i + maxChars);

    // үг таслахгүй
    const windowStart = Math.max(i, end - 80);
    const window = raw.slice(windowStart, end);
    const lastWs = Math.max(
      window.lastIndexOf(" "),
      window.lastIndexOf("\n"),
      window.lastIndexOf("\t")
    );
    if (lastWs > -1 && windowStart + lastWs > i + 30) {
      end = windowStart + lastWs + 1;
    }

    out.push(raw.slice(i, end));
    i = end;
  }

  return out.length ? out : [raw];
}

/* ================= A4 PAGE SHELL ================= */
/**
 * ✅ Энд л хамгийн чухал нь байна:
 * - data-page-id => menu үсрэлт 100% ажиллана
 */
function PageShell({ children, pageNo, rightLabel, pageId, bg }) {
  return (
    <div
      className={[
        "relative aspect-[210/297] w-full overflow-hidden rounded-2xl border border-[#dbe7f3]",
        "shadow-[0_10px_30px_rgba(30,58,95,0.10)]",
        bgClass(bg || "cream"),
      ].join(" ")}
      data-page-id={pageId}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,#1f6fb2_0,transparent_55%),radial-gradient(circle_at_80%_30%,#8eb9dd_0,transparent_60%),radial-gradient(circle_at_40%_90%,#1f6fb2_0,transparent_55%)] opacity-[0.025]" />

      <div className="relative flex h-full flex-col px-6 py-6">
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>

        {/* ✅ ганц footer line */}
        <div className="mt-4">
          <div className="h-px bg-black/10" />
          <div className="mt-2 flex items-center justify-between text-[#7b9ab8] text-[10px]">
            <span>{pageNo ? String(pageNo) : ""}</span>
            <span className="truncate">{rightLabel || ""}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= PAGES ================= */
function CoverPage({ data, b }) {
  const title = data?.title || b.defaultBookTitle;
  const subtitle = data?.subtitle || "";
  const author = data?.author || "";
  const imageUrl = data?.image_data_url || data?.imageDataUrl || "";
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      {imageUrl ? (
        <div className="mb-8 h-40 w-full overflow-hidden rounded-2xl border border-[#cfe0ef] bg-white">
          {/* biome-ignore lint/performance/noImgElement: uploaded cover image */}
          <img
            alt={b.imageAlt}
            className="h-full w-full object-cover"
            height={160}
            src={imageUrl}
            width={640}
          />
        </div>
      ) : null}
      <div className="font-semibold text-[#1e3a5f] text-[30px] leading-tight">
        {title}
      </div>
      {subtitle ? (
        <div className="mt-2 text-[#527393] text-[12px]">{subtitle}</div>
      ) : null}
      {author ? (
        <div className="mt-10 text-[#41627e] text-[12px]">
          {b.authorLabel} <span className="font-semibold">{author}</span>
        </div>
      ) : null}
    </div>
  );
}

function TextPage({ heading, body }) {
  return (
    <div className="flex h-full flex-col">
      <div className="text-center font-semibold text-[#1e3a5f] text-[20px]">
        {heading}
      </div>
      <div className="mt-6 min-h-0 flex-1 overflow-hidden whitespace-pre-wrap break-words text-[#334e68] text-[12px] leading-[1.9]">
        {escEmpty(body)}
      </div>
    </div>
  );
}

function SectionIntroPage({ sectionTitle, b }) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="text-[#4c8bc2] text-[10px] uppercase tracking-[0.34em]">
        {b.subMenuLabel}
      </div>
      <div className="mt-3 font-semibold text-[#1e3a5f] text-[30px]">
        {sectionTitle}
      </div>
    </div>
  );
}

/** ✅ НОМ ДОТОРХ “ГАРЧИГ” ХУУДАС */
function RealTOCPage({ items, onJump, b }) {
  return (
    <div className="flex h-full flex-col">
      <div className="text-center text-[#4c8bc2] text-[12px] uppercase tracking-[0.30em]">
        {b.tocLabel}
      </div>

      <div className="mt-6 min-h-0 flex-1 overflow-hidden">
        <div className="space-y-3">
          {items.map((it) => (
            <button
              className="flex w-full items-center justify-between gap-4 text-[#1e3a5f] text-[13px] hover:opacity-80"
              key={it.id}
              onClick={() => onJump(it.id)}
              type="button"
            >
              <div className="truncate text-left">{it.label}</div>
              <div className="shrink-0 text-[#7b9ab8]">{it.pageNo || ""}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 text-center text-[#527393] text-[11px]">
        {b.tocHint}
      </div>
    </div>
  );
}

function NotePage({
  title,
  content,
  dateLabel,
  imageUrl,
  imageCaption,
  showTitle,
  showImage,
  showCaption,
  showDate,
  editHref,
  b,
}) {
  return (
    <div className="flex h-full flex-col">
      {editHref ? (
        <div className="mb-2 flex justify-end">
          <Link
            className="text-[#1F6FB2] text-[11px] underline"
            href={editHref}
          >
            {b.editLink}
          </Link>
        </div>
      ) : null}

      {showTitle && title ? (
        <div className="mb-3 font-semibold text-[#1e3a5f] text-[14px]">
          {title}
        </div>
      ) : null}

      {showImage && imageUrl ? (
        <div className="mb-3">
          <div className="overflow-hidden rounded-2xl border border-[#cfe0ef] bg-white">
            <div className="flex h-[230px] items-center justify-center">
              {/* biome-ignore lint/performance/noImgElement: uploaded note image */}
              <img
                alt={b.imageAlt}
                className="h-full w-full object-contain"
                draggable={false}
                height={460}
                src={imageUrl}
                width={640}
              />
            </div>
          </div>
          {showCaption && imageCaption ? (
            <div className="mt-2 text-[#527393] text-[11px] italic">
              {imageCaption}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="min-h-0 overflow-hidden whitespace-pre-wrap break-words text-[#334e68] text-[12px] leading-[1.9]">
        {escEmpty(content)}
      </div>

      {showDate && dateLabel ? (
        <div className="mt-3 flex justify-end text-[#7b9ab8] text-[10px]">
          {dateLabel}
        </div>
      ) : null}
    </div>
  );
}

/* ================= BUILD BOOK (CLEAN) ================= */
function buildBookPages({ notesBySection, extras, sectionLabels }) {
  const pages = [];

  // front matter
  pages.push({
    id: "cover",
    kind: "cover",
    rightLabel: "",
    bg: extras?.cover?.bg || "cream",
  });
  pages.push({ id: "toc", kind: "toc", rightLabel: "", bg: "white" });
  pages.push({
    id: "preface",
    kind: "preface",
    rightLabel: "",
    bg: extras?.preface?.bg || "cream",
  });

  for (const sid of SECTION_ORDER) {
    const sectionTitle = sectionLabels[sid];

    // ✅ Section нүүр (энэ pageNo-г л “Гарчиг” дээр харуулна)
    pages.push({
      id: `sec-${sid}`,
      kind: "section",
      sectionId: sid,
      sectionTitle,
      rightLabel: sectionTitle,
      bg: extras?.sectionIntro?.bg || "cream",
    });

    const list = (notesBySection[sid] || []).filter(
      (n) => n?.includeInBook !== false
    );

    for (const n of list) {
      const title = n.title && n.title !== "(гарчиггүй)" ? n.title : "";
      const dateLabel = n.createdAt
        ? formatDateLabelISO(n.createdAt)
        : n.dateLabel || "";
      const hasImg = !!n.imageUrl;
      const hasCaption = !!(n.imageCaption && String(n.imageCaption).trim());

      // ✅ Тогтвортой paginate: зурагтай бол багасгана
      const firstMax = hasImg ? 900 : 1400;
      const nextMax = 1600;

      const firstParts = splitTextByChars(n.content || "", firstMax);
      const allParts =
        firstParts.length <= 1
          ? firstParts
          : [
              firstParts[0],
              ...splitTextByChars(
                (n.content || "").slice(firstParts[0].length),
                nextMax
              ),
            ];

      for (const [idx, piece] of allParts.entries()) {
        const isFirst = idx === 0;
        const isLast = idx === allParts.length - 1;

        pages.push({
          id: `note-${sid}-${n.id || "x"}-${idx}`,
          kind: "note",
          sectionId: sid,
          sectionTitle,
          rightLabel: sectionTitle,
          noteId: n.id,
          note: n,
          piece,
          showTitle: isFirst && !!title,
          showImage: isFirst && hasImg,
          showCaption: isFirst && hasCaption,
          showDate: isLast,
          dateLabel,
          bg: "cream",
        });
      }
    }
  }

  pages.push({
    id: "ending",
    kind: "ending",
    rightLabel: "",
    bg: extras?.ending?.bg || "cream",
  });

  return pages.map((p, i) => ({ ...p, pageNo: i + 1 }));
}

/* ================= MAIN ================= */
export default function EbookPreviewPage() {
  const t = useT();
  const b = t.apps.ebooks.book;
  const sectionLabels = useMemo(() => {
    const out = {};
    for (const sid of SECTION_ORDER) {
      out[sid] = t.apps.ebooks.sections[sid]?.title || sid;
    }
    return out;
  }, [t]);

  const [notesBySection, setNotesBySection] = useState({});
  const [extras, setExtras] = useState(null);

  const scrollRef = useRef(null);
  const [jumpNo, setJumpNo] = useState("");

  const loadAll = useCallback(() => {
    if (typeof window === "undefined") return;

    const bySec = {};
    for (const sid of SECTION_ORDER) {
      const key = `oyun_ebook_notes_${sid}_v1`;
      const raw = window.localStorage.getItem(key);
      const arr = safeJsonParse(raw, []);
      // хуучин→шинэ дараалал (дотор нь буцааж урсгахгүй)
      bySec[sid] = Array.isArray(arr)
        ? arr
            .slice()
            .sort(
              (first, second) =>
                new Date(first.createdAt || 0) - new Date(second.createdAt || 0)
            )
        : [];
    }
    setNotesBySection(bySec);

    const rawExtras = window.localStorage.getItem(EXTRAS_KEY);
    setExtras(safeJsonParse(rawExtras, null));
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const bookPages = useMemo(
    () => buildBookPages({ notesBySection, extras, sectionLabels }),
    [notesBySection, extras, sectionLabels]
  );

  // Desktop болон mobile хувилбар ижил page id-тэй тул зөвхөн харагдаж буй
  // layout доторх хуудсыг олж scroll container-оор үсэрнэ.
  const jumpTo = (id) => {
    const root = scrollRef.current;
    if (!root) return;
    const layout = window.matchMedia("(min-width: 1024px)").matches
      ? "desktop"
      : "mobile";
    const el = root.querySelector(
      `[data-preview-layout="${layout}"] [data-page-id="${id}"]`
    );
    if (!el) return;

    window.requestAnimationFrame(() => {
      const rootRect = root.getBoundingClientRect();
      const elementRect = el.getBoundingClientRect();
      const top = root.scrollTop + elementRect.top - rootRect.top - 16;
      root.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    });
  };

  const jumpToPageNo = (num) => {
    const n = Number(String(num).replace(/[^\d]/g, ""));
    if (!n || n < 1) return;
    const page = bookPages.find((p) => p.pageNo === n);
    if (page) jumpTo(page.id);
  };

  // ✅ “Жинхэнэ гарчиг” дээр section нүүрийн pageNo-г харуулна
  const realTocItems = useMemo(() => {
    const pageNoById = {};
    for (const page of bookPages) {
      pageNoById[page.id] = page.pageNo;
    }

    const items = [
      { id: "cover", label: b.coverPage, pageNo: pageNoById["cover"] },
      { id: "toc", label: b.tocPage, pageNo: pageNoById["toc"] },
      { id: "preface", label: b.forewordPage, pageNo: pageNoById["preface"] },
    ];

    for (const [index, sid] of SECTION_ORDER.entries()) {
      items.push({
        id: `sec-${sid}`,
        label: `${index + 1}. ${sectionLabels[sid]}`,
        pageNo: pageNoById[`sec-${sid}`],
      });
    }

    items.push({
      id: "ending",
      label: b.endingPage,
      pageNo: pageNoById["ending"],
    });

    return items;
  }, [bookPages, b, sectionLabels]);

  // ✅ Зүүн MENU: “хэдэн хуудсын бичвэртэй вэ?” (section intro-г тооцохгүй)
  const navItems = useMemo(() => {
    const countBySection = {};
    for (const sid of SECTION_ORDER) countBySection[sid] = 0;
    for (const page of bookPages) {
      if (page.kind === "note" && page.sectionId)
        countBySection[page.sectionId] =
          (countBySection[page.sectionId] || 0) + 1;
    }

    const items = [
      { id: "cover", label: b.coverPage, right: "" },
      { id: "toc", label: b.tocPage, right: "" },
      { id: "preface", label: b.forewordPage, right: "" },
    ];

    for (const [index, sid] of SECTION_ORDER.entries()) {
      items.push({
        id: `sec-${sid}`, // ✅ дарвал яг тэр хэсгийн нүүр рүү очно
        label: `${index + 1}. ${sectionLabels[sid]}`,
        right: String(countBySection[sid] || 0), // ✅ бичвэрийн хуудасны тоо
      });
    }

    items.push({ id: "ending", label: b.endingPage, right: "" });
    return items;
  }, [bookPages, b, sectionLabels]);

  // ✅ Desktop дээр 2 нүүрээр
  const spread = useMemo(() => {
    const rows = [];
    for (let i = 0; i < bookPages.length; i += 2)
      rows.push([bookPages[i], bookPages[i + 1] || null]);
    return rows;
  }, [bookPages]);

  return (
    <AppShell
      backHref="/mind/ebooks"
      subtitle={b.desktopHint}
      title={t.apps.ebooks.write.preview}
      width="full"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-4">
          <Button href="/mind/ebooks/extras" variant="ghost">
            {b.otherSections}
          </Button>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[340px_1fr]">
          {/* LEFT MENU */}
          <aside className="hidden lg:block">
            <div className="sticky top-6">
              <NavPanel
                b={b}
                items={navItems}
                jumpNo={jumpNo}
                onJump={(id) => jumpTo(id)}
                onJumpPageNo={() => jumpToPageNo(jumpNo)}
                setJumpNo={setJumpNo}
              />
            </div>
          </aside>

          {/* MOBILE MENU */}
          <div className="mb-3 lg:hidden">
            <NavPanel
              b={b}
              items={navItems}
              jumpNo={jumpNo}
              onJump={(id) => jumpTo(id)}
              onJumpPageNo={() => jumpToPageNo(jumpNo)}
              setJumpNo={setJumpNo}
            />
          </div>

          {/* BOOK */}
          <main>
            <div className="overflow-hidden rounded-[32px] border border-[#dbe7f3] bg-[#f1f6fb] shadow-sm">
              {/* spine */}
              <div className="relative">
                <div className="absolute top-0 bottom-0 left-1/2 hidden w-[2px] bg-[#cfe0ef] lg:block" />
                <div className="-translate-x-1/2 absolute top-0 bottom-0 left-1/2 hidden w-[18px] bg-gradient-to-r from-[#1f6fb2]/10 via-transparent to-[#1f6fb2]/10 lg:block" />
              </div>

              {/* ✅ scroll container (эндээс л үсэрнэ) */}
              <div
                className="max-h-[78vh] space-y-6 overflow-y-auto p-4 sm:p-6"
                ref={scrollRef}
              >
                {/* Desktop: 2 нүүр */}
                <div
                  className="hidden space-y-6 lg:block"
                  data-preview-layout="desktop"
                >
                  {spread.map(([L, R]) => (
                    <div className="grid grid-cols-2 gap-6" key={L.id}>
                      <PageShell
                        bg={L.bg}
                        pageId={L.id}
                        pageNo={L.pageNo}
                        rightLabel={L.rightLabel}
                      >
                        {renderBookPage({
                          b,
                          extras,
                          jumpTo,
                          page: L,
                          realTocItems,
                        })}
                      </PageShell>

                      {R ? (
                        <PageShell
                          bg={R.bg}
                          pageId={R.id}
                          pageNo={R.pageNo}
                          rightLabel={R.rightLabel}
                        >
                          {renderBookPage({
                            b,
                            extras,
                            jumpTo,
                            page: R,
                            realTocItems,
                          })}
                        </PageShell>
                      ) : (
                        <div className="aspect-[210/297] w-full" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Mobile: 1 нүүр */}
                <div
                  className="space-y-5 lg:hidden"
                  data-preview-layout="mobile"
                >
                  {bookPages.map((p) => (
                    <PageShell
                      bg={p.bg}
                      key={p.id}
                      pageId={p.id}
                      pageNo={p.pageNo}
                      rightLabel={p.rightLabel}
                    >
                      {renderBookPage({
                        b,
                        extras,
                        jumpTo,
                        page: p,
                        realTocItems,
                      })}
                    </PageShell>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-3 text-[#64748b] text-[11px]">
              {b.desktopHint}
            </div>
          </main>
        </div>
      </div>
    </AppShell>
  );
}

/* ================= LEFT MENU ================= */
function NavPanel({ items, onJump, jumpNo, setJumpNo, onJumpPageNo, b }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-[#64748b] text-[11px] uppercase tracking-[0.22em]">
        {b.menu}
      </div>

      {/* pageNo jump */}
      <div className="mt-3 flex items-center gap-2">
        <input
          className="w-[120px] rounded-2xl border border-[#e2e8f0] bg-white/95 px-3 py-2 text-[12px] outline-none focus:border-transparent focus:ring-2 focus:ring-[rgba(31,111,178,0.35)]"
          onChange={(e) => setJumpNo(e.target.value)}
          placeholder={b.pageNoPlaceholder}
          value={jumpNo}
        />
        <button
          className="rounded-2xl border border-[#cbd5e1] bg-white px-3 py-2 text-[#334155] text-[12px] hover:bg-[#f8fafc]"
          onClick={onJumpPageNo}
          type="button"
        >
          {b.jump}
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {items.map((it) => (
          <button
            className="flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2 text-left text-[#0f172a] text-[13px] hover:bg-[#f8fafc]"
            key={it.id}
            onClick={() => onJump(it.id)}
            type="button"
          >
            <span>→ {it.label}</span>
            <span className="text-[#94a3b8] text-[11px]">{it.right || ""}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 text-[#94a3b8] text-[11px]">{b.jumpHint}</div>
    </div>
  );
}

/* ================= RENDER ================= */
function renderBookPage({ page, extras, realTocItems, jumpTo, b }) {
  if (page.kind === "cover") return <CoverPage b={b} data={extras?.cover} />;
  if (page.kind === "toc")
    return (
      <RealTOCPage b={b} items={realTocItems} onJump={(id) => jumpTo(id)} />
    );
  if (page.kind === "preface")
    return (
      <TextPage
        body={extras?.preface?.body || ""}
        heading={extras?.preface?.heading || b.forewordPage}
      />
    );
  if (page.kind === "ending")
    return (
      <TextPage
        body={extras?.ending?.body || ""}
        heading={extras?.ending?.heading || b.endingPage}
      />
    );
  if (page.kind === "section")
    return <SectionIntroPage b={b} sectionTitle={page.sectionTitle} />;

  if (page.kind === "note") {
    const n = page.note || {};
    const title = n.title && n.title !== "(гарчиггүй)" ? n.title : "";
    const editHref =
      page.sectionId && page.noteId
        ? `/mind/ebooks/${page.sectionId}?edit=${page.noteId}`
        : null;

    return (
      <NotePage
        b={b}
        content={page.piece || ""}
        dateLabel={page.dateLabel || ""}
        editHref={editHref}
        imageCaption={n.imageCaption || ""}
        imageUrl={n.imageUrl || ""}
        showCaption={!!page.showCaption}
        showDate={!!page.showDate}
        showImage={!!page.showImage}
        showTitle={!!page.showTitle}
        title={title}
      />
    );
  }

  return null;
}
