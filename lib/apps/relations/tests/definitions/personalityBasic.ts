import type { TestDefinition, TestOption, TestOptionValue } from "../types";

const OPTIONS: TestOption[] = [
  // ✅ “сайн нь дээр” гэж UI дээр харагдана
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

export const personalityBasic: TestDefinition = {
  id: "personality-basic",
  slug: "personality-basic",
  title: "Хувь хүний суурь тест",
  subtitle: "Өөрийгөө таних · 12 асуулт",
  description:
    "Өөрийгөө яаж мэдэрдэг, хүмүүс дунд ямар байдал гаргадаг, шийдвэр гаргахдаа юунд илүү тулгуурладгийг ерөнхий чиглэлээр нь харуулна.",
  i18n: {
    en: {
      title: "Personality Foundation Test",
      subtitle: "Self-knowledge · 12 questions",
      description: "Shows the general direction of how you feel about yourself, how you act around others, and what you rely on most when making decisions.",
    },
    ja: {
      title: "パーソナリティ基盤テスト",
      subtitle: "自己理解・12問",
      description: "自分をどう感じているか、人の中でどう振る舞うか、決断時に何に最も依拠するかの全体的な方向性を示します。",
    },
    ko: {
      title: "성격 기반 테스트",
      subtitle: "자기 이해 · 12문항",
      description: "자신을 어떻게 느끼는지, 사람들 사이에서 어떻게 행동하는지, 결정을 내릴 때 무엇에 가장 의존하는지의 전반적인 방향을 보여줍니다.",
    },
  },
  questions: [
    { id: "q1", text: "Сүүлийн үед би өөрийгөө тайван, тогтвортой мэдэрдэг.", options: OPTIONS,
      i18n: { en: { text: "Lately I feel calm and stable." }, ja: { text: "最近、自分が落ち着いて安定していると感じる。" }, ko: { text: "요즘 나는 차분하고 안정적이라고 느낀다." } } },
    { id: "q2", text: "Хүмүүстэй харилцахдаа би өөрийнхөөрөө байж чаддаг.", options: OPTIONS,
      i18n: { en: { text: "Around people, I can be myself." }, ja: { text: "人と関わる時、自分らしくいられる。" }, ko: { text: "사람들과 있을 때 나답게 있을 수 있다." } } },
    { id: "q3", text: "Шийдвэр гаргахдаа би яаралгүй бодож, дараа нь хөдөлдөг.", options: OPTIONS,
      i18n: { en: { text: "When deciding, I think without rushing, then act." }, ja: { text: "決断する時、急がずに考えてから動く。" }, ko: { text: "결정할 때 서두르지 않고 생각한 후 움직인다." } } },
    { id: "q4", text: "Би өөртөө тавьсан жижиг зорилгоо биелүүлэхдээ тогтвортой байдаг.", options: OPTIONS,
      i18n: { en: { text: "I'm consistent at fulfilling the small goals I set for myself." }, ja: { text: "自分で立てた小さな目標を達成するのに一貫している。" }, ko: { text: "내가 세운 작은 목표를 이루는 데 일관적이다." } } },
    { id: "q5", text: "Алдаа гаргасан үедээ би өөрийгөө хэт буруутгалгүй, сургамж авдаг.", options: OPTIONS,
      i18n: { en: { text: "When I make a mistake, I learn from it without overly blaming myself." }, ja: { text: "間違いを犯した時、過度に自分を責めず学びを得る。" }, ko: { text: "실수했을 때 과도하게 자신을 탓하지 않고 배움을 얻는다." } } },
    { id: "q6", text: "Надад таалагдахгүй зүйлд “үгүй” гэж хэлж чаддаг.", options: OPTIONS,
      i18n: { en: { text: "I can say \"no\" to things I don't like." }, ja: { text: "気に入らないことに「いや」と言える。" }, ko: { text: "마음에 들지 않는 일에 \"아니\"라고 말할 수 있다." } } },
    { id: "q7", text: "Сэтгэл санаа савлах үедээ би өөрийгөө тайвшруулах арга хэрэглэдэг.", options: OPTIONS,
      i18n: { en: { text: "When my mood swings, I use ways to calm myself." }, ja: { text: "気分が揺れる時、自分を落ち着かせる方法を使う。" }, ko: { text: "감정이 흔들릴 때 자신을 진정시키는 방법을 사용한다." } } },
    { id: "q8", text: "Би өөрийн давуу талаа мэддэг бөгөөд шаардлагатай үед түүн дээрээ тулгуурладаг.", options: OPTIONS,
      i18n: { en: { text: "I know my strengths and rely on them when needed." }, ja: { text: "自分の強みを知り、必要な時はそれに頼る。" }, ko: { text: "나의 강점을 알고 필요할 때 그것에 의존한다." } } },
    { id: "q9", text: "Би хүмүүстэй харьцахдаа ер нь шударга, ойлгомжтой байхыг хичээдэг.", options: OPTIONS,
      i18n: { en: { text: "With people, I generally try to be honest and clear." }, ja: { text: "人と接する時、概ね誠実で分かりやすくあろうとする。" }, ko: { text: "사람들과 있을 때 대체로 정직하고 명확하려고 노력한다." } } },
    { id: "q10", text: "Стресс үед ч би үндсэн ажлаа/амьдралынхаа хэмнэлийг нэг хэмжээнд барьж чаддаг.", options: OPTIONS,
      i18n: { en: { text: "Even under stress, I can keep my work/life rhythm somewhat intact." }, ja: { text: "ストレスがある時でも、仕事や生活のリズムをある程度保てる。" }, ko: { text: "스트레스를 받아도 일/생활의 리듬을 어느 정도 유지할 수 있다." } } },
    { id: "q11", text: "Би тусламж хэрэгтэй үедээ бусдаас дэмжлэг хүсэж чаддаг.", options: OPTIONS,
      i18n: { en: { text: "When I need help, I can ask others for support." }, ja: { text: "助けが必要な時、人に支援を求められる。" }, ko: { text: "도움이 필요할 때 다른 사람에게 지원을 요청할 수 있다." } } },
    { id: "q12", text: "Би өөрийн амьдралд юу чухал вэ гэдгээ үе үе бодож, чиглэлээ сэргээдэг.", options: OPTIONS,
      i18n: { en: { text: "I periodically reflect on what matters in my life and reset my direction." }, ja: { text: "自分の人生で何が大切かを時々考え、方向性を見直す。" }, ko: { text: "내 삶에서 무엇이 중요한지 때때로 생각하며 방향을 다시 잡는다." } } },
  ],
  bands: [
    {
      minPct: 0.9,
      title: "Суурь маш тогтвортой",
      summary:
        "Чиний дотор “тулгуур” сайн байна. Сэтгэл санаа савлах, ажил/амьдрал давхцах үед ч чи өөрийгөө унагаахгүй барьж чаддаг хэв шинж ажиглагдлаа.\n\n" +
        "Ихэнхдээ чи өөрийнхөөрөө байж чаддаг, шийдвэрээ яаралгүй гаргадаг, алдаа дээр өөрийгөө дарангуйлж биш — ойлгож хүлээн зөвшөөрөөд цааш явдаг талтай.\n\n" +
        "Ийм хүмүүс гаднаасаа тайван харагддаг ч дотроо “би хаашаа явж байгаа вэ” гэдгээ хааяа өөрөөсөө асууж, чиглэлээ алдахгүй барьдаг байдаг.",
      tips: [],
      i18n: {
        en: {
          title: "Very stable foundation",
          summary:
            "Your inner \"footing\" is solid. Even when your mood swings or work/life pile up, you tend to hold yourself steady without collapsing.\n\n" +
            "Most of the time you can be yourself, make decisions without rushing, and rather than crushing yourself over mistakes, you understand, accept, and move on.\n\n" +
            "People like this look calm from the outside, but inside they occasionally ask themselves \"where am I headed?\" and keep their direction without losing it.",
          tips: [],
        },
        ja: {
          title: "非常に安定した基盤",
          summary:
            "あなたの内なる「支え」は強いです。気分が揺れる時や仕事と生活が重なる時でも、自分を崩さずに保てる傾向が見られます。\n\n" +
            "ほとんどの場合、自分らしくいられ、決断を急がず行い、失敗しても自分を抑え込むよりも理解し受け入れて前に進む面があります。\n\n" +
            "このような人は外見上は冷静に見えますが、内心では時々「自分はどこへ向かっているのか」と自問し、方向性を失わずに保っています。",
          tips: [],
        },
        ko: {
          title: "매우 안정적인 기반",
          summary:
            "당신의 내면의 \"버팀목\"이 견고합니다. 감정이 흔들리거나 일/생활이 겹쳐도 자신을 무너뜨리지 않고 지킬 수 있는 경향이 보입니다.\n\n" +
            "대부분 자기다움을 유지할 수 있고, 결정을 서두르지 않으며, 실수했을 때 자신을 짓누르기보다 이해하고 받아들인 뒤 나아가는 면이 있습니다.\n\n" +
            "이런 사람은 겉으로는 차분해 보이지만 속으로는 때때로 \"나는 어디로 가고 있나\"를 자문하며 방향을 잃지 않고 지킵니다.",
          tips: [],
        },
      },
    },
    {
      minPct: 0.78,
      title: "Тогтвортой, өөрийгөө мэдэрдэг",
      summary:
        "Ерөнхий суурь чинь сайн байна. Өөртөө “үгүй” гэж хэлэх, хэмнэлээ барих, өөрийгөө тайвшруулах зэрэг нь ихэнх үед ажилладаг байна.\n\n" +
        "Гэхдээ зарим асуултад “заримдаа/ховор” гэж сонгосон бол чи зарим үед ачааллаасаа болоод өөрийгөө түр мартчихдаг, эсвэл дэмжлэг хүсэхээ хойш тавих хандлагатай байж магадгүй.\n\n" +
        "Нийтдээ бол: чи өөрийгөө авч явдаг, гэхдээ хэт ачааллын үед дотоод хүч чинь хурдан шавхагддаг талтай.",
      tips: [],
      i18n: {
        en: {
          title: "Stable, self-aware",
          summary:
            "Your overall foundation is good. Saying \"no\" for yourself, keeping your rhythm, and calming yourself work most of the time.\n\n" +
            "But if you chose \"sometimes/rarely\" on some questions, you may sometimes forget yourself under load, or tend to put off asking for support.\n\n" +
            "Overall: you carry yourself well, but under excessive load your inner reserves may deplete quickly.",
          tips: [],
        },
        ja: {
          title: "安定していて自己認識がある",
          summary:
            "全体的な基盤は良好です。自分のために「いや」と言う、リズムを保つ、自分を落ち着かせることがほとんどの場合うまく機能しています。\n\n" +
            "しかし一部の質問で「時々/稀に」を選んだなら、負担がかかると時々自分を一時的に忘れてしまったり、支援を求めるのを後回しにする傾向があるかもしれません。\n\n" +
            "総じて：あなたは自分をうまく支えていますが、過度な負担の時には内なる力が早く尽きる面があります。",
          tips: [],
        },
        ko: {
          title: "안정적이고 자기 인식이 있음",
          summary:
            "전반적인 기반은 좋습니다. 자신을 위해 \"아니\"라고 말하기, 리듬을 유지하기, 자신을 진정시키기가 대부분 잘 작동합니다.\n\n" +
            "하지만 일부 질문에서 \"때때로/드물게\"를 선택했다면, 부담이 클 때 때때로 자신을 잠시 잊거나 도움을 요청하는 것을 미루는 경향이 있을 수 있습니다.\n\n" +
            "전반적으로: 당신은 자신을 잘 이끌어가지만, 과도한 부담 시에는 내면의 힘이 빨리 소진되는 면이 있습니다.",
          tips: [],
        },
      },
    },
    {
      minPct: 0.62,
      title: "Дундаж суурь, савлагаа мэдэгдэнэ",
      summary:
        "Чи боломжийн л явж байна, гэхдээ тогтвортой байдал чинь нөхцөлөөсөө их шалтгаалдаг зураг гарч байна. Өдөр/нөхцөл сайн үед чи гайгүй, харин стресс нэмэгдэхэд дотоод тэнцвэр хурдан ганхдаг байж магадгүй.\n\n" +
        "Өөрийнхөөрөө байх, зорилгоо барих, “үгүй” гэж хэлэх дээр нэг хэсэг нь сайн мөртлөө нөгөө хэсэг нь сул байгаа шинжтэй. Энэ нь зан чанарын асуудал биш — ихэвчлэн ядаргаа, давхардсан үүрэг, эсвэл “өөрийгөө сүүлд нь тавьдаг” хэвшлээс үүддэг.\n\n" +
        "Чиний суурь нурсан биш. Зүгээр л тогтвортой байх нөөц чинь жигд биш байна.",
      tips: [],
      i18n: {
        en: {
          title: "Average foundation, fluctuation visible",
          summary:
            "You're getting by reasonably, but your stability depends heavily on circumstances. On good days you're fine, but when stress rises your inner balance may quickly wobble.\n\n" +
            "Being yourself, holding your goals, saying \"no\" — one part is solid while another is weak. This isn't a character problem — it usually comes from exhaustion, overlapping responsibilities, or a habit of \"putting yourself last.\"\n\n" +
            "Your foundation hasn't collapsed. Your reserve for staying stable is just uneven.",
          tips: [],
        },
        ja: {
          title: "平均的な基盤、波が見られる",
          summary:
            "あなたはまずまずやっていますが、安定性は状況に大きく左右される様子です。良い日には問題ありませんが、ストレスが高まると内なるバランスが早く揺らぐかもしれません。\n\n" +
            "自分らしくいること、目標を保つこと、「いや」と言うこと — 一部は強いものの別の一部は弱い傾向です。これは性格の問題ではなく、たいてい疲労、重複した責務、または「自分を後回しにする」習慣から来ます。\n\n" +
            "あなたの基盤は崩れていません。ただ安定を保つ資源が均一でないだけです。",
          tips: [],
        },
        ko: {
          title: "평균적인 기반, 기복이 보임",
          summary:
            "당신은 그럭저럭 잘 지내고 있지만, 안정성은 상황에 크게 좌우되는 모습입니다. 좋은 날에는 괜찮지만 스트레스가 높아지면 내면의 균형이 빠르게 흔들릴 수 있습니다.\n\n" +
            "자기다움, 목표 유지, \"아니\"라고 말하기 — 한 부분은 강하지만 다른 부분은 약한 경향입니다. 이는 성격의 문제가 아니라 대개 피로, 겹친 책무, 또는 \"자신을 뒤로 미루는\" 습관에서 옵니다.\n\n" +
            "당신의 기반은 무너지지 않았습니다. 단지 안정을 유지하는 자원이 균일하지 않을 뿐입니다.",
          tips: [],
        },
      },
    },
    {
      minPct: 0.45,
      title: "Одоогоор ядарсан суурь",
      summary:
        "Эндээс харахад сүүлийн үед чи өөрийгөө “барих” гэж их хүч гаргаж байгаа бололтой. Тайван байх, хэмнэлээ барих, өөрийгөө тайвшруулах, дэмжлэг хүсэх зэрэг дээр “ховор/огт” сонголт олон байвал энэ нь чиний буруу биш — харин нөөц чинь багассан дохио.\n\n" +
        "Ийм үед хүн өөрийгөө буруутгахаараа улам мууддаг. Дотор хамгаалалт чинь их ажиллаад ирэхээр шийдвэр гаргах, зорилго барих, хүмүүсийн дунд өөрийнхөөрөө байх нь хүндрэх нь хэвийн.\n\n" +
        "Нийт зураг: чи өөрийгөө “аврах” горимд удаан явж магадгүй байна.",
      tips: [],
      i18n: {
        en: {
          title: "Currently exhausted foundation",
          summary:
            "This suggests you've been putting a lot of effort into \"holding yourself together\" lately. If \"rarely/not at all\" came up often for staying calm, keeping rhythm, self-soothing, and asking for support, that's not your fault — it's a sign your reserves have run low.\n\n" +
            "At times like this, blaming yourself only makes it worse. When your inner defenses are working overtime, it's normal for decision-making, holding goals, and being yourself among people to become harder.\n\n" +
            "Overall picture: you may have been running in \"survival mode\" for a while.",
          tips: [],
        },
        ja: {
          title: "現在疲弊している基盤",
          summary:
            "これは最近あなたが「自分を保つ」ために多くの力を使ってきたことを示唆しています。落ち着くこと、リズムを保つこと、自分を落ち着かせること、支援を求めることで「稀に/全くない」が多かったなら、それはあなたのせいではなく、資源が減っている兆候です。\n\n" +
            "このような時、自分を責めることでさらに悪化します。内なる防御が多く働いている時、決断、目標の維持、人の中で自分らしくいることが難しくなるのは普通です。\n\n" +
            "全体像：あなたは長い間「生き延びるモード」で過ごしてきたかもしれません。",
          tips: [],
        },
        ko: {
          title: "현재 지친 기반",
          summary:
            "이는 최근 당신이 \"자신을 지키기\" 위해 많은 힘을 써왔다는 것을 시사합니다. 차분함 유지, 리듬 유지, 자신을 달래기, 도움 요청에서 \"드물게/전혀 아니다\"가 많이 나왔다면 그것은 당신의 잘못이 아니라 자원이 줄었다는 신호입니다.\n\n" +
            "이런 시기에는 자신을 탓하면 더 나빠집니다. 내면의 방어가 과도하게 작동할 때 결정, 목표 유지, 사람들 사이에서 자기다움이 어려워지는 것은 정상입니다.\n\n" +
            "전체적인 그림: 당신은 한동안 '생존 모드'로 지내왔을 수 있습니다.",
          tips: [],
        },
      },
    },
    {
      minPct: 0,
      title: "Сууриа дахин босгох хэрэгцээтэй үе",
      summary:
        "Оноо доогуур гарсан бол энэ нь “чи муу хүн” гэсэн үг огт биш. Харин сүүлийн үед дотор чинь их ачаалал хуримтлагдсан, эсвэл тогтвортой байлгадаг зүйлс (хэмнэл, дэмжлэг, өөрийгөө тайвшруулах боломж) тасалдсан байж болзошгүй.\n\n" +
        "Энд хамгийн тод илрэх зүйл нь: өөрийгөө буруутгах, ганцаараа даах, “би зүгээр” гэж явах хандлага. Гэтэл бодитоор бол ядаргаа, стресс, чиглэлээ алдах мэдрэмж зэрэг зэрэг явж байж магадгүй.\n\n" +
        "Энэ үр дүн бол онош биш — гэхдээ “би одоо өөрийгөө анзаарах хэрэгтэй” гэсэн хүчтэй дохио гэж ойлгож болно.",
      tips: [],
      i18n: {
        en: {
          title: "Time to rebuild your foundation",
          summary:
            "A low score is not at all a verdict that \"you're a bad person.\" Rather, a lot of pressure may have built up inside you recently, or things that keep you stable (rhythm, support, ways to calm yourself) may have been disrupted.\n\n" +
            "The clearest pattern here: blaming yourself, carrying it all alone, and going through with \"I'm fine.\" But in reality, exhaustion, stress, and a feeling of losing direction may all be happening at once.\n\n" +
            "This result isn't a diagnosis — but it can be understood as a strong signal that \"I need to pay attention to myself now.\"",
          tips: [],
        },
        ja: {
          title: "基盤を再構築する必要がある時期",
          summary:
            "点数が低くても、それは「あなたが悪い人だ」という意味では全くありません。むしろ最近、内側に多くの圧力が積み重なった、あるいは安定を保つもの（リズム、支援、自分を落ち着かせる方法）が途切れたのかもしれません。\n\n" +
            "ここで最も明確に現れるのは：自分を責める、一人で抱え込む、「私は大丈夫」と振る舞う傾向です。しかし実際には疲労、ストレス、方向を失う感覚が同時に進行している可能性があります。\n\n" +
            "この結果は診断ではありませんが、「今、自分に注意を向ける必要がある」という強いシグナルとして受け取ることができます。",
          tips: [],
        },
        ko: {
          title: "기반을 다시 세워야 할 시기",
          summary:
            "점수가 낮게 나왔다고 해서 \"당신이 나쁜 사람\"이라는 뜻은 전혀 아닙니다. 오히려 최근 내면에 많은 압박이 쌓였거나, 안정을 지켜주던 것들(리듬, 지원, 자신을 달래는 방법)이 끊겼을 수 있습니다.\n\n" +
            "여기서 가장 분명하게 나타나는 것은: 자신을 탓하기, 혼자 감당하기, \"나는 괜찮아\"라며 버티는 경향입니다. 그러나 실제로는 피로, 스트레스, 방향을 잃은 느낌이 동시에 진행되고 있을 수 있습니다.\n\n" +
            "이 결과는 진단이 아니지만, \"지금 나에게 관심을 기울여야 한다\"는 강한 신호로 받아들일 수 있습니다.",
          tips: [],
        },
      },
    },
  ],
};
