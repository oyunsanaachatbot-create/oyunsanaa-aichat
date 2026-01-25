import { Suspense } from "react";
import DailyCheckClient from "./DailyCheckClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <DailyCheckClient />
    </Suspense>
  );
}
