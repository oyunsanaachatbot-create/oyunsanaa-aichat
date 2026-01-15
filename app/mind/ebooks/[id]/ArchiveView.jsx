"use client";

import { useEffect, useMemo, useState } from "react";

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
    <div className="mt-7 bg-white/85 rounded-3xl shadow-[0_16px_40px_rgba(0,0,0,0.14)] border border-[#f0e1d4] px-4 sm:px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="text-[11px] text-[#8a6b50] uppercase tracking-[0.18em]">
          Файл (хадгалсан бичвэрүүд)
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Хайх: гарчиг / он сар өдөр..."
          className="w-[260px] max-w-full rounded-2xl border border-[#ecd7c5] bg-white/95 text-[12px] px-4 py-2 outline-none focus:ring-2 focus:ring-[#d69b6d] focus:border-transparent"
        />
      </div>

      {/* Bulk actions */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button
          type="button"
          onClick={toggleAllVisible}
          className="rounded-full border border-[#d0b09a] bg-white px-3 py-1 text-[11px] text-[#7c5a3e] hover:bg-[#fff7f0]"
        >
          {allVisibleSelected ? "Сонголтыг цуцлах" : "Бүгдийг сонгох"}
        </button>

        {selectedCount > 0 ? (
          <>
            <span className="text-[11px] text-[#9b7a5e]">
              Сонгосон: <b>{selectedCount}</b>
            </span>

            <button
              type="button"
              onClick={() => {
                if (!confirm(`${selectedCount} бичвэрийг устгах уу?`)) return;
                onDeleteMany(Array.from(selected));
                clearSelection();
              }}
              className="rounded-full border border-[#e3b0b0] bg-white px-3 py-1 text-[11px] text-[#c75b5b] hover:bg-[#fff0f0]"
            >
              Сонгосныг устгах
            </button>

            <button
              type="button"
              onClick={clearSelection}
              className="rounded-full border border-[#d0b09a] bg-white px-3 py-1 text-[11px] text-[#7c5a3e] hover:bg-[#fff7f0]"
            >
              Цэвэрлэх
            </button>
          </>
        ) : (
          <span className="text-[11px] text-[#a9896d]">
            Сонгоод олон үйлдэл хийж болно.
          </span>
        )}

        <div className="ml-auto">
          <button
            type="button"
            onClick={() => {
              if (!savedNotes.length) return;
              if (!confirm(`БҮГД (${savedNotes.length}) бичвэрийг бүр мөсөн устгах уу?`)) return;
              onDeleteAll();
              clearSelection();
            }}
            className="rounded-full border border-[#e3b0b0] bg-white px-3 py-1 text-[11px] text-[#c75b5b] hover:bg-[#fff0f0]"
          >
            Бүгдийг устгах
          </button>
        </div>
      </div>

      {filteredNotes.length === 0 ? (
        <div className="text-[11px] text-[#a9896d]">
          Одоогоор хадгалсан тэмдэглэл алга. Эхлээд нэгийг хадгалаарай.
        </div>
      ) : (
        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
          {filteredNotes.map((n) => {
            const checked = selected.has(n.id);
            return (
              <div
                key={n.id}
                className={`rounded-2xl border px-4 py-2 text-[11px] flex items-center justify-between gap-3 ${
                 checked
  ? "bg-[rgba(31,111,178,0.12)] border-[rgba(31,111,178,0.35)]"
  : "bg-[#f7eee6] border-[#ecd7c5]"
                }`}
              >
                {/* checkbox + title */}
                <div className="min-w-0 flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleOne(n.id)}
                    className="mt-1 h-4 w-4 rounded border-[#d0b09a]"
                  />

                  <div className="min-w-0">
                    <div className="font-semibold text-[#5b3f2c] truncate">
                      {n.title}
                    </div>
                    <div className="text-[10px] text-[#9b7a5e]">
                      {n.dateLabel} · {n.includeInBook ? "Номонд орно" : "Зөвхөн ноорог"}
                    </div>
                  </div>
                </div>

                {/* actions */}
                <div className="flex flex-col gap-1 text-[10px] shrink-0">
                  <button
                    type="button"
                    onClick={() => onEdit(n)}
                    className="rounded-full border border-[#d0b09a] bg-white px-3 py-0.5 text-[#7c5a3e] hover:bg-[#fff7f0]"
                  >
                    Засах
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleInclude(n.id)}
                    className="rounded-full border border-[#d0b09a] bg-white px-3 py-0.5 text-[#7c5a3e] hover:bg-[#fff7f0]"
                  >
                    {n.includeInBook ? "Номноос хасах" : "Номонд оруулах"}
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(n.id)}
                    className="rounded-full border border-[#e3b0b0] bg-white px-3 py-0.5 text-[#c75b5b] hover:bg-[#fff0f0]"
                  >
                    Устгах
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
