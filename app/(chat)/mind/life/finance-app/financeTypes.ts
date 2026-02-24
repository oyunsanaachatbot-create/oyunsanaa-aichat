export type TransactionType = "income" | "expense" | "debt" | "saving";

export type CategoryId =
  // expense
  | "food"
  | "transport"
  | "clothes"
  | "home"
  | "fun"
  | "health"
  | "other"
  // income
  | "income"
  // debt actions (category)
  | "debt_borrow"
  | "debt_repay"
  // saving actions (category)
  | "saving_add"
  | "saving_withdraw";

export type TransactionSource = "text" | "voice" | "image" | "receipt";

export type Transaction = {
  id: string;
  user_id?: string; // guest/local үед байхгүй байж болно
  type: TransactionType;
  amount: number;
  category: CategoryId;
  subCategory?: string | null; // debt/saving үед дэд төрөл (ипотек/лизинг..., аялал/эрсдэл...)
  date: string; // yyyy-mm-dd
  note?: string;
  source: TransactionSource;
  createdAt: string;
};

export type SubOpt = { id: string; label: string };
