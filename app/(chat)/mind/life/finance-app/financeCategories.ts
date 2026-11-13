import type { Locale } from "@/lib/i18n/config";
import type { CategoryId, SubOpt, TransactionType } from "./financeTypes";

/** Категори нэрс (бүх локалаар) */
const CATEGORY_LABELS_BY_LOCALE: Record<Locale, Record<CategoryId, string>> = {
  mn: {
    food: "Хоол, хүнс",
    transport: "Тээвэр",
    clothes: "Хувцас",
    home: "Гэр, хэрэглээ",
    fun: "Зугаа, чөлөөт цаг",
    health: "Эрүүл мэнд",
    other: "Бусад",
    income: "Орлого",
    debt_borrow: "Зээл авах",
    debt_repay: "Зээл төлөх",
    saving_add: "Хадгаламж хийх",
    saving_withdraw: "Хадгаламжаас авах",
  },
  en: {
    food: "Food, groceries",
    transport: "Transport",
    clothes: "Clothes",
    home: "Home, household",
    fun: "Fun, leisure",
    health: "Health",
    other: "Other",
    income: "Income",
    debt_borrow: "Borrow loan",
    debt_repay: "Repay loan",
    saving_add: "Add savings",
    saving_withdraw: "Withdraw savings",
  },
  ja: {
    food: "食費・食料",
    transport: "交通費",
    clothes: "衣類",
    home: "家・生活用品",
    fun: "娯楽・余暇",
    health: "健康",
    other: "その他",
    income: "収入",
    debt_borrow: "借入",
    debt_repay: "返済",
    saving_add: "貯金する",
    saving_withdraw: "貯金から引く",
  },
  ko: {
    food: "식비, 식료품",
    transport: "교통",
    clothes: "의류",
    home: "주거, 생활용품",
    fun: "여가, 취미",
    health: "건강",
    other: "기타",
    income: "수입",
    debt_borrow: "대출 받기",
    debt_repay: "대출 상환",
    saving_add: "저축하기",
    saving_withdraw: "저축에서 꺼내기",
  },
  ru: {
    food: "Еда, продукты",
    transport: "Транспорт",
    clothes: "Одежда",
    home: "Дом, быт",
    fun: "Развлечения, досуг",
    health: "Здоровье",
    other: "Другое",
    income: "Доход",
    debt_borrow: "Взять кредит",
    debt_repay: "Погасить кредит",
    saving_add: "Добавить сбережения",
    saving_withdraw: "Снять сбережения",
  },
};

export const CATEGORY_LABELS = CATEGORY_LABELS_BY_LOCALE.mn;

export function categoryLabels(locale: Locale = "mn"): Record<CategoryId, string> {
  return CATEGORY_LABELS_BY_LOCALE[locale] ?? CATEGORY_LABELS_BY_LOCALE.mn;
}

