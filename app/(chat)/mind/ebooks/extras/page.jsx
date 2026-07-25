"use client";

import { useMemo, useState } from "react";
import { AppShell, Button } from "@/components/mind/app-shell";
import ExtrasTemplates from "./ExtrasTemplates";
import { useT } from "@/lib/i18n/provider";

const SECTION_ORDER = [
  "world",
  "memories",
  "notes",
  "happy",
  "letters",
  "difficult",
  "wisdom",
  "complaints",
  "creatives",
  "personals",
];

const THEMES = [
  {
    id: "lilac",
    name: "Lilac",
    bg: "bg-[#f1eaff]",
    paper: "bg-white/75",
    ink: "text-[#2f2440]",
    accent: "bg-[#d2b7ff]",
  },
  {
    id: "sand",
    name: "Sand",
    bg: "bg-[#fbf1e4]",
    paper: "bg-white/75",
    ink: "text-[#2f2621]",
    accent: "bg-[#f0c59a]",
  },
  {
    id: "mint",
    name: "Mint",
    bg: "bg-[#eaf7f1]",
    paper: "bg-white/75",
    ink: "text-[#1f2b24]",
    accent: "bg-[#9ee3c1]",
  },
];

export default function ExtrasPage() {
  const t = useT();
  const ex = t.apps.ebooks.extras;
  const bk = t.apps.ebooks.book;
  const w = t.apps.ebooks.write;

  const SECTIONS = useMemo(
    () => [
      { key: "cover", label: ex.sections.cover },
      { key: "toc", label: ex.sections.toc },
      { key: "foreword", label: ex.sections.foreword },
      { key: "ending", label: ex.sections.ending },
      { key: "submenu", label: ex.sections.submenu },
    ],
    [ex]
  );

  const submenuOptions = useMemo(
    () =>
      SECTION_ORDER.map((sid) => ({
        id: sid,
        label: t.apps.ebooks.sections[sid]?.title || sid,
      })),
    [t]
  );

  const [st, setSt] = useState(() => ({
    section: "cover",
    submenuKey: submenuOptions[0]?.id || "world",
    variant: "b",
    theme: "lilac",

    // cover
    title: t.apps.ebooks.defaultBookTitle,
    subtitle: "",
    imageDataUrl: "",

    // toc
    tocLines: [
      `${bk.coverPage}|1`,
      `${bk.tocPage}|2`,
      `${bk.forewordPage}|3`,
      ...submenuOptions.map((o, i) => `${i + 1}. ${o.label}|${4 + i}`),
      `${bk.endingPage}|${4 + submenuOptions.length}`,
    ].join("\n"),

    // foreword / ending / submenu
    body: "",
    circleImageDataUrl: "",
  }));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const themeObj = useMemo(
    () => THEMES.find((th) => th.id === st.theme) || THEMES[0],
    [st.theme]
  );

  const onTab = (key) => {
    setSt((p) => ({
      ...p,
      section: key,
      submenuKey:
        key === "submenu"
          ? p.submenuKey || submenuOptions[0]?.id
          : p.submenuKey,
      variant: "a",
    }));
    setMsg("");
  };

  const onSave = async () => {
    setSaving(true);
    setMsg("");
    try {
      const submenuLabel =
        submenuOptions.find((o) => o.id === st.submenuKey)?.label ||
        st.submenuKey;
      const payload = buildCompiledPayload(st, { bk, submenuLabel });
      await saveToCompiled(payload);
      setMsg(ex.saved);
    } catch (e) {
      console.error(e);
      setMsg(ex.saveError.replace("{msg}", e?.message || "unknown"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      actions={
        <Button
          className="hidden sm:inline-flex"
          href="/mind/ebooks/preview"
          variant="ghost"
        >
          {w.preview}
        </Button>
      }
      backHref="/mind/ebooks"
      subtitle={ex.ebook}
      title={t.apps.ebooks.sections.extras.title}
      width="4xl"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* LEFT: editor */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            {/* tabs */}
            <div className="flex flex-wrap gap-2">
              {SECTIONS.map((s, index) => (
                <button
                  className={[
                    "rounded-full px-3 py-1 text-sm transition",
                    st.section === s.key
                      ? "bg-[#1F6FB2] text-white"
                      : "bg-white hover:bg-black/5",
                  ].join(" ")}
                  key={s.key}
                  onClick={() => onTab(s.key)}
                  type="button"
                >
                  {index + 1}. {s.label}
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-3">
              {/* theme */}
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium text-black/70 text-sm">
                  {ex.themeLabel}
                </div>
                <select
                  className="w-48 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none"
                  onChange={(e) =>
                    setSt((p) => ({ ...p, theme: e.target.value }))
                  }
                  value={st.theme}
                >
                  {THEMES.map((th) => (
                    <option key={th.id} value={th.id}>
                      {th.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* submenu list */}
              {st.section === "submenu" && (
                <div className="rounded-xl border border-black/10 bg-white p-3">
                  <div className="mb-2 font-semibold text-black/50 text-xs tracking-wide">
                    {ex.subMenuTitle}
                  </div>
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {submenuOptions.map((opt, index) => (
                      <button
                        className={[
                          "rounded-lg px-3 py-2 text-left text-sm transition",
                          st.submenuKey === opt.id
                            ? "bg-black/5 font-medium"
                            : "hover:bg-black/5",
                        ].join(" ")}
                        key={opt.id}
                        onClick={() =>
                          setSt((p) => ({
                            ...p,
                            submenuKey: opt.id,
                            variant: "a",
                          }))
                        }
                        type="button"
                      >
                        {index + 1}. {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* variant */}
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium text-black/70 text-sm">
                  {ex.templateLabel}
                </div>
                <select
                  className="w-48 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none"
                  onChange={(e) =>
                    setSt((p) => ({ ...p, variant: e.target.value }))
                  }
                  value={st.variant}
                >
                  <option value="a">{ex.templateA}</option>
                  <option value="b">{ex.templateB}</option>
                  <option value="c">{ex.templateC}</option>
                </select>
              </div>

              {/* editor form */}
              <ExtrasTemplates.Editor setState={setSt} state={st} />

              <div className="mt-2 flex items-center gap-3">
                <button
                  className="rounded-xl bg-[#1F6FB2] px-5 py-2 font-medium text-sm text-white disabled:opacity-60"
                  disabled={saving}
                  onClick={onSave}
                  type="button"
                >
                  {saving ? ex.saving : ex.save}
                </button>
              </div>

              {msg && (
                <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                  {msg}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: preview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <ExtrasTemplates.Preview state={st} t={t} theme={themeObj} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/** Payload -> "Эх бэлтгэл" */
function buildCompiledPayload(st, { bk, submenuLabel }) {
  const base = {
    module: "mind/ebooks/extras",
    section: st.section,
    submenu: st.section === "submenu" ? st.submenuKey : null,
    variant: st.variant,
    theme: st.theme,
    updated_at: new Date().toISOString(),
  };

  if (st.section === "cover") {
    return {
      ...base,
      title: st.title,
      subtitle: st.subtitle,
      image_data_url: st.imageDataUrl || null,
    };
  }

  if (st.section === "toc") {
    return { ...base, toc_lines: st.tocLines };
  }

  return {
    ...base,
    title:
      st.section === "submenu"
        ? submenuLabel
        : st.section === "foreword"
          ? bk.forewordPage
          : bk.endingPage,
    body: st.body,
    circle_image_data_url: st.circleImageDataUrl || null,
  };
}

/** Save -> localStorage (Supabase бэлэн болмогц энэ хэсгийг солино) */
function saveToCompiled(payload) {
  const key = "ebook_compiled_pages";
  const list = JSON.parse(localStorage.getItem(key) || "[]");
  list.unshift({ id: crypto.randomUUID(), ...payload });
  localStorage.setItem(key, JSON.stringify(list));

  const extrasKey = "oyun_ebook_extras_v1";
  const extras = JSON.parse(localStorage.getItem(extrasKey) || "{}");
  if (payload.section === "cover") {
    extras.cover = {
      title: payload.title || "",
      subtitle: payload.subtitle || "",
      image_data_url: payload.image_data_url || "",
    };
  } else if (payload.section === "foreword") {
    extras.preface = {
      heading: payload.title || "",
      body: payload.body || "",
    };
  } else if (payload.section === "ending") {
    extras.ending = {
      heading: payload.title || "",
      body: payload.body || "",
    };
  }
  localStorage.setItem(extrasKey, JSON.stringify(extras));
  return true;
}
