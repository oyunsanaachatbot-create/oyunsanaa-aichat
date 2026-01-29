"use client";

import { useEffect, useState } from "react";

export default function GoalExecutePage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/goal-planner")
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: 20 }}>Ачаалж байна…</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>🎯 Миний зорилгууд</h2>

      {items.map((g) => (
        <div
          key={g.localId}
          style={{
            marginBottom: 12,
            padding: 12,
            borderRadius: 10,
            border: "1px solid #ddd",
          }}
        >
          <div><b>{g.goal_text}</b></div>
          <div>
            {g.effort_unit} – {g.effort_hours}ц {g.effort_minutes}м
          </div>
        </div>
      ))}
    </div>
  );
}
