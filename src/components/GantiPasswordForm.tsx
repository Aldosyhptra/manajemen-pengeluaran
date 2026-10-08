"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function GantiPasswordForm({ wajib }: { wajib: boolean }) {
  const router = useRouter();
  const [lama, setLama] = useState("");
  const [baru, setBaru] = useState("");
  const [showLama, setShowLama] = useState(false);
  const [showBaru, setShowBaru] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setOk(null);
    if (baru.length < 10) { setError("Password baru minimal 10 karakter."); return; }
    setPending(true);
    try {
      const res = await fetch("/api/ganti-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passwordLama: lama, passwordBaru: baru }),
      });
      const data = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
      if (!res.ok) { setError(data?.error?.message ?? "Gagal mengganti password."); return; }
      setOk("Password berhasil diganti.");
      setLama(""); setBaru("");
      router.refresh();
      // kalau wajib, redirect ke beranda setelah sukses
      if (wajib) { setTimeout(() => router.push("/"), 800); }
    } catch {
      setError("Tidak bisa menghubungi server. Periksa koneksi, lalu coba lagi.");
    } finally { setPending(false); }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded border border-garis bg-struk p-4 sm:p-5">
      <div className="space-y-2">
        <Label htmlFor="lama" className="text-tinta">Password lama</Label>
        <div className="relative">
          <Input id="lama" type={showLama ? "text" : "password"} value={lama} onChange={(e) => setLama(e.target.value)} placeholder="••••••••" autoComplete="current-password" required className="pr-11" />
          <button type="button" onClick={() => setShowLama((v) => !v)} aria-label={showLama ? "Sembunyikan" : "Tampilkan"} className="absolute inset-y-0 right-0 flex min-h-11 min-w-11 items-center justify-center text-tinta-redup hover:text-tinta">{showLama ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="baru" className="text-tinta">Password baru (min 10)</Label>
        <div className="relative">
          <Input id="baru" type={showBaru ? "text" : "password"} value={baru} onChange={(e) => setBaru(e.target.value)} placeholder="••••••••" autoComplete="new-password" required className="pr-11" />
          <button type="button" onClick={() => setShowBaru((v) => !v)} aria-label={showBaru ? "Sembunyikan" : "Tampilkan"} className="absolute inset-y-0 right-0 flex min-h-11 min-w-11 items-center justify-center text-tinta-redup hover:text-tinta">{showBaru ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
        </div>
      </div>
      {error && <p role="alert" className="rounded border border-stempel/30 bg-stempel/10 px-3 py-2 text-sm text-stempel">{error}</p>}
      {ok && <p role="status" className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{ok}</p>}
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Menyimpan…" : "Simpan password"}</Button>
    </form>
  );
}
