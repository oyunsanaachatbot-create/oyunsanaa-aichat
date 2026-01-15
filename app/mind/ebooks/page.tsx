"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import styles from "./ebook.module.css";

type Cat = {
  id: string;
  title: string;
  sub: string;
  img: string;
  href: string;
  kind: "section" | "extras" | "preview";
};

const BRAND = "#1F6FB2";

/** ✅ SECTION ids нь Preview дээрх SECTION_ORDER-той 1:1 таарах ёстой */
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
] as const;

const SECTION_LABELS: Record<(typeof SECTION_ORDER)[number], string> = {
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

const CATS: Cat[] = [
  {
    id: "world",
    title: "Миний ертөнц",
    sub: "Миний бодол, дотоод ертөнц",
    img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&h=600&fit=crop",
    href: "/mind/ebooks/world",
    kind: "section",
  },
  {
    id: "memories",
    title: "Амьдралын дурсамж",
    sub: "Эргэн дурсах түүх",
    img: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=900&h=600&fit=crop",
    href: "/mind/ebooks/memories",
    kind: "section",
  },
  {
    id: "notes",
    title: "Тэмдэглэл",
    sub: "Өдөр тутмын бодол, санаа",
    img: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=900&h=600&fit=crop",
    href: "/mind/ebooks/notes",
    kind: "section",
  },
  {
    id: "happy",
    title: "Талархал · Баярт мөч",
    sub: "Сэтгэл дулаацуулсан агшнууд",
    img: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=900&h=600&fit=crop",
    href: "/mind/ebooks/happy",
    kind: "section",
  },
  {
    id: "letters",
    title: "Захидал",
    sub: "Хайртай хүмүүстээ бичих үгс",
    img: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=900&h=600&fit=crop",
    href: "/mind/ebooks/letters",
    kind: "section",
  },
  {
    id: "difficult",
    title: "Хүнд хэцүү үе",
    sub: "Бэрхшээл, сорилт, даван туулах",
    img: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=900&h=600&fit=crop",
    href: "/mind/ebooks/difficult",
    kind: "section",
  },
  {
    id: "wisdom",
    title: "Ухаарал · Сургамж",
    sub: "Амьдралаас ойлгосон зүйлс",
    img: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=900&h=600&fit=crop",
    href: "/mind/ebooks/wisdom",
    kind: "section",
  },
  {
    id: "complaints",
    title: "Гомдол ба харуусал",
    sub: "Сэтгэлээ илэн далангүй бичих орон зай",
    img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&h=600&fit=crop",
    href: "/mind/ebooks/complaints",
    kind: "section",
  },
  {
    id: "creatives",
    title: "Миний уран бүтээл",
    sub: "Шүлэг, өгүүллэг, санаа, бүтээл",
    img: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=900&h=600&fit=crop",
    href: "/mind/ebooks/creatives",
    kind: "section",
  },
  {
    id: "personals",
    title: "Миний булан",
    sub: "Ямар ч сэдвээр чөлөөтэй бичих хэсэг",
    img: "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=900&h=600&fit=crop",
    href: "/mind/ebooks/personals",
    kind: "section",
  },
  {
    id: "extras",
    title: "Номын бусад хэсэг",
    sub: "Тусгай бүлэг, нэмэлт хуудас",
    img: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=900&h=600&fit=crop",
    href: "/mind/ebooks/extras",
    kind: "extras",
  },
  {
    id: "preview",
    title: "Эх бэлтгэл",
    sub: "Ном хэрхэн харагдаж байгааг харах",
    img: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900&h=600&fit=crop",
    href: "/mind/ebooks/preview",
    kind: "preview",
  },
];

/* ================= HELPERS ================= */
function safeJsonParse<T>(s: string | null, fallback: T): T {
  try {
    const v = JSON.parse(s || "");
    return (v ?? fallback) as T;
  } catch {
    return fallback;
  }
}
function escEmpty(s: any) {
  return s && String(s).trim() ? String(s) : " ";
}

function splitTextByHeightPreserveNewlines({
  text,
  measureEl,
  maxHeight,
}: {
  text: string;
  measureEl: HTMLDivElement;
  maxHeight: number;
}) {
  const raw = String(text || "").replace(/\r\n/g, "\n");
  if (!raw.trim()) return [""];

  const prefix =
    `<div style="font-size:12px;line-height:1.9;white-space:pre-wrap;word-break:break-word;color:#3f3128;">`;
  const suffix = `</div>`;

  const setAndMeasure = (s: string) => {
    measureEl.innerHTML = `${prefix}${escEmpty(s).replace(/\n/g, "<br/>")}${suffix}`;
    return measureEl.scrollHeight;
  };

  const parts: string[] = [];
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
    const windowStart = Math.max(start, cut - 80);
    const window = raw.slice(windowStart, cut);
    const lastWs = Math.max(
      window.lastIndexOf(" "),
      window.lastIndexOf("\n"),
      window.lastIndexOf("\t")
    );
    if (lastWs > -1 && windowStart + lastWs > start + 12) {
      cut = windowStart + lastWs + 1;
    }

    parts.push(raw.slice(start, cut));
    start = cut;
  }

  return parts.length ? parts : [raw];
}

