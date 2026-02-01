"use client";

import { useRouter } from "next/navigation";
import styles from "../tests.module.css";

const EXIT_HREF = "/mind/relations"; // шаардлагатай бол энд л солино
const CHAT_HREF = "/";              // шаардлагатай бол энд л солино

export default function TopBar() {
  const router = useRouter();

  return (
    <div className={styles.topbar}>
      <button
        type="button"
        className={styles.topBtn}
        onClick={() => router.push(EXIT_HREF)}
      >
        ← Буцах
      </button>

      <div className={styles.topSpacer} />

      <button
        type="button"
        className={styles.topBtn}
        onClick={() => router.push(CHAT_HREF)}
      >
        Чат
      </button>
    </div>
  );
}
