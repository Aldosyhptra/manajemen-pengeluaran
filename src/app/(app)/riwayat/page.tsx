import Link from "next/link";
import { getHistory } from "@/lib/data/queries";
import { requireUser } from "@/lib/auth";
import { historyFilterSchema } from "@/lib/schemas";
import { RiwayatClient } from "@/components/riwayat/RiwayatClient";

type SP = { from?: string; to?: string; category?: string; tab?: string };

function todayWIB(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

function addDays(ymd: string, delta: number): string {
  const d = new Date(ymd + "T12:00:00+07:00");
  d.setDate(d.getDate() + delta);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(d);
}

const kategoriOptions = [
  "",
  "makanan",
  "minuman",
  "transportasi",
  "belanja",
  "tagihan",
  "kesehatan",
  "hiburan",
  "lainnya",
] as const;

export default async function RiwayatPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const raw = await searchParams;
  const tab = raw.tab === "kalori" ? "kalori" : "pengeluaran";

  const sanitized = {
    from: raw.from?.trim() ? raw.from.trim() : undefined,
    to: raw.to?.trim() ? raw.to.trim() : undefined,
    category: raw.category?.trim() ? raw.category.trim() : undefined,
  };

  const parsed = historyFilterSchema.safeParse(sanitized);

  const today = todayWIB();
  let fromEff = today;
  let toEff = today;
  let categoryEff: string | null = null;
  let filterError: string | null = null;

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    filterError = first?.message ?? "Filter tidak valid.";
    fromEff = addDays(today, -6);
    toEff = today;
  } else {
    const f = parsed.data.from;
    const t = parsed.data.to;
    if (f && t) {
      fromEff = f;
      toEff = t;
    } else if (f && !t) {
      fromEff = f;
      toEff = today;
      if (fromEff > toEff) toEff = fromEff;
    } else if (!f && t) {
      toEff = t;
      fromEff = addDays(toEff, -6);
    } else {
      fromEff = addDays(today, -6);
      toEff = today;
    }
    categoryEff = (parsed.data.category as string) ?? null;
  }

  const user = await requireUser();

  let data = { expenses: [] as Awaited<ReturnType<typeof getHistory>>["expenses"], meals: [] as Awaited<ReturnType<typeof getHistory>>["meals"] };

  if (!filterError) {
    data = await getHistory(user.chatId, fromEff, toEff, categoryEff);
  }

  const buildHref = (overrides: Partial<SP>) => {
    const p = new URLSearchParams();
    const nf = overrides.from !== undefined ? overrides.from : raw.from ?? "";
    const nt = overrides.to !== undefined ? overrides.to : raw.to ?? "";
    const nc = overrides.category !== undefined ? overrides.category : raw.category ?? "";
    const ntab = overrides.tab !== undefined ? overrides.tab : tab;
    if (nf) p.set("from", nf);
    if (nt) p.set("to", nt);
    if (nc) p.set("category", nc);
    if (ntab && ntab !== "pengeluaran") p.set("tab", ntab);
    const q = p.toString();
    return q ? `/riwayat?${q}` : "/riwayat";
  };

  const showExpenses = tab === "pengeluaran";

  return (
    <main>
      <h1 className="font-heading text-2xl font-bold text-tinta">Riwayat</h1>
      <p className="mt-1 text-sm text-tinta-redup">
        {fromEff} — {toEff} · WIB
      </p>

      {/* Tab */}
      <div
        role="tablist"
        aria-label="Jenis riwayat"
        className="mt-4 inline-flex rounded-lg border border-garis bg-kertas p-1"
      >
        <Link
          role="tab"
          aria-selected={showExpenses}
          href={buildHref({ tab: "pengeluaran" })}
          className={
            showExpenses
              ? "rounded-md bg-biru-nota px-4 py-1.5 text-sm font-semibold text-white"
              : "rounded-md px-4 py-1.5 text-sm font-medium text-tinta-redup hover:text-tinta"
          }
        >
          Pengeluaran
        </Link>
        <Link
          role="tab"
          aria-selected={!showExpenses}
          href={buildHref({ tab: "kalori" })}
          className={
            !showExpenses
              ? "rounded-md bg-kuning-kalori px-4 py-1.5 text-sm font-semibold text-white"
              : "rounded-md px-4 py-1.5 text-sm font-medium text-tinta-redup hover:text-tinta"
          }
        >
          Kalori
        </Link>
      </div>

      {/* Filter */}
      <form
        method="get"
        className="mt-4 rounded border border-garis bg-struk p-3 sm:p-4"
        aria-label="Filter riwayat"
      >
        {tab !== "pengeluaran" && <input type="hidden" name="tab" value={tab} />}
        <div className="grid gap-3 sm:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-tinta-redup">Dari</span>
            <input
              type="date"
              name="from"
              defaultValue={raw.from ?? ""}
              className="min-h-11 rounded-lg border border-garis bg-white px-3 text-sm text-tinta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-biru-nota"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-tinta-redup">Sampai</span>
            <input
              type="date"
              name="to"
              defaultValue={raw.to ?? ""}
              className="min-h-11 rounded-lg border border-garis bg-white px-3 text-sm text-tinta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-biru-nota"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-tinta-redup">Jenis</span>
            <select
              name="category"
              defaultValue={raw.category ?? ""}
              className="min-h-11 rounded-lg border border-garis bg-white px-3 text-sm text-tinta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-biru-nota"
            >
              <option value="">Semua</option>
              {kategoriOptions.slice(1).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="min-h-11 flex-1 rounded-lg bg-biru-nota px-4 text-sm font-semibold text-white hover:opacity-90"
            >
              Terapkan
            </button>
            <Link
              href={tab === "kalori" ? "/riwayat?tab=kalori" : "/riwayat"}
              className="min-h-11 inline-flex items-center justify-center rounded-lg border border-garis bg-white px-4 text-sm font-medium text-tinta hover:bg-kertas"
            >
              Hapus
            </Link>
          </div>
        </div>
        <p className="mt-2 text-xs text-tinta-redup">Maksimal rentang 366 hari. Format YYYY-MM-DD.</p>
      </form>

      {filterError && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-stempel/30 bg-stempel/10 px-4 py-3 text-sm text-stempel"
        >
          {filterError}
        </div>
      )}

      {!filterError && <RiwayatClient expenses={data.expenses} meals={data.meals} tab={tab} />}
    </main>
  );
}
