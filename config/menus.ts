import {
  Sparkles,
  Brain,
  HeartHandshake,
  Target,
  HeartPulse,
  Coffee,
} from "lucide-react";

// --- EMOTION (6) ---
import { artifact as EmotionFeelNow } from "@/content/mind/emotion/feel-now";
import { artifact as EmotionOrigin } from "@/content/mind/emotion/origin";
import { artifact as EmotionThoughtReaction } from "@/content/mind/emotion/thought-reaction";
import { artifact as EmotionOverthinking } from "@/content/mind/emotion/overthinking";
import { artifact as EmotionStressBody } from "@/content/mind/emotion/stress-body";
import { artifact as EmotionCalmSkill } from "@/content/mind/emotion/calm-skill";

// --- SELF (6) ---
import { artifact as SelfWhoAmI } from "@/content/mind/self/who-am-i";
import { artifact as SelfWhatMatters } from "@/content/mind/self/what-matters";
import { artifact as SelfPersonality } from "@/content/mind/self/personality";
import { artifact as SelfWhatMovesMe } from "@/content/mind/self/what-moves-me";
import { artifact as SelfBeliefs } from "@/content/mind/self/beliefs";
import { artifact as SelfSelfWorth } from "@/content/mind/self/self-worth";

// --- RELATIONS (8) ---
import { artifact as RelWhyHard } from "@/content/mind/relations/why-hard";
import { artifact as RelFoundationSkills } from "@/content/mind/relations/foundation-skills";
import { artifact as RelSelfExpression } from "@/content/mind/relations/self-expression";
import { artifact as RelEmpathy } from "@/content/mind/relations/empathy";
import { artifact as RelListening } from "@/content/mind/relations/listening";
import { artifact as RelBoundaries } from "@/content/mind/relations/boundaries";
import { artifact as RelUnhealthySigns } from "@/content/mind/relations/unhealthy-signs";
import { artifact as RelHealthyConflict } from "@/content/mind/relations/healthy-conflict";

// --- PURPOSE (6) ---
import { artifact as PurposeQuickUnderstand } from "@/content/mind/purpose/quick-understand";
import { artifact as PurposeMeaning } from "@/content/mind/purpose/meaning";
import { artifact as PurposeBigPicture } from "@/content/mind/purpose/big-picture";
import { artifact as PurposeDreamsVsReality } from "@/content/mind/purpose/dreams-vs-reality";
import { artifact as PurposeGoalsMotivate } from "@/content/mind/purpose/goals-motivate";
import { artifact as PurposeGrowthChange } from "@/content/mind/purpose/growth-change";

// --- SELF-CARE (5) ---
import { artifact as CareSelfLove } from "@/content/mind/self-care/self-love";
import { artifact as CareInnerCritic } from "@/content/mind/self-care/inner-critic";
import { artifact as CareSelfCompassion } from "@/content/mind/self-care/self-compassion";
import { artifact as CareStressFatigue } from "@/content/mind/self-care/stress-fatigue";
import { artifact as CareSleepEnergy } from "@/content/mind/self-care/sleep-energy";

