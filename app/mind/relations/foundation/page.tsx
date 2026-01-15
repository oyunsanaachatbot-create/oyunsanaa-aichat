"use client";

import * as React from "react";

export default function RelationshipStylePage() {
  const [style, setStyle] = React.useState<string>("");

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Харилцааны өөрийн хэв маяг</h1>
      <p className="mt-2 text-sm opacity-80">
        Хүн бүр харилцаанд өөр өөрөөр ханддаг. Энэ бол шүүлт биш, өөрийгөө
        ойлгох оролдлого юм.
      </p>

      <div className="mt-6 space-y-3">
        {[
          "Ойр дотно байхдаа тайван байдаг",
          "Ойртохоор түгшдэг",
          "Хэт их анхаарал хэрэгтэй санагддаг",
          "Бие даахыг илүүд үздэг",
        ].map((q) => (
          <label
            key={q}
            className="flex items-center gap-3 rounded-xl border p-3 cursor-pointer"
          >
            <input
              type="radio"
              name="style"
              value={q}
              checked={style === q}
              onChange={() => setStyle(q)}
            />
            <span>{q}</span>
          </label>
        ))}
      </div>

      {style && (
        <div className="mt-6 rounded-xl border p-4">
          <p className="text-sm opacity-80">Чиний сонголт:</p>
          <p className="mt-1 font-medium">{style}</p>
          <p className="mt-2 text-sm">
            Энэ хэв маяг сайн/муу гэсэн ангилал биш. Гагцхүү чи харилцаанд
            яаж хариу үзүүлдгээ анзаарч эхэлж байна.
          </p>
        </div>
      )}
    </div>
  );
}
