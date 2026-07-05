"use client";

import { useEffect, useMemo, useState } from "react";
import { useT } from "@/lib/i18n/provider";

export default function ArchiveView({
  savedNotes,
  q,
  setQ,
  filteredNotes,
  onEdit,
  onToggleInclude,
  onDelete,
  onDeleteMany,
  onDeleteAll,
}) {
  const t = useT();
  const a = t.apps.ebooks.archive;
  const [selected, setSelected] = useState(() => new Set());

  // filter солигдоход, харагдахгүй болсон сонголтуудыг автоматаар цэвэрлэнэ
  useEffect(() => {
    const visibleIds = new Set(filteredNotes.map((n) => n.id));
    setSelected((prev) => {
      const next = new Set();
      prev.forEach((id) => {
        if (visibleIds.has(id)) next.add(id);
      });
      return next;
    });
  }, [filteredNotes]);

  const selectedCount = selected.size;

  const allVisibleSelected = useMemo(() => {
    if (filteredNotes.length === 0) return false;
    return filteredNotes.every((n) => selected.has(n.id));
  }, [filteredNotes, selected]);

  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllVisible = () => {
    if (filteredNotes.length === 0) return;
    setSelected((prev) => {
      const next = new Set(prev);
      const shouldSelectAll = !filteredNotes.every((n) => next.has(n.id));
      if (shouldSelectAll) {
        filteredNotes.forEach((n) => next.add(n.id));
      } else {
        filteredNotes.forEach((n) => next.delete(n.id));
      }
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  return (
    <div className="mt-7 rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:px-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-[#475569] text-[11px] uppercase tracking-[0.18em]">
          {a.filesTitle}
        </div>

        <input
          className="w-[260px] max-w-full rounded-2xl border border-[#e2e8f0] bg-white/95 px-4 py-2 text-[12px] outline-none focus:border-transparent focus:ring-2 focus:ring-[rgba(31,111,178,0.35)]"
          onChange={(e) => setQ(e.target.value)}
          placeholder={a.searchPlaceholder}
          value={q}
        />
      </div>

      {/* Bulk actions */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          className="rounded-full border border-[#cbd5e1] bg-white px-3 py-1 text-[#334155] text-[11px] hover:bg-[#f8fafc]"
          onClick={toggleAllVisible}
          type="button"
        >
          {allVisibleSelected ? a.deselectAll : a.selectAll}
        </button>

        {selectedCount > 0 ? (
          <>
            <span className="text-[#64748b] text-[11px]">
              {a.selected} <b>{selectedCount}</b>
            </span>

            <button
              className="rounded-full border border-[#e3b0b0] bg-white px-3 py-1 text-[#c75b5b] text-[11px] hover:bg-[#fff0f0]"
              onClick={() => {
                if (
                  !confirm(
                    a.deleteSelectedConfirm.replace(
                      "{n}",
                      String(selectedCount)
                    )
                  )
                )
                  return;
                onDeleteMany(Array.from(selected));
                clearSelection();
              }}
              type="button"
            >
              {a.deleteSelected}
            </button>

            <button
              className="rounded-full border border-[#cbd5e1] bg-white px-3 py-1 text-[#334155] text-[11px] hover:bg-[#f8fafc]"
              onClick={clearSelection}
              type="button"
            >
              {a.clearSelection}
            </button>
          </>
        ) : (
          <span className="text-[#94a3b8] text-[11px]">{a.selectHint}</span>
        )}

        <div className="ml-auto">
          <button
            className="rounded-full border border-[#e3b0b0] bg-white px-3 py-1 text-[#c75b5b] text-[11px] hover:bg-[#fff0f0]"
            onClick={() => {
              if (!savedNotes.length) return;
              if (
                !confirm(
                  a.deleteAllConfirm.replace("{n}", String(savedNotes.length))
                )
              )
                return;
              onDeleteAll();
              clearSelection();
            }}
            type="button"
          >
            {a.deleteAll}
          </button>
        </div>
      </div>

      {filteredNotes.length === 0 ? (
        <div className="text-[#94a3b8] text-[11px]">{a.noNotes}</div>
      ) : (
        <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
          {filteredNotes.map((n) => {
            const checked = selected.has(n.id);
            return (
              <div
                className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-2 text-[11px] ${
                  checked
                    ? "border-[rgba(31,111,178,0.35)] bg-[rgba(31,111,178,0.12)]"
                    : "border-[#e2e8f0] bg-[#f8fafc]"
                }`}
                key={n.id}
              >
                {/* checkbox + title */}
                <div className="flex min-w-0 items-start gap-3">
                  <input
                    checked={checked}
                    className="mt-1 h-4 w-4 rounded border-[#cbd5e1]"
                    onChange={() => toggleOne(n.id)}
                    type="checkbox"
                  />

                  <div className="min-w-0">
                    <div className="truncate font-semibold text-[#0f172a]">
                      {n.title}
                    </div>
                    <div className="text-[#64748b] text-[10px]">
                      {n.dateLabel} · {n.includeInBook ? a.inBook : a.draftOnly}
                    </div>
                  </div>
                </div>

                {/* actions */}
                <div className="flex shrink-0 flex-col gap-1 text-[10px]">
                  <button
                    className="rounded-full border border-[#cbd5e1] bg-white px-3 py-0.5 text-[#334155] hover:bg-[#f8fafc]"
                    onClick={() => onEdit(n)}
                    type="button"
                  >
                    {a.edit}
                  </button>

                  <button
                    className="rounded-full border border-[#cbd5e1] bg-white px-3 py-0.5 text-[#334155] hover:bg-[#f8fafc]"
                    onClick={() => onToggleInclude(n.id)}
                    type="button"
                  >
                    {n.includeInBook ? a.removeFromBook : a.addToBook}
                  </button>

                  <button
                    className="rounded-full border border-[#e3b0b0] bg-white px-3 py-0.5 text-[#c75b5b] hover:bg-[#fff0f0]"
                    onClick={() => onDelete(n.id)}
                    type="button"
                  >
                    {a.delete}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
