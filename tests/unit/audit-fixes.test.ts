import { beforeEach, describe, expect, it, vi } from "vitest";
import { calendarDateSchema } from "@/lib/life/input-validation";

const fixture = vi.hoisted(() => ({
  userId: "11111111-1111-4111-8111-111111111111" as string | null,
  writes: [] as Array<{ table: string; row: Record<string, unknown> }>,
  filters: [] as Array<[string, string, unknown]>,
}));
const ownGoal = "22222222-2222-4222-8222-222222222222";
vi.mock("@/app/(auth)/auth", () => ({
  auth: async () => (fixture.userId ? { user: { id: fixture.userId } } : null),
}));
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn() },
  serializeError: vi.fn(),
}));
vi.mock("@/lib/db/pgClient", () => ({
  getPgAdmin: () => ({
    from(table: string) {
      let row: Record<string, unknown> = {};
      const builder = {
        select: () => builder,
        insert(value: Record<string, unknown>) {
          row = value;
          fixture.writes.push({ table, row });
          return builder;
        },
        upsert(value: Record<string, unknown>) {
          row = value;
          fixture.writes.push({ table, row });
          return builder;
        },
        eq(column: string, value: unknown) {
          fixture.filters.push([table, column, value]);
          return builder;
        },
        order: () => builder,
        async maybeSingle() {
          const owned =
            fixture.filters.some(
              ([t, c, v]) => t === table && c === "id" && v === ownGoal
            ) &&
            fixture.filters.some(
              ([t, c, v]) =>
                t === table &&
                c === "user_id" &&
                v === "11111111-1111-4111-8111-111111111111"
            );
          return { data: owned ? { id: ownGoal } : null, error: null };
        },
        async single() {
          return { data: { id: "saved", ...row }, error: null };
        },
        then(resolve: (value: unknown) => unknown) {
          return Promise.resolve({ data: [], error: null }).then(resolve);
        },
      };
      return builder;
    },
  }),
}));
vi.mock("@/lib/supabaseAdmin", async () => {
  const { getPgAdmin } = await import("@/lib/db/pgClient");
  return { supabaseAdmin: getPgAdmin };
});

import { POST as financePost } from "@/app/api/finance/transactions/route";
import { POST as healthPost } from "@/app/api/health/daily/route";
import { POST as goalPost, GET as goalGet } from "@/app/api/goal-logs/route";

const post = (body: unknown) =>
  new Request("http://localhost/api", {
    method: "POST",
    body: JSON.stringify(body),
  });
const transaction = {
  type: "expense",
  amount: 1000,
  category: "food",
  date: "2026-11-11",
  source: "text",
};

beforeEach(() => {
  fixture.userId = "11111111-1111-4111-8111-111111111111";
  fixture.writes = [];
  fixture.filters = [];
});

describe("finance amount validation", () => {
  it.each([-100, 0, null, "100", 1e309])(
    "rejects invalid amount %s before any batch write",
    async (amount) => {
      expect(
        (
          await financePost(
            post({ rows: [transaction, { ...transaction, amount }] })
          )
        ).status
      ).toBe(400);
      expect(fixture.writes).toHaveLength(0);
    }
  );
  it("saves positive fractional amounts and owns every row through the session", async () => {
    const response = await financePost(
      post({
        rows: [
          {
            ...transaction,
            amount: 0.5,
            user_id: "attacker",
            id: "supplied-id",
          },
        ],
      })
    );
    expect(response.status).toBe(200);
    expect(fixture.writes[0].row).toMatchObject({
      amount: 0.5,
      user_id: fixture.userId,
    });
    expect(fixture.writes[0].row).not.toHaveProperty("id");
  });
  it("rejects malformed JSON with 400", async () => {
    expect(
      (
        await financePost(
          new Request("http://localhost/api", { method: "POST", body: "{" })
        )
      ).status
    ).toBe(400);
  });
});

describe("health daily validation", () => {
  it.each([
    { steps: -10 },
    { steps: 1.5 },
    { waterLiters: -5 },
    { sleepHours: 100 },
    { sleepHours: "8" },
  ])("rejects legacy and nested metrics %j", async (metrics) => {
    for (const body of [
      { day: "2026-11-11", ...metrics },
      { day: "2026-11-11", items: metrics },
    ]) {
      expect((await healthPost(post(body))).status).toBe(400);
    }
    expect(fixture.writes).toHaveLength(0);
  });
  it("preserves meals and valid zero/boundary metrics", async () => {
    const items = {
      steps: 0,
      waterLiters: 0,
      sleepHours: 24,
      meals: [{ id: "meal", title: "Хоол", calories: 200 }],
      badHabitsScore: 100,
    };
    const response = await healthPost(
      post({ day: "2026-11-11", items, user_id: "attacker" })
    );
    expect(response.status).toBe(200);
    expect(fixture.writes[0].row).toMatchObject({
      items,
      user_id: fixture.userId,
    });
  });
  it("rejects negative nested meal nutrients", async () => {
    expect(
      (
        await healthPost(
          post({
            day: "2026-11-11",
            items: { meals: [{ title: "Хоол", calories: -1 }] },
          })
        )
      ).status
    ).toBe(400);
    expect(fixture.writes).toHaveLength(0);
  });
});

describe("goal logs and ownership", () => {
  it("writes a valid log only after checking the goal owner", async () => {
    const response = await goalPost(
      post({ goal_id: ownGoal, date: "2026-11-11", minutes: 15 })
    );
    expect(response.status).toBe(200);
    expect(fixture.filters).toContainEqual([
      "goal_items",
      "user_id",
      fixture.userId,
    ]);
    expect(fixture.writes[0]).toMatchObject({
      table: "goal_logs",
      row: { goal_id: ownGoal, minutes: 15, user_id: fixture.userId },
    });
  });
  it("hides other users' goals and prevents writes", async () => {
    fixture.userId = "33333333-3333-4333-8333-333333333333";
    expect(
      (await goalPost(post({ goal_id: ownGoal, minutes: 15 }))).status
    ).toBe(404);
    expect(fixture.writes).toHaveLength(0);
  });
  it.each([-1, 1441, 1.5, "15"])(
    "rejects invalid minutes %s",
    async (minutes) => {
      expect((await goalPost(post({ goal_id: ownGoal, minutes }))).status).toBe(
        400
      );
      expect(fixture.writes).toHaveLength(0);
    }
  );
  it("rejects invalid dates and scopes reads to the session", async () => {
    expect(
      (await goalGet(new Request("http://localhost/api?date=2026-02-30")))
        .status
    ).toBe(400);
    expect(
      (await goalGet(new Request("http://localhost/api?date=2026-11-11")))
        .status
    ).toBe(200);
    expect(fixture.filters).toContainEqual([
      "goal_logs",
      "user_id",
      fixture.userId,
    ]);
  });
});

it("rejects unauthenticated writes for all three endpoints", async () => {
  fixture.userId = null;
  for (const handler of [financePost, healthPost, goalPost])
    expect((await handler(post({}))).status).toBe(401);
  expect(fixture.writes).toHaveLength(0);
});

it("accepts real calendar dates only", () => {
  expect(calendarDateSchema.safeParse("2024-02-29").success).toBe(true);
  for (const date of ["2026-02-29", "2026-02-30", "2026-13-01", "2026-1-1"])
    expect(calendarDateSchema.safeParse(date).success).toBe(false);
});
