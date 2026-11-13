import type { TestDefinition, TestOption, TestOptionValue } from "../types";

// ✅ 5 сонголт, “сайн нь дээр” гэж UI дээр харагдана
// (энэ тест дээр “сайн” = токсик үйлдэл бага давтамжтай)
const OPTIONS: TestOption[] = [
  {
    value: 1 as TestOptionValue,
    label: "Бараг үгүй",
    i18n: { en: { label: "Almost never" }, ja: { label: "ほぼない" }, ko: { label: "거의 없음" } },
  },
  {
    value: 2 as TestOptionValue,
    label: "Ховор",
    i18n: { en: { label: "Rarely" }, ja: { label: "稀に" }, ko: { label: "드물게" } },
  },
  {
    value: 3 as TestOptionValue,
    label: "Заримдаа",
    i18n: { en: { label: "Sometimes" }, ja: { label: "時々" }, ko: { label: "때때로" } },
  },
  {
    value: 4 as TestOptionValue,
    label: "Ихэнхдээ",
    i18n: { en: { label: "Mostly" }, ja: { label: "ほとんどの場合" }, ko: { label: "대부분" } },
  },
  {
    value: 5 as TestOptionValue,
    label: "Байнга",
    i18n: { en: { label: "Always" }, ja: { label: "常に" }, ko: { label: "항상" } },
  },
];

