"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

const BRAND = "#1F6FB2";

/** Daily-check-тэй ижил цэнхэр шилэн (blue glass) дизайн токенууд */
const BG_GRADIENT =
  "linear-gradient(180deg, #2f5f84 0%, #274e70 34%, #1f3f5d 68%, #18324a 100%)";
const INK = "rgba(240,248,255,0.96)";
const MUTED = "rgba(240,248,255,0.72)";
const GLASS = "rgba(255,255,255,0.10)";
const LINE = "rgba(255,255,255,0.22)";

type AppShellProps = {
  title: string;
  subtitle?: string;
  /** Баруун дээд буланд нэмэлт контент (Чат товчны хажууд) */
  actions?: ReactNode;
  /** "Буцах" сумны зорилго (default: "/") */
  backHref?: string;
  /** Контентын дээд өргөн (default: "3xl") */
  width?: "2xl" | "3xl" | "4xl" | "5xl" | "full";
  children: ReactNode;
};

const WIDTHS: Record<NonNullable<AppShellProps["width"]>, string> = {
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  full: "max-w-full",
};

const glassBtn: CSSProperties = {
  border: `1px solid ${LINE}`,
  background: GLASS,
  color: INK,
  backdropFilter: "blur(10px)",
};

export function AppShell({
  title,
  subtitle,
  actions,
  backHref = "/",
  width = "3xl",
  children,
}: AppShellProps) {
  return (
    <main
      className="relative min-h-dvh w-full overflow-hidden px-3 py-6 md:px-4"
      style={{ background: BG_GRADIENT, color: INK }}
    >
      {/* зөөлөн гэрэлтэлт */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-[20%] -top-44 size-[520px] rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(31,111,178,0.55), transparent)" }}
      />

      <div className={`relative z-10 mx-auto w-full ${WIDTHS[width]}`}>
        {/* Topbar */}
        <header className="mb-4 flex items-center gap-3">
          <Link
            href={backHref}
            aria-label="Буцах"
            className="inline-flex size-[42px] shrink-0 items-center justify-center rounded-[14px] text-lg transition-opacity hover:opacity-80"
            style={glassBtn}
          >
            ←
          </Link>

          <div className="min-w-0 flex-1">
            <h1 className="truncate font-extrabold text-base tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-0.5 truncate text-xs" style={{ color: MUTED }}>
                {subtitle}
              </p>
            )}
          </div>

          {actions}

          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-2 rounded-[14px] px-3 py-2.5 font-medium text-sm transition-opacity hover:opacity-80"
            style={glassBtn}
          >
            💬 Чат
          </Link>
        </header>

        {children}
      </div>
    </main>
  );
}

/** Daily-check-тэй ижил шилэн карт wrapper */
export function AppCard({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`rounded-[22px] p-4 md:p-5 ${className}`}
      style={{
        border: `1px solid rgba(255,255,255,0.18)`,
        background: GLASS,
        backdropFilter: "blur(18px)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
      }}
    >
      {children}
    </section>
  );
}

export const APP_SHELL_TOKENS = { BRAND, BG_GRADIENT, INK, MUTED, GLASS, LINE };
