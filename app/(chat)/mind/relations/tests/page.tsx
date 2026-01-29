import Link from "next/link";
import styles from "./tests.module.css";

import { TESTS } from "@/lib/apps/relations/tests/definitions";

export default function RelationsTestsListPage() {
  return (
    <div className={styles.cbtBody}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link className={styles.chatBtn} href="/mind/relations">
            Буцах
          </Link>
          <Link className={styles.chatBtn} href="/chat">
            <span className={styles.chatIcon}>💬</span> Чат руу
          </Link>
        </header>

        <div className={styles.card}>
          <h1 className={styles.q}>Харилцааны тестүүд</h1>
          <p className={styles.desc}>Тест сонгоод бөглөнө. Дүнгээ хадгалж болно.</p>

          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {TESTS.map((t) => (
              <Link
                key={t.id}
                className={styles.testItem}
                href={`/mind/relations/tests/${t.slug}`}
              >
                <div className={styles.testTitle}>{t.title}</div>
                {t.subtitle ? <div className={styles.testSub}>{t.subtitle}</div> : null}
                {t.description ? <div className={styles.testDesc}>{t.description}</div> : null}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
