import { getDashboardData } from "@/lib/data/queries";

export const dynamic = "force-dynamic";
import { DailyNote } from "@/components/DailyNote";
import { BerandaCharts } from "@/components/BerandaCharts";
import { LeaderRow } from "@/components/LeaderRow";
import { formatRupiah, formatJamWIB } from "@/lib/format";

function formatDateLabel(dateWIB: string): string {
  const d = new Date(dateWIB + "T12:00:00+07:00");
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
}

export default async function BerandaPage() {
  // Sementara pakai data seed lokal (1000000001). Nanti ganti ke OWNER_CHAT_ID saat integrasi n8n/DB production.
  const SEED_CHAT_ID = "1000000001";
  const ownerId = process.env.OWNER_CHAT_ID || SEED_CHAT_ID;

  let data = await getDashboardData(ownerId);

  // Fallback lokal: jika data owner kosong (mis. OWNER_CHAT_ID 1302646743 belum ada seed), pakai seed agar Fase 2 bisa diverifikasi
  const isEmpty =
    data.today.spending === 0 &&
    data.today.calories === 0 &&
    data.trend7d.every((d) => d.spending === 0 && d.calories === 0) &&
    data.recent.length === 0;

  if (isEmpty && ownerId !== SEED_CHAT_ID && process.env.NODE_ENV !== "production") {
    data = await getDashboardData(SEED_CHAT_ID);
  }

  const isEmptyOverall =
    data.trend7d.every((d) => d.spending === 0 && d.calories === 0) &&
    data.spendingByCategory7d.length === 0 &&
    data.recent.length === 0;

  if (isEmptyOverall) {
    return (
      <main>
        <p className="text-sm text-tinta-redup">{formatDateLabel(data.date)}</p>
        <div className="mt-4 rounded border border-dashed border-garis bg-struk p-6 text-sm text-tinta-redup">
          Belum ada catatan hari ini. Buka Catat dan tulis apa yang kamu beli atau makan.
        </div>
      </main>
    );
  }

  return (
    <main>
      <div>
        <DailyNote
          spending={data.today.spending}
          budgetTarget={data.targets.budgetTarget}
          calories={data.today.calories}
          calorieTarget={data.targets.calorieTarget}
          dateLabel={formatDateLabel(data.date)}
        />
      </div>

      <BerandaCharts trend7d={data.trend7d} category={data.spendingByCategory7d} />

      <section className="mt-6 rounded border border-garis bg-struk p-4">
        <h2 className="font-heading text-lg font-bold text-tinta">Catatan terakhir</h2>
        {data.recent.length === 0 ? (
          <p className="mt-2 text-sm text-tinta-redup">Belum ada catatan.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {data.recent.map((r) => (
              <li key={r.id} className="space-y-1">
                <LeaderRow className="capitalize" label={r.description} value={formatRupiah(r.amount)} />
                <p className="text-xs tabular-nums text-tinta-redup">{formatJamWIB(r.at)} WIB</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
