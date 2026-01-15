"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

/* ================= CONFIG ================= */
const SECTION_LABELS = {
  world: "Миний ертөнц",
  memories: "Амьдралын дурсамж",
  notes: "Тэмдэглэл",
  happy: "Талархал · Баярт мөч",
  letters: "Захидал",
  difficult: "Хүнд үе",
  wisdom: "Ухаарал · Сургамж",
  complaints: "Гомдол ба харуусал",
  creatives: "Миний уран бүтээл",
  personals: "Миний булан",
};

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
      return "bg-[#eaf2ff]";
    case "sage":
      return "bg-[#eef7f1]";
    case "lilac":
      return "bg-[#f7f0ff]";
    case "cream":
    default:
      return "bg-[#fffaf4]";
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
    const lastWs = Math.max(window.lastIndexOf(" "), window.lastIndexOf("\n"), window.lastIndexOf("\t"));
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
      data-page-id={pageId}
      className={[
        "relative w-full aspect-[210/297] border border-[#ead7c8] rounded-2xl overflow-hidden",
        "shadow-[0_10px_30px_rgba(0,0,0,0.10)]",
        bgClass(bg || "cream"),
      ].join(" ")}
    >
      <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle_at_20%_10%,#000_0,transparent_55%),radial-gradient(circle_at_80%_30%,#000_0,transparent_60%),radial-gradient(circle_at_40%_90%,#000_0,transparent_55%)]" />

      <div className="relative h-full flex flex-col px-6 py-6">
        <div className="flex-1 min-h-0 overflow-hidden">{children}</div>

        {/* ✅ ганц footer line */}
        <div className="mt-4">
          <div className="h-px bg-black/10" />
          <div className="mt-2 text-[10px] text-[#b79b85] flex items-center justify-between">
            <span>{pageNo ? String(pageNo) : ""}</span>
            <span className="truncate">{rightLabel || ""}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= PAGES ================= */
function CoverPage({ data }) {
  const title = data?.title || "Миний ном";
  const subtitle = data?.subtitle || "";
  const author = data?.author || "";
  return (
    <div className="h-full flex flex-col justify-center items-center text-center">
      <div className="text-[30px] font-semibold text-[#4c3426] leading-tight">{title}</div>
      {subtitle ? <div className="mt-2 text-[12px] text-[#7b6150]">{subtitle}</div> : null}
      {author ? (
        <div className="mt-10 text-[12px] text-[#6f5a4a]">
          Зохиогч: <span className="font-semibold">{author}</span>
        </div>
      ) : null}
    </div>
  );
}

function TextPage({ heading, body }) {
  return (
    <div className="h-full flex flex-col">
      <div className="text-[20px] font-semibold text-[#4c3426] text-center">{heading}</div>
      <div className="mt-6 flex-1 min-h-0 overflow-hidden text-[12px] leading-[1.9] text-[#3f3128] whitespace-pre-wrap break-words">
        {escEmpty(body)}
      </div>
    </div>
  );
}

function SectionIntroPage({ sectionTitle }) {
  return (
    <div className="h-full flex flex-col justify-center items-center text-center">
      <div className="text-[10px] tracking-[0.34em] uppercase text-[#b38466]">ДЭД МЭНЮ</div>
      <div className="mt-3 text-[30px] font-semibold text-[#4c3426]">{sectionTitle}</div>
    </div>
  );
}

