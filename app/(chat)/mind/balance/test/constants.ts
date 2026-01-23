export type BalanceDomain = "emotion" | "self" | "relations" | "purpose" | "selfCare" | "life";

export const DOMAIN_LABELS: Record<BalanceDomain, string> = {
  emotion: "Сэтгэл санаа",
  self: "Өөрийгөө ойлгох",
  relations: "Харилцаа",
  purpose: "Зорилго, утга учир",
  selfCare: "Өөрийгөө хайрлах",
  life: "Тогтвортой байдал",
};

// ✅ Дараа чи жинхэнэ app-уудын нэр/route-ыг тааруулж өөрчилнө.
// Одоохондоо “жишээ” байдлаар хийж өгч байна.
export const DOMAIN_DAILY_APP_SUGGESTION: Record<BalanceDomain, { title: string; hint: string }> = {
  emotion: { title: "Өдөр тутам: Амьсгал / Тайвшруулах богино дасгал", hint: "2–3 минут, өдөрт 1–2 удаа" },
  self: { title: "Өдөр тутам: Өөрийгөө ажиглах (тэмдэглэл)", hint: "Өнөөдөр юу мэдрэв? Яагаад?" },
  relations: { title: "Өдөр тутам: Харилцааны жижиг дадал", hint: "Сонсох → ойлгосноо буцаан хэлэх" },
  purpose: { title: "Өдөр тутам: 1 жижиг алхам", hint: "Зорилгоо 10 минут урагшлуул" },
  selfCare: { title: "Өдөр тутам: Өөртөө эелдэг үг", hint: "Өөрийгөө шүүмжлэхгүйгээр дэмж" },
  life: { title: "Өдөр тутам: Амьдралын 1 хэвшил", hint: "Алхалт / нойр / хоол / санхүүгээ 1 зүйлээр сайжруул" },
};

export function scoreBand(score: number) {
  if (score >= 80) return { label: "Сайн", note: "Энэ чиглэл тогтвортой байна." };
  if (score >= 60) return { label: "Дунд", note: "Сайжруулах жижиг алхам хэрэгтэй." };
  if (score >= 40) return { label: "Анхаарах", note: "Тогтмол дадал хэрэгтэй байна." };
  return { label: "Яаралтай дэмжлэг", note: "Ойрын үед анхаарал тавьж эхэлье." };
}
