"use client";

import { useRouter } from "next/navigation";
import styles from "../tests.module.css";

export default function TopBar() {
  const router = useRouter();

  return (
    <div className={styles.topBar}>
      <button
        type="button"
        className={styles.topBtn}
        onClick={() => router.replace("/mind/relations/tests")}
        title="Тестийн эхлэл рүү"
      >
        ← Буцах
      </button>

      <div className={styles.topSpacer} />

      <button
        type="button"
        className={styles.topBtn}
        onClick={() => router.replace("/")}
        title="Үндсэн чат руу"
      >
        Чат
      </button>
    </div>
  );
}
