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

export const listening: TestDefinition = {
  id: "listening",
  slug: "listening",
  title: "Сонсох чадвар тест",
  subtitle: "10 асуулт · харилцаа",
  description:
    "Ярилцлагад сонсох байр сууриа хэр барьдаг вэ — тэвчээр, анхаарал, ойлголтын чанарыг ерөнхийд нь харуулна.",
  i18n: {
    en: {
      title: "Listening Skills Test",
      subtitle: "10 questions · relationships",
      description: "Shows how well you maintain a listening stance in conversation — patience, attention, and quality of understanding.",
    },
    ja: {
      title: "聞く力テスト",
      subtitle: "10問・人間関係",
      description: "会話で聞く姿勢をどれだけ保てるか — 忍耐、注意力、理解の質を全体的に示します。",
    },
    ko: {
      title: "경청 능력 테스트",
      subtitle: "10문항 · 관계",
      description: "대화에서 듣는 자세를 얼마나 유지하는지 — 인내심, 주의력, 이해의 질을 전반적으로 보여줍니다.",
    },
  },
  questions: [
    { id: "q1", text: "Яригч нь таслалгүйгээр дуусгах боломж өгдөг.", options: OPTIONS,
      i18n: { en: { text: "I let the speaker finish without interrupting." }, ja: { text: "話し手を遮らずに最後まで話させる。" }, ko: { text: "말하는 사람이 끊김 없이 끝낼 수 있게 한다." } } },
    { id: "q2", text: "Сонсож байхад зөвлөгөө өгөхөөсөө өмнө юу мэдэрч байгааг нь асуудаг.", options: OPTIONS,
      i18n: { en: { text: "Before giving advice, I ask how they're feeling." }, ja: { text: "アドバイスする前に、何を感じているか聞く。" }, ko: { text: "조언하기 전에 어떤 감정인지 먼저 묻는다." } } },
    { id: "q3", text: "“Чи тэгээд … гэж ойлголоо зөв үү?” гэж баталгаажуулж чаддаг.", options: OPTIONS,
      i18n: { en: { text: "I can confirm with \"so you mean... right?\"" }, ja: { text: "「つまり…ということ？」と確認できる。" }, ko: { text: "\"그러니까... 맞아?\"라고 확인할 수 있다." } } },
    { id: "q4", text: "Утас/анхаарал сарниулагчгүйгээр бүрэн анхаарч чаддаг.", options: OPTIONS,
      i18n: { en: { text: "I can give full attention without phone/distractions." }, ja: { text: "携帯など気を散らすものなく、完全に集中できる。" }, ko: { text: "휴대폰 등 방해 없이 완전히 집중할 수 있다." } } },
    { id: "q5", text: "Өөрийнхөөрөө дүгнэхээс илүүтэй эхлээд ойлгохыг хичээдэг.", options: OPTIONS,
      i18n: { en: { text: "I try to understand first rather than jump to judgment." }, ja: { text: "決めつけるより先に理解しようとする。" }, ko: { text: "판단하기보다 먼저 이해하려고 노력한다." } } },
    { id: "q6", text: "Маргаан үед ч сонсох байр сууриа барьж чаддаг.", options: OPTIONS,
      i18n: { en: { text: "I can keep listening even during an argument." }, ja: { text: "口論の時でも聞く姿勢を保てる。" }, ko: { text: "다툴 때도 경청하는 자세를 유지할 수 있다." } } },
    { id: "q7", text: "Нөгөө хүний үгийг өөрөөр нь давтаж ойлгуулж өгдөг.", options: OPTIONS,
      i18n: { en: { text: "I paraphrase the other person's words to show understanding." }, ja: { text: "相手の言葉を自分の言葉で言い換えて伝える。" }, ko: { text: "상대방의 말을 내 표현으로 바꾸어 전달한다." } } },
    { id: "q8", text: "Ярианы сүүлд “надад одоо надаас юу хэрэгтэй вэ?” гэж асуудаг.", options: OPTIONS,
      i18n: { en: { text: "At the end I ask \"what do you need from me right now?\"" }, ja: { text: "話の終わりに「今、私に何を必要としている？」と聞く。" }, ko: { text: "대화 끝에 \"지금 내게 무엇이 필요해?\"라고 묻는다." } } },
    { id: "q9", text: "Шүүмжилж эхлэх үед хамгаалах биш сонсохыг хичээдэг.", options: OPTIONS,
      i18n: { en: { text: "When criticized, I try to listen rather than get defensive." }, ja: { text: "批判され始めても防御せず聞こうとする。" }, ko: { text: "비판이 시작될 때 방어하지 않고 들으려 한다." } } },
    { id: "q10", text: "Хүмүүс “чи сайн сонсдог” гэж хэлдэг.", options: OPTIONS,
      i18n: { en: { text: "People tell me \"you're a good listener.\"" }, ja: { text: "人々は「よく話を聞いてくれる」と言う。" }, ko: { text: "사람들은 \"너는 잘 들어줘\"라고 말한다." } } },
  ],
  bands: [
    {
      minPct: 0.9,
      title: "Өндөр чанартай сонсогч",
      summary:
        "Чи “үг сонсох”-оос илүү “хүн сонсох” хэв маягтай байна. Яригчийн гол санааг таслалгүй авч, өөрийн дүгнэлтийг түр хойш тавьж чаддаг төрлийн хүн шиг харагдаж байна. Ийм сонсгол нь хүмүүсийг тайвшруулж, асуудлаа эмхэлж ойлгоход нь тусалдаг. Чамтай ярилцсаны дараа хүмүүс “намайг ойлголоо” гэж мэдрэх магадлал өндөр. Ерөнхий зураг: анхаарал, тэвчээр, баталгаажуулалт сайн.",
      tips: [],
      i18n: {
        en: {
          title: "High-quality listener",
          summary: "You have a style of \"listening to the person,\" not just \"listening to words.\" You seem like the type who can take in the speaker's main point without interrupting and set your own judgments aside. This kind of listening calms people and helps them organize their thoughts. After talking with you, people likely feel \"understood.\" Overall: strong attention, patience, and confirmation.",
          tips: [],
        },
        ja: {
          title: "質の高い聞き手",
          summary: "あなたは「言葉を聞く」より「人を聞く」スタイルを持っています。話し手の要点を遮らずに受け取り、自分の判断を一旦置いておけるタイプのようです。このような聞き方は人を落ち着かせ、考えを整理する助けになります。あなたと話した後、人々は「理解してもらえた」と感じる可能性が高いです。全体像：注意力、忍耐力、確認力に優れています。",
          tips: [],
        },
        ko: {
          title: "높은 수준의 경청자",
          summary: "당신은 \"말을 듣는\" 것보다 \"사람을 듣는\" 스타일을 가지고 있습니다. 말하는 사람의 핵심을 끊지 않고 받아들이고 자신의 판단을 잠시 미룰 수 있는 유형으로 보입니다. 이런 경청은 사람들을 편안하게 하고 생각을 정리하도록 돕습니다. 당신과 이야기한 후 사람들은 '이해받았다'고 느낄 가능성이 높습니다. 전반적으로 주의력, 인내심, 확인 능력이 뛰어납니다.",
          tips: [],
        },
      },
    },
    {
      minPct: 0.78,
      title: "Сайн сонсдог, найдвартай",
      summary:
        "Ерөнхийдөө сайн байна. Чи ихэнх үед яриаг таслахгүй, анхааралтай сонсохыг хичээдэг, хүний санааг буруу ойлгосон бол засах боломж олгодог талтай. Зарим үед (ядарсан, хугацаа шахсан, өөрөө стресстэй үед) төвлөрөл сарних, эсвэл зөвлөгөө рүү түргэн орох хандлага гарч болох ч нийт дүнгээрээ сонсох суурь чинь боломжийн бат бөх байна.",
      tips: [],
      i18n: {
        en: {
          title: "Good listener, reliable",
          summary: "Overall good. Most of the time you don't interrupt and try to listen attentively, and you give room for correction if you misunderstand. At times (tired, rushed, stressed) attention may drift or you may jump to advice too quickly, but on the whole your listening foundation is reasonably solid.",
          tips: [],
        },
        ja: {
          title: "よく聞く、信頼できる",
          summary: "全体的に良好です。あなたはほとんどの場合話を遮らず注意深く聞こうとし、誤解があれば修正の機会を与える面があります。時々（疲れている、時間に追われている、ストレスがある時）注意が散ったり、すぐにアドバイスに走る傾向が出ることもありますが、総じて聞く基盤はかなり安定しています。",
          tips: [],
        },
        ko: {
          title: "잘 듣고 신뢰할 수 있음",
          summary: "전반적으로 좋습니다. 대부분의 경우 말을 끊지 않고 주의 깊게 들으려 하며, 오해가 있으면 바로잡을 기회를 줍니다. 때때로(피곤하거나, 시간에 쫓기거나, 스트레스를 받을 때) 주의가 흐트러지거나 조언으로 빨리 넘어가는 경향이 나타날 수 있지만, 전체적으로 경청의 기반은 꽤 견고합니다.",
          tips: [],
        },
      },
    },
    {
      minPct: 0.6,
      title: "Холимог сонсгол — нөхцөлөөс хамаардаг",
      summary:
        "Сонсох чадвар чинь тогтвортой биш, нөхцөлөөс их шалтгаалдаг зураг байна. Зарим ярианд чи сайн төвлөрч, ойлгож чаддаг бол зарим үед хурдан дүгнэх, яриаг өөр тийш эргүүлэх, эсвэл зөвлөгөө/шийдэл рүү түрүүлэх тал ажиглагдаж магадгүй. Энэ нь ихэвчлэн анхаарал сарних, ядрах, эсвэл тухайн сэдэв чамд өөрийн сэтгэл хөдлөлийг хөдөлгөдөг үед илүү гардаг нийтлэг хэлбэр. Ерөнхий дүр зураг: боломжийн ч “тогтвортой сайн сонсогч” болоход зай байна.",
      tips: [],
      i18n: {
        en: {
          title: "Mixed listening — depends on the situation",
          summary: "Your listening isn't consistent and depends heavily on the situation. In some conversations you focus and understand well, but at other times you may jump to conclusions quickly, steer the conversation elsewhere, or rush to advice/solutions. This is a common pattern that shows up more when attention drifts, you're tired, or the topic stirs your own emotions. Overall: decent, but there's room to become a \"consistently good listener.\"",
          tips: [],
        },
        ja: {
          title: "混在した聞き方 — 状況に左右される",
          summary: "あなたの聞く力は一貫しておらず、状況に大きく左右される様子です。ある会話では集中してよく理解できる一方、別の時には早く結論を出したり、話を別の方向に変えたり、アドバイスや解決策に急いでしまう面が見られるかもしれません。これは注意が散る時、疲れている時、あるいは話題が自分の感情を動かす時に多く見られる一般的なパターンです。全体像：悪くはありませんが、「一貫して良い聞き手」になるにはまだ余地があります。",
          tips: [],
        },
        ko: {
          title: "혼합된 경청 — 상황에 따라 다름",
          summary: "당신의 경청 능력은 일관되지 않고 상황에 크게 좌우되는 모습입니다. 어떤 대화에서는 잘 집중하고 이해하지만, 다른 때에는 빠르게 결론을 내리거나, 대화를 다른 방향으로 돌리거나, 조언/해결책으로 서둘러 넘어가는 면이 보일 수 있습니다. 이는 주의가 흐트러지거나, 피곤하거나, 그 주제가 자신의 감정을 건드릴 때 더 자주 나타나는 흔한 패턴입니다. 전반적으로 괜찮지만, '일관되게 좋은 경청자'가 되기에는 여지가 있습니다.",
          tips: [],
        },
      },
    },
    {
      minPct: 0.4,
      title: "Сонсгол сул — таслах/шийдэх тал давамгайрах үе олон",
      summary:
        "Энд бол сонсохоос илүү “түргэн хариулах”, “зөвлөгөө өгөх”, “өөрийн санаагаа хэлэх” тал арай давамгай харагдаж байна. Нөгөө хүн яриагаа дуусгахгүй байх, эсвэл яг юу мэдэрч байгаагаа бүрэн хэлж амжилгүй үлдэх магадлалтай. Төвлөрөл алдагдах, утас/анхаарал сарних нөлөөтэй үед энэ улам тод мэдрэгддэг. Ерөнхий зураг: хүнтэй ярьсны дараа “мэдрэмжээ хэлж чадсангүй” гэж нөгөө талд үлдэх боломж байна.",
      tips: [],
      i18n: {
        en: {
          title: "Weak listening — interrupting/deciding dominates often",
          summary: "Here, \"responding quickly,\" \"giving advice,\" and \"voicing your own opinion\" tend to dominate over listening. The other person may often not get to finish, or be left unable to fully say what they're feeling. This becomes more pronounced when focus is lost or distractions (phone, etc.) are present. Overall: after talking with you, the other side may be left feeling \"I couldn't say what I felt.\"",
          tips: [],
        },
        ja: {
          title: "聞く力が弱い — 遮る・決めつける面が優勢な時が多い",
          summary: "ここでは聞くことより「すぐに答える」「アドバイスする」「自分の意見を言う」面がやや優勢に見られます。相手が話を終えられない、あるいは本当に感じていることを十分に言えないまま終わる可能性があります。集中が切れる、携帯など気が散る影響がある時にこれがより顕著になります。全体像：あなたと話した後、相手が「気持ちを言えなかった」と感じる可能性があります。",
          tips: [],
        },
        ko: {
          title: "약한 경청 — 끼어들기/결정하기가 우세한 경우가 많음",
          summary: "여기서는 듣기보다 \"빠르게 대답하기\", \"조언하기\", \"자기 의견 말하기\"가 다소 우세하게 나타납니다. 상대방이 말을 끝내지 못하거나, 정말 느끼는 것을 충분히 말하지 못한 채로 끝날 가능성이 있습니다. 집중이 흐트러지거나 휴대폰 등 방해 요소가 있을 때 더 두드러집니다. 전반적으로 당신과 이야기한 후 상대방은 '내 감정을 말하지 못했다'고 느낄 수 있습니다.",
          tips: [],
        },
      },
    },
    {
      minPct: 0.0,
      title: "Одоогоор сонсох нь хэцүү үе",
      summary:
        "Одоогийн хариултуудаас харахад сонсох байр суурь барих нь чамд яг одоо хэцүү байгаа мэт. Ихэнх яриа хурдан залхаах, анхаарал тарах, эсвэл дотроо өөр асуудал явж байгаагаас болж хүнийг “дагуулж сонсох” энерги хүрэхгүй үе байж магадгүй. Энэ нь зан чанарын “муу/сайн” дүгнэлт биш — тухайн үеийн ачаалал, дотоод байдал сонсголд шууд нөлөөлдөг. Ерөнхий зураг: яриа дундаа таслах, түргэн шийдэх, хамгаалах хэлбэр ажиглагдах магадлал өндөр.",
      tips: [],
      i18n: {
        en: {
          title: "Listening is hard right now",
          summary: "Your current answers suggest maintaining a listening stance is genuinely hard for you right now. Most conversations may tire you quickly, your attention may scatter, or you may simply lack the energy to \"follow and listen\" because of something else going on inside. This isn't a \"good/bad\" character verdict — current load and inner state directly affect listening. Overall: interrupting mid-conversation, deciding quickly, or getting defensive is likely to show up often.",
          tips: [],
        },
        ja: {
          title: "今は聞くことが難しい時期",
          summary: "現在の回答からは、聞く姿勢を保つことが今のあなたにとって本当に難しいようです。ほとんどの会話で早く疲れてしまったり、注意が散ったり、あるいは内面で何か他のことが進行しているために人に「ついて聞く」エネルギーが足りない時かもしれません。これは性格の「良い/悪い」の判定ではなく、その時の負担、内的状態が聞くことに直接影響します。全体像：会話の途中で遮る、早く決める、防御する形が多く見られる可能性が高いです。",
          tips: [],
        },
        ko: {
          title: "지금은 경청이 어려운 시기",
          summary: "현재 답변을 보면 경청하는 자세를 유지하는 것이 지금 당신에게 정말 어려운 것 같습니다. 대부분의 대화에서 빨리 지치거나, 주의가 흩어지거나, 내면에서 다른 일이 진행되고 있어서 사람을 '따라가며 듣는' 에너지가 부족한 시기일 수 있습니다. 이는 성격의 '좋다/나쁘다'는 판단이 아니라, 그 시기의 부담과 내적 상태가 경청에 직접 영향을 미치는 것입니다. 전반적으로 대화 중에 끼어들거나, 빨리 결정하거나, 방어하는 모습이 자주 나타날 가능성이 높습니다.",
          tips: [],
        },
      },
    },
  ],
};
