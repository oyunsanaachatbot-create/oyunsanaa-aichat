import DailyCheckForm from "@/components/mind/daily-check/DailyCheckForm";
import DailyCheckHistory from "@/components/mind/daily-check/DailyCheckHistory";
export default function DailyCheckPage() {
  return (
    <div className="mx-auto w-full max-w-5xl p-4 md:p-6 space-y-6">
      <div className="rounded-2xl border bg-white/5 backdrop-blur p-5 md:p-6">
        <h1 className="text-xl md:text-2xl font-semibold">Өдрийн сэтгэл санааны check</h1>
        <p className="mt-2 text-sm opacity-80">
          Өдөрт 1 удаа 30–45 сек бөглөнө. ОНОО + явцыг автоматаар харуулна.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <DailyCheckForm />
        <DailyCheckHistory />
      </div>
    </div>
  );
}
