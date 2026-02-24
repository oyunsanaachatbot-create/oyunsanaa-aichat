export type TransactionType = "income" | "expense" | "debt" | "saving";

// Expense categories
export type ExpenseCategoryId =
  | "food"
  | "transport"
  | "clothes"
  | "home"
  | "fun"
  | "health"
  | "other";

// Income category (fixed)
export type IncomeCategoryId = "income";

// ✅ Debt categories = action (категори = авах/төлөх)
export type DebtCategoryId = "debt_borrow" | "debt_repay";

// ✅ Saving categories = action (категори = хийх/авах)
export type SavingCategoryId = "saving_deposit" | "saving_withdraw";

// ✅ All categories
export type CategoryId =
  | ExpenseCategoryId
  | IncomeCategoryId
  | DebtCategoryId
  | SavingCategoryId;

export type TransactionSource = "text" | "voice" | "image" | "receipt";

export type Transaction = {
  id: string;
  user_id?: string; // guest/local үед байхгүй байж болно
  type: TransactionType;
  amount: number;
  category: CategoryId;

  /**
   * subCategory хэрэглээ:
   * - expense: food_meat, transport_taxi...
   * - income: income_salary, income_bonus...
   * - debt: loan_mortgage, loan_leasing, loan_app, loan_personal...
   * - saving: saving_trip, saving_emergency, saving_family...
   */
  subCategory?: string | null;

  date: string; // yyyy-mm-dd
  note?: string; // тэмдэглэл (хувь хүн нэр, дэлгүүр-бараа, тайлбар)
  source: TransactionSource;
  createdAt: string;
};

export type SubOpt = { id: string; label: string };
