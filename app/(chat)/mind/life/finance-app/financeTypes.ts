export type TransactionType = "income" | "expense" | "debt" | "saving";

// ✅ Expense categories (том ангилал)
export type ExpenseCategoryId =
  | "food"
  | "transport"
  | "clothes"
  | "home"
  | "fun"
  | "health"
  | "other";

// ✅ Income category (1)
export type IncomeCategoryId = "income";

// ✅ Debt категори = үйлдэл (чи хүссэнээр)
export type DebtCategoryId = "debt_borrow" | "debt_repay";

// ✅ Saving категори = үйлдэл (хадгаламж авах/хадгалах)
export type SavingCategoryId = "saving_deposit" | "saving_withdraw";

// ✅ Нийт CategoryId
export type CategoryId = ExpenseCategoryId | IncomeCategoryId | DebtCategoryId | SavingCategoryId;

export type TransactionSource = "text" | "voice" | "image" | "receipt";

export type Transaction = {
  id: string;
  user_id?: string; // local/guest үед байхгүй байж болно
  type: TransactionType;
  amount: number;
  category: CategoryId;

  /**
   * ✅ Дэд ангилал:
   * - expense үед: food_meat гэх мэт
   * - income үед: income_salary гэх мэт
   * - debt үед: ипотек/лизинг/апп/хувь хүн гэх мэт (loan type)
   * - saving үед: аялал/эрсдэлээс хамгаалах мѳнгѳ гэх мэт (saving goal)
   */
  subCategory?: string | null;

  date: string; // yyyy-mm-dd
  note?: string;
  source: TransactionSource;
  createdAt: string;
};

export type SubOpt = { id: string; label: string };
