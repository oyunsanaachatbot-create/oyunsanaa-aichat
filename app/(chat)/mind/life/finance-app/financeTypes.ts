export type TransactionType = "income" | "expense" | "debt" | "saving";

export type CategoryId =
  | "food"
  | "transport"
  | "clothes"
  | "home"
  | "fun"
  | "health"
  | "other"
  | "income"
  | "debt"
  | "saving";

export type TransactionSource = "text" | "voice" | "image" | "receipt";

export type Transaction = {
  id: string;
  user_id?: string; // guest/local үед байхгүй байж болно
  type: TransactionType;
  amount: number;
  category: CategoryId; // ✅ debt үед "debt" байна
  subCategory?: string | null; // ✅ debt үед "debt_borrow"/"debt_repay" гэх мэт байна
  date: string; // yyyy-mm-dd
  note?: string;
  source: TransactionSource;
  createdAt: string;
};

export type SubOpt = { id: string; label: string };
