"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";

function escEmpty(s) {
  return s && String(s).trim() ? String(s) : " ";
}

function paperTheme(templateId) {
  switch (templateId) {
    case "paper-white":
      return { page: "bg-white", border: "border-[#e7d6c7]" };
    case "paper-sky":
      return { page: "bg-[#eaf2ff]", border: "border-[#d4dff3]" };
    case "paper-ice":
      return { page: "bg-[#f1fbff]", border: "border-[#d9edf5]" };
    case "paper-sage":
      return { page: "bg-[#eef7f1]", border: "border-[#d7e6dc]" };
    case "paper-cream":
      return { page: "bg-[#fff7ec]", border: "border-[#ead9c6]" };
    case "paper-lilac":
      return { page: "bg-[#f7f0ff]", border: "border-[#e6daf8]" };
    case "decor-flower":
      return { page: "bg-[#fff6f2]", border: "border-[#edd6c7]" };
    case "side-frame":
      return { page: "bg-[#f6f7fb]", border: "border-[#e0e2f1]" };
    default:
      return { page: "bg-white", border: "border-[rgba(31,111,178,0.25)]" }; // ✅ шар биш
  }
}

/** newline хадгалдаг height split */
function splitTextByHeightPreserveNewlines({ text, measureEl, maxHeight }) {
  const raw = String(text || "").replace(/\r\n/g, "\n");
  if (!raw.trim()) return [""];

  const prefix =
    `<div style="font-size:11px;line-height:1.85;white-space:pre-wrap;word-break:break-word;color:rgba(63,49,40,0.82);">`;
  const suffix = `</div>`;

  const setAndMeasure = (s) => {
    measureEl.innerHTML = `${prefix}${s.replace(/\n/g, "<br/>")}${suffix}`;
    return measureEl.scrollHeight;
  };

  // ✅ ХАМГИЙН ЧУХАЛ ЗАСВАР:
  // Бүх текст нэг блокт багтаж байвал split хийхгүй (богино бичвэр дээр үсрэхийг зогсооно)
  if (setAndMeasure(raw) <= maxHeight) return [raw];

  const parts = [];
  let start = 0;

  while (start < raw.length) {
    let lo = 1;
    let hi = Math.min(6000, raw.length - start);
    let best = 1;

    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const candidate = raw.slice(start, start + mid);
      if (setAndMeasure(candidate) <= maxHeight) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    let cut = start + best;

    // үг таслахгүй
    const windowStart = Math.max(start, cut - 80);
    const window = raw.slice(windowStart, cut);
    const lastWs = Math.max(
      window.lastIndexOf(" "),
      window.lastIndexOf("\n"),
      window.lastIndexOf("\t")
    );
    if (lastWs > -1 && windowStart + lastWs > start + 10) {
      cut = windowStart + lastWs + 1;
    }

    parts.push(raw.slice(start, cut));
    start = cut;
  }

  return parts.length ? parts : [raw];
}

function ImageFrame({ src, alt, aspect = "landscape" }) {
  const hClass =
    aspect === "portrait"
      ? "h-[260px]"
      : aspect === "square"
      ? "h-[240px]"
      : "h-[220px]";

  return (
    <div className="rounded-2xl overflow-hidden border border-[rgba(31,111,178,0.22)] bg-transparent">
      <div className={`${hClass} flex items-center justify-center`}>
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>
    </div>
  );
}

function A4PreviewPage({ children, sectionTitle }) {
  return (
    <div className="relative rounded-2xl border border-[rgba(31,111,178,0.22)] bg-white/80 px-4 py-4 h-[650px] overflow-hidden">
      <div className="absolute bottom-9 left-4 right-4 h-px bg-black/5" />
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
        <div className="mt-3 text-[10px] text-black/35 flex justify-end">
          {sectionTitle}
        </div>
      </div>
    </div>
  );
}

