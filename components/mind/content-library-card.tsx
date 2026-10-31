"use client";

import Link from "next/link";
import { Heart, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./content-library-card.module.css";

export type ContentLibraryCardItem = {
  id: string; storageId?: string; title: string; summary?: string | null;
  href: string; kind: string; kindLabel: string; price?: number | null;
  imageUrl?: string | null; duration?: string; used?: boolean; statusLabel?: string;
  externalKey?: string;
};
export const CONTENT_SAVED_KEY = "oyunsanaa:website:saved";
export const CONTENT_SAVED_EVENT = "oyunsanaa:website:saved-changed";
export function readContentSaved(): string[] {
  try { const value: unknown = JSON.parse(localStorage.getItem(CONTENT_SAVED_KEY) || "[]"); return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : []; }
  catch { return []; }
}
export function useContentSaved() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    const sync = () => setIds(readContentSaved());
    sync(); window.addEventListener("storage", sync); window.addEventListener(CONTENT_SAVED_EVENT, sync);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener(CONTENT_SAVED_EVENT, sync); };
  }, []);
  return ids;
}
export function ContentLibraryCard({ item }: { item: ContentLibraryCardItem }) {
  const savedIds = useContentSaved();
  const [error, setError] = useState("");
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const storageId = item.storageId || item.id;
  const saved = savedIds.includes(storageId);
  const toggle = () => {
    const next = new Set(readContentSaved());
    if (saved) next.delete(storageId); else next.add(storageId);
    try { localStorage.setItem(CONTENT_SAVED_KEY, JSON.stringify([...next])); window.dispatchEvent(new Event(CONTENT_SAVED_EVENT)); setError(""); }
    catch { setError("Хөтчийн хадгалалт хаалттай байна."); }
  };
  const track = () => {
    if (item.externalKey) void fetch("/api/content/usage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ externalKey: item.externalKey, state: "VIEWED" }), keepalive: true }).catch(() => undefined);
  };
  const external = /^https?:\/\//.test(item.href);
  const image = item.imageUrl && item.imageUrl !== failedImage ? item.imageUrl : null;
  const linkProps = { href: item.href, onClick: track, ...(external ? { target: "_blank", rel: "noreferrer" } : {}) };
  return <article className={styles.card} data-kind={item.kind}>
    <div className={styles.media}>
      <Link {...linkProps} className={styles.mediaLink} aria-label={item.title}>
        {image ? <img className={styles.uploaded} src={image} alt="" loading="lazy" onError={() => setFailedImage(image)} />
          : <div className={styles.cover} aria-hidden="true">
            <span className={styles.brand}>Оюунсанаа</span>
            <span className={styles.coverTitle}>{item.title}</span>
            <svg className={styles.motif} viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="18"/><path d="M25 7c-22 10 22 23 0 34M12 30c11 9 23-7 24-15"/></svg>
          </div>}
      </Link>
      <button className={styles.save} type="button" onClick={toggle} aria-pressed={saved} aria-label={`${item.title} — ${saved ? "хадгалснаас хасах" : "энэ төхөөрөмжид хадгалах"}`} title="Энэ төхөөрөмжид хадгалах"><Heart size={18} fill={saved ? "currentColor" : "none"}/></button>
    </div>
    <div className={styles.body}>
      <div className={styles.labels}><span className={styles.kind}>{item.kindLabel}</span>{(item.statusLabel || item.used) && <span className={styles.used}><CheckCircle2 size={12}/>{item.statusLabel || "Ашигласан"}</span>}</div>
      <h3 className={styles.title}><Link {...linkProps}>{item.title}</Link></h3>
      {item.summary && <p className={styles.summary}>{item.summary}</p>}
      {item.duration && <p className={styles.duration}>{item.duration}</p>}
      <div className={styles.footer}>
        <span className={styles.price}>{item.price != null ? item.price > 0 ? new Intl.NumberFormat("mn-MN").format(item.price) + " ₮" : "Үнэгүй" : ""}</span>
        <Link {...linkProps} className={styles.open}>Дэлгэрэнгүй <ArrowUpRight size={15}/></Link>
      </div>
      {error && <p role="status" className={styles.error}>{error}</p>}
    </div>
  </article>;
}
