import "server-only";

import postgres from "postgres";

const client = postgres(process.env.POSTGRES_URL!, {
  ssl: "require",
  max: 3,
  idle_timeout: 20,
  connect_timeout: 10,
});

export type TrainingLesson = { id: string; title: string; subtitle?: string; body?: string };
export type TrainingItem = {
  id: string;
  slug: string;
  price: number;
  title: string;
  summary: string;
  lessons: TrainingLesson[];
  authorName: string;
  authorAvatarUrl: string | null;
  authorSpecialty: string | null;
};

function normalize(row: any): TrainingItem {
  const definition = row.definition ?? {};
  const sections = Array.isArray(definition.sections) ? definition.sections : [];
  return {
    id: String(row.id),
    slug: String(row.slug),
    price: Number(row.price ?? 0),
    title: String(definition.title ?? row.slug ?? "Сургалт"),
    summary: String(definition.summary ?? ""),
    lessons: sections.map((section: any, index: number) => ({
      id: String(section.id ?? "lesson-" + (index + 1)),
      title: String(section.title ?? "Хичээл " + (index + 1)),
      subtitle: section.subtitle ? String(section.subtitle) : "",
      body: section.body ? String(section.body) : "",
    })),
    authorName: String(row.authorName ?? "Оюунсанаа"),
    authorAvatarUrl: row.authorAvatarUrl ? String(row.authorAvatarUrl) : null,
    authorSpecialty: row.authorSpecialty ? String(row.authorSpecialty) : null,
  };
}

const BASE_SELECT = [
  "SELECT p.id, p.slug, p.price, pv.definition,",
  "u.name AS \"authorName\", pp.avatar_url AS \"authorAvatarUrl\", pp.specialty AS \"authorSpecialty\"",
  "FROM public.\"Program\" p",
  "JOIN LATERAL (",
  "SELECT v.definition FROM public.\"ProgramVersion\" v",
  "WHERE v.\"programId\" = p.id AND v.status = 'PUBLISHED'",
  "ORDER BY v.version DESC LIMIT 1",
  ") pv ON true",
  "LEFT JOIN public.\"User\" u ON u.id = p.\"createdById\"",
  "LEFT JOIN scheduling.psychologist_profile pp ON pp.user_id = p.\"createdById\"",
].join(" ");

export async function getPublishedTrainings(): Promise<TrainingItem[]> {
  const sql = BASE_SELECT +
    " WHERE p.status = 'PUBLISHED' AND p.renderer = 'BUILDER'" +
    " AND pv.definition->>'contentType' = 'TRAINING'" +
    " ORDER BY p.\"sortOrder\" ASC, p.\"updatedAt\" DESC";
  const rows = await client.unsafe<any[]>(sql);
  return rows.map(normalize);
}

export async function getPublishedTrainingBySlug(slug: string): Promise<TrainingItem | null> {
  const sql = BASE_SELECT +
    " WHERE p.slug = $1 AND p.status = 'PUBLISHED' AND p.renderer = 'BUILDER'" +
    " AND pv.definition->>'contentType' = 'TRAINING' LIMIT 1";
  const rows = await client.unsafe<any[]>(sql, [slug]);
  return rows[0] ? normalize(rows[0]) : null;
}