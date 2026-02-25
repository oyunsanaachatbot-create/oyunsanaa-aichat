"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { CategoryId, Transaction, TransactionType, TransactionSource } from "./financeTypes";
import { isGuestUserId } from "./financeGuest";

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}
function nowIso() {
  return new Date().toISOString();
}

const GUEST_KEY = "finance_guest_transactions_v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function mapRow(row: any): Transaction {
  return {
    id: row.id,
    user_id: row.user_id,
    type: row.type,
    amount: Number(row.amount) || 0,
    category: row.category,
    subCategory: row.sub_category ?? null,
    date: row.date,
    note: row.note ?? "",
    source: (row.source ?? "text") as TransactionSource,
    createdAt: row.created_at,
  };
}

export function useTransactions(userId: string) {
  const guest = isGuestUserId(userId);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // ✅ Load: guest => localStorage, login => supabase
  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);

      // GUEST: local storage
      if (guest) {
        const local = safeParse<Transaction[]>(localStorage.getItem(GUEST_KEY), []);
        if (!alive) return;
        setTransactions(Array.isArray(local) ? local : []);
        setLoading(false);
        return;
      }

      // LOGIN: supabase
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!alive) return;

      if (error) {
        console.error("Supabase load error", error);
        setTransactions([]);
        setLoading(false);
        return;
      }

      const rows = Array.isArray(data) ? data : [];
      setTransactions(rows.map(mapRow));
      setLoading(false);
    };

    load();

    return () => {
      alive = false;
    };
  }, [userId, guest]);

  // ✅ Persist guest local changes
  useEffect(() => {
    if (!guest) return;
    localStorage.setItem(GUEST_KEY, JSON.stringify(transactions));
  }, [guest, transactions]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;

    // debt
    let debtBorrow = 0;
    let debtRepay = 0;

    // saving
    let savingAdd = 0;
    let savingWithdraw = 0;

    for (const t of transactions) {
      if (t.type === "income") income += t.amount;
      else if (t.type === "expense") expense += t.amount;
      else if (t.type === "debt") {
        if (t.category === "debt_borrow") debtBorrow += t.amount;
        if (t.category === "debt_repay") debtRepay += t.amount;
      } else if (t.type === "saving") {
        if (t.category === "saving_add") savingAdd += t.amount;
        if (t.category === "saving_withdraw") savingWithdraw += t.amount;
      }
    }

    const balance = income - expense;
    const debtOutstanding = debtBorrow - debtRepay;
    const savingBalance = savingAdd - savingWithdraw;

    return {
      totalIncome: income,
      totalExpense: expense,
      balance,
      debtBorrow,
      debtRepay,
      debtOutstanding,
      savingAdd,
      savingWithdraw,
      savingBalance,
    };
  }, [transactions]);

  const addTransaction = async (input: {
    type: TransactionType;
    amount: number;
    category: CategoryId;
    subCategory?: string | null;
    date?: string;
    note?: string;
    source?: TransactionSource;
  }) => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const tx: Transaction = {
      id: tempId,
      type: input.type,
      amount: input.amount,
      category: input.category,
      subCategory: input.subCategory ?? null,
      date: input.date || isoToday(),
      note: input.note?.trim() || "",
      source: input.source ?? "text",
      createdAt: nowIso(),
      user_id: guest ? undefined : userId,
    };

    // ✅ Optimistic UI
    setTransactions((prev) => [tx, ...prev]);

    // ✅ Guest: localStorage дээр хадгалаад дуусна (алга болохгүй)
    if (guest) return;

    const payload = {
      user_id: userId,
      type: input.type,
      amount: input.amount,
      category: input.category,
      sub_category: input.subCategory ?? null,
      date: input.date || isoToday(),
      note: input.note?.trim() || null,
      source: input.source ?? "text",
      raw_text: input.note?.trim() || null,
    };

    const { data, error } = await supabase.from("transactions").insert(payload).select("*").single();

    if (error || !data) {
      console.error("Supabase insert error", error);
      // rollback temp
      setTransactions((prev) => prev.filter((t) => t.id !== tempId));
      return;
    }

    const saved = mapRow(data);
    setTransactions((prev) => [saved, ...prev.filter((t) => t.id !== tempId)]);
  };

  const deleteTransaction = async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    if (guest) return; // guest local

    if (id.startsWith("temp-")) return;

    const { error } = await supabase.from("transactions").delete().eq("id", id).eq("user_id", userId);
    if (error) {
      console.error("Supabase delete error", error);
    }
  };

  const deleteAll = async () => {
    const ok = window.confirm("Бүх гүйлгээг устгах уу? Энэ үйлдлийг буцаахгүй!");
    if (!ok) return;

    setTransactions([]);

    if (guest) return;

    const { error } = await supabase.from("transactions").delete().eq("user_id", userId);
    if (error) console.error("Supabase delete all error", error);
  };

  // ✅ Guest-ийг “шинээр эхлүүлэх” товч хэрэгтэй бол ашиглана
  const resetGuest = () => {
    if (!guest) return;
    setTransactions([]);
    localStorage.removeItem(GUEST_KEY);
  };

  return {
    guest,
    loading,
    transactions,
    totals,
    addTransaction,
    deleteTransaction,
    deleteAll,
    resetGuest,
  };
}
