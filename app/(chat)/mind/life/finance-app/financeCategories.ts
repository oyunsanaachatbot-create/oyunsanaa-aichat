import type { CategoryId, SubOpt, TransactionType } from "./financeTypes";

/** ✅ Expense categories */
export const EXPENSE_CATEGORIES: CategoryId[] = [
  "food",
  "transport",
  "clothes",
  "home",
  "fun",
  "health",
  "other",
];

/** ✅ Income category is fixed */
export const INCOME_CATEGORIES: CategoryId[] = ["income"];

/** ✅ Debt category is fixed */
export const DEBT_CATEGORIES: CategoryId[] = ["debt"];

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  food: "Хоол, хүнс",
  transport: "Тээвэр",
  clothes: "Хувцас",
  home: "Гэр, хэрэглээ",
  fun: "Зугаа, чөлөөт цаг",
  health: "Эрүүл мэнд",
  other: "Бусад",
  income: "Орлого",
  debt: "Өр / Зээл",
};

export const SUBCATEGORY_OPTIONS: Record<CategoryId, SubOpt[]> = {
  // ====== Expense subcategories ======
  food: [
    { id: "food_veg", label: "Ногоо / жимс" },
    { id: "food_meat", label: "Мах / махан бүтээгдэхүүн" },
    { id: "food_grain", label: "Гурил / будаа" },
    { id: "food_dairy", label: "Сүү / цагаан идээ" },
    { id: "food_snack", label: "Амттан / зууш" },
    { id: "food_drink", label: "Ундаа / кофе" },
    { id: "food_other", label: "Бусад хүнс" },
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
  health: [
    { id: "health_medicine", label: "Эм" },
    { id: "health_supplement", label: "Витамин" },
    { id: "health_clinic", label: "Эмч / эмнэлэг" },
    { id: "health_test", label: "Шинжилгээ" },
    { id: "health_other", label: "Бусад" },
  ],
  transport: [
    { id: "transport_fuel", label: "Шатахуун" },
    { id: "transport_taxi", label: "Такси" },
    { id: "transport_bus", label: "Автобус" },
    { id: "transport_ride", label: "Дуудлагын үйлчилгээ" },
    { id: "transport_other", label: "Бусад" },
  ],
  fun: [
    { id: "fun_cafe", label: "Кафе / ресторан" },
    { id: "fun_cinema", label: "Кино / энтертайнмент" },
    { id: "fun_gift", label: "Бэлэг" },
    { id: "fun_trip", label: "Аялал" },
    { id: "fun_other", label: "Бусад" },
  ],
  other: [
    { id: "other_fees", label: "Шимтгэл" },
    { id: "other_subscription", label: "Сар бүр" },
    { id: "other_other", label: "Бусад" },
  ],

  // ====== Income subcategories ======
  income: [
    { id: "income_salary", label: "Цалин" },
    { id: "income_bonus", label: "Бонус" },
    { id: "income_business", label: "Бизнес / орлого" },
    { id: "income_gift", label: "Бэлэг / тусламж" },
    { id: "income_refund", label: "Буцаалт / нөхөн" },
    { id: "income_other", label: "Бусад орлого" },
  ],

  // ====== Debt subcategories ======
  debt: [
    { id: "debt_borrow", label: "Зээл авсан / Өр нэмэгдсэн" },
    { id: "debt_repay", label: "Зээл төлсөн / Өр буурсан" },
  ],
};

/** ✅ subCategory id -> Монгол label */
export function subLabel(id?: string | null): string {
  if (!id) return "";
  const cats = Object.keys(SUBCATEGORY_OPTIONS) as CategoryId[];
  for (const cat of cats) {
    const opt = (SUBCATEGORY_OPTIONS[cat] || []).find((s) => s.id === id);
    if (opt) return opt.label;
  }
  return id;
}

/** ✅ Type -> available categories */
export function categoriesForType(t: TransactionType): CategoryId[] {
  if (t === "income") return INCOME_CATEGORIES;
  if (t === "debt") return DEBT_CATEGORIES;
  return EXPENSE_CATEGORIES;
}
