import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { AppShell } from "@/components/mind/app-shell";
import {
  CertificateSharing,
  PrintCertificate,
} from "@/components/mind/certificate-actions";
import { ownedCompletionCertificate } from "@/lib/certificates/server";
export const dynamic = "force-dynamic";
export default async function CertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const certificate = await ownedCompletionCertificate(session.user.id, id);
  if (!certificate) notFound();
  return (
    <AppShell title="Сертификат" backHref="/mind/certificates" width="4xl">
      <article
        data-completion-certificate
        className="rounded-2xl border-2 border-blue-200 bg-white p-6 text-center sm:p-12 print:border-0"
      >
        <p className="font-semibold text-blue-800 text-sm tracking-widest">
          ОЮУНСАНАА
        </p>
        <h2 className="my-6 font-bold text-2xl sm:text-3xl">
          Дуусгасны сертификат
        </h2>
        <p className="mb-4 font-semibold text-xl">
          {certificate.participant_name}
        </p>
        <p className="text-lg leading-8">{certificate.program_title}</p>
        <p className="mt-5 text-slate-600 text-sm">
          Сургалт, хөтөлбөрийн шаардлагатай алхмуудыг дуусгасан.
        </p>
        <p className="mt-4 text-sm">
          Дуусгасан:{" "}
          {new Date(certificate.completed_at).toLocaleDateString("mn-MN", {
            timeZone: "Asia/Ulaanbaatar",
          })}
        </p>
        <p className="mt-3 break-all text-slate-500 text-xs">
          Дугаар: {certificate.id}
        </p>
        {certificate.revoked_at && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-red-50 p-4 text-red-800 text-sm"
          >
            Хүчингүй болсон: {certificate.revocation_reason}
          </p>
        )}
        <Link
          className="mt-5 inline-block font-semibold text-blue-700 text-sm"
          href={`/certificates/${certificate.id}`}
        >
          Сертификат шалгах
        </Link>
      </article>
      <div className="mt-5">
        <PrintCertificate />
      </div>
      <CertificateSharing
        id={certificate.id}
        initialPublicName={certificate.public_name}
      />
    </AppShell>
  );
}
