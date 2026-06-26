import Link from "next/link";

/**
 * Catch-all placeholder for any /mind/* route that isn't built yet.
 *
 * Next.js always matches a more specific route before this catch-all, so every
 * existing page keeps working — this only renders when a menu item points to a
 * section that has no page yet, giving a clean "coming soon" screen instead of
 * a 404. (Requested behaviour: leave unknown menu items as a blank route.)
 */
export default function MindPlaceholderPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-2xl">
        🌱
      </div>
      <h1 className="font-semibold text-xl text-foreground">
        Тун удахгүй нэмэгдэнэ
      </h1>
      <p className="max-w-sm text-muted-foreground text-sm leading-relaxed">
        Энэ хэсэг одоогоор бэлтгэгдэж байна. Удахгүй ашиглах боломжтой болно.
      </p>
      <Link
        className="mt-2 rounded-full border px-5 py-2 text-sm transition-colors hover:bg-accent"
        href="/"
      >
        Чат руу буцах
      </Link>
    </div>
  );
}
