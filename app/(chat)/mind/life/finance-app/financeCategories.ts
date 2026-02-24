import type { CategoryId, SubOpt, TransactionType } from "./financeTypes";

/** ✅ Category labels */
export const CATEGORY_LABELS: Record<CategoryId, string> = {
  // expense
  food: "Хоол, хүнс",
  transport: "Тээвэр",
  clothes: "Хувцас",
  home: "Гэр, хэрэглээ",
  fun: "Зугаа, чөлөөт цаг",
  health: "Эрүүл мэнд",
  other: "Бусад",

  // income (fixed)
  income: "Орлого",

  // ✅ debt categories = action
  debt_borrow: "Зээл авах",
  debt_repay: "Зээл төлөх",

  // ✅ saving categories = action
  saving_deposit: "Хадгаламж хийх",
  saving_withdraw: "Хадгаламжаас авах",
};

/** ✅ Subcategory options:
 *  - expense: дэд ангилал
 *  - income: орлогын төрөл
 *  - debt: зээлийн төрөл (ипотек/лизинг/…)
 *  - saving: хадгаламжийн зорилго (аялал/эрсдэл/…)
 */
export const SUBCATEGORY_OPTIONS: Record<CategoryId, SubOpt[]> = {
  // ===== Expense subcategories =====
  food: [
    { id: "food_veg", label: "Ногоо / жимс" },
    { id: "food_meat", label: "Мах / махан бүтээгдэхүүн" },
    { id: "food_grain", label: "Гурил / будаа" },
    { id: "food_dairy", label: "Сүү / цагаан идээ" },
    { id: "food_snack", label: "Амттан / зууш" },
    { id: "food_drink", label: "Ундаа / кофе" },
    { id: "food_other", label: "Бусад хүнс" },
  ],
  transport: [
    { id: "transport_fuel", label: "Шатахуун" },
    { id: "transport_taxi", label: "Такси" },
    { id: "transport_bus", label: "Автобус" },
    { id: "transport_ride", label: "Дуудлагын үйлчилгээ" },
    { id: "transport_other", label: "Бусад" },
  ],
  clothes: [
    { id: "clothes_shoes", label: "Гутал" },
    { id: "clothes_socks", label: "Оймс" },
    { id: "clothes_outer", label: "Гадуур хувцас" },
    { id: "clothes_under", label: "Дотуур" },
    { id: "clothes_accessory", label: "Аксессуар" },
    { id: "clothes_other", label: "Бусад хувцас" },
  ],
  home: [
    { id: "home_furniture", label: "Тавилга" },
    { id: "home_appliance", label: "Цахилгаан хэрэгсэл" },
    { id: "home_cleaning", label: "Цэвэрлэгээ" },
    { id: "home_kitchen", label: "Гал тогоо" },
    { id: "home_repair", label: "Засвар" },
    { id: "home_other", label: "Бусад гэр ахуй" },
  ],
  fun: [
    { id: "fun_cafe", label: "Кафе / ресторан" },
    { id: "fun_cinema", label: "Кино / энтертайнмент" },
    { id: "fun_gift", label: "Бэлэг" },
    { id: "fun_trip", label: "Аялал" },
    { id: "fun_other", label: "Бусад" },
  ],
  health: [
    { id: "health_medicine", label: "Эм" },
    { id: "health_supplement", label: "Витамин" },
    { id: "health_clinic", label: "Эмч / эмнэлэг" },
    { id: "health_test", label: "Шинжилгээ" },
    { id: "health_other", label: "Бусад" },
  ],
  other: [
    { id: "other_fees", label: "Шимтгэл" },
    { id: "other_subscription", label: "Сар бүр" },
    { id: "other_other", label: "Бусад" },
  ],

  // ===== Income subcategories =====
  income: [
    { id: "income_salary", label: "Цалин" },
    { id: "income_bonus", label: "Бонус" },
    { id: "income_business", label: "Бизнес / орлого" },
    { id: "income_gift", label: "Бэлэг / тусламж" },
    { id: "income_refund", label: "Буцаалт / нөхөн" },
    { id: "income_other", label: "Бусад орлого" },
  ],

  // ===== Debt loan types (used as subCategory) =====
  debt_borrow: [
    { id: "loan_salary", label: "Цалингийн зээл" },
    { id: "loan_mortgage", label: "Ипотек" },
    { id: "loan_leasing", label: "Лизинг" },
    { id: "loan_app", label: "Апп зээл" },
    { id: "loan_personal", label: "Хувь хүн" },
    { id: "loan_other", label: "Бусад" },
  ],
  // repay үед ч адилхан loan type сонгож төлнө
  debt_repay: [
    { id: "loan_salary", label: "Цалингийн зээл" },
    { id: "loan_mortgage", label: "Ипотек" },
    { id: "loan_leasing", label: "Лизинг" },
    { id: "loan_app", label: "Апп зээл" },
    { id: "loan_personal", label: "Хувь хүн" },
    { id: "loan_other", label: "Бусад" },
  ],

  // ===== Saving goals (used as subCategory) =====
  saving_deposit: [
    { id: "saving_trip", label: "Аялал" },
    { id: "saving_emergency", label: "Эрсдэлд хадгалах мөнгө" }, // ✅ чи заавал гэснийг нэмлээ
    { id: "saving_family", label: "Гэр бүл" },
    { id: "saving_home", label: "Гэр / байр" },
    { id: "saving_kids", label: "Хүүхэд" },
    { id: "saving_other", label: "Бусад" },
  ],
  saving_withdraw: [
    { id: "saving_trip", label: "Аялал" },
    { id: "saving_emergency", label: "Эрсдэлд хадгалах мөнгө" },
    { id: "saving_family", label: "Гэр бүл" },
    { id: "saving_home", label: "Гэр / байр" },
    { id: "saving_kids", label: "Хүүхэд" },
    { id: "saving_other", label: "Бусад" },
  ],
};

/** ✅ Type -> Category list */
export function categoriesForType(type: TransactionType): CategoryId[] {
  if (type === "income") return ["income"];
  if (type === "debt") return ["debt_borrow", "debt_repay"]; // ✅ зээл авах/төлөх
  if (type === "saving") return ["saving_deposit", "saving_withdraw"]; // ✅ хадгаламж хийх/авах
  // expense
  return ["food", "transport", "clothes", "home", "fun", "health", "other"];
}

/** ✅ Subcategory id -> label */
export function subLabel(id?: string | null): string {
  if (!id) return "";
  for (const cat of Object.keys(SUBCATEGORY_OPTIONS) as CategoryId[]) {
    const opt = (SUBCATEGORY_OPTIONS[cat] || []).find((s) => s.id === id);
    if (opt) return opt.label;
  }
  return id;
}
