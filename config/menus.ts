import {
  Compass, // 🧭 Би хэн бэ (Үндсэн хөтөлбөр)
  Layers, // ➕ Нэмэлт хөтөлбөр
  HeartPulse, // 🩺 Эрүүл мэнд
  Briefcase, // 💼 Ажил, үүрэг
  HeartHandshake, // 🤝 Харилцаа
  Target, // 🎯 Утга учир, ирээдүй
  Globe, // 🌍 Миний ертөнц
  TrendingUp, // 📈 Миний явц
  Stethoscope, // 🩺 Мэргэжилтэнтэй холбогдох
} from "lucide-react";

/* ----------------
   2 group only
----------------- */
export type MenuItemGroup = "theory" | "apps" | "practice";

export interface MenuItem {
  label: string;
  href: string; // theory дээр slug маягаар, practice дээр route
  group: MenuItemGroup;
  /** i18n key into dict.menu.items (falls back to `label` if absent). */
  key?: string;
  /** Цэсэнд байгаа гэхдээ агуулга нь хараахан бэлэн болоогүй — холбоосгүй, "Тун удахгүй" гэж харагдана. */
  comingSoon?: boolean;
  artifact?: {
    title: string;
    content: string;
  };
}

export interface MenuConfig {
  id: string;
  label: string;
  icon: any;
  items: MenuItem[];
}

export const MENUS: MenuConfig[] = [
  {
    id: "whoAmI",
    label: "Би хэн бэ?",
    icon: Compass,
    items: [
      {
        label: "Танилцуулга",
        href: "/mind/who-am-i/intro",
        group: "theory",
      },
      {
        label: "Амьдралын тэнцвэр шалгах",
        href: "/mind/who-am-i/balance-test",
        group: "practice",
        key: "whoAmIBalanceTest",
      },
      {
        label: "Ажиглах, таних, ойлгох",
        href: "/mind/who-am-i/observe",
        group: "theory",
        comingSoon: true,
      },
      {
        label: "Хүлээн зөвшөөрөх",
        href: "/mind/who-am-i/accept",
        group: "theory",
        comingSoon: true,
      },
      {
        label: "Ирээдүйд төвлөрөх",
        href: "/mind/who-am-i/focus-future",
        group: "theory",
        comingSoon: true,
      },
      {
        label: "Дүгнэлт",
        href: "/mind/who-am-i/conclusion",
        group: "theory",
      },
      {
        label: "Даалгавар",
        href: "/mind/who-am-i/task",
        group: "theory",
        comingSoon: true,
      },
    ],
  },

  {
    id: "extraPrograms",
    label: "Нэмэлт хөтөлбөр",
    icon: Layers,
    items: [
      {
        label: "Идэвхтэй хөтөлбөрүүдийн нэрс гарна",
        href: "/mind/programs/active",
        group: "theory",
        comingSoon: true,
      },
      {
        label: "Дууссан хөтөлбөрүүд",
        href: "/mind/programs/completed",
        group: "theory",
        comingSoon: true,
      },
    ],
  },

  {
    id: "health",
    label: "Эрүүл мэнд",
    icon: HeartPulse,
    items: [
      {
        label: "Тайлбар",
        href: "/mind/health/intro",
        group: "theory",
      },
      {
        label: "Миний эрүүл мэнд",
        href: "/mind/self-care/stress",
        group: "practice",
        key: "selfCareHealth",
      },
    ],
  },

  {
    id: "work",
    label: "Ажил, үүрэг",
    icon: Briefcase,
    items: [
      {
        label: "Тайлбар",
        href: "/mind/work/intro",
        group: "theory",
      },
      {
        label: "Миний санхүү",
        href: "/mind/life/finance-app",
        group: "practice",
        key: "lifeFinance",
      },
    ],
  },

  {
    id: "relations",
    label: "Харилцаа",
    icon: HeartHandshake,
    items: [
      {
        label: "Тайлбар",
        href: "/mind/relations/intro",
        group: "theory",
      },
      {
        label: "Миний харилцаа",
        href: "/mind/relations/tests",
        group: "practice",
        key: "relationsTests",
      },
    ],
  },

  {
    id: "purpose",
    label: "Утга учир, ирээдүй",
    icon: Target,
    items: [
      {
        label: "Тайлбар",
        href: "/mind/purpose/intro",
        group: "theory",
      },
      {
        label: "Миний зорилго",
        href: "/mind/purpose/goal-planner",
        group: "practice",
        key: "purposeGoalPlanner",
      },
    ],
  },

  {
    id: "myWorld",
    label: "Миний ертөнц",
    icon: Globe,
    items: [
      {
        label: "Миний ертөнц - тэмдэглэл апп",
        href: "/mind/ebooks",
        group: "practice",
        key: "selfEbooks",
      },
    ],
  },

  {
    id: "myProgress",
    label: "Миний явц",
    icon: TrendingUp,
    items: [
      {
        label: "Нэгдсэн тайлан",
        href: "/mind/balance/summary",
        group: "practice",
        key: "progressSummary",
      },
      {
        label: "Амьдралын тэнцвэр",
        href: "/mind/balance/result",
        group: "practice",
        key: "progressBalance",
      },
      {
        label: "Аппуудын дүгнэлт",
        href: "/mind/balance/progress",
        group: "practice",
        key: "progressApps",
      },
      {
        label: "Хөтөлбөрийн явц",
        href: "/mind/programs/progress",
        group: "practice",
        comingSoon: true,
      },
    ],
  },

  {
    id: "specialists",
    label: "Мэргэжилтэнтэй холбогдох",
    icon: Stethoscope,
    items: [
      {
        label: "💬 Сэтгэл зүйчтэй чат",
        href: "/mind/therapy",
        group: "practice",
        key: "therapyChat",
      },
      {
        label: "Сэтгэл засалч",
        href: "/mind/specialists/therapist",
        group: "practice",
        comingSoon: true,
      },
      {
        label: "Зөвлөх",
        href: "/mind/specialists/consultant",
        group: "practice",
        comingSoon: true,
      },
      {
        label: "Төвүүд",
        href: "/mind/specialists/centers",
        group: "practice",
        comingSoon: true,
      },
    ],
  },
];
