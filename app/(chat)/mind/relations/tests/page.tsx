import Link from "next/link";
import { TESTS } from "@/lib/apps/relations/tests/testsRegistry";

export default function RelationsTestsPage() {
  return (
    <div>
      <h1>Харилцааны тестүүд</h1>

      {TESTS.map(t => (
        <Link key={t.slug} href={`/mind/relations/tests/${t.slug}`}>
          {t.title}
        </Link>
      ))}
    </div>
  );
}
