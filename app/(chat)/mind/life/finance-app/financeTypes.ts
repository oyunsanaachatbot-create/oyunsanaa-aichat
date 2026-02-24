export type TransactionType = "income" | "expense" | "debt" | "saving";

export type CategoryId =
  // expense categories
  | "food"
  | "transport"
  | "clothes"
  | "home"
  | "fun"
  | "health"
  | "other"
  // income fixed category
  | "income"
  // debt actions (category = авах/төлөх)
  | "debt_borrow"
  | "debt_repay"
  // saving actions (category = хадгалах/авах)
  | "saving_add"
  | "saving_withdraw";

export type TransactionSource = "text" | "voice" | "image" | "receipt";

export type Transaction = {
  id: string;
  user_id?: string; // guest/local үед байхгүй байж болно
  type: TransactionType;
  amount: number;
  category: CategoryId;
  subCategory?: string | null; // income төрөл / expense дэд төрөл / debt төрлийн сонголт / saving зорилго
  date: string; // yyyy-mm-dd
  note?: string;
  source: TransactionSource;
  createdAt: string;
};

export type SubOpt = { id: string; label: string };
