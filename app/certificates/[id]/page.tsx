import { notFound } from "next/navigation";
import { z } from "zod";
import {
  CertificateError,
  verifyCompletionCertificate,
} from "@/lib/certificates/server";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Сертификат шалгах — Оюунсанаа",
  robots: { index: false, follow: false },
};
export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  let certificate: Awaited<ReturnType<typeof verifyCompletionCertificate>>;
  try {
    certificate = await verifyCompletionCertificate(id);
  } catch (error) {
    if (error instanceof CertificateError)
      return (
        <main className="mx-auto max-w-xl p-8">
          <h1 className="font-semibold text-xl">Сертификат шалгах</h1>
          <output className="mt-4 block">{error.message}</output>
        </main>
      );
    throw error;
  }
  if (!certificate) notFound();
  return (
    <main className="mx-auto my-8 max-w-xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-10">
      <p className="mb-4 font-semibold text-blue-800 text-sm">ОЮУНСАНАА</p>
      <h1 className="font-semibold text-2xl">Сертификат шалгах</h1>
      <output
        className={`my-5 block rounded-xl p-4 font-semibold ${certificate.revoked_at ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800"}`}
      >
        {certificate.revoked_at ? "Хүчингүй болсон" : "Хүчинтэй"}
      </output>
      <h2 className="font-semibold text-lg">{certificate.program_title}</h2>
      {certificate.participant_name && (
        <p className="mt-4">{certificate.participant_name}</p>
      )}
      <p className="mt-4 text-slate-600 text-sm">
        Олгосон:{" "}
        {new Date(certificate.issued_at).toLocaleDateString("mn-MN", {
          timeZone: "Asia/Ulaanbaatar",
        })}
      </p>
      <p className="mt-3 break-all text-slate-500 text-xs">
        Дугаар: {certificate.id}
      </p>
      <p className="mt-5 text-slate-600 text-sm leading-6">
        Энэ нь тухайн сургалт, хөтөлбөрийг дуусгасны баталгаа юм.
      </p>
    </main>
  );
}
