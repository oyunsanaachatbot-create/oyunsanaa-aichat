import Link from "next/link";
import { TESTS } from "@/lib/apps/relations/tests/definitions";

export default function RelationsTestsPage() {
  return (
    <div>
      <h1>Харилцааны тестүүд</h1>

      {TESTS.map((t) => (
        <div key={t.slug}>
          <Link href={`/mind/relations/tests/${t.slug}`}>{t.title}</Link>
        </div>
      ))}

      {/* ✅ /chat чинь 404 байгаа болохоор түр / рүү */}
      <div style={{ marginTop: 16 }}>
        <Link href="/">Чат руу</Link>
      </div>
    </div>
  );
}
