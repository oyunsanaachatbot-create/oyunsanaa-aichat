"use client";

import { useEffect, useMemo, useState } from "react";
import QuestionnaireForm from "./QuestionnaireForm";
import Dashboard from "./Dashboard";
import { calculateTargets } from "./calc";
import { HealthQuestionnaire } from "./healthTypes";

type ProfileState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "ready"; profile: any };

export default function HealthAppClient() {
  const [profileState, setProfileState] = useState<ProfileState>({ status: "loading" });
  const [guestProgram, setGuestProgram] = useState<any | null>(null);

  // Login бол профайл татна. Guest бол 401 ирнэ.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/health/profile");
        if (res.status === 401) {
          setProfileState({ status: "guest" });
          return;
        }
        const json = await res.json();
        setProfileState({ status: "ready", profile: json.profile });
      } catch {
        setProfileState({ status: "guest" });
      }
    })();
  }, []);

  const isGuest = profileState.status === "guest";
  const profile = profileState.status === "ready" ? profileState.profile : null;

  async function onSubmitQuestionnaire(q: HealthQuestionnaire) {
    const { bmi, targets, summaryText } = calculateTargets(q);

    // Guest: хадгалахгүй, зөвхөн session-д үзүүлнэ
    if (isGuest) {
      setGuestProgram({ q, bmi, targets, summaryText });
      return;
    }

    // Login: Supabase-д хадгална
    await fetch("/api/health/profile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ payload: q, targets }),
    });

    // refresh profile
    const res = await fetch("/api/health/profile");
    const json = await res.json();
    setProfileState({ status: "ready", profile: json.profile });
  }

  if (profileState.status === "loading") {
    return <div className="p-6 text-slate-600">Ачаалж байна...</div>;
  }

  // Профайл байхгүй (login байсан ч анх удаа)
  const hasProfile = !!profile;

  if (!hasProfile && !guestProgram) {
    return (
      <QuestionnaireForm
        mode={isGuest ? "guest" : "authed"}
        onSubmit={onSubmitQuestionnaire}
      />
    );
  }

  const program = isGuest ? guestProgram : profile;

  return (
    <Dashboard
      mode={isGuest ? "guest" : "authed"}
      program={program}
      onRestart={() => {
        // дахин эхлэх
        setGuestProgram(null);
        if (!isGuest) setProfileState((s) => (s.status === "ready" ? { ...s, profile: null } : s));
      }}
    />
  );
}
