import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { taxonomyAssignmentSchema } from "@/lib/taxonomy/schema";
import type { TaxonomyAssignment } from "@/lib/taxonomy";
import { getContentRecommendations } from "@/lib/taxonomy/recommendations";

const querySchema = z.object({
  text: z.string().max(4000).optional(),
  taxonomy: z.string().max(4000).optional(),
  exclude: z.string().max(220).optional(),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    text: url.searchParams.get("text") ?? undefined,
    taxonomy: url.searchParams.get("taxonomy") ?? undefined,
    exclude: url.searchParams.get("exclude") ?? undefined,
  });
  if (!parsed.success)
    return NextResponse.json({ error: "invalid_query" }, { status: 400 });
  let taxonomy: TaxonomyAssignment | null = null;
  if (parsed.data.taxonomy) {
    try {
      taxonomy = taxonomyAssignmentSchema.parse(
        JSON.parse(parsed.data.taxonomy)
      );
    } catch {
      return NextResponse.json({ error: "invalid_taxonomy" }, { status: 400 });
    }
  }
  const result = await getContentRecommendations({
    taxonomy,
    text: parsed.data.text,
    excludeExternalKey: parsed.data.exclude,
    userId: session.user.id,
  });
  return NextResponse.json(result, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
