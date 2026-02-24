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
  // ✅ debt categories (category = авах/төлөх)
  | "debt_borrow"
  | "debt_repay"
  // ✅ saving category
  | "saving";

export type TransactionSource = "text" | "voice" | "image" | "receipt";

export type Transaction = {
  id: string;
  user_id?: string; // guest/local үед байхгүй байж болно
  type: TransactionType;
  amount: number;
  category: CategoryId;
  subCategory?: string | null; // dэд ангилал (loan type / saving type / expense sub)
  date: string; // yyyy-mm-dd
  note?: string;
  source: TransactionSource;
  createdAt: string;
};

export type SubOpt = { id: string; label: string };