function computePagesForSection(notes: any[], measureEl: HTMLDivElement): number {
  const TEXT_MAX = 520;
  let count = 0;

  const list = (notes || []).filter((n) => n?.includeInBook !== false);

  list.forEach((n) => {
    const title = n?.title && n.title !== "(гарчиггүй)" ? String(n.title) : "";
    const hasImg = !!n?.imageUrl;
    const hasCaption = !!(n?.imageCaption && String(n.imageCaption).trim());

    const firstTextMax =
      TEXT_MAX - (hasImg ? 250 : 0) - (hasCaption ? 30 : 0) - (title ? 30 : 0) - 10;

    const content = String(n?.content || "");

    const firstParts = splitTextByHeightPreserveNewlines({
      text: content,
      measureEl,
      maxHeight: Math.max(200, firstTextMax),
    });

    if (firstParts.length <= 1) {
      count += 1;
      return;
    }

    const firstPiece = firstParts[0];
    const rest = content.slice(firstPiece.length);

    const restParts = splitTextByHeightPreserveNewlines({
      text: rest,
      measureEl,
      maxHeight: TEXT_MAX,
    });

    const totalPages = 1 + restParts.filter((x) => x !== "").length;
    count += totalPages;
  });

  return count;
}

export default function EbookHome() {
  const [notesBySection, setNotesBySection] = useState<Record<string, any[]>>({});
  const measureRef = useRef<HTMLDivElement | null>(null);
  const [measureReady, setMeasureReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const obj: Record<string, any[]> = {};
    SECTION_ORDER.forEach((sid) => {
      const key = `oyun_ebook_notes_${sid}_v1`;
      obj[sid] = safeJsonParse<any[]>(window.localStorage.getItem(key), []);
    });
    setNotesBySection(obj);
  }, []);

  useEffect(() => {
    if (measureRef.current) setMeasureReady(true);
  }, []);

  const pageCountBySection = useMemo(() => {
    const out: Record<string, number> = {};
    if (!measureReady || !measureRef.current) return out;

    SECTION_ORDER.forEach((sid) => {
      out[sid] = computePagesForSection(notesBySection[sid] || [], measureRef.current!);
    });

    out["extras"] = 0;
    out["preview"] = 0;

    return out;
  }, [notesBySection, measureReady]);

  return (
    <main className={styles.ebookBody} style={{ ["--brand" as any]: BRAND }}>
      <div className={styles.container}>
        <div className={styles.topbar}>
          <Link href="/" className={styles.pill}>
            ← Чат руу буцах
          </Link>

          <div className={styles.brandDot} aria-hidden />
          <span className={styles.brandText}>Ebook</span>
        </div>

        <h1 className={styles.mainTitle}>Номын агуулга</h1>
        <p className={styles.subtitle}>
          Та доорх карт бүр дээр дараад тухайн сэдвийн хуудас дээр сэтгэлээ бичээрэй.
        </p>

        <div className={styles.categoriesGrid}>
          {CATS.map((c) => {
            const pages = pageCountBySection[c.id] ?? 0;

            return (
              <Link key={c.id} href={c.href} className={styles.categoryCard}>
                <div className={styles.catThumb}>
                  <img src={c.img} alt={c.title} />
                </div>

                <h4>{c.title}</h4>
                <div className={styles.categorySub}>{c.sub}</div>

                <span className={styles.pageIndicator}>
                  {c.kind === "section" ? `${pages} хуудас` : "Нээх"}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div
        ref={measureRef}
        className="fixed -left-[99999px] -top-[99999px] w-[420px] opacity-0 pointer-events-none"
      />
    </main>
  );
}
