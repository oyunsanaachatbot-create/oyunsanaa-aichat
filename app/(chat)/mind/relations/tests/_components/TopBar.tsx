"use client";

import { useRouter } from "next/navigation";
import styles from "../tests.module.css";

const CHAT_HREF = "/"; // Хэрвээ танай чат "/chat" бол "/chat" болго

export default function TopBar() {
  const router = useRouter();

  return (
    <div className={styles.topBar}>
      <button className={styles.pillBtn} onClick={() => router.back()} type="button">
        ← Буцах
      </button>

      <button className={styles.pillBtn} onClick={() => router.push(CHAT_HREF)} type="button">
        💬 Чат руу
      </button>
    </div>
  );
}
