"use client";

import { Camera, CheckCircle, Plus, Trash2, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { CategoryId } from "./financeTypes";
import { categoryLabels, categoriesForType } from "./financeCategories";
import { useLocale, useT } from "@/lib/i18n/provider";

type LineDraft = {
  id: string;
  itemName: string;
  category: CategoryId;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  date: string;
  type: "income" | "expense";
};

type Props = {
  onAdd: (payload: {
    type: "income" | "expense";
    amount: number;
    category: CategoryId;
    date?: string;
    note?: string;
    source?: "receipt";
  }) => Promise<void>;
  modal?: boolean;
  onClose?: () => void;
};

/** Compress an image to JPEG, max 1600px on the longest side, ~85% quality.
 *  Reduces typical phone photos from 3-8 MB down to ~200-500 KB. */
function compressImage(
  file: File,
  maxPx = 1600,
  quality = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxPx || height > maxPx) {
        if (width >= height) {
          height = Math.round((height * maxPx) / width);
          width = maxPx;
        } else {
          width = Math.round((width * maxPx) / height);
          height = maxPx;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          blob ? resolve(blob) : reject(new Error("toBlob"));
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("load"));
    };
    img.src = url;
  });
}

function newRowId() {
  return `row-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function emptyRow(): LineDraft {
  return {
    id: newRowId(),
    itemName: "",
    category: "other",
    quantity: 1,
    unitPrice: 0,
    totalPrice: 0,
    date: todayYmd(),
    type: "expense",
  };
}

export function ReceiptUploadSection({ onAdd, modal = false, onClose }: Props) {
  const t = useT();
  const r = t.apps.finance.receipt;
  const locale = useLocale();
  const labels = categoryLabels(locale);
  const inputRef = useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<LineDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const totalSum = useMemo(
    () => rows.reduce((sum, row) => sum + (Number(row.totalPrice) || 0), 0),
    [rows]
  );

  const handleFile = async (file: File) => {
    setError(null);
    setSaved(false);
    setRows([]);
    setAnalyzing(true);

    try {
      // Compress before upload — phone photos are 3-8 MB which hits nginx/CF limits
      const compressed = await compressImage(file);
      const form = new FormData();
      form.append("file", compressed, "receipt.jpg");

      const res = await fetch("/api/finance/analyze", {
        method: "POST",
        body: form,
        credentials: "same-origin",
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json?.error ?? r.errorFallback);
        return;
      }

      const list: any[] = (json.drafts ?? []).filter((d: any) => d?.amount > 0);

      if (!list.length) {
        setError(r.notFound);
        return;
      }

      setRows(
        list.map((d) => ({
          id: newRowId(),
          itemName: d.itemName || d.note || "",
          category: d.category ?? "other",
          quantity: Number(d.quantity) || 1,
          unitPrice: Number(d.unitPrice) || Number(d.amount) || 0,
          totalPrice: Number(d.amount) || 0,
          date: d.date || todayYmd(),
          type: d.type === "income" ? "income" : "expense",
        }))
      );
    } catch {
      setError(r.networkError);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    e.target.value = "";
  };

  function updateRow<K extends keyof LineDraft>(
    id: string,
    key: K,
    value: LineDraft[K]
  ) {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const next = { ...row, [key]: value };
        // Excel-like behaviour: editing quantity/unit price recalculates the total.
        if (key === "quantity" || key === "unitPrice") {
          next.totalPrice = Math.round(
            (Number(next.quantity) || 0) * (Number(next.unitPrice) || 0)
          );
        }
        return next;
      })
    );
  }

  function deleteRow(id: string) {
    setRows((prev) => prev.filter((row) => row.id !== id));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  const handleSave = async () => {
    const valid = rows.filter(
      (row) => row.itemName.trim() && row.totalPrice > 0
    );
    if (!valid.length) return;
    setSaving(true);
    try {
      for (const row of valid) {
        const detail =
          row.quantity > 1
            ? `${row.itemName.trim()} (${row.quantity} x ${row.unitPrice.toLocaleString("mn-MN")}₮)`
            : row.itemName.trim();
        await onAdd({
          type: row.type,
          amount: row.totalPrice,
          category: row.category,
          date: row.date || undefined,
          note: detail,
          source: "receipt",
        });
      }
      setSaved(true);
      setRows([]);
    } finally {
      setSaving(false);
    }
  };

  const clear = () => {
    setRows([]);
    setError(null);
    setSaved(false);
  };

  return (
    <>
      {modal && (
        <button
          aria-label="Close receipt upload"
          className="fixed inset-0 z-40 cursor-default bg-slate-950/35"
          onClick={onClose}
          type="button"
        />
      )}
      <section
        className={
          modal
            ? "-translate-y-1/2 fixed inset-x-4 top-1/2 z-50 max-h-[calc(100dvh-2rem)] space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-2xl sm:inset-x-8"
            : "space-y-3 rounded-2xl border border-slate-200 bg-white px-4 py-4"
        }
      >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 text-sm">{r.title}</h3>
        <div className="flex items-center gap-2">
          {rows.length > 0 && (
            <button
              className="text-[11px] text-slate-400 hover:text-slate-600"
              onClick={clear}
              type="button"
            >
              <X className="inline h-3.5 w-3.5" /> {r.clear}
            </button>
          )}
          {modal && (
            <button
              aria-label="Close receipt upload"
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              onClick={onClose}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <p className="text-[11px] text-slate-500">{r.description}</p>

      {/* No capture attribute — lets users choose camera OR gallery on mobile */}
      <input
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleChange}
        ref={inputRef}
        type="file"
      />

      {!analyzing && !rows.length && !saved && (
        <button
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 text-xs shadow-sm transition hover:bg-slate-50"
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          <Camera className="h-4 w-4 text-sky-500" />
          {r.uploadBtn}
        </button>
      )}

      {analyzing && (
        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <span className="animate-spin">⏳</span> {r.analyzing}
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-[11px] text-red-600">
          {error}
        </p>
      )}

      {saved && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700">
          <CheckCircle className="h-4 w-4" />
          {r.savedSuccess}
          <button
            className="ml-2 underline"
            onClick={() => {
              setSaved(false);
              inputRef.current?.click();
            }}
            type="button"
          >
            {r.uploadAnother}
          </button>
        </div>
      )}

      {rows.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] text-slate-500">{r.editHint}</p>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[640px] text-xs">
              <thead>
                <tr className="bg-slate-50 text-left text-[10px] text-slate-500">
                  <th className="px-2 py-2 font-medium">{r.colItemName}</th>
                  <th className="px-2 py-2 font-medium">{r.colCategory}</th>
                  <th className="px-2 py-2 text-right font-medium">
                    {r.colQuantity}
                  </th>
                  <th className="px-2 py-2 text-right font-medium">
                    {r.colUnitPrice}
                  </th>
                  <th className="px-2 py-2 text-right font-medium">
                    {r.colTotalPrice}
                  </th>
                  <th className="px-2 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const options = categoriesForType(
                    row.type === "income" ? "income" : "expense"
                  );
                  return (
                    <tr className="border-slate-100 border-t" key={row.id}>
                      <td className="px-1 py-1">
                        <input
                          className="w-full min-w-[120px] rounded-md border border-transparent px-2 py-1.5 text-slate-800 outline-none focus:border-sky-300 focus:bg-sky-50/40"
                          onChange={(e) =>
                            updateRow(row.id, "itemName", e.target.value)
                          }
                          placeholder="—"
                          value={row.itemName}
                        />
                      </td>
                      <td className="px-1 py-1">
                        <select
                          className="w-full rounded-md border border-transparent px-2 py-1.5 text-slate-800 outline-none focus:border-sky-300 focus:bg-sky-50/40"
                          onChange={(e) =>
                            updateRow(
                              row.id,
                              "category",
                              e.target.value as CategoryId
                            )
                          }
                          value={row.category}
                        >
                          {options.map((id) => (
                            <option key={id} value={id}>
                              {labels[id]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-1 py-1">
                        <input
                          className="w-20 rounded-md border border-transparent px-2 py-1.5 text-right text-slate-800 outline-none focus:border-sky-300 focus:bg-sky-50/40"
                          min={0}
                          onChange={(e) =>
                            updateRow(
                              row.id,
                              "quantity",
                              Number(e.target.value) || 0
                            )
                          }
                          type="number"
                          value={row.quantity}
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          className="w-24 rounded-md border border-transparent px-2 py-1.5 text-right text-slate-800 outline-none focus:border-sky-300 focus:bg-sky-50/40"
                          min={0}
                          onChange={(e) =>
                            updateRow(
                              row.id,
                              "unitPrice",
                              Number(e.target.value) || 0
                            )
                          }
                          type="number"
                          value={row.unitPrice}
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          className="w-24 rounded-md border border-transparent px-2 py-1.5 text-right font-medium text-slate-900 outline-none focus:border-sky-300 focus:bg-sky-50/40"
                          min={0}
                          onChange={(e) =>
                            updateRow(
                              row.id,
                              "totalPrice",
                              Number(e.target.value) || 0
                            )
                          }
                          type="number"
                          value={row.totalPrice}
                        />
                      </td>
                      <td className="px-1 py-1 text-center">
                        <button
                          aria-label={r.deleteRow}
                          className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          onClick={() => deleteRow(row.id)}
                          title={r.deleteRow}
                          type="button"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-slate-200 border-t bg-slate-50">
                  <td
                    className="px-2 py-2 font-medium text-slate-700"
                    colSpan={4}
                  >
                    {r.totalSum}
                  </td>
                  <td className="px-2 py-2 text-right font-semibold text-slate-900">
                    {totalSum.toLocaleString("mn-MN")} ₮
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          <button
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-[11px] text-slate-600 transition hover:bg-slate-50"
            onClick={addRow}
            type="button"
          >
            <Plus className="h-3.5 w-3.5" />
            {r.addRow}
          </button>

          <div className="flex gap-2 pt-1">
            <button
              className="rounded-full bg-sky-500/90 px-4 py-1.5 font-medium text-white text-xs transition hover:bg-sky-400 disabled:opacity-60"
              disabled={
                saving ||
                !rows.some((row) => row.itemName.trim() && row.totalPrice > 0)
              }
              onClick={handleSave}
              type="button"
            >
              {saving ? r.saving : `📥 ${r.confirmBtn}`}
            </button>
            <button
              className="rounded-full border border-slate-200 px-3 py-1.5 text-slate-600 text-xs transition hover:bg-slate-50"
              onClick={() => inputRef.current?.click()}
              type="button"
            >
              {r.anotherImage}
            </button>
          </div>
        </div>
      )}
      </section>
    </>
  );
}
