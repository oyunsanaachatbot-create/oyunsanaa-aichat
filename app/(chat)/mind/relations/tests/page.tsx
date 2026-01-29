import Link from "next/link";
import styles from "./tests.module.css";
import { TESTS } from "@/lib/apps/relations/tests/registry";

export default function RelationsTestsPage() {
  return (
    <div className={styles.cbtBody}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headMid}>
            <div className={styles.headTitle}>Харилцааны тестүүд</div>
            <div className={styles.headSub}>Дуртай тестээ сонгоод бөглөөрэй.</div>
          </div>

          {/* ⚠️ /chat чинь танайд 404 байгаа. Түр comment хийгээд дараа нь зөв route-руу солиорой */}
          {/* <Link className={styles.chatBtn} href="/chat">Чат руу</Link> */}
        </header>

        <div className={styles.card}>
          <div className={styles.list}>
            {TESTS.map((t) => (
              <Link
                key={t.slug}
                href={`/mind/relations/tests/${t.slug}`}
                className={styles.row}
              >
                <div style={{ minWidth: 0 }}>
                  <div className={styles.rowTitle}>{t.title}</div>
                  <div className={styles.rowMeta}>{t.subtitle}</div>
                </div>
                <div className={styles.arrow} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
