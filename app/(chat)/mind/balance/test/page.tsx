"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const BRAND = "#1F6FB2";

// Чиний явуулсан тестийн агуулгыг багануудаар бүлэглэв
const SECTIONS = [
  {
    title: "🎯 Зорилго, утга учир",
    key: "goal",
    questions: [
      "Би амьдралдаа тодорхой зорилготой.",
      "Өдөр тутмын хийж буй зүйл маань утгатай санагддаг.",
      "Би ирээдүйнхээ төлөө идэвхтэй алхам хийдэг.",
      "Би өөрийгөө хөгжүүлэхэд цаг гаргадаг.",
      "Миний амьдралын том зорилго надад тодорхой.",
    ],
  },
  {
    title: "💰 Санхүү",
    key: "money",
    questions: [
      "Би орлого, зарлагаа хянаж чаддаг.",
      "Гэнэтийн зардалд бэлэн байдаг.",
      "Би санхүүгийнхээ талаар тайван байдаг.",
      "Би хуримтлалтай.",
      "Миний мөнгө миний амьдралд үйлчилдэг.",
    ],
  },
  {
    title: "🌍 Орчин",
    key: "life",
    questions: [
      "Миний амьдрах орчин надад таатай.",
      "Ажлын орчин минь дэмждэг.",
      "Би тайван орчинд амьдардаг.",
      "Миний эргэн тойрны хүмүүс намайг дэмждэг.",
      "Би өөрийн орчноо сайжруулах боломжтой.",
    ],
  },
  {
    title: "🏃‍♀️ Эрүүл мэнд",
    key: "body",
    questions: [
      "Би эрүүл мэнддээ анхаардаг.",
      "Би хангалттай унтаж амардаг.",
      "Би биеийн хөдөлгөөн тогтмол хийдэг.",
      "Би биеэ сонсож чаддаг.",
      "Би энергиэр дүүрэн байдаг.",
    ],
  },
];

const OPTIONS = [
  { v: 0, t: "Үгүй" },
  { v: 1, t: "Заримдаа" },
  { v: 2, t: "Дунд зэрэг" },
  { v: 3, t: "Ихэвчлэн" },
  { v: 4, t: "Тийм" },
];

export default function BalanceTest() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const set = (k: string, v: number) =>
    setAnswers((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    const total = Object.values(answers).reduce((a, b) => a + b, 0);

    await fetch("/api/balance-test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...answers, total }),
    });

    router.push("/mind/balance/result");
  };

  return (
    <div className="min-h-screen p-6 text-white" style={{ background: BRAND }}>
      <h1 className="text-2xl font-bold mb-4">🌈 Сэтгэлийн тэнцвэрийн тест</h1>

      {SECTIONS.map((sec) => (
        <div key={sec.key} className="mb-6">
          <h2 className="font-semibold mb-3">{sec.title}</h2>

          {sec.questions.map((q, i) => (
            <div key={i} className="mb-3">
              <p className="mb-1">{q}</p>
              <div className="flex gap-2 flex-wrap">
                {OPTIONS.map((o) => (
                  <button
                    key={o.v}
                    onClick={() => set(`${sec.key}-${i}`, o.v)}
                    className={`px-3 py-1 rounded border ${
                      answers[`${sec.key}-${i}`] === o.v
                        ? "bg-white text-[#1F6FB2]"
                        : "border-white"
                    }`}
                  >
                    {o.t}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}

      <button
        onClick={submit}
        className="mt-6 w-full bg-white text-[#1F6FB2] py-2 rounded font-semibold"
      >
        Дуусгах
      </button>
    </div>
  );
}
