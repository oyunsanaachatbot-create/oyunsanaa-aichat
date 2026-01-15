"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import ExtrasTemplates from "./ExtrasTemplates";

const SECTIONS = [
  { key: "cover", label: "Нүүр" },
  { key: "toc", label: "Гарчиг" },
  { key: "foreword", label: "Зохиогчийн үг" },
  { key: "ending", label: "Төгсгөл" },
  { key: "submenu", label: "Дэд меню эхлэл" },
];

const SUBMENUS_10 = [
  "Миний ертөнц",
  "Амьдралын дурсамж",
  "Тэмдэглэл",
  "Талархал · Баярт мөч",
  "Захидал",
  "Хүнд үе",
  "Ухаарал · Сургамж",
  "Гомдол ба харуусал",
  "Миний уран бүтээл",
  "Миний булан",
];

const THEMES = [
  { id: "lilac", name: "Lilac", bg: "bg-[#f1eaff]", paper: "bg-white/75", ink: "text-[#2f2440]", accent: "bg-[#d2b7ff]" },
  { id: "sand", name: "Sand", bg: "bg-[#fbf1e4]", paper: "bg-white/75", ink: "text-[#2f2621]", accent: "bg-[#f0c59a]" },
  { id: "mint", name: "Mint", bg: "bg-[#eaf7f1]", paper: "bg-white/75", ink: "text-[#1f2b24]", accent: "bg-[#9ee3c1]" },
];

const DEFAULT_STATE = {
  section: "cover",
  submenuKey: SUBMENUS_10[0],
  variant: "b",
  theme: "lilac",

  // cover
  title: "Миний ном",
  subtitle: "",
  imageDataUrl: "",

  // toc
  tocLines: [
    "Нүүр хуудас|1",
    "Гарчиг|2",
    "Зохиогчийн үг|3",
    "Миний ертөнц|4",
    "Амьдралын дурсамж|5",
    "Тэмдэглэл|6",
    "Талархал · Баярт мөч|7",
    "Захидал|8",
    "Хүнд үе|9",
    "Ухаарал · Сургамж|10",
    "Гомдол ба харуусал|11",
    "Миний уран бүтээл|12",
    "Миний булан|13",
    "Төгсгөлийн үг|14",
  ].join("\n"),

  // foreword / ending / submenu
  body: "",
  circleImageDataUrl: "",
};

export default function ExtrasPage() {
  const [st, setSt] = useState(DEFAULT_STATE);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const themeObj = useMemo(() => THEMES.find((t) => t.id === st.theme) || THEMES[0], [st.theme]);

  const onTab = (key) => {
    setSt((p) => ({
      ...p,
      section: key,
      submenuKey: key === "submenu" ? (p.submenuKey || SUBMENUS_10[0]) : p.submenuKey,
      variant: "a",
    }));
    setMsg("");
  };

  const onSave = async () => {
    setSaving(true);
    setMsg("");
    try {
      const payload = buildCompiledPayload(st);
      await saveToCompiled(payload);
      setMsg("✅ Хадгаллаа. (Эх бэлтгэл рүү орлоо)");
    } catch (e) {
      console.error(e);
      setMsg(`❌ Хадгалах үед алдаа: ${e?.message || "unknown"}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`min-h-screen ${themeObj.bg} p-6`}>
      <div className="mx-auto max-w-6xl">
        {/* TOP NAV BUTTONS */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Link
            href="https://chat.oyunsanaa.com"
            className="rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm hover:bg-white"
          >
            ← Chat
          </Link>

          <Link
            href="/mind/ebooks"
            className="rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm hover:bg-white"
          >
            Ном (E-book)
          </Link>

          <Link
            href="/mind/ebooks/preview"
            className="rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm hover:bg-white"
          >
            Эх бэлтгэл
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* LEFT: editor */}
          <div className="rounded-2xl bg-white/85 p-5 shadow-sm">
            {/* tabs */}
            <div className="flex flex-wrap gap-2">
              {SECTIONS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => onTab(s.key)}
                  className={[
                    "rounded-full px-3 py-1 text-sm transition",
                    st.section === s.key ? "bg-[#d49a74] text-white" : "bg-white hover:bg-black/5",
                  ].join(" ")}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-3">
              {/* theme */}
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-black/70">Theme (3 өнгө)</div>
                <select
                  value={st.theme}
                  onChange={(e) => setSt((p) => ({ ...p, theme: e.target.value }))}
                  className="w-48 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none"
                >
                  {THEMES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* submenu list */}
              {st.section === "submenu" && (
                <div className="rounded-xl border border-black/10 bg-white p-3">
                  <div className="mb-2 text-xs font-semibold tracking-wide text-black/50">ДЭД МЕНЮ (10)</div>
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {SUBMENUS_10.map((name) => (
                      <button
                        key={name}
                        onClick={() => setSt((p) => ({ ...p, submenuKey: name, variant: "a" }))}
                        className={[
                          "rounded-lg px-3 py-2 text-left text-sm transition",
                          st.submenuKey === name ? "bg-black/5 font-medium" : "hover:bg-black/5",
                        ].join(" ")}
                      >
                        → {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* variant */}
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-black/70">Template сонгох (3 төрөл)</div>
                <select
                  value={st.variant}
                  onChange={(e) => setSt((p) => ({ ...p, variant: e.target.value }))}
                  className="w-48 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none"
                >
                  <option value="a">template-a</option>
                  <option value="b">template-b</option>
                  <option value="c">template-c</option>
                </select>
              </div>

              {/* editor form */}
              <ExtrasTemplates.Editor state={st} setState={setSt} />

              <div className="mt-2 flex items-center gap-3">
                <button
                  onClick={onSave}
                  disabled={saving}
                  className="rounded-xl bg-[#d49a74] px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {saving ? "Хадгалж байна..." : "Хадгалах"}
                </button>
              </div>

              {msg && <div className="rounded-xl border border-black/10 bg-white p-3 text-sm">{msg}</div>}
            </div>
          </div>

          {/* RIGHT: preview */}
          <div className="rounded-2xl bg-white/65 p-5 shadow-sm">
            <ExtrasTemplates.Preview state={st} theme={themeObj} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Payload -> "Эх бэлтгэл" */
function buildCompiledPayload(st) {
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
        ? st.submenuKey
        : st.section === "foreword"
        ? "Зохиогчийн үг"
        : "Төгсгөл",
    body: st.body,
    circle_image_data_url: st.circleImageDataUrl || null,
  };
}

/** Save -> localStorage (Supabase бэлэн болмогц энэ хэсгийг солино) */
async function saveToCompiled(payload) {
  const key = "ebook_compiled_pages";
  const list = JSON.parse(localStorage.getItem(key) || "[]");
  list.unshift({ id: crypto.randomUUID(), ...payload });
  localStorage.setItem(key, JSON.stringify(list));
  return true;
}
