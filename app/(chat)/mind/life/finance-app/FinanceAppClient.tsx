"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Coffee, MessageCircle, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type CategoryId =
  | "food"
  | "transport"
  | "clothes"
  | "home"
  | "fun"
  | "health"
  | "other";
type SubOpt = { id: string; label: string };

export const SUBCATEGORY_OPTIONS: Record<CategoryId, SubOpt[]> = {
  food: [
    { id: "food_veg", label: "Ногоо / жимс" },
    { id: "food_meat", label: "Мах / махан бүтээгдэхүүн" },
    { id: "food_grain", label: "Гурил / будаа" },
    { id: "food_dairy", label: "Сүү / цагаан идээ" },
    { id: "food_snack", label: "Амттан / зууш" },
    { id: "food_drink", label: "Ундаа / кофе" },
    { id: "food_other", label: "Бусад хүнс" },
  ],

  clothes: [
    { id: "clothes_shoes", label: "Гутал" },
    { id: "clothes_socks", label: "Оймс" },
    { id: "clothes_outer", label: "Гадуур хувцас" },
    { id: "clothes_under", label: "Дотуур" },
    { id: "clothes_other", label: "Бусад хувцас" },
  ],

  home: [
    { id: "home_furniture", label: "Тавилга" },
    { id: "home_appliance", label: "Цахилгаан хэрэгсэл" },
    { id: "home_cleaning", label: "Цэвэрлэгээ" },
    { id: "home_kitchen", label: "Гал тогоо" },
    { id: "home_other", label: "Бусад гэр ахуй" },
  ],

  health: [
    { id: "health_medicine", label: "Эм" },
    { id: "health_supplement", label: "Витамин" },
    { id: "health_clinic", label: "Эмч / эмнэлэг" },
    { id: "health_other", label: "Бусад" },
  ],

  transport: [
    { id: "transport_fuel", label: "Шатахуун" },
    { id: "transport_taxi", label: "Такси" },
    { id: "transport_bus", label: "Автобус" },
    { id: "transport_other", label: "Бусад" },
  ],

  fun: [
    { id: "fun_cafe", label: "Кафе / ресторан" },
    { id: "fun_cinema", label: "Кино / энтертайнмент" },
    { id: "fun_gift", label: "Бэлэг" },
    { id: "fun_other", label: "Бусад" },
  ],

  other: [{ id: "other_other", label: "Бусад" }],
};
type TransactionType = "income" | "expense";

type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  category: CategoryId;
  date: string; // ISO yyyy-mm-dd
  note?: string;
  source: "text" | "voice" | "image";
  createdAt: string;
};

const CATEGORY_LABELS: Record<CategoryId, string> = {
  food: "Хоол, хүнс",
  transport: "Тээвэр",
  clothes: "Хувцас",
  home: "Гэр, хэрэглээ",
  fun: "Зугаа, чөлөөт цаг",
  health: "Эрүүл мэнд",
  other: "Бусад",
};

type Props = { userId: string };

