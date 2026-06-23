"use client";

import * as React from "react";
import {
  AppCard,
  AppShell,
  Badge,
  Button,
  EmptyState,
  Field,
  PageHero,
  SectionHeading,
  TextArea,
} from "@/components/mind/app-shell";

type Goal = {
  id: string;
  text: string;
  createdAt: number;
};

const STORAGE_KEY = "mind_purpose_goals_v1";

function loadGoals(): Goal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Goal[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveGoals(goals: Goal[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}

export default function PurposePlanningPage() {
  const [text, setText] = React.useState("");
  const [goals, setGoals] = React.useState<Goal[]>([]);

  React.useEffect(() => {
    setGoals(loadGoals());
  }, []);

  function addGoal() {
    const t = text.trim();
    if (!t) return;

    const goal: Goal = {
      id: crypto.randomUUID(),
      text: t,
      createdAt: Date.now(),
    };

    const next = [goal, ...goals].sort((a, b) => b.createdAt - a.createdAt);
    setGoals(next);
    saveGoals(next);
    setText("");
  }

  function removeGoal(id: string) {
    const next = goals.filter((g) => g.id !== id);
    setGoals(next);
    saveGoals(next);
  }

  return (
    <AppShell title="Зорилго бичих" subtitle="Чөлөөт бичлэг" width="3xl">
      <div className="space-y-4">
        <AppCard>
          <PageHero
            icon="✍️"
            eyebrow={<Badge>Чөлөөт бичлэг</Badge>}
            title="Зорилгоо чөлөөтэй бичих"
            description="Төгс бичих шаардлагагүй. Бодсоноо л бич. Дараа нь “Oyunsanaa цэгцлэх” дээр орж илүү ойлгомжтой төлөвлөгөө болгоно."
          />

          <div className="space-y-3">
            <Field
              label="Чиний зорилго / хүсэл / санаа"
              hint="Хадгалалт зөвхөн таны төхөөрөмж дээр (localStorage) хадгалагдана."
            >
              <TextArea
                rows={7}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ж: Би 3 сарын дотор ... хийхийг хүсэж байна. Яагаад гэвэл... Одоо надад саад болж байгаа нь..."
              />
            </Field>

            <Button onClick={addGoal} disabled={!text.trim()}>
              Хадгалах
            </Button>
          </div>
        </AppCard>

        <AppCard>
          <SectionHeading className="mb-3">Миний зорилгууд</SectionHeading>

          {goals.length === 0 ? (
            <EmptyState icon="🗒️">Одоогоор хадгалсан зорилго алга.</EmptyState>
          ) : (
            <ul className="space-y-3">
              {goals.slice(0, 20).map((g) => (
                <li
                  key={g.id}
                  className="rounded-[16px] border p-3.5"
                  style={{ borderColor: "#E2E8F0" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {g.text}
                    </div>
                    <Button
                      variant="danger"
                      onClick={() => removeGoal(g.id)}
                      className="shrink-0 px-3 py-1.5 text-xs"
                    >
                      Устгах
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AppCard>
      </div>
    </AppShell>
  );
}
