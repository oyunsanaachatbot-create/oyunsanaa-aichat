"use client";
import { useState } from "react";
export function IssueCertificate({ runId }: { runId: string }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function issue() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error || "Сертификат үүсгэж чадсангүй.");
      window.location.assign(
        `/mind/certificates/${encodeURIComponent(body.certificate.id)}`
      );
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Дахин оролдоно уу."
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="my-5">
      <button
        type="button"
        disabled={busy}
        onClick={issue}
        className="min-h-11 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-sm text-white disabled:opacity-50"
      >
        {busy ? "Бэлтгэж байна…" : "Сертификат авах"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-red-700 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
export function PrintCertificate() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="min-h-11 rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-sm print:hidden"
    >
      Хэвлэх / PDF хадгалах
    </button>
  );
}
export function CertificateSharing({
  id,
  initialPublicName,
}: {
  id: string;
  initialPublicName: boolean;
}) {
  const [publicName, setPublicName] = useState(initialPublicName),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function change(next: boolean) {
    const previous = publicName;
    setPublicName(next);
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/certificates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicName: next }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Хадгалж чадсангүй.");
      setPublicName(body.certificate.public_name);
    } catch (failure) {
      setPublicName(previous);
      setError(
        failure instanceof Error ? failure.message : "Дахин оролдоно уу."
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-5 print:hidden">
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          disabled={busy}
          checked={publicName}
          onChange={(event) => change(event.target.checked)}
        />
        Сертификат шалгах хуудсанд миний нэрийг нийтэд харуулах
      </label>
      {error && (
        <p role="alert" className="mt-2 text-red-700 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
