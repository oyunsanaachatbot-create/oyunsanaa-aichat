import { NextResponse } from "next/server";

import { auth } from "@/app/(auth)/auth";

const POLICY_MESSAGE =
  "Таны хайсан сэдэвт тохирох, ашиглах эрх нь тодорхой тест одоогоор олдсонгүй.";

/**
 * Хуучин AI-generated тестүүдийг каталогт буцаахгүй. Стандарт тестийн
 * асуулт, scoring дүрмийг эх сурвалжгүйгээр шинээр зохиох нь найдвартай бус
 * бөгөөд лицензийн эрсдэлтэй.
 */
export async function GET() {
  const userId = (await auth())?.user?.id;
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ tests: [], message: POLICY_MESSAGE });
}

/**
 * Энэ endpoint өмнө нь хэрэглэгчийн хүсэлтээр шинэ тест зохиодог байсан.
 * Одоо зөвхөн эх сурвалж, ашиглах эрх, асуултын тоо болон scoring дүрэм нь
 * баталгаажсан тестийг publisher/catalog-оор оруулах зарчимтай.
 */
export async function POST() {
  const userId = (await auth())?.user?.id;
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json(
    { error: "verified_test_not_found", message: POLICY_MESSAGE },
    { status: 410 }
  );
}
