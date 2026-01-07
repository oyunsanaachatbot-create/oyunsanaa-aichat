// config/menus.ts
import {
  Sparkles,
  Brain,
  HeartHandshake,
  Target,
  HeartPulse,
  Coffee,
} from "lucide-react";

export type MenuItemGroup = "theory" | "apps" | "reports";

export interface MenuItem {
  label: string;
  href: string;
  group: MenuItemGroup;
}

export interface MenuConfig {
  id: string;
  label: string;
  icon: any;
  items: MenuItem[];
}

/** --- МЭНЮ жагсаалт --- */
export const MENUS: MenuConfig[] = [
  {
    id: "emotionControl",
    label: "Сэтгэл санаа",
    icon: Sparkles,
    items: [
      { label: "Онолын товч ойлголт", href: "/mind/emotion/control/summary", group: "theory" },
      { label: "Сэтгэл санаа апп", href: "/mind/emotion/control/daily-check", group: "apps" },
      { label: "Тестийн явц", href: "/mind/emotion/control/progress", group: "reports" },
    ],
  },

  {
    id: "selfUnderstanding",
    label: "Өөрийгөө ойлгох",
    icon: Brain,
    items: [
      { label: "Онолын товч ойлголт", href: "/mind/self/summary", group: "theory" },
      { label: "Миний ертөнц · Тэмдэглэл", href: "/mind/ebooks", group: "apps" },
      { label: "Дүгнэлт", href: "/mind/self/summary-report", group: "reports" },
    ],
  },

  {
    id: "relationships",
    label: "Харилцаа",
    icon: HeartHandshake,
    items: [
      { label: "Онолын товч ойлголт", href: "/mind/relations/summary", group: "theory" },
      { label: "Харилцаа апп", href: "/mind/relations/foundation", group: "apps" },
      { label: "Дүгнэлт", href: "/mind/relations/report", group: "reports" },
    ],
  },

  {
    id: "lifePurpose",
    label: "Зорилго, утга учир",
    icon: Target,
    items: [
      { label: "Онолын товч ойлголт", href: "/mind/purpose/summary", group: "theory" },
      { label: "Зорилго апп", href: "/mind/purpose/planning", group: "apps" },
      { label: "Дүгнэлт", href: "/mind/purpose/report", group: "reports" },
    ],
  },

  {
    id: "selfCare",
    label: "Өөрийгөө хайрлах",
    icon: HeartPulse,
    items: [
      { label: "Онолын товч ойлголт", href: "/mind/self-care/summary", group: "theory" },
      { label: "Эрүүл мэнд апп", href: "/mind/self-care/stress", group: "apps" },
      { label: "Дүгнэлт", href: "/mind/self-care/report", group: "reports" },
    ],
  },

  {
    id: "life",
    label: "Тогтвортой байдал",
    icon: Coffee,
    items: [
      { label: "Онолын товч ойлголт", href: "/mind/life/summary", group: "theory" },
      { label: "Санхүү апп", href: "/mind/life/finance-app", group: "apps" },
      { label: "Тайлан", href: "/mind/life/report", group: "reports" },
    ],
  },
];
