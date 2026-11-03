import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { AppShell } from "@/components/mind/app-shell";
import {
  CertificateError,
  listCompletionCertificates,
} from "@/lib/certificates/server";
export const dynamic = "force-dynamic";
export default async function CertificatesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  let certificates: Awaited<ReturnType<typeof listCompletionCertificates>>;
  try {
    certificates = await listCompletionCertificates(session.user.id);
  } catch (error) {
    if (error instanceof CertificateError)
      return (
        <AppShell title="Миний сертификат">
          <output>{error.message}</output>
        </AppShell>
      );
    throw error;
  }
  return (
    <AppShell title="Миний сертификат" width="4xl">
      <p className="mb-5 text-slate-600 text-sm leading-6">
        Сертификаттай сургалт, хөтөлбөрөө дуусгасны дараа архивын үр дүнгээс
        сертификатаа авна.
      </p>
      <div className="space-y-3">
        {certificates.map((certificate) => (
          <Link
            href={`/mind/certificates/${certificate.id}`}
            key={certificate.id}
            className="block rounded-2xl border border-slate-200 bg-white p-5"
          >
            <h2 className="font-semibold">{certificate.program_title}</h2>
            <p className="mt-2 text-slate-600 text-sm">
              {certificate.revoked_at ? "Хүчингүй болсон" : "Олгосон"} ·{" "}
              {new Date(certificate.issued_at).toLocaleDateString("mn-MN", {
                timeZone: "Asia/Ulaanbaatar",
              })}
            </p>
          </Link>
        ))}
      </div>
      {!certificates.length && (
        <p className="rounded-2xl border border-dashed p-6 text-slate-600 text-sm">
          Одоогоор олгосон сертификат алга байна.
        </p>
      )}
      <Link
        className="mt-5 inline-block py-3 font-semibold text-blue-700 text-sm"
        href="/mind/programs/archive"
      >
        Дуусгасан сургалт, хөтөлбөрүүд
      </Link>
    </AppShell>
  );
}
