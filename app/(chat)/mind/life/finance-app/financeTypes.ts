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
  user_id?: string;
  type: TransactionType;
  amount: number;
  category: CategoryId;
  subCategory?: string | null; // debt_borrow / debt_repay / saving_deposit / saving_withdraw / income_salary ...
  date: string;
  note?: string;
  source: TransactionSource;
  createdAt: string;
};

export type SubOpt = { id: string; label: string };