/** ✅ НОМ ДОТОРХ “ГАРЧИГ” ХУУДАС */
function RealTOCPage({ items, onJump }) {
  return (
    <div className="h-full flex flex-col">
      <div className="text-[12px] tracking-[0.30em] uppercase text-[#b38466] text-center">
        ГАРЧИГ
      </div>

      <div className="mt-6 flex-1 min-h-0 overflow-hidden">
        <div className="space-y-3">
          {items.map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() => onJump(it.id)}
              className="w-full flex items-center justify-between gap-4 text-[13px] text-[#4c3426] hover:opacity-80"
            >
              <div className="truncate text-left">{it.label}</div>
              <div className="shrink-0 text-[#b79b85]">{it.pageNo || ""}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 text-[11px] text-[#9b7a5e] text-center">
        Дарахад ном дотор шууд тэр хуудсанд үсэрнэ.
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
}) {
  return (
    <div className="h-full flex flex-col">
      {editHref ? (
        <div className="flex justify-end mb-2">
          <Link href={editHref} className="text-[11px] text-[#a36a46] underline">
            Засах
          </Link>
        </div>
      ) : null}

      {showTitle && title ? (
        <div className="text-[14px] font-semibold text-[#4c3426] mb-3">{title}</div>
      ) : null}

      {showImage && imageUrl ? (
        <div className="mb-3">
          <div className="rounded-2xl border border-[#e0c7b4] overflow-hidden bg-white">
            <div className="h-[230px] flex items-center justify-center">
              <img src={imageUrl} alt="зураг" className="w-full h-full object-contain" draggable={false} />
            </div>
          </div>
          {showCaption && imageCaption ? (
            <div className="mt-2 text-[11px] italic text-[#6f5a4a]">{imageCaption}</div>
          ) : null}
        </div>
      ) : null}

      <div className="flex-1 min-h-0 overflow-hidden text-[12px] leading-[1.9] text-[#3f3128] whitespace-pre-wrap break-words">
        {escEmpty(content)}
      </div>

      {showDate && dateLabel ? (
        <div className="mt-3 text-[10px] text-[#9b7a5e] flex justify-end">{dateLabel}</div>
      ) : null}
    </div>
  );
}

/* ================= BUILD BOOK (CLEAN) ================= */
function buildBookPages({ notesBySection, extras }) {
  const pages = [];

  // front matter
  pages.push({ id: "cover", kind: "cover", rightLabel: "", bg: extras?.cover?.bg || "cream" });
  pages.push({ id: "toc", kind: "toc", rightLabel: "", bg: "white" });
  pages.push({ id: "preface", kind: "preface", rightLabel: "", bg: extras?.preface?.bg || "cream" });

  SECTION_ORDER.forEach((sid) => {
    const sectionTitle = SECTION_LABELS[sid];

    // ✅ Section нүүр (энэ pageNo-г л “Гарчиг” дээр харуулна)
    pages.push({
      id: `sec-${sid}`,
      kind: "section",
      sectionId: sid,
      sectionTitle,
      rightLabel: sectionTitle,
      bg: extras?.sectionIntro?.bg || "cream",
    });

    const list = (notesBySection[sid] || []).filter((n) => n?.includeInBook !== false);

    list.forEach((n) => {
      const title = n.title && n.title !== "(гарчиггүй)" ? n.title : "";
      const dateLabel = n.createdAt ? formatDateLabelISO(n.createdAt) : (n.dateLabel || "");
      const hasImg = !!n.imageUrl;
      const hasCaption = !!(n.imageCaption && String(n.imageCaption).trim());

      // ✅ Тогтвортой paginate: зурагтай бол багасгана
      const firstMax = hasImg ? 900 : 1400;
      const nextMax = 1600;

      const firstParts = splitTextByChars(n.content || "", firstMax);
      const allParts =
        firstParts.length <= 1
          ? firstParts
          : [firstParts[0], ...splitTextByChars((n.content || "").slice(firstParts[0].length), nextMax)];

      allParts.forEach((piece, idx) => {
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
      });
    });
  });

  pages.push({ id: "ending", kind: "ending", rightLabel: "", bg: extras?.ending?.bg || "cream" });

  return pages.map((p, i) => ({ ...p, pageNo: i + 1 }));
}

/* ================= MAIN ================= */
export default function EbookPreviewPage() {
  const [notesBySection, setNotesBySection] = useState({});
  const [extras, setExtras] = useState(null);

  const scrollRef = useRef(null);
  const [jumpNo, setJumpNo] = useState("");

  const loadAll = () => {
    if (typeof window === "undefined") return;

    const bySec = {};
    SECTION_ORDER.forEach((sid) => {
      const key = `oyun_ebook_notes_${sid}_v1`;
      const raw = window.localStorage.getItem(key);
      const arr = safeJsonParse(raw, []);
      // хуучин→шинэ дараалал (дотор нь буцааж урсгахгүй)
      bySec[sid] = Array.isArray(arr)
        ? arr.slice().sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
        : [];
    });
    setNotesBySection(bySec);

    const rawExtras = window.localStorage.getItem(EXTRAS_KEY);
    setExtras(safeJsonParse(rawExtras, null));
  };

  useEffect(() => {
    loadAll();
  }, []);

  const bookPages = useMemo(() => buildBookPages({ notesBySection, extras }), [notesBySection, extras]);

  // ✅ 100% найдвартай үсрэлт: data-page-id + offsetTop (scroll container дотор)
  const jumpTo = (id) => {
    const root = scrollRef.current;
    if (!root) return;
    const el = root.querySelector(`[data-page-id="${id}"]`);
    if (!el) return;
    root.scrollTo({ top: Math.max(0, el.offsetTop - 16), behavior: "smooth" });
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
    bookPages.forEach((p) => (pageNoById[p.id] = p.pageNo));

    const items = [
      { id: "cover", label: "Нүүр хуудас", pageNo: pageNoById["cover"] },
      { id: "toc", label: "Гарчиг", pageNo: pageNoById["toc"] },
      { id: "preface", label: "Зохиогчийн үг", pageNo: pageNoById["preface"] },
    ];

    SECTION_ORDER.forEach((sid) => {
      items.push({
        id: `sec-${sid}`,
        label: SECTION_LABELS[sid],
        pageNo: pageNoById[`sec-${sid}`],
      });
    });

    items.push({ id: "ending", label: "Төгсгөлийн үг", pageNo: pageNoById["ending"] });

    return items;
  }, [bookPages]);

  // ✅ Зүүн MENU: “хэдэн хуудсын бичвэртэй вэ?” (section intro-г тооцохгүй)
  const navItems = useMemo(() => {
    const countBySection = {};
    SECTION_ORDER.forEach((sid) => (countBySection[sid] = 0));
    bookPages.forEach((p) => {
      if (p.kind === "note" && p.sectionId) countBySection[p.sectionId] = (countBySection[p.sectionId] || 0) + 1;
    });

    const items = [
      { id: "cover", label: "Нүүр хуудас", right: "" },
      { id: "toc", label: "Гарчиг", right: "" },
      { id: "preface", label: "Зохиогчийн үг", right: "" },
    ];

    SECTION_ORDER.forEach((sid) => {
      items.push({
        id: `sec-${sid}`,               // ✅ дарвал яг тэр хэсгийн нүүр рүү очно
        label: SECTION_LABELS[sid],
        right: String(countBySection[sid] || 0), // ✅ бичвэрийн хуудасны тоо
      });
    });

    items.push({ id: "ending", label: "Төгсгөлийн үг", right: "" });
    return items;
  }, [bookPages]);

  // ✅ Desktop дээр 2 нүүрээр
  const spread = useMemo(() => {
    const rows = [];
    for (let i = 0; i < bookPages.length; i += 2) rows.push([bookPages[i], bookPages[i + 1] || null]);
    return rows;
  }, [bookPages]);

  return (
    <div className="min-h-screen bg-[#f6eee7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* TOP BAR (буцаад “алга болдог” асуудлыг энд байх ёстойгоор нь буцааж өгсөн) */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <Link href="/">
            <button className="rounded-full border border-[#e3c2a3] bg-white/80 text-[#6b4a33] text-xs px-4 py-1.5 shadow-sm hover:bg-white">
              ← Чат руу буцах
            </button>
          </Link>

          <Link href="/mind/ebooks">
            <button className="rounded-full border border-[#e3c2a3] bg-white/80 text-[#6b4a33] text-xs px-4 py-1.5 shadow-sm hover:bg-white">
              ← Бичвэр бичих хэсэг
            </button>
          </Link>

          <Link href="/mind/ebooks/extras">
            <button className="rounded-full border border-[#e3c2a3] bg-white/80 text-[#6b4a33] text-xs px-4 py-1.5 shadow-sm hover:bg-white">
              Номын бусад хэсэг
            </button>
          </Link>

          <button
            type="button"
            onClick={loadAll}
            className="rounded-full border border-[#e3c2a3] bg-white/80 text-[#6b4a33] text-xs px-4 py-1.5 shadow-sm hover:bg-white"
          >
            ↻ Шинэчлэх
          </button>

          <button
            type="button"
            onClick={() => window.print?.()}
            className="rounded-full border border-[#e3c2a3] bg-white text-[#6b4a33] text-xs px-4 py-1.5 shadow-[0_10px_26px_rgba(0,0,0,0.14)] hover:bg-white"
          >
            🖨️ Хэвлэх
          </button>

          <span className="ml-auto text-[11px] tracking-[0.25em] uppercase text-[#b38466]">
            Эх бэлтгэл
          </span>
        </div>

        <div className="grid lg:grid-cols-[340px_1fr] gap-6 items-start">
          {/* LEFT MENU */}
          <aside className="hidden lg:block">
            <div className="sticky top-6">
              <NavPanel
                items={navItems}
                jumpNo={jumpNo}
                setJumpNo={setJumpNo}
                onJump={(id) => jumpTo(id)}
                onJumpPageNo={() => jumpToPageNo(jumpNo)}
              />
            </div>
          </aside>

          {/* MOBILE MENU */}
          <div className="lg:hidden mb-3">
            <NavPanel
              items={navItems}
              jumpNo={jumpNo}
              setJumpNo={setJumpNo}
              onJump={(id) => jumpTo(id)}
              onJumpPageNo={() => jumpToPageNo(jumpNo)}
            />
          </div>

          {/* BOOK */}
          <main>
            <div className="rounded-[32px] border border-[#ead2bf] bg-[#fbf3ec] shadow-[0_18px_55px_rgba(0,0,0,0.14)] overflow-hidden">
              {/* spine */}
              <div className="relative">
                <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-black/10 hidden lg:block" />
                <div className="absolute left-1/2 top-0 bottom-0 w-[18px] -translate-x-1/2 bg-gradient-to-r from-black/5 via-transparent to-black/5 hidden lg:block" />
              </div>

              {/* ✅ scroll container (эндээс л үсэрнэ) */}
              <div ref={scrollRef} className="max-h-[78vh] overflow-y-auto p-4 sm:p-6 space-y-6">
                {/* Desktop: 2 нүүр */}
                <div className="hidden lg:block space-y-6">
                  {spread.map(([L, R], idx) => (
                    <div key={idx} className="grid grid-cols-2 gap-6">
                      <PageShell pageId={L.id} pageNo={L.pageNo} rightLabel={L.rightLabel} bg={L.bg}>
                        {renderBookPage(L, extras, realTocItems, jumpTo)}
                      </PageShell>

                      {R ? (
                        <PageShell pageId={R.id} pageNo={R.pageNo} rightLabel={R.rightLabel} bg={R.bg}>
                          {renderBookPage(R, extras, realTocItems, jumpTo)}
                        </PageShell>
                      ) : (
                        <div className="w-full aspect-[210/297]" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Mobile: 1 нүүр */}
                <div className="lg:hidden space-y-5">
                  {bookPages.map((p) => (
                    <PageShell key={p.id} pageId={p.id} pageNo={p.pageNo} rightLabel={p.rightLabel} bg={p.bg}>
                      {renderBookPage(p, extras, realTocItems, jumpTo)}
                    </PageShell>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-[#9b7a5e]">
              Комп дээр 2 нүүр зэрэг, гар утсан дээр 1 нүүрээр урсана.
            </div>
          </main>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ================= LEFT MENU ================= */
function NavPanel({ items, onJump, jumpNo, setJumpNo, onJumpPageNo }) {
  return (
    <div className="rounded-3xl border border-[#ead2bf] bg-white/85 shadow-[0_16px_40px_rgba(0,0,0,0.10)] p-4">
      <div className="text-[11px] uppercase tracking-[0.22em] text-[#b38466]">Меню</div>

      {/* pageNo jump */}
      <div className="mt-3 flex items-center gap-2">
        <input
          value={jumpNo}
          onChange={(e) => setJumpNo(e.target.value)}
          placeholder="Хуудас №"
          className="w-[120px] rounded-2xl border border-[#ecd7c5] bg-white/95 text-[12px] px-3 py-2 outline-none focus:ring-2 focus:ring-[#d69b6d] focus:border-transparent"
        />
        <button
          type="button"
          onClick={onJumpPageNo}
          className="rounded-2xl border border-[#e3c2a3] bg-white text-[#6b4a33] text-[12px] px-3 py-2 hover:bg-[#fff7f0]"
        >
          Үсрэх
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => onJump(it.id)}
            className="w-full text-left rounded-2xl px-3 py-2 hover:bg-[#fff7f0] text-[13px] text-[#4c3426] flex items-center justify-between gap-3"
          >
            <span>→ {it.label}</span>
            <span className="text-[11px] text-[#b79b85]">{it.right || ""}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 text-[11px] text-[#9b7a5e]">
        Меню дээр дарвал эх бэлтгэл дотор шууд тэр хэсгийн нүүр рүү үсэрнэ.
      </div>
    </div>
  );
}

/* ================= RENDER ================= */
function renderBookPage(page, extras, realTocItems, jumpTo) {
  if (page.kind === "cover") return <CoverPage data={extras?.cover} />;
  if (page.kind === "toc") return <RealTOCPage items={realTocItems} onJump={(id) => jumpTo(id)} />;
  if (page.kind === "preface") return <TextPage heading={extras?.preface?.heading || "Зохиогчийн үг"} body={extras?.preface?.body || ""} />;
  if (page.kind === "ending") return <TextPage heading={extras?.ending?.heading || "Төгсгөлийн үг"} body={extras?.ending?.body || ""} />;
  if (page.kind === "section") return <SectionIntroPage sectionTitle={page.sectionTitle} />;

  if (page.kind === "note") {
    const n = page.note || {};
    const title = n.title && n.title !== "(гарчиггүй)" ? n.title : "";
    const editHref =
      page.sectionId && page.noteId ? `/mind/ebooks/${page.sectionId}?edit=${page.noteId}` : null;

    return (
      <NotePage
        title={title}
        content={page.piece || ""}
        dateLabel={page.dateLabel || ""}
        imageUrl={n.imageUrl || ""}
        imageCaption={n.imageCaption || ""}
        showTitle={!!page.showTitle}
        showImage={!!page.showImage}
        showCaption={!!page.showCaption}
        showDate={!!page.showDate}
        editHref={editHref}
      />
    );
  }

  return null;
}
