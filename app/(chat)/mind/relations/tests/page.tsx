import Link from "next/link";
import styles from "./tests.module.css";
import { TESTS } from "@/lib/apps/relations/tests/definitions";
import LatestResults from "@/components/apps/relations/tests/LatestResults";

export default function RelationsTestsHome() {
  return (
    <div className={styles.cbtBody}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link className={styles.chatBtn} href="/mind/relations">
            ← Буцах
          </Link>
          <Link className={styles.chatBtn} href="/chat">
            <span className={styles.chatIcon}>💬</span> Чат руу
          </Link>
        </header>

        <div className={styles.card}>
          <div className={styles.cardTop}>
            <h1 className={styles.q}>Харилцаа, зан чанарын тэстүүд</h1>
            <p className={styles.desc}>
              Та өөрийн зан чанар тодорхойлж, бусадтай харилцах харилцааны хэв маягаа шалгахыг хүсвэл дараах тэстүүдийг бөглөж үзээрэй.
              Дүгнэлт шууд гарна.
            </p>
          </div>

          <div className={styles.options}>
            {TESTS.map((t) => (
              <Link key={t.id} className={styles.option} href={`/mind/relations/tests/${t.id}`}>
                <div className={styles.left}>
                  <span className={styles.emoji}>🧩</span>
                  <span className={styles.label}>{t.title}</span>
                </div>
                <span className={styles.tick}>›</span>
              </Link>
            ))}
          </div>
        </div>

        <LatestResults />
      </div>
    </div>
  );
}
