"use client";

import * as React from "react";

export default function BoundariesPracticePage() {
  const [text, setText] = React.useState("");

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Хил хязгаарын дасгал</h1>
      <p className="mt-2 text-sm opacity-80">
        Хил тогтооно гэдэг нь хүйтэн байх биш, өөрийгөө хамгаалах юм.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium">
            Сүүлийн үед хил алдагдсан нэг нөхцөл
          </label>
          <textarea
            className="mt-1 w-full rounded-xl border p-3"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ж: би дуугүй байсаар зөвшөөрсөн..."
          />
        </div>

        <div className="rounded-xl border p-4">
          <p className="text-sm opacity-80">Ингэж хэлж болох байсан:</p>
          <p className="mt-2">
            “Одоо надад энэ тохиромжгүй байна. Дараа ярья.”
          </p>
        </div>
      </div>
    </div>
  );
}
