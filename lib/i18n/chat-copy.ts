import type { Locale } from "./config";

type ChatCopy = {
  title: string;
  subtitle: string;
  starters: string[];
  privacy: string;
  private: string;
  public: string;
  privateDescription: string;
  publicDescription: string;
  attach: string;
  stop: string;
  tools: string;
  history: string;
  placeholder: string;
};

export const chatCopy: Record<Locale, ChatCopy> = {
  mn: {
    title: "Өнөөдөр юу ярилцмаар байна?",
    subtitle: "Бодол, мэдрэмжээ өөрийн хэмнэлээр хуваалцаарай.",
    starters: [
      "Бодлоо цэгцлэх",
      "Мэдрэмжээ ярилцах",
      "Хаанаас эхлэхээ мэдэхгүй байна",
    ],
    privacy: "Яриагаа хуваалцах эсэхээ та шийднэ.",
    private: "Хувийн",
    public: "Хуваалцсан",
    privateDescription: "Энэ яриаг зөвхөн та үзэх боломжтой.",
    publicDescription: "Холбоостой хүн бүр энэ яриаг унших боломжтой болно.",
    attach: "Зураг хавсаргах",
    stop: "Хариултыг зогсоох",
    tools: "Амар мэню",
    history: "Миний яриа",
    placeholder: "Эндээс яриагаа эхлээрэй…",
  },
  en: {
    title: "What would you like to talk about?",
    subtitle: "Share your thoughts and feelings at your own pace.",
    starters: [
      "Organize my thoughts",
      "Talk about my feelings",
      "I’m not sure where to begin",
    ],
    privacy: "You choose whether to share your conversation.",
    private: "Private",
    public: "Shared",
    privateDescription: "Only you can access this conversation.",
    publicDescription:
      "Anyone with the link will be able to read this conversation.",
    attach: "Attach an image",
    stop: "Stop response",
    tools: "Tools",
    history: "My conversations",
    placeholder: "Start your conversation here…",
  },
  ja: {
    title: "今日は何を話しましょうか？",
    subtitle: "自分のペースで考えや気持ちを話してください。",
    starters: [
      "考えを整理したい",
      "気持ちを話したい",
      "何から始めればよいかわからない",
    ],
    privacy: "会話を共有するかどうかは自分で決められます。",
    private: "非公開",
    public: "共有中",
    privateDescription: "この会話はあなただけが閲覧できます。",
    publicDescription: "リンクを持つ人がこの会話を読めるようになります。",
    attach: "画像を添付",
    stop: "応答を停止",
    tools: "ツール",
    history: "会話履歴",
    placeholder: "ここから会話を始めましょう…",
  },
  ko: {
    title: "오늘은 어떤 이야기를 나눌까요?",
    subtitle: "편안한 속도로 생각과 감정을 나눠 보세요.",
    starters: [
      "생각 정리하기",
      "감정 이야기하기",
      "어디서 시작할지 모르겠어요",
    ],
    privacy: "대화 공유 여부는 직접 결정할 수 있어요.",
    private: "비공개",
    public: "공유됨",
    privateDescription: "나만 이 대화를 볼 수 있어요.",
    publicDescription: "링크를 가진 누구나 이 대화를 읽을 수 있게 됩니다.",
    attach: "이미지 첨부",
    stop: "응답 중지",
    tools: "도구",
    history: "내 대화",
    placeholder: "여기서 대화를 시작하세요…",
  },
  ru: {
    title: "О чём хотите поговорить сегодня?",
    subtitle: "Делитесь мыслями и чувствами в удобном для вас темпе.",
    starters: [
      "Разобраться в мыслях",
      "Поговорить о чувствах",
      "Не знаю, с чего начать",
    ],
    privacy: "Вы решаете, делиться ли беседой.",
    private: "Личная",
    public: "По ссылке",
    privateDescription: "Только вы можете просматривать эту беседу.",
    publicDescription:
      "Любой, у кого есть ссылка, сможет прочитать эту беседу.",
    attach: "Прикрепить изображение",
    stop: "Остановить ответ",
    tools: "Инструменты",
    history: "Мои беседы",
    placeholder: "Начните беседу здесь…",
  },
};