export default function FinanceAppClient({ userId }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<CategoryId>("food");
  const [date, setDate] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [showEntry, setShowEntry] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔹 Supabase-аас өгөгдөл татах (✅ user_id filter)
  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId) // ✅ алтан дүрэм
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase load error", error);
        setLoading(false);
        return;
      }
      if (!data) {
        setTransactions([]);
        setLoading(false);
        return;
      }

      setTransactions(
        data.map((row: any) => ({
          id: row.id,
          type: row.type,
          amount: Number(row.amount) || 0,
          category: row.category,
          date: row.date,
          note: row.note ?? "",
          source: row.source ?? "text",
          createdAt: row.created_at,
        }))
      );

      setLoading(false);
    };

    load();
  }, [userId]);

  // 🔹 Нийт орлого / зарлага / үлдэгдэл
  const { totalIncome, totalExpense, balance } = useMemo(() => {
    let income = 0;
    let expense = 0;

    for (const t of transactions) {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    }

    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
    };
  }, [transactions]);

  // 🔹 Гүйлгээ нэмэх (✅ insert → returned row → UI update)
  const handleAdd = async () => {
    const value = Number(amount.replace(/\s/g, ""));
    if (!value || isNaN(value)) return;

    const todayIso = new Date().toISOString().slice(0, 10);

    // optimistic (түр)
    const tempId = `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const tempTx: Transaction = {
      id: tempId,
      type,
      amount: value,
      category,
      date: date || todayIso,
      note: note.trim() || undefined,
      source: "text",
      createdAt: new Date().toISOString(),
    };

    setTransactions((prev) => [tempTx, ...prev]);
    setAmount("");
    setNote("");

    // Supabase insert (✅ user_id)
    const payload = {
      user_id: userId,
      type,
      amount: value,
      category,
      date: date || todayIso,
      note: note.trim() || null,
      source: "text",
      raw_text: note.trim() || null,
    };

    const { data, error } = await supabase
      .from("transactions")
      .insert(payload)
      .select("*")
      .single();

    if (error || !data) {
      console.error("Supabase insert error", error);
      // optimistic rollback
      setTransactions((prev) => prev.filter((t) => t.id !== tempId));
      return;
    }

    const saved: Transaction = {
      id: data.id,
      type: data.type,
      amount: Number(data.amount) || 0,
      category: data.category,
      date: data.date,
      note: data.note ?? "",
      source: data.source ?? "text",
      createdAt: data.created_at,
    };

    // temp мөрийг жинхэнээр сольж өгнө
    setTransactions((prev) => [saved, ...prev.filter((t) => t.id !== tempId)]);
  };

  // 🔹 Устгах (✅ supabase delete + user_id filter)
  const handleDelete = async (id: string) => {
    // temp мөрүүдийг шууд устгая
    if (id.startsWith("temp-")) {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      return;
    }

    // UI optimistic
    const prev = transactions;
    setTransactions((cur) => cur.filter((t) => t.id !== id));

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", userId); // ✅ алтан дүрэм

    if (error) {
      console.error("Supabase delete error", error);
      // rollback
      setTransactions(prev);
    }
  };

  // Категориор нийлбэр (гар шивэх хэсгийн баруун талд)
  const byCategory = useMemo(() => {
    const cat: Record<CategoryId, number> = {
      food: 0,
      transport: 0,
      clothes: 0,
      home: 0,
      fun: 0,
      health: 0,
      other: 0,
    };
    for (const t of transactions) {
      if (t.type === "expense") {
        cat[t.category] += t.amount;
      }
    }
    return cat;
  }, [transactions]);

  return (
    <div className="min-h-screen relative text-slate-50 bg-gradient-to-b from-[#020c1a] via-[#071a33] to-[#010712]">
      {/* Гэрэл */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-[-20%] w-[420px] h-[420px] rounded-full bg-sky-400/28 blur-3xl" />
        <div className="absolute top-[-10%] right-[-8%] w-[360px] h-[360px] rounded-full bg-cyan-400/22 blur-3xl" />
      </div>

      <main className="relative z-10 px-4 py-7 flex justify-center">
        <div className="w-full max-w-5xl rounded-3xl border border-white/18 bg-white/10 backdrop-blur-2xl shadow-[0_24px_80px_rgba(15,23,42,0.9)] px-5 py-7 space-y-7">
          {/* Толгой */}
          <div className="flex items-start justify-between gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-100/90">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15 border border-white/35">
                  <Coffee className="h-4 w-4" />
                </span>
                <span>Тогтвортой амьдрал</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs sm:text-sm text-slate-50">
                <span>Миний санхүү (жижиг апп)</span>
              </div>
              {loading && (
                <div className="text-[11px] text-slate-300">Ачаалж байна…</div>
              )}
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/35 bg-white/15 px-3 py-1.5 text-[12px] font-medium text-slate-50 hover:bg-white/25 transition"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Чат руу буцах</span>
              <span className="sm:hidden">Чат</span>
            </Link>
          </div>

          {/* Гарчиг + ерөнхий тайлан */}
          <section className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-semibold leading-snug text-[#DCE8FF] drop-shadow-[0_0_12px_rgba(220,232,255,0.55)]">
              Санхүүгээ энгийнээр хөтлөх жижиг туслах
            </h1>
            <p className="text-sm sm:text-base text-slate-100/90 leading-relaxed">
              Ихэнх гүйлгээгээ чатанд (зураг, voice, текстээр) Оюунсанаад хэлнэ.
              Энэ хуудас нь голчлон тайлан, CHECK харах, хугацаагаар / бараагаар
              эргэж харахад зориулсан.
            </p>

            <p className="text-[11px] sm:text-xs text-slate-200">
              Нийт орлого:{" "}
              <span className="text-emerald-300 font-semibold">
                {totalIncome.toLocaleString("mn-MN")} ₮
              </span>{" "}
              · Нийт зарлага:{" "}
              <span className="text-rose-300 font-semibold">
                {totalExpense.toLocaleString("mn-MN")} ₮
              </span>{" "}
              · Үлдэгдэл:{" "}
              <span
                className={`font-semibold ${
                  balance >= 0 ? "text-sky-300" : "text-amber-300"
                }`}
              >
                {balance.toLocaleString("mn-MN")} ₮
              </span>
            </p>
          </section>

          <ReportSection transactions={transactions} />

          {/* ✍ Гараар гүйлгээ шивэх */}
          <section className="mt-8 space-y-3">
            <button
              type="button"
              onClick={() => setShowEntry((v) => !v)}
              className="w-full rounded-2xl border border-sky-400/50 bg-sky-500/15 px-4 py-2.5 text-xs sm:text-sm font-medium text-sky-100 hover:bg-sky-500/25 transition"
            >
              {showEntry
                ? "− Гараар гүйлгээ шивэхийг нуух"
                : "✍ Гараар гүйлгээ шивэх"}
            </button>

            {showEntry && (
              <div className="grid md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.7fr)] gap-5">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/25 bg-white/10 px-4 py-4 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Plus className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Шинэ гүйлгээ нэмэх
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="text-[11px] text-slate-200">Төрөл</span>
                        <div className="flex rounded-xl border border-white/25 bg-white/10 p-1">
                          <button
                            type="button"
                            onClick={() => setType("expense")}
                            className={`flex-1 rounded-lg py-1.5 text-xs ${
                              type === "expense"
                                ? "bg-rose-500/80 text-white"
                                : "text-slate-100/80"
                            }`}
                          >
                            Зарлага
                          </button>
                          <button
                            type="button"
                            onClick={() => setType("income")}
                            className={`flex-1 rounded-lg py-1.5 text-xs ${
                              type === "income"
                                ? "bg-emerald-500/80 text-white"
                                : "text-slate-100/80"
                            }`}
                          >
                            Орлого
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 text-xs">
                        <label className="text-[11px] text-slate-200">
                          Дүн (₮)
                        </label>
                        <input
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="50 000"
                          className="rounded-xl border border-white/25 bg-white/10 px-3 py-1.5 text-sm text-slate-50 outline-none focus:border-white/60"
                        />
                      </div>

                      <div className="flex flex-col gap-1 text-xs">
                        <label className="text-[11px] text-slate-200">
                          Категори
                        </label>
                        <select
                          value={category}
                          onChange={(e) =>
                            setCategory(e.target.value as CategoryId)
                          }
                          className="rounded-xl border border-white/25 bg-white/10 px-3 py-1.5 text-sm text-slate-50 outline-none focus:border-white/60"
                        >
                          {Object.entries(CATEGORY_LABELS).map(
                            ([id, label]) => (
                              <option
                                key={id}
                                value={id}
                                className="bg-slate-900 text-slate-50"
                              >
                                {label}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1 text-xs">
                        <label className="text-[11px] text-slate-200">
                          Огноо
                        </label>
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="rounded-xl border border-white/25 bg-white/10 px-3 py-1.5 text-sm text-slate-50 outline-none focus:border-white/60"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 text-xs">
                      <label className="text-[11px] text-slate-200">
                        Тэмдэглэл (сонголттой)
                      </label>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                        placeholder="Жишээ: талх, сүү авсан."
                        className="rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-sm text-slate-50 outline-none focus:border-white/60 resize-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAdd}
                      className="mt-1 inline-flex items-center justify-center rounded-full bg-sky-500/90 hover:bg-sky-400 px-4 py-1.5 text-xs font-medium text-white transition"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Гүйлгээ хадгалах
                    </button>
                  </div>

                  <div className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 space-y-2">
                    <h3 className="text-xs font-medium text-slate-100">
                      Категориор нь (зарлага)
                    </h3>
                    <div className="space-y-1.5 text-[11px]">
                      {Object.entries(CATEGORY_LABELS).map(([id, label]) => {
                        const value = byCategory[id as CategoryId] || 0;
                        if (!value) return null;
                        return (
                          <div
                            key={id}
                            className="flex items-center justify-between gap-2"
                          >
                            <span className="text-slate-200">{label}</span>
                            <span className="text-slate-50 font-medium">
                              {value.toLocaleString("mn-MN")} ₮
                            </span>
                          </div>
                        );
                      })}
                      {!totalExpense && (
                        <p className="text-[11px] text-slate-400">
                          Одоогоор зарлагын гүйлгээ байхгүй байна.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/25 bg-white/10 px-4 py-4 space-y-3">
                  <h3 className="text-sm font-medium text-slate-100">
                    Сүүлийн гүйлгээнүүд
                  </h3>

                  {transactions.length === 0 ? (
                    <p className="text-[12px] text-slate-300">
                      Одоогоор ямар ч гүйлгээ алга.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
                      {transactions.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-start justify-between gap-2 rounded-xl bg-white/5 px-3 py-2"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 text-xs">
                              <span
                                className={
                                  t.type === "income"
                                    ? "text-emerald-300 font-semibold"
                                    : "text-rose-300 font-semibold"
                                }
                              >
                                {t.type === "income" ? "+ " : "- "}
                                {t.amount.toLocaleString("mn-MN")} ₮
                              </span>
                              <span className="text-[11px] text-slate-300">
                                {CATEGORY_LABELS[t.category]}
                              </span>
                            </div>
                            {t.note && (
                              <p className="text-[11px] text-slate-100/90">
                                {t.note}
                              </p>
                            )}
                            <p className="text-[10px] text-slate-400">
                              {t.date} ·{" "}
                              {t.source === "text"
                                ? "гараар"
                                : t.source === "voice"
                                ? "voice-оор"
                                : "зурагнаас"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDelete(t.id)}
                            className="mt-1 text-slate-400 hover:text-rose-300 transition"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}// === CHECK / ТАЙЛАНГИЙН ХЭСЭГ (БҮХ АНГИЛАЛ + ДЭД АНГИЛАЛ) ===
function ReportSection({ transactions }: { transactions: Transaction[] }) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [keyword, setKeyword] = useState("");

  const [typeFilter, setTypeFilter] = useState<"" | TransactionType>(""); // "" = хоёул
  const [category, setCategory] = useState<"" | CategoryId>(""); // "" = бүгд
  const [subCategory, setSubCategory] = useState<string>(""); // "" = бүгд

  const [storeFilter, setStoreFilter] = useState<string>(""); // "" = бүгд
  const [sortType, setSortType] = useState<"" | "asc" | "desc">("");

  const [showResult, setShowResult] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "bar">("list");

  // category солигдоход subCategory reset
  useEffect(() => {
    setSubCategory("");
  }, [category]);

  // SUBCATEGORY id -> label (SUBCATEGORY_OPTIONS дээр тулгуурлаж нэг мөр map хийнэ)
  const SUBCATEGORY_LABELS = useMemo(() => {
    const flat: Record<string, string> = {};
    (Object.keys(SUBCATEGORY_OPTIONS) as CategoryId[]).forEach((cat) => {
      (SUBCATEGORY_OPTIONS[cat] ?? []).forEach((opt) => {
        flat[opt.id] = opt.label;
      });
    });
    return flat;
  }, []);

  // NOTE-г "Дэлгүүр – бараа" гэж салгана
  const splitNote = (note?: string) => {
    const t = (note ?? "").trim();
    if (!t) return { store: "", item: "" };

    // en dash "–"
    const a = t.split("–").map((x) => x.trim()).filter(Boolean);
    if (a.length >= 2) return { store: a[0], item: a.slice(1).join(" – ") };

    // hyphen "-"
    const b = t.split("-").map((x) => x.trim()).filter(Boolean);
    if (b.length >= 2) return { store: b[0], item: b.slice(1).join(" - ") };

    return { store: "", item: t };
  };

  // дэлгүүрийн сонголтууд
  const storeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const tx of transactions) {
      const { store } = splitNote(tx.note);
      const s = (store || "").trim();
      if (s) set.add(s);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "mn"));
  }, [transactions]);

  // Дэд ангиллын filter option (сонгосон category дээр)
  const subOptions = useMemo(() => {
    if (!category) {
      // category = "" үед бүх дэд ангиллыг нэгтгээд харуулж болно
      const all: { id: string; label: string }[] = [];
      (Object.keys(SUBCATEGORY_OPTIONS) as CategoryId[]).forEach((cat) => {
        (SUBCATEGORY_OPTIONS[cat] ?? []).forEach((opt) => all.push(opt));
      });
      // unique
      const uniq = Array.from(new Map(all.map((o) => [o.id, o])).values());
      return uniq;
    }
    return SUBCATEGORY_OPTIONS[category] ?? [];
  }, [category]);

  // FILTERED list
  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();

    return transactions
      .filter((tx) => (fromDate ? tx.date >= fromDate : true))
      .filter((tx) => (toDate ? tx.date <= toDate : true))
      .filter((tx) => (typeFilter ? tx.type === typeFilter : true))
      .filter((tx) => (category ? tx.category === category : true))
      .filter((tx) => (subCategory ? (tx.subCategory ?? "") === subCategory : true))
      .filter((tx) => {
        if (!storeFilter) return true;
        const { store } = splitNote(tx.note);
        return (store || "").trim() === storeFilter;
      })
      .filter((tx) => {
        if (!k) return true;
        const { store, item } = splitNote(tx.note);
        return (
          (item || "").toLowerCase().includes(k) ||
          (store || "").toLowerCase().includes(k) ||
          (tx.note || "").toLowerCase().includes(k)
        );
      })
      .sort((a, b) => {
        if (sortType === "asc") return a.amount - b.amount;
        if (sortType === "desc") return b.amount - a.amount;
        return 0;
      });
  }, [transactions, fromDate, toDate, keyword, typeFilter, category, subCategory, storeFilter, sortType]);

  // SUMMARY
  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;

    const byCatIncome: Record<CategoryId, number> = {
      food: 0,
      transport: 0,
      clothes: 0,
      home: 0,
      fun: 0,
      health: 0,
      other: 0,
    };
    const byCatExpense: Record<CategoryId, number> = {
      food: 0,
      transport: 0,
      clothes: 0,
      home: 0,
      fun: 0,
      health: 0,
      other: 0,
    };

    // subcategory -> amount (income/expense тусад нь)
    const bySubIncome: Record<string, number> = {};
    const bySubExpense: Record<string, number> = {};

    // item -> amount (income/expense тусад нь)
    const byItemIncome: Record<string, number> = {};
    const byItemExpense: Record<string, number> = {};

    // store -> amount (ихэвчлэн зарлага дээр)
    const byStoreExpense: Record<string, number> = {};

    for (const tx of filtered) {
      const { store, item } = splitNote(tx.note);
      const itemKey = (item || tx.note || "Гүйлгээ").trim();
      const sc = (tx.subCategory ?? "").trim();

      if (tx.type === "income") {
        income += tx.amount;
        byCatIncome[tx.category] += tx.amount;
        if (sc) bySubIncome[sc] = (bySubIncome[sc] ?? 0) + tx.amount;
        if (itemKey) byItemIncome[itemKey] = (byItemIncome[itemKey] ?? 0) + tx.amount;
        continue;
      }

      expense += tx.amount;
      byCatExpense[tx.category] += tx.amount;
      if (sc) bySubExpense[sc] = (bySubExpense[sc] ?? 0) + tx.amount;
      if (itemKey) byItemExpense[itemKey] = (byItemExpense[itemKey] ?? 0) + tx.amount;

      const s = (store || "").trim();
      if (s) byStoreExpense[s] = (byStoreExpense[s] ?? 0) + tx.amount;
    }

    return {
      income,
      expense,
      byCatIncome,
      byCatExpense,
      bySubIncome,
      bySubExpense,
      byItemIncome,
      byItemExpense,
      byStoreExpense,
    };
  }, [filtered]);

  const balance = summary.income - summary.expense;

  // TOP items (typeFilter-аас хамаараад ямар top үзүүлэх вэ?)
  const topItems = useMemo(() => {
    const src =
      typeFilter === "income"
        ? summary.byItemIncome
        : typeFilter === "expense"
        ? summary.byItemExpense
        : // хоёуланг нь сонгосон үед зарлагын top-ийг түлхүү харуулъя (ихэнх хэрэгцээ)
          summary.byItemExpense;

    return Object.entries(src)
      .filter(([k]) => k.length > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
  }, [summary.byItemIncome, summary.byItemExpense, typeFilter]);

  const maxTopItem = topItems.length ? Math.max(...topItems.map(([, v]) => v)) : 0;

  const topStores = useMemo(() => {
    return Object.entries(summary.byStoreExpense)
      .filter(([k]) => k.length > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [summary.byStoreExpense]);

  // Дэд ангиллын breakdown (typeFilter-аар сонгоод үзүүлнэ)
  const subBreakdown = useMemo(() => {
    const src =
      typeFilter === "income"
        ? summary.bySubIncome
        : typeFilter === "expense"
        ? summary.bySubExpense
        : summary.bySubExpense; // хоёуланг нь үед зарлага дэд ангиллыг түлхүү

    return Object.entries(src)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);
  }, [summary.bySubIncome, summary.bySubExpense, typeFilter]);

  // Дэд ангиллын нэрийг label болгох
  const subLabel = (id: string) => SUBCATEGORY_LABELS[id] ?? id;

  return (
    <section className="mt-6 space-y-4">
      <h2 className="text-lg font-semibold text-slate-100">
        📊 CHECK / Тайлан (Хугацаа + Ангилал + Дэд ангилал)
      </h2>

      {/* Фильтерүүд */}
      <div className="grid sm:grid-cols-3 md:grid-cols-6 gap-3 bg-white/5 border border-white/15 rounded-2xl px-4 py-3 text-[11px] sm:text-xs">
        <div className="space-y-1">
          <label className="text-slate-200">Эхлэх огноо</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full rounded-xl border border-white/25 bg-white/10 px-2 py-1.5 text-[11px] text-slate-50 outline-none focus:border-white/60"
          />
        </div>

        <div className="space-y-1">
          <label className="text-slate-200">Дуусах огноо</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full rounded-xl border border-white/25 bg-white/10 px-2 py-1.5 text-[11px] text-slate-50 outline-none focus:border-white/60"
          />
        </div>

        <div className="space-y-1">
          <label className="text-slate-200">Бараа/тэмдэглэл</label>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="талх, мах, эм, цалин..."
            className="w-full rounded-xl border border-white/25 bg-white/10 px-2 py-1.5 text-[11px] text-slate-50 outline-none focus:border-white/60"
          />
        </div>

        <div className="space-y-1">
          <label className="text-slate-200">Орлого / Зарлага</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "" | TransactionType)}
            className="w-full rounded-xl border border-white/25 bg-white/10 px-2 py-1.5 text-[11px] text-slate-50 outline-none focus:border-white/60"
          >
            <option value="">Хоёуланг нь</option>
            <option value="income">Зөвхөн орлого</option>
            <option value="expense">Зөвхөн зарлага</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-slate-200">Категори</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryId | "")}
            className="w-full rounded-xl border border-white/25 bg-white/10 px-2 py-1.5 text-[11px] text-slate-50 outline-none focus:border-white/60"
          >
            <option value="">Бүгд</option>
            <option value="food">Хоол, хүнс</option>
            <option value="transport">Тээвэр</option>
            <option value="clothes">Хувцас</option>
            <option value="home">Гэр, хэрэглээ</option>
            <option value="fun">Зугаа, чөлөөт цаг</option>
            <option value="health">Эрүүл мэнд</option>
            <option value="other">Бусад</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-slate-200">Дэд ангилал</label>
          <select
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
            className="w-full rounded-xl border border-white/25 bg-white/10 px-2 py-1.5 text-[11px] text-slate-50 outline-none focus:border-white/60"
          >
            <option value="">Бүгд</option>
            {subOptions.map((opt) => (
              <option key={opt.id} value={opt.id} className="bg-slate-900 text-slate-50">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="text-slate-200">Дэлгүүр (сонголттой)</label>
          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            className="w-full rounded-xl border border-white/25 bg-white/10 px-2 py-1.5 text-[11px] text-slate-50 outline-none focus:border-white/60"
          >
            <option value="">Бүгд</option>
            {storeOptions.map((s) => (
              <option key={s} value={s} className="bg-slate-900 text-slate-50">
                {s}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-400">
            Note дотор “Дэлгүүр – бараа” (ж: “E-mart – талх”) хэлбэр байвал дэлгүүрээр шүүнэ.
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-slate-200">Дүнгээр эрэмбэлэх</label>
          <select
            value={sortType}
            onChange={(e) => setSortType(e.target.value as "" | "asc" | "desc")}
            className="w-full rounded-xl border border-white/25 bg-white/10 px-2 py-1.5 text-[11px] text-slate-50 outline-none focus:border-white/60"
          >
            <option value="">Энгийн</option>
            <option value="asc">Бага → их</option>
            <option value="desc">Их → бага</option>
          </select>
        </div>
      </div>

      {/* ✅ Тайлан гаргах / нуух (хүссэн логик) */}
      <button
        type="button"
        onClick={() => setShowResult((v) => !v)}
        className="inline-flex items-center justify-center rounded-full bg-white/80 text-slate-900 px-4 py-1.5 text-xs sm:text-sm font-medium hover:bg-white transition"
      >
        {showResult ? "❎ Тайланг нуух" : "✅ Тайлан гаргах"}
      </button>

      {!showResult && (
        <p className="text-[11px] text-slate-300">
          Хугацаагаа сонгоод “Тайлан гаргах” дар. Дараа нь категори/дэд ангилал/дэлгүүр/keyword-оор шүүнэ.
        </p>
      )}

      {showResult && (
        <div className="space-y-4">
          {/* 1) Нийт дүн */}
          <div className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 space-y-2 text-[11px] sm:text-xs">
            <h3 className="font-medium text-slate-100">Нийт дүн</h3>
            <div className="flex flex-wrap gap-4">
              <p className="text-slate-200">
                Орлого:{" "}
                <span className="text-emerald-300 font-semibold">
                  {summary.income.toLocaleString("mn-MN")} ₮
                </span>
              </p>
              <p className="text-slate-200">
                Зарлага:{" "}
                <span className="text-rose-300 font-semibold">
                  {summary.expense.toLocaleString("mn-MN")} ₮
                </span>
              </p>
              <p className="text-slate-200">
                Үлдэгдэл:{" "}
                <span className={balance >= 0 ? "text-sky-300 font-semibold" : "text-amber-300 font-semibold"}>
                  {balance.toLocaleString("mn-MN")} ₮
                </span>
              </p>
              <p className="text-slate-400">(Гүйлгээ: {filtered.length} мөр)</p>
            </div>
          </div>

          {/* 2) Том ангиллаар (typeFilter-оос хамаарч) */}
          <div className="grid md:grid-cols-2 gap-4">
            {(typeFilter === "" || typeFilter === "expense") && (
              <div className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 space-y-2 text-[11px] sm:text-xs">
                <h3 className="font-medium text-slate-100">Том ангиллаар (зарлага)</h3>
                {Object.entries(summary.byCatExpense).every(([, v]) => v === 0) ? (
                  <p className="text-slate-400">Өгөгдөл алга.</p>
                ) : (
                  Object.entries(summary.byCatExpense).map(([cat, val]) =>
                    val ? (
                      <div key={cat} className="flex items-center justify-between gap-2">
                        <span className="text-slate-200">{CATEGORY_LABELS[cat as CategoryId]}</span>
                        <span className="font-semibold text-slate-50">{val.toLocaleString("mn-MN")} ₮</span>
                      </div>
                    ) : null
                  )
                )}
              </div>
            )}

            {(typeFilter === "" || typeFilter === "income") && (
              <div className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 space-y-2 text-[11px] sm:text-xs">
                <h3 className="font-medium text-slate-100">Том ангиллаар (орлого)</h3>
                {Object.entries(summary.byCatIncome).every(([, v]) => v === 0) ? (
                  <p className="text-slate-400">Өгөгдөл алга.</p>
                ) : (
                  Object.entries(summary.byCatIncome).map(([cat, val]) =>
                    val ? (
                      <div key={cat} className="flex items-center justify-between gap-2">
                        <span className="text-slate-200">{CATEGORY_LABELS[cat as CategoryId]}</span>
                        <span className="font-semibold text-slate-50">{val.toLocaleString("mn-MN")} ₮</span>
                      </div>
                    ) : null
                  )
                )}
              </div>
            )}
          </div>

          {/* 3) Дэд ангиллаар (бүгд) */}
          <div className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 space-y-2 text-[11px] sm:text-xs">
            <h3 className="font-medium text-slate-100">
              Дэд ангиллаар ({typeFilter === "income" ? "орлого" : typeFilter === "expense" ? "зарлага" : "голчлон зарлага"})
            </h3>

            {subBreakdown.length === 0 ? (
              <p className="text-slate-400">Дэд ангиллын өгөгдөл алга. (sub_category хадгалагдаагүй байж магадгүй)</p>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                {subBreakdown.map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                    <span className="text-slate-200">{subLabel(k)}</span>
                    <span className="font-semibold text-slate-50">{v.toLocaleString("mn-MN")} ₮</span>
                  </div>
                ))}
              </div>
            )}

            <p className="text-[10px] text-slate-400">
              Хэрэв “Эрүүл мэнд → Эм” харагдахгүй байвал: баримтаас ирсэн item бүр дээр sub_category хадгалагдаж байгаа эсэхийг шалгана.
            </p>
          </div>

          {/* 4) Дэлгүүрээр (ихэвчлэн зарлага) */}
          {(typeFilter === "" || typeFilter === "expense") && (
            <div className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 space-y-2 text-[11px] sm:text-xs">
              <h3 className="font-medium text-slate-100">Дэлгүүрээр (зарлага)</h3>
              {topStores.length === 0 ? (
                <p className="text-slate-400">Дэлгүүрийн мэдээлэл алга (note дотор “Дэлгүүр – бараа” хэлбэр байхгүй байж магадгүй).</p>
              ) : (
                topStores.map(([s, v]) => (
                  <div key={s} className="flex items-center justify-between gap-2">
                    <span className="text-slate-200">{s}</span>
                    <span className="font-semibold text-slate-50">{v.toLocaleString("mn-MN")} ₮</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 5) TOP бараа / хэрэглээ */}
          <div className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 space-y-2 text-[11px] sm:text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-slate-100">
                🍞 TOP бараа / хэрэглээ ({typeFilter === "income" ? "орлого" : typeFilter === "expense" ? "зарлага" : "зарлага"})
              </h3>

              <div className="inline-flex rounded-full border border-white/20 bg-white/10 p-0.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`px-2 py-0.5 rounded-full ${
                    viewMode === "list" ? "bg-white text-slate-900" : "text-slate-100"
                  }`}
                >
                  Жагсаалт
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("bar")}
                  className={`px-2 py-0.5 rounded-full ${
                    viewMode === "bar" ? "bg-white text-slate-900" : "text-slate-100"
                  }`}
                >
                  Bar
                </button>
              </div>
            </div>

            {topItems.length === 0 ? (
              <p className="text-slate-400">Өгөгдөл алга.</p>
            ) : viewMode === "list" ? (
              topItems.map(([name, amt]) => (
                <div key={name} className="flex items-center justify-between border-b border-white/10 py-1">
                  <span className="text-slate-100">{name}</span>
                  <span className="font-semibold text-slate-50">{amt.toLocaleString("mn-MN")} ₮</span>
                </div>
              ))
            ) : (
              <div className="space-y-1.5">
                {topItems.map(([name, amt]) => {
                  const percent = maxTopItem > 0 ? Math.round((amt / maxTopItem) * 100) : 0;
                  return (
                    <div key={name} className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-100">{name}</span>
                        <span className="font-semibold text-slate-50">{amt.toLocaleString("mn-MN")} ₮</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full bg-sky-400/80" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="text-[10px] text-slate-400">
              Давхар тооцохгүй: нэг гүйлгээ нэг item key-д л нэмэгдэнэ.
            </p>
          </div>

          {/* 6) Фильтртэй гүйлгээнүүд */}
          <div className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 space-y-2 max-h-80 overflow-y-auto">
            <h3 className="font-medium text-slate-100">Фильтртэй гүйлгээнүүд</h3>

            {filtered.length === 0 ? (
              <p className="text-[11px] text-slate-400">Тэнцсэн гүйлгээ алга байна.</p>
            ) : (
              filtered.map((tx) => {
                const { store, item } = splitNote(tx.note);
                const title = (item || tx.note || "Гүйлгээ").trim();

                return (
                  <div key={tx.id} className="flex items-center justify-between gap-2 border-b border-white/10 py-2">
                    <div className="space-y-0.5">
                      <p className="text-[11px] text-slate-100">{title}</p>
                      <p className="text-[10px] text-slate-400">
                        {tx.date} · {tx.type === "income" ? "Орлого" : "Зарлага"} · {CATEGORY_LABELS[tx.category]}
                        {tx.subCategory ? ` · ${subLabel(tx.subCategory)}` : ""}
                        {store ? ` · ${store}` : ""}
                      </p>
                    </div>

                    <span className="text-[11px] font-semibold text-slate-50">
                      {tx.type === "income" ? "+ " : "- "}
                      {tx.amount.toLocaleString("mn-MN")} ₮
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </section>
  );
}
