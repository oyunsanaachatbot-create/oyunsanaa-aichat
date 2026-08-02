// app/api/health/meal-analyze/route.ts
import { randomUUID } from "node:crypto";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
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
  proteinG: z.number(),
  goodCarbsG: z.number(),
  badCarbsG: z.number(),
  fatG: z.number(),
  fiberG: z.number(),
  sugarG: z.number(),
  nutritionScore: z.number(),
  caloriesMin: z.number(),
  caloriesMax: z.number(),
  confidence: z.number().min(0).max(1),
});

export async function POST(req: NextRequest) {
  const requestId = randomUUID();
  const startedAt = Date.now();
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

    let imageBytes: Uint8Array | undefined;
    if (file) {
      let normalizedFile: Blob;
      try {
        normalizedFile = await normalizeUploadedImage(file, {
          forceJpeg: true,
        });
      } catch (error) {
        await recordAppEvent({
          level: "warn",
          event: "meal_invalid_image",
          source: "meal_analysis",
          route: "/api/health/meal-analyze",
          requestId,
          userId: session.user.id,
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
      imageBytes = new Uint8Array(await normalizedFile.arrayBuffer());
    }

    const textPrompt = `"${name || "энэ хоол"}" гэж нэрлэсэн хоол байна гэж үзээд, зураг байвал ашиглаад НЭГ ПОРЦЫН ойролцоо шим тэжээлийн задаргааг гарга (калори, уураг, сайн нүүрс ус, муу нүүрс ус, өөх тос, эслэг, сахар, 0-100 хоорондох шим тэжээлийн оноо). calories нь хамгийн боломжит утга, caloriesMin/caloriesMax нь бодитой хүрээ, confidence нь зураг ба порцын хэмжээг зөв үнэлсэн итгэлцэл 0-1 байна.`;

    const content: any[] = [{ type: "text", text: textPrompt }];
    if (imageBytes) {
      content.push({
        type: "image",
        image: imageBytes,
        mediaType: "image/jpeg",
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
      event: "meal_analysis_completed",
      source: "meal_analysis",
      route: "/api/health/meal-analyze",
      requestId,
      userId: session.user.id,
      model: MEAL_IMAGE_MODEL,
      imageCount: imageBytes ? 1 : 0,
      historyCount: 1,
      durationMs: Date.now() - startedAt,
      ...usageEventFields(usage),
      metadata: { confidence: object.confidence, finishReason },
    });

    return NextResponse.json(object);
  } catch (err: any) {
    console.error("Meal analyze API error:", err);
    await recordAppEvent({
      level: "error",
      event: "meal_analysis_failed",
      source: "meal_analysis",
      route: "/api/health/meal-analyze",
      requestId,
      userId: session.user.id,
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
