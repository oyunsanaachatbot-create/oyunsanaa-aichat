"use client";

import { ArrowLeft, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useT } from "@/lib/i18n/provider";
import type {
  ButtonHTMLAttributes,
  CSSProperties,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

const BRAND = "#1F6FB2";
const BRAND_RGB = "31,111,178";

/** Цагаан, цэвэрхэн дизайн токенууд (balance/* апп-уудтай ижил) */
const BG = "#FFFFFF";
/** Зөөлөн өнгөтэй дэвсгэр (цагаан картууд тодрох) — бүх хуудсанд жигд */
const SURFACE = "#EEF2F8";
const INK = "#0F172A";
const MUTED = "rgba(15,23,42,0.60)";
const GLASS = "#FFFFFF";
const LINE = "#E2E8F0";

type AppShellProps = {
  title: string;
  subtitle?: string;
  /** Баруун дээд буланд нэмэлт контент (Чат товчны хажууд) */
  actions?: ReactNode;
  /** "Буцах" сумны зорилго (default: "/") */
  backHref?: string;
  /** Буцах товч дарахад дуудах handler (өгвөл backHref-ийн оронд ажиллана) */
  onBack?: () => void;
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
  background: "rgba(255,255,255,0.75)",
  color: INK,
};

export function AppShell({
  title,
  subtitle,
  actions,
  backHref = "/",
  onBack,
  width = "3xl",
  children,
}: AppShellProps) {
  const t = useT();
  const backClass =
    "inline-flex size-[40px] shrink-0 items-center justify-center rounded-full transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0";
  return (
    <main
      className="relative min-h-dvh w-full overflow-x-hidden px-3 pt-4 pb-12 md:px-5 md:pt-6"
      style={{ background: SURFACE, color: INK }}
    >
      {/* зөөлөн брэнд орчин (туяа + нарийн торон давхарга) */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute -top-40 left-[-12%] h-[560px] w-[560px] rounded-full blur-3xl"
          style={{ background: `rgba(${BRAND_RGB},0.16)` }}
        />
        <div
          className="absolute -top-24 right-[-16%] h-[480px] w-[480px] rounded-full blur-3xl"
          style={{ background: `rgba(${BRAND_RGB},0.10)` }}
        />
        <div
          className="absolute bottom-[-28%] left-[18%] h-[640px] w-[640px] rounded-full blur-3xl"
          style={{ background: `rgba(${BRAND_RGB},0.07)` }}
        />
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(15,23,42,0.04) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            maskImage:
              "linear-gradient(180deg, rgba(0,0,0,0.7), transparent 70%)",
            WebkitMaskImage:
              "linear-gradient(180deg, rgba(0,0,0,0.7), transparent 70%)",
          }}
        />
      </div>

      <div className={`relative z-10 mx-auto w-full ${WIDTHS[width]}`}>
        {/* Толгой + контент НЭГ цул панелд */}
        <div
          className="relative rounded-[20px] p-4 backdrop-blur-xl md:p-5"
          style={{
            border: `1px solid ${LINE}`,
            background: "rgba(255,255,255,0.72)",
            boxShadow: "0 8px 30px rgba(15,23,42,0.06)",
          }}
        >
          {/* Topbar */}
          <header className="flex flex-wrap items-start gap-3">
            {onBack ? (
              <button
                aria-label={t.common.back}
                className={backClass}
                onClick={onBack}
                style={glassBtn}
                type="button"
              >
                <ArrowLeft className="size-[18px]" />
              </button>
            ) : (
              <Link
                aria-label={t.common.back}
                className={backClass}
                href={backHref}
                style={glassBtn}
              >
                <ArrowLeft className="size-[18px]" />
              </Link>
            )}

            <div className="min-w-0 flex-1">
              <h1 className="break-words font-extrabold text-base leading-snug tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p
                  className="mt-0.5 break-words text-xs leading-relaxed"
                  style={{ color: MUTED }}
                >
                  {subtitle}
                </p>
              )}
            </div>

            <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto sm:pt-0.5">
              {actions}

              <Link
                className="inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2.5 font-medium text-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
                href="/"
                style={glassBtn}
              >
                <MessageCircle className="size-[16px]" />
                <span className="hidden sm:inline">{t.common.chat}</span>
              </Link>
            </div>
          </header>

          {/* Тусгаарлагч зураас */}
          <div className="my-4 h-px w-full" style={{ background: LINE }} />

          {/* Контент */}
          {children}
        </div>
      </div>
    </main>
  );
}

