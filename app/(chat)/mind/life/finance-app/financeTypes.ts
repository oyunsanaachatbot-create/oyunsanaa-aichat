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
  // debt action is category
  | "debt_borrow"
  | "debt_repay"
  // saving action is category
  | "saving_add"
  | "saving_withdraw";

export type TransactionSource = "text" | "voice" | "image" | "receipt";

export type Transaction = {
  id: string;
  user_id?: string; // guest/local үед байхгүй байж болно
  type: TransactionType;
  amount: number;
  category: CategoryId; // debt/saving үед action нь энд байна
  subCategory?: string | null; // debt/saving-ийн “төрөл/зорилго” нь энд байна
  date: string; // yyyy-mm-dd
  note?: string;
  source: TransactionSource;
  createdAt: string;
};

export type SubOpt = { id: string; label: string };
