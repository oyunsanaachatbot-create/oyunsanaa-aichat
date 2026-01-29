import { getTestBySlug } from "@/lib/apps/relations/tests/testsRegistry";
import TestRunner from "@/components/apps/relations/tests/TestRunner";

export default function TestSlugPage({ params }: { params: { slug: string } }) {
  const test = getTestBySlug(params.slug);

  if (!test) {
    return <div>Тест олдсонгүй</div>;
  }

  return <TestRunner test={test} />;
}
