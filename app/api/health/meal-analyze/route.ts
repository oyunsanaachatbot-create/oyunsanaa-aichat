// app/api/health/meal-analyze/route.ts
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { normalizeUploadedImage } from "@/lib/uploads/normalize-image";

export const runtime = "nodejs";

const mealSchema = z.object({
  calories: z.number(),
  proteinG: z.number(),
  goodCarbsG: z.number(),
  badCarbsG: z.number(),
  fatG: z.number(),
  fiberG: z.number(),
  sugarG: z.number(),
  nutritionScore: z.number(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    const name = (formData.get("name") as string | null) ?? "";

    if (!file && !name) {
      return NextResponse.json(
        { error: "Зураг эсвэл хоолны нэрийг оруулна уу" },
        { status: 400 }
      );
    }

    let imageUrl: string | undefined;
    if (file) {
      const normalizedFile = await normalizeUploadedImage(file);
      const buffer = Buffer.from(await normalizedFile.arrayBuffer());
      imageUrl = `data:image/jpeg;base64,${buffer.toString("base64")}`;
    }

    const textPrompt = `"${name || "энэ хоол"}" гэж нэрлэсэн хоол байна гэж үзээд, зураг байвал ашиглаад НЭГ ПОРЦЫН ойролцоо шим тэжээлийн задаргааг гарга (калори, уураг, сайн нүүрс ус, муу нүүрс ус, өөх тос, эслэг, сахар, 0-100 хоорондох шим тэжээлийн оноо).`;

    const content: any[] = [{ type: "text", text: textPrompt }];
    if (imageUrl) content.push({ type: "image", image: imageUrl });

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: mealSchema,
      messages: [{ role: "user", content }],
    });

    return NextResponse.json(object);
  } catch (err: any) {
    console.error("Meal analyze API error:", err);
    return NextResponse.json(
      {
        error: "Хоолны задаргаа хийхэд алдаа гарлаа",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
