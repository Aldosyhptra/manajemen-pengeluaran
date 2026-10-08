"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { simpanPengaturan, type PengaturanState } from "@/app/(app)/pengaturan/actions";

type Props = {
  initialCalorie: number;
  initialBudget: number;
  panggilan: string;
};

const initialState: PengaturanState = {};

function formatThousand(v: string): string {
  const digits = v.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("id-ID");
}

export function PengaturanForm({ initialCalorie, initialBudget, panggilan: initialPanggilan }: Props) {
  const [state, formAction, isPending] = useActionState(simpanPengaturan, initialState);
  const [calorieDisplay, setCalorieDisplay] = useState(() => formatThousand(String(initialCalorie)));
  const [budgetDisplay, setBudgetDisplay] = useState(() => formatThousand(String(initialBudget)));
  const [panggilan, setPanggilan] = useState(initialPanggilan);
  const [panggilanMsg, setPanggilanMsg] = useState<string | null>(null);
  const [panggilanErr, setPanggilanErr] = useState<string | null>(null);
  const [panggilanPending, setPanggilanPending] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const router = useRouter();

  async function onPanggilan(e: React.FormEvent) {
    e.preventDefault();
    setPanggilanErr(null); setPanggilanMsg(null);
    setPanggilanPending(true);
    try {
      const res = await fetch("/api/panggilan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ panggilan }) });
      const data = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
      if (!res.ok) { setPanggilanErr(data?.error?.message ?? "Gagal menyimpan panggilan."); return; }
      setPanggilanMsg("Panggilan tersimpan.");
      router.refresh();
    } catch { setPanggilanErr("Tidak bisa menghubungi server."); }
    finally { setPanggilanPending(false); }
  }

  async function onLogout() {
    setLogoutPending(true);
    try { await fetch("/api/logout", { method: "POST" }); } finally { router.push("/login"); router.refresh(); }
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Target harian */}
      <form action={formAction} className="rounded border border-garis bg-struk p-4 sm:p-5">
        <h2 className="font-heading text-base font-bold text-tinta">Target harian</h2>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="calorieTarget" className="text-tinta">Target kalori harian</Label>
            <Input id="calorieTarget" name="calorieTarget" type="text" inputMode="numeric" value={calorieDisplay} onChange={(e) => setCalorieDisplay(formatThousand(e.target.value))} placeholder="2.000" aria-invalid={!!state.fieldErrors?.calorieTarget} aria-describedby={state.fieldErrors?.calorieTarget ? "err-calorie" : undefined} className="tabular-nums" required />
            <p className="text-xs text-tinta-redup">500 – 10.000 kkal</p>
            {state.fieldErrors?.calorieTarget && <p id="err-calorie" className="text-sm text-stempel">{state.fieldErrors.calorieTarget}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="budgetTarget" className="text-tinta">Budget harian</Label>
            <Input id="budgetTarget" name="budgetTarget" type="text" inputMode="numeric" value={budgetDisplay} onChange={(e) => setBudgetDisplay(formatThousand(e.target.value))} placeholder="150.000" aria-invalid={!!state.fieldErrors?.budgetTarget} aria-describedby={state.fieldErrors?.budgetTarget ? "err-budget" : undefined} className="tabular-nums" required />
            <p className="text-xs text-tinta-redup">1 – 50.000.000 (rupiah)</p>
            {state.fieldErrors?.budgetTarget && <p id="err-budget" className="text-sm text-stempel">{state.fieldErrors.budgetTarget}</p>}
          </div>
        </div>
        {state.error && <p role="alert" className="mt-4 rounded border border-stempel/30 bg-stempel/10 px-3 py-2 text-sm text-stempel">{state.error}</p>}
        {state.ok && <p role="status" className="mt-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.ok}</p>}
        <Button type="submit" disabled={isPending} className="mt-4 w-full sm:w-auto">{isPending ? "Menyimpan…" : "Simpan target"}</Button>
      </form>

      {/* Panggilan */}
      <form onSubmit={onPanggilan} className="rounded border border-garis bg-struk p-4 sm:p-5">
        <h2 className="font-heading text-base font-bold text-tinta">Panggilan</h2>
        <p className="mt-1 text-sm text-tinta-redup">Nama panggilan dipakai asisten n8n (1–20 huruf, boleh spasi).</p>
        <div className="mt-3 space-y-2">
          <Label htmlFor="panggilan" className="text-tinta">Panggilan</Label>
          <Input id="panggilan" value={panggilan} onChange={(e) => setPanggilan(e.target.value)} placeholder="Ibu" required maxLength={20} />
        </div>
        {panggilanErr && <p role="alert" className="mt-3 rounded border border-stempel/30 bg-stempel/10 px-3 py-2 text-sm text-stempel">{panggilanErr}</p>}
        {panggilanMsg && <p role="status" className="mt-3 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{panggilanMsg}</p>}
        <Button type="submit" disabled={panggilanPending} className="mt-3 w-full sm:w-auto">{panggilanPending ? "Menyimpan…" : "Simpan panggilan"}</Button>
      </form>

      {/* Ganti password & Keluar */}
      <div className="rounded border border-garis bg-struk p-4 sm:p-5">
        <h2 className="font-heading text-base font-bold text-tinta">Akun</h2>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link href="/ganti-password" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-biru-nota px-4 text-sm font-semibold text-white hover:opacity-90">Ganti password</Link>
          <Button type="button" variant="outline" onClick={onLogout} disabled={logoutPending} className="min-h-11">{logoutPending ? "Keluar…" : "Keluar"}</Button>
        </div>
      </div>
    </div>
  );
}
