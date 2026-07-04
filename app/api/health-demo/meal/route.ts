// app/api/health-demo/meal/route.ts
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const mealSchema = z.object({
  calories: z.number(),
  protein_g: z.number(),
  good_carbs_g: z.number(),
  bad_carbs_g: z.number(),
  fat_g: z.number(),
  fibre_g: z.number(),
  sugar_g: z.number(),
  nutrition_score: z.number(),
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file = formData.get("image") as File | null;
    const name = (formData.get("name") as string | null) ?? "";

    let imageUrl: string | undefined;

    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mime = file.type || "image/jpeg";
      imageUrl = `data:${mime};base64,${buffer.toString("base64")}`;
    }

    const textPrompt = `"${name || "энэ хоол"}" гэж нэрлэсэн хоол байна гэж үзээд, зураг байвал ашиглаад НЭГ ПОРЦЫН ойролцоо шим тэжээлийн задаргааг гарга.`;

    const content: any[] = [{ type: "text", text: textPrompt }];
    if (imageUrl) {
      content.push({ type: "image", image: imageUrl });
    }

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: mealSchema,
      messages: [{ role: "user", content }],
    });

    return NextResponse.json(object);
  } catch (err: any) {
    console.error("Meal demo API error:", err);
    return NextResponse.json(
      {
        error: "Хоолны задаргаа хийхэд алдаа гарлаа",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
