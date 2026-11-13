"use client";

import React, { useMemo, useRef } from "react";
import { useT } from "@/lib/i18n/provider";

function Label({ children }) {
  return <div className="text-xs font-semibold tracking-wide text-black/50">{children}</div>;
}
function Input({ value, onChange, placeholder }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none"
    />
  );
}
function TextArea({ value, onChange, placeholder, rows = 6 }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="min-h-[320px] w-full resize-y rounded-xl border border-black/10 bg-white px-3 py-2 text-sm leading-6 outline-none md:min-h-[420px]"
    />
  );
}
function Divider() {
  return <div className="my-2 h-px w-full bg-black/10" />;
}

function parseTocLines(raw) {
  const lines = (raw || "").split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.map((l) => {
    const [name, page] = l.split("|").map((x) => (x || "").trim());
    return { name: name || l, page: page || "" };
  });
}

async function fileToDataUrl(file) {
  return await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/** =========================
 * Editor
 * ========================= */
function Editor({ state, setState }) {
  const t = useT();
  const ex = t.apps.ebooks.extras;
  const coverInputRef = useRef(null);
  const circleInputRef = useRef(null);

  const sec = state.section;

  // cover editor
  if (sec === "cover") {
    return (
      <div className="grid gap-3">
        <Label>{ex.coverTitleLabel}</Label>
        <Input value={state.title} onChange={(v) => setState((p) => ({ ...p, title: v }))} placeholder={t.apps.ebooks.defaultBookTitle} />

        <Label>{ex.subtitleLabel}</Label>
        <Input value={state.subtitle} onChange={(v) => setState((p) => ({ ...p, subtitle: v }))} placeholder="..." />

        <Divider />

        <Label>{ex.coverImageLabel}</Label>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm hover:bg-black/5"
            onClick={() => coverInputRef.current?.click()}
          >
            {ex.chooseImage}
          </button>
          {state.imageDataUrl ? (
            <button
              type="button"
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm hover:bg-black/5"
              onClick={() => setState((p) => ({ ...p, imageDataUrl: "" }))}
            >
              {ex.removeImage}
            </button>
          ) : null}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const dataUrl = await fileToDataUrl(f);
              setState((p) => ({ ...p, imageDataUrl: dataUrl }));
              e.target.value = "";
            }}
          />
        </div>
      </div>
    );
  }

  // toc editor
  if (sec === "toc") {
    return (
      <div className="grid gap-3">
        <Label>{ex.tocLinesLabel}</Label>
        <TextArea
          value={state.tocLines}
          onChange={(v) => setState((p) => ({ ...p, tocLines: v }))}
          rows={10}
          placeholder={"..."}
        />
      </div>
    );
  }

  // foreword / ending / submenu editor
  return (
    <div className="grid gap-3">
      <Label>{sec === "foreword" ? ex.forewordHeading : sec === "ending" ? ex.endingHeading : ex.subMenuTextLabel}</Label>
      <TextArea
        value={state.body}
        onChange={(v) => setState((p) => ({ ...p, body: v }))}
        rows={10}
        placeholder={ex.bodyPlaceholder}
      />

      <Divider />

      <Label>{ex.circleImageLabel}</Label>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm hover:bg-black/5"
          onClick={() => circleInputRef.current?.click()}
        >
          {ex.chooseImage}
        </button>
        {state.circleImageDataUrl ? (
          <button
            type="button"
            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm hover:bg-black/5"
            onClick={() => setState((p) => ({ ...p, circleImageDataUrl: "" }))}
          >
            {ex.removeImage}
          </button>
        ) : null}
        <input
          ref={circleInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const dataUrl = await fileToDataUrl(f);
            setState((p) => ({ ...p, circleImageDataUrl: dataUrl }));
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

/** =========================
 * Preview (3 variant)
 * - EXTRAS болон author footer бүгдийг устгасан
 * ========================= */
function Preview({ state, theme, t }) {
  const ex = t.apps.ebooks.extras;
  const { section, variant } = state;

  const frameClass =
    "relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-black/10 shadow-sm";

  const pageClass = `h-full w-full ${theme.paper} p-6 ${theme.ink}`;

  // COVER
  if (section === "cover") {
    return (
      <div className={frameClass}>
        <div className={pageClass}>
          {variant === "a" && (
            <div className="flex h-full flex-col">
              <div className="mt-12 text-center">
                <div className="text-4xl font-semibold">{state.title}</div>
                {state.subtitle ? <div className="mt-4 text-sm opacity-70">{state.subtitle}</div> : null}
              </div>
            </div>
          )}

          {variant === "b" && (
            <div className="flex h-full flex-col">
              <div className="mt-2 overflow-hidden rounded-2xl border border-black/10 bg-white/60">
                {state.imageDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={state.imageDataUrl} alt="" className="h-60 w-full object-cover" />
                ) : (
                  <div className="flex h-60 items-center justify-center text-sm text-black/35">
                    {ex.noImagePlaceholder}
                  </div>
                )}
              </div>

              <div className="mt-10 text-center">
                <div className="text-5xl font-semibold tracking-tight">{state.title}</div>
                {state.subtitle ? (
                  <>
                    <div className="mx-auto mt-6 h-px w-2/3 bg-black/20" />
                    <div className="mt-5 text-sm opacity-70">{state.subtitle}</div>
                  </>
                ) : null}
              </div>
            </div>
          )}

          {variant === "c" && (
            <div className="flex h-full flex-col">
              <div className="mt-16 text-center">
                <div className="mx-auto mb-6 h-1 w-14 rounded-full bg-black/15" />
                <div className="text-6xl font-semibold tracking-tight">{state.title}</div>
                {state.subtitle ? <div className="mt-6 text-sm opacity-70">{state.subtitle}</div> : null}
              </div>
              <div className="mt-auto">
                <div className={`h-2 w-20 rounded-full ${theme.accent}`} />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // TOC
  if (section === "toc") {
    const items = parseTocLines(state.tocLines);

    return (
      <div className={frameClass}>
        <div className={pageClass}>
          {variant === "a" && (
            <div className="flex h-full flex-col">
              {/* ✅ хэт доошоо байсан margin-уудыг багасгасан */}
              <div className="mt-2 text-xs font-semibold tracking-widest opacity-60">{t.apps.ebooks.book.tocLabel}</div>
              <div className="mt-3 space-y-1.5">
                {items.slice(0, 14).map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-black/5">
                    <div className="text-sm">→ {it.name}</div>
                    <div className="text-sm opacity-60">{it.page}</div>
                  </div>
                ))}
              </div>
              <div className="mt-auto text-xs opacity-50">{ex.tocHint}</div>
            </div>
          )}

          {variant === "b" && (
            <div className="flex h-full flex-col">
              <div className="mt-2 rounded-2xl border border-black/10 bg-white/60 p-4">
                <div className="text-xs font-semibold tracking-widest opacity-60">{t.apps.ebooks.book.tocLabel}</div>
                <div className="mt-3 space-y-2">
                  {items.slice(0, 14).map((it, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${theme.accent}`} />
                      <div className="flex-1 text-sm">{it.name}</div>
                      <div className="text-sm opacity-60">{it.page}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {variant === "c" && (
            <div className="flex h-full flex-col">
              <div className="mt-3 text-center text-xs font-semibold tracking-widest opacity-60">{t.apps.ebooks.book.tocLabel}</div>
              <div className="mt-5 grid grid-cols-1 gap-2">
                {items.slice(0, 14).map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="opacity-90">{it.name}</div>
                    <div className="opacity-50">{it.page}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // FOREWORD / ENDING / SUBMENU PAGE
  const heading =
    section === "foreword" ? ex.forewordHeading : section === "ending" ? ex.endingHeading : (t.apps.ebooks.sections[state.submenuKey]?.title || state.submenuKey);

  return (
    <div className={frameClass}>
      <div className={pageClass}>
        {variant === "a" && (
          <div className="flex h-full flex-col">
            <div className="mt-6 text-2xl font-semibold">{heading}</div>
            <div className="mt-4 whitespace-pre-wrap text-sm leading-6 opacity-90">
              {state.body || ex.emptyBody}
            </div>
          </div>
        )}

        {variant === "b" && (
          <div className="flex h-full flex-col">
            <div className="mt-6 flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-full border border-black/10 bg-white/60">
                {state.circleImageDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={state.circleImageDataUrl} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="text-2xl font-semibold">{heading}</div>
            </div>
            <div className="mt-4 whitespace-pre-wrap text-sm leading-6 opacity-90">
              {state.body || ex.emptyBody}
            </div>
            <div className="mt-auto">
              <div className={`h-2 w-20 rounded-full ${theme.accent}`} />
            </div>
          </div>
        )}

        {variant === "c" && (
          <div className="flex h-full flex-col">
            <div className="mt-6 rounded-2xl border border-black/10 bg-white/60 p-5">
              <div className="text-xl font-semibold">{heading}</div>
              <div className="mt-3 whitespace-pre-wrap text-sm leading-6 opacity-90">
                {state.body || ex.emptyBody}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const ExtrasTemplates = { Editor, Preview };
export default ExtrasTemplates;
