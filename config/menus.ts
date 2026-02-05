import {
  Sparkles,
  Brain,
  HeartHandshake,
  Target,
  HeartPulse,
  Coffee,
  BarChart,     // 🌈 Сэтгэлийн тэнцвэр
  FileCheck,    // 🧪 Тест
  ScrollText,   // 📝 Дүгнэлт
  TrendingUp,   // 📈 Явц
  Trophy,       // 🏁 Үр дүн
} from "lucide-react";


/* ----------------
   2 group only
----------------- */
export type MenuItemGroup = "theory" | "apps" | "practice";


export interface MenuItem {
  label: string;
  href: string; // theory дээр slug маягаар, practice дээр route
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

/* ---------------------------
   THEORY: 37 file imports
   (folder: content/mind/...)
---------------------------- */
// 1) Emotion (6)
import { artifact as EMO_FEEL_NOW } from "@/content/mind/emotion/feel-now";
import { artifact as EMO_ORIGIN } from "@/content/mind/emotion/origin";
import { artifact as EMO_THOUGHT_REACTION } from "@/content/mind/emotion/thought-reaction";
import { artifact as EMO_OVERTHINKING } from "@/content/mind/emotion/overthinking";
import { artifact as EMO_STRESS_BODY } from "@/content/mind/emotion/stress-body";
import { artifact as EMO_CALM_SKILL } from "@/content/mind/emotion/calm-skill";

// 2) Self (6)
import { artifact as SELF_WHO_AM_I } from "@/content/mind/self/who-am-i";
import { artifact as SELF_WHAT_MATTERS } from "@/content/mind/self/what-matters";
import { artifact as SELF_PERSONALITY } from "@/content/mind/self/personality";
import { artifact as SELF_WHAT_MOVES_ME } from "@/content/mind/self/what-moves-me";
import { artifact as SELF_BELIEFS } from "@/content/mind/self/beliefs";
import { artifact as SELF_SELF_WORTH } from "@/content/mind/self/self-worth";

// 3) Relations (8)
import { artifact as REL_WHY_HARD } from "@/content/mind/relations/why-hard";
import { artifact as REL_FOUNDATION } from "@/content/mind/relations/foundation-skills";
import { artifact as REL_SELF_EXPRESSION } from "@/content/mind/relations/self-expression";
import { artifact as REL_EMPATHY } from "@/content/mind/relations/empathy";
import { artifact as REL_LISTENING } from "@/content/mind/relations/listening";
import { artifact as REL_BOUNDARIES } from "@/content/mind/relations/boundaries";
import { artifact as REL_TOXIC } from "@/content/mind/relations/unhealthy-signs";
import { artifact as REL_CONFLICT } from "@/content/mind/relations/healthy-conflict";

// 4) Purpose (6)
import { artifact as PUR_QUICK } from "@/content/mind/purpose/quick-understand";
import { artifact as PUR_MEANING } from "@/content/mind/purpose/meaning";
import { artifact as PUR_BIG_PICTURE } from "@/content/mind/purpose/big-picture";
import { artifact as PUR_DREAMS } from "@/content/mind/purpose/dreams-vs-reality";
import { artifact as PUR_GOALS } from "@/content/mind/purpose/goals-motivate";
import { artifact as PUR_GROWTH } from "@/content/mind/purpose/growth-change";




// 5) Self-care (5)
import { artifact as CARE_SELF_LOVE } from "@/content/mind/self-care/self-love";
import { artifact as CARE_INNER_CRITIC } from "@/content/mind/self-care/inner-critic";
import { artifact as CARE_COMPASSION } from "@/content/mind/self-care/self-compassion";
import { artifact as CARE_FATIGUE } from "@/content/mind/self-care/stress-fatigue";
import { artifact as CARE_SLEEP } from "@/content/mind/self-care/sleep-energy";

// 6) Life (6)
import { artifact as LIFE_STABLE } from "@/content/mind/life/stable-life";
import { artifact as LIFE_STRESS } from "@/content/mind/life/stress-sources";
import { artifact as LIFE_MONEY } from "@/content/mind/life/money-and-mind";
import { artifact as LIFE_WORK } from "@/content/mind/life/work-environment";
import { artifact as LIFE_DECISION } from "@/content/mind/life/decision-fatigue";
import { artifact as LIFE_SIMPLIFY } from "@/content/mind/life/simplify";

export const MENUS: MenuConfig[] = [
 {
  id: "balance",
  label: "Сэтгэлийн тэнцвэр",
  icon: BarChart,
  items: [
    { label: "🧪 Сэтгэлийн тэнцвэр шалгах тэст", href: "/mind/balance/test", group: "practice" },

    // ✅ ТЕСТИЙН ДҮГНЭЛТ
    { label: "📝 Тэстийн дүгнэлт", href: "/mind/balance/result", group: "practice" },

    // ✅ ЭНЭ 2 нь дараа нь “доод аппуудын нэгдсэн” dashboard хэвээрээ үлдэнэ
    { label: "📈 Миний явц", href: "/mind/balance/progress", group: "practice" },
    { label: "🧩 Нэгдсэн тайлан", href: "/mind/balance/summary", group: "practice" },
  ],
},


  {
    id: "emotion",
    label: "Сэтгэл санаа",
    icon: Sparkles,
    items: [
      // 📘 Онол (artifact)
      { label: "Одоо би юу мэдэрч байна вэ?", href: "/mind/emotion/feel-now", group: "theory", artifact: EMO_FEEL_NOW },
      { label: "Мэдрэмж хаанаас үүсдэг вэ?", href: "/mind/emotion/origin", group: "theory", artifact: EMO_ORIGIN },
      { label: "Бодол → хариу үйлдэл яаж үүсдэг вэ?", href: "/mind/emotion/thought-reaction", group: "theory", artifact: EMO_THOUGHT_REACTION },
      { label: "Хэтрүүлж бодох хэв маяг гэж юу вэ?", href: "/mind/emotion/overthinking", group: "theory", artifact: EMO_OVERTHINKING },
      { label: "Стресс бие дээр яаж илэрдэг вэ?", href: "/mind/emotion/stress-body", group: "theory", artifact: EMO_STRESS_BODY },
      { label: "Тайвшрах чадвар гэж юу вэ?", href: "/mind/emotion/calm-skill", group: "theory", artifact: EMO_CALM_SKILL },

      // 🛠 Хэрэгжүүлэлт (app route-ууд чинь хэвээр)
    { label: "Өдрийн сэтгэл санааны тест (check)", href: "/mind/emotion/control/daily-check?new=1", group: "practice" },

  ],
},

  {
    id: "self",
    label: "Өөрийгөө ойлгох",
    icon: Brain,
    items: [
      { label: "Би хэн бэ?", href: "/mind/self/who-am-i", group: "theory", artifact: SELF_WHO_AM_I },
      { label: "Надад юу хамгийн чухал вэ?", href: "/mind/self/what-matters", group: "theory", artifact: SELF_WHAT_MATTERS },
      { label: "Миний зан чанар ямар вэ?", href: "/mind/self/personality", group: "theory", artifact: SELF_PERSONALITY },
      { label: "Би юунаас эрч хүч авдаг вэ?", href: "/mind/self/what-moves-me", group: "theory", artifact: SELF_WHAT_MOVES_ME },
      { label: "Дотоод итгэл үнэмшил хэр вэ?", href: "/mind/self/beliefs", group: "theory", artifact: SELF_BELIEFS },
      { label: "Өөрийн үнэ цэнэ гэж юу вэ?", href: "/mind/self/self-worth", group: "theory", artifact: SELF_SELF_WORTH },

      { label: "Миний ертөнц - тэмдэглэл апп", href: "/mind/ebooks", group: "practice" },
    ],
  },

  {
  id: "relations",
  label: "Харилцаа",
  icon: HeartHandshake,
  items: [
    { label: "Харилцааны суурь чадвар гэж юу вэ?", href: "/mind/relations/foundation-skills", group: "theory", artifact: REL_FOUNDATION },

    { label: "Өөрийгөө илэрхийлэх гэж юу вэ?", href: "/mind/relations/self-expression", group: "theory", artifact: REL_SELF_EXPRESSION },
    { label: "Эмпати гэж юу вэ?", href: "/mind/relations/empathy", group: "theory", artifact: REL_EMPATHY },
    { label: "Сонсох ур чадвар яагаад чухал вэ?", href: "/mind/relations/listening", group: "theory", artifact: REL_LISTENING },

    { label: "Хил хязгаар тогтоох гэж юу вэ?", href: "/mind/relations/boundaries", group: "theory", artifact: REL_BOUNDARIES },
    { label: "Эрүүл бус харилцааг яаж таних вэ?", href: "/mind/relations/unhealthy-signs", group: "theory", artifact: REL_TOXIC },
    { label: "Маргааныг эрүүл шийдэх гэж юу вэ?", href: "/mind/relations/healthy-conflict", group: "theory", artifact: REL_CONFLICT },

    { label: "Харилцааны төрлүүд", href: "/mind/relations/why-hard", group: "theory", artifact: REL_WHY_HARD },

    { label: "Харилцааны хэв маяг шалгах тестүүд", href: "/mind/relations/control/daily-check", group: "practice" },
  ],
},

  {
  id: "purpose",
  label: "Зорилго, утга учир",
  icon: Target,
  items: [
    { label: "Зорилго яагаад чухал вэ?", href: "/mind/purpose/meaning", group: "theory", artifact: PUR_MEANING },
    { label: "Миний амьдралын том зураглал", href: "/mind/purpose/big-picture", group: "theory", artifact: PUR_BIG_PICTURE },
    { label: "Хүсэл мөрөөдлийг зорилго болгох нь", href: "/mind/purpose/dreams-vs-reality", group: "theory", artifact: PUR_DREAMS },
    { label: "Зорилго урам зоригийг яаж нэмдэг вэ?", href: "/mind/purpose/goals-motivate", group: "theory", artifact: PUR_GOALS },
    { label: "Өсөлт ба өөрчлөлт: зорилгын үр дүн", href: "/mind/purpose/growth-change", group: "theory", artifact: PUR_GROWTH },

    // Purpose items дотор:
    { label: "🧩 Зорилго бичиж цэгцлэх апп", href: "/mind/purpose/goal-planner", group: "practice" },
  ],
},


  {
    id: "selfCare",
    label: "Өөрийгөө хайрлах",
    icon: HeartPulse,
    items: [
      { label: "Өөрийгөө хайрлах гэж юу вэ?", href: "/mind/self-care/self-love", group: "theory", artifact: CARE_SELF_LOVE },
      { label: "Дотоод шүүмжлэл хаанаас гардаг вэ?", href: "/mind/self-care/inner-critic", group: "theory", artifact: CARE_INNER_CRITIC },
      { label: "Өөртэйгөө энэрэнгүй харьцах", href: "/mind/self-care/self-compassion", group: "theory", artifact: CARE_COMPASSION },
      { label: "Стресс ба ядаргаа яагаад хуримтлагддаг вэ?", href: "/mind/self-care/stress-fatigue", group: "theory", artifact: CARE_FATIGUE },
      { label: "Нойр, эрч хүч яагаад чухал вэ?", href: "/mind/self-care/sleep-energy", group: "theory", artifact: CARE_SLEEP },

      { label: "Эрүүл мэнд апп", href: "/mind/self-care/stress", group: "practice" },
      { label: "Хооллолтын ажиглалт", href: "/mind/self-care/nutrition", group: "practice" },
    ],
  },

  {
    id: "life",
    label: "Тогтвортой байдал",
    icon: Coffee,
    items: [
      { label: "Тогтвортой амьдрал гэж юу вэ?", href: "/mind/life/stable-life", group: "theory", artifact: LIFE_STABLE },
      { label: "Стресс хаанаас үүсдэг вэ?", href: "/mind/life/stress-sources", group: "theory", artifact: LIFE_STRESS },
      { label: "Мөнгө яагаад сэтгэлд нөлөөлдөг вэ?", href: "/mind/life/money-and-mind", group: "theory", artifact: LIFE_MONEY },
      { label: "Ажил ба орчин тархинд яаж нөлөөлдөг вэ?", href: "/mind/life/work-environment", group: "theory", artifact: LIFE_WORK },
      { label: "Шийдвэр гаргах яагаад ядраадаг вэ?", href: "/mind/life/decision-fatigue", group: "theory", artifact: LIFE_DECISION },
      { label: "Юуг нэг алхмаар хялбарчилж болох вэ?", href: "/mind/life/simplify", group: "theory", artifact: LIFE_SIMPLIFY },

      { label: "Санхүү апп", href: "/mind/life/finance-app", group: "practice" },
    ],
  },
];
