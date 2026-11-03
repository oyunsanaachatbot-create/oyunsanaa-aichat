import { notFound, redirect } from "next/navigation";
import { PROFESSIONAL_TAXONOMY } from "@/lib/taxonomy";

const aliases: Record<string, string> = {
  "programs/completed": "/mind/programs/archive",
  "programs/progress": "/mind/programs/active",
  psychology: "/mind/explore?direction=p1",
  finance: "/mind/explore?direction=p3",
  education: "/mind/explore?direction=p7",
  law: "/mind/explore?direction=p8",
  society: "/mind/explore?direction=p10",
  technology: "/mind/explore?direction=p11",
  environment: "/mind/explore?direction=p9",
};

export default async function MindLegacyPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const path = slug.join("/");
  if (Object.hasOwn(aliases, path)) redirect(aliases[path]);
  if (slug.length === 1 && PROFESSIONAL_TAXONOMY.some(item => item.code === path)) redirect(`/mind/explore?direction=${path}`);
  notFound();
}
