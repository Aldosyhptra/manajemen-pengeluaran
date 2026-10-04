"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const data = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
      if (!res.ok) { const msg = (data as unknown as { error?: { message?: string } })?.error?.message; setError(msg ?? "Password salah. Coba lagi."); return; }
      router.push(next); router.refresh();
    } catch { setError("Tidak bisa menghubungi server. Periksa koneksi, lalu coba lagi."); } finally { setPending(false); }
  }
  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded border border-garis bg-struk p-4 sm:p-5">
      <div className="space-y-2"><Label htmlFor="password" className="text-tinta">Password</Label><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" required aria-invalid={!!error} /></div>
      {error && <p role="alert" className="rounded border border-stempel/30 bg-stempel/10 px-3 py-2 text-sm text-stempel">{error}</p>}
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Memeriksa…" : "Masuk"}</Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-sm flex-col justify-center px-4">
      <h1 className="font-heading text-2xl font-bold text-tinta">Masuk</h1>
      <p className="mt-2 text-sm text-tinta-redup">Masukkan password untuk melanjutkan.</p>
      <Suspense fallback={<div className="mt-6 rounded border border-garis bg-struk p-4 text-sm text-tinta-redup">Memuat…</div>}><LoginForm /></Suspense>
    </main>
  );
}
