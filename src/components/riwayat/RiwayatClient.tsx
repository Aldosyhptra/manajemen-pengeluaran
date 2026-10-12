"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LeaderRow } from "@/components/LeaderRow";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatRupiah, formatKkal, formatJamWIB } from "@/lib/format";
import { isPerubahanBesar } from "@/lib/schemas";
import {
  updatePengeluaranAction,
  updateKaloriAction,
  hapusPengeluaranAction,
  hapusKaloriAction,
  type CatatanActionResult,
} from "@/app/(app)/riwayat/actions";

type Expense = { id: string; at: string; category: string; description: string; amount: number };
type Meal = { id: string; at: string; name: string; calories: number };

const kategoriOptions = ["makanan", "minuman", "transportasi", "belanja", "tagihan", "kesehatan", "hiburan", "lainnya"] as const;

function ymdFromISO(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date(iso));
}
function dateLabelWIB(ymd: string): string {
  return new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(ymd + "T12:00:00+07:00"));
}
function formatTanggalWIBFull(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
}
function formatThousand(v: string): string {
  const d = v.replace(/\D/g, "");
  if (!d) return "";
  return Number(d).toLocaleString("id-ID");
}
function cleanNumber(v: string): string {
  return v.replace(/\./g, "").replace(/,/g, "").trim();
}

type SheetItem =
  | { kind: "pengeluaran"; data: Expense }
  | { kind: "kalori"; data: Meal };

