"use client"

import * as React from "react"

type Goal = {
  id: string
  text: string
  createdAt: number
}

const STORAGE_KEY = "mind_purpose_goals_v1"

function loadGoals(): Goal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Goal[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveGoals(goals: Goal[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals))
}

export default function PurposePlanningPage() {
  const [text, setText] = React.useState("")
  const [goals, setGoals] = React.useState<Goal[]>([])

  React.useEffect(() => {
    setGoals(loadGoals())
  }, [])

  function addGoal() {
    const t = text.trim()
    if (!t) return

    const goal: Goal = {
      id: crypto.randomUUID(),
      text: t,
      createdAt: Date.now(),
    }

    const next = [goal, ...goals].sort((a, b) => b.createdAt - a.createdAt)
    setGoals(next)
    saveGoals(next)
    setText("")
  }

  function removeGoal(id: string) {
    const next = goals.filter((g) => g.id !== id)
    setGoals(next)
    saveGoals(next)
  }

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">✍️ Зорилгоо чөлөөтэй бичих</h1>
      <p className="text-sm opacity-80">
        Төгс бичих шаардлагагүй. Бодсоноо л бич. Дараа нь “Oyunsanaa цэгцлэх”
        дээр орж илүү ойлгомжтой төлөвлөгөө болгоно.
      </p>

      <div className="rounded-xl border p-4 space-y-3">
        <label className="text-sm font-medium">
          Чиний зорилго / хүсэл / санаа (free text)
        </label>
        <textarea
          className="w-full rounded-xl border p-3"
          rows={7}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ж: Би 3 сарын дотор ... хийхийг хүсэж байна. Яагаад гэвэл... Одоо надад саад болж байгаа нь..."
        />

        <button
          onClick={addGoal}
          className="rounded-xl border px-4 py-2 font-medium"
        >
          Хадгалах
        </button>

        <p className="text-xs opacity-70">
          (Одоогоор хадгалалт нь таны төхөөрөмж дээр localStorage-д хадгалагдана.)
        </p>
      </div>

      <div className="rounded-xl border p-4">
        <h2 className="text-lg font-semibold">Миний зорилгууд</h2>

        {goals.length === 0 ? (
          <p className="mt-2 text-sm opacity-80">Одоогоор хадгалсан зорилго алга.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {goals.slice(0, 20).map((g) => (
              <li key={g.id} className="rounded-xl border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="whitespace-pre-wrap text-sm">{g.text}</div>
                  <button
                    onClick={() => removeGoal(g.id)}
                    className="rounded-lg border px-3 py-1 text-sm"
                  >
                    Устгах
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
