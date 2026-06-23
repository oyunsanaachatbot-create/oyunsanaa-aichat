import type { TestDefinition, TestOption, TestOptionValue } from "../types";

const OPTIONS: TestOption[] = [
  // ✅ сайн нь дээр (UI дээр хамгийн дээр)
  {
    value: 5 as TestOptionValue,
    label: "Бараг үргэлж",
    i18n: { en: { label: "Almost always" }, ja: { label: "ほぼ常に" }, ko: { label: "거의 항상" } },
  },
  {
    value: 4 as TestOptionValue,
    label: "Ихэнхдээ",
    i18n: { en: { label: "Mostly" }, ja: { label: "ほとんどの場合" }, ko: { label: "대부분" } },
  },
  {
    value: 3 as TestOptionValue,
    label: "Заримдаа",
    i18n: { en: { label: "Sometimes" }, ja: { label: "時々" }, ko: { label: "때때로" } },
  },
  {
    value: 2 as TestOptionValue,
    label: "Ховор",
    i18n: { en: { label: "Rarely" }, ja: { label: "稀に" }, ko: { label: "드물게" } },
  },
  {
    value: 1 as TestOptionValue,
    label: "Огт үгүй",
    i18n: { en: { label: "Not at all" }, ja: { label: "全くない" }, ko: { label: "전혀 아니다" } },
  },
];

