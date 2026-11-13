export type LibraryView = "all" | "saved" | "unused" | "used";
export type LibraryEntry = {
  id: string; storageId?: string; title: string; summary?: string | null;
  kind: string; used?: boolean;
};
export function filterLibraryEntries<T extends LibraryEntry>(items: T[], { query, kind, view, saved }: { query: string; kind: string; view: LibraryView; saved: readonly string[] }) {
  const words = query.normalize("NFC").trim().toLocaleLowerCase("mn-MN").split(/\s+/).filter(Boolean);
  return items.filter(item => {
    const text = `${item.title} ${item.summary || ""}`.normalize("NFC").toLocaleLowerCase("mn-MN");
    return (!kind || item.kind === kind) && words.every(word => text.includes(word))
      && (view !== "saved" || saved.includes(item.storageId || item.id))
      && (view !== "used" || Boolean(item.used))
      && (view !== "unused" || !item.used);
  });
}