/**
 * Контентын хэсэг.
 * AppShell-ийн нэг цул панелийн дотор сууж байгаа тул өөрийн хүрээ/сүүдэргүй —
 * зүгээр нэг логик блок (header + content нэг панелд гэсэн зарчим).
 */
export function AppCard({
  className = "",
  interactive = false,
  children,
}: {
  className?: string;
  /** (Хадгалсан API) — одоо панель доторх блок тул нэмэлт чимэглэлгүй */
  interactive?: boolean;
  children: ReactNode;
}) {
  return <section className={className}>{children}</section>;
}

/* ───────────────────────── Typography ───────────────────────── */

/** Жижиг шошго / нүдний өмнөх мөр (eyebrow) */
export function Badge({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold text-[11px] uppercase tracking-wide ${className}`}
      style={{
        background: `rgba(${BRAND_RGB},0.10)`,
        color: BRAND,
        border: `1px solid rgba(${BRAND_RGB},0.18)`,
      }}
    >
      {children}
    </span>
  );
}

/** Хуудасны том гарчиг (карт дотор / контентын дээд хэсэгт) */
export function PageHero({
  icon,
  eyebrow,
  title,
  description,
  className = "",
}: {
  icon?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-5 ${className}`}>
      <div className="flex items-start gap-3.5">
        {icon && (
          <span
            aria-hidden
            className="grid size-12 shrink-0 place-items-center rounded-[16px] text-2xl leading-none shadow-sm"
            style={{
              background: `linear-gradient(135deg, rgba(${BRAND_RGB},0.18), rgba(${BRAND_RGB},0.05))`,
              border: `1px solid rgba(${BRAND_RGB},0.18)`,
            }}
          >
            {icon}
          </span>
        )}
        <div className="min-w-0 pt-0.5">
          {eyebrow && <div className="mb-1.5">{eyebrow}</div>}
          <h1
            className="font-extrabold text-xl tracking-tight md:text-2xl"
            style={{ color: INK }}
          >
            {title}
          </h1>
          {description && (
            <p
              className="mt-2 max-w-prose text-sm leading-relaxed"
              style={{ color: MUTED }}
            >
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Хэсгийн гарчиг (h2) */
export function SectionHeading({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`font-bold text-base tracking-tight ${className}`}
      style={{ color: INK }}
    >
      {children}
    </h2>
  );
}

/** Тусгай бус, бүдэг тайлбар текст */
export function Muted({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`break-words text-sm leading-relaxed [overflow-wrap:anywhere] ${className}`}
      style={{ color: MUTED }}
    >
      {children}
    </p>
  );
}

/* ───────────────────────── Button ───────────────────────── */

type ButtonVariant = "primary" | "ghost" | "danger";

const BTN_BASE =
  "inline-flex items-center justify-center gap-2 rounded-[14px] px-4 py-2.5 font-medium text-sm transition-all disabled:cursor-not-allowed disabled:opacity-50";

function buttonStyle(variant: ButtonVariant): CSSProperties {
  if (variant === "primary") {
    return {
      background: BRAND,
      color: "#FFFFFF",
      border: `1px solid ${BRAND}`,
      boxShadow: `0 10px 24px rgba(${BRAND_RGB},0.25)`,
    };
  }
  if (variant === "danger") {
    return {
      background: "#FFFFFF",
      color: "#DC2626",
      border: "1px solid rgba(220,38,38,0.30)",
    };
  }
  return { background: GLASS, color: INK, border: `1px solid ${LINE}` };
}

function buttonHover(variant: ButtonVariant): string {
  if (variant === "primary") return "hover:brightness-[1.06] active:brightness-95";
  if (variant === "danger") return "hover:bg-red-50";
  return "hover:bg-slate-50";
}

type ButtonProps = {
  variant?: ButtonVariant;
  href?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "style" | "className">;

export function Button({
  variant = "primary",
  href,
  className = "",
  style,
  children,
  ...rest
}: ButtonProps) {
  const cls = `${BTN_BASE} ${buttonHover(variant)} ${className}`;
  const merged = { ...buttonStyle(variant), ...style };
  if (href) {
    return (
      <Link href={href} className={cls} style={merged}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} style={merged} {...rest}>
      {children}
    </button>
  );
}

/* ───────────────────────── Form fields ───────────────────────── */

const FIELD_INPUT_CLASS =
  "w-full rounded-[14px] border bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#1F6FB2] focus:ring-2 focus:ring-[#1F6FB2]/15";

const fieldInputStyle: CSSProperties = { borderColor: LINE, color: INK };

export function Field({
  label,
  hint,
  htmlFor,
  children,
  className = "",
}: {
  label?: ReactNode;
  hint?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block font-medium text-sm"
          style={{ color: INK }}
        >
          {label}
        </label>
      )}
      {children}
      {hint && (
        <p className="text-xs" style={{ color: MUTED }}>
          {hint}
        </p>
      )}
    </div>
  );
}

