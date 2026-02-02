"use client";

import { useRouter } from "next/navigation";
import styles from "./topbar.module.css";

type Props = {
  /** fallback route: history байхгүй үед энд очно */
  fallbackHref?: string;
  /** чат руу очих href */
  chatHref?: string;
};

export default function TopBar({
  fallbackHref = "/mind/relations",
  chatHref = "/",
}: Props) {
  const router = useRouter();

  function handleBack() {
    // 1) эхлээд history back оролдоно
    router.back();

    // 2) хэрвээ back нь ажиллахгүй / history байхгүй тохиолдолд fallback
    // (богино хугацааны дараа одоогийн URL өөрчлөгдөөгүй бол fallback гэж үзнэ)
    const before = window.location.pathname;
    window.setTimeout(() => {
      const after = window.location.pathname;
      if (after === before) router.replace(fallbackHref);
    }, 180);
  }

  return (
    <div className={styles.bar}>
      <button type="button" className={styles.btn} onClick={handleBack}>
        ← Буцах
      </button>

      <div className={styles.spacer} />

      <button
        type="button"
        className={styles.btn}
        onClick={() => router.push(chatHref)}
      >
        Чат
      </button>
    </div>
  );
}