export default function PreviewView({
  A4_WRAPPER,
  sectionTitle,
  templateId,
  previewNotes,
}) {
  const BRAND = "#1F6FB2";

  const wrapperRef = useRef(null);
  const measureTextRef = useRef(null);
  const previewScrollRef = useRef(null);
  const [renderPages, setRenderPages] = useState([]);

  // хэрэглэгч доод тал дээр байна уу?
  const [pinned, setPinned] = useState(true);

  const theme = useMemo(() => paperTheme(templateId), [templateId]);

  const scrollToBottom = useCallback((behavior = "auto") => {
    const el = previewScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  const handleScroll = useCallback(() => {
    const el = previewScrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
    setPinned(distanceFromBottom < 40);
  }, []);

  // ✅ page split
  useEffect(() => {
    if (!measureTextRef.current) return;
    const textEl = measureTextRef.current;

    // ✅ ХАМГИЙН ЧУХАЛ: measure өргөн preview-ийн бичвэрийн бодит өргөнтэй таарах ёстой
    // wrapper width - page padding(16*2) - scroll pr(4~8) гэж ойролцоогоор хасна
    const wrapW = wrapperRef.current?.clientWidth || 420;
    const measuredW = Math.max(240, wrapW - 16 * 2 - 16); // 16*2 padding + жижиг нөөц
    textEl.style.width = `${measuredW}px`;

    const MAX_TEXT_BLOCK = 580;

    const pages = [];
    let page = [];
    let used = 0;

    const pushPage = () => {
      if (page.length) pages.push(page);
      page = [];
      used = 0;
    };

    for (const note of previewNotes || []) {
      const hasTitle = !!(note.title && note.title !== "(гарчиггүй)");
      const hasImg = !!note.imageUrl;
      const caption = note.imageCaption || "";

      const IMG_COST = hasImg
        ? note.imageAspect === "portrait"
          ? 270
          : note.imageAspect === "square"
          ? 250
          : 230
        : 0;

      const TITLE_COST = hasTitle ? 24 : 0;
      const CAPTION_COST = hasImg && caption ? 16 : 0;
      const DATE_COST = 16;

      const availableTextH = Math.max(
        180,
        MAX_TEXT_BLOCK - TITLE_COST - IMG_COST - CAPTION_COST
      );

      const parts = splitTextByHeightPreserveNewlines({
        text: note.content || "",
        measureEl: textEl,
        maxHeight: availableTextH,
      });

      parts.forEach((piece, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === parts.length - 1;

        // хэмжихдээ яг preview-тэй адил style ашиглана
        textEl.innerHTML = `<div style="font-size:11px;line-height:1.85;white-space:pre-wrap;word-break:break-word;color:rgba(63,49,40,0.82);">${escEmpty(
          piece
        ).replace(/\n/g, "<br/>")}</div>`;
        const TEXT_H = textEl.scrollHeight;

        const fragCost =
          TEXT_H +
          (isFirst ? TITLE_COST + IMG_COST + CAPTION_COST : 0) +
          (isLast ? DATE_COST : 0);

        const PAGE_BUDGET = 640;

        if (page.length && used + fragCost > PAGE_BUDGET) pushPage();

        page.push({
          ...note,
          __pieceIndex: idx,
          showTitle: isFirst,
          showImage: isFirst,
          showCaption: isFirst,
          showDate: isLast,
          content: piece,
        });

        used += fragCost;
      });
    }

    pushPage();

    // ✅ Ардаа яг 1 хоосон хуудас үргэлж байлга
    // pages сүүлийнх хоосон биш бол [] нэмнэ
    if (pages.length === 0 || (pages[pages.length - 1] && pages[pages.length - 1].length !== 0)) {
      pages.push([]);
    }
    // Давхар хоосон байвал нэг болго
    while (pages.length > 1 && pages[pages.length - 1].length === 0 && pages[pages.length - 2].length === 0) {
      pages.pop();
    }

    setRenderPages(pages);
  }, [previewNotes]);

  // ✅ Auto-follow: pinned үед л дагана
  useEffect(() => {
    if (!pinned) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => scrollToBottom("auto"));
    });
  }, [renderPages, pinned, scrollToBottom]);

  const pagesToRender = renderPages; // ✅ бид өөрсдөө үргэлж blank нэмдэг болсон

  return (
    <div className="flex justify-center relative">
      <div
        ref={wrapperRef}
        className={`${A4_WRAPPER} ${theme.page} border ${theme.border}`}
      >
        <div className="mb-2 text-[10px] text-black/45 flex items-center justify-between">
          <span>Preview</span>

          {!pinned ? (
            <button
              type="button"
              onClick={() => {
                scrollToBottom("smooth");
                setPinned(true);
              }}
              className="text-[11px] rounded-full px-3 py-1 border"
              style={{
                borderColor: "rgba(31,111,178,0.35)",
                color: BRAND,
                background: "rgba(31,111,178,0.10)",
              }}
            >
              ↓ Доош очих
            </button>
          ) : null}
        </div>

        <div
          ref={previewScrollRef}
          onScroll={handleScroll}
          className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-5 overscroll-contain"
          style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
        >
          {pagesToRender.map((pageNotes, pageIndex) => (
            <A4PreviewPage key={pageIndex} sectionTitle={sectionTitle}>
              <div className="h-full flex flex-col gap-4 pt-2">
                {pageNotes.map((n) => (
                  <div
                    key={`${n.id}-${n.__pieceIndex || 0}`}
                    className="space-y-2"
                  >
                    {n.showTitle && n.title && n.title !== "(гарчиггүй)" ? (
                      <div className="text-[12px] font-semibold text-[#4c3426]">
                        {n.title}
                      </div>
                    ) : null}

                    {n.showImage && n.imageUrl ? (
                      <div className="space-y-2">
                        <ImageFrame
                          src={n.imageUrl}
                          alt="note"
                          aspect={n.imageAspect || "landscape"}
                        />
                        {n.showCaption && n.imageCaption ? (
                          <div className="text-[11px] text-[#6f5a4a] italic">
                            {n.imageCaption}
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="text-[11px] leading-[1.85] text-[#3f3128]/80 whitespace-pre-wrap break-words">
                      {escEmpty(n.content)}
                    </div>

                    {n.showDate ? (
                      <div className="text-[10px] text-[#9b7a5e] flex justify-end">
                        {n.dateLabel || ""}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </A4PreviewPage>
          ))}
        </div>

        <div className="mt-auto pt-2 text-[10px] text-black/35 flex justify-end">
          <span>{sectionTitle}</span>
        </div>
      </div>

      {/* ✅ measure element: width нь useEffect дээр sync хийнэ */}
      <div
        className="absolute -left-[99999px] -top-[99999px] opacity-0 pointer-events-none"
        ref={measureTextRef}
      />
    </div>
  );
}
