import Link from "next/link";
import styles from "../tests.module.css";

import { getTestBySlug } from "@/lib/apps/relations/tests/definitions";
import TestRunner from "@/components/apps/relations/tests/TestRunner";

export default function TestSlugPage({ params }: { params: { slug: string } }) {
  const test = getTestBySlug(params.slug);

  return (
    <div className={styles.cbtBody}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link className={styles.chatBtn} href="/mind/relations/tests">
            Буцах
          </Link>
          <Link className={styles.chatBtn} href="/chat">
            <span className={styles.chatIcon}>💬</span> Чат руу
          </Link>
        </header>

        {test ? (
          <TestRunner test={test} />
        ) : (
          <div className={styles.card}>
            <h1 className={styles.q}>Тест олдсонгүй</h1>
            <p className={styles.desc}>Slug/ID буруу байна: {params.slug}</p>
          </div>
        )}
      </div>
    </div>
  );
}
