import type { TestDefinition, TestOption, TestOptionValue } from "../types";

// ✅ 5 сонголт, “сайн нь дээр” гэж UI дээр харагдана
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

export const trust: TestDefinition = {
  id: "trust",
  slug: "trust",
  title: "Итгэлцэл ба найдвартай байдал тест",
  subtitle: "10 асуулт · харилцаа",
  description:
    "Амлалт, тууштай байдал, үнэнч шударга байдал, хүнд үед орхихгүй байх зэрэг итгэл төрүүлдэг зан төлөв хэр тогтвортойг бүдүүн тоймоор харуулна.",
  i18n: {
    en: {
      title: "Trust & Reliability Test",
      subtitle: "10 questions · relationships",
      description: "Gives a rough overview of how consistent your trust-building behaviors are — keeping promises, consistency, honesty, and not abandoning people in hard times.",
    },
    ja: {
      title: "信頼と信頼性テスト",
      subtitle: "10問・人間関係",
      description: "約束、一貫性、誠実さ、困難な時に人を見捨てないことなど、信頼を生む行動がどれだけ安定しているかの概要を示します。",
    },
    ko: {
      title: "신뢰와 신뢰성 테스트",
      subtitle: "10문항 · 관계",
      description: "약속, 일관성, 정직함, 힘든 시기에 사람을 저버리지 않는 등 신뢰를 만드는 행동이 얼마나 일관적인지에 대한 대략적인 개요를 보여줍니다.",
    },
  },
  questions: [
    { id: "q1", text: "Амласан зүйлээ биелүүлэхийг хичээдэг.", options: OPTIONS,
      i18n: { en: { text: "I try to follow through on what I promise." }, ja: { text: "約束したことを守ろうと努める。" }, ko: { text: "약속한 것을 지키려고 노력한다." } } },
    { id: "q2", text: "Хоцрох/өөрчлөгдөх үедээ урьдчилж мэдэгддэг.", options: OPTIONS,
      i18n: { en: { text: "I let people know in advance when I'll be late or plans change." }, ja: { text: "遅れる・変更がある時は事前に知らせる。" }, ko: { text: "늦거나 일정이 바뀌면 미리 알린다." } } },
    { id: "q3", text: "Нууц хадгалж чаддаг.", options: OPTIONS,
      i18n: { en: { text: "I can keep secrets." }, ja: { text: "秘密を守ることができる。" }, ko: { text: "비밀을 지킬 수 있다." } } },
    { id: "q4", text: "Хариуцлагаа бусдад тохдоггүй.", options: OPTIONS,
      i18n: { en: { text: "I don't pin my responsibility on others." }, ja: { text: "自分の責任を他人に押し付けない。" }, ko: { text: "자신의 책임을 다른 사람에게 떠넘기지 않는다." } } },
    { id: "q5", text: "Алдаа гаргавал бултахгүйгээр хүлээн зөвшөөрдөг.", options: OPTIONS,
      i18n: { en: { text: "When I make a mistake, I admit it without dodging." }, ja: { text: "間違いを犯したら、逃げずに認める。" }, ko: { text: "실수하면 회피하지 않고 인정한다." } } },
    { id: "q6", text: "Үгээрээ бус үйлдлээрээ итгэл төрүүлдэг.", options: OPTIONS,
      i18n: { en: { text: "I build trust through actions, not just words." }, ja: { text: "言葉だけでなく行動で信頼を築く。" }, ko: { text: "말이 아니라 행동으로 신뢰를 쌓는다." } } },
    { id: "q7", text: "Хүнд үед орхиод явчихдаггүй.", options: OPTIONS,
      i18n: { en: { text: "I don't abandon people in hard times." }, ja: { text: "困難な時に人を見捨てない。" }, ko: { text: "힘든 시기에 사람을 저버리지 않는다." } } },
    { id: "q8", text: "“Болно” гэж хэлчихээд таг болчихдоггүй.", options: OPTIONS,
      i18n: { en: { text: "I don't say \"sure\" and then go silent." }, ja: { text: "「いいよ」と言って後で連絡を絶たない。" }, ko: { text: "\"알겠어\"라고 하고 나서 연락을 끊지 않는다." } } },
    { id: "q9", text: "Чухал зүйл дээр шударга байдаг.", options: OPTIONS,
      i18n: { en: { text: "I'm honest about important things." }, ja: { text: "重要なことには誠実である。" }, ko: { text: "중요한 일에는 정직하다." } } },
    { id: "q10", text: "Итгэл эвдэрвэл сэргээхийн тулд тогтвортой алхам хийдэг.", options: OPTIONS,
      i18n: { en: { text: "If trust is broken, I take consistent steps to rebuild it." }, ja: { text: "信頼が崩れたら、回復のために一貫した行動をとる。" }, ko: { text: "신뢰가 깨지면 회복을 위해 일관된 행동을 한다." } } },
  ],
  bands: [
    {
      minPct: 0.85,
      title: "Тууштай найдвартай хүн",
      summary:
        "Чиний итгэл төрүүлдэг хамгийн том зүйл бол “яриад өнгөрдөггүй, хийж дуусгадаг” зан төлөв байна. Амлалт өгөхдөө хариуцлага мэдэрдэг, өөрчлөлт гарвал мэдэгддэг, алдаа гаргасан ч булталгүй хүлээн зөвшөөрдөг тал хүчтэй. Хүмүүс чамтай харьцахдаа “энэ хүн хэлсэн бол хийдэг” гэсэн дотоод итгэл сууж өгдөг тул маргаан гарахад ч асуудлыг тайван ярилцаад засах боломж өндөр байдаг. Чи ихэнхдээ шударга, нууц даадаг, хүнд үед орхихгүй байх талаараа тогтвортой харагдана — энэ нь харилцааны аюулгүй мэдрэмжийг хамгийн хурдан өсгөдөг суурь юм.",
      tips: [],
      i18n: {
        en: {
          title: "Consistently reliable person",
          summary: "The biggest trust you inspire comes from \"following through, not just talking.\" You feel responsible when making promises, let others know when things change, and admit mistakes without dodging. People develop the inner belief that \"if this person says it, they'll do it,\" which makes resolving conflicts calmly much easier. You appear consistently honest, good at keeping secrets, and reliable in hard times — the foundation that grows a relationship's sense of safety fastest.",
          tips: [],
        },
        ja: {
          title: "一貫して信頼できる人",
          summary: "あなたが生む最大の信頼は「言うだけでなく実行する」という行動から来ています。約束をする時に責任を感じ、変更があれば知らせ、間違いを犯しても逃げずに認める面が強いです。人々は「この人が言ったら実行する」という内なる信頼を持つようになるため、対立が起きても冷静に話し合って解決できる可能性が高いです。誠実で、秘密を守り、困難な時に見捨てないという点で一貫しているようです — これは関係の安心感を最も早く育てる基盤です。",
          tips: [],
        },
        ko: {
          title: "일관되게 신뢰할 수 있는 사람",
          summary: "당신이 주는 가장 큰 신뢰는 \"말로 끝내지 않고 실행한다\"는 행동에서 옵니다. 약속할 때 책임감을 느끼고, 변화가 있으면 미리 알리고, 실수해도 회피하지 않고 인정하는 면이 강합니다. 사람들은 \"이 사람이 말하면 한다\"는 내적 신뢰를 갖게 되어, 갈등이 생겨도 차분히 이야기하며 해결할 가능성이 높습니다. 당신은 정직하고, 비밀을 잘 지키며, 힘든 시기에 저버리지 않는다는 점에서 일관된 모습을 보입니다 — 이는 관계의 안전감을 가장 빠르게 키우는 토대입니다.",
          tips: [],
        },
      },
    },
    {
      minPct: 0.65,
      title: "Ерөнхийдөө найдвартай ч хэлбэлзэлтэй",
      summary:
        "Чи суурьдаа боломжийн найдвартай хүн — гэхдээ зарим үед тогтвортой байдал хэлбэлздэг зураг харагдаж байна. Ихэвчлэн “ажил/амьдралын ачаалал”, “сэтгэл санааны савлагаа”, эсвэл “хийх зүйлээ хэт олон амлах” үедээ хоцрох, таг болох, эсвэл амласнаа хойшлуулах магадлал нэмэгддэг байж болно. Чи муу санаатайдаа биш ч нөгөө хүнд “хэлээд л алга болчихлоо”, “найдахад эргэлзээ төрлөө” гэсэн мэдрэмж үлдээх эрсдэлтэй. Сайн тал нь: энэ бол зан чанарын муу зүйлээс илүү амьдралын хэмнэл, шийдвэр, хариуцлагаа хэрхэн барьж байгаа асуудал байх нь элбэг — өөрөөр хэлбэл тогтворжуулж болдог төрөл.",
      tips: [],
      i18n: {
        en: {
          title: "Generally reliable but fluctuating",
          summary: "At your core you're reasonably reliable — but at times your consistency wavers. Usually under \"work/life load,\" \"emotional swings,\" or \"promising too much at once,\" you may be more likely to be late, go silent, or delay on commitments. You don't mean any harm, but the other person risks feeling \"they just disappeared after saying it\" or \"I'm not sure I can rely on them.\" The good news: this is more often about life's rhythm, decisions, and how you carry responsibility than a character flaw — meaning it's a pattern that can be stabilized.",
          tips: [],
        },
        ja: {
          title: "概ね信頼できるが、波がある",
          summary: "基本的にあなたは十分信頼できる人ですが、時々一貫性が揺れる様子が見られます。多くは「仕事や生活の負担」「気分の波」、あるいは「やることを一度に約束し過ぎる」時に、遅れたり、連絡を絶ったり、約束を後回しにする可能性が高まるかもしれません。悪意はないものの、相手には「言ったのに消えてしまった」「信頼できるか分からなくなった」という気持ちが残るリスクがあります。良い点は、これは性格の問題というより、生活のリズムや決断、責任の持ち方の問題であることが多い — つまり安定させられるタイプだということです。",
          tips: [],
        },
        ko: {
          title: "전반적으로 신뢰할 수 있지만 기복이 있음",
          summary: "당신은 기본적으로 꽤 신뢰할 수 있는 사람이지만, 때때로 일관성이 흔들리는 모습이 보입니다. 보통 \"일/생활의 부담\", \"감정의 기복\", 또는 \"한 번에 너무 많이 약속하는\" 상황에서 늦거나, 연락을 끊거나, 약속을 미루게 될 가능성이 높아질 수 있습니다. 나쁜 의도는 없지만, 상대에게는 \"말만 하고 사라졌다\", \"믿어도 될지 모르겠다\"는 느낌을 줄 위험이 있습니다. 좋은 점은, 이는 성격의 문제보다는 삶의 리듬, 결정, 책임을 다루는 방식의 문제인 경우가 많다는 것입니다 — 즉 안정시킬 수 있는 유형입니다.",
          tips: [],
        },
      },
    },
    {
      minPct: 0.45,
      title: "Итгэл амархан савладаг хэв маяг",
      summary:
        "Энд гарч ирж байгаа зураг нь: чи зарим зүйл дээр сайн ч “итгэл” гэдэг суурь дээр тогтвортой байдал хангалтгүй байж магадгүй гэсэн дохио. Амлалт өгчихөөд биелүүлэхгүй байх, өөрчлөгдөхөд мэдэгдэхгүй үлдэх, хариуцлагаа бусдад шилжүүлэх мэт зүйлс нэг бус асуултад давхцаж илэрвэл хүмүүс чамайг “итгэлтэй хүн” гэж дотроо тооцоход хэцүү болдог. Энэ үед харилцаа ихэвчлэн 2 хэлбэрээр эвдэрдэг: (1) нөгөө тал хүлээлтээ багасгаад дотроо хөндийрөх, (2) илүү их шалгах/шахах (мессеж, баталгаажуулалт, уур) хэлбэр рүү орох. Чи өөрөө ч бас “би угаасаа яах юм” гэж бодоод бултах, эсвэл хамгаалах байрлалд орох магадлалтай. Гол асуудал нь нэг том алдаа биш — жижиг зүйл олон давтагдахад итгэл суурьнаасаа сулардаг.",
      tips: [],
      i18n: {
        en: {
          title: "Trust fluctuates easily",
          summary: "The picture here: while you're good in some areas, the consistency that builds \"trust\" as a foundation may be insufficient. Things like making promises and not following through, leaving changes unannounced, or shifting responsibility to others, when they overlap across several questions, make it hard for people to count you as a \"trustworthy person\" deep down. At this point relationships tend to break in two ways: (1) the other side lowers expectations and quietly withdraws, or (2) they shift into more checking/pressuring (messages, confirmations, anger). You yourself may also be prone to dodging or becoming defensive, thinking \"what am I supposed to do anyway.\" The core issue isn't one big mistake — it's that trust erodes from its foundation when small things repeat.",
          tips: [],
        },
        ja: {
          title: "信頼が揺らぎやすいスタイル",
          summary: "ここに見えてくる構図は、あなたは一部で良い面があるものの、「信頼」という基盤での一貫性が不十分かもしれないという兆候です。約束をしても実行しない、変更があっても知らせない、責任を他人に移すといったことが複数の項目で重なって現れると、人々はあなたを内心で「信頼できる人」と数えづらくなります。この時、関係はたいてい2つの形で壊れます：(1) 相手が期待を下げて内心で距離を置く、(2) より多くの確認・圧力（メッセージ、確認、怒り）の形に入る。あなた自身も「どうせ自分は…」と考えて言い訳したり、防御的な姿勢に入る可能性があります。核心の問題は一つの大きな過ちではなく、小さなことが繰り返されることで信頼が基盤から弱まることです。",
          tips: [],
        },
        ko: {
          title: "신뢰가 쉽게 흔들리는 스타일",
          summary: "여기서 보이는 그림은: 일부 면에서는 괜찮지만 '신뢰'라는 기반의 일관성이 부족할 수 있다는 신호입니다. 약속하고 지키지 않거나, 변화를 알리지 않거나, 책임을 다른 사람에게 넘기는 것들이 여러 항목에서 겹쳐 나타나면 사람들은 당신을 내심 '신뢰할 수 있는 사람'으로 여기기 어려워집니다. 이 시점에서 관계는 보통 두 가지 방식으로 깨집니다: (1) 상대가 기대를 낮추고 조용히 거리를 두는 것, (2) 더 많은 확인/압박(메시지, 확인, 분노)의 형태로 들어가는 것. 당신 자신도 \"어차피 나는...\"이라고 생각하며 회피하거나 방어적인 태도를 취할 가능성이 있습니다. 핵심 문제는 하나의 큰 실수가 아니라 작은 일들이 반복되면서 신뢰가 근본부터 약해지는 것입니다.",
          tips: [],
        },
      },
    },
    {
      minPct: 0,
      title: "Одоогоор итгэл сэргээх шаардлагатай түвшин",
      summary:
        "Хариултуудаас харахад чамд итгэл төрүүлэх зан төлөв тогтмол биш, зарим тал дээр эрс сул байх магадлалтай байна. Энэ нь “чи муу хүн” гэсэн дүгнэлт огт биш — харин одоо чиний амьдралын хэмнэл, дотоод дарамт, хариуцлагын хэв маяг харилцаанд шууд нөлөөлж байгаагийн зураг. Хүмүүс чамтай харьцахдаа амлалтанд эргэлзэх, хүнд үед орхигдох вий гэж айх, эсвэл үнэнээ хэлэхээс болгоомжлох мэдрэмж авах эрсдэл нэмэгддэг. Итгэл ингэж сулрах үед ямар ч сайхан мэдрэмж, хайр, санаа байсан ч “аюулгүй суурь” байхгүй бол харилцаа амархан ядраадаг. Энэ түвшин дээр хамгийн түгээмэл зөрчил нь: нэг нь “чи өөрчлөгдөнө гэж хэлдэг мөртлөө яг адилхан” гэж мэдэрдэг, нөгөө нь “намайг ойлгодоггүй/шахдаг” гэж хамгаалалт хийдэг хүлээлтийн мөргөлдөөн байдаг.",
      tips: [],
      i18n: {
        en: {
          title: "Trust currently needs rebuilding",
          summary: "Your answers suggest your trust-building behaviors aren't consistent, and may be markedly weak in some areas. This is not at all a verdict that \"you're a bad person\" — rather a picture of how your current life rhythm, inner pressures, and way of carrying responsibility are directly affecting your relationships. People interacting with you risk doubting your promises, fearing being abandoned in hard times, or feeling cautious about telling you the truth. When trust weakens like this, no matter how much good feeling, love, or care exists, a relationship tires easily without a \"safe foundation.\" The most common conflict at this level: one side feels \"you say you'll change but you're exactly the same,\" while the other gets defensive, feeling \"you don't understand me / you're pressuring me\" — a clash of expectations.",
          tips: [],
        },
        ja: {
          title: "現在、信頼の再構築が必要な段階",
          summary: "回答からは、あなたの信頼を生む行動が一貫しておらず、一部の面で著しく弱い可能性があることが示されています。これは「あなたが悪い人だ」という判定では全くなく、むしろ今のあなたの生活リズム、内的な圧力、責任の持ち方が関係に直接影響を与えていることの構図です。あなたと関わる人々は、約束に疑いを持ち、困難な時に見捨てられるのではと恐れ、あるいは本当のことを話すのに慎重になるリスクが高まります。信頼がこのように弱まると、どれほど良い感情、愛、思いやりがあっても、「安全な基盤」がなければ関係は容易に疲弊します。このレベルで最も一般的な対立は：一方が「あなたは変わると言うのに全く同じだ」と感じ、もう一方が「自分を理解していない・圧力をかけている」と防御する、期待のすれ違いです。",
          tips: [],
        },
        ko: {
          title: "현재 신뢰 회복이 필요한 수준",
          summary: "답변을 보면 신뢰를 만드는 행동이 일관적이지 않고, 일부 측면에서 상당히 약할 가능성이 있습니다. 이것은 '당신이 나쁜 사람'이라는 판단이 전혀 아니라, 오히려 지금 당신의 생활 리듬, 내적 압박, 책임을 다루는 방식이 관계에 직접 영향을 주고 있다는 그림입니다. 당신과 관계를 맺는 사람들은 약속을 의심하거나, 힘든 시기에 버려질까 두려워하거나, 진실을 말하는 데 조심스러워질 위험이 높아집니다. 신뢰가 이렇게 약해지면 아무리 좋은 감정, 사랑, 마음이 있어도 '안전한 기반'이 없으면 관계는 쉽게 지칩니다. 이 수준에서 가장 흔한 갈등은: 한쪽은 \"변하겠다고 말하면서 똑같다\"고 느끼고, 다른 쪽은 \"나를 이해하지 못한다/압박한다\"며 방어하는, 기대의 충돌입니다.",
          tips: [],
        },
      },
    },
  ],
};