export const toxicBehavior: TestDefinition = {
  id: "toxic-behavior",
  slug: "toxic-behavior",
  title: "Токсик зан төлөв тест",
  subtitle: "28 асуулт · өөрийгөө ажиглах",
  description:
    "Харилцаанд бусдад хор хүргэдэг, итгэл эвддэг хэв маяг илэрч байгаа эсэхийг өөртөө үнэнээр харах зориулалттай ерөнхий тест.",
  i18n: {
    en: {
      title: "Toxic Behavior Test",
      subtitle: "28 questions · self-observation",
      description: "A general test for honestly checking whether patterns that harm others or break trust show up in your relationships.",
    },
    ja: {
      title: "毒性行動テスト",
      subtitle: "28問・自己観察",
      description: "関係において他人を傷つけ、信頼を壊すパターンが現れているかを自分自身に正直に確認するための全体的なテストです。",
    },
    ko: {
      title: "독성 행동 테스트",
      subtitle: "28문항 · 자기 관찰",
      description: "관계에서 타인에게 해를 끼치고 신뢰를 깨는 패턴이 나타나는지 자신에게 솔직하게 확인하기 위한 전반적인 테스트입니다.",
    },
  },
  questions: [
    // I. Хяналт ба захирах (4)
    { id: "q1", text: "Би бусдыг “зөв” замаар явахыг албаддаг.", options: OPTIONS,
      i18n: { en: { text: "I force others to go \"my way is right.\"" }, ja: { text: "他人に「正しい」と思う方法を強いる。" }, ko: { text: "다른 사람에게 \"옳은\" 방식대로 따르도록 강요한다." } } },
    { id: "q2", text: "Минийхөөрөө л байх ёстой гэж дотроо боддог.", options: OPTIONS,
      i18n: { en: { text: "Inside, I think things must go my way." }, ja: { text: "心の中で、自分の思う通りでなければと考える。" }, ko: { text: "속으로 내 뜻대로 되어야 한다고 생각한다." } } },
    { id: "q3", text: "Надаас өөрөөр шийдэхэд дургүйцдэг.", options: OPTIONS,
      i18n: { en: { text: "I get upset when someone decides differently than I do." }, ja: { text: "自分と違う決断をされると不機嫌になる。" }, ko: { text: "나와 다르게 결정하면 불쾌해한다." } } },
    { id: "q4", text: "Хэн нэгэн бие даан шийдвэл уур хүрдэг.", options: OPTIONS,
      i18n: { en: { text: "I get angry when someone decides independently." }, ja: { text: "誰かが自分で決めると怒りを感じる。" }, ko: { text: "누군가 스스로 결정하면 화가 난다." } } },

    // II. Бурууг бусад руу түлхэх (4)
    { id: "q5", text: "Асуудал болбол ихэвчлэн бусдыг буруутгадаг.", options: OPTIONS,
      i18n: { en: { text: "When a problem occurs, I usually blame others." }, ja: { text: "問題が起きると、たいてい他人を責める。" }, ko: { text: "문제가 생기면 보통 다른 사람을 탓한다." } } },
    { id: "q6", text: "“Чиний л буруу” гэж дотроо боддог.", options: OPTIONS,
      i18n: { en: { text: "Inside I think \"it's your fault.\"" }, ja: { text: "心の中で「あなたのせいだ」と思う。" }, ko: { text: "속으로 \"네 잘못이야\"라고 생각한다." } } },
    { id: "q7", text: "Алдаагаа хүлээн зөвшөөрөх хэцүү.", options: OPTIONS,
      i18n: { en: { text: "It's hard for me to admit my mistakes." }, ja: { text: "自分の間違いを認めるのが難しい。" }, ko: { text: "내 잘못을 인정하는 것이 어렵다." } } },
    { id: "q8", text: "Өөрийгөө хамгаалахын тулд үнэнийг мушгидаг.", options: OPTIONS,
      i18n: { en: { text: "I twist the truth to protect myself." }, ja: { text: "自分を守るために真実をねじ曲げる。" }, ko: { text: "자신을 보호하기 위해 진실을 왜곡한다." } } },

    // III. Сэтгэл хөдлөлөөр шахах (4)
    { id: "q9", text: "Гомдож, дуугүй байж бусдыг гэмшүүлдэг.", options: OPTIONS,
      i18n: { en: { text: "I go silent and sulk to make others feel guilty." }, ja: { text: "傷ついて黙り込み、他人に罪悪感を抱かせる。" }, ko: { text: "서운해하며 침묵으로 다른 사람에게 죄책감을 느끼게 한다." } } },
    { id: "q10", text: "“Хэрэв чи тэгэхгүй бол…” гэж дарамталдаг.", options: OPTIONS,
      i18n: { en: { text: "I pressure with \"if you don't do this...\"" }, ja: { text: "「あなたがそうしなければ…」と圧力をかける。" }, ko: { text: "\"네가 그렇게 하지 않으면...\"이라며 압박한다." } } },
    { id: "q11", text: "Уйлах, уурлах зэргээр хүнийг буулгаж авдаг.", options: OPTIONS,
      i18n: { en: { text: "I get my way by crying or getting angry." }, ja: { text: "泣いたり怒ったりして相手を屈服させる。" }, ko: { text: "울거나 화내며 상대를 굴복시킨다." } } },
    { id: "q12", text: "Өрөвдүүлэх байдлаар хүссэнээ авдаг.", options: OPTIONS,
      i18n: { en: { text: "I get what I want by acting pitiable." }, ja: { text: "可哀想に見せることで望むものを得る。" }, ko: { text: "동정심을 유발해 원하는 것을 얻는다." } } },

    // IV. Хүндлэлгүй харилцах (4)
    { id: "q13", text: "Бусдыг доош нь хийх үг хэлдэг.", options: OPTIONS,
      i18n: { en: { text: "I say things that put others down." }, ja: { text: "他人を貶める言葉を言う。" }, ko: { text: "다른 사람을 깎아내리는 말을 한다." } } },
    { id: "q14", text: "Санаандгүй биш, зориуд хатуу ярьдаг.", options: OPTIONS,
      i18n: { en: { text: "I speak harshly on purpose, not by accident." }, ja: { text: "うっかりではなく、わざと厳しく話す。" }, ko: { text: "우연이 아니라 일부러 거칠게 말한다." } } },
    { id: "q15", text: "Хүний мэдрэмжийг “дэмий” гэж боддог.", options: OPTIONS,
      i18n: { en: { text: "I think other people's feelings are \"pointless.\"" }, ja: { text: "他人の気持ちを「無意味」だと思う。" }, ko: { text: "다른 사람의 감정을 \"의미 없다\"고 생각한다." } } },
    { id: "q16", text: "Шоглож, доромжилж хошигнодог.", options: OPTIONS,
      i18n: { en: { text: "I mock and joke in demeaning ways." }, ja: { text: "嘲笑し、見下すような冗談を言う。" }, ko: { text: "비웃고 모욕적으로 농담한다." } } },

    // V. Хил хязгаарыг үл хүндлэх (4)
    { id: "q17", text: "Хэн нэгэн “үгүй” гэвэл хүлээж авдаггүй.", options: OPTIONS,
      i18n: { en: { text: "When someone says \"no,\" I don't accept it." }, ja: { text: "誰かが「いや」と言っても受け入れない。" }, ko: { text: "누군가 \"싫다\"고 해도 받아들이지 않는다." } } },
    { id: "q18", text: "Хувийн орон зайг нь зөрчдөг.", options: OPTIONS,
      i18n: { en: { text: "I violate others' personal space." }, ja: { text: "他人の個人的な空間を侵す。" }, ko: { text: "다른 사람의 개인적인 공간을 침범한다." } } },
    { id: "q19", text: "Бусдын цаг, хүчийг өөрийнх шиг ашигладаг.", options: OPTIONS,
      i18n: { en: { text: "I use others' time and energy as if it were mine." }, ja: { text: "他人の時間や力を自分のもののように使う。" }, ko: { text: "다른 사람의 시간과 노력을 내 것처럼 사용한다." } } },
    { id: "q20", text: "“Чи ингэх ёстой” гэж боддог.", options: OPTIONS,
      i18n: { en: { text: "I think \"you should do this.\"" }, ja: { text: "「あなたはこうすべきだ」と考える。" }, ko: { text: "\"너는 이렇게 해야 해\"라고 생각한다." } } },

    // VI. Харилцааг хордуулах зуршлууд (4)
    { id: "q21", text: "Өнгөрснийг дахин сөхөж шийтгэдэг.", options: OPTIONS,
      i18n: { en: { text: "I dig up the past to punish someone again." }, ja: { text: "過去を再び掘り返して罰する。" }, ko: { text: "과거를 다시 들춰내며 벌을 준다." } } },
    { id: "q22", text: "Хардалт, сэрдэлт их.", options: OPTIONS,
      i18n: { en: { text: "I'm very suspicious/distrustful." }, ja: { text: "疑い、不信感が強い。" }, ko: { text: "의심과 불신이 많다." } } },
    { id: "q23", text: "Бусадтай харьцуулах, доош хийх.", options: OPTIONS,
      i18n: { en: { text: "I compare them to others and put them down." }, ja: { text: "他人と比較して見下す。" }, ko: { text: "다른 사람과 비교하며 깎아내린다." } } },
    { id: "q24", text: "Санаатайгаар зай барьж шийтгэх.", options: OPTIONS,
      i18n: { en: { text: "I deliberately distance myself to punish them." }, ja: { text: "意図的に距離を置いて罰する。" }, ko: { text: "의도적으로 거리를 두며 벌을 준다." } } },

    // VII. Хариуцлагаас зугтах (4)
    { id: "q25", text: "Маргааны дараа засах оролдлого хийдэггүй.", options: OPTIONS,
      i18n: { en: { text: "After an argument, I don't try to fix things." }, ja: { text: "口論の後、修復する努力をしない。" }, ko: { text: "다툼 후 관계를 회복하려는 노력을 하지 않는다." } } },
    { id: "q26", text: "Уучлалт гуйхаас зайлсхийдэг.", options: OPTIONS,
      i18n: { en: { text: "I avoid apologizing." }, ja: { text: "謝ることを避ける。" }, ko: { text: "사과하는 것을 피한다." } } },
    { id: "q27", text: "“Би ийм л хүн” гэж зөвтгөдөг.", options: OPTIONS,
      i18n: { en: { text: "I justify myself with \"this is just who I am.\"" }, ja: { text: "「自分はこういう人間だ」と正当化する。" }, ko: { text: "\"나는 원래 이런 사람이야\"라며 정당화한다." } } },
    { id: "q28", text: "Өөрчлөгдөх сонирхол багатай.", options: OPTIONS,
      i18n: { en: { text: "I have little interest in changing." }, ja: { text: "変わることへの興味が少ない。" }, ko: { text: "변화에 대한 관심이 적다." } } },
  ],
  bands: [
    // ✅ 5 оноотой болсон тул max = 28 * 5 = 140
    // Ангиллын босгыг 140 дээр суурилууллаа:
    // 113–140 (0.81+), 85–112 (0.61+), 56–84 (0.40+), 28–55 (0.0+)
    {
      minPct: 113 / 140,
      title: "Хүчтэй токсик хэв маяг",
      summary:
        "Энд гарч ирж байгаа зураг бол “хааяа нэг эвгүй ааш” биш — харилцааг системтэйгээр хүнд болгодог давтамж өндөр хэв маяг байна. Хяналт тавих, бурууг бусдад түлхэх, сэтгэл хөдлөлөөр шахах, хил зөрчих зэрэг нь олон хэсэгт давхцаж илэрч байгаа магадлалтай. Ийм үед нөгөө тал айдас/сэрэмжтэй болж, юм ярихаа болих, нуух, эсвэл бүр эсрэгээрээ дэлбэрэх хэлбэрээр хамгаалалт үүсдэг. Чиний хувьд өөрийгөө зөвтгөх, “би ингэхээс өөр аргагүй” гэж бодох бодол амархан орж ирдэг байж мэднэ — гэхдээ гадаад талаасаа энэ нь бусдад шахалт, дарамт, үл хүндлэл мэт мэдрэгддэг. Энэ түвшин дээр хамгийн том эрсдэл нь: харилцаа өөрөө асуудал биш, харин ‘хүн айдаг орчин’ болж хувирах явдал.",
      tips: [],
      i18n: {
        en: {
          title: "Strongly toxic pattern",
          summary: "What appears here isn't an occasional \"bad mood\" — it's a high-frequency pattern that systematically makes relationships harmful. Controlling behavior, blame-shifting, emotional pressuring, and boundary violations likely overlap across many areas. In response, the other side becomes fearful/wary and shuts down, hides things, or even erupts in the opposite direction as a defense. You may easily slip into justifying yourself with \"I have no choice but to act this way\" — but from the outside, this reads as pressure, intimidation, and disrespect to others. The biggest risk at this level: the relationship itself isn't the problem — it's becoming \"an environment people fear.\"",
          tips: [],
        },
        ja: {
          title: "強い毒性パターン",
          summary: "ここに現れているのは「時々の機嫌の悪さ」ではなく、関係を体系的に有害にする高頻度のパターンです。支配的行動、責任転嫁、感情的な圧力、境界線の侵害などが多くの領域で重なって現れている可能性があります。このような時、相手は恐れや警戒心を持つようになり、話すのをやめる、隠す、あるいは逆に爆発するという防御反応が生まれます。あなた自身は「こうするしかない」と自分を正当化する考えが容易に入ってくるかもしれませんが、外から見るとこれは他人への圧力、威圧、無礼として感じられます。このレベルでの最大のリスクは、関係そのものが問題ではなく「人が恐れる環境」に変わってしまうことです。",
          tips: [],
        },
        ko: {
          title: "강한 독성 패턴",
          summary: "여기 나타난 것은 \"가끔의 안 좋은 기분\"이 아니라 관계를 체계적으로 해롭게 만드는 고빈도 패턴입니다. 통제 행동, 책임 전가, 감정적 압박, 경계 침해 등이 여러 영역에서 겹쳐 나타날 가능성이 높습니다. 이럴 때 상대는 두려움/경계심을 갖게 되어 말을 멈추거나, 숨기거나, 오히려 정반대로 폭발하는 방어 반응을 보입니다. 당신 자신은 \"이렇게 할 수밖에 없다\"며 자신을 정당화하는 생각이 쉽게 들 수 있지만, 외부에서 보면 이는 타인에게 압박, 위협, 무례함으로 느껴집니다. 이 수준에서 가장 큰 위험은 관계 자체가 문제가 아니라 '사람들이 두려워하는 환경'으로 변하는 것입니다.",
          tips: [],
        },
      },
    },
    {
      minPct: 85 / 140,
      title: "Тодорхой токсик хандлага",
      summary:
        "Чамд эрүүл талууд байгаа ч тодорхой нөхцөлд токсик хэв маяг тогтмол асдаг зураг харагдаж байна. Ихэвчлэн маргаан, хардалт, үл ойлгогдох мэдрэмж, нэр төрийн асуудал, ядаргаа зэрэг үед хяналт тавих, хатуу үг хэлэх, өнгөрснийг сөхөх, буруутгах зэрэг хариу гарах магадлал өсдөг. Нөгөө талын хувьд “яг одоо юу хэлбэл буруудах бол” гэж бодож эхлэх нь элбэг — энэ нь харилцааны дулааныг алдуулдаг. Чи өөрийгөө “үнэнээ л хэлж байна” гэж мэдрэх үе бий, гэхдээ хэлбэр нь хурц болоод ирэхээр утга нь хүртэл хүнд хүрч, харилцаа сэргэхэд удаан болдог төрөл.",
      tips: [],
      i18n: {
        en: {
          title: "Clearly toxic tendencies",
          summary: "You have healthy sides, but in certain conditions toxic patterns reliably switch on. Usually during arguments, suspicion, feeling misunderstood, pride-related issues, or exhaustion, the likelihood rises of controlling, speaking harshly, digging up the past, or blaming. The other side often starts thinking \"what can I even say right now without being blamed\" — which drains the warmth out of the relationship. There are times you feel you're \"just telling the truth,\" but once the delivery turns sharp, even true things land hard, and it takes a while for the relationship to recover.",
          tips: [],
        },
        ja: {
          title: "明確な毒性傾向",
          summary: "あなたには健全な面もありますが、特定の状況では毒性パターンが確実に作動する様子が見られます。たいてい口論、疑い、誤解されていると感じる時、面子の問題、疲労の時に、支配、厳しい言葉、過去の掘り返し、責めることの可能性が高まります。相手は「今何を言っても責められるのでは」と考え始めることが多く、これが関係の温かさを失わせます。あなた自身は「ただ本当のことを言っているだけ」と感じる時がありますが、言い方が鋭くなると本当のことでも相手に重く響き、関係の回復に時間がかかるタイプです。",
          tips: [],
        },
        ko: {
          title: "분명한 독성 경향",
          summary: "당신에게는 건강한 면이 있지만, 특정 상황에서는 독성 패턴이 꾸준히 켜지는 모습이 보입니다. 보통 다툼, 의심, 오해받는다는 느낌, 자존심 문제, 피로 시에 통제, 거친 말, 과거를 들추기, 비난할 가능성이 높아집니다. 상대는 \"지금 무슨 말을 해도 비난받을까\"라고 생각하기 시작하는 경우가 많아, 이는 관계의 온기를 잃게 합니다. 당신 자신은 \"그냥 진실을 말하고 있다\"고 느낄 때가 있지만, 말투가 날카로워지면 진실조차 상대에게 무겁게 다가가고 관계 회복에 시간이 오래 걸리는 유형입니다.",
          tips: [],
        },
      },
    },
    {
      minPct: 56 / 140,
      title: "Зарим токсик шинж илэрч магадгүй",
      summary:
        "Ерөнхийдөө харьцангуй боломжийн ч тодорхой хэдэн зуршил давтагддаг байх магадлалтай. Жишээ нь: гомдож дуугүй болох, хардалт ихдэх, нэг асуудлыг хаахгүй удаан сөхөх, эсвэл “чи ийм байх ёстой” гэж дотроо шаардлага тавих гэх мэт. Энэ нь бусдад шууд айдас төрүүлдэг түвшин биш байж болох ч “ядаргаатай дарамт”, “байнга буруу болж таардаг” мэдрэмж хуримтлуулдаг. Чи харилцаагаа сүйтгэхийг хүсээгүй ч — буруу хэлбэртэй хамгаалалт гараад байдаг зураг л гэсэн үг.",
      tips: [],
      i18n: {
        en: {
          title: "Some toxic traits may appear",
          summary: "Overall relatively reasonable, but a few specific habits likely repeat. For example: going silent when hurt, increasing suspicion, dragging out a single issue without closing it, or inwardly demanding \"you should be this way.\" This may not reach a level that directly causes fear in others, but it builds up a feeling of \"exhausting pressure\" and \"always ending up at fault.\" You don't want to harm the relationship — it's simply that defenses come out in the wrong form.",
          tips: [],
        },
        ja: {
          title: "一部の毒性特徴が現れるかもしれません",
          summary: "全体的には比較的妥当ですが、いくつかの特定の習慣が繰り返される可能性があります。例えば：傷ついて黙り込む、疑いが増す、一つの問題をなかなか終わらせない、あるいは内心で「あなたはこうあるべきだ」と要求するなど。これは他人に直接恐怖を与えるレベルではないかもしれませんが、「疲れる圧力」「いつも自分が悪くなる」という感覚を積み重ねます。あなたは関係を壊したいわけではなく、防御が間違った形で現れているだけということです。",
          tips: [],
        },
        ko: {
          title: "일부 독성 특성이 나타날 수 있음",
          summary: "전반적으로 비교적 괜찮지만, 몇 가지 특정 습관이 반복될 가능성이 있습니다. 예를 들어: 서운하면 침묵하기, 의심이 늘어나기, 한 가지 문제를 끝내지 못하고 오래 들추기, 또는 속으로 \"너는 이래야 해\"라고 요구하기 등입니다. 이는 다른 사람에게 직접 두려움을 주는 수준은 아닐 수 있지만 '지치는 압박', '항상 내가 잘못한 것처럼 느껴지는' 감정을 쌓이게 합니다. 당신은 관계를 망치려는 것이 아니지만, 방어가 잘못된 형태로 나오고 있다는 뜻입니다.",
          tips: [],
        },
      },
    },
    {
      minPct: 0,
      title: "Токсик хэв маяг бага",
      summary:
        "Чиний хариултуудаас харахад харилцаанд хор хүргэх хэв маяг бага илэрч байна. Чи ихэнхдээ бусдын хил хязгаарыг хүндэлдэг, өөрийнхөөрөө тулгах шаардлага бага, маргааны дараа ч эвлэрэл/засах талаас хардаг байх боломж өндөр. Мэдээж хүн бүрт хүнд өдөр, бухимдал байдаг — гэхдээ ерөнхий чигээрээ чиний харилцааны суурь “айдас төрүүлэх” биш, “ойлголцуулах” талдаа байна.",
      tips: [],
      i18n: {
        en: {
          title: "Low toxic pattern",
          summary: "Your answers suggest harmful relationship patterns appear rarely. You mostly respect others' boundaries, rarely insist on having your own way, and are likely to look toward reconciliation/repair even after an argument. Of course everyone has hard days and frustration — but overall, your relational foundation leans toward \"fostering understanding,\" not \"causing fear.\"",
          tips: [],
        },
        ja: {
          title: "毒性パターンが少ない",
          summary: "あなたの回答からは、関係を害するパターンがほとんど現れていません。あなたはたいてい他人の境界線を尊重し、自分のやり方を押し付けることが少なく、口論の後でも和解・修復を志向する可能性が高いです。もちろん誰にも辛い日や苛立ちはありますが、全体的にあなたの関係の基盤は「恐れを生む」よりも「理解を育む」方向にあります。",
          tips: [],
        },
        ko: {
          title: "독성 패턴이 적음",
          summary: "당신의 답변을 보면 관계를 해치는 패턴이 거의 나타나지 않습니다. 당신은 대부분 다른 사람의 경계를 존중하고, 자신의 방식을 강요하는 일이 적으며, 다툰 후에도 화해/회복을 지향할 가능성이 높습니다. 물론 누구에게나 힘든 날과 짜증이 있지만, 전반적으로 당신의 관계 기반은 '두려움을 만드는' 것보다 '이해를 키우는' 방향에 있습니다.",
          tips: [],
        },
      },
    },
  ],
};