/** Дэд ангиллын сонголтуудын id -> label (бүх локалаар) */
const SUB_LABELS_BY_LOCALE: Record<Locale, Record<string, string>> = {
  mn: {
    income_salary: "Цалин",
    income_bonus: "Бонус",
    income_gift: "Бэлэг / тусламж",
    income_other: "Бусад орлого",
    loan_mortgage: "Ипотек",
    loan_leasing: "Лизинг",
    loan_app: "Апп/ББСБ зээл",
    loan_salary: "Цалингийн зээл",
    loan_person: "Хувь хүн",
    loan_other: "Бусад",
    saving_risk: "Эрсдэлд хадгалах мөнгө",
    saving_travel: "Аялал",
    saving_family: "Гэр бүл",
    saving_home: "Орон байр/гэр",
    saving_health: "Эрүүл мэнд",
    saving_other: "Бусад",
    food_grocery: "Хүнс",
    food_cafe: "Кафе/Ресторан",
    food_other: "Бусад",
    transport_taxi: "Такси",
    transport_bus: "Нийтийн тээвэр",
    transport_fuel: "Түлш",
    transport_other: "Бусад",
  },
  en: {
    income_salary: "Salary",
    income_bonus: "Bonus",
    income_gift: "Gift / support",
    income_other: "Other income",
    loan_mortgage: "Mortgage",
    loan_leasing: "Leasing",
    loan_app: "App/NBFI loan",
    loan_salary: "Salary loan",
    loan_person: "Individual",
    loan_other: "Other",
    saving_risk: "Emergency fund",
    saving_travel: "Travel",
    saving_family: "Family",
    saving_home: "Home/housing",
    saving_health: "Health",
    saving_other: "Other",
    food_grocery: "Groceries",
    food_cafe: "Cafe/Restaurant",
    food_other: "Other",
    transport_taxi: "Taxi",
    transport_bus: "Public transport",
    transport_fuel: "Fuel",
    transport_other: "Other",
  },
  ja: {
    income_salary: "給料",
    income_bonus: "ボーナス",
    income_gift: "贈り物・援助",
    income_other: "その他の収入",
    loan_mortgage: "モーゲージ",
    loan_leasing: "リース",
    loan_app: "アプリ/ノンバンクローン",
    loan_salary: "給与前借り",
    loan_person: "個人",
    loan_other: "その他",
    saving_risk: "緊急用資金",
    saving_travel: "旅行",
    saving_family: "家族",
    saving_home: "住宅",
    saving_health: "健康",
    saving_other: "その他",
    food_grocery: "食料品",
    food_cafe: "カフェ/レストラン",
    food_other: "その他",
    transport_taxi: "タクシー",
    transport_bus: "公共交通機関",
    transport_fuel: "燃料",
    transport_other: "その他",
  },
  ko: {
    income_salary: "급여",
    income_bonus: "보너스",
    income_gift: "선물 / 지원",
    income_other: "기타 수입",
    loan_mortgage: "모기지",
    loan_leasing: "리스",
    loan_app: "앱/대출 회사",
    loan_salary: "급여 대출",
    loan_person: "개인",
    loan_other: "기타",
    saving_risk: "비상금",
    saving_travel: "여행",
    saving_family: "가족",
    saving_home: "주거",
    saving_health: "건강",
    saving_other: "기타",
    food_grocery: "식료품",
    food_cafe: "카페/레스토랑",
    food_other: "기타",
    transport_taxi: "택시",
    transport_bus: "대중교통",
    transport_fuel: "연료",
    transport_other: "기타",
  },
  ru: {
    income_salary: "Зарплата",
    income_bonus: "Бонус",
    income_gift: "Подарок / помощь",
    income_other: "Прочий доход",
    loan_mortgage: "Ипотека",
    loan_leasing: "Лизинг",
    loan_app: "Займ через приложение/МФО",
    loan_salary: "Зарплатный займ",
    loan_person: "Частное лицо",
    loan_other: "Другое",
    saving_risk: "Резервный фонд",
    saving_travel: "Путешествие",
    saving_family: "Семья",
    saving_home: "Жильё",
    saving_health: "Здоровье",
    saving_other: "Другое",
    food_grocery: "Продукты",
    food_cafe: "Кафе/Ресторан",
    food_other: "Другое",
    transport_taxi: "Такси",
    transport_bus: "Общественный транспорт",
    transport_fuel: "Топливо",
    transport_other: "Другое",
  },
};

/** Дэд ангиллын сонголтууд (category-оор), id-ууд локалаас үл хамаарна */
const SUBCATEGORY_IDS: Partial<Record<CategoryId, string[]>> = {
  income: ["income_salary", "income_bonus", "income_gift", "income_other"],
  debt_borrow: ["loan_mortgage", "loan_leasing", "loan_app", "loan_salary", "loan_person", "loan_other"],
  debt_repay: ["loan_mortgage", "loan_leasing", "loan_app", "loan_salary", "loan_person", "loan_other"],
  saving_add: ["saving_risk", "saving_travel", "saving_family", "saving_home", "saving_health", "saving_other"],
  saving_withdraw: ["saving_risk", "saving_travel", "saving_family", "saving_home", "saving_health", "saving_other"],
  food: ["food_grocery", "food_cafe", "food_other"],
  transport: ["transport_taxi", "transport_bus", "transport_fuel", "transport_other"],
};

export const SUBCATEGORY_OPTIONS: Partial<Record<CategoryId, SubOpt[]>> = Object.fromEntries(
  Object.entries(SUBCATEGORY_IDS).map(([cat, ids]) => [
    cat,
    ids.map((id) => ({ id, label: SUB_LABELS_BY_LOCALE.mn[id] ?? id })),
  ])
) as Partial<Record<CategoryId, SubOpt[]>>;

export function subcategoryOptions(locale: Locale = "mn"): Partial<Record<CategoryId, SubOpt[]>> {
  const labels = SUB_LABELS_BY_LOCALE[locale] ?? SUB_LABELS_BY_LOCALE.mn;
  return Object.fromEntries(
    Object.entries(SUBCATEGORY_IDS).map(([cat, ids]) => [
      cat,
      ids.map((id) => ({ id, label: labels[id] ?? id })),
    ])
  ) as Partial<Record<CategoryId, SubOpt[]>>;
}

export function categoriesForType(type: TransactionType): CategoryId[] {
  if (type === "income") return ["income"];
  if (type === "debt") return ["debt_borrow", "debt_repay"];
  if (type === "saving") return ["saving_add", "saving_withdraw"];
  return ["food", "transport", "clothes", "home", "fun", "health", "other"];
}

/** subCategory id -> label */
export function subLabel(id?: string | null, locale: Locale = "mn"): string {
  if (!id) return "";
  const labels = SUB_LABELS_BY_LOCALE[locale] ?? SUB_LABELS_BY_LOCALE.mn;
  return labels[id] ?? id;
}