export function TextArea({
  className = "",
  style,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`${FIELD_INPUT_CLASS} resize-y leading-relaxed ${className}`}
      style={{ ...fieldInputStyle, ...style }}
      {...rest}
    />
  );
}

export function TextInput({
  className = "",
  style,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`${FIELD_INPUT_CLASS} ${className}`}
      style={{ ...fieldInputStyle, ...style }}
      {...rest}
    />
  );
}

/* ───────────────────────── Selectable option ───────────────────────── */

export function OptionCard({
  selected = false,
  className = "",
  children,
  ...rest
}: { selected?: boolean } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex cursor-pointer select-none items-center gap-3 rounded-[16px] border px-4 py-3.5 text-sm transition-all ${className}`}
      style={{
        borderColor: selected ? BRAND : LINE,
        background: selected ? `rgba(${BRAND_RGB},0.06)` : GLASS,
        color: INK,
        boxShadow: selected
          ? `0 0 0 1px ${BRAND} inset, 0 8px 20px rgba(${BRAND_RGB},0.12)`
          : "none",
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ───────────────────────── Empty state ───────────────────────── */

export function EmptyState({
  icon,
  children,
  className = "",
}: {
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center rounded-[18px] border border-dashed px-4 py-10 text-center text-sm leading-relaxed ${className}`}
      style={{
        borderColor: LINE,
        color: MUTED,
        background:
          "linear-gradient(180deg, rgba(15,23,42,0.012), transparent)",
      }}
    >
      {icon && (
        <div
          aria-hidden
          className="mb-3 grid size-12 place-items-center rounded-full text-2xl"
          style={{
            background: `rgba(${BRAND_RGB},0.08)`,
            border: `1px solid rgba(${BRAND_RGB},0.14)`,
          }}
        >
          {icon}
        </div>
      )}
      <div className="max-w-xs">{children}</div>
    </div>
  );
}

/* ───────────────────────── Prose (контент / нийтлэл) ───────────────────────── */

/** Урт текст контентыг тааламжтай уншигдахуйц харуулна */
export function Prose({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`whitespace-pre-wrap break-words text-[15px] leading-[1.75] [overflow-wrap:anywhere] [&_b]:font-semibold [&_strong]:font-semibold ${className}`}
      style={{ color: "#334155" }}
    >
      {children}
    </div>
  );
}

export const APP_SHELL_TOKENS = { BRAND, BRAND_RGB, BG, INK, MUTED, GLASS, LINE };
