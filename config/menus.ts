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

  // ✅ ARTIFACT (бэлэн текст)
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

/** --- МЭНЮ жагсаалт --- */
export const MENUS: MenuConfig[] = [
  {
    id: "emotionControl",
    label: "Сэтгэл санаа",
    icon: Sparkles,
    items: [
      {
        label: "Онолын товч ойлголт",
        href: "/mind/emotion/control/summary",
        group: "theory",
        artifact: {
          title: "Сэтгэл санаа — Онолын товч ойлголт",
          content: [
            "## Товч ойлголт",
            "- Сэтгэл хөдлөл бол хэрэгцээ, аюулгүй байдлын дохио.",
            "- Нэрлэж чадвал хүч нь багасна.",
            "- Бодол ≠ баримт.",
            "",
            "## Өөрөөсөө асуух",
            "- Би яг юуг мэдэрч байна вэ?",
            "- Надад яг юу хэрэгтэй байна вэ?",
          ].join("\n"),
        },
      },
      { label: "Сэтгэл санаа апп", href: "/mind/emotion/control/daily-check", group: "apps" },
      { label: "Тестийн явц", href: "/mind/emotion/control/progress", group: "reports" },
    ],
  },

  {
    id: "selfUnderstanding",
    label: "Өөрийгөө ойлгох",
    icon: Brain,
    items: [
      {
        label: "Онолын товч ойлголт",
        href: "/mind/self/summary",
        group: "theory",
        artifact: {
          title: "Өөрийгөө ойлгох — Онолын товч ойлголт",
          content: [
            "## Товч ойлголт",
            "- Үнэт зүйл, итгэл үнэмшлээ таних нь суурь.",
            "- Давтагддаг зан үйл дотоод итгэлтэй холбоотой.",
            "",
            "## Өөрөөсөө асуух",
            "- Энэ шийдвэр миний юуг хамгаалж байна вэ?",
            "- Би юунаас зайлсхийж байна вэ?",
          ].join("\n"),
        },
      },
      { label: "Миний ертөнц · Тэмдэглэл", href: "/mind/ebooks", group: "apps" },
      { label: "Дүгнэлт", href: "/mind/self/summary-report", group: "reports" },
    ],
  },

  {
    id: "relationships",
    label: "Харилцаа",
    icon: HeartHandshake,
    items: [
      {
        label: "Онолын товч ойлголт",
        href: "/mind/relations/summary",
        group: "theory",
        artifact: {
          title: "Харилцаа — Онолын товч ойлголт",
          content: [
            "## Товч ойлголт",
            "- Эрүүл харилцаа = аюулгүй байдал + хүндлэл.",
            "- Эмпати: сонсох → ойлгох.",
            "",
            "## Өөрөөсөө асуух",
            "- Би юу хүсэж байна вэ?",
            "- Нөгөө хүн юу мэдэрч байж магадгүй вэ?",
          ].join("\n"),
        },
      },
      { label: "Харилцаа апп", href: "/mind/relations/foundation", group: "apps" },
      { label: "Дүгнэлт", href: "/mind/relations/report", group: "reports" },
    ],
  },

  {
    id: "lifePurpose",
    label: "Зорилго, утга учир",
    icon: Target,
    items: [
      {
        label: "Онолын товч ойлголт",
        href: "/mind/purpose/summary",
        group: "theory",
        artifact: {
          title: "Зорилго, утга учир — Онолын товч ойлголт",
          content: [
            "## Товч ойлголт",
            "- Утга учир = яагаад.",
            "- Зорилго = яах.",
            "",
            "## Өөрөөсөө асуух",
            "- Энэ зорилгын яагаад нь юу вэ?",
            "- Өнөөдөр ямар жижиг алхам хийх вэ?",
          ].join("\n"),
        },
      },
      { label: "Зорилго апп", href: "/mind/purpose/planning", group: "apps" },
      { label: "Дүгнэлт", href: "/mind/purpose/report", group: "reports" },
    ],
  },

  {
    id: "selfCare",
    label: "Өөрийгөө хайрлах",
    icon: HeartPulse,
    items: [
      {
        label: "Онолын товч ойлголт",
        href: "/mind/self-care/summary",
        group: "theory",
        artifact: {
          title: "Өөрийгөө хайрлах — Онолын товч ойлголт",
          content: [
            "## Товч ойлголт",
            "- Өөрийгөө хайрлах нь тогтвортой арчилгаа.",
            "- Биеийн хэрэгцээ сэтгэлзүйд нөлөөлнө.",
            "",
            "## Өөрөөсөө асуух",
            "- Одоо миний биед юу хэрэгтэй вэ?",
            "- Би өөртөө ямар үг хэлж байна вэ?",
          ].join("\n"),
        },
      },
      { label: "Эрүүл мэнд апп", href: "/mind/self-care/stress", group: "apps" },
      { label: "Дүгнэлт", href: "/mind/self-care/report", group: "reports" },
    ],
  },

  {
    id: "life",
    label: "Тогтвортой байдал",
    icon: Coffee,
    items: [
      {
        label: "Онолын товч ойлголт",
        href: "/mind/life/summary",
        group: "theory",
        artifact: {
          title: "Тогтвортой байдал — Онолын товч ойлголт",
          content: [
            "## Товч ойлголт",
            "- Орчин, санхүү, шийдвэр тогтвортой байдалд нөлөөлнө.",
            "- Энгийнчлэх нь стресс багасгана.",
            "",
            "## Өөрөөсөө асуух",
            "- Миний стрессийн эх үүсвэр юу вэ?",
            "- Юуг нэг алхмаар хялбарчилж болох вэ?",
          ].join("\n"),
        },
      },
      { label: "Санхүү апп", href: "/mind/life/finance-app", group: "apps" },
      { label: "Тайлан", href: "/mind/life/report", group: "reports" },
    ],
  },
];