// --- LIFE (6) ---
import { artifact as LifeStableLife } from "@/content/mind/life/stable-life";
import { artifact as LifeStressSources } from "@/content/mind/life/stress-sources";
import { artifact as LifeMoneyAndMind } from "@/content/mind/life/money-and-mind";
import { artifact as LifeWorkEnvironment } from "@/content/mind/life/work-environment";
import { artifact as LifeDecisionFatigue } from "@/content/mind/life/decision-fatigue";
import { artifact as LifeSimplify } from "@/content/mind/life/simplify";

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
      { label: "Одоо би юу мэдэрч байна вэ?", href: "/mind/emotion/theory/feel-now", group: "theory", artifact: EmotionFeelNow },
      { label: "Мэдрэмж хаанаас үүсдэг вэ?", href: "/mind/emotion/theory/origin", group: "theory", artifact: EmotionOrigin },
      { label: "Бодол → хариу үйлдэл яаж үүсдэг вэ?", href: "/mind/emotion/theory/thought-reaction", group: "theory", artifact: EmotionThoughtReaction },
      { label: "Хэтрүүлж бодох хэв маяг гэж юу вэ?", href: "/mind/emotion/theory/overthinking", group: "theory", artifact: EmotionOverthinking },
      { label: "Стресс бие дээр яаж илэрдэг вэ?", href: "/mind/emotion/theory/stress-body", group: "theory", artifact: EmotionStressBody },
      { label: "Тайвшрах чадвар гэж юу вэ?", href: "/mind/emotion/theory/calm-skill", group: "theory", artifact: EmotionCalmSkill },

      { label: "Өдрийн сэтгэл санааны тест (check)", href: "/mind/emotion/control/daily-check", group: "apps" },
      { label: "Стресс ажиглах тэмдэглэл", href: "/mind/emotion/control/progress", group: "reports" },
    ],
  },

  {
    id: "self",
    label: "Өөрийгөө ойлгох",
    icon: Brain,
    items: [
      { label: "Би хэн бэ?", href: "/mind/self/theory/who-am-i", group: "theory", artifact: SelfWhoAmI },
      { label: "Надад юу хамгийн чухал вэ?", href: "/mind/self/theory/what-matters", group: "theory", artifact: SelfWhatMatters },
      { label: "Миний зан чанар ямар вэ?", href: "/mind/self/theory/personality", group: "theory", artifact: SelfPersonality },
      { label: "Намайг дотроос юу хөдөлгөдөг вэ?", href: "/mind/self/theory/what-moves-me", group: "theory", artifact: SelfWhatMovesMe },
      { label: "Итгэл үнэмшил яаж бий болдог вэ?", href: "/mind/self/theory/beliefs", group: "theory", artifact: SelfBeliefs },
      { label: "Өөрийн үнэ цэнэ гэж юу вэ?", href: "/mind/self/theory/self-worth", group: "theory", artifact: SelfSelfWorth },

      { label: "Миний ертөнц · Тэмдэглэл апп", href: "/mind/ebooks", group: "apps" },
    ],
  },

  {
    id: "relations",
    label: "Харилцаа",
    icon: HeartHandshake,
    items: [
      { label: "Харилцаа яагаад хүндрэлтэй болдог вэ?", href: "/mind/relations/theory/why-hard", group: "theory", artifact: RelWhyHard },
      { label: "Харилцааны суурь чадвар гэж юу вэ?", href: "/mind/relations/theory/foundation-skills", group: "theory", artifact: RelFoundationSkills },
      { label: "Өөрийгөө илэрхийлэх гэж юу вэ?", href: "/mind/relations/theory/self-expression", group: "theory", artifact: RelSelfExpression },
      { label: "Эмпати гэж юу вэ?", href: "/mind/relations/theory/empathy", group: "theory", artifact: RelEmpathy },
      { label: "Сонсох ур чадвар яагаад чухал вэ?", href: "/mind/relations/theory/listening", group: "theory", artifact: RelListening },
      { label: "Хил хязгаар тогтоох гэж юу вэ?", href: "/mind/relations/theory/boundaries", group: "theory", artifact: RelBoundaries },
      { label: "Эрүүл бус харилцааг яаж таних вэ?", href: "/mind/relations/theory/unhealthy-signs", group: "theory", artifact: RelUnhealthySigns },
      { label: "Маргааныг эрүүл шийдэх гэж юу вэ?", href: "/mind/relations/theory/healthy-conflict", group: "theory", artifact: RelHealthyConflict },

      { label: "Харилцааны өөрийн хэв маяг", href: "/mind/relations/foundation", group: "apps" },
      { label: "Хил хязгаарын дасгал", href: "/mind/relations/report", group: "apps" },
      { label: "Харилцааны ажиглалт", href: "/mind/relations/report", group: "reports" },
    ],
  },

  {
    id: "purpose",
    label: "Зорилго, утга учир",
    icon: Target,
    items: [
      { label: "Товч ойлгоё", href: "/mind/purpose/theory/quick-understand", group: "theory", artifact: PurposeQuickUnderstand },
      { label: "Амьдралд утга учир гэж юу вэ?", href: "/mind/purpose/theory/meaning", group: "theory", artifact: PurposeMeaning },
      { label: "Миний амьдралын том зураг", href: "/mind/purpose/theory/big-picture", group: "theory", artifact: PurposeBigPicture },
      { label: "Хүсэл мөрөөдөл ба бодит байдал", href: "/mind/purpose/theory/dreams-vs-reality", group: "theory", artifact: PurposeDreamsVsReality },
      { label: "Зорилго яагаад урам өгдөг вэ?", href: "/mind/purpose/theory/goals-motivate", group: "theory", artifact: PurposeGoalsMotivate },
      { label: "Өсөлт, өөрчлөлт гэж юу вэ?", href: "/mind/purpose/theory/growth-change", group: "theory", artifact: PurposeGrowthChange },

      { label: "Зорилго төлөвлөгөө апп", href: "/mind/purpose/planning", group: "apps" },
    ],
  },

  {
    id: "selfCare",
    label: "Өөрийгөө хайрлах",
    icon: HeartPulse,
    items: [
      { label: "Өөрийгөө хайрлах гэж юу вэ?", href: "/mind/self-care/theory/self-love", group: "theory", artifact: CareSelfLove },
      { label: "Дотоод шүүмжлэл хаанаас гардаг вэ?", href: "/mind/self-care/theory/inner-critic", group: "theory", artifact: CareInnerCritic },
      { label: "Өөртэйгөө энэрэнгүй харьцах", href: "/mind/self-care/theory/self-compassion", group: "theory", artifact: CareSelfCompassion },
      { label: "Стресс ба ядаргаа яагаад хуримтлагддаг вэ?", href: "/mind/self-care/theory/stress-fatigue", group: "theory", artifact: CareStressFatigue },
      { label: "Нойр, эрч хүч яагаад чухал вэ?", href: "/mind/self-care/theory/sleep-energy", group: "theory", artifact: CareSleepEnergy },

      { label: "Эрүүл мэнд апп", href: "/mind/self-care/stress", group: "apps" },
      { label: "Хооллолтын ажиглалт", href: "/mind/self-care/report", group: "reports" },
    ],
  },

  {
    id: "life",
    label: "Тогтвортой байдал",
    icon: Coffee,
    items: [
      { label: "Тогтвортой амьдрал гэж юу вэ?", href: "/mind/life/theory/stable-life", group: "theory", artifact: LifeStableLife },
      { label: "Стресс хаанаас үүсдэг вэ?", href: "/mind/life/theory/stress-sources", group: "theory", artifact: LifeStressSources },
      { label: "Мөнгө яагаад сэтгэлд нөлөөлдөг вэ?", href: "/mind/life/theory/money-and-mind", group: "theory", artifact: LifeMoneyAndMind },
      { label: "Ажил ба орчин тархинд яаж нөлөөлдөг вэ?", href: "/mind/life/theory/work-environment", group: "theory", artifact: LifeWorkEnvironment },
      { label: "Шийдвэр гаргах яагаад ядраадаг вэ?", href: "/mind/life/theory/decision-fatigue", group: "theory", artifact: LifeDecisionFatigue },
      { label: "Юуг нэг алхмаар хялбарчилж болох вэ?", href: "/mind/life/theory/simplify", group: "theory", artifact: LifeSimplify },

      { label: "Санхүү апп", href: "/mind/life/finance-app", group: "apps" },
      { label: "Тайлан", href: "/mind/life/report", group: "reports" },
    ],
  },
];
