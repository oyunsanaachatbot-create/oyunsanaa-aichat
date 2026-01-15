import {
  Sparkles,
  Brain,
  HeartHandshake,
  Target,
  HeartPulse,
  Coffee,
} from "lucide-react";

import { EMOTION_THEORY } from "@/content/mind/emotion";
import { SELF_THEORY } from "@/content/mind/self";
import { RELATIONS_THEORY } from "@/content/mind/relations";
import { PURPOSE_THEORY } from "@/content/mind/purpose";
import { SELFCARE_THEORY } from "@/content/mind/selfCare";
import { LIFE_THEORY } from "@/content/mind/life";

export type MenuItemGroup = "theory" | "apps" | "reports";

export interface MenuItem {
  label: string;
  href: string;
  group: MenuItemGroup;
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
    id: "emotion",
    label: "Сэтгэл санаа",
    icon: Sparkles,
    items: [
      { label: "Одоо би юу мэдэрч байна вэ?", href: "/mind/emotion/feel", group: "theory", artifact: EMOTION_THEORY.feelNow },
      { label: "Мэдрэмж хаанаас үүсдэг вэ?", href: "/mind/emotion/origin", group: "theory", artifact: EMOTION_THEORY.origin },
      { label: "Бодол → хариу үйлдэл", href: "/mind/emotion/thought", group: "theory", artifact: EMOTION_THEORY.thought },
      { label: "Хэтрүүлж бодох хэв маяг", href: "/mind/emotion/overthinking", group: "theory", artifact: EMOTION_THEORY.overthinking },
      { label: "Стресс бие дээр", href: "/mind/emotion/stress", group: "theory", artifact: EMOTION_THEORY.stressBody },
      { label: "Тайвшрах чадвар", href: "/mind/emotion/calm", group: "theory", artifact: EMOTION_THEORY.calm },

      { label: "Өдрийн сэтгэл санааны тест", href: "/mind/emotion/check", group: "apps" },
      { label: "Стресс ажиглалт", href: "/mind/emotion/report", group: "reports" },
    ],
  },

  {
    id: "self",
    label: "Өөрийгөө ойлгох",
    icon: Brain,
    items: [
      { label: "Би хэн бэ?", href: "/mind/self/who", group: "theory", artifact: SELF_THEORY.whoAmI },
    ],
  },

  {
    id: "relations",
    label: "Харилцаа",
    icon: HeartHandshake,
    items: [
      { label: "Эмпати гэж юу вэ?", href: "/mind/relations/empathy", group: "theory", artifact: RELATIONS_THEORY.empathy },
    ],
  },

  {
    id: "purpose",
    label: "Зорилго, утга учир",
    icon: Target,
    items: [
      { label: "Амьдралын утга учир", href: "/mind/purpose/meaning", group: "theory", artifact: PURPOSE_THEORY.meaning },
    ],
  },

  {
    id: "selfCare",
    label: "Өөрийгөө хайрлах",
    icon: HeartPulse,
    items: [
      { label: "Өөрийгөө хайрлах гэж юу вэ?", href: "/mind/self-care/love", group: "theory", artifact: SELFCARE_THEORY.love },
    ],
  },

  {
    id: "life",
    label: "Тогтвортой байдал",
    icon: Coffee,
    items: [
      { label: "Тогтвортой амьдрал", href: "/mind/life/stable", group: "theory", artifact: LIFE_THEORY.stable },
    ],
  },
];
