import Link from "next/link";
import styles from "./cbt.module.css";

import { getTestById } from "@/lib/apps/relations/tests/definitions";
import TestRunner from "@/components/apps/relations/tests/TestRunner";
export default function TestPage() {
  // энд test-ийн id-г query-оос авна эсвэл fixed болгоно
}

  return (
    <div className={styles.cbtBody}>
      <div className={styles.container}>
        <header className={styles.header}>
         <Link className={styles.chatBtn} href="/mind/relations/tests">
  ← Буцах
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
            <p className={styles.desc}>Энэ тестийн ID буруу байна.</p>
          </div>
        )}
      </div>
    </div>
  );
}
