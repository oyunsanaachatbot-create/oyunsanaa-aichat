import type { TestDefinition, TestOption, TestOptionValue } from "../types";

const OPTIONS: TestOption[] = [
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

export const communicationStyle: TestDefinition = {
  id: "communication-style",
  slug: "communication-style",
  title: "Харилцах хэв маяг тест",
  subtitle: "12 асуулт · богино",
  description:
    "Сонсох, тайван зохицуулах, өөрийгөө илэрхийлэх хэв маягийн ерөнхий чигийг харуулна.",
  i18n: {
    en: {
      title: "Communication Style Test",
      subtitle: "12 questions · short",
      description: "Shows the general tendency of your listening, calm regulation, and self-expression style.",
    },
    ja: {
      title: "コミュニケーションスタイルテスト",
      subtitle: "12問・短時間",
      description: "傾聴、冷静さの調整、自己表現のスタイルの全体的な傾向を示します。",
    },
    ko: {
      title: "소통 스타일 테스트",
      subtitle: "12문항 · 짧은 버전",
      description: "경청, 평정심 조절, 자기표현 스타일의 전반적인 경향을 보여줍니다.",
    },
  },
  questions: [
    { id: "q1", text: "Маргаан үед би түрүүлж хамгаалах гэж тайлбарлаад эхэлдэг.", options: OPTIONS,
      i18n: { en: { text: "During arguments, I start by defending/explaining myself first." }, ja: { text: "口論になると、まず自分を守ろうとして説明し始める。" }, ko: { text: "다툴 때 나는 먼저 변명하며 방어부터 시작한다." } } },
    { id: "q2", text: "Би нөгөө хүнийг таслалгүй сонсож чаддаг.", options: OPTIONS,
      i18n: { en: { text: "I can listen to the other person without interrupting." }, ja: { text: "相手の話を遮らずに聞くことができる。" }, ko: { text: "상대방의 말을 끊지 않고 들을 수 있다." } } },
    { id: "q3", text: "Би дуугаа өндөрсгөхөөс өмнө түр завсарлаж чаддаг.", options: OPTIONS,
      i18n: { en: { text: "I can pause before raising my voice." }, ja: { text: "声を荒げる前に一度落ち着くことができる。" }, ko: { text: "목소리를 높이기 전에 잠시 멈출 수 있다." } } },
    { id: "q4", text: "Би буруутгах биш, өөрийн мэдрэмжээр ярьж чаддаг.", options: OPTIONS,
      i18n: { en: { text: "I speak from my own feelings rather than blaming." }, ja: { text: "相手を責めるより、自分の気持ちで話すことができる。" }, ko: { text: "비난하기보다 내 감정으로 이야기할 수 있다." } } },
    { id: "q5", text: "Би нөгөө хүний хэлсэн гол санааг давтаж баталгаажуулдаг.", options: OPTIONS,
      i18n: { en: { text: "I repeat back the other person's main point to confirm it." }, ja: { text: "相手の言いたいことを繰り返して確認する。" }, ko: { text: "상대방이 말한 핵심을 되짚어 확인한다." } } },
    { id: "q6", text: "Би ууртай үедээ чат/мессеж бичихээсээ өмнө түр хүлээж чаддаг.", options: OPTIONS,
      i18n: { en: { text: "When angry, I wait before sending a chat/message." }, ja: { text: "怒っているとき、メッセージを送る前に少し待てる。" }, ko: { text: "화가 났을 때 메시지를 보내기 전에 잠시 기다린다." } } },
    { id: "q7", text: "Би ‘чи дандаа…’ гэхээс илүү ‘би ингэж мэдэрлээ’ гэж ярьдаг.", options: OPTIONS,
      i18n: { en: { text: "I say \"I felt this way\" rather than \"you always...\"" }, ja: { text: "「あなたはいつも…」より「私はこう感じた」と言う。" }, ko: { text: "\"너는 항상...\"보다 \"나는 이렇게 느꼈어\"라고 말한다." } } },
    { id: "q8", text: "Маргааны дараа би эвлэрэх, ойлголцох алхам хийж чаддаг.", options: OPTIONS,
      i18n: { en: { text: "After an argument, I can take steps to reconcile and understand each other." }, ja: { text: "口論の後、和解し理解し合う行動を取れる。" }, ko: { text: "다툰 후 화해하고 서로 이해하는 행동을 할 수 있다." } } },
    { id: "q9", text: "Би маргаанд ‘ялах’ биш ‘ойлголцох’ гэж оролддог.", options: OPTIONS,
      i18n: { en: { text: "In arguments, I try to \"understand\" rather than \"win.\"" }, ja: { text: "口論では「勝つ」より「理解し合う」ことを目指す。" }, ko: { text: "다툼에서 \"이기는 것\"보다 \"이해하는 것\"을 목표로 한다." } } },
    { id: "q10", text: "Би өөрийн хүсэлтээ тодорхой, зөөлөн хэлж чаддаг.", options: OPTIONS,
      i18n: { en: { text: "I can state my requests clearly and gently." }, ja: { text: "自分の要望を明確かつ柔らかく伝えられる。" }, ko: { text: "내 요청을 명확하고 부드럽게 말할 수 있다." } } },
    { id: "q11", text: "Би шүүмж сонсоод шууд хаагддаггүй, түр бодож чаддаг.", options: OPTIONS,
      i18n: { en: { text: "When criticized, I don't shut down immediately — I take time to think." }, ja: { text: "批判を聞いてすぐ閉じこもらず、少し考えられる。" }, ko: { text: "비판을 들어도 바로 닫아버리지 않고 잠시 생각할 수 있다." } } },
    { id: "q12", text: "Би хүнтэй муудсан үедээ буруутгахаас илүү шийдэл хайдаг.", options: OPTIONS,
      i18n: { en: { text: "After falling out with someone, I look for a solution rather than blame." }, ja: { text: "誰かと気まずくなったとき、責めるより解決策を探す。" }, ko: { text: "누군가와 관계가 나빠졌을 때 비난보다 해결책을 찾는다." } } },
  ],
  bands: [
    {
      minPct: 0.8,
      title: "Тайван, ойлголцдог хэв маяг",
      summary:
        "Чи ихэнх үед харилцааг тайван авч явж чаддаг хүн байна. Сонсох, өөрийгөө зөв илэрхийлэх хоёр чинь сайн тэнцвэртэй. Төгс биш байсан ч хүмүүс чамтай ярихад ‘аюулгүй’ мэдрэмж авдаг байх магадлал өндөр.",
      tips: [
        "Давуу талаа улам батжуулах 1 алхам: маргаанд ‘би зөв’ гэхээс илүү ‘бид яаж ойлголцох вэ?’ гэж асуугаад үз.",
        "Хэцүү үед: ‘түр завсарлая, дараа нь ярья’ гэж хэлж сурвал харилцаа улам хамгаалагдана.",
      ],
      i18n: {
        en: {
          title: "Calm, understanding style",
          summary: "You're someone who can keep a relationship calm most of the time. Listening and self-expression are well balanced. Not perfect, but people likely feel \"safe\" talking with you.",
          tips: [
            "To reinforce your strength: in arguments, try asking \"how can we understand each other?\" instead of \"I'm right.\"",
            "In tough moments, learning to say \"let's pause and talk later\" protects the relationship even more.",
          ],
        },
        ja: {
          title: "冷静で理解し合うスタイル",
          summary: "あなたはほとんどの場合、関係を冷静に保てる人です。聞くことと自己表現がよくバランスが取れています。完璧ではありませんが、人々はあなたと話すと「安心」を感じる可能性が高いです。",
          tips: [
            "強みをさらに伸ばす一歩：口論で「私が正しい」より「どうすれば理解し合えるか」と問いかけてみましょう。",
            "難しい時には「少し休んで後で話そう」と言えるようになると、関係がさらに守られます。",
          ],
        },
        ko: {
          title: "차분하고 이해하는 스타일",
          summary: "당신은 대부분의 경우 관계를 차분하게 유지할 수 있는 사람입니다. 경청과 자기표현이 잘 균형 잡혀 있습니다. 완벽하지 않아도 사람들은 당신과 이야기할 때 '안전함'을 느낄 가능성이 높습니다.",
          tips: [
            "강점을 더 키우는 한 걸음: 다툴 때 \"내가 맞아\" 대신 \"우리 어떻게 이해할 수 있을까?\"라고 물어보세요.",
            "힘든 순간에는 \"잠시 쉬고 나중에 이야기하자\"라고 말할 수 있게 되면 관계가 더 보호됩니다.",
          ],
        },
      },
    },
    {
      minPct: 0.55,
      title: "Холимог хэв маяг",
      summary:
        "Чи зарим үед маш сайн сонсож, эвтэйхэн ярьдаг. Харин зарим үед уур/стресс орж ирэхээр үг хурдтай гарах, хамгаалах горим асах үе байна. Энэ бол хэвийн — зүгээр л чиний ‘стрессийн товч’ хурдан дарагддаг хэсэг байна.",
      tips: [
        "Маргааны яг эхэнд 3 амьсгаа аваад: “Би одоо хамгаалаад эхэлж байна уу?” гэж өөрөөсөө асуугаад үз — тэр дороо намддаг.",
        "Нөгөөгөөс 1 зүйл тодруул: “Чи яг юу хүсэж байна?” гэж асуувал маргаан бодит шийдэл рүү ордог.",
      ],
      i18n: {
        en: {
          title: "Mixed style",
          summary: "Sometimes you listen very well and speak smoothly. But at other times, when anger/stress kicks in, words come out fast and a defensive mode switches on. This is normal — your \"stress button\" just gets triggered quickly at times.",
          tips: [
            "Right at the start of an argument, take 3 breaths and ask yourself \"Am I getting defensive right now?\" — it calms things instantly.",
            "Clarify one thing from the other side: asking \"what exactly do you want?\" steers the argument toward a real solution.",
          ],
        },
        ja: {
          title: "混在したスタイル",
          summary: "あなたは時々とてもよく聞き、円滑に話せます。しかし、怒りやストレスが入ってくると、言葉が速く出て防御モードに入る時もあります。これは普通のことです — あなたの「ストレスボタン」が時々早く押されるだけです。",
          tips: [
            "口論の始まりに3回深呼吸して「今、自分は防御し始めているか？」と自問してみましょう — すぐに落ち着きます。",
            "相手に「あなたは正確に何を望んでいるの？」と一つ確認すると、口論が現実的な解決へ向かいます。",
          ],
        },
        ko: {
          title: "혼합된 스타일",
          summary: "당신은 때로는 매우 잘 듣고 부드럽게 이야기합니다. 하지만 분노나 스트레스가 들어오면 말이 빨라지고 방어 모드가 켜지는 때도 있습니다. 이는 정상입니다 — 당신의 '스트레스 버튼'이 때때로 빨리 눌리는 것뿐입니다.",
          tips: [
            "다툼이 시작될 때 3번 숨을 쉬고 \"지금 내가 방어하기 시작했나?\"라고 자문해보세요 — 즉시 가라앉습니다.",
            "상대에게 \"정확히 무엇을 원해?\"라고 한 가지를 확인하면 다툼이 실질적인 해결로 향합니다.",
          ],
        },
      },
    },
    {
      minPct: 0.0,
      title: "Хурц, хамгаалах хэв маяг",
      summary:
        "Дарамт орж ирэхээр чи өөрийгөө хамгаалах гэж хурц хариу өгөх хандлага илүү байна. Энэ нь чамайг ‘муу хүн’ гэсэн үг биш — харин өмнө нь өөрийгөө хамгаалах хэрэгцээ олон байсан байж магадгүй. Одоо бол зүгээр л арга барилаа зөөлрүүлэх л шаардлагатай.",
      tips: [
        "Хамгийн эхний жижиг дадал: хариу хэлэхээсээ өмнө 10 секунд дуугүй бай. (Энэ чинь эвгүй ч хамгийн хүчтэй техник.)",
        "Маргааны дараа 1 өгүүлбэрээр эвлэрэл эхлүүл: “Бид хоёр эвтэйхэн ярилцмаар байна” гэж хэлээд үз.",
      ],
      i18n: {
        en: {
          title: "Sharp, defensive style",
          summary: "When pressure comes in, you tend to respond sharply to defend yourself. This doesn't mean you're a \"bad person\" — it may mean you've often needed to protect yourself in the past. Right now you just need to soften your approach.",
          tips: [
            "The simplest first habit: stay silent for 10 seconds before responding. (Awkward, but the most powerful technique.)",
            "After an argument, start reconciliation with one sentence: try saying \"I want us to talk this through gently.\"",
          ],
        },
        ja: {
          title: "鋭い防御スタイル",
          summary: "プレッシャーがかかると、あなたは自分を守るために鋭く反応する傾向があります。これは「悪い人」という意味ではなく、以前自分を守る必要が多かったのかもしれません。今はただアプローチを少し柔らかくすることが必要です。",
          tips: [
            "最初の小さな習慣：答える前に10秒間黙る。（気まずいですが最も強力なテクニックです。）",
            "口論の後、一文で和解を始めましょう：「二人で穏やかに話したい」と言ってみてください。",
          ],
        },
        ko: {
          title: "날카롭고 방어적인 스타일",
          summary: "압박이 들어오면 당신은 자신을 지키기 위해 날카롭게 반응하는 경향이 있습니다. 이것은 '나쁜 사람'이라는 뜻이 아니라, 이전에 자신을 보호해야 할 필요가 많았을 수 있다는 의미입니다. 지금은 그저 접근 방식을 부드럽게 만들면 됩니다.",
          tips: [
            "가장 먼저 시작할 작은 습관: 대답하기 전 10초간 침묵하기. (어색하지만 가장 강력한 기술입니다.)",
            "다툼 후 한 문장으로 화해를 시작하세요: \"우리 둘이 부드럽게 이야기하고 싶어\"라고 말해보세요.",
          ],
        },
      },
    },
  ],
};
