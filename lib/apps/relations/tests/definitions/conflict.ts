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

export const conflict: TestDefinition = {
  id: "conflict",
  slug: "conflict",
  title: "Маргаан шийдэх ур чадвар тест",
  subtitle: "10 асуулт · харилцаа",
  description:
    "Маргаанд тайван, шийдэл чиглэсэн байдлаар харилцах чадвар хэр байна гэдгийг ерөнхийд нь харуулна.",
  i18n: {
    en: {
      title: "Conflict Resolution Skills Test",
      subtitle: "10 questions · relationships",
      description: "Shows your general ability to stay calm and solution-focused during conflict.",
    },
    ja: {
      title: "対立解決スキルテスト",
      subtitle: "10問・人間関係",
      description: "対立の際に冷静で解決志向な対応ができるかどうかを全体的に示します。",
    },
    ko: {
      title: "갈등 해결 능력 테스트",
      subtitle: "10문항 · 관계",
      description: "갈등 상황에서 차분하고 해결 중심적으로 대응할 수 있는지 전반적으로 보여줍니다.",
    },
  },
  questions: [
    {
      id: "q1",
      text: "Маргаан эхлэхэд “чи дандаа…” гэхийн оронд тодорхой үйлдлийг ярьдаг.",
      options: OPTIONS,
      i18n: {
        en: { text: "When an argument starts, I talk about specific actions instead of \"you always...\"" },
        ja: { text: "口論が始まると「あなたはいつも…」ではなく具体的な行動について話す。" },
        ko: { text: "다툼이 시작되면 \"너는 항상...\" 대신 구체적인 행동을 이야기한다." },
      },
    },
    {
      id: "q2",
      text: "Дуугаа өндөрсгөхгүй байхыг хичээдэг.",
      options: OPTIONS,
      i18n: {
        en: { text: "I try not to raise my voice." },
        ja: { text: "声を荒げないようにする。" },
        ko: { text: "목소리를 높이지 않으려 노력한다." },
      },
    },
    {
      id: "q3",
      text: "“Ялах” биш “шийдэл хайх” байр суурь барьдаг.",
      options: OPTIONS,
      i18n: {
        en: { text: "I take the stance of \"finding a solution\" rather than \"winning.\"" },
        ja: { text: "「勝つ」より「解決策を探す」立場を取る。" },
        ko: { text: "\"이기는 것\"보다 \"해결책을 찾는\" 입장을 취한다." },
      },
    },
    {
      id: "q4",
      text: "Баримт ба мэдрэмжээ ялгаж хэлж чаддаг.",
      options: OPTIONS,
      i18n: {
        en: { text: "I can separate facts from feelings when I speak." },
        ja: { text: "事実と感情を分けて話せる。" },
        ko: { text: "사실과 감정을 구분해서 말할 수 있다." },
      },
    },
    {
      id: "q5",
      text: "Нөгөө хүний талыг үнэнээр нь хүлээн зөвшөөрч чаддаг.",
      options: OPTIONS,
      i18n: {
        en: { text: "I can genuinely acknowledge the other person's side." },
        ja: { text: "相手の立場を本当に認められる。" },
        ko: { text: "상대방의 입장을 진심으로 인정할 수 있다." },
      },
    },
    {
      id: "q6",
      text: "Түр завсарлага авч тайвширч чаддаг.",
      options: OPTIONS,
      i18n: {
        en: { text: "I can take a pause and calm down." },
        ja: { text: "一時休憩を取って落ち着くことができる。" },
        ko: { text: "잠시 멈추고 진정할 수 있다." },
      },
    },
    {
      id: "q7",
      text: "“Би ингэж мэдэрсэн” гэж буруутгалгүй илэрхийлдэг.",
      options: OPTIONS,
      i18n: {
        en: { text: "I express \"I felt this way\" without blaming." },
        ja: { text: "「私はこう感じた」と責めずに表現する。" },
        ko: { text: "\"나는 이렇게 느꼈어\"라고 비난 없이 표현한다." },
      },
    },
    {
      id: "q8",
      text: "Тохиролцоо хийж, дараа нь мөрддөг.",
      options: OPTIONS,
      i18n: {
        en: { text: "I make agreements and follow through on them." },
        ja: { text: "合意をし、その後守る。" },
        ko: { text: "합의를 하고 그 후에 지킨다." },
      },
    },
    {
      id: "q9",
      text: "Өнгөрснийг сөхөхгүйгээр одоо шийдлийг хайдаг.",
      options: OPTIONS,
      i18n: {
        en: { text: "I look for a solution now without digging up the past." },
        ja: { text: "過去を掘り返さず、今の解決策を探す。" },
        ko: { text: "과거를 들추지 않고 지금의 해결책을 찾는다." },
      },
    },
    {
      id: "q10",
      text: "Маргааны дараа харилцаагаа сэргээх алхам хийдэг.",
      options: OPTIONS,
      i18n: {
        en: { text: "After an argument, I take steps to restore the relationship." },
        ja: { text: "口論の後、関係を修復する行動をとる。" },
        ko: { text: "다툼 후 관계를 회복하는 행동을 한다." },
      },
    },
  ],
  bands: [
    {
      minPct: 0.85,
      title: "Тайван, шийдэлч хүн",
      summary:
        "Чи маргаанд сэтгэл хөдлөлөөр автахгүй байхыг ихэвчлэн барьж чаддаг байна. Гол асуудлыг оношлоод, нөгөө талыг сонсож, тохиролцоо руу чиглүүлэх хандлага хүчтэй. Чамтай маргалдсан хүн “яриад л өнгөрөхгүй, ямар нэг ойлголт/шийдэлд хүрдэг” гэж мэдрэх магадлал өндөр.",
      tips: [],
      i18n: {
        en: {
          title: "Calm, solution-oriented person",
          summary: "You can usually keep yourself from getting swept up emotionally in conflict. You're strong at diagnosing the core issue, listening to the other side, and steering toward agreement. Someone who argues with you is likely to feel \"it doesn't just blow over — we actually reach some understanding or solution.\"",
          tips: [],
        },
        ja: {
          title: "冷静で解決志向の人",
          summary: "あなたは口論の際、感情に流されないように保つことが多いようです。核心の問題を見極め、相手の話を聞き、合意へと導く傾向が強いです。あなたと口論した人は「ただ言い合って終わるのではなく、ある程度の理解や解決に至る」と感じる可能性が高いです。",
          tips: [],
        },
        ko: {
          title: "차분하고 해결 지향적인 사람",
          summary: "당신은 다툴 때 감정에 휩쓸리지 않으려고 대체로 유지할 수 있습니다. 핵심 문제를 파악하고, 상대방의 말을 듣고, 합의로 이끄는 경향이 강합니다. 당신과 다툰 사람은 \"그냥 말로 끝나지 않고 어느 정도 이해나 해결에 도달한다\"고 느낄 가능성이 높습니다.",
          tips: [],
        },
      },
    },
    {
      minPct: 0.65,
      title: "Боломжийн, гэхдээ савлагаатай",
      summary:
        "Чи ер нь шийдэхийг хүсдэг ч зарим үед уур, гомдол, ядаргаа орж ирээд яриа хурцдах магадлал байна. Ихэвчлэн эхлэл нь зүгээр байснаа дундаа хамгаалах/даврах хэлбэр рүү орчихдог, эсвэл өмнөх асуудлыг сөхөх гээд явчих үе гарч болохоор харагдаж байна. Нийтдээ боломжийн ч тогтвортой байдал нь нөхцөлөөс хамаардаг зураг байна.",
      tips: [],
      i18n: {
        en: {
          title: "Reasonable, but fluctuating",
          summary: "You generally want to resolve things, but at times anger, hurt, or exhaustion may step in and escalate the conversation. It often starts fine but may slide into a defensive/escalating mode partway through, or veer into digging up past issues. Overall reasonable, but consistency depends on the situation.",
          tips: [],
        },
        ja: {
          title: "妥当だが波がある",
          summary: "あなたは基本的に解決したいと思っていますが、時々怒り、傷つき、疲労が入ってきて会話が激しくなる可能性があります。始まりは問題なくても途中で防御的・エスカレートする形に入ったり、過去の問題を掘り返す方向に行く時があるように見えます。全体的には妥当ですが、一貫性は状況に左右されます。",
          tips: [],
        },
        ko: {
          title: "괜찮지만 기복이 있음",
          summary: "당신은 보통 해결하고 싶어 하지만, 때때로 분노, 서운함, 피로가 끼어들어 대화가 격해질 수 있습니다. 시작은 괜찮다가도 중간에 방어적이거나 격화되는 모습으로 빠지거나, 과거 문제를 들추는 쪽으로 흐를 때가 있는 것으로 보입니다. 전반적으로 괜찮지만 일관성은 상황에 따라 달라집니다.",
          tips: [],
        },
      },
    },
    {
      minPct: 0.0,
      title: "Маргаанд хурцдах магадлал өндөр",
      summary:
        "Одоогийн хариултуудаас харахад маргаан эхлэхээр хамгаалах, бухимдах, “ялах” горим руу орох тал давамгай байж магадгүй. Тэр үед бодит шийдэл гэхээсээ илүү хэн зөв/хэн буруу гэдэг дээр гацах, эсвэл үг хурцдах эрсдэл өндөр. Энэ нь зан чанарын “муу” дүгнэлт биш — тухайн үеийн стресс, ачаалал, хуримтлагдсан гомдол их байхад хамгийн түрүүнд ингэж илэрдэг зураг байдаг.",
      tips: [],
      i18n: {
        en: {
          title: "High likelihood of escalation",
          summary: "Your current answers suggest that when an argument starts, defending, frustration, and a \"winning\" mode tend to dominate. There's a high risk of getting stuck on who's right/wrong rather than reaching a real solution, or of words escalating. This isn't a \"bad\" character verdict — it's the pattern that tends to show up first when current stress, load, and built-up resentment are high.",
          tips: [],
        },
        ja: {
          title: "口論が激化しやすい",
          summary: "現在の回答からは、口論が始まると防御、苛立ち、「勝つ」モードが優勢になりやすいことが示されています。その時、実際の解決よりも誰が正しい・間違っているかで止まってしまったり、言葉が激化するリスクが高いです。これは性格の「悪い」判定ではなく、現在のストレス、負担、積み重なった不満が多い時に最初に現れやすいパターンです。",
          tips: [],
        },
        ko: {
          title: "다툼이 격화될 가능성이 높음",
          summary: "현재 답변을 보면 다툼이 시작되면 방어, 짜증, '이기는' 모드가 우세해지는 경향이 있습니다. 이때 실제 해결보다 누가 맞고 틀린지에 갇히거나 말이 격해질 위험이 높습니다. 이것은 성격이 '나쁘다'는 판단이 아니라, 현재의 스트레스, 부담, 쌓인 불만이 많을 때 가장 먼저 나타나는 패턴입니다.",
          tips: [],
        },
      },
    },
  ],
};
