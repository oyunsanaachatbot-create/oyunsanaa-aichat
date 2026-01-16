// config/menus.ts
console.log("### DOCUMENT ROUTE HIT: app/(chat)/api/document/route.ts ###");
return Response.json([{ id: "probe", title: "probe", content: "probe" }], { status: 200 });

import {
  Sparkles,
  Brain,
  HeartHandshake,
  Target,
  HeartPulse,
  Coffee,
} from "lucide-react";

/* ----------------
   2 group only
   NOTE:
   - Sidebar renderer ихэнхдээ "apps" гэж хайдаг тул "practice" биш "apps" хэрэглэнэ.
----------------- */
export type MenuItemGroup = "theory" | "apps";

/**
 * Menu item:
 * - theory: href нь slug маягаар (route биш) байхаар тохирууллаа
 * - apps: href нь route ("/...") хэвээр
 */
export interface MenuItem {
  label: string;
  href: string;
  group: MenuItemGroup;
  artifact?: {
    title: string;
    content: string;

    // Зарим artifact viewer "markdown" / "body" гэх талбар уншдаг байдаг.
    // Тиймээс content-оо давхар mirror хийж өгнө.
    markdown?: string;
    body?: string;
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

/* ---------------------------
   Artifact normalize helper
   (content нь хоосон харагдах асуудлыг багасгана)
---------------------------- */
function asArtifact(a: any): MenuItem["artifact"] {
  const title = a?.title ?? a?.name ?? a?.label ?? "";
  const content =
    a?.content ?? a?.markdown ?? a?.body ?? a?.text ?? a?.md ?? "";

  return {
    title,
    content,
    markdown: content,
    body: content,
  };
}

/* ---------------------------
   MENUS
---------------------------- */
export const MENUS: MenuConfig[] = [
  {
    id: "emotion",
    label: "Сэтгэл санаа",
    icon: Sparkles,
    items: [
      // 📘 Онол (artifact) — href: slug маягаар (route БИШ)
      {
        label: "Одоо би юу мэдэрч байна вэ?",
        href: "emotion/feel-now",
        group: "theory",
        artifact: asArtifact(EMO_FEEL_NOW),
      },
      {
        label: "Мэдрэмж хаанаас үүсдэг вэ?",
        href: "emotion/origin",
        group: "theory",
        artifact: asArtifact(EMO_ORIGIN),
      },
      {
        label: "Бодол → хариу үйлдэл яаж үүсдэг вэ?",
        href: "emotion/thought-reaction",
        group: "theory",
        artifact: asArtifact(EMO_THOUGHT_REACTION),
      },
      {
        label: "Хэтрүүлж бодох хэв маяг гэж юу вэ?",
        href: "emotion/overthinking",
        group: "theory",
        artifact: asArtifact(EMO_OVERTHINKING),
      },
      {
        label: "Стресс бие дээр яаж илэрдэг вэ?",
        href: "emotion/stress-body",
        group: "theory",
        artifact: asArtifact(EMO_STRESS_BODY),
      },
      {
        label: "Тайвшрах чадвар гэж юу вэ?",
        href: "emotion/calm-skill",
        group: "theory",
        artifact: asArtifact(EMO_CALM_SKILL),
      },

      // 🛠 Хэрэгжүүлэлт (apps) — href: route хэвээр
      {
        label: "Өдрийн сэтгэл санааны тест (check)",
        href: "/mind/emotion/control/daily-check",
        group: "apps",
      },
      {
        label: "Стресс ажиглах тэмдэглэл",
        href: "/mind/emotion/control/progress",
        group: "apps",
      },
    ],
  },

  {
    id: "self",
    label: "Өөрийгөө ойлгох",
    icon: Brain,
    items: [
      {
        label: "Би хэн бэ?",
        href: "self/who-am-i",
        group: "theory",
        artifact: asArtifact(SELF_WHO_AM_I),
      },
      {
        label: "Надад юу хамгийн чухал вэ?",
        href: "self/what-matters",
        group: "theory",
        artifact: asArtifact(SELF_WHAT_MATTERS),
      },
      {
        label: "Миний зан чанар ямар вэ?",
        href: "self/personality",
        group: "theory",
        artifact: asArtifact(SELF_PERSONALITY),
      },
      {
        label: "Намайг дотроос юу хөдөлгөдөг вэ?",
        href: "self/what-moves-me",
        group: "theory",
        artifact: asArtifact(SELF_WHAT_MOVES_ME),
      },
      {
        label: "Итгэл үнэмшил яаж бий болдог вэ?",
        href: "self/beliefs",
        group: "theory",
        artifact: asArtifact(SELF_BELIEFS),
      },
      {
        label: "Өөрийн үнэ цэнэ гэж юу вэ?",
        href: "self/self-worth",
        group: "theory",
        artifact: asArtifact(SELF_SELF_WORTH),
      },

      {
        label: "Миний ертөнц - тэмдэглэл апп",
        href: "/mind/ebooks",
        group: "apps",
      },
    ],
  },

  {
    id: "relations",
    label: "Харилцаа",
    icon: HeartHandshake,
    items: [
      {
        label: "Харилцаа яагаад хүндрэлтэй болдог вэ?",
        href: "relations/why-hard",
        group: "theory",
        artifact: asArtifact(REL_WHY_HARD),
      },
      {
        label: "Харилцааны суурь чадвар гэж юу вэ?",
        href: "relations/foundation-skills",
        group: "theory",
        artifact: asArtifact(REL_FOUNDATION),
      },
      {
        label: "Өөрийгөө илэрхийлэх гэж юу вэ?",
        href: "relations/self-expression",
        group: "theory",
        artifact: asArtifact(REL_SELF_EXPRESSION),
      },
      {
        label: "Эмпати гэж юу вэ?",
        href: "relations/empathy",
        group: "theory",
        artifact: asArtifact(REL_EMPATHY),
      },
      {
        label: "Сонсох ур чадвар яагаад чухал вэ?",
        href: "relations/listening",
        group: "theory",
        artifact: asArtifact(REL_LISTENING),
      },
      {
        label: "Хил хязгаар тогтоох гэж юу вэ?",
        href: "relations/boundaries",
        group: "theory",
        artifact: asArtifact(REL_BOUNDARIES),
      },
      {
        label: "Эрүүл бус харилцааг яаж таних вэ?",
        href: "relations/unhealthy-signs",
        group: "theory",
        artifact: asArtifact(REL_TOXIC),
      },
      {
        label: "Маргааныг эрүүл шийдэх гэж юу вэ?",
        href: "relations/healthy-conflict",
        group: "theory",
        artifact: asArtifact(REL_CONFLICT),
      },

      {
        label: "Харилцааны өөрийн хэв маяг",
        href: "/mind/relations/foundation",
        group: "apps",
      },
      {
        label: "Хил хязгаарын дасгал",
        href: "/mind/relations/report",
        group: "apps",
      },
    ],
  },

  {
    id: "purpose",
    label: "Зорилго, утга учир",
    icon: Target,
    items: [
      {
        label: "Товч ойлгоё",
        href: "purpose/quick-understand",
        group: "theory",
        artifact: asArtifact(PUR_QUICK),
      },
      {
        label: "Амьдралд утга учир гэж юу вэ?",
        href: "purpose/meaning",
        group: "theory",
        artifact: asArtifact(PUR_MEANING),
      },
      {
        label: "Миний амьдралын том зураг",
        href: "purpose/big-picture",
        group: "theory",
        artifact: asArtifact(PUR_BIG_PICTURE),
      },
      {
        label: "Хүсэл мөрөөдөл ба бодит байдал",
        href: "purpose/dreams-vs-reality",
        group: "theory",
        artifact: asArtifact(PUR_DREAMS),
      },
      {
        label: "Зорилго яагаад урам өгдөг вэ?",
        href: "purpose/goals-motivate",
        group: "theory",
        artifact: asArtifact(PUR_GOALS),
      },
      {
        label: "Өсөлт, өөрчлөлт гэж юу вэ?",
        href: "purpose/growth-change",
        group: "theory",
        artifact: asArtifact(PUR_GROWTH),
      },

      {
        label: "Зорилго төлөвлөгөө апп",
        href: "/mind/purpose/planning",
        group: "apps",
      },
      {
        label: "🧩 Oyunsanaa цэгцлэх",
        href: "/mind/purpose/organize",
        group: "apps",
      },
      {
        label: "📅 7 хоногийн жижиг алхам",
        href: "/mind/purpose/weekly-steps",
        group: "apps",
      },
    ],
  },

  {
    id: "selfCare",
    label: "Өөрийгөө хайрлах",
    icon: HeartPulse,
    items: [
      {
        label: "Өөрийгөө хайрлах гэж юу вэ?",
        href: "self-care/self-love",
        group: "theory",
        artifact: asArtifact(CARE_SELF_LOVE),
      },
      {
        label: "Дотоод шүүмжлэл хаанаас гардаг вэ?",
        href: "self-care/inner-critic",
        group: "theory",
        artifact: asArtifact(CARE_INNER_CRITIC),
      },
      {
        label: "Өөртэйгөө энэрэнгүй харьцах",
        href: "self-care/self-compassion",
        group: "theory",
        artifact: asArtifact(CARE_COMPASSION),
      },
      {
        label: "Стресс ба ядаргаа яагаад хуримтлагддаг вэ?",
        href: "self-care/stress-fatigue",
        group: "theory",
        artifact: asArtifact(CARE_FATIGUE),
      },
      {
        label: "Нойр, эрч хүч яагаад чухал вэ?",
        href: "self-care/sleep-energy",
        group: "theory",
        artifact: asArtifact(CARE_SLEEP),
      },

      {
        label: "Эрүүл мэнд апп",
        href: "/mind/self-care/stress",
        group: "apps",
      },
      {
        label: "Хооллолтын ажиглалт",
        href: "/mind/self-care/nutrition",
        group: "apps",
      },
    ],
  },

  {
    id: "life",
    label: "Тогтвортой байдал",
    icon: Coffee,
    items: [
      {
        label: "Тогтвортой амьдрал гэж юу вэ?",
        href: "life/stable-life",
        group: "theory",
        artifact: asArtifact(LIFE_STABLE),
      },
      {
        label: "Стресс хаанаас үүсдэг вэ?",
        href: "life/stress-sources",
        group: "theory",
        artifact: asArtifact(LIFE_STRESS),
      },
      {
        label: "Мөнгө яагаад сэтгэлд нөлөөлдөг вэ?",
        href: "life/money-and-mind",
        group: "theory",
        artifact: asArtifact(LIFE_MONEY),
      },
      {
        label: "Ажил ба орчин тархинд яаж нөлөөлдөг вэ?",
        href: "life/work-environment",
        group: "theory",
        artifact: asArtifact(LIFE_WORK),
      },
      {
        label: "Шийдвэр гаргах яагаад ядраадаг вэ?",
        href: "life/decision-fatigue",
        group: "theory",
        artifact: asArtifact(LIFE_DECISION),
      },
      {
        label: "Юуг нэг алхмаар хялбарчилж болох вэ?",
        href: "life/simplify",
        group: "theory",
        artifact: asArtifact(LIFE_SIMPLIFY),
      },

      {
        label: "Санхүү апп",
        href: "/mind/life/finance-app",
        group: "apps",
      },
    ],
  },
];
