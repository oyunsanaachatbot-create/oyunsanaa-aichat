import type { TestDefinition, TestOption, TestOptionValue } from "../types";

const OPTIONS: TestOption[] = [
  // ✅ сайн нь дээр: UI дээр "Бараг үргэлж" хамгийн дээр харагдана
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

export const empathy: TestDefinition = {
  id: "empathy",
  slug: "empathy",
  title: "Өрөвдөх сэтгэл / Энэрэл тест",
  subtitle: "10 асуулт · харилцаа",
  description:
    "Бусдын мэдрэмжийг хүлээн зөвшөөрөх, ойлгох, зөөлнөөр хариулах хэв маяг хэр байна гэдгийг ерөнхийд нь харуулна.",
  i18n: {
    en: {
      title: "Empathy / Compassion Test",
      subtitle: "10 questions · relationships",
      description: "Shows your general style of accepting, understanding, and gently responding to others' feelings.",
    },
    ja: {
      title: "共感・思いやりテスト",
      subtitle: "10問・人間関係",
      description: "他人の気持ちを受け入れ、理解し、優しく応答するスタイルを全体的に示します。",
    },
    ko: {
      title: "공감 / 연민 테스트",
      subtitle: "10문항 · 관계",
      description: "다른 사람의 감정을 받아들이고, 이해하고, 부드럽게 반응하는 스타일을 전반적으로 보여줍니다.",
    },
  },
  questions: [
    {
      id: "q1",
      text: 'Нөгөө хүний мэдрэмжийг “зөв/буруу” гэж шүүхээсээ өмнө хүлээн зөвшөөрдөг.',
      options: OPTIONS,
      i18n: {
        en: { text: "I accept the other person's feelings before judging them \"right/wrong.\"" },
        ja: { text: "相手の気持ちを「正しい/間違い」と判断する前に受け入れる。" },
        ko: { text: "상대방의 감정을 \"맞다/틀리다\"고 판단하기 전에 받아들인다." },
      },
    },
    {
      id: "q2",
      text: '“Чамд хэцүү байна” гэж хэлж дэмжиж чаддаг.',
      options: OPTIONS,
      i18n: {
        en: { text: "I can support someone by saying \"that must be hard for you.\"" },
        ja: { text: "「それは大変だね」と言って支えることができる。" },
        ko: { text: "\"힘들겠다\"고 말하며 지지할 수 있다." },
      },
    },
    {
      id: "q3",
      text: "Хэн нэгний оронд өөрийгөө тавьж бодох чадвартай.",
      options: OPTIONS,
      i18n: {
        en: { text: "I can put myself in someone else's shoes." },
        ja: { text: "誰かの立場に自分を置いて考えられる。" },
        ko: { text: "누군가의 입장에 나를 놓고 생각할 수 있다." },
      },
    },
    {
      id: "q4",
      text: "Хүмүүсийн сул талыг хармагцаа шүүмжлэх биш ойлгохыг оролддог.",
      options: OPTIONS,
      i18n: {
        en: { text: "When I see someone's weakness, I try to understand rather than judge." },
        ja: { text: "人の弱さを見た時、批判より理解しようとする。" },
        ko: { text: "다른 사람의 약점을 보면 비판보다 이해하려고 노력한다." },
      },
    },
    {
      id: "q5",
      text: "Стресс үед ч хүний яриаг үл тоохгүй байхыг хичээдэг.",
      options: OPTIONS,
      i18n: {
        en: { text: "Even under stress, I try not to dismiss what someone's saying." },
        ja: { text: "ストレスがある時でも、相手の話を無視しないようにする。" },
        ko: { text: "스트레스를 받아도 상대의 말을 무시하지 않으려 한다." },
      },
    },
    {
      id: "q6",
      text: "Нэг хүний баяр/гунигийг хамт мэдэрч чаддаг.",
      options: OPTIONS,
      i18n: {
        en: { text: "I can feel someone's joy or sorrow together with them." },
        ja: { text: "誰かの喜びや悲しみを一緒に感じられる。" },
        ko: { text: "누군가의 기쁨이나 슬픔을 함께 느낄 수 있다." },
      },
    },
    {
      id: "q7",
      text: "Уучлалт гуйх шаардлагатай үед бардамналаа давж чаддаг.",
      options: OPTIONS,
      i18n: {
        en: { text: "When an apology is needed, I can put my pride aside." },
        ja: { text: "謝罪が必要な時、自分のプライドを乗り越えられる。" },
        ko: { text: "사과가 필요할 때 자존심을 넘어설 수 있다." },
      },
    },
    {
      id: "q8",
      text: '“Би чамайг ойлгож байна” гэж бодитоор мэдрүүлж чаддаг.',
      options: OPTIONS,
      i18n: {
        en: { text: "I can genuinely make someone feel \"I understand you.\"" },
        ja: { text: "「あなたを理解している」と本当に感じさせられる。" },
        ko: { text: "\"나는 너를 이해해\"라고 진심으로 느끼게 할 수 있다." },
      },
    },
    {
      id: "q9",
      text: "Өөр хүнээс ялгаатай үзэл бодлыг тайван сонсож чаддаг.",
      options: OPTIONS,
      i18n: {
        en: { text: "I can calmly listen to opinions that differ from mine." },
        ja: { text: "自分と異なる意見を冷静に聞ける。" },
        ko: { text: "나와 다른 의견을 차분하게 들을 수 있다." },
      },
    },
    {
      id: "q10",
      text: 'Хэн нэгний алдааг “хүн юм чинь” гэж уучилж хардаг.',
      options: OPTIONS,
      i18n: {
        en: { text: "I forgive someone's mistake, thinking \"we're all human.\"" },
        ja: { text: "誰かの過ちを「人間だから」と許せる。" },
        ko: { text: "누군가의 실수를 \"사람이니까\"라며 용서한다." },
      },
    },
  ],
  bands: [
    {
      minPct: 0.9,
      title: "Гүн энэрэлтэй, ойлгодог",
      summary:
        "Чиний хариултуудаас харахад бусдын сэтгэл хөдлөлийг “шууд засах” гэж яарахын оронд эхлээд хүлээн зөвшөөрч, ойлгож сонсох тал илүү байна. Ийм хүнтэй хүмүүс тайвширч, хамгаалалт нь сулардаг. Чи хүнд хэцүү үед хажууд нь байж чаддаг, үгээрээ ч, байр сууриараа ч “дандаа шүүмжлэхгүй” гэдгээ мэдрүүлдэг төрлийн хүн байна. Гэхдээ энэ нь үргэлж амархан гэсэн үг биш — бусдын мэдрэмжийг их шингээдэг талтай байх магадлалтай. Ерөнхий дүр зураг: хүмүүс чамтай ярилцахаар ойлгогддог мэдрэмж авдаг.",
      tips: [],
      i18n: {
        en: {
          title: "Deeply compassionate, understanding",
          summary: "Your answers show that rather than rushing to \"fix\" others' emotions, you lean toward accepting and understanding first. People around someone like this relax and lower their defenses. You're the type who can be there for someone in hard times and, through words and stance alike, make them feel \"this person won't constantly judge me.\" But that doesn't mean it's always easy — you may absorb others' feelings quite a lot. Overall: people feel understood when talking with you.",
          tips: [],
        },
        ja: {
          title: "深い思いやり、理解力",
          summary: "あなたの回答からは、他人の感情を「すぐ修正しよう」と急ぐより先に受け入れ、理解して聞く面が強いことが分かります。このような人の周りでは人々が安心し、防御が緩みます。あなたは困難な時に寄り添うことができ、言葉でも姿勢でも「この人は決して批判しない」と感じさせるタイプです。ただ、それは常に簡単という意味ではなく、他人の感情をかなり多く吸収する面があるかもしれません。全体像：人々はあなたと話すと理解されたと感じます。",
          tips: [],
        },
        ko: {
          title: "깊은 연민과 이해심",
          summary: "당신의 답변을 보면 다른 사람의 감정을 \"바로 고치려\" 서두르기보다 먼저 받아들이고 이해하며 듣는 면이 강합니다. 이런 사람 주변에서는 사람들이 편안해지고 방어가 풀립니다. 당신은 힘든 시기에 곁에 있어줄 수 있고, 말로도 태도로도 \"이 사람은 늘 비판하지 않는다\"고 느끼게 하는 유형입니다. 하지만 이것이 항상 쉽다는 뜻은 아니며, 다른 사람의 감정을 꽤 많이 흡수하는 면이 있을 수 있습니다. 전반적으로 사람들은 당신과 이야기하면 이해받았다고 느낍니다.",
          tips: [],
        },
      },
    },
    {
      minPct: 0.78,
      title: "Энэрэнгүй, тогтвортой",
      summary:
        "Ерөнхийдөө энэрэнгүй хандлага сайн байна. Чи хүмүүсийг ойлгох гэж оролддог, дэмжиж хэлж чаддаг, хүнд үед нь “өрөвдөх” биш “ойлгох” тал давамгай. Зарим нөхцөлд (ядарсан, стресстэй, хугацаа шахсан үед) анхаарал жоохон хумигдаж, тэвчээр багасах үе гарч магадгүй ч нийт дүнгээрээ чи дулаан харилцаа барьж чаддаг хэв маягтай. Энэ бол харилцаанд итгэл төрүүлдэг суурь.",
      tips: [],
      i18n: {
        en: {
          title: "Compassionate, stable",
          summary: "Overall your compassionate attitude is good. You try to understand people, can offer support, and lean toward \"understanding\" rather than \"pity\" in hard times. In some conditions (tired, stressed, time-pressed) attention may narrow and patience may shrink, but overall you have a style that keeps relationships warm. This is a foundation that builds trust.",
          tips: [],
        },
        ja: {
          title: "思いやりがあり、安定している",
          summary: "全体的に思いやりのある態度は良好です。あなたは人を理解しようとし、支えとなる言葉をかけられ、困難な時には「同情」より「理解」を優先する傾向があります。一部の状況（疲れている、ストレスがある、時間に追われている時）では注意が狭まり忍耐が減ることがあるかもしれませんが、全体的には関係を温かく保てるスタイルです。これは信頼を生む基盤です。",
          tips: [],
        },
        ko: {
          title: "연민이 있고 안정적임",
          summary: "전반적으로 연민 어린 태도가 좋습니다. 당신은 사람을 이해하려 노력하고, 지지하는 말을 할 수 있으며, 힘든 시기에는 \"동정\"보다 \"이해\"를 우선시하는 경향이 있습니다. 일부 상황(피곤하거나, 스트레스를 받거나, 시간에 쫓길 때)에서는 주의가 좁아지고 인내심이 줄 수 있지만, 전반적으로 관계를 따뜻하게 유지하는 스타일입니다. 이는 신뢰를 만드는 토대입니다.",
          tips: [],
        },
      },
    },
    {
      minPct: 0.6,
      title: "Холимог — ойлгодог ч заримдаа хаагддаг",
      summary:
        "Чи зарим үед сайн ойлгодог, зарим үед өөрийгөө хамгаалах маягаар хаагдах хандлага байна. Ихэвчлэн энэ нь “муу хүн” гэсэн утга биш — зүгээр л тэвчээр/энерги хүрэхгүй үед хүнийг сонсох чадвар буурдаг нийтлэг зураг. Чиний дотор сэтгэлтэй хандах хүсэл байгаа ч бодит амьдрал дээр хурдтай, ядаргаатай үед “түргэн дүгнэх”, “тэвчээргүй болох” хэсэг илэрч болохоор байна. Ерөнхий дүр зураг: боломжийн, гэхдээ тогтвортой дулаан байдал нь нөхцлөөс их хамаардаг.",
      tips: [],
      i18n: {
        en: {
          title: "Mixed — understands, but sometimes shuts down",
          summary: "At times you understand well, but at other times you tend to close off defensively. This usually doesn't mean \"bad person\" — it's a common pattern where listening capacity drops when patience/energy runs low. You have a genuine wish to be caring, but in fast-paced, exhausting moments \"jumping to conclusions\" or \"running out of patience\" may show up. Overall: decent, but consistent warmth depends heavily on circumstances.",
          tips: [],
        },
        ja: {
          title: "混在 — 理解するが時々閉じこもる",
          summary: "あなたは時々よく理解しますが、別の時には防御的に閉じこもる傾向があります。これはたいてい「悪い人」という意味ではなく、忍耐や energy が足りない時に聞く力が落ちる一般的なパターンです。あなたの中には思いやりを持って接したい気持ちがありますが、実生活で速く疲れている時に「すぐ結論を出す」「忍耐がなくなる」面が現れることがあります。全体像：まずまずですが、一貫した温かさは状況に大きく左右されます。",
          tips: [],
        },
        ko: {
          title: "혼합 — 이해하지만 때때로 닫혀버림",
          summary: "당신은 때로는 잘 이해하지만, 다른 때에는 방어적으로 닫혀버리는 경향이 있습니다. 이는 보통 '나쁜 사람'이라는 의미가 아니라, 인내심이나 에너지가 부족할 때 듣는 능력이 떨어지는 흔한 패턴입니다. 당신 안에는 다정하게 대하고 싶은 마음이 있지만, 실제 생활에서 빠르고 지칠 때 '빨리 결론짓기', '인내심이 사라지기'가 나타날 수 있습니다. 전반적으로 괜찮지만, 일관된 따뜻함은 상황에 크게 좌우됩니다.",
          tips: [],
        },
      },
    },
    {
      minPct: 0.4,
      title: "Алсардаг — шүүх, хамгаалах тал давамгайрах үе их",
      summary:
        "Энд бол хүний мэдрэмжийг хүлээн зөвшөөрөхөөс илүү “зөв/буруу” гэж хэмжих, эсвэл хурдан хаах тал арай давамгай харагдаж байна. Заримдаа хүмүүсийн мэдрэмж чамд “хэт их” санагдаж, тэгээд өөрийнхөөрөө хамгаалалт хийж магадгүй. Ийм үед нөгөө хүн ойлгогдоогүй мэт мэдрэмж авдаг. Энэ нь муу санаа биш — ихэнхдээ ядрал, стресстэй үед, эсвэл өөрийн асуудал давхар явж байгаа үед ингэж илэрдэг зураг байдаг.",
      tips: [],
      i18n: {
        en: {
          title: "Distant — judging/defensive mode often dominates",
          summary: "Here, measuring feelings as \"right/wrong\" or shutting down quickly tends to dominate over accepting them. At times others' feelings may seem \"too much\" to you, prompting your own defenses. In response, the other person ends up feeling misunderstood. This isn't ill intent — it's a pattern that often shows up during exhaustion, stress, or when you're dealing with your own overlapping problems.",
          tips: [],
        },
        ja: {
          title: "距離がある — 判断・防御が優勢な時が多い",
          summary: "ここでは気持ちを受け入れるより「正しい/間違い」で測る、あるいは早く閉じる面がやや優勢に見られます。時々、人の感情が「重すぎる」と感じ、自分の防御を働かせてしまうかもしれません。このような時、相手は理解されなかったと感じてしまいます。これは悪意ではなく、たいてい疲労、ストレスの時、あるいは自分の問題が重なっている時に現れるパターンです。",
          tips: [],
        },
        ko: {
          title: "거리감 — 판단/방어 모드가 우세한 경우가 많음",
          summary: "여기서는 감정을 받아들이기보다 '맞다/틀리다'로 재거나 빨리 닫아버리는 면이 다소 우세하게 보입니다. 때때로 다른 사람의 감정이 '너무 많다'고 느껴져 자신의 방어가 작동할 수 있습니다. 이럴 때 상대방은 이해받지 못했다는 느낌을 받게 됩니다. 이것은 나쁜 의도가 아니라, 대개 피로하거나 스트레스를 받을 때, 또는 자신의 문제가 겹쳐 있을 때 나타나는 패턴입니다.",
          tips: [],
        },
      },
    },
    {
      minPct: 0.0,
      title: "Одоогоор энэрэл дарагдсан байдал",
      summary:
        "Одоогийн хариултуудаас харахад бусдын мэдрэмжийг ойлгох/хүлээн зөвшөөрөх тал түр хугацаанд сул, эсвэл дотроо “хаалттай” үе байж магадгүй. Хүнд яриа, сэтгэл хөдлөл ихтэй нөхцөлд тэсвэрлэх чадвар багассан, эсвэл өөрийгөө хамгаалах хэрэгцээ өндөр байгаа мэт зураг байна. Ийм үед хүн бусдын эмоцийг сонсохоос илүү “түргэн дуусгая”, “битгий иймэрхүү юм ярья” гэх байдлаар хариулах магадлал ихэсдэг. Ерөнхий дүр зураг: энэ бол чанарын дүгнэлт биш, одоогийн байдал/ачааллын тусгал байх боломж өндөр.",
      tips: [],
      i18n: {
        en: {
          title: "Compassion currently suppressed",
          summary: "Your current answers suggest your capacity to understand/accept others' feelings may be temporarily weak, or you may be in an inwardly \"closed off\" period. Tolerance for heavy conversations or strong emotions seems reduced, or your need to protect yourself seems heightened. At times like this, you're more likely to respond with \"let's just get this over with\" or \"let's not talk about this kind of thing\" rather than listening to others' emotions. Overall: this isn't a character verdict — it's very likely a reflection of your current state/load.",
          tips: [],
        },
        ja: {
          title: "現在、思いやりが抑え込まれている状態",
          summary: "現在の回答からは、他人の気持ちを理解し受け入れる力が一時的に弱まっている、あるいは内心「閉じている」時期かもしれません。重い話や強い感情への耐性が低下している、あるいは自分を守る必要性が高まっているように見えます。このような時、人は他人の感情を聞くより「早く終わらせよう」「こういう話はしないようにしよう」と応答する可能性が高まります。全体像：これは性格の判定ではなく、現在の状態や負担の反映である可能性が高いです。",
          tips: [],
        },
        ko: {
          title: "현재 연민이 억눌린 상태",
          summary: "현재 답변을 보면 다른 사람의 감정을 이해하고 받아들이는 능력이 일시적으로 약해졌거나, 내면적으로 '닫혀 있는' 시기일 수 있습니다. 무거운 이야기나 강한 감정에 대한 인내력이 낮아졌거나, 자신을 보호해야 할 필요가 높아진 것처럼 보입니다. 이런 시기에는 다른 사람의 감정을 듣기보다 '빨리 끝내자', '이런 이야기는 하지 말자'는 방식으로 반응할 가능성이 높아집니다. 전반적으로 이것은 성격에 대한 판단이 아니라, 현재 상태/부담을 반영하는 것일 가능성이 높습니다.",
          tips: [],
        },
      },
    },
  ],
};
