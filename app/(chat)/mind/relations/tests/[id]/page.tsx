"use client";

import Link from "next/link";
import styles from "@/components/apps/relations/tests/tests.module.css";
import { TESTS } from "@/lib/apps/relations/tests/testsRegistry";

export default function RelationsTestsHomePage() {
  return (
    <div className={styles.cbtBody}>
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.back} onClick={() => history.back()} aria-label="Буцах">
            ←
          </button>

          <div className={styles.headMid}>
            <div className={styles.headTitle}>Харилцаа · Зан чанарын тестүүд</div>
            <div className={styles.headSub}>Өөрийгөө таних богино тестүүд</div>
          </div>

          <Link className={styles.chatBtn} href="/chat">
            💬 Чат руу
          </Link>
        </div>

        <div className={styles.card}>
          <h1 className={styles.q} style={{ fontSize: 18 }}>
            Та өөрийн зан чанараа тодорхойлж, бусадтай харилцах харилцааны хэв маягаа шалгахыг хүсвэл дараах тестүүдийг бөглөж үзээрэй.
          </h1>
          <p className={styles.desc}>
            Тест бүрийн үр дүн шууд гарна. Дараа нь дахин бөглөөд өөрчлөлтөө харьцуулж болно.
          </p>

          <div className={styles.list}>
            {TESTS.map((t) => (
              <Link key={t.slug} href={`/mind/relations/tests/${t.slug}`} className={styles.row}>
                <div style={{ minWidth: 0 }}>
                  <div className={styles.rowTitle}>{t.title}</div>
                  <div className={styles.rowMeta}>{t.meta}</div>
                </div>
                <div className={styles.arrow}>→</div>
              </Link>
            ))}
          </div>
        </div>

        <div className={styles.resultCard}>
          <div className={styles.resultTitle}>Сүүлийн дүгнэлтүүд</div>
          <div className={styles.resultMeta}>
            <div>Энэ хэсгийг дараагийн алхамд Supabase-тай холбоод “хамгийн сүүлийн дүн”-гээ байнга харуулна.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
