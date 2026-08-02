// app/api/health-demo/meal/route.ts
import { randomUUID } from "node:crypto";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  MEAL_IMAGE_MODEL,
  openAIImageDetailOptions,
  openAIReasoningOptions,
} from "@/lib/ai/image-models";
import { normalizeUploadedImage } from "@/lib/uploads/normalize-image";
import {
  recordAppEvent,
  safeErrorMessage,
  usageEventFields,
} from "@/lib/observability/app-events";

export const runtime = "nodejs";
export const maxDuration = 60;

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
  const requestId = randomUUID();
  const startedAt = Date.now();
  try {
    const formData = await req.formData();

    const file = formData.get("image") as File | null;
    const name = (formData.get("name") as string | null) ?? "";

    let imageUrl: string | undefined;

    if (file) {
      let normalizedFile: Blob;
      try {
        normalizedFile = await normalizeUploadedImage(file, {
          forceJpeg: true,
        });
      } catch (error) {
        await recordAppEvent({
          level: "warn",
          event: "meal_demo_invalid_image",
          source: "meal_demo",
          route: "/api/health-demo/meal",
          requestId,
          statusCode: 400,
          errorCode: "invalid_image",
          message: safeErrorMessage(error),
          imageCount: 1,
        });
        return NextResponse.json(
          { error: "invalid_image", requestId },
          { status: 400 }
        );
      }
      const arrayBuffer = await normalizedFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      imageUrl = `data:image/jpeg;base64,${buffer.toString("base64")}`;
    }

    const textPrompt = `"${name || "энэ хоол"}" гэж нэрлэсэн хоол байна гэж үзээд, зураг байвал ашиглаад НЭГ ПОРЦЫН ойролцоо шим тэжээлийн задаргааг гарга.`;

    const content: any[] = [{ type: "text", text: textPrompt }];
    if (imageUrl) {
      content.push({
        type: "image",
        image: imageUrl,
        providerOptions: openAIImageDetailOptions("high"),
      });
    }

    const { object, usage, finishReason } = await generateObject({
      model: openai(MEAL_IMAGE_MODEL),
      schema: mealSchema,
      providerOptions: openAIReasoningOptions("low"),
      messages: [{ role: "user", content }],
    });

    await recordAppEvent({
      level: "info",
      event: "meal_demo_analysis_completed",
      source: "meal_demo",
      route: "/api/health-demo/meal",
      requestId,
      model: MEAL_IMAGE_MODEL,
      imageCount: imageUrl ? 1 : 0,
      historyCount: 1,
      durationMs: Date.now() - startedAt,
      ...usageEventFields(usage),
      metadata: { finishReason },
    });

    return NextResponse.json(object);
  } catch (err: any) {
    console.error("Meal demo API error:", err);
    await recordAppEvent({
      level: "error",
      event: "meal_demo_analysis_failed",
      source: "meal_demo",
      route: "/api/health-demo/meal",
      requestId,
      model: MEAL_IMAGE_MODEL,
      statusCode: 500,
      errorCode: "server_error",
      message: safeErrorMessage(err),
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json(
      {
        error: "Хоолны задаргаа хийхэд алдаа гарлаа",
        requestId,
      },
      { status: 500 }
    );
  }
}
