"use client";

import { STATIC_THEORY, type TheoryKey } from "@/config/theory/static";
import { Button } from "@/components/ui/button";

export function StaticTheoryPage({ topic }: { topic: TheoryKey }) {
  const doc = STATIC_THEORY[topic];

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-xl font-semibold">{doc.title}</h1>
        <Button
          variant="outline"
          onClick={async () => {
            await navigator.clipboard.writeText(doc.content);
          }}
        >
          Copy
        </Button>
      </div>

      <div className="rounded-lg border p-4 whitespace-pre-wrap text-sm leading-6">
        {doc.content}
      </div>
    </div>
  );
}
