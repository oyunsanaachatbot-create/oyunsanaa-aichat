"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Coffee, MessageCircle, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

/**
 * ✅ Top category:
 *  - expense-д: food/transport/clothes/home/fun/health/other
 *  - income-д: income (орлого)
 */
type CategoryId =
  | "food"
  | "transport"
  | "clothes"
  | "home"
  | "fun"
  | "health"
  | "other"
  | "income";

type TransactionType = "income" | "expense";

type SubOpt = { id: string; label: string };

export const SUBCATEGORY_OPTIONS: Record<CategoryId, SubOpt[]> = {
  // ====== Expense subcategories ======
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
    { id: "clothes_accessory", label: "Аксессуар" },
    { id: "clothes_other", label: "Бусад хувцас" },
  ],

  home: [
    { id: "home_furniture", label: "Тавилга" },
    { id: "home_appliance", label: "Цахилгаан хэрэгсэл" },
    { id: "home_cleaning", label: "Цэвэрлэгээ" },
    { id: "home_kitchen", label: "Гал тогоо" },
    { id: "home_repair", label: "Засвар" },
    { id: "home_other", label: "Бусад гэр ахуй" },
  ],

  health: [
    { id: "health_medicine", label: "Эм" },
    { id: "health_supplement", label: "Витамин" },
    { id: "health_clinic", label: "Эмч / эмнэлэг" },
    { id: "health_test", label: "Шинжилгээ" },
    { id: "health_other", label: "Бусад" },
  ],

  transport: [
    { id: "transport_fuel", label: "Шатахуун" },
    { id: "transport_taxi", label: "Такси" },
    { id: "transport_bus", label: "Автобус" },
    { id: "transport_ride", label: "Дуудлагын үйлчилгээ" },
    { id: "transport_other", label: "Бусад" },
  ],

  fun: [
    { id: "fun_cafe", label: "Кафе / ресторан" },
    { id: "fun_cinema", label: "Кино / энтертайнмент" },
    { id: "fun_gift", label: "Бэлэг" },
    { id: "fun_trip", label: "Аялал" },
    { id: "fun_other", label: "Бусад" },
  ],

  other: [
    { id: "other_fees", label: "Шимтгэл" },
    { id: "other_subscription", label: "Сар бүр" },
    { id: "other_other", label: "Бусад" },
  ],

  // ====== Income subcategories ======
  income: [
    { id: "income_salary", label: "Цалин" },
    { id: "income_bonus", label: "Бонус" },
    { id: "income_business", label: "Бизнес / орлого" },
    { id: "income_gift", label: "Бэлэг / тусламж" },
    { id: "income_refund", label: "Буцаалт / нөхөн" },
    { id: "income_other", label: "Бусад орлого" },
  ],
};

const CATEGORY_LABELS: Record<CategoryId, string> = {
  food: "Хоол, хүнс",
  transport: "Тээвэр",
  clothes: "Хувцас",
  home: "Гэр, хэрэглээ",
  fun: "Зугаа, чөлөөт цаг",
  health: "Эрүүл мэнд",
  other: "Бусад",
  income: "Орлого",
};

const EXPENSE_CATEGORIES: CategoryId[] = [
  "food",
  "transport",
  "clothes",
  "home",
  "fun",
  "health",
  "other",
];

const INCOME_CATEGORIES: CategoryId[] = ["income"];

type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  category: CategoryId;
  subCategory?: string | null; // ✅ шинэ
  date: string; // ISO yyyy-mm-dd
  note?: string;
  source: "text" | "voice" | "image" | "receipt";
  createdAt: string;
};

type Props = { userId: string };

