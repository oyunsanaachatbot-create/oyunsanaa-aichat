import assert from "node:assert/strict";
import test from "node:test";
import { programDefinitionSchema } from "./definition";
import { canonicalDailyResponses } from "./run-persistence";
import { ProgramRunWriter } from "./run-writer";
import {
  isLegacyPrivateUploadPath,
  ownsPrivateUpload,
} from "../uploads/access";
import { mergeToolApprovals } from "../ai/tool-approvals";
import { privateCacheKey, setPrivateCacheOwner } from "../mind/private-cache";
import { formatReportDay } from "../mind/report-date";
const daily = programDefinitionSchema.parse({
  schemaVersion: 1,
  contentType: "PROGRAM",
  locale: "mn",
  title: "Тест",
  summary: "Тест",
  icon: "x",
  deliveryMode: "DAILY",
  durationDays: 3,
  sections: [1, 2, 3].map((day) => ({
    id: `day${day}`,
    type: "CONTENT",
    title: "Өдөр",
    dayNumber: day,
    questions: [
      { id: "q", type: "TEXT", prompt: "?", required: true, options: [] },
    ],
  })),
});
const REVISION_CONFLICT = /revision_conflict/;
const now = Date.parse("2026-11-07T08:00:00Z");
test("D01: forged old/future stamps cannot unlock future answers", () => {
  assert.equal(
    canonicalDailyResponses({
      definition: daily,
      stored: {},
      incoming: {
        "day3.q": "x",
        "__daily.1.completedAt": "2020-01-01",
        "__daily.2.completedAt": "2020-01-01",
      },
      sectionId: "day3",
      completeDay: undefined,
      now,
    }),
    null
  );
  assert.equal(
    canonicalDailyResponses({
      definition: daily,
      stored: {},
      incoming: { "day1.q": "x", "day3.q": "hidden" },
      sectionId: "day1",
      completeDay: undefined,
      now,
    }),
    null
  );
});
test("D01: day completion uses server time, checks required and preserves first timestamp", () => {
  assert.equal(
    canonicalDailyResponses({
      definition: daily,
      stored: {},
      incoming: {},
      sectionId: "day1",
      completeDay: 1,
      now,
    }),
    null
  );
  const first = canonicalDailyResponses({
    definition: daily,
    stored: {},
    incoming: { "day1.q": "x", "__daily.1.completedAt": "2020-01-01" },
    sectionId: "day1",
    completeDay: 1,
    now,
  });
  assert.ok(first);
  assert.equal(first["__daily.1.completedAt"], new Date(now).toISOString());
  assert.equal(
    canonicalDailyResponses({
      definition: daily,
      stored: first,
      incoming: { "day1.q": "x" },
      sectionId: "day2",
      completeDay: undefined,
      now: now + 86_399_999,
    }),
    null
  );
  assert.ok(
    canonicalDailyResponses({
      definition: daily,
      stored: first,
      incoming: { "day1.q": "x", "day2.q": "y" },
      sectionId: "day2",
      completeDay: undefined,
      now: now + 86_400_000,
    })
  );
  assert.equal(
    canonicalDailyResponses({
      definition: daily,
      stored: first,
      incoming: { "day1.q": "x" },
      sectionId: "day1",
      completeDay: 1,
      now: now + 10,
    })?.["__daily.1.completedAt"],
    first["__daily.1.completedAt"]
  );
});
test("D02: saves and completion serialize using the returned revision", async () => {
  let resolveFirst!: () => void;
  const seen: any[] = [];
  const send = (async (_url: unknown, init: any) => {
    const body = JSON.parse(init.body);
    seen.push(body);
    if (seen.length === 1)
      await new Promise<void>((r) => {
        resolveFirst = r;
      });
    return Response.json({ run: { revision: body.expectedRevision + 1 } });
  }) as typeof fetch;
  const writer = new ProgramRunWriter("/fixture", 4, send);
  const payload = {
    mode: "DRAFT" as const,
    runId: "run",
    currentSectionId: "a",
    responses: { answer: "old" },
  };
  const first = writer.write(payload);
  payload.responses.answer = "mutated";
  const second = writer.write({ ...payload, responses: { answer: "new" } });
  await Promise.resolve();
  assert.equal(seen.length, 1);
  assert.equal(seen[0].responses.answer, "old");
  resolveFirst();
  await Promise.all([first, second]);
  await writer.write({ ...payload, mode: "COMPLETE" });
  assert.deepEqual(
    seen.map((b) => b.expectedRevision),
    [4, 5, 6]
  );
});
test("D02: a conflicting tab cannot silently retry and overwrite the server", async () => {
  let requests = 0;
  const writer = new ProgramRunWriter("/fixture", 0, (() => {
    requests++;
    return Promise.resolve(Response.json({}, { status: 409 }));
  }) as typeof fetch);
  const body = {
    mode: "DRAFT" as const,
    runId: "x",
    currentSectionId: "a",
    responses: { answer: "keep locally" },
  };
  await assert.rejects(writer.write(body), REVISION_CONFLICT);
  await assert.rejects(writer.write(body), REVISION_CONFLICT);
  assert.equal(requests, 1);
});
test("F03: exact known private upload path still requires its owner", () => {
  assert.ok(ownsPrivateUpload("chat-uploads", ["A", "file.png"], "A"));
  for (const [bucket, path, user] of [
    ["chat-uploads", ["A", "file.png"], "B"],
    ["chat-uploads", ["A", "..", "file.png"], "A"],
    ["unknown", ["A", "file"], "A"],
  ] as const)
    assert.equal(ownsPrivateUpload(bucket, [...path], user), false);
});
test("F02: foreign history is rejected and tool input stays server-owned", () => {
  const original: { id: string; role: string; parts: any[] } = {
    id: "m1",
    role: "assistant",
    parts: [
      {
        type: "tool-updateDocument",
        toolCallId: "tool",
        state: "approval-requested",
        input: { id: "own" },
        approval: { id: "approval" },
      },
    ],
  };
  const incoming = {
    ...original,
    parts: [
      {
        ...original.parts[0],
        state: "approval-responded",
        input: { id: "foreign" },
        approval: { id: "approval", approved: true },
      },
    ],
  };
  assert.equal(
    mergeToolApprovals([original], [{ ...incoming, id: "foreign-message" }]),
    null
  );
  const merged = mergeToolApprovals([original], [incoming]);
  assert.ok(merged);
  assert.equal((merged[0].parts[0] as any).input.id, "own");
  assert.equal((merged[0].parts[0] as any).approval.approved, true);
  assert.equal(
    mergeToolApprovals(
      [original],
      [
        {
          ...incoming,
          parts: [
            {
              ...incoming.parts[0],
              approval: { id: "forged", approved: true },
            },
          ],
        },
      ]
    ),
    null
  );
});
test("D08: account keys never use previous global caches", () => {
  setPrivateCacheOwner("A");
  const a = privateCacheKey("balance:history");
  setPrivateCacheOwner("B");
  const b = privateCacheKey("balance:history");
  assert.notEqual(a, b);
  assert.notEqual(a, "balance:history");
  setPrivateCacheOwner(null);
  assert.throws(() => privateCacheKey("balance:history"));
});
test("L03: ISO and date-only labels match without a timezone suffix", () => {
  assert.equal(formatReportDay("2026-11-06T00:00:00.000Z"), "11.06");
  assert.equal(formatReportDay("2026-11-06"), "11.06");
  assert.equal(formatReportDay("invalid"), "—");
});

test("F03: legacy static upload paths are blocked too", () => {
  assert.equal(
    isLegacyPrivateUploadPath("/uploads/chat-uploads/A/file.png"),
    true
  );
  assert.equal(
    isLegacyPrivateUploadPath("/%75ploads/chat-uploads/A/file.png"),
    true
  );
  assert.equal(
    isLegacyPrivateUploadPath("/api/uploads/chat-uploads/A/file.png"),
    false
  );
  assert.equal(
    ownsPrivateUpload("chat-uploads", ["0000", "file0.png"], "0000"),
    true
  );
});

test("D02: the default transport keeps the browser fetch receiver", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = function (this: unknown) {
    assert.ok(
      this === globalThis,
      "Browser fetch requires its Window receiver"
    );
    return Promise.resolve(Response.json({ run: { revision: 1 } }));
  } as typeof fetch;
  try {
    const writer = new ProgramRunWriter("/fixture", 0);
    const result = await writer.write({
      mode: "DRAFT",
      runId: "fixture",
      currentSectionId: "first",
      responses: { answer: "saved" },
    });
    assert.equal(result.run.revision, 1);
  } finally {
    globalThis.fetch = original;
  }
});
