export type TransactionType = "income" | "expense" | "debt";

export type CategoryId =
  | "food"
  | "transport"
  | "clothes"
  | "home"
  | "fun"
  | "health"
  | "other"
  | "income"
  | "debt";

export type TransactionSource = "text" | "voice" | "image" | "receipt";

export type Transaction = {
  id: string;
  user_id?: string; // local/guest үед байхгүй байж болно
  type: TransactionType;
  amount: number;
  category: CategoryId;
  subCategory?: string | null;
  date: string; // yyyy-mm-dd
  note?: string;
  source: TransactionSource;
  createdAt: string;
};

export type SubOpt = { id: string; label: string };
