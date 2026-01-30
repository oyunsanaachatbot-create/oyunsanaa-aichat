import type { TestDefinition, TestOptionValue } from "../types";

const OPTIONS: Array<{ value: TestOptionValue; label: string }> = [
  { value: 1, label: "Бараг үгүй" },
  { value: 2, label: "Хааяа" },
  { value: 3, label: "Ихэвчлэн" },
  { value: 4, label: "Байнга" },
];

export const toxicBehavior: TestDefinition = {
  id: "toxic-behavior",
  slug: "toxic-behavior",
  title: "Токсик зан төлөв тест",
  subtitle: "28 асуулт · өөрийгөө ажиглах",
  description:
    "Харилцаанд бусдад хор хүргэдэг хэв маяг илэрч байгаа эсэхийг өөртөө үнэнээр шалгана.",
  questions: [
    // I. Хяналт ба захирах (4)
    { id: "q1", text: "Би бусдыг “зөв” замаар явахыг албаддаг.", options: OPTIONS },
    { id: "q2", text: "Минийхөөрөө л байх ёстой гэж дотроо боддог.", options: OPTIONS },
    { id: "q3", text: "Надаас өөрөөр шийдэхэд дургүйцдэг.", options: OPTIONS },
    { id: "q4", text: "Хэн нэгэн бие даан шийдвэл уур хүрдэг.", options: OPTIONS },

    // II. Бурууг бусад руу түлхэх (4)
    { id: "q5", text: "Асуудал болбол ихэвчлэн бусдыг буруутгадаг.", options: OPTIONS },
    { id: "q6", text: "“Чиний л буруу” гэж дотроо боддог.", options: OPTIONS },
    { id: "q7", text: "Алдаагаа хүлээн зөвшөөрөх хэцүү.", options: OPTIONS },
    { id: "q8", text: "Өөрийгөө хамгаалахын тулд үнэнийг мушгидаг.", options: OPTIONS },

    // III. Сэтгэл хөдлөлөөр шахах (4)
    { id: "q9", text: "Гомдож, дуугүй байж бусдыг гэмшүүлдэг.", options: OPTIONS },
    { id: "q10", text: "“Хэрэв чи тэгэхгүй бол…” гэж дарамталдаг.", options: OPTIONS },
    { id: "q11", text: "Уйлах, уурлах зэргээр хүнийг буулгаж авдаг.", options: OPTIONS },
    { id: "q12", text: "Өрөвдүүлэх байдлаар хүссэнээ авдаг.", options: OPTIONS },

    // IV. Хүндлэлгүй харилцах (4)
    { id: "q13", text: "Бусдыг доош нь хийх үг хэлдэг.", options: OPTIONS },
    { id: "q14", text: "Санаандгүй биш, зориуд хатуу ярьдаг.", options: OPTIONS },
    { id: "q15", text: "Хүний мэдрэмжийг “дэмий” гэж боддог.", options: OPTIONS },
    { id: "q16", text: "Шоглож, доромжилж хошигнодог.", options: OPTIONS },

    // V. Хил хязгаарыг үл хүндлэх (4)
    { id: "q17", text: "Хэн нэгэн “үгүй” гэвэл хүлээж авдаггүй.", options: OPTIONS },
    { id: "q18", text: "Хувийн орон зайг нь зөрчдөг.", options: OPTIONS },
    { id: "q19", text: "Бусдын цаг, хүчийг өөрийнх шиг ашигладаг.", options: OPTIONS },
    { id: "q20", text: "“Чи ингэх ёстой” гэж боддог.", options: OPTIONS },

    // VI. Харилцааг хордуулах зуршлууд (4)
    { id: "q21", text: "Өнгөрснийг дахин сөхөж шийтгэдэг.", options: OPTIONS },
    { id: "q22", text: "Хардалт, сэрдэлт их.", options: OPTIONS },
    { id: "q23", text: "Бусадтай харьцуулах, доош хийх.", options: OPTIONS },
    { id: "q24", text: "Санаатайгаар зай барьж шийтгэх.", options: OPTIONS },

    // VII. Хариуцлагаас зугтах (4)
    { id: "q25", text: "Маргааны дараа засах оролдлого хийдэггүй.", options: OPTIONS },
    { id: "q26", text: "Уучлалт гуйхаас зайлсхийдэг.", options: OPTIONS },
    { id: "q27", text: "“Би ийм л хүн” гэж зөвтгөдөг.", options: OPTIONS },
    { id: "q28", text: "Өөрчлөгдөх сонирхол багатай.", options: OPTIONS },
  ],
  bands: [
    // max 112
    // 28–44, 45–68, 69–88, 89–112
    { minPct: 89 / 112, title: "Хүчтэй токсик хэв маяг", summary: "Харилцаанд хортой зан төлөв хүчтэй илэрч байна.", tips: ["Хариуцлага хүлээх жижиг алхам: 1 удаа уучлалт хүсэх, 1 удаа засах үйлдэл хийх."] },
    { minPct: 69 / 112, title: "Тодорхой токсик хэв маяг", summary: "Тодорхой хэмжээнд токсик хандлага байна.", tips: ["Маргааны үед “ялах” биш “засах” зорилго тавь."] },
    { minPct: 45 / 112, title: "Зарим токсик хандлага", summary: "Зарим токсик зан илэрч магадгүй.", tips: ["Давтагддаг 1 зуршлаа сонгоод 7 хоног ажигла."] },
    { minPct: 0, title: "Бага", summary: "Токсик хэв маяг бага байна.", tips: ["Эрүүл харилцааны дадлуудаа тогтвортой хадгал."] },
  ],
};