export default function FinanceAppClient({ userId }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<CategoryId>("food");
  const [subCategory, setSubCategory] = useState<string>(""); // ✅ шинэ
  const [date, setDate] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [showEntry, setShowEntry] = useState(false);
  const [loading, setLoading] = useState(true);

  // type өөрчлөгдөхөд category/sub reset
  useEffect(() => {
    if (type === "income") {
      setCategory("income");
      setSubCategory("");
    } else {
      if (category === "income") setCategory("food");
      setSubCategory("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  // category өөрчлөгдөхөд sub reset
  useEffect(() => {
    setSubCategory("");
  }, [category]);

  // 🔹 Supabase-аас өгөгдөл татах (✅ user_id filter)
  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase load error", error);
        setLoading(false);
        return;
      }

      const rows = Array.isArray(data) ? data : [];
      setTransactions(
        rows.map((row: any) => ({
          id: row.id,
          type: row.type,
          amount: Number(row.amount) || 0,
          category: row.category,
          subCategory: row.sub_category ?? null, // ✅ энд
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
    return { totalIncome: income, totalExpense: expense, balance: income - expense };
  }, [transactions]);

  // 🔹 Гүйлгээ нэмэх
  const handleAdd = async () => {
    const value = Number(amount.replace(/\s/g, ""));
    if (!value || isNaN(value)) return;

    const todayIso = new Date().toISOString().slice(0, 10);

    const tempId = `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const tempTx: Transaction = {
      id: tempId,
      type,
      amount: value,
      category,
      subCategory: subCategory || null,
      date: date || todayIso,
      note: note.trim() || undefined,
      source: "text",
      createdAt: new Date().toISOString(),
    };

    setTransactions((prev) => [tempTx, ...prev]);
    setAmount("");
    setNote("");
    setSubCategory("");

    const payload = {
      user_id: userId,
      type,
      amount: value,
      category,
      sub_category: subCategory || null, // ✅ DB-д хадгална
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
      setTransactions((prev) => prev.filter((t) => t.id !== tempId));
      return;
    }

    const saved: Transaction = {
      id: data.id,
      type: data.type,
      amount: Number(data.amount) || 0,
      category: data.category,
      subCategory: data.sub_category ?? null,
      date: data.date,
      note: data.note ?? "",
      source: data.source ?? "text",
      createdAt: data.created_at,
    };

    setTransactions((prev) => [saved, ...prev.filter((t) => t.id !== tempId)]);
  };

  // 🔹 1 мөр устгах
  const handleDelete = async (id: string) => {
    if (id.startsWith("temp-")) {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      return;
    }

    const prev = transactions;
    setTransactions((cur) => cur.filter((t) => t.id !== id));

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("Supabase delete error", error);
      setTransactions(prev);
    }
  };

  // 🔹 Бүгдийг устгах
  const handleDeleteAll = async () => {
    const ok = window.confirm("Бүх гүйлгээг устгах уу? Энэ үйлдлийг буцаахгүй!");
    if (!ok) return;

    const prev = transactions;
    setTransactions([]);

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("Supabase delete all error", error);
      setTransactions(prev);
    }
  };

  // Категориор нийлбэр (гар шивэх хэсэгт)
  const byCategoryExpense = useMemo(() => {
    const cat: Record<string, number> = {};
    for (const c of EXPENSE_CATEGORIES) cat[c] = 0;

    for (const t of transactions) {
      if (t.type === "expense") cat[t.category] = (cat[t.category] ?? 0) + t.amount;
    }
    return cat as Record<CategoryId, number>;
  }, [transactions]);

  const byCategoryIncome = useMemo(() => {
    const cat: Record<string, number> = {};
    for (const c of INCOME_CATEGORIES) cat[c] = 0;

    for (const t of transactions) {
      if (t.type === "income") cat[t.category] = (cat[t.category] ?? 0) + t.amount;
    }
    return cat as Record<CategoryId, number>;
  }, [transactions]);

  const availableCategoryOptions = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const availableSubOptions = SUBCATEGORY_OPTIONS[category] ?? [];
  const showSub = availableSubOptions.length > 0;

  return (
    <div className="min-h-screen relative text-slate-50 bg-gradient-to-b from-[#020c1a] via-[#071a33] to-[#010712]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-[-20%] w-[420px] h-[420px] rounded-full bg-sky-400/28 blur-3xl" />
        <div className="absolute top-[-10%] right-[-8%] w-[360px] h-[360px] rounded-full bg-cyan-400/22 blur-3xl" />
      </div>

      <main className="relative z-10 px-4 py-7 flex justify-center">
        <div className="w-full max-w-5xl rounded-3xl border border-white/18 bg-white/10 backdrop-blur-2xl shadow-[0_24px_80px_rgba(15,23,42,0.9)] px-5 py-7 space-y-7">
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

              {loading && <div className="text-[11px] text-slate-300">Ачаалж байна…</div>}
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

          <section className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-semibold leading-snug text-[#DCE8FF] drop-shadow-[0_0_12px_rgba(220,232,255,0.55)]">
              Санхүүгээ энгийнээр хөтлөх жижиг туслах
            </h1>

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
              <span className={`font-semibold ${balance >= 0 ? "text-sky-300" : "text-amber-300"}`}>
                {balance.toLocaleString("mn-MN")} ₮
              </span>
            </p>
          </section>

          {/* ✅ Тайлан */}
          <ReportSection
            transactions={transactions}
            onDelete={handleDelete}
          />

          {/* ✅ Гар шивэх */}
          <section className="mt-8 space-y-3">
            <button
              type="button"
              onClick={() => setShowEntry((v) => !v)}
              className="w-full rounded-2xl border border-sky-400/50 bg-sky-500/15 px-4 py-2.5 text-xs sm:text-sm font-medium text-sky-100 hover:bg-sky-500/25 transition"
            >
              {showEntry ? "− Гараар гүйлгээ шивэхийг нуух" : "✍ Гараар гүйлгээ шивэх"}
            </button>

            {showEntry && (
              <div className="grid md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.7fr)] gap-5">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/25 bg-white/10 px-4 py-4 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Plus className="h-4 w-4" />
                      <span className="text-sm font-medium">Шинэ гүйлгээ нэмэх</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="text-[11px] text-slate-200">Төрөл</span>
                        <div className="flex rounded-xl border border-white/25 bg-white/10 p-1">
                          <button
                            type="button"
                            onClick={() => setType("expense")}
                            className={`flex-1 rounded-lg py-1.5 text-xs ${
                              type === "expense" ? "bg-rose-500/80 text-white" : "text-slate-100/80"
                            }`}
                          >
                            Зарлага
                          </button>
                          <button
                            type="button"
                            onClick={() => setType("income")}
                            className={`flex-1 rounded-lg py-1.5 text-xs ${
                              type === "income" ? "bg-emerald-500/80 text-white" : "text-slate-100/80"
                            }`}
                          >
                            Орлого
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 text-xs">
                        <label className="text-[11px] text-slate-200">Дүн (₮)</label>
                        <input
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="50 000"
                          className="rounded-xl border border-white/25 bg-white/10 px-3 py-1.5 text-sm text-slate-50 outline-none focus:border-white/60"
                        />
                      </div>

                      <div className="flex flex-col gap-1 text-xs">
                        <label className="text-[11px] text-slate-200">Категори</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value as CategoryId)}
                          className="rounded-xl border border-white/25 bg-white/10 px-3 py-1.5 text-sm text-slate-50 outline-none focus:border-white/60"
                        >
                          {availableCategoryOptions.map((id) => (
                            <option key={id} value={id} className="bg-slate-900 text-slate-50">
                              {CATEGORY_LABELS[id]}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1 text-xs">
                        <label className="text-[11px] text-slate-200">Огноо</label>
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="rounded-xl border border-white/25 bg-white/10 px-3 py-1.5 text-sm text-slate-50 outline-none focus:border-white/60"
                        />
                      </div>
                    </div>

                    {/* ✅ ДЭД АНГИЛАЛ */}
                    {showSub && (
                      <div className="flex flex-col gap-1 text-xs">
                        <label className="text-[11px] text-slate-200">Дэд төрөл</label>
                        <select
                          value={subCategory}
                          onChange={(e) => setSubCategory(e.target.value)}
                          className="rounded-xl border border-white/25 bg-white/10 px-3 py-1.5 text-sm text-slate-50 outline-none focus:border-white/60"
                        >
                          <option value="" className="bg-slate-900 text-slate-50">
                            Сонгохгүй (хоосон)
                          </option>
                          {availableSubOptions.map((opt) => (
                            <option key={opt.id} value={opt.id} className="bg-slate-900 text-slate-50">
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="flex flex-col gap-1 text-xs">
                      <label className="text-[11px] text-slate-200">Тэмдэглэл (сонголттой)</label>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                        placeholder="Жишээ: E-mart – талх"
                        className="rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-sm text-slate-50 outline-none focus:border-white/60 resize-none"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleAdd}
                        className="mt-1 inline-flex items-center justify-center rounded-full bg-sky-500/90 hover:bg-sky-400 px-4 py-1.5 text-xs font-medium text-white transition"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Гүйлгээ хадгалах
                      </button>

                      <button
                        type="button"
                        onClick={handleDeleteAll}
                        className="mt-1 inline-flex items-center justify-center rounded-full bg-rose-500/80 hover:bg-rose-400 px-4 py-1.5 text-xs font-medium text-white transition"
                      >
                        Бүгдийг устгах
                      </button>
                    </div>
                  </div>

                  {/* Quick totals */}
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 space-y-2">
                      <h3 className="text-xs font-medium text-slate-100">Категориор нь (зарлага)</h3>
                      <div className="space-y-1.5 text-[11px]">
                        {EXPENSE_CATEGORIES.map((id) => {
                          const v = byCategoryExpense[id] || 0;
                          if (!v) return null;
                          return (
                            <div key={id} className="flex items-center justify-between gap-2">
                              <span className="text-slate-200">{CATEGORY_LABELS[id]}</span>
                              <span className="text-slate-50 font-medium">{v.toLocaleString("mn-MN")} ₮</span>
                            </div>
                          );
                        })}
                        {!totalExpense && <p className="text-[11px] text-slate-400">Одоогоор зарлагын гүйлгээ байхгүй байна.</p>}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 space-y-2">
                      <h3 className="text-xs font-medium text-slate-100">Категориор нь (орлого)</h3>
                      <div className="space-y-1.5 text-[11px]">
                        {INCOME_CATEGORIES.map((id) => {
                          const v = byCategoryIncome[id] || 0;
                          if (!v) return null;
                          return (
                            <div key={id} className="flex items-center justify-between gap-2">
                              <span className="text-slate-200">{CATEGORY_LABELS[id]}</span>
                              <span className="text-slate-50 font-medium">{v.toLocaleString("mn-MN")} ₮</span>
                            </div>
                          );
                        })}
                        {!totalIncome && <p className="text-[11px] text-slate-400">Одоогоор орлогын гүйлгээ байхгүй байна.</p>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent list */}
                <div className="rounded-2xl border border-white/25 bg-white/10 px-4 py-4 space-y-3">
                  <h3 className="text-sm font-medium text-slate-100">Сүүлийн гүйлгээнүүд</h3>

                  {transactions.length === 0 ? (
                    <p className="text-[12px] text-slate-300">Одоогоор ямар ч гүйлгээ алга.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
                      {transactions.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-start justify-between gap-2 rounded-xl bg-white/5 px-3 py-2"
                        >
                          <div className="space-y-0.5">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className={t.type === "income" ? "text-emerald-300 font-semibold" : "text-rose-300 font-semibold"}>
                                {t.type === "income" ? "+ " : "- "}
                                {t.amount.toLocaleString("mn-MN")} ₮
                              </span>
                              <span className="text-[11px] text-slate-300">
                                {CATEGORY_LABELS[t.category]}
                              </span>
                              {t.subCategory && (
                                <span className="text-[10px] text-slate-200/80 border border-white/15 bg-white/5 px-2 py-0.5 rounded-full">
                                  {t.subCategory}
                                </span>
                              )}
                            </div>

                            {t.note && <p className="text-[11px] text-slate-100/90">{t.note}</p>}

                            <p className="text-[10px] text-slate-400">
                              {t.date} ·{" "}
                              {t.source === "text"
                                ? "гараар"
                                : t.source === "voice"
                                ? "voice-оор"
                                : t.source === "receipt"
                                ? "баримтаас"
                                : "зурагнаас"}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDelete(t.id)}
                            className="mt-1 text-slate-400 hover:text-rose-300 transition"
                            aria-label="Delete"
                            title="Устгах"
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
}

// ============================================================
// ✅ Тайлан хэсэг
// ============================================================
function ReportSection({
  transactions,
  onDelete,
}: {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<"" | CategoryId>(""); // "" = бүгд
  const [subCategory, setSubCategory] = useState<string>(""); // ✅ шинэ
  const [typeFilter, setTypeFilter] = useState<"" | TransactionType>(""); // "" = хоёуланг нь
  const [sortType, setSortType] = useState<"" | "asc" | "desc">("");
  const [storeFilter, setStoreFilter] = useState<string>(""); // "" = бүгд
  const [showResult, setShowResult] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "bar">("list");

  const splitNote = (note?: string) => {
    const t = (note ?? "").trim();
    if (!t) return { store: "", item: "" };

    const a = t.split("–").map((x) => x.trim()).filter(Boolean);
    if (a.length >= 2) return { store: a[0], item: a.slice(1).join(" – ") };

    const b = t.split("-").map((x) => x.trim()).filter(Boolean);
    if (b.length >= 2) return { store: b[0], item: b.slice(1).join(" - ") };

    return { store: "", item: t };
  };

  // store options
  const storeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const tx of transactions) {
      const { store } = splitNote(tx.note);
      const s = (store || "").trim();
      if (s) set.add(s);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "mn"));
  }, [transactions]);

  // category based sub options
  const subOptions = useMemo(() => {
    if (!category) return [];
    return SUBCATEGORY_OPTIONS[category] ?? [];
  }, [category]);

  // filtered
  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();

    return transactions
      .filter((tx) => (fromDate ? tx.date >= fromDate : true))
      .filter((tx) => (toDate ? tx.date <= toDate : true))
      .filter((tx) => (typeFilter ? tx.type === typeFilter : true))
      .filter((tx) => (category ? tx.category === category : true))
      .filter((tx) => (subCategory ? (tx.subCategory ?? "") === subCategory : true)) // ✅ энэ мөр алдаа гаргадаг байсан
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
  }, [transactions, fromDate, toDate, keyword, typeFilter, category, subCategory, sortType, storeFilter]);

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;

    const byCatExpense: Record<CategoryId, number> = {
      food: 0, transport: 0, clothes: 0, home: 0, fun: 0, health: 0, other: 0, income: 0,
    };

    const byCatIncome: Record<CategoryId, number> = {
      food: 0, transport: 0, clothes: 0, home: 0, fun: 0, health: 0, other: 0, income: 0,
    };

    const bySub: Record<string, number> = {}; // ✅ бүх category дээр ажиллана
    const byItem: Record<string, number> = {};
    const byStore: Record<string, number> = {};

    for (const tx of filtered) {
      if (tx.type === "income") {
        income += tx.amount;
        byCatIncome[tx.category] = (byCatIncome[tx.category] ?? 0) + tx.amount;

        if (tx.subCategory) bySub[tx.subCategory] = (bySub[tx.subCategory] ?? 0) + tx.amount;
        continue;
      }

      expense += tx.amount;
      byCatExpense[tx.category] = (byCatExpense[tx.category] ?? 0) + tx.amount;

      if (tx.subCategory) bySub[tx.subCategory] = (bySub[tx.subCategory] ?? 0) + tx.amount;

      const { store, item } = splitNote(tx.note);
      const itemKey = (item || tx.note || "Гүйлгээ").trim();
      if (itemKey) byItem[itemKey] = (byItem[itemKey] ?? 0) + tx.amount;

      const s = (store || "").trim();
      if (s) byStore[s] = (byStore[s] ?? 0) + tx.amount;
    }

    return { income, expense, byCatExpense, byCatIncome, bySub, byItem, byStore };
  }, [filtered]);

  const balance = summary.income - summary.expense;

  const topItems = useMemo(() => {
    return Object.entries(summary.byItem)
      .filter(([k]) => k.length > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
  }, [summary.byItem]);

  const topStores = useMemo(() => {
    return Object.entries(summary.byStore)
      .filter(([k]) => k.length > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [summary.byStore]);

  const topSub = useMemo(() => {
    return Object.entries(summary.bySub)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 18);
  }, [summary.bySub]);

  const maxTopItem = topItems.length ? Math.max(...topItems.map(([, v]) => v)) : 0;

  const clearFilters = () => {
    setFromDate("");
    setToDate("");
    setKeyword("");
    setCategory("");
    setSubCategory("");
    setTypeFilter("");
    setSortType("");
    setStoreFilter("");
  };

  return (
    <section className="mt-6 space-y-4">
      <h2 className="text-lg font-semibold text-slate-100">
        📊 CHECK / Тайлан (Хугацаа + Ангилал + Дэд ангилал)
      </h2>

      {/* Filters */}
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
          <label className="text-slate-200">Тэмдэглэл / бараагаар</label>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="талх, эм, цалин..."
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
            onChange={(e) => {
              setCategory(e.target.value as CategoryId | "");
              setSubCategory("");
            }}
            className="w-full rounded-xl border border-white/25 bg-white/10 px-2 py-1.5 text-[11px] text-slate-50 outline-none focus:border-white/60"
          >
            <option value="">Бүгд</option>
            <option value="income">Орлого</option>
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
          <label className="text-slate-200">Дэд төрөл</label>
          <select
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
            disabled={!category}
            className="w-full rounded-xl border border-white/25 bg-white/10 px-2 py-1.5 text-[11px] text-slate-50 outline-none focus:border-white/60 disabled:opacity-50"
          >
            <option value="">Бүгд</option>
            {subOptions.map((s) => (
              <option key={s.id} value={s.id} className="bg-slate-900 text-slate-50">
                {s.label}
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
            Note дотор “Дэлгүүр – бараа” хэлбэр байвал дэлгүүрээр шүүнэ.
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

        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={clearFilters}
            className="w-full rounded-xl border border-white/25 bg-white/10 px-2 py-1.5 text-[11px] text-slate-100 hover:bg-white/15 transition"
          >
            Шүүлтүүр цэвэрлэх
          </button>
        </div>
      </div>

      {/* ✅ Show / Hide button (асуудлыг бүрэн шийдсэн) */}
      <button
        type="button"
        onClick={() => setShowResult((v) => !v)}
        className="inline-flex items-center justify-center rounded-full bg-white/80 text-slate-900 px-4 py-1.5 text-xs sm:text-sm font-medium hover:bg-white transition"
      >
        {showResult ? "❎ Тайланг нуух" : "✅ Тайлан гаргах"}
      </button>

      {showResult && (
        <div className="space-y-4">
          {/* Totals */}
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

          {/* By category: expense + income */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 space-y-2 text-[11px] sm:text-xs">
              <h3 className="font-medium text-slate-100">Том ангиллаар (зарлага)</h3>
              {Object.entries(summary.byCatExpense).every(([, v]) => v === 0) ? (
                <p className="text-slate-400">Өгөгдөл алга.</p>
              ) : (
                Object.entries(summary.byCatExpense)
                  .filter(([k]) => k !== "income")
                  .map(([cat, val]) =>
                    val ? (
                      <div key={cat} className="flex items-center justify-between gap-2">
                        <span className="text-slate-200">{CATEGORY_LABELS[cat as CategoryId]}</span>
                        <span className="font-semibold text-slate-50">{val.toLocaleString("mn-MN")} ₮</span>
                      </div>
                    ) : null
                  )
              )}
            </div>

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
          </div>

          {/* ✅ Subcategory breakdown: ALL categories */}
          <div className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 space-y-2 text-[11px] sm:text-xs">
            <h3 className="font-medium text-slate-100">Дэд ангиллаар (сонгосон өгөгдөл)</h3>
            {topSub.length === 0 ? (
              <p className="text-slate-400">Дэд ангиллын өгөгдөл алга. (sub_category хоосон байж магадгүй)</p>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                {topSub.map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                    <span className="text-slate-200">{k}</span>
                    <span className="font-semibold text-slate-50">{v.toLocaleString("mn-MN")} ₮</span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[10px] text-slate-400">
              Дэд ангилал зөв харагдахын тулд гүйлгээ бүрт sub_category хадгалагдсан байх ёстой.
            </p>
          </div>

          {/* Top items */}
          <div className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 space-y-2 text-[11px] sm:text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-slate-100">🍞 TOP бараа / хэрэглээ</h3>
              <div className="inline-flex rounded-full border border-white/20 bg-white/10 p-0.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`px-2 py-0.5 rounded-full ${viewMode === "list" ? "bg-white text-slate-900" : "text-slate-100"}`}
                >
                  Жагсаалт
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("bar")}
                  className={`px-2 py-0.5 rounded-full ${viewMode === "bar" ? "bg-white text-slate-900" : "text-slate-100"}`}
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
          </div>

          {/* Filtered transactions + delete */}
          <div className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 space-y-2 max-h-96 overflow-y-auto">
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
                        {tx.subCategory ? ` · ${tx.subCategory}` : ""}
                        {store ? ` · ${store}` : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-50">
                        {tx.type === "income" ? "+ " : "- "}
                        {tx.amount.toLocaleString("mn-MN")} ₮
                      </span>

                      <button
                        type="button"
                        onClick={() => onDelete(tx.id)}
                        className="text-slate-400 hover:text-rose-300 transition"
                        aria-label="Delete"
                        title="Устгах"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {!showResult && (
        <p className="text-[11px] text-slate-300">
          Хугацаагаа сонгоод “Тайлан гаргах” дар. Нуух дарвал зөвхөн “Тайлан гаргах” товч үлдэнэ.
        </p>
      )}
    </section>
  );
}