export const boundaries: TestDefinition = {
  id: "boundaries",
  slug: "boundaries",
  title: "Хил хязгаар тогтоох тест",
  subtitle: "10 асуулт · харилцаа",
  description:
    "Өөрийн хэрэгцээ, орон зай, цагийг хамгаалах чадвар хэр байна гэдгийг ерөнхийд нь харуулна.",
  i18n: {
    en: {
      title: "Boundary-Setting Test",
      subtitle: "10 questions · relationships",
      description:
        "Gives a general picture of how well you protect your own needs, space, and time.",
    },
    ja: {
      title: "境界線設定テスト",
      subtitle: "10問・人間関係",
      description: "自分のニーズ、空間、時間をどれだけ守れているかの全体像を示します。",
    },
    ko: {
      title: "경계 설정 테스트",
      subtitle: "10문항 · 관계",
      description: "자신의 필요, 공간, 시간을 얼마나 잘 지키는지에 대한 전반적인 그림을 보여줍니다.",
    },
  },
  questions: [
    {
      id: "q1",
      text: "Дургүй зүйлдээ “үгүй” гэж хэлж чаддаг.",
      options: OPTIONS,
      i18n: {
        en: { text: "I can say \"no\" to things I don't want." },
        ja: { text: "嫌なことには「いや」と言える。" },
        ko: { text: "싫은 일에는 \"아니\"라고 말할 수 있다." },
      },
    },
    {
      id: "q2",
      text: "Өөрийн хэрэгцээгээ буруутгалгүйгээр илэрхийлдэг.",
      options: OPTIONS,
      i18n: {
        en: { text: "I express my needs without feeling guilty." },
        ja: { text: "罪悪感なく自分のニーズを表現できる。" },
        ko: { text: "죄책감 없이 자신의 필요를 표현한다." },
      },
    },
    {
      id: "q3",
      text: "Хэт их ачаалал авах үедээ зогсож чаддаг.",
      options: OPTIONS,
      i18n: {
        en: { text: "I can stop myself from taking on too much." },
        ja: { text: "負担を抱え過ぎそうなときに止められる。" },
        ko: { text: "너무 많은 부담을 질 때 멈출 수 있다." },
      },
    },
    {
      id: "q4",
      text: "Хэн нэгэн хүндлэлгүй харьцахад зөөлөн боловч тодорхой хэлдэг.",
      options: OPTIONS,
      i18n: {
        en: { text: "When someone is disrespectful, I speak up gently but clearly." },
        ja: { text: "誰かが失礼な態度をとったとき、柔らかくも明確に伝える。" },
        ko: { text: "누군가 무례하게 대하면 부드럽지만 분명하게 말한다." },
      },
    },
    {
      id: "q5",
      text: "“Надад бодох хугацаа хэрэгтэй” гэж хэлж чаддаг.",
      options: OPTIONS,
      i18n: {
        en: { text: "I can say \"I need time to think.\"" },
        ja: { text: "「考える時間が必要」と言える。" },
        ko: { text: "\"생각할 시간이 필요해\"라고 말할 수 있다." },
      },
    },
    {
      id: "q6",
      text: "Хувийн орон зай/цагийг хамгаалж чаддаг.",
      options: OPTIONS,
      i18n: {
        en: { text: "I protect my personal space and time." },
        ja: { text: "自分の空間や時間を守ることができる。" },
        ko: { text: "나만의 공간과 시간을 지킬 수 있다." },
      },
    },
    {
      id: "q7",
      text: "Гэмшил/айдаснаасаа болоод зөвшөөрөөд байдаггүй.",
      options: OPTIONS,
      i18n: {
        en: { text: "I don't agree to things out of guilt or fear." },
        ja: { text: "罪悪感や恐れから安易に同意しない。" },
        ko: { text: "죄책감이나 두려움 때문에 무작정 동의하지 않는다." },
      },
    },
    {
      id: "q8",
      text: "Хүмүүсийн асуудлыг өөр дээрээ үүрээд байдаггүй.",
      options: OPTIONS,
      i18n: {
        en: { text: "I don't take on other people's problems as my own." },
        ja: { text: "他人の問題を自分のものとして抱え込まない。" },
        ko: { text: "다른 사람의 문제를 내 것으로 짊어지지 않는다." },
      },
    },
    {
      id: "q9",
      text: "Дүрэм, тохиролцоогоо сануулж чаддаг.",
      options: OPTIONS,
      i18n: {
        en: { text: "I can remind others of my rules and agreements." },
        ja: { text: "自分のルールや約束を相手に伝え直すことができる。" },
        ko: { text: "자신의 규칙과 합의를 다시 상기시킬 수 있다." },
      },
    },
    {
      id: "q10",
      text: "Хилээ тогтоочихоод дараа нь буцаад эвгүйцээд өөрөө нураадаггүй.",
      options: OPTIONS,
      i18n: {
        en: { text: "After setting a boundary, I don't cave in later out of awkwardness." },
        ja: { text: "境界線を引いた後、気まずさから自分で崩してしまわない。" },
        ko: { text: "경계를 정한 후 어색함 때문에 스스로 무너뜨리지 않는다." },
      },
    },
  ],
  bands: [
    {
      minPct: 0.85,
      title: "Тодорхой хилтэй",
      summary:
        "Чи өөрийн хэрэгцээ, орон зайг ерөнхийдөө тодорхой мэдэрдэг бөгөөд хэлж чаддаг байна. “Гомдоох вий” гэж өөрийгөө байнга дарж явах биш, боломжийн хэмжээнд зөөлөн боловч тодорхой байр суурь барьж чаддаг төрлийн хүн шиг харагдаж байна. Ийм хилтэй хүнтэй харилцахад бусад нь ч бас дүрэмтэй болж, асуудал бага хуримтлагддаг.",
      tips: [],
      i18n: {
        en: {
          title: "Clear boundaries",
          summary:
            "You generally sense and can voice your needs and space clearly. Rather than constantly suppressing yourself out of fear of upsetting others, you seem like someone who holds a gentle but clear stance. People around someone with such boundaries tend to develop their own ground rules too, so fewer issues pile up.",
          tips: [],
        },
        ja: {
          title: "明確な境界線",
          summary:
            "あなたは自分のニーズや空間を概ね明確に感じ、伝えることができています。相手を傷つけることを恐れて常に自分を抑えるのではなく、柔らかくも明確な立場を保てるタイプのようです。このような境界線を持つ人と関わると、周囲もルールを意識するようになり、問題が積み重なりにくくなります。",
          tips: [],
        },
        ko: {
          title: "명확한 경계",
          summary:
            "당신은 대체로 자신의 필요와 공간을 명확히 느끼고 표현할 수 있습니다. 상대를 서운하게 할까 봐 항상 자신을 억누르기보다, 부드럽지만 분명한 입장을 지킬 수 있는 사람으로 보입니다. 이런 경계를 가진 사람과 관계를 맺으면 주변 사람들도 규칙을 지키게 되어 문제가 덜 쌓입니다.",
          tips: [],
        },
      },
    },
    {
      minPct: 0.65,
      title: "Холимог хил — заримдаа барьдаг, заримдаа алдана",
      summary:
        "Чи хааяа “үгүй” гэж хэлж чаддаг ч тодорхой нөхцөлд (ойр хүн, буруутай мэдрэмж, айдас, стресстэй үед) хил суларч магадгүй. Заримдаа дотроо дургүй байсаар байж зөвшөөрөөд, дараа нь бухимдал хуримтлах, эсвэл нэг өдөр гэнэт тэсэрч хэлэх хэлбэр гарч болохоор зураг байна. Ерөнхийдөө боломжийн ч тогтвортой байдал нь нөхцөлөөс хамаараад байна.",
      tips: [],
      i18n: {
        en: {
          title: "Mixed boundaries — sometimes hold, sometimes slip",
          summary:
            "You can say \"no\" sometimes, but your boundaries may weaken in certain situations (close people, guilt, fear, stress). At times you may agree while still disliking it inside, leading to built-up resentment or a sudden outburst one day. Overall it's reasonable, but consistency depends heavily on the situation.",
          tips: [],
        },
        ja: {
          title: "混在した境界線 — 守れる時と崩れる時がある",
          summary:
            "あなたは時々「いや」と言えますが、特定の状況（親しい人、罪悪感、恐れ、ストレス時）では境界線が弱まることがあるようです。内心では嫌だと思いながら同意してしまい、後で不満が積み重なったり、ある日突然爆発したりする傾向が見られます。全体的には妥当ですが、一貫性は状況に大きく左右されます。",
          tips: [],
        },
        ko: {
          title: "혼합된 경계 — 때로는 지키고 때로는 무너짐",
          summary:
            "당신은 때때로 \"아니\"라고 말할 수 있지만, 특정 상황(가까운 사람, 죄책감, 두려움, 스트레스)에서는 경계가 약해질 수 있습니다. 속으로는 싫으면서도 동의해버려 나중에 불만이 쌓이거나, 어느 날 갑자기 터져버리는 패턴이 보입니다. 전반적으로는 괜찮지만, 일관성은 상황에 크게 좌우됩니다.",
          tips: [],
        },
      },
    },
    {
      minPct: 0.0,
      title: "Хил сул — өөрийгөө алдах эрсдэлтэй",
      summary:
        "Одоогийн хариултуудаас харахад хил тогтоох нь чамд хэцүү талдаа байж магадгүй. Дургүй байсан ч зөвшөөрөх, өөрийн цаг/хэрэгцээг хойш тавих, дараа нь дотроо бухимдах зураг илүү тод байна. Энэ нь “сул” гэсэн үг биш — ихэнхдээ хүмүүст таалагдах хэрэгцээ, зөрчилдөөнөөс зугтах, эсвэл олон ачаалал зэрэгцсэн үед ингэж илэрдэг. Гэхдээ ийм үед хамгийн их хохирох нь өөрөө болдог (ядаргаа, бухимдал, тэсрэлт).",
      tips: [],
      i18n: {
        en: {
          title: "Weak boundaries — risk of losing yourself",
          summary:
            "Your answers suggest setting boundaries may be genuinely hard for you right now. Agreeing even when you dislike something, putting your own time/needs aside, then feeling resentful inside is the clearer pattern. This isn't \"weakness\" — it usually comes from a need to please others, avoiding conflict, or facing too many demands at once. But in this pattern, you tend to be the one who suffers most (exhaustion, frustration, eventual blow-up).",
          tips: [],
        },
        ja: {
          title: "弱い境界線 — 自分を失うリスク",
          summary:
            "現在の回答からは、境界線を引くことが今のあなたにとって本当に難しいことが伺えます。嫌でも同意してしまい、自分の時間やニーズを後回しにし、後で内心で不満を募らせるという傾向がより明確です。これは「弱さ」ではなく、多くの場合人に好かれたい気持ち、対立を避けたい気持ち、あるいは複数の負担が重なったことから生じます。しかし、このパターンでは最も傷つくのは結局自分自身です（疲弊、不満、爆発）。",
          tips: [],
        },
        ko: {
          title: "약한 경계 — 자신을 잃을 위험",
          summary:
            "현재 답변을 보면 경계를 설정하는 것이 지금 당신에게 정말 어려운 부분일 수 있습니다. 싫어도 동의하고, 자신의 시간과 필요를 뒤로 미루고, 나중에 속으로 불만을 쌓는 패턴이 더 뚜렷합니다. 이것은 \"약함\"이 아니라, 대개 사람들에게 좋게 보이고 싶은 마음, 갈등을 피하려는 마음, 또는 여러 부담이 겹쳤을 때 나타납니다. 하지만 이런 패턴에서는 결국 가장 힘들어지는 사람이 자기 자신입니다 (탈진, 불만, 폭발).",
          tips: [],
        },
      },
    },
  ],
};