export function RiwayatClient({ expenses, meals, tab }: { expenses: Expense[]; meals: Meal[]; tab: "pengeluaran" | "kalori" }) {
  const router = useRouter();
  const [selected, setSelected] = useState<SheetItem | null>(null);
  const [editMode, setEditMode] = useState(false);
  // toast
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // grouped
  function groupByDate<T extends { at: string }>(items: T[]): Map<string, T[]> {
    const m = new Map<string, T[]>();
    for (const it of items) {
      const ymd = ymdFromISO(it.at);
      const arr = m.get(ymd) ?? [];
      arr.push(it);
      m.set(ymd, arr);
    }
    return new Map([...m.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)));
  }
  const groupedExpenses = groupByDate(expenses);
  const groupedMeals = groupByDate(meals);
  const showExpenses = tab === "pengeluaran";

  // edit states for pengeluaran
  const [eDeskripsi, setEDeskripsi] = useState("");
  const [eNominalDisplay, setENominalDisplay] = useState("");
  const [eKategori, setEKategori] = useState<string>("lainnya");
  const [eOrig, setEOrig] = useState<Expense | null>(null);

  // edit states for kalori
  const [kNama, setKNama] = useState("");
  const [kKalori, setKKalori] = useState("");
  const [kOrig, setKOrig] = useState<Meal | null>(null);

  const [confirmSave, setConfirmSave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [savePending, setSavePending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // actions
  const [eState, eAction, eIsPending] = useActionState(updatePengeluaranAction, {} as CatatanActionResult);
  const [kState, kAction, kIsPending] = useActionState(updateKaloriAction, {} as CatatanActionResult);
  // hapus via transition (actions are Promise<result>)
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!eState.ok && !eState.error) return;
    if (eState.ok) {
      setToast(eState.ok);
      setConfirmSave(false);
      setEditMode(false);
      setSelected(null);
      router.refresh();
    }
    if (eState.error) {
      setFieldErrors(eState.fieldErrors ?? {});
      if (!eState.fieldErrors) setToast(eState.error);
      setSavePending(false);
    }
  }, [eState, router]);
  useEffect(() => {
    if (!kState.ok && !kState.error) return;
    if (kState.ok) {
      setToast(kState.ok);
      setConfirmSave(false);
      setEditMode(false);
      setSelected(null);
      router.refresh();
    }
    if (kState.error) {
      setFieldErrors(kState.fieldErrors ?? {});
      if (!kState.fieldErrors) setToast(kState.error);
      setSavePending(false);
    }
  }, [kState, router]);

  function openExpense(e: Expense) {
    setSelected({ kind: "pengeluaran", data: e });
    setEditMode(false);
    setConfirmSave(false);
    setConfirmDelete(false);
    setFieldErrors({});
    setEOrig(e);
    setEDeskripsi(e.description);
    setENominalDisplay(formatThousand(String(e.amount)));
    setEKategori(e.category);
  }
  function openMeal(m: Meal) {
    setSelected({ kind: "kalori", data: m });
    setEditMode(false);
    setConfirmSave(false);
    setConfirmDelete(false);
    setFieldErrors({});
    setKOrig(m);
    setKNama(m.name);
    setKKalori(String(m.calories));
  }
  function closeSheet() {
    setSelected(null);
    setEditMode(false);
    setConfirmSave(false);
    setConfirmDelete(false);
  }

  // compute changes for confirm
  const changes: { label: string; sebelum: string; sesudah: string }[] = [];
  let warning: string | null = null; // reassigned below
  if (selected?.kind === "pengeluaran" && editMode && eOrig) {
    const nominalBaru = Number(cleanNumber(eNominalDisplay) || "0");
    const descLower = eDeskripsi.trim().toLowerCase();
    if (eOrig.description !== descLower) changes.push({ label: "Nama", sebelum: eOrig.description, sesudah: descLower || "—" });
    if (eOrig.category !== eKategori) changes.push({ label: "Jenis", sebelum: eOrig.category, sesudah: eKategori });
    if (eOrig.amount !== nominalBaru) changes.push({ label: "Harga", sebelum: formatRupiah(eOrig.amount), sesudah: formatRupiah(nominalBaru) });
    if (isPerubahanBesar(eOrig.amount, nominalBaru)) warning = "Harganya berubah jauh. Sudah benar?";
  }
  if (selected?.kind === "kalori" && editMode && kOrig) {
    const namaLower = kNama.trim().toLowerCase();
    const kalBaru = Number(kKalori.trim() || "0");
    if (kOrig.name !== namaLower) changes.push({ label: "Nama makanan", sebelum: kOrig.name, sesudah: namaLower || "—" });
    if (kOrig.calories !== kalBaru) changes.push({ label: "Kalori", sebelum: formatKkal(kOrig.calories), sesudah: formatKkal(kalBaru) });
  }



  async function handleDelete() {
    if (!selected) return;
    setDeletePending(true);
    const fd = new FormData();
    fd.set("id", selected.data.id);
    let res: CatatanActionResult;
    if (selected.kind === "pengeluaran") res = await hapusPengeluaranAction(fd);
    else res = await hapusKaloriAction(fd);
    setDeletePending(false);
    if (res.ok) {
      setToast(res.ok);
      setConfirmDelete(false);
      setSelected(null);
      router.refresh();
    } else {
      setToast(res.error ?? "Gagal menghapus.");
      setConfirmDelete(false);
    }
  }

  function handleRequestSave() {
    setFieldErrors({});
    // basic client check
    if (selected?.kind === "pengeluaran") {
      if (!eDeskripsi.trim()) { setFieldErrors({ deskripsi: "Deskripsi wajib diisi" }); return; }
      if (eDeskripsi.trim().length > 100) { setFieldErrors({ deskripsi: "Maksimal 100 karakter" }); return; }
      const n = Number(cleanNumber(eNominalDisplay));
      if (!Number.isInteger(n) || n < 1 || n > 50_000_000) { setFieldErrors({ nominal: "Nominal 1–50.000.000" }); return; }
      if (!kategoriOptions.includes(eKategori as never)) { setFieldErrors({ kategori: "Jenis tidak valid" }); return; }
    }
    if (selected?.kind === "kalori") {
      if (!kNama.trim()) { setFieldErrors({ nama_makanan: "Nama wajib diisi" }); return; }
      if (kNama.trim().length > 100) { setFieldErrors({ nama_makanan: "Maksimal 100 karakter" }); return; }
      const k = Number(kKalori.trim());
      if (!Number.isInteger(k) || k < 0 || k > 5000) { setFieldErrors({ estimasi_kalori: "Kalori 0–5000" }); return; }
    }
    if (changes.length === 0) {
      setToast("Tidak ada perubahan.");
      return;
    }
    setConfirmSave(true);
  }
  function handleConfirmSave() {
    setSavePending(true);
    if (selected?.kind === "pengeluaran") {
      const fd = new FormData();
      fd.set("id", selected.data.id);
      fd.set("kategori", eKategori);
      fd.set("deskripsi", eDeskripsi);
      fd.set("nominal", cleanNumber(eNominalDisplay));
      startTransition(() => { eAction(fd); });
    } else if (selected?.kind === "kalori") {
      const fd = new FormData();
      fd.set("id", selected!.data.id);
      fd.set("nama_makanan", kNama);
      fd.set("estimasi_kalori", kKalori.trim());
      startTransition(() => { kAction(fd); });
    }
  }

  return (
    <>
      {toast && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <button type="button" aria-label="Tutup notifikasi" onClick={() => setToast(null)} className="absolute inset-0" />
          <div role="status" aria-live="polite" className="relative w-full max-w-sm rounded-xl border border-garis bg-struk px-6 py-5 text-center shadow-xl">
            <p className="text-sm font-medium text-tinta">{toast}</p>
            <button type="button" onClick={() => setToast(null)} className="mt-4 min-h-9 rounded-lg bg-biru-nota px-5 text-sm font-semibold text-white hover:opacity-90">Tutup</button>
          </div>
        </div>
      )}

      <div className="mt-6">
        {showExpenses ? (
          groupedExpenses.size === 0 ? (
            <p className="rounded border border-dashed border-garis bg-struk p-6 text-sm text-tinta-redup">Tidak ada catatan di rentang ini. Ubah tanggal atau hapus filter.</p>
          ) : (
            <div className="space-y-6">
              {[...groupedExpenses.entries()].map(([ymd, items]) => (
                <section key={ymd} className="rounded border border-garis bg-struk p-4">
                  <h2 className="text-sm font-semibold text-tinta">{dateLabelWIB(ymd)}</h2>
                  <ul className="mt-3 space-y-3">
                    {(items as Expense[]).map((e) => (
                      <li key={e.id}>
                        <button type="button" onClick={() => openExpense(e)} className="w-full space-y-1 rounded-lg p-2 text-left hover:bg-kertas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-biru-nota">
                          <LeaderRow label={e.description} value={formatRupiah(e.amount)} />
                          <div className="flex items-center gap-2 text-xs">
                            <span className="rounded-full border border-garis bg-kertas px-2 py-0.5 font-medium text-tinta-redup">{e.category}</span>
                            <span className="tabular-nums text-tinta-redup">{formatJamWIB(e.at)} WIB</span>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )
        ) : groupedMeals.size === 0 ? (
          <p className="rounded border border-dashed border-garis bg-struk p-6 text-sm text-tinta-redup">Tidak ada catatan di rentang ini. Ubah tanggal atau hapus filter.</p>
        ) : (
          <div className="space-y-6">
            {[...groupedMeals.entries()].map(([ymd, items]) => (
              <section key={ymd} className="rounded border border-garis bg-struk p-4">
                <h2 className="text-sm font-semibold text-tinta">{dateLabelWIB(ymd)}</h2>
                <ul className="mt-3 space-y-3">
                  {(items as Meal[]).map((m) => (
                    <li key={m.id}>
                      <button type="button" onClick={() => openMeal(m)} className="w-full space-y-1 rounded-lg p-2 text-left hover:bg-kertas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-biru-nota">
                        <LeaderRow label={m.name} value={formatKkal(m.calories)} />
                        <div className="flex items-center gap-2 text-xs">
                          <span className="rounded-full border border-garis bg-kertas px-2 py-0.5 text-tinta-redup">perkiraan</span>
                          <span className="tabular-nums text-tinta-redup">{formatJamWIB(m.at)} WIB</span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Detail modal — tengah layar */}
      {selected && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <button type="button" aria-label="Tutup" onClick={closeSheet} className="absolute inset-0 bg-black/40" />
          <div role="dialog" aria-modal="true" aria-labelledby="sheet-title" className="relative max-h-[85vh] w-full max-w-lg overflow-auto rounded-2xl border border-garis bg-struk p-5 shadow-xl">
            {!editMode ? (
              <>
                <h2 id="sheet-title" className="font-heading text-lg font-bold text-tinta">
                  {selected.kind === "pengeluaran" ? (selected.data as Expense).description : (selected.data as Meal).name}
                </h2>
                <p className="mt-1 text-sm font-medium tabular-nums text-tinta">
                  {selected.kind === "pengeluaran" ? formatRupiah((selected.data as Expense).amount) : formatKkal((selected.data as Meal).calories)}
                  {selected.kind === "kalori" && <span className="ml-2 text-xs font-normal text-tinta-redup">perkiraan</span>}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  {selected.kind === "pengeluaran" ? (
                    <span className="rounded-full border border-garis bg-kertas px-2.5 py-1 text-tinta-redup">{(selected.data as Expense).category}</span>
                  ) : null}
                  <span className="tabular-nums uppercase tracking-wide text-tinta-redup">{formatTanggalWIBFull(selected.data.at)} WIB</span>
                </div>
                <div className="mt-6 flex gap-3">
                  <Button type="button" className="min-h-12 flex-1 text-base" onClick={() => setEditMode(true)}>
                    Ubah
                  </Button>
                  <Button type="button" variant="outline" className="min-h-12 flex-1 text-base" onClick={() => setConfirmDelete(true)}>
                    Hapus
                  </Button>
                </div>
                <Button type="button" variant="ghost" className="mt-3 w-full" onClick={closeSheet}>
                  Tutup
                </Button>
              </>
            ) : selected.kind === "pengeluaran" ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRequestSave();
                }}
              >
                <h2 id="sheet-title" className="font-heading text-lg font-bold text-tinta">Ubah pengeluaran</h2>
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-deskripsi">Nama barang</Label>
                    <Input id="edit-deskripsi" value={eDeskripsi} onChange={(ev) => setEDeskripsi(ev.target.value)} maxLength={100} placeholder="kopi susu" className="min-h-11 text-base" />
                    {fieldErrors.deskripsi && <p className="text-sm text-stempel">{fieldErrors.deskripsi}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-nominal">Harga</Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-tinta-redup">Rp</span>
                      <Input id="edit-nominal" inputMode="numeric" value={eNominalDisplay} onChange={(ev) => setENominalDisplay(formatThousand(ev.target.value))} placeholder="18.000" className="min-h-11 pl-8 text-base tabular-nums" />
                    </div>
                    {fieldErrors.nominal && <p className="text-sm text-stempel">{fieldErrors.nominal}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Jenis</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {kategoriOptions.map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setEKategori(k)}
                          className={
                            eKategori === k
                              ? "min-h-11 rounded-lg border-2 border-biru-nota bg-biru-nota/10 px-3 py-2 text-sm font-semibold capitalize text-biru-nota"
                              : "min-h-11 rounded-lg border border-garis bg-white px-3 py-2 text-sm capitalize text-tinta hover:bg-kertas"
                          }
                        >
                          {k}
                        </button>
                      ))}
                    </div>
                    {fieldErrors.kategori && <p className="text-sm text-stempel">{fieldErrors.kategori}</p>}
                  </div>
                </div>
                {eState.error && !fieldErrors.deskripsi && !fieldErrors.nominal && !fieldErrors.kategori && (
                  <p role="alert" className="mt-3 rounded border border-stempel/30 bg-stempel/10 px-3 py-2 text-sm text-stempel">{eState.error}</p>
                )}
                <div className="mt-6 flex gap-3">
                  <Button type="submit" className="min-h-11 flex-1" disabled={eIsPending || savePending}>
                    {eIsPending || savePending ? "Menyimpan…" : "Simpan"}
                  </Button>
                  <Button type="button" variant="outline" className="min-h-11 flex-1" onClick={() => setEditMode(false)}>
                    Batal
                  </Button>
                </div>
              </form>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRequestSave();
                }}
              >
                <h2 id="sheet-title" className="font-heading text-lg font-bold text-tinta">Ubah kalori</h2>
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-nama">Nama makanan</Label>
                    <Input id="edit-nama" value={kNama} onChange={(ev) => setKNama(ev.target.value)} maxLength={100} placeholder="nasi goreng" className="min-h-11 text-base" />
                    {fieldErrors.nama_makanan && <p className="text-sm text-stempel">{fieldErrors.nama_makanan}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-kkal">Perkiraan kalori</Label>
                    <Input id="edit-kkal" inputMode="numeric" value={kKalori} onChange={(ev) => setKKalori(ev.target.value.replace(/\D/g, ""))} placeholder="500" className="min-h-11 text-base tabular-nums" />
                    <p className="text-xs text-tinta-redup">0 – 5000 kkal. Ditampilkan sebagai perkiraan.</p>
                    {fieldErrors.estimasi_kalori && <p className="text-sm text-stempel">{fieldErrors.estimasi_kalori}</p>}
                  </div>
                </div>
                {kState.error && !fieldErrors.nama_makanan && !fieldErrors.estimasi_kalori && (
                  <p role="alert" className="mt-3 rounded border border-stempel/30 bg-stempel/10 px-3 py-2 text-sm text-stempel">{kState.error}</p>
                )}
                <div className="mt-6 flex gap-3">
                  <Button type="submit" className="min-h-11 flex-1" disabled={kIsPending || savePending}>
                    {kIsPending || savePending ? "Menyimpan…" : "Simpan"}
                  </Button>
                  <Button type="button" variant="outline" className="min-h-11 flex-1" onClick={() => setEditMode(false)}>
                    Batal
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmSave}
        title="Simpan perubahan?"
        changes={changes}
        akibat="Perubahan akan langsung terlihat di Beranda dan Riwayat."
        confirmLabel="Ya, simpan"
        pending={savePending || eIsPending || kIsPending}
        onConfirm={handleConfirmSave}
        onCancel={() => { setConfirmSave(false); setSavePending(false); }}
        warning={warning}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="Hapus catatan ini?"
        changes={
          selected
            ? selected.kind === "pengeluaran"
              ? [{ label: "Catatan", sebelum: `${(selected.data as Expense).description} — ${formatRupiah((selected.data as Expense).amount)}`, sesudah: "dihapus" }]
              : [{ label: "Catatan", sebelum: `${(selected.data as Meal).name} — ${formatKkal((selected.data as Meal).calories)}`, sesudah: "dihapus" }]
            : []
        }
        akibat="Catatan yang dihapus tidak akan tampil lagi."
        confirmLabel="Ya, hapus"
        confirmVariant="destructive"
        pending={deletePending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
